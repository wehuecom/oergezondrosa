"use strict";

const { httpsRequest } = require("../lib/claude.js");
const cfg = require("../config.js");
const { log } = require("../lib/logger.js");

const APIFY_TOKEN = cfg.APIFY_API_TOKEN;

const SUBREDDITS = [
  "nutrition", "health", "biohacking",
  "carnivore", "Paleo", "zerocarb",
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function mapPost(item) {
  return {
    source: "reddit",
    title: (item.title || "").slice(0, 300),
    body: (item.body || item.selftext || item.title || "").slice(0, 500),
    author: `r/${item.subreddit || "unknown"}`,
    url: item.url || "",
    engagement: {
      likes: item.upVotes || item.ups || 0,
      comments: item.numberOfComments || item.num_comments || 0,
      views: 0,
      shares: 0,
    },
    type: "text",
    timestamp: item.createdAt || new Date().toISOString(),
  };
}

async function scrape() {
  log("Reddit: zoeken via Apify...");
  const all = [];

  try {
    const body = JSON.stringify({
      startUrls: SUBREDDITS.map(s => ({ url: `https://www.reddit.com/r/${s}/top/?t=week` })),
      maxItems: 15 * SUBREDDITS.length,
      sort: "top",
      time: "week",
      skipComments: true,
    });

    const res = await httpsRequest({
      hostname: "api.apify.com",
      path: `/v2/acts/trudax~reddit-scraper-lite/runs?token=${APIFY_TOKEN}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, body);

    if (res.status !== 201) throw new Error(`Apify start mislukt: ${res.status}`);
    const runId = res.body?.data?.id;
    if (!runId) throw new Error("Geen Apify run ID");

    // Poll (max 3 min)
    for (let i = 0; i < 36; i++) {
      await sleep(5000);
      const poll = await httpsRequest({
        hostname: "api.apify.com",
        path: `/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`,
        method: "GET",
      });
      const status = poll.body?.data?.status;
      if (status === "SUCCEEDED") break;
      if (status === "FAILED" || status === "ABORTED") throw new Error(`Apify run ${status}`);
    }

    const dataset = await httpsRequest({
      hostname: "api.apify.com",
      path: `/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&limit=90`,
      method: "GET",
    });

    const items = Array.isArray(dataset.body) ? dataset.body : [];
    for (const item of items) {
      all.push(mapPost(item));
    }
    log(`Reddit: ${all.length} posts opgehaald`);
  } catch (e) {
    log(`Reddit mislukt: ${e.message} — ga door`);
  }

  return all;
}

module.exports = { scrape };
