"use strict";

const fs = require("fs");
const path = require("path");
const { log } = require("../lib/logger.js");
const { sendText, sendPhoto, sendButtons, sleep } = require("../lib/telegram.js");

/**
 * Phase 4: Output — Stuur naar Telegram + schrijf top-posts.json voor Amy.
 * @param {Array} content - Goedgekeurde content uit quality gate
 * @param {Array} rawData - Ruwe research data (voor top-posts.json compatibiliteit)
 */
async function run(content, rawData) {
  log("=== FASE 4: OUTPUT ===");

  const datum = new Date().toLocaleDateString("nl-NL", {
    weekday: "long", day: "numeric", month: "long",
  });

  // Bronnen samenvatting
  const sourceCounts = {};
  for (const item of rawData) {
    sourceCounts[item.source] = (sourceCounts[item.source] || 0) + 1;
  }
  const sourceText = Object.entries(sourceCounts)
    .map(([s, c]) => `${s}: ${c}`)
    .join(" · ");

  // Tel nieuws en tweet posts
  const newsCount = content.filter(c => c.format === "nieuws").length;
  const tweetCount = content.filter(c => c.format === "tweet").length;

  // Header
  await sendText(`📊 *Dagelijkse content — ${datum}*\n_${rawData.length} bronpunten geanalyseerd (${sourceText})_\n_${newsCount} nieuws posts + ${tweetCount} tweet posts gegenereerd_`);

  // Stuur nieuws posts eerst
  const newsPosts = content.filter(c => c.format === "nieuws");
  const tweetPosts = content.filter(c => c.format === "tweet");

  if (newsPosts.length > 0) {
    await sendText(`📰 *${newsPosts.length} Nieuws Posts — kies er één*`);
  }

  // Nieuws posts
  for (let i = 0; i < newsPosts.length; i++) {
    const piece = newsPosts[i];
    await sleep(1000);

    try {
      if (piece.format === "nieuws" && piece.imageBuffer) {
        const header = `📰 *Nieuws ${i + 1} — ${piece.topic}*\n_Bron: ${piece.bron || "n/a"}_`;
        await sendPhoto(piece.imageBuffer, header);
        await sendText(`📋 *Caption ${i + 1}:*\n\n${piece.caption}`);

      } else if (piece.format === "tweet" && piece.imageBuffer) {
        const header = `🐦 *Tweet ${i + 1} — ${piece.topic}*\n_Bron: ${piece.bron || "n/a"}_`;
        await sendPhoto(piece.imageBuffer, header);
        await sendText(`📋 *Caption ${i + 1}:*\n\n${piece.caption}`);
      }

      log(`  ${piece.format} "${piece.topic}" verstuurd ✅`);
    } catch (e) {
      log(`  ${piece.format} "${piece.topic}" versturen mislukt: ${e.message}`);
      await sendText(`⚠️ Nieuws ${i + 1} (${piece.topic}) versturen mislukt`);
    }
  }

  // Tweet posts
  if (tweetPosts.length > 0) {
    await sendText(`🐦 *${tweetPosts.length} Tweet Posts — kies er één*`);
  }

  for (let i = 0; i < tweetPosts.length; i++) {
    const piece = tweetPosts[i];
    await sleep(1000);

    try {
      if (piece.imageBuffer) {
        const header = `🐦 *Tweet ${i + 1} — ${piece.topic}*\n_Bron: ${piece.bron || "n/a"}_`;
        await sendPhoto(piece.imageBuffer, header);
        await sendText(`📋 *Caption ${i + 1}:*\n\n${piece.caption}`);
      }
      log(`  tweet "${piece.topic}" verstuurd ✅`);
    } catch (e) {
      log(`  tweet "${piece.topic}" versturen mislukt: ${e.message}`);
      await sendText(`⚠️ Tweet ${i + 1} (${piece.topic}) versturen mislukt`);
    }
  }

  // Schrijf top-posts.json voor Amy /reels compatibiliteit
  writeTopPostsJson(rawData);

  // Stuur virale posts met knoppen (voor remake/tweet/news buttons)
  await sendViralPostButtons(rawData);

  log("Fase 4 klaar: alles verstuurd");
}

function writeTopPostsJson(rawData) {
  // Converteer naar oud format dat Amy verwacht
  const igPosts = rawData
    .filter(p => p.source === "instagram")
    .map(p => ({
      account: (p.author || "").replace("@", ""),
      type: p.type || "image",
      caption: (p.title || "").slice(0, 300),
      likes: p.engagement?.likes || 0,
      comments: p.engagement?.comments || 0,
      views: p.engagement?.views || 0,
      engagement: (p.engagement?.likes || 0) + (p.engagement?.comments || 0) * 3,
      url: p.url || "",
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, 15);

  const outFile = path.join(__dirname, "..", "top-posts.json");
  fs.writeFileSync(outFile, JSON.stringify(igPosts, null, 2), "utf8");
  log(`  top-posts.json geschreven (${igPosts.length} posts) voor Amy`);
}

async function sendViralPostButtons(rawData) {
  // Top 10 virale posts met knoppen (zelfde UX als oude scraper)
  const igPosts = rawData
    .filter(p => p.source === "instagram" && p.url)
    .sort((a, b) => {
      const scoreA = (a.engagement?.likes || 0) + (a.engagement?.comments || 0) * 3;
      const scoreB = (b.engagement?.likes || 0) + (b.engagement?.comments || 0) * 3;
      return scoreB - scoreA;
    })
    .slice(0, 10);

  if (igPosts.length === 0) return;

  await sendText(`\n📈 *Top ${igPosts.length} virale posts — druk om na te maken:*`);

  for (let i = 0; i < igPosts.length; i++) {
    const p = igPosts[i];
    const author = (p.author || "").replace("@", "");
    const stats = `${(p.engagement?.likes || 0).toLocaleString("nl-NL")} likes${p.engagement?.views ? ` · ${p.engagement.views.toLocaleString("nl-NL")} views` : ""} · ${p.engagement?.comments || 0} reacties`;
    const caption = p.title ? `\n_"${p.title.slice(0, 120)}${p.title.length > 120 ? "…" : ""}"_` : "";
    const text = `*${i + 1}. @${author}*\n${stats}${caption}\n${p.url}`;

    await sendText(text);
    await sendButtons(`↑ Post ${i + 1} namaken als:`, [
      [
        { text: "🐦 Tweet post", callback_data: `tweet:${i}` },
        { text: "📰 Nieuws post", callback_data: `news:${i}` },
      ],
      [
        { text: "🇳🇱 Namaken in NL", callback_data: `remake:${i}` },
      ],
    ]);
    await sleep(300);
  }
}

module.exports = { run };
