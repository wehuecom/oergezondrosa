"use strict";

const { log } = require("../lib/logger.js");
const { callClaude, parseJson } = require("../lib/claude.js");
const { generateNewsPost, generateTweetPost, generateCarousel } = require("../generate-statics.js");

const VERBODEN_WOORDEN = [
  "journey", "ritual", "elevate", "holistic", "glow up", "clean beauty",
  "self-care", "superfoods", "revolutionair", "baanbrekend",
];

/**
 * Quality Gate — Check elke post op 4 harde criteria.
 * Faalt er 1? Post wordt opnieuw gegenereerd (max 2 retries).
 *
 * Criteria:
 * 1. Scroll-stop: wekt de hook nieuwsgierigheid? (Claude score >= 7)
 * 2. Caption lengte: max 150 woorden
 * 3. Brand voice: matcht CLAUDE.md toon, geen verboden woorden
 * 4. Precies 1 CTA: niet 0, niet 2+
 *
 * @param {Array} content - Gegenereerde content uit Phase 3
 * @returns {Array} Goedgekeurde content
 */
async function run(content) {
  log("=== FASE 3.5: KWALITEITSCHECK ===");

  const approved = [];

  for (let i = 0; i < content.length; i++) {
    const piece = content[i];
    log(`Check ${i + 1}/${content.length}: ${piece.topic} (${piece.format})...`);

    let current = piece;
    let passed = false;

    for (let attempt = 0; attempt < 3; attempt++) {
      const result = await checkQuality(current);

      if (result.passed) {
        log(`  ✅ ${piece.topic} — goedgekeurd${attempt > 0 ? ` (na ${attempt} retry)` : ""}`);
        passed = true;
        break;
      }

      if (attempt < 2) {
        log(`  ⚠️ ${piece.topic} — gefaald: ${result.failures.join(", ")} — retry ${attempt + 1}...`);
        current = await fixContent(current, result.failures, result.feedback);
      } else {
        log(`  ❌ ${piece.topic} — 3x gefaald, overgeslagen`);
      }
    }

    if (passed) approved.push(current);
  }

  log(`Kwaliteitscheck klaar: ${approved.length}/${content.length} goedgekeurd`);
  return approved;
}

async function checkQuality(piece) {
  const failures = [];
  const feedback = [];

  // 1. Caption lengte (mechanisch)
  const caption = piece.caption || "";
  const wordCount = caption.split(/\s+/).filter(w => w && !w.startsWith("#")).length;
  if (wordCount > 150) {
    failures.push("caption-te-lang");
    feedback.push(`Caption is ${wordCount} woorden, max 150. Kort in.`);
  }

  // 2. Verboden woorden (mechanisch)
  const captionLower = caption.toLowerCase();
  const foundVerboden = VERBODEN_WOORDEN.filter(w => captionLower.includes(w));
  if (foundVerboden.length > 0) {
    failures.push("verboden-woorden");
    feedback.push(`Verboden woorden gevonden: ${foundVerboden.join(", ")}. Vervang door Oergezond vocabulaire.`);
  }

  // 3. Scroll-stop + Brand voice + CTA check (Claude)
  const hookText = getHookText(piece);
  const prompt = `Je bent een kwaliteitscontroleur voor Oergezond content. Check deze post op 3 criteria.

HOOK/HEADLINE:
"${hookText}"

VOLLEDIGE CAPTION:
"${caption}"

BRAND VOICE REGELS:
- Toon: confronterend eerlijk, rustig zelfverzekerd, educatief
- Schrijfstijl: spreektaal, jij/wij, korte zinnen
- Vocabulaire: troep, puur, oer-, echt, gewoon, hormoonvriendelijk, grasgevoerd
- NOOIT: journey, ritual, elevate, glow up, clean beauty, self-care, superfoods, revolutionair

Check:
1. SCROLL-STOP (1-10): Zou je stoppen met scrollen bij deze hook? Wekt het nieuwsgierigheid, verrassing of herkenning?
2. BRAND VOICE: Klinkt dit als Oergezond? Confronterend, eerlijk, geen corporate of vage wellness-taal?
3. CTA COUNT: Tel het EXACTE aantal call-to-actions in de caption. Een CTA is een directe oproep tot actie (bijv. "Sla op", "Tag iemand", "Klik op de link"). Hashtags zijn GEEN CTA.

Geef output als JSON:
{
  "scrollStopScore": 8,
  "scrollStopFeedback": "korte uitleg",
  "brandVoiceOk": true,
  "brandVoiceFeedback": "korte uitleg als niet ok",
  "ctaCount": 1,
  "ctaFeedback": "welke CTAs gevonden"
}

ALLEEN JSON.`;

  const raw = await callClaude(prompt, { maxTokens: 500, model: "claude-sonnet-4-6" });
  const check = parseJson(raw);

  if (check.scrollStopScore < 7) {
    failures.push("scroll-stop-zwak");
    feedback.push(`Scroll-stop score ${check.scrollStopScore}/10: ${check.scrollStopFeedback}. Herschrijf de hook sterker.`);
  }

  if (!check.brandVoiceOk) {
    failures.push("brand-voice-mismatch");
    feedback.push(`Brand voice mismatch: ${check.brandVoiceFeedback}. Herschrijf in Oergezond toon.`);
  }

  if (check.ctaCount !== 1) {
    failures.push("cta-fout");
    feedback.push(`${check.ctaCount} CTA's gevonden, moet precies 1 zijn. ${check.ctaFeedback}`);
  }

  return { passed: failures.length === 0, failures, feedback };
}

function getHookText(piece) {
  if (piece.format === "carousel") return piece.data?.title || "";
  if (piece.format === "nieuws") return piece.data?.headline || "";
  if (piece.format === "tweet") return piece.data?.text || "";
  if (piece.format === "reel") return piece.data?.hook || "";
  return "";
}

async function fixContent(piece, failures, feedback) {
  const fixInstructions = feedback.join("\n- ");

  const prompt = `Je hebt content gemaakt voor Oergezond maar het voldoet niet aan de kwaliteitscheck.

PROBLEMEN:
- ${fixInstructions}

HUIDIGE CONTENT:
- Format: ${piece.format}
- Topic: ${piece.topic}
- Hook/headline: "${getHookText(piece)}"
- Caption: "${piece.caption}"

FIX de problemen. Behoud het onderwerp en format, maar:
${failures.includes("scroll-stop-zwak") ? "- Maak de hook confronterender, verrassender, nieuwsgierigheid-wekkender\n" : ""}${failures.includes("caption-te-lang") ? "- Kort de caption in tot max 150 woorden (excl. hashtags)\n" : ""}${failures.includes("brand-voice-mismatch") ? "- Herschrijf in Oergezond toon: confronterend eerlijk, spreektaal, kort\n" : ""}${failures.includes("verboden-woorden") ? "- Vervang verboden woorden door Oergezond vocabulaire (troep, puur, oer-, echt)\n" : ""}${failures.includes("cta-fout") ? "- Zorg voor PRECIES 1 CTA in de caption\n" : ""}

Geef de VOLLEDIGE gefixte output als JSON:
${getFixJsonTemplate(piece)}

ALLEEN JSON.`;

  const raw = await callClaude(prompt, { maxTokens: 2000 });
  const fixed = parseJson(raw);

  // Regenereer image als hook/headline veranderd is
  const updated = { ...piece, caption: fixed.caption };

  if (piece.format === "carousel" && fixed.carousel) {
    updated.data = fixed.carousel;
    try {
      const slides = await generateCarousel(fixed.carousel);
      updated.imageBuffers = slides.map(s => s.buffer);
    } catch (e) {
      log(`  Carousel regeneratie mislukt: ${e.message}`);
    }
  } else if (piece.format === "nieuws" && fixed.newsPost) {
    updated.data = fixed.newsPost;
    try {
      updated.imageBuffer = await generateNewsPost(fixed.newsPost);
    } catch (e) {
      log(`  News image regeneratie mislukt: ${e.message}`);
    }
  } else if (piece.format === "tweet" && fixed.tweetPost) {
    updated.data = fixed.tweetPost;
    try {
      updated.imageBuffer = await generateTweetPost(fixed.tweetPost);
    } catch (e) {
      log(`  Tweet image regeneratie mislukt: ${e.message}`);
    }
  } else if (piece.format === "reel" && fixed.reelScript) {
    updated.data = fixed.reelScript;
  }

  return updated;
}

function getFixJsonTemplate(piece) {
  if (piece.format === "carousel") {
    return `{
  "carousel": { "title": "...", "subtitle": "...", "slides": [{"headline":"...","body":"..."},{"headline":"...","body":"..."},{"headline":"...","body":"..."},{"headline":"...","body":"..."}] },
  "caption": "gefixte caption, max 150 woorden, precies 1 CTA, 8-12 hashtags"
}`;
  }
  if (piece.format === "nieuws") {
    return `{
  "newsPost": { "headline": "HOOFDLETTERS MAX 12 WOORDEN", "highlightWords": ["..."], "imagePrompt": "..." },
  "caption": "gefixte caption, max 150 woorden, precies 1 CTA, 8-12 hashtags"
}`;
  }
  if (piece.format === "tweet") {
    return `{
  "tweetPost": { "text": "max 280 tekens" },
  "caption": "gefixte caption, max 150 woorden, precies 1 CTA, 8-12 hashtags"
}`;
  }
  if (piece.format === "reel") {
    return `{
  "reelScript": { "hook": "...", "shots": [...], "cta": "...", "audio": "..." },
  "caption": "gefixte caption, max 150 woorden, precies 1 CTA, 8-12 hashtags"
}`;
  }
  return `{ "caption": "..." }`;
}

module.exports = { run };
