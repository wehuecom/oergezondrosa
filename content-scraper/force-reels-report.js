#!/usr/bin/env node
/**
 * Forceer een Viral Reels Report — skipt de dagelijkse check.
 * Run: node force-reels-report.js
 */

"use strict";

const fs = require("fs");
const path = require("path");
const https = require("https");
const cfg = require("./config.js");
const { COMPETITORS, HASHTAGS } = require("./accounts.js");
const { generateViralReelsReport } = require("./viral-reels-report.js");

const IG_SESSION_ID = decodeURIComponent(cfg.IG_SESSION_ID);
const SEEN_REELS_FILE = path.join(__dirname, ".seen-reels.json");

function log(msg) {
  console.log(`[${new Date().toLocaleTimeString("nl-NL")}] ${msg}`);
}
function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function igRequest(method, reqPath, params = {}, bodyStr = null) {
  const qs = Object.keys(params).length
    ? "?" + Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")
    : "";
  const bodyBuf = bodyStr ? Buffer.from(bodyStr) : null;
  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "Instagram 269.0.0.18.75 Android (26/8.0.0; 480dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; nl_NL; 314665256)",
      Cookie: `sessionid=${IG_SESSION_ID}`,
      "X-IG-App-ID": "936619743392459",
      Accept: "*/*",
      "Accept-Language": "nl-NL",
    };
    if (bodyBuf) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      headers["Content-Length"] = bodyBuf.length;
    }
    const req = https.request(
      { hostname: "i.instagram.com", path: `/api/v1${reqPath}${qs}`, method, headers },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on("error", reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

function mapIgPost(item, username) {
  const isVideo = item.media_type === 2;
  return {
    ownerUsername: item.user?.username || username,
    type: isVideo ? "video" : item.media_type === 8 ? "carousel" : "image",
    caption: item.caption?.text || "",
    likesCount: item.like_count || 0,
    commentsCount: item.comment_count || 0,
    videoViewCount: item.play_count || item.view_count || 0,
    shortCode: item.code || String(item.pk || ""),
    timestamp: item.taken_at || 0,
  };
}

async function scrapeAccount(username) {
  try {
    const profRes = await igRequest("GET", "/users/web_profile_info/", { username });
    if (profRes.status !== 200) { log(`  @${username}: ${profRes.status} — skip`); return []; }
    const userId = profRes.body?.data?.user?.id;
    if (!userId) { log(`  @${username}: geen user ID`); return []; }
    await sleep(3000);
    const feedRes = await igRequest("GET", `/feed/user/${userId}/`, { count: "5" });
    if (feedRes.status !== 200) { log(`  @${username}: feed ${feedRes.status}`); return []; }
    const items = feedRes.body?.items || [];
    log(`  @${username}: ${items.length} posts`);
    return items.map((it) => mapIgPost(it, username));
  } catch (e) { log(`  @${username} fout: ${e.message}`); return []; }
}

async function scrapeHashtag(tag) {
  try {
    const res = await igRequest("POST", `/tags/${tag}/sections/`, `tab=top&page=1&surface=explore`);
    if (res.status !== 200) { log(`  #${tag}: ${res.status} — skip`); return []; }
    const sections = res.body?.sections || [];
    const items = sections.flatMap((s) => s.layout_content?.medias?.map((m) => m.media) || []);
    log(`  #${tag}: ${items.length} posts`);
    return items.slice(0, 8).map((it) => mapIgPost(it, it.user?.username || tag));
  } catch (e) { log(`  #${tag} fout: ${e.message}`); return []; }
}

function filterReels(posts, limit) {
  const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
  return posts
    .filter((p) => p.type === "video" && p.shortCode && (!p.timestamp || p.timestamp >= thirtyDaysAgo))
    .map((p) => ({
      account: p.ownerUsername,
      caption: (p.caption || "").slice(0, 300),
      likes: p.likesCount || 0,
      comments: p.commentsCount || 0,
      views: p.videoViewCount || 0,
      url: `https://www.instagram.com/reel/${p.shortCode}/`,
      shortCode: p.shortCode,
      timestamp: p.timestamp || 0,
    }))
    .sort((a, b) => (b.views || b.likes * 10) - (a.views || a.likes * 10))
    .slice(0, limit);
}

function loadSeenReels() {
  try { return JSON.parse(fs.readFileSync(SEEN_REELS_FILE, "utf8")); } catch { return []; }
}
function saveSeenReels(codes) {
  fs.writeFileSync(SEEN_REELS_FILE, JSON.stringify([...new Set(codes)].slice(-200), null, 2), "utf8");
}

async function main() {
  log("=== FORCE: Viral Reels Report ===");

  // Scrape
  log("Scrapen...");
  const allPosts = [];
  for (const username of COMPETITORS) {
    allPosts.push(...await scrapeAccount(username));
    await sleep(3000);
  }
  for (const tag of HASHTAGS) {
    allPosts.push(...await scrapeHashtag(tag));
    await sleep(3000);
  }
  log(`${allPosts.length} posts verzameld`);

  // Filter
  const seenReels = loadSeenReels();
  const reels = filterReels(allPosts, 20)
    .filter((r) => !seenReels.includes(r.shortCode))
    .slice(0, 8);

  if (reels.length < 3) {
    log(`Te weinig nieuwe reels (${reels.length}) — stop`);
    process.exit(0);
  }

  log(`${reels.length} nieuwe reels — PDF genereren...`);
  const pdf = await generateViralReelsReport(reels, cfg, { sendToTelegram: true });

  if (pdf) {
    log("Viral Reels Report verstuurd!");
    saveSeenReels([...seenReels, ...reels.map((r) => r.shortCode)]);
  } else {
    log("Geen relevante reels na filtering — geen PDF");
  }
}

main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
