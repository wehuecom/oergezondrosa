#!/usr/bin/env node
/**
 * Ad Creative Generator v2 — Met productfoto's
 * Gebruikt Puppeteer voor layout + echte productfoto compositing
 * Gebaseerd op Jorn's aanpak: achtergrond + product overlay
 */
"use strict";

const puppeteer = require("../content-scraper/node_modules/puppeteer");
const fs = require("fs");
const path = require("path");

const OUT_DIR = __dirname;
const PRODUCT_DIR = path.join(__dirname, "product-photos");

// Product foto's als base64 inladen
const PRODUCT_MAIN_B64 = fs.readFileSync(path.join(PRODUCT_DIR, "oercreme_main.png")).toString("base64");
const PRODUCT_LIFESTYLE_B64 = fs.readFileSync(path.join(PRODUCT_DIR, "oercreme_lifestyle.png")).toString("base64");

const BRAND = {
  green: "#4b5a3c",
  cream: "#f5f0e8",
  warmWhite: "#FAF6F0",
  darkBrown: "#2C1810",
  terracotta: "#C4714A",
  lightGreen: "#a8d5a2",
};

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function htmlToImage(html, width = 1080, height = 1350) {
  const browser = await puppeteer.launch({
    headless: true, timeout: 60000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    try { await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 }); }
    catch { await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 }); }
    await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 8000))]);
    return await page.screenshot({ type: "png", fullPage: false });
  } finally { await browser.close(); }
}

// ============================================================
// TEMPLATES — Met product hero zone
// ============================================================

function heroProductAd({ headline, subtext, ctaText, bgColor, textColor, productSize, productPosition }) {
  // Product groot in beeld, tekst erboven
  const imgSize = productSize || 420;
  const pos = productPosition || "center"; // center, right, left
  const posStyle = pos === "right" ? "right: 60px;" : pos === "left" ? "left: 60px;" : "left: 50%; transform: translateX(-50%);";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1080px; height:1350px; background:${bgColor}; font-family:'Inter',sans-serif; position:relative; overflow:hidden; }
  .content { position:absolute; top:60px; left:60px; right:60px; }
  .headline { font-weight:900; font-size:56px; color:${textColor}; line-height:1.15; margin-bottom:20px; }
  .subtext { font-weight:400; font-size:26px; color:${textColor}; opacity:0.75; line-height:1.5; max-width:700px; }
  .product { position:absolute; bottom:40px; ${posStyle} width:${imgSize}px; height:${imgSize}px; }
  .product img { width:100%; height:100%; object-fit:contain; filter: drop-shadow(0 20px 40px rgba(0,0,0,0.15)); }
  .cta { position:absolute; bottom:${imgSize < 350 ? "60px" : "40px"}; ${pos === "right" ? "left:60px;" : pos === "left" ? "right:60px;" : "left:60px;"}
    background:${textColor}; color:${bgColor}; font-weight:700; font-size:22px; padding:16px 40px; border-radius:50px; }
  .brand { position:absolute; top:60px; right:60px; font-weight:800; font-size:18px; color:${textColor}; opacity:0.4; letter-spacing:2px; }
  .accent-line { width:60px; height:4px; background:${BRAND.terracotta}; margin:24px 0; }
</style></head><body>
  <div class="brand">OERGEZOND</div>
  <div class="content">
    <div class="headline" id="hl">${headline}</div>
    <div class="accent-line"></div>
    <div class="subtext">${subtext}</div>
  </div>
  <div class="product"><img src="data:image/png;base64,${PRODUCT_MAIN_B64}"></div>
  ${ctaText ? `<div class="cta">${ctaText}</div>` : ""}
  <script>
    const el = document.getElementById('hl');
    let s = 56;
    while(el.scrollHeight > 280 && s > 32){s-=2;el.style.fontSize=s+'px';}
  </script>
</body></html>`;
}

function splitComparisonAd({ headline, leftTitle, leftItems, rightTitle, rightItems }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1080px; height:1350px; background:${BRAND.warmWhite}; font-family:'Inter',sans-serif; display:flex; flex-direction:column; }
  .top { padding:50px 50px 30px; }
  .headline { font-weight:900; font-size:48px; color:${BRAND.green}; line-height:1.15; }
  .columns { display:flex; flex:1; gap:0; }
  .col { flex:1; padding:30px 36px; display:flex; flex-direction:column; }
  .col-left { background:rgba(192,57,43,0.08); }
  .col-right { background:rgba(39,174,96,0.08); }
  .col-title { font-weight:800; font-size:22px; margin-bottom:20px; text-transform:uppercase; letter-spacing:2px; }
  .col-left .col-title { color:#c0392b; }
  .col-right .col-title { color:#27ae60; }
  .item { font-size:20px; color:#333; margin-bottom:10px; line-height:1.4; padding-left:20px; position:relative; }
  .item::before { content:''; position:absolute; left:0; top:8px; width:8px; height:8px; border-radius:50%; }
  .col-left .item::before { background:#c0392b; }
  .col-right .item::before { background:#27ae60; }
  .col-left .item { opacity:0.7; }
  .bottom { height:280px; background:${BRAND.green}; display:flex; align-items:center; justify-content:center; gap:40px; padding:0 60px; }
  .bottom-text { color:white; font-weight:700; font-size:28px; max-width:480px; line-height:1.3; }
  .bottom-product img { height:220px; width:auto; object-fit:contain; filter:drop-shadow(0 10px 30px rgba(0,0,0,0.3)); }
  .brand { position:absolute; top:55px; right:50px; font-weight:800; font-size:16px; color:${BRAND.green}; opacity:0.35; letter-spacing:2px; }
</style></head><body>
  <div class="brand">OERGEZOND</div>
  <div class="top"><div class="headline">${headline}</div></div>
  <div class="columns">
    <div class="col col-left">
      <div class="col-title">${leftTitle}</div>
      ${leftItems.map(i => `<div class="item">${i}</div>`).join("")}
    </div>
    <div class="col col-right">
      <div class="col-title">${rightTitle}</div>
      ${rightItems.map(i => `<div class="item">${i}</div>`).join("")}
    </div>
  </div>
  <div class="bottom">
    <div class="bottom-text">5 ingrediënten.<br>0 troep.<br>Zo simpel is het.</div>
    <div class="bottom-product"><img src="data:image/png;base64,${PRODUCT_MAIN_B64}"></div>
  </div>
</body></html>`;
}

function testimonialProductAd({ quote, name, result, days, bgColor }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1080px; height:1350px; background:${bgColor || BRAND.green}; font-family:'Inter',sans-serif; display:flex; flex-direction:column; align-items:center; padding:80px; position:relative; }
  .stars { font-size:40px; margin-bottom:24px; letter-spacing:8px; }
  .quote { font-weight:700; font-size:38px; color:#fff; line-height:1.4; text-align:center; max-width:860px; margin-bottom:20px; }
  .result { font-weight:800; font-size:28px; color:${BRAND.lightGreen}; text-align:center; margin-bottom:12px; }
  .name { font-weight:400; font-size:22px; color:rgba(255,255,255,0.6); margin-bottom:auto; }
  .product-zone { margin-top:40px; display:flex; align-items:center; gap:30px; }
  .product-zone img { height:200px; width:auto; object-fit:contain; filter:drop-shadow(0 10px 30px rgba(0,0,0,0.3)); }
  .product-label { color:rgba(255,255,255,0.8); font-weight:600; font-size:20px; text-align:left; line-height:1.5; }
  .brand { position:absolute; top:30px; right:40px; font-weight:800; font-size:16px; color:rgba(255,255,255,0.25); letter-spacing:2px; }
  .days-badge { position:absolute; top:30px; left:40px; background:rgba(255,255,255,0.15); color:white; font-weight:800; font-size:18px; padding:10px 20px; border-radius:30px; }
</style></head><body>
  <div class="brand">OERGEZOND</div>
  <div class="days-badge">${days} dagen</div>
  <div class="stars">★★★★★</div>
  <div class="quote">"${quote}"</div>
  <div class="result">${result}</div>
  <div class="name">— ${name}</div>
  <div class="product-zone">
    <img src="data:image/png;base64,${PRODUCT_MAIN_B64}">
    <div class="product-label">Oercrème Naturel<br>100% grasgevoerd rundvet<br>5 ingrediënten</div>
  </div>
</body></html>`;
}

function memeProductAd({ topText, bottomText, bgColor }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1080px; height:1350px; background:${bgColor || "#111"}; font-family:'Inter',sans-serif; display:flex; flex-direction:column; position:relative; }
  .section { flex:1; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px 60px; }
  .section-top { background:rgba(192,57,43,0.1); }
  .section-bottom { background:rgba(39,174,96,0.08); }
  .section-top .text { color:#e74c3c; }
  .section-bottom .text { color:#27ae60; }
  .text { font-weight:800; font-size:38px; text-align:center; line-height:1.3; max-width:800px; }
  .divider { height:4px; background:rgba(255,255,255,0.1); }
  .product-float { position:absolute; bottom:60px; right:60px; }
  .product-float img { height:180px; width:auto; object-fit:contain; filter:drop-shadow(0 10px 20px rgba(0,0,0,0.2)); }
  .brand { position:absolute; bottom:20px; left:60px; font-weight:800; font-size:16px; color:rgba(255,255,255,0.2); letter-spacing:2px; }
  .vs { background:rgba(255,255,255,0.15); color:white; font-weight:900; font-size:28px; padding:12px 28px; border-radius:50%; }
</style></head><body>
  <div class="section section-top">
    <div class="text">${topText}</div>
  </div>
  <div style="display:flex;align-items:center;justify-content:center;padding:12px 0;background:rgba(255,255,255,0.05);">
    <div class="vs">VS</div>
  </div>
  <div class="section section-bottom">
    <div class="text">${bottomText}</div>
  </div>
  <div class="product-float"><img src="data:image/png;base64,${PRODUCT_MAIN_B64}"></div>
  <div class="brand">OERGEZOND</div>
</body></html>`;
}

// ============================================================
// 15 ADS
// ============================================================

const ADS = [
  // ANGLE 1: Handgeschreven briefje (3x)
  { name: "briefje_v2_1", fn: () => heroProductAd({
    headline: "Bij elke bestelling schrijven we je een persoonlijk briefje.",
    subtext: "Geen mega-fabriek. Geen lopende band. Gewoon Jorn & Rosa die je pakketje inpakken met zorg.",
    ctaText: "Bekijk Oercrème", bgColor: BRAND.cream, textColor: BRAND.green, productSize: 380, productPosition: "right",
  })},
  { name: "briefje_v2_2", fn: () => heroProductAd({
    headline: "Dit zit er bij elke bestelling van Oergezond.",
    subtext: "Een handgeschreven briefje. Omdat je geen ordernummer bent maar een mens.",
    ctaText: "Ontdek waarom", bgColor: "#ffffff", textColor: BRAND.darkBrown, productSize: 400, productPosition: "center",
  })},
  { name: "briefje_v2_3", fn: () => heroProductAd({
    headline: "Wanneer heb je voor het laatst een handgeschreven briefje gekregen?",
    subtext: "Bij ons krijg je er eentje. Bij elke bestelling.",
    ctaText: "", bgColor: BRAND.green, textColor: "#ffffff", productSize: 350, productPosition: "right",
  })},

  // ANGLE 2: Bonnetje / vergelijking ingrediënten (3x)
  { name: "bonnetje_v2_1", fn: () => splitComparisonAd({
    headline: "Wat betaal je eigenlijk voor troep?",
    leftTitle: "Drogist — €14,99",
    leftItems: ["Aqua (water)", "Paraffinum Liquidum", "Cetearyl Alcohol", "Phenoxyethanol", "Methylparaben", "Propylparaben", "BHT", "Parfum (synthetisch)", "+ 15 andere stoffen"],
    rightTitle: "Oercrème — €28,95",
    rightItems: ["Grasgevoerd rundvet", "Olijfolie", "Bijenwas", "Essentiële olie", "Vitamine E", "", "Dat is alles.", "", "Gaat 3x langer mee."],
  })},
  { name: "bonnetje_v2_2", fn: () => heroProductAd({
    headline: "€0,32 per dag voor huidverzorging zonder troep.",
    subtext: "Oercrème gaat 90 dagen mee. Goedkoper dan je dagcrème van de drogist. En zonder de 23 chemicaliën.",
    ctaText: "Reken het na", bgColor: BRAND.warmWhite, textColor: BRAND.darkBrown, productSize: 420, productPosition: "center",
  })},
  { name: "bonnetje_v2_3", fn: () => heroProductAd({
    headline: "Draai je dagcrème om. Lees de ingrediënten. Schrik je?",
    subtext: "De meeste crèmes bevatten 20+ synthetische stoffen. Oercrème bevat er 5. Allemaal herkenbaar.",
    ctaText: "Bekijk onze ingrediënten", bgColor: BRAND.cream, textColor: BRAND.green, productSize: 380, productPosition: "right",
  })},

  // ANGLE 3: Vergelijking (3x)
  { name: "vergelijking_v2_1", fn: () => splitComparisonAd({
    headline: "Wat zit er écht in je bodylotion?",
    leftTitle: "Gewone bodylotion",
    leftItems: ["70% water", "Petroleumderivaten", "Synthetische geur", "Hormoonverstorende parabenen", "Siliconen (bedekt, herstelt niet)", "Gaat 30 dagen mee"],
    rightTitle: "Oercrème",
    rightItems: ["0% water", "Grasgevoerd rundvet", "Essentiële oliën", "Geen parabenen", "Voedt de huidbarrière", "Gaat 90 dagen mee"],
  })},
  { name: "vergelijking_v2_2", fn: () => splitComparisonAd({
    headline: "Nivea vs. Oercrème",
    leftTitle: "Nivea Creme — 12+ stoffen",
    leftItems: ["Aqua", "Paraffinum Liquidum", "Cera Microcristallina", "Glycerin", "Lanolin Alcohol", "Decyl Oleate", "Octyldodecanol", "Aluminum Stearate", "Parfum"],
    rightTitle: "Oercrème — 5 stoffen",
    rightItems: ["Grasgevoerd rundvet", "Olijfolie", "Bijenwas", "Essentiële olie", "Vitamine E", "", "", "", "Klaar."],
  })},
  { name: "vergelijking_v2_3", fn: () => heroProductAd({
    headline: "Je smeert elke dag gemiddeld 168 chemicaliën op je huid.",
    subtext: "Of je begint met 1 product dat puur is. 5 ingrediënten. 0 troep.",
    ctaText: "Begin met Oercrème", bgColor: "#1a1a1a", textColor: "#ffffff", productSize: 400, productPosition: "center",
  })},

  // ANGLE 4: Meme/herkenning (3x)
  { name: "meme_v2_1", fn: () => memeProductAd({
    topText: "10-staps skincare routine\nmet 47 ingrediënten per product",
    bottomText: "1 potje Oercrème\nmet 5 ingrediënten",
    bgColor: "#111",
  })},
  { name: "meme_v2_2", fn: () => memeProductAd({
    topText: "De ingrediëntenlijst\nvan je dagcrème lezen",
    bottomText: "De ingrediëntenlijst\nvan Oercrème lezen",
    bgColor: "#0a0a0a",
  })},
  { name: "meme_v2_3", fn: () => memeProductAd({
    topText: "€200/maand aan skincare\nen nog steeds droge huid",
    bottomText: "€28,95 voor 3 maanden\nen je huid is hersteld",
    bgColor: "#111",
  })},

  // ANGLE 5: Resultaat na 30 dagen (3x)
  { name: "resultaat_v2_1", fn: () => testimonialProductAd({
    quote: "Na 2 weken was mijn eczeem bijna helemaal weg. Na een maand was mijn huid zachter dan ooit.",
    name: "Lisa, 34", result: "Eczeem → hersteld in 30 dagen", days: "30", bgColor: BRAND.green,
  })},
  { name: "resultaat_v2_2", fn: () => testimonialProductAd({
    quote: "Ik gebruik het nu voor mijn hele gezin. De kinderen hebben geen last meer van droge plekken.",
    name: "Sanne, 38", result: "Heel gezin overgestapt", days: "60", bgColor: "#2d3a2d",
  })},
  { name: "resultaat_v2_3", fn: () => testimonialProductAd({
    quote: "Mijn vrouw lachte me uit toen ik crème van rundvet kocht. Nu gebruikt ze het zelf elke dag.",
    name: "Mark, 41", result: "Van sceptisch → dagelijks gebruiker", days: "14", bgColor: BRAND.darkBrown,
  })},
];

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(`Genereer ${ADS.length} ad creatives (v2 — met product)...\n`);

  for (let i = 0; i < ADS.length; i++) {
    const ad = ADS[i];
    console.log(`[${i+1}/${ADS.length}] ${ad.name}...`);
    try {
      const html = ad.fn();
      const buffer = await htmlToImage(html);
      fs.writeFileSync(path.join(OUT_DIR, `${ad.name}.png`), buffer);
      console.log(`  ✅ ${ad.name}.png`);
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }
    await sleep(300);
  }

  console.log(`\nKlaar! ${ADS.length} creatives in ${OUT_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
