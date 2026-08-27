"use strict";

const https = require("https");
const { log } = require("../lib/logger.js");

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function fetch(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : require("http");
    mod.get(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; OergezondBot/1.0)", "Accept": "text/html,application/rss+xml,application/xml" },
      timeout: 10000,
    }, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetch(res.headers.location).then(resolve).catch(reject);
      }
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(data));
    }).on("error", reject);
  });
}

const RSS_FEEDS = [
  { name: "NOS Gezondheid", url: "https://feeds.nos.nl/nosnieuwsgezondheid" },
  { name: "NU.nl Gezondheid", url: "https://www.nu.nl/rss/Gezondheid" },
];

function parseRssItems(xml, sourceName) {
  const items = [];
  const itemBlocks = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];

  for (const block of itemBlocks.slice(0, 10)) {
    const title = (block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/) || [])[1] || "";
    const link = (block.match(/<link>(.*?)<\/link>/) || [])[1] || "";
    const desc = (block.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/) || [])[1] || "";
    const pubDate = (block.match(/<pubDate>(.*?)<\/pubDate>/) || [])[1] || "";

    if (title) {
      items.push({
        source: "health-news",
        title: title.replace(/<[^>]+>/g, "").trim().slice(0, 300),
        body: desc.replace(/<[^>]+>/g, "").trim().slice(0, 500),
        author: sourceName,
        url: link.trim(),
        engagement: { likes: 0, comments: 0, views: 0, shares: 0 },
        type: "article",
        timestamp: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  }

  return items;
}

async function scrape() {
  log("Health News: RSS feeds ophalen...");
  const all = [];

  for (const feed of RSS_FEEDS) {
    try {
      const xml = await fetch(feed.url);
      const items = parseRssItems(xml, feed.name);
      all.push(...items);
      log(`  [News] ${feed.name}: ${items.length} artikelen`);
    } catch (e) {
      log(`  [News] ${feed.name} mislukt: ${e.message}`);
    }
    await sleep(2000);
  }

  log(`Health News: ${all.length} artikelen opgehaald`);
  return all;
}

module.exports = { scrape };
