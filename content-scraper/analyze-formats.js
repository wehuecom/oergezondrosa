#!/usr/bin/env node
/**
 * Instagram Format Analysis Script
 * Scrapes 12 posts per competitor, analyzes format performance
 * Sends summary report to Telegram
 */

"use strict";

const https = require("https");
const cfg = require("./config.js");
const { COMPETITORS } = require("./accounts.js");

const TELEGRAM_TOKEN = "8640244732:AAGqtmb4MITZBv9vVcY03GJeO6iWLkY3OXc";
const TELEGRAM_CHAT_ID = "-5279920497";
const IG_SESSION_ID = decodeURIComponent(cfg.IG_SESSION_ID);

const POSTS_PER_ACCOUNT = 12;

// ============================================================
// HELPERS
// ============================================================

function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on("error", reject);
    if (body) req.write(Buffer.isBuffer(body) ? body : (typeof body === "string" ? body : JSON.stringify(body)));
    req.end();
  });
}

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

function log(msg) {
  const time = new Date().toLocaleTimeString("nl-NL");
  console.log(`[${time}] ${msg}`);
}

// ============================================================
// INSTAGRAM PRIVATE API
// ============================================================

function igRequest(method, path, params = {}, bodyStr = null) {
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
      { hostname: "i.instagram.com", path: `/api/v1${path}${qs}`, method, headers },
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

// ============================================================
// SCRAPE ACCOUNT — 12 posts with follower count
// ============================================================

async function scrapeAccount(username) {
  try {
    const profRes = await igRequest("GET", "/users/web_profile_info/", { username });
    if (profRes.status !== 200) {
      log(`  @${username}: profiel ${profRes.status} — overgeslagen`);
      return { posts: [], followers: 0 };
    }
    const user = profRes.body?.data?.user;
    const userId = user?.id;
    const followers = user?.edge_followed_by?.count || user?.follower_count || 0;
    if (!userId) { log(`  @${username}: geen user ID`); return { posts: [], followers: 0 }; }

    await sleep(3000);
    const feedRes = await igRequest("GET", `/feed/user/${userId}/`, { count: String(POSTS_PER_ACCOUNT) });
    if (feedRes.status !== 200) {
      log(`  @${username}: feed ${feedRes.status}`);
      return { posts: [], followers };
    }
    const items = feedRes.body?.items || [];
    log(`  @${username}: ${items.length} posts, ${followers} followers`);

    const posts = items.map((item) => {
      const type = item.media_type === 2 ? "video" : item.media_type === 8 ? "carousel" : "image";
      const caption = item.caption?.text || "";
      const likes = item.like_count || 0;
      const comments = item.comment_count || 0;
      const views = item.play_count || item.view_count || 0;
      const carouselCount = type === "carousel" ? (item.carousel_media_count || (item.carousel_media || []).length || 0) : 0;
      const hasHashtags = /#\w+/.test(caption);
      const captionLength = caption.length;
      const timestamp = item.taken_at || 0;
      const shortCode = item.code || "";
      const engagementRate = followers > 0 ? ((likes + comments) / followers) * 100 : 0;

      return {
        username,
        type,
        likes,
        comments,
        views,
        engagement: likes + comments,
        engagementRate: Math.round(engagementRate * 100) / 100,
        captionLength,
        hasHashtags,
        carouselCount,
        shortCode,
        caption: caption.slice(0, 200),
        timestamp,
        followers,
      };
    });

    return { posts, followers };
  } catch (e) {
    log(`  @${username} fout: ${e.message}`);
    return { posts: [], followers: 0 };
  }
}

// ============================================================
// ANALYSIS FUNCTIONS
// ============================================================

function analyzeByFormat(allPosts) {
  const formats = {};
  for (const p of allPosts) {
    if (!formats[p.type]) formats[p.type] = { posts: [], totalLikes: 0, totalComments: 0, totalEngRate: 0 };
    formats[p.type].posts.push(p);
    formats[p.type].totalLikes += p.likes;
    formats[p.type].totalComments += p.comments;
    formats[p.type].totalEngRate += p.engagementRate;
  }

  const result = {};
  for (const [type, data] of Object.entries(formats)) {
    const count = data.posts.length;
    result[type] = {
      count,
      avgLikes: Math.round(data.totalLikes / count),
      avgComments: Math.round(data.totalComments / count),
      avgEngagementRate: Math.round((data.totalEngRate / count) * 100) / 100,
      totalEngagement: data.totalLikes + data.totalComments,
    };
  }
  return result;
}

function topNonVideoPosts(allPosts, limit = 10) {
  return allPosts
    .filter((p) => p.type !== "video")
    .sort((a, b) => b.engagementRate - a.engagementRate)
    .slice(0, limit);
}

function captionLengthCorrelation(allPosts) {
  const buckets = {
    "kort (0-100)": { posts: [], totalRate: 0 },
    "middel (101-500)": { posts: [], totalRate: 0 },
    "lang (501-1000)": { posts: [], totalRate: 0 },
    "zeer lang (1000+)": { posts: [], totalRate: 0 },
  };

  for (const p of allPosts) {
    let bucket;
    if (p.captionLength <= 100) bucket = "kort (0-100)";
    else if (p.captionLength <= 500) bucket = "middel (101-500)";
    else if (p.captionLength <= 1000) bucket = "lang (501-1000)";
    else bucket = "zeer lang (1000+)";

    buckets[bucket].posts.push(p);
    buckets[bucket].totalRate += p.engagementRate;
  }

  const result = {};
  for (const [name, data] of Object.entries(buckets)) {
    const count = data.posts.length;
    result[name] = {
      count,
      avgEngagementRate: count > 0 ? Math.round((data.totalRate / count) * 100) / 100 : 0,
    };
  }
  return result;
}

function carouselSlideAnalysis(allPosts) {
  const carousels = allPosts.filter((p) => p.type === "carousel" && p.carouselCount > 0);
  const bySlideCount = {};
  for (const p of carousels) {
    const key = `${p.carouselCount} slides`;
    if (!bySlideCount[key]) bySlideCount[key] = { count: 0, totalRate: 0, totalLikes: 0 };
    bySlideCount[key].count++;
    bySlideCount[key].totalRate += p.engagementRate;
    bySlideCount[key].totalLikes += p.likes;
  }

  const result = {};
  for (const [key, data] of Object.entries(bySlideCount)) {
    result[key] = {
      count: data.count,
      avgEngagementRate: Math.round((data.totalRate / data.count) * 100) / 100,
      avgLikes: Math.round(data.totalLikes / data.count),
    };
  }
  return result;
}

function hashtagAnalysis(allPosts) {
  const with_ = allPosts.filter((p) => p.hasHashtags);
  const without = allPosts.filter((p) => !p.hasHashtags);

  return {
    withHashtags: {
      count: with_.length,
      avgEngagementRate: with_.length > 0 ? Math.round((with_.reduce((s, p) => s + p.engagementRate, 0) / with_.length) * 100) / 100 : 0,
    },
    withoutHashtags: {
      count: without.length,
      avgEngagementRate: without.length > 0 ? Math.round((without.reduce((s, p) => s + p.engagementRate, 0) / without.length) * 100) / 100 : 0,
    },
  };
}

function accountBreakdown(allPosts) {
  const byAccount = {};
  for (const p of allPosts) {
    if (!byAccount[p.username]) byAccount[p.username] = { posts: 0, types: {}, totalEngRate: 0, followers: p.followers };
    byAccount[p.username].posts++;
    byAccount[p.username].types[p.type] = (byAccount[p.username].types[p.type] || 0) + 1;
    byAccount[p.username].totalEngRate += p.engagementRate;
  }

  return Object.entries(byAccount).map(([name, data]) => ({
    account: name,
    posts: data.posts,
    followers: data.followers,
    avgEngRate: Math.round((data.totalEngRate / data.posts) * 100) / 100,
    formats: data.types,
    dominantFormat: Object.entries(data.types).sort((a, b) => b[1] - a[1])[0]?.[0] || "?",
  })).sort((a, b) => b.avgEngRate - a.avgEngRate);
}

// ============================================================
// TELEGRAM
// ============================================================

async function sendTelegram(text) {
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, 4000));
    remaining = remaining.slice(4000);
  }

  for (const chunk of chunks) {
    const body = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: chunk,
      parse_mode: "Markdown",
    });

    const res = await httpsRequest(
      {
        hostname: "api.telegram.org",
        path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      body
    );
    if (res.status !== 200) log(`Telegram send failed: ${res.status} ${JSON.stringify(res.body)}`);
    await sleep(500);
  }
}

// ============================================================
// BUILD REPORT
// ============================================================

function buildReport(allPosts, formatStats, topNonVideo, captionCorr, carouselSlides, hashtagStats, accountStats) {
  const lines = [];
  const date = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  lines.push(`*Instagram Format Analyse*`);
  lines.push(`${date}`);
  lines.push(`${allPosts.length} posts van ${COMPETITORS.length} accounts\n`);

  // Format performance
  lines.push(`*--- FORMAT PERFORMANCE ---*`);
  for (const [type, stats] of Object.entries(formatStats)) {
    lines.push(`*${type.toUpperCase()}* (${stats.count}x)`);
    lines.push(`  Gem. likes: ${stats.avgLikes}`);
    lines.push(`  Gem. comments: ${stats.avgComments}`);
    lines.push(`  Gem. engagement rate: ${stats.avgEngagementRate}%`);
  }

  // Winner
  const sorted = Object.entries(formatStats).sort((a, b) => b[1].avgEngagementRate - a[1].avgEngagementRate);
  if (sorted.length > 0) {
    lines.push(`\n*Winnaar:* ${sorted[0][0].toUpperCase()} met ${sorted[0][1].avgEngagementRate}% gem. engagement rate`);
  }

  // Top 10 non-video
  lines.push(`\n*--- TOP 10 NON-VIDEO POSTS ---*`);
  for (let i = 0; i < topNonVideo.length; i++) {
    const p = topNonVideo[i];
    lines.push(`${i + 1}. @${p.username} [${p.type}${p.carouselCount ? ` ${p.carouselCount}x` : ""}]`);
    lines.push(`   ${p.engagementRate}% ER | ${p.likes} likes | ${p.comments} comments`);
    lines.push(`   ${p.caption.slice(0, 80)}${p.caption.length > 80 ? "..." : ""}`);
    if (p.shortCode) lines.push(`   instagram.com/p/${p.shortCode}/`);
  }

  // Caption length
  lines.push(`\n*--- CAPTION LENGTE vs ENGAGEMENT ---*`);
  for (const [bucket, stats] of Object.entries(captionCorr)) {
    lines.push(`${bucket}: ${stats.avgEngagementRate}% ER (${stats.count} posts)`);
  }

  // Carousel slides
  if (Object.keys(carouselSlides).length > 0) {
    lines.push(`\n*--- CAROUSEL SLIDES SWEET SPOT ---*`);
    const sortedSlides = Object.entries(carouselSlides).sort((a, b) => b[1].avgEngagementRate - a[1].avgEngagementRate);
    for (const [key, stats] of sortedSlides) {
      lines.push(`${key}: ${stats.avgEngagementRate}% ER (${stats.count}x, gem. ${stats.avgLikes} likes)`);
    }
    if (sortedSlides.length > 0) {
      lines.push(`*Sweet spot:* ${sortedSlides[0][0]}`);
    }
  }

  // Hashtags
  lines.push(`\n*--- HASHTAGS ---*`);
  lines.push(`Met hashtags: ${hashtagStats.withHashtags.avgEngagementRate}% ER (${hashtagStats.withHashtags.count} posts)`);
  lines.push(`Zonder hashtags: ${hashtagStats.withoutHashtags.avgEngagementRate}% ER (${hashtagStats.withoutHashtags.count} posts)`);

  // Account breakdown
  lines.push(`\n*--- ACCOUNT RANKING ---*`);
  for (const a of accountStats) {
    const fmts = Object.entries(a.formats).map(([t, c]) => `${t}:${c}`).join(" ");
    lines.push(`@${a.account} — ${a.avgEngRate}% ER | ${a.followers} flw | ${fmts}`);
  }

  // Key takeaways
  lines.push(`\n*--- KEY TAKEAWAYS ---*`);

  // Best non-video format
  const nonVideoFormats = Object.entries(formatStats).filter(([t]) => t !== "video");
  if (nonVideoFormats.length > 0) {
    const bestNV = nonVideoFormats.sort((a, b) => b[1].avgEngagementRate - a[1].avgEngagementRate)[0];
    lines.push(`1. Beste non-video format: *${bestNV[0]}* (${bestNV[1].avgEngagementRate}% ER)`);
  }

  // Best caption length
  const bestCaption = Object.entries(captionCorr).filter(([, s]) => s.count >= 2).sort((a, b) => b[1].avgEngagementRate - a[1].avgEngagementRate)[0];
  if (bestCaption) {
    lines.push(`2. Beste caption lengte: *${bestCaption[0]}* (${bestCaption[1].avgEngagementRate}% ER)`);
  }

  // Hashtag verdict
  const htVerdict = hashtagStats.withHashtags.avgEngagementRate > hashtagStats.withoutHashtags.avgEngagementRate ? "helpen" : "helpen niet";
  lines.push(`3. Hashtags ${htVerdict} (${hashtagStats.withHashtags.avgEngagementRate}% vs ${hashtagStats.withoutHashtags.avgEngagementRate}%)`);

  return lines.join("\n");
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  log("=== Instagram Format Analyse gestart ===");

  const allPosts = [];

  for (const username of COMPETITORS) {
    log(`Scraping @${username}...`);
    const { posts } = await scrapeAccount(username);
    allPosts.push(...posts);
    await sleep(3000);
  }

  log(`Totaal: ${allPosts.length} posts verzameld`);

  if (allPosts.length === 0) {
    log("Geen posts — stop.");
    await sendTelegram("Format analyse mislukt: geen posts opgehaald. Check IG session ID.");
    return;
  }

  // Run analyses
  const formatStats = analyzeByFormat(allPosts);
  const topNonVideo = topNonVideoPosts(allPosts, 10);
  const captionCorr = captionLengthCorrelation(allPosts);
  const carouselSlides = carouselSlideAnalysis(allPosts);
  const hashtagStats = hashtagAnalysis(allPosts);
  const accountStats = accountBreakdown(allPosts);

  // Print to console
  log("\n=== FORMAT STATS ===");
  console.log(JSON.stringify(formatStats, null, 2));
  log("\n=== TOP NON-VIDEO ===");
  for (const p of topNonVideo) {
    console.log(`  @${p.username} [${p.type}] ${p.engagementRate}% ER, ${p.likes} likes`);
  }
  log("\n=== CAPTION CORRELATION ===");
  console.log(JSON.stringify(captionCorr, null, 2));
  log("\n=== CAROUSEL SLIDES ===");
  console.log(JSON.stringify(carouselSlides, null, 2));

  // Build and send report
  const report = buildReport(allPosts, formatStats, topNonVideo, captionCorr, carouselSlides, hashtagStats, accountStats);
  log("\nRapport versturen naar Telegram...");
  await sendTelegram(report);
  log("Klaar!");
}

main().catch((e) => {
  console.error("FATAL:", e);
  process.exit(1);
});
