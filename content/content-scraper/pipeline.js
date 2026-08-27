#!/usr/bin/env node
/**
 * Oergezond Content Pipeline v2
 * ==============================
 * 4-fasen content engine:
 *   1. Research  — 5 bronnen (Instagram, X, Reddit, Trends, News)
 *   2. Analyse   — Claude analyseert waarom iets viral ging
 *   3. Genereer  — 3-5 diepe content stukken (niet 18 middelmatige)
 *   4. Output    — Telegram + top-posts.json voor Amy
 *
 * Kwaliteitscheck tussen fase 3 en 4:
 *   - Scroll-stop test (score >= 7)
 *   - Caption max 150 woorden
 *   - Brand voice match (geen verboden woorden)
 *   - Precies 1 CTA
 *
 * Starten: node pipeline.js
 * Dagelijks via pm2: pm2 start pipeline.js --cron "0 8 * * *" --no-autorestart
 */

"use strict";

const { log } = require("./lib/logger.js");
const { alreadyRanToday, markRanToday, loadUsedTopics, saveUsedTopics } = require("./lib/dedup.js");
const { sendText } = require("./lib/telegram.js");

const phase1 = require("./phases/phase1-research.js");
const phase2 = require("./phases/phase2-analysis.js");
const phase3 = require("./phases/phase3-generate.js");
const qualityGate = require("./phases/quality-gate.js");
const phase4 = require("./phases/phase4-output.js");

async function main() {
  log("=== Oergezond Content Pipeline v2 gestart ===");

  if (alreadyRanToday()) {
    log("Al gedraaid vandaag — stop.");
    return;
  }

  try {
    // Fase 1: Research (3-4 min)
    const rawData = await phase1.run();

    // Fase 2: Analyse (1 min)
    const analysis = await phase2.run(rawData);

    // Fase 3: Genereer (3-5 min)
    let content;
    if (analysis.length > 0) {
      content = await phase3.run(analysis);
    } else {
      log("Geen analyse resultaten — skip generatie");
      content = [];
    }

    // Fase 3.5: Kwaliteitscheck
    let approved = [];
    if (content.length > 0) {
      approved = await qualityGate.run(content);
    }

    // Fase 4: Output (1-2 min)
    await phase4.run(approved, rawData);

    // Onderwerpen opslaan voor dedup
    const usedTopics = loadUsedTopics();
    const newTopics = approved.map(c => c.topic).filter(Boolean);
    saveUsedTopics([...usedTopics, ...newTopics]);
    log(`${newTopics.length} onderwerpen opgeslagen voor dedup`);

    markRanToday();
    log("=== Pipeline klaar ===");

  } catch (err) {
    log(`PIPELINE FOUT: ${err.message}`);
    console.error(err.stack);
    await sendText(`⚠️ Content Pipeline fout: ${err.message}`).catch(() => {});
    process.exit(1);
  }
}

main();
