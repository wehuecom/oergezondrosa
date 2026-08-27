"use strict";

const fs = require("fs");
const path = require("path");
const { log } = require("../lib/logger.js");

const instagram = require("../sources/instagram.js");
const twitter = require("../sources/twitter.js");
const reddit = require("../sources/reddit.js");
const googleTrends = require("../sources/google-trends.js");
const healthNews = require("../sources/health-news.js");

/**
 * Phase 1: Research — Verzamel data uit 5 bronnen.
 * Elke bron draait onafhankelijk; als er één faalt gaan de rest gewoon door.
 * @returns {Array} Genormaliseerde datapunten
 */
async function run() {
  log("=== FASE 1: RESEARCH ===");
  const all = [];

  // Bronnen sequentieel om rate limits te voorkomen
  const sources = [
    { name: "Instagram", fn: instagram.scrape },
    { name: "X/Twitter", fn: twitter.scrape },
    { name: "Reddit", fn: reddit.scrape },
    { name: "Google Trends", fn: googleTrends.scrape },
    { name: "Health News", fn: healthNews.scrape },
  ];

  for (const src of sources) {
    try {
      const results = await src.fn();
      all.push(...results);
    } catch (e) {
      log(`${src.name} volledig gefaald: ${e.message} — ga door met volgende bron`);
    }
  }

  // Dedup op URL
  const seen = new Set();
  const deduped = all.filter(item => {
    if (!item.url || seen.has(item.url)) return !item.url ? true : false;
    seen.add(item.url);
    return true;
  });

  // Opslaan
  const outFile = path.join(__dirname, "..", "data", "raw-research.json");
  fs.writeFileSync(outFile, JSON.stringify(deduped, null, 2), "utf8");

  log(`Fase 1 klaar: ${deduped.length} datapunten uit ${sources.length} bronnen`);
  return deduped;
}

module.exports = { run };
