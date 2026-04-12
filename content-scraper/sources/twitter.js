"use strict";

const { httpsRequest } = require("../lib/claude.js");
const cfg = require("../config.js");
const { log } = require("../lib/logger.js");

const APIFY_TOKEN = cfg.APIFY_API_TOKEN;

const SEARCH_QUERIES = [
  '"zaadoliën" OR "seed oils" gezondheid',
  '"hormoonverstorend" OR "endocrine disruptor"',
  'carnivore dieet OR "animal based" voeding',
  'microbioom darmen OR "gut health"',
  '"Big Pharma" OR statines bijwerkingen',
];

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function apifyRun(actorId, input) {
  const body = JSON.stringify(input);
  const res = await httpsRequest({
    hostname: "api.apify.com",
    path: `/v2/acts/${actorId}/runs?token=${APIFY_TOKEN}`,
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
  }, body);

  if (res.status !== 201) throw new Error(`Apify start mislukt: ${res.status}`);
  const runId = res.body?.data?.id;
  if (!runId) throw new Error("Geen Apify run ID");

  // Poll tot klaar (max 3 min)
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

  // Haal resultaten op
  const dataset = await httpsRequest({
    hostname: "api.apify.com",
    path: `/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&limit=30`,
    method: "GET",
  });

  return Array.isArray(dataset.body) ? dataset.body : [];
}

function mapTweet(item) {
  return {
    source: "twitter",
    title: (item.text || item.full_text || "").slice(0, 300),
    body: item.text || item.full_text || "",
    author: `@${item.author?.userName || item.user?.screen_name || "unknown"}`,
    url: item.url || "",
    engagement: {
      likes: item.likeCount || item.favorite_count || 0,
      comments: item.replyCount || 0,
      views: item.viewCount || 0,
      shares: item.retweetCount || item.retweet_count || 0,
    },
    type: "text",
    timestamp: item.createdAt || new Date().toISOString(),
  };
}

async function scrape() {
  log("X/Twitter: zoeken via Apify...");
  const all = [];

  try {
    const twoDaysAgo = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const results = await apifyRun("61RPP7dywgiy0JPD0", {
      searchTerms: SEARCH_QUERIES,
      maxItems: 30,
      sort: "Top",
      startDate: twoDaysAgo,
    });

    for (const item of results) {
      all.push(mapTweet(item));
    }
    log(`X/Twitter: ${all.length} tweets opgehaald`);
  } catch (e) {
    log(`X/Twitter mislukt: ${e.message} — ga door`);
  }

  return all;
}

module.exports = { scrape };
