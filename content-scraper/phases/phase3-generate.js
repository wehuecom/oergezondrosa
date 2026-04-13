"use strict";

const fs = require("fs");
const path = require("path");
const { log } = require("../lib/logger.js");
const { callClaude, parseJson } = require("../lib/claude.js");
const { generateNewsPost, generateTweetPost } = require("../generate-statics.js");

const BRAND_CONTEXT = `Brand: Oergezond — Nederlands gezondheidsplatform.
Voice: confronterend eerlijk, rustig zelfverzekerd, educatief. Spreektaal. Korte zinnen. Jij/wij, nooit u.
Gebruik: troep, puur, oer-, echt, gewoon, hormoonvriendelijk, grasgevoerd, herstel van binnenuit, de natuur wint, controle terugpakken.
NOOIT: journey, ritual, elevate, glow up, clean beauty, self-care, superfoods, revolutionair, baanbrekend, holistic.
Schrijf in correct, natuurlijk Nederlands. Geen anglicismen.`;

/**
 * Phase 3: Generate — 5 nieuws + 5 tweet posts, elk met eigen Claude-call.
 * @param {Array} analysis - Top kansen uit Phase 2
 * @returns {Array} Gegenereerde content met images
 */
async function run(analysis) {
  log("=== FASE 3: GENEREER ===");

  if (analysis.length === 0) {
    log("Geen analyse data — skip generatie");
    return [];
  }

  const content = [];

  // Verdeel top 10 kansen: 5 nieuws + 5 tweet (op basis van analyse of round-robin)
  const newsOpps = [];
  const tweetOpps = [];

  for (const opp of analysis.slice(0, 10)) {
    if (opp.bestFormat === "nieuws" && newsOpps.length < 5) {
      newsOpps.push(opp);
    } else if (opp.bestFormat === "tweet" && tweetOpps.length < 5) {
      tweetOpps.push(opp);
    } else if (newsOpps.length < 5) {
      newsOpps.push(opp);
    } else if (tweetOpps.length < 5) {
      tweetOpps.push(opp);
    }
  }

  // Genereer 5 nieuws posts
  for (let i = 0; i < newsOpps.length; i++) {
    const opp = newsOpps[i];
    log(`Nieuws ${i + 1}/${newsOpps.length}: ${opp.topic}...`);
    try {
      const piece = await generateNewsPiece(opp);
      if (piece) content.push(piece);
    } catch (e) {
      log(`  Nieuws ${i + 1} mislukt: ${e.message}`);
    }
  }

  // Genereer 5 tweet posts
  for (let i = 0; i < tweetOpps.length; i++) {
    const opp = tweetOpps[i];
    log(`Tweet ${i + 1}/${tweetOpps.length}: ${opp.topic}...`);
    try {
      const piece = await generateTweetPiece(opp);
      if (piece) content.push(piece);
    } catch (e) {
      log(`  Tweet ${i + 1} mislukt: ${e.message}`);
    }
  }

  // Opslaan
  const outFile = path.join(__dirname, "..", "data", "generated-content.json");
  const serializable = content.map(c => ({ ...c, imageBuffer: undefined }));
  fs.writeFileSync(outFile, JSON.stringify(serializable, null, 2), "utf8");

  log(`Fase 3 klaar: ${content.length} content stukken gegenereerd`);
  return content;
}

async function generateNewsPiece(opp) {
  const prompt = `${BRAND_CONTEXT}

Genereer ÉÉN nieuws post voor Oergezond over dit onderwerp:
- Topic: ${opp.topic}
- Viraal door: ${opp.hookPatroon} + ${opp.emotionalTrigger}
- Hook suggestie: ${opp.hookSuggestie}
- Analyse: ${opp.reasoning}

Geef output als JSON:
{
  "format": "nieuws",
  "topic": "${opp.topic}",
  "newsPost": {
    "headline": "ALLES HOOFDLETTERS, max 12 woorden, confronterend feit",
    "highlightWords": ["woord1", "woord2"],
    "imagePrompt": "Engelse beschrijving (max 12 woorden) van concreet object. Geen mensen, donker, realistisch."
  },
  "bron": "concrete bronvermelding",
  "caption": "volledige Instagram caption in Oergezond voice. Max 150 woorden. Structuur: confronterende opening, kort probleem, oplossing/inzicht, precies 1 CTA. Eindig met 8-12 hashtags."
}

ALLEEN JSON.`;

  const raw = await callClaude(prompt, { maxTokens: 1500 });
  const data = parseJson(raw);

  const imageBuffer = await generateNewsPost(data.newsPost);

  return {
    format: "nieuws",
    topic: opp.topic,
    hookPatroon: opp.hookPatroon,
    source: opp.originalSource,
    sourceUrl: opp.originalUrl,
    relevanceScore: opp.relevanceScore,
    caption: data.caption,
    bron: data.bron,
    data: data.newsPost,
    imageBuffer,
  };
}

async function generateTweetPiece(opp) {
  const prompt = `${BRAND_CONTEXT}

Genereer ÉÉN tweet post voor Oergezond over dit onderwerp:
- Topic: ${opp.topic}
- Viraal door: ${opp.hookPatroon} + ${opp.emotionalTrigger}
- Hook suggestie: ${opp.hookSuggestie}
- Analyse: ${opp.reasoning}

Geef output als JSON:
{
  "format": "tweet",
  "topic": "${opp.topic}",
  "tweetPost": {
    "text": "tweet tekst max 280 tekens, confronterend en deelbaar, geen hashtags"
  },
  "bron": "concrete bronvermelding",
  "caption": "volledige Instagram caption in Oergezond voice. Max 150 woorden. Structuur: confronterende opening, kort probleem, oplossing/inzicht, precies 1 CTA. Eindig met 8-12 hashtags."
}

ALLEEN JSON.`;

  const raw = await callClaude(prompt, { maxTokens: 1500 });
  const data = parseJson(raw);

  const imageBuffer = await generateTweetPost(data.tweetPost);

  return {
    format: "tweet",
    topic: opp.topic,
    hookPatroon: opp.hookPatroon,
    source: opp.originalSource,
    sourceUrl: opp.originalUrl,
    relevanceScore: opp.relevanceScore,
    caption: data.caption,
    bron: data.bron,
    data: data.tweetPost,
    imageBuffer,
  };
}

module.exports = { run };
