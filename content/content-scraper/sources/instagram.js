"use strict";

const https = require("https");
const cfg = require("../config.js");
const { COMPETITORS, HASHTAGS } = require("../accounts.js");
const { log } = require("../lib/logger.js");

const SESSION_ID = decodeURIComponent(cfg.IG_SESSION_ID);
const POSTS_PER_ACCOUNT = 3;
const POSTS_PER_HASHTAG = 5;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function igRequest(method, path, params = {}, bodyStr = null) {
  const qs = Object.keys(params).length
    ? "?" + Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")
    : "";
  const bodyBuf = bodyStr ? Buffer.from(bodyStr) : null;

  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "Instagram 269.0.0.18.75 Android (26/8.0.0; 480dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; nl_NL; 314665256)",
      Cookie: `sessionid=${SESSION_ID}`,
      "X-IG-App-ID": "936619743392459",
      Accept: "*/*",
      "Accept-Language": "nl-NL",
    };
    if (bodyBuf) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      headers["Content-Length"] = bodyBuf.length;
    }

    const req = https.request(
      { hostname: "i.instagram.com", path: `/api/v1${path}${qs}`, method, headers },
      (res) => {
        let data = "";
        res.on("data", c => data += c);
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

function mapPost(item, username) {
  const isVideo = item.media_type === 2;
  return {
    source: "instagram",
    title: (item.caption?.text || "").slice(0, 300),
    body: item.caption?.text || "",
    author: `@${item.user?.username || username}`,
    url: item.code ? `https://www.instagram.com/p/${item.code}/` : "",
    engagement: {
      likes: item.like_count || 0,
      comments: item.comment_count || 0,
      views: item.play_count || item.view_count || 0,
      shares: 0,
    },
    type: isVideo ? "video" : item.media_type === 8 ? "carousel" : "image",
    timestamp: new Date().toISOString(),
  };
}

async function scrapeAccount(username) {
  try {
    const profRes = await igRequest("GET", "/users/web_profile_info/", { username });
    if (profRes.status !== 200) {
      log(`  [IG] @${username}: profiel ${profRes.status} — overgeslagen`);
      return [];
    }
    const userId = profRes.body?.data?.user?.id;
    if (!userId) { log(`  [IG] @${username}: geen user ID`); return []; }

    await sleep(3000);
    const feedRes = await igRequest("GET", `/feed/user/${userId}/`, { count: String(POSTS_PER_ACCOUNT) });
    if (feedRes.status !== 200) {
      log(`  [IG] @${username}: feed ${feedRes.status}`);
      return [];
    }
    const items = feedRes.body?.items || [];
    log(`  [IG] @${username}: ${items.length} posts`);
    return items.map(it => mapPost(it, username));
  } catch (e) {
    log(`  [IG] @${username} fout: ${e.message}`);
    return [];
  }
}

async function scrapeHashtag(tag) {
  try {
    const res = await igRequest("POST", `/tags/${tag}/sections/`, null, `tab=top&page=1&surface=explore`);
    if (res.status !== 200) {
      log(`  [IG] #${tag}: ${res.status} — overgeslagen`);
      return [];
    }
    const sections = res.body?.sections || [];
    const items = sections.flatMap(s => s.layout_content?.medias?.map(m => m.media) || []);
    log(`  [IG] #${tag}: ${items.length} posts`);
    return items.slice(0, POSTS_PER_HASHTAG).map(it => mapPost(it, it.user?.username || tag));
  } catch (e) {
    log(`  [IG] #${tag} fout: ${e.message}`);
    return [];
  }
}

async function scrape() {
  log(`Instagram: ${COMPETITORS.length} accounts + ${HASHTAGS.length} hashtags...`);
  const all = [];

  for (const username of COMPETITORS) {
    const posts = await scrapeAccount(username);
    all.push(...posts);
    await sleep(3000);
  }

  for (const tag of HASHTAGS) {
    const posts = await scrapeHashtag(tag);
    all.push(...posts);
    await sleep(3000);
  }

  log(`Instagram: ${all.length} posts opgehaald`);
  return all;
}

module.exports = { scrape };
