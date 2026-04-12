"use strict";

const fs = require("fs");
const path = require("path");
const { log } = require("../lib/logger.js");
const { callClaude, parseJson } = require("../lib/claude.js");
const { generateCarousel, generateNewsPost, generateTweetPost } = require("../generate-statics.js");

const BRAND_CONTEXT = `Brand: Oergezond — Nederlands gezondheidsplatform.
Voice: confronterend eerlijk, rustig zelfverzekerd, educatief. Spreektaal. Korte zinnen. Jij/wij, nooit u.
Gebruik: troep, puur, oer-, echt, gewoon, hormoonvriendelijk, grasgevoerd, herstel van binnenuit, de natuur wint, controle terugpakken.
NOOIT: journey, ritual, elevate, glow up, clean beauty, self-care, superfoods, revolutionair, baanbrekend, holistic.
Schrijf in correct, natuurlijk Nederlands. Geen anglicismen.`;

/**
 * Phase 3: Generate — 3-5 diepe content stukken, elk met eigen Claude-call.
 * @param {Array} analysis - Top kansen uit Phase 2
 * @returns {Array} Gegenereerde content met images
 */
async function run(analysis) {
  log("=== FASE 3: GENEREER ===");

  const top = analysis.slice(0, 5);
  if (top.length === 0) {
    log("Geen analyse data — skip generatie");
    return [];
  }

  const content = [];

  for (let i = 0; i < top.length; i++) {
    const opp = top[i];
    log(`Content ${i + 1}/${top.length}: ${opp.topic} (${opp.bestFormat})...`);

    try {
      const piece = await generatePiece(opp);
      if (piece) content.push(piece);
    } catch (e) {
      log(`  Content ${i + 1} mislukt: ${e.message}`);
    }
  }

  // Opslaan
  const outFile = path.join(__dirname, "..", "data", "generated-content.json");
  const serializable = content.map(c => ({ ...c, imageBuffer: undefined, imageBuffers: undefined }));
  fs.writeFileSync(outFile, JSON.stringify(serializable, null, 2), "utf8");

  log(`Fase 3 klaar: ${content.length} content stukken gegenereerd`);
  return content;
}

async function generatePiece(opportunity) {
  const format = opportunity.bestFormat;

  if (format === "carousel") return generateCarouselPiece(opportunity);
  if (format === "nieuws") return generateNewsPiece(opportunity);
  if (format === "tweet") return generateTweetPiece(opportunity);
  if (format === "reel") return generateReelPiece(opportunity);

  // Fallback
  return generateTweetPiece(opportunity);
}

async function generateCarouselPiece(opp) {
  const prompt = `${BRAND_CONTEXT}

Genereer ÉÉN Instagram carousel voor Oergezond over dit onderwerp:
- Topic: ${opp.topic}
- Viraal door: ${opp.hookPatroon} + ${opp.emotionalTrigger}
- Hook suggestie: ${opp.hookSuggestie}
- Analyse: ${opp.reasoning}

Geef output als JSON:
{
  "format": "carousel",
  "topic": "${opp.topic}",
  "carousel": {
    "title": "pakkende cover titel (max 8 woorden)",
    "subtitle": "kort en confronterend (max 15 woorden)",
    "slides": [
      { "headline": "korte stelling max 6 woorden", "body": "1-2 zinnen toelichting" },
      { "headline": "...", "body": "..." },
      { "headline": "...", "body": "..." },
      { "headline": "...", "body": "..." }
    ]
  },
  "caption": "volledige Instagram caption in Oergezond voice. Max 150 woorden. Structuur: confronterende opening, kort probleem, oplossing/inzicht, precies 1 CTA. Eindig met 8-12 hashtags."
}

ALLEEN JSON.`;

  const raw = await callClaude(prompt, { maxTokens: 2000 });
  const data = parseJson(raw);

  // Genereer images
  const slides = await generateCarousel(data.carousel);

  return {
    format: "carousel",
    topic: opp.topic,
    hookPatroon: opp.hookPatroon,
    source: opp.originalSource,
    sourceUrl: opp.originalUrl,
    relevanceScore: opp.relevanceScore,
    caption: data.caption,
    data: data.carousel,
    imageBuffers: slides.map(s => s.buffer),
  };
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

async function generateReelPiece(opp) {
  const prompt = `${BRAND_CONTEXT}

Genereer ÉÉN reel script voor Oergezond over dit onderwerp:
- Topic: ${opp.topic}
- Viraal door: ${opp.hookPatroon} + ${opp.emotionalTrigger}
- Hook suggestie: ${opp.hookSuggestie}
- Analyse: ${opp.reasoning}

Geef output als JSON:
{
  "format": "reel",
  "topic": "${opp.topic}",
  "reelScript": {
    "hook": "eerste 3 seconden — tekst die op scherm komt",
    "shots": [
      { "timing": "0-3s", "visual": "wat je ziet", "tekst": "wat je zegt/leest" },
      { "timing": "3-8s", "visual": "...", "tekst": "..." },
      { "timing": "8-15s", "visual": "...", "tekst": "..." },
      { "timing": "15-25s", "visual": "...", "tekst": "..." }
    ],
    "cta": "afsluiting + call to action",
    "audio": "voice-over stijl of trending sound suggestie"
  },
  "caption": "volledige Instagram caption in Oergezond voice. Max 150 woorden. Structuur: confronterende opening, kort probleem, oplossing/inzicht, precies 1 CTA. Eindig met 8-12 hashtags."
}

ALLEEN JSON.`;

  const raw = await callClaude(prompt, { maxTokens: 2000 });
  const data = parseJson(raw);

  return {
    format: "reel",
    topic: opp.topic,
    hookPatroon: opp.hookPatroon,
    source: opp.originalSource,
    sourceUrl: opp.originalUrl,
    relevanceScore: opp.relevanceScore,
    caption: data.caption,
    data: data.reelScript,
    imageBuffer: null,
  };
}

module.exports = { run };
