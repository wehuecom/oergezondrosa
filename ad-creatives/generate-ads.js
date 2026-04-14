#!/usr/bin/env node
/**
 * Ad Creative Generator — 15 statics voor Oergezond Meta Ads
 * 5 angles × 3 variaties = 15 images (1080x1350, 4:5)
 */
"use strict";

const puppeteer = require("../content-scraper/node_modules/puppeteer");
const https = require("https");
const fs = require("fs");
const path = require("path");

const GEMINI_KEY = "AIzaSyAmbqYKzHdnV3IIAkaPGFWyvuoy2by2RdQ";
const OUT_DIR = __dirname;
const BRAND_GREEN = "#4b5a3c";
const BRAND_CREAM = "#f5f0e8";

// ============================================================
// GEMINI — Achtergrond generatie
// ============================================================

function geminiRequest(prompt) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseModalities: ["TEXT", "IMAGE"] },
    });
    const req = https.request({
      hostname: "generativelanguage.googleapis.com",
      path: `/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_KEY}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => {
        try { resolve(JSON.parse(data)); } catch { resolve(data); }
      });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

// ============================================================
// PUPPETEER — HTML → PNG
// ============================================================

async function htmlToImage(html, width = 1080, height = 1350) {
  const browser = await puppeteer.launch({
    headless: true, timeout: 60000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    try {
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    } catch {
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });
    }
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise(r => setTimeout(r, 8000)),
    ]);
    return await page.screenshot({ type: "png", fullPage: false });
  } finally {
    await browser.close();
  }
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// AD TEMPLATES
// ============================================================

function adTemplate({ headline, subtext, ctaText, bgColor, textColor, accentColor, layout }) {
  // layout: "center" | "bottom-heavy" | "split"
  const isCenter = layout === "center";
  const isSplit = layout === "split";

  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px;
    background: ${bgColor};
    display: flex; flex-direction: column;
    ${isCenter ? "align-items: center; justify-content: center;" : "justify-content: flex-end;"}
    padding: ${isCenter ? "80px" : "0"};
    position: relative; overflow: hidden;
    font-family: 'Inter', sans-serif;
  }
  .top-bar {
    position: absolute; top: 0; left: 0; right: 0;
    height: 6px; background: ${accentColor};
  }
  .headline {
    font-weight: 900; font-size: 64px;
    color: ${textColor}; line-height: 1.15;
    text-align: ${isCenter ? "center" : "left"};
    ${isCenter ? "" : "padding: 0 60px;"}
    margin-bottom: 24px;
    max-width: 960px;
  }
  .subtext {
    font-weight: 400; font-size: 28px;
    color: ${textColor}; opacity: 0.8;
    line-height: 1.5;
    text-align: ${isCenter ? "center" : "left"};
    ${isCenter ? "" : "padding: 0 60px;"}
    max-width: 860px;
    margin-bottom: 40px;
  }
  .cta-btn {
    display: inline-block;
    background: ${accentColor}; color: ${bgColor === "#ffffff" || bgColor === BRAND_CREAM ? "#ffffff" : bgColor};
    font-weight: 700; font-size: 24px;
    padding: 18px 48px; border-radius: 50px;
    ${isCenter ? "" : "margin-left: 60px;"}
    margin-bottom: ${isCenter ? "0" : "80px"};
    letter-spacing: 0.5px;
  }
  .bottom-section {
    ${isCenter ? "" : "background: rgba(255,255,255,0.95); padding: 60px 0 0; border-radius: 40px 40px 0 0;"}
  }
  .brand-mark {
    position: absolute;
    ${isCenter ? "bottom: 48px; right: 56px;" : "top: 32px; left: 60px;"}
    font-weight: 800; font-size: 22px;
    color: ${isCenter ? textColor : "rgba(255,255,255,0.9)"};
    letter-spacing: 2px;
    opacity: 0.6;
  }
</style></head><body>
  <div class="top-bar"></div>
  ${!isCenter ? '<div style="flex:1"></div><div class="bottom-section">' : ""}
  <div class="headline" id="hl">${headline}</div>
  <div class="subtext">${subtext}</div>
  <div class="cta-btn">${ctaText}</div>
  ${!isCenter ? "</div>" : ""}
  <div class="brand-mark">OERGEZOND</div>
  <script>
    const el = document.getElementById('hl');
    let size = 64;
    while (el.scrollHeight > ${isCenter ? "400" : "300"} && size > 32) {
      size -= 2; el.style.fontSize = size + 'px';
    }
  </script>
</body></html>`;
}

function comparisonTemplate({ leftLabel, leftItems, rightLabel, rightItems, headline }) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px;
    background: ${BRAND_CREAM};
    font-family: 'Inter', sans-serif;
    display: flex; flex-direction: column;
    padding: 60px;
  }
  .headline { font-weight: 900; font-size: 52px; color: ${BRAND_GREEN}; margin-bottom: 48px; line-height: 1.15; }
  .columns { display: flex; flex: 1; gap: 32px; }
  .col { flex: 1; border-radius: 20px; padding: 40px; display: flex; flex-direction: column; }
  .col-bad { background: #f0e0e0; }
  .col-good { background: #e0f0e0; }
  .col-label { font-weight: 800; font-size: 28px; margin-bottom: 24px; text-transform: uppercase; letter-spacing: 2px; }
  .col-bad .col-label { color: #c0392b; }
  .col-good .col-label { color: #27ae60; }
  .item { font-size: 24px; color: #333; margin-bottom: 12px; line-height: 1.4; }
  .col-bad .item { text-decoration: line-through; opacity: 0.7; }
  .brand-mark { font-weight: 800; font-size: 22px; color: ${BRAND_GREEN}; opacity: 0.5; text-align: center; margin-top: 32px; letter-spacing: 2px; }
</style></head><body>
  <div class="headline">${headline}</div>
  <div class="columns">
    <div class="col col-bad">
      <div class="col-label">${leftLabel}</div>
      ${leftItems.map(i => `<div class="item">${i}</div>`).join("")}
    </div>
    <div class="col col-good">
      <div class="col-label">${rightLabel}</div>
      ${rightItems.map(i => `<div class="item">${i}</div>`).join("")}
    </div>
  </div>
  <div class="brand-mark">OERGEZOND</div>
</body></html>`;
}

function memeTemplate({ topText, bottomText, emoji }) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px;
    background: #111;
    font-family: 'Inter', sans-serif;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 80px;
    gap: 48px;
  }
  .section { text-align: center; }
  .emoji { font-size: 120px; margin-bottom: 16px; }
  .top { font-weight: 800; font-size: 44px; color: #e74c3c; line-height: 1.3; }
  .divider { width: 200px; height: 3px; background: rgba(255,255,255,0.2); }
  .bottom { font-weight: 800; font-size: 44px; color: #2ecc71; line-height: 1.3; }
  .brand { font-weight: 800; font-size: 20px; color: rgba(255,255,255,0.3); letter-spacing: 3px; position: absolute; bottom: 40px; }
</style></head><body>
  <div class="section">
    <div class="emoji">${emoji || "😬"}</div>
    <div class="top">${topText}</div>
  </div>
  <div class="divider"></div>
  <div class="section">
    <div class="emoji">${"😌"}</div>
    <div class="bottom">${bottomText}</div>
  </div>
  <div class="brand">OERGEZOND</div>
</body></html>`;
}

function testimonialTemplate({ quote, name, result, days }) {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px;
    background: ${BRAND_GREEN};
    font-family: 'Inter', sans-serif;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 80px;
  }
  .days { font-weight: 900; font-size: 120px; color: rgba(255,255,255,0.15); margin-bottom: -20px; }
  .days-label { font-weight: 600; font-size: 28px; color: rgba(255,255,255,0.5); margin-bottom: 48px; text-transform: uppercase; letter-spacing: 4px; }
  .quote { font-weight: 700; font-size: 42px; color: #fff; line-height: 1.4; text-align: center; margin-bottom: 40px; max-width: 860px; }
  .quote::before { content: '"'; }
  .quote::after { content: '"'; }
  .result { font-weight: 800; font-size: 32px; color: #a8d5a2; text-align: center; margin-bottom: 24px; }
  .name { font-weight: 400; font-size: 24px; color: rgba(255,255,255,0.6); }
  .brand { font-weight: 800; font-size: 20px; color: rgba(255,255,255,0.25); letter-spacing: 3px; position: absolute; bottom: 40px; }
</style></head><body>
  <div class="days">${days}</div>
  <div class="days-label">dagen Oercrème</div>
  <div class="quote">${quote}</div>
  <div class="result">${result}</div>
  <div class="name">— ${name}</div>
  <div class="brand">OERGEZOND</div>
</body></html>`;
}

// ============================================================
// AD COPY — per creative
// ============================================================

const ADS = [
  // ANGLE 1: Handgeschreven briefje (3x)
  {
    name: "briefje_1a",
    angle: "handgeschreven_briefje",
    template: "ad",
    config: {
      headline: "Bij elke bestelling schrijven we je een persoonlijk briefje.",
      subtext: "Geen mega-fabriek. Geen lopende band. Gewoon Jorn & Rosa die je pakketje inpakken met zorg.",
      ctaText: "Bekijk Oercrème →",
      bgColor: BRAND_CREAM, textColor: BRAND_GREEN, accentColor: BRAND_GREEN, layout: "center",
    },
    copy: { primary: "Elke bestelling pakken we zelf in. Met de hand. Met een persoonlijk briefje erbij.\n\nGeen magazijn. Geen robots. Gewoon wij twee.\n\nDat is het verschil tussen een merk en een mission.", headline: "Handgemaakt. Met een briefje.", description: "5 ingrediënten. 0 troep.", cta: "Shop Now" },
  },
  {
    name: "briefje_1b",
    angle: "handgeschreven_briefje",
    template: "ad",
    config: {
      headline: "Dit zit er bij elke bestelling van Oergezond.",
      subtext: "Een handgeschreven briefje. Omdat je geen ordernummer bent maar een mens.",
      ctaText: "Ontdek waarom →",
      bgColor: "#ffffff", textColor: "#1a1a1a", accentColor: BRAND_GREEN, layout: "center",
    },
    copy: { primary: "Wist je dat we bij elke bestelling een handgeschreven briefje stoppen?\n\nGeen geprinte flyer. Geen kortingscode.\n\nGewoon een persoonlijk berichtje van ons naar jou.\n\nDat is hoe wij denken dat een merk hoort te zijn.", headline: "Persoonlijk. Puur. Echt.", description: "Oercrème — huidverzorging zonder troep", cta: "Shop Now" },
  },
  {
    name: "briefje_1c",
    angle: "handgeschreven_briefje",
    template: "ad",
    config: {
      headline: "Wanneer heb je voor het laatst een handgeschreven briefje gekregen?",
      subtext: "Bij ons krijg je er eentje. Bij elke bestelling. Omdat we geloven dat huidverzorging persoonlijk hoort te zijn.",
      ctaText: "Bestel met briefje →",
      bgColor: BRAND_GREEN, textColor: "#ffffff", accentColor: "#a8d5a2", layout: "center",
    },
    copy: { primary: "Wanneer heb je voor het laatst een handgeschreven briefje gekregen?\n\nBij ons zit er eentje in elk pakketje.\n\nGeen AI. Geen template. Gewoon onze hand, onze pen, onze dank.\n\n5 ingrediënten. 0 troep. 1 briefje.", headline: "Echt persoonlijk", description: "Oercrème — van ons, voor jouw huid", cta: "Shop Now" },
  },

  // ANGLE 2: Bonnetje (3x)
  {
    name: "bonnetje_2a",
    angle: "bonnetje",
    template: "comparison",
    config: {
      headline: "Wat betaal je eigenlijk voor troep?",
      leftLabel: "Drogist — €14,99",
      leftItems: ["Aqua", "Paraffinum Liquidum", "Cetearyl Alcohol", "Phenoxyethanol", "Methylparaben", "Propylparaben", "BHT", "Parfum (synthetisch)", "+ 15 andere chemicaliën"],
      rightLabel: "Oercrème — €28,95",
      rightItems: ["Grasgevoerd rundvet", "Olijfolie", "Bijenwas", "Essentiële olie", "Vitamine E", "", "Dat is alles.", "", "Gaat 3x langer mee."],
    },
    copy: { primary: "€14,99 voor 23 ingrediënten die je niet kunt uitspreken.\n€28,95 voor 5 ingrediënten die je huid herkent.\n\nEn de Oercrème gaat 3x langer mee.\n\nDoe de rekensom.", headline: "Wat betaal je voor troep?", description: "5 ingrediënten. 0 chemicaliën.", cta: "Shop Now" },
  },
  {
    name: "bonnetje_2b",
    angle: "bonnetje",
    template: "ad",
    config: {
      headline: "€0,32 per dag voor huidverzorging zonder troep.",
      subtext: "Oercrème gaat 90 dagen mee. Dat is goedkoper dan je dagcrème van de drogist. En zonder de 23 chemicaliën.",
      ctaText: "Reken het na →",
      bgColor: "#ffffff", textColor: "#1a1a1a", accentColor: BRAND_GREEN, layout: "center",
    },
    copy: { primary: "Iedereen denkt dat natuurlijke huidverzorging duur is.\n\nOercrème: €28,95 ÷ 90 dagen = €0,32 per dag.\nDrogist dagcrème: €14,99 ÷ 30 dagen = €0,50 per dag.\n\nDuurder. En vol met troep.\n\nSoms is puur ook gewoon goedkoper.", headline: "€0,32 per dag. Zonder troep.", description: "Oercrème — simpel maar effectief", cta: "Shop Now" },
  },
  {
    name: "bonnetje_2c",
    angle: "bonnetje",
    template: "ad",
    config: {
      headline: "Draai je dagcrème om. Lees de ingrediënten. Schrik je?",
      subtext: "De meeste crèmes bevatten 20+ synthetische stoffen. Oercrème bevat er 5. Allemaal herkenbaar. Allemaal puur.",
      ctaText: "Bekijk onze ingrediënten →",
      bgColor: BRAND_CREAM, textColor: BRAND_GREEN, accentColor: BRAND_GREEN, layout: "center",
    },
    copy: { primary: "Doe dit vanavond.\n\nPak je dagcrème. Draai het om. Lees de ingrediëntenlijst.\n\nAls je meer dan 3 woorden niet kunt uitspreken, smeert je dat elke dag op je gezicht.\n\nOercrème ingrediënten: rundvet, olijfolie, bijenwas, essentiële olie, vitamine E.\n\nKlaar.", headline: "Kun jij je ingrediënten uitspreken?", description: "5 ingrediënten. Dat is alles.", cta: "Shop Now" },
  },

  // ANGLE 3: Vergelijking (3x)
  {
    name: "vergelijking_3a",
    angle: "vergelijking",
    template: "comparison",
    config: {
      headline: "Wat zit er écht in je bodylotion?",
      leftLabel: "Gewone bodylotion",
      leftItems: ["70% water", "Petroleumderivaten", "Synthetische geur", "Hormoonverstorende parabenen", "Siliconen (bedekt, herstelt niet)", "Gaat 30 dagen mee"],
      rightLabel: "Oercrème",
      rightItems: ["0% water", "Grasgevoerd rundvet", "Essentiële oliën", "Geen parabenen, geen troep", "Voedt en herstelt de huidbarrière", "Gaat 90 dagen mee"],
    },
    copy: { primary: "Je bodylotion is voor 70% water.\n\nDe rest? Petroleum, parabenen en synthetische geur.\n\nOercrème is 100% voeding voor je huid. Geen water. Geen vullers. Geen troep.\n\nJe huid herkent het verschil.", headline: "Bodylotion vs. Oercrème", description: "100% voeding. 0% water.", cta: "Shop Now" },
  },
  {
    name: "vergelijking_3b",
    angle: "vergelijking",
    template: "comparison",
    config: {
      headline: "Nivea vs. Oercrème",
      leftLabel: "Nivea Creme",
      leftItems: ["Aqua", "Paraffinum Liquidum", "Cera Microcristallina", "Glycerin", "Lanolin Alcohol", "Panthenol", "Decyl Oleate", "Octyldodecanol", "Aluminum Stearate", "Citric Acid", "Magnesium Sulfate", "Parfum"],
      rightLabel: "Oercrème",
      rightItems: ["Grasgevoerd rundvet", "Olijfolie", "Bijenwas", "Essentiële olie", "Vitamine E", "", "", "", "", "", "", "Klaar."],
    },
    copy: { primary: "Links: Nivea — 12+ ingrediënten waarvan je de helft niet kunt uitspreken.\n\nRechts: Oercrème — 5 ingrediënten. Allemaal herkenbaar.\n\nJe huid is je grootste orgaan. Wat je erop smeert, komt erin.\n\nKies bewust.", headline: "12 ingrediënten vs. 5", description: "Oercrème — simpel maar effectief", cta: "Shop Now" },
  },
  {
    name: "vergelijking_3c",
    angle: "vergelijking",
    template: "ad",
    config: {
      headline: "Je smeert elke dag gemiddeld 168 chemicaliën op je huid.",
      subtext: "Shampoo, deodorant, bodylotion, dagcrème, foundation — tel maar op. Of begin met 1 product dat puur is.",
      ctaText: "Begin met Oercrème →",
      bgColor: "#1a1a1a", textColor: "#ffffff", accentColor: "#a8d5a2", layout: "center",
    },
    copy: { primary: "168.\n\nZoveel chemische stoffen smeert de gemiddelde vrouw elke dag op haar huid.\n\nShampoo. Bodylotion. Dagcrème. Deodorant. Foundation.\n\nJe huid is je grootste orgaan. Alles wat erop gaat, komt erin.\n\nBegin met 1 product dat puur is. 5 ingrediënten. 0 troep.", headline: "168 chemicaliën per dag", description: "Begin met puur. Begin met Oercrème.", cta: "Shop Now" },
  },

  // ANGLE 4: Meme/herkenning (3x)
  {
    name: "meme_4a",
    angle: "meme",
    template: "meme",
    config: {
      topText: "10-staps skincare routine met 47 ingrediënten per product",
      bottomText: "1 potje Oercrème met 5 ingrediënten",
      emoji: "🧴",
    },
    copy: { primary: "Zij: cleanse, tone, serum, moisturize, SPF, eye cream, night cream...\n\nIk: 1 potje Oercrème.\n\nMijn huid is beter.\n\nSoms is minder gewoon meer.", headline: "Simpel wint.", description: "5 ingrediënten. Dat is alles.", cta: "Shop Now" },
  },
  {
    name: "meme_4b",
    angle: "meme",
    template: "meme",
    config: {
      topText: "De ingrediëntenlijst van je dagcrème lezen",
      bottomText: "De ingrediëntenlijst van Oercrème lezen",
      emoji: "😰",
    },
    copy: { primary: "POV: je draait je dagcrème om en leest de ingrediënten.\n\nAqua, paraffinum liquidum, cetearyl alcohol, phenoxyethanol, methylpara—\n\nNee.\n\nOercrème: rundvet, olijfolie, bijenwas, olie, vitamine E.\n\nDat is het. Klaar. Geen scheikunde examen nodig.", headline: "Kun jij het uitspreken?", description: "5 ingrediënten die je huid herkent", cta: "Shop Now" },
  },
  {
    name: "meme_4c",
    angle: "meme",
    template: "meme",
    config: {
      topText: "€200/maand aan skincare uitgeven en nog steeds last van droge huid",
      bottomText: "€28,95 voor 3 maanden Oercrème en je huid is hersteld",
      emoji: "💸",
    },
    copy: { primary: "€200 per maand aan skincare.\nSerum. Dagcrème. Nachtcrème. Oogcrème. Masker.\n\nNog steeds droge huid.\n\n€28,95 voor 1 potje Oercrème. Gaat 3 maanden mee.\n\nHuid hersteld.\n\nHet probleem was nooit te weinig producten. Het probleem was de verkeerde ingrediënten.", headline: "Minder is meer", description: "€0,32 per dag voor echte huidverzorging", cta: "Shop Now" },
  },

  // ANGLE 5: Resultaat na 30 dagen (3x)
  {
    name: "resultaat_5a",
    angle: "resultaat_30_dagen",
    template: "testimonial",
    config: { quote: "Na 2 weken was mijn eczeem bijna helemaal weg. Na een maand was mijn huid zachter dan ooit.", name: "Lisa, 34", result: "Eczeem → hersteld in 30 dagen", days: "30" },
    copy: { primary: "\"Na 2 weken was mijn eczeem bijna helemaal weg.\"\n\nLisa probeerde alles. Dermatoloog. Steroïdcrèmes. Dure serums.\n\nToen probeerde ze Oercrème. 5 ingrediënten. Geen troep.\n\n30 dagen later: huid hersteld.\n\nJouw huid verdient beter dan chemicaliën.", headline: "30 dagen. 5 ingrediënten.", description: "Oercrème — herstel van binnenuit", cta: "Shop Now" },
  },
  {
    name: "resultaat_5b",
    angle: "resultaat_30_dagen",
    template: "testimonial",
    config: { quote: "Ik gebruik het nu voor mijn hele gezin. De kinderen hebben geen last meer van droge plekken.", name: "Sanne, 38", result: "Heel gezin overgestapt", days: "60" },
    copy: { primary: "\"Ik gebruik het nu voor mijn hele gezin.\"\n\nSanne begon met Oercrème voor haar eigen droge huid. Na een maand smeerde ze het ook op haar kinderen.\n\nGeen droge plekken meer. Geen schilfers. Geen troep op hun huid.\n\n5 ingrediënten. Voor het hele gezin.", headline: "Voor het hele gezin", description: "Oercrème — veilig voor iedereen", cta: "Shop Now" },
  },
  {
    name: "resultaat_5c",
    angle: "resultaat_30_dagen",
    template: "testimonial",
    config: { quote: "Mijn vrouw lachte me uit toen ik crème van rundvet kocht. Nu gebruikt ze het zelf elke dag.", name: "Mark, 41", result: "Van sceptisch → fan", days: "14" },
    copy: { primary: "\"Mijn vrouw lachte me uit.\"\n\nMark bestelde Oercrème na een podcast over tallow skincare. Zijn vrouw vond het belachelijk.\n\n2 weken later stal ze zijn potje.\n\nNu hebben ze er allebei een.\n\nSoms moet je het gewoon proberen.", headline: "Van sceptisch naar fan", description: "Oercrème — je huid herkent het", cta: "Shop Now" },
  },
];

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(`Genereer ${ADS.length} ad creatives...\n`);

  // Schrijf ad copy naar tekstbestand
  let copyText = "OERGEZOND — AD COPY (15 creatives)\n" + "=".repeat(50) + "\n\n";

  for (let i = 0; i < ADS.length; i++) {
    const ad = ADS[i];
    console.log(`[${i + 1}/${ADS.length}] ${ad.name} (${ad.angle})...`);

    try {
      let html;
      if (ad.template === "comparison") {
        html = comparisonTemplate(ad.config);
      } else if (ad.template === "meme") {
        html = memeTemplate(ad.config);
      } else if (ad.template === "testimonial") {
        html = testimonialTemplate(ad.config);
      } else {
        html = adTemplate(ad.config);
      }

      const buffer = await htmlToImage(html);
      const outPath = path.join(OUT_DIR, `${ad.name}.png`);
      fs.writeFileSync(outPath, buffer);
      console.log(`  ✅ ${outPath}`);
    } catch (e) {
      console.log(`  ❌ Image mislukt: ${e.message}`);
    }

    // Ad copy toevoegen
    copyText += `--- ${i + 1}. ${ad.name} (${ad.angle}) ---\n`;
    copyText += `Primary Text:\n${ad.copy.primary}\n\n`;
    copyText += `Headline: ${ad.copy.headline}\n`;
    copyText += `Description: ${ad.copy.description}\n`;
    copyText += `CTA: ${ad.copy.cta}\n\n\n`;

    await sleep(500);
  }

  // Sla ad copy op
  const copyPath = path.join(OUT_DIR, "ad-copy.txt");
  fs.writeFileSync(copyPath, copyText, "utf8");
  console.log(`\nAd copy opgeslagen: ${copyPath}`);
  console.log(`Klaar! ${ADS.length} creatives gegenereerd.`);
}

main().catch(e => { console.error(e); process.exit(1); });
