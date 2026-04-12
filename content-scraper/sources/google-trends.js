"use strict";

const https = require("https");
const { log } = require("../lib/logger.js");

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : require("http");
    mod.get(url, { headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "nl-NL" } }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

const HEALTH_KEYWORDS = [
  "gezondheid", "voeding", "dieet", "hormonen", "vitamines",
  "allergie", "huid", "slaap", "darmen", "cholesterol",
  "kanker", "suiker", "medicijnen", "vaccin", "ontsteking",
];

function isHealthRelated(title) {
  const lower = title.toLowerCase();
  return HEALTH_KEYWORDS.some(kw => lower.includes(kw));
}

async function scrape() {
  log("Google Trends NL: ophalen...");
  const all = [];

  try {
    // Google Trends daily trending searches RSS feed voor Nederland
    const rssUrl = "https://trends.google.nl/trending/rss?geo=NL";
    const xml = await fetch(rssUrl);

    // Simpele XML parsing — pak <title> tags
    const titleMatches = xml.match(/<title>([^<]+)<\/title>/g) || [];
    const titles = titleMatches
      .map(t => t.replace(/<\/?title>/g, "").trim())
      .filter(t => t && t !== "Daily Search Trends" && t !== "Trending Searches Daily");

    for (const title of titles) {
      if (isHealthRelated(title)) {
        all.push({
          source: "google-trends",
          title,
          body: `Trending in Nederland: ${title}`,
          author: "Google Trends NL",
          url: `https://trends.google.nl/trends/explore?q=${encodeURIComponent(title)}&geo=NL`,
          engagement: { likes: 0, comments: 0, views: 0, shares: 0 },
          type: "trend",
          timestamp: new Date().toISOString(),
        });
      }
    }

    log(`Google Trends: ${all.length} gezondheid-gerelateerde trends gevonden`);
  } catch (e) {
    log(`Google Trends mislukt: ${e.message} — ga door`);
  }

  return all;
}

module.exports = { scrape };
