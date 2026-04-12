"use strict";

const fs = require("fs");
const path = require("path");
const { log } = require("../lib/logger.js");
const { callClaude, parseJson } = require("../lib/claude.js");
const { loadUsedTopics } = require("../lib/dedup.js");

/**
 * Phase 2: Analysis — Begrijp WAAROM iets viral ging.
 * Aparte Claude-call voor intelligente analyse ipv simpele engagement-sorting.
 * @param {Array} rawData - Datapunten uit Phase 1
 * @returns {Array} Top 10 gerankte kansen
 */
async function run(rawData) {
  log("=== FASE 2: ANALYSE ===");

  // Pre-filter: verwijder lege titels en al gebruikte topics
  const usedTopics = loadUsedTopics();
  const filtered = rawData
    .filter(item => item.title && item.title.trim().length > 20)
    .filter(item => {
      const lower = item.title.toLowerCase();
      return !usedTopics.some(t => lower.includes(t.toLowerCase()));
    });

  // Sorteer op engagement score voor pre-selectie
  const scored = filtered.map(item => ({
    ...item,
    _score: (item.engagement.likes || 0) +
            (item.engagement.comments || 0) * 3 +
            (item.engagement.shares || 0) * 2 +
            (item.engagement.views || 0) * 0.01,
  })).sort((a, b) => b._score - a._score);

  // Top 35 naar Claude voor analyse
  const forAnalysis = scored.slice(0, 35);

  if (forAnalysis.length === 0) {
    log("Geen data voor analyse — fallback naar topicpool");
    return [];
  }

  const dataText = forAnalysis.map((item, i) => {
    const eng = item.engagement;
    const stats = [
      eng.likes ? `${eng.likes} likes` : null,
      eng.comments ? `${eng.comments} comments` : null,
      eng.views ? `${eng.views} views` : null,
      eng.shares ? `${eng.shares} shares` : null,
    ].filter(Boolean).join(", ");

    return `${i + 1}. [${item.source}] ${item.author} | ${stats}
   "${item.title.slice(0, 200)}"
   URL: ${item.url || "n/a"}`;
  }).join("\n\n");

  const prompt = `Je bent een content analist voor Oergezond — een Nederlands gezondheidsplatform (oervoeding, hormoonbalans, toxines vermijden, huid van binnenuit, circadiaans ritme).

Analyseer deze ${forAnalysis.length} virale posts/artikelen uit meerdere bronnen en beoordeel ze op potentie voor Oergezond content.

${usedTopics.length > 0 ? `⛔ VERMIJD deze onderwerpen (al eerder behandeld): ${usedTopics.slice(-20).join(", ")}\n` : ""}

DATA:
${dataText}

Per post, evalueer:
1. HOOK PATROON: contrarian, mythe-ontkrachting, schokkend-feit, how-to, lijst, before-after
2. EMOTIONELE TRIGGER: angst, herkenning, woede, hoop, verbazing
3. OERGEZOND RELEVANTIE (1-10): past dit bij onze thema's en producten?
4. CONTENT GAP: behandelen concurrenten dit al uitgebreid? (hoog = onbenut)
5. BESTE FORMAT: carousel, nieuws, tweet, of reel
6. HOOK SUGGESTIE: eerste zin/3 seconden voor de Oergezond versie (in het Nederlands)

Geef output als JSON array, gesorteerd op potentie (hoogste eerst), ALLEEN de top 10:
[{
  "rank": 1,
  "originalSource": "instagram|twitter|reddit|google-trends|health-news",
  "originalUrl": "...",
  "originalAuthor": "...",
  "topic": "kort thema in 2-4 woorden",
  "hookPatroon": "contrarian|mythe-ontkrachting|schokkend-feit|how-to|lijst|before-after",
  "emotionalTrigger": "angst|herkenning|woede|hoop|verbazing",
  "relevanceScore": 8,
  "contentGap": "hoog|middel|laag",
  "bestFormat": "carousel|nieuws|tweet|reel",
  "hookSuggestie": "...",
  "reasoning": "1-2 zinnen waarom dit kansrijk is voor Oergezond"
}]

ALLEEN JSON terug, geen extra tekst.`;

  const raw = await callClaude(prompt, { maxTokens: 3000 });
  const analysis = parseJson(raw);

  // Opslaan
  const outFile = path.join(__dirname, "..", "data", "analysis.json");
  fs.writeFileSync(outFile, JSON.stringify(analysis, null, 2), "utf8");

  log(`Fase 2 klaar: ${analysis.length} kansen gerankt`);
  return analysis;
}

module.exports = { run };
