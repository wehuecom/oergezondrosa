#!/usr/bin/env node
/**
 * Pro Ad Generator — Freepik achtergronden + product compositing
 * 1:1 (1080x1080), product echt in de scene geplaatst
 */
"use strict";

const puppeteer = require("../content-scraper/node_modules/puppeteer");
const https = require("https");
const fs = require("fs");
const path = require("path");

const FREEPIK_KEY = "FPSXc2ce7b40e656ebd745c0edf70515147e";
const OUT_DIR = __dirname;
const PRODUCT_B64 = fs.readFileSync(path.join(__dirname, "product-photos", "oercreme_main.png")).toString("base64");

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ============================================================
// FREEPIK MYSTIC — Achtergrond genereren
// ============================================================

function freepikRequest(reqPath, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: "api.freepik.com", path: reqPath,
      method: body ? "POST" : "GET",
      headers: {
        "Content-Type": "application/json",
        "x-freepik-api-key": FREEPIK_KEY,
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
      },
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => { try { resolve(JSON.parse(data)); } catch (e) { reject(e); } });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function fetchImageAsBase64(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith("https") ? https : require("http");
    mod.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchImageAsBase64(res.headers.location).then(resolve).catch(reject);
      }
      const chunks = [];
      res.on("data", c => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks).toString("base64")));
    }).on("error", reject);
  });
}

async function generateBackground(prompt) {
  const create = await freepikRequest("/v1/ai/mystic", {
    prompt,
    negative_prompt: "text, watermark, people, faces, logo, blurry, low quality, letters, words, numbers",
    image: { size: "square_1_1" },
    styling: { style: "photo", color: "warm", lightning: "cinematic" },
  });

  const taskId = create?.data?.task_id;
  if (!taskId) throw new Error("Geen Freepik task_id: " + JSON.stringify(create).slice(0, 200));

  for (let i = 0; i < 50; i++) {
    await sleep(3000);
    const poll = await freepikRequest(`/v1/ai/mystic/${taskId}`);
    const url = poll?.data?.generated?.[0];
    if (url && typeof url === "string") return await fetchImageAsBase64(url);
    if (poll?.data?.status === "FAILED") throw new Error("Freepik taak mislukt");
  }
  throw new Error("Freepik timeout");
}

// ============================================================
// PUPPETEER — Composite achtergrond + product + tekst → 1080x1080
// ============================================================

async function htmlToImage(html) {
  const browser = await puppeteer.launch({
    headless: true, timeout: 60000,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1080, deviceScaleFactor: 1 });
    try { await page.setContent(html, { waitUntil: "networkidle0", timeout: 20000 }); }
    catch { await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 10000 }); }
    await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 5000))]);
    return await page.screenshot({ type: "png", fullPage: false });
  } finally { await browser.close(); }
}

function compositeHtml(bgB64, { headline, subtext, productSize, productX, productY, textAlign, textColor, overlay }) {
  const pSize = productSize || 380;
  const pX = productX || 640;
  const pY = productY || 580;
  const tAlign = textAlign || "left";
  const tColor = textColor || "#ffffff";
  const overlayColor = overlay || "rgba(0,0,0,0.35)";

  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1080px; height:1080px; position:relative; overflow:hidden; font-family:'Inter',sans-serif; }
  .bg { position:absolute; inset:0; background-image:url('data:image/png;base64,${bgB64}'); background-size:cover; background-position:center; }
  .overlay { position:absolute; inset:0; background:${overlayColor}; }
  .text-zone { position:absolute; top:60px; ${tAlign === "left" ? "left:56px; right:480px;" : tAlign === "right" ? "right:56px; left:480px; text-align:right;" : "left:56px; right:56px; text-align:center;"} }
  .headline { font-weight:900; font-size:52px; color:${tColor}; line-height:1.12; margin-bottom:16px; text-shadow: 0 2px 20px rgba(0,0,0,0.3); }
  .subtext { font-weight:500; font-size:22px; color:${tColor}; opacity:0.85; line-height:1.5; text-shadow: 0 1px 10px rgba(0,0,0,0.3); }
  .product { position:absolute; left:${pX}px; top:${pY}px; width:${pSize}px; height:${pSize}px; }
  .product img { width:100%; height:100%; object-fit:contain; filter:drop-shadow(0 15px 40px rgba(0,0,0,0.35)); }
  .brand { position:absolute; bottom:24px; left:56px; font-weight:800; font-size:16px; color:${tColor}; opacity:0.5; letter-spacing:3px; text-shadow: 0 1px 5px rgba(0,0,0,0.3); }
  .badge { position:absolute; bottom:24px; right:56px; background:rgba(255,255,255,0.15); backdrop-filter:blur(10px); color:${tColor}; font-weight:700; font-size:16px; padding:8px 20px; border-radius:20px; }
</style></head><body>
  <div class="bg"></div>
  <div class="overlay"></div>
  <div class="text-zone">
    <div class="headline" id="hl">${headline}</div>
    <div class="subtext">${subtext}</div>
  </div>
  <div class="product"><img src="data:image/png;base64,${PRODUCT_B64}"></div>
  <div class="brand">OERGEZOND</div>
  <div class="badge">5 ingrediënten · 0 troep</div>
  <script>
    const el=document.getElementById('hl');let s=52;
    while(el.scrollHeight>250&&s>28){s-=2;el.style.fontSize=s+'px';}
  </script>
</body></html>`;
}

function comparisonCompositeHtml(bgB64, { headline, leftTitle, leftItems, rightTitle, rightItems }) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { width:1080px; height:1080px; position:relative; overflow:hidden; font-family:'Inter',sans-serif; }
  .bg { position:absolute; inset:0; background-image:url('data:image/png;base64,${bgB64}'); background-size:cover; }
  .overlay { position:absolute; inset:0; background:rgba(0,0,0,0.7); }
  .headline { position:absolute; top:40px; left:48px; right:48px; font-weight:900; font-size:40px; color:white; line-height:1.15; text-align:center; }
  .columns { position:absolute; top:140px; left:32px; right:32px; bottom:200px; display:flex; gap:16px; }
  .col { flex:1; border-radius:16px; padding:24px 20px; display:flex; flex-direction:column; }
  .col-left { background:rgba(192,57,43,0.2); border:1px solid rgba(192,57,43,0.4); }
  .col-right { background:rgba(39,174,96,0.2); border:1px solid rgba(39,174,96,0.4); }
  .col-title { font-weight:800; font-size:18px; margin-bottom:14px; text-transform:uppercase; letter-spacing:1px; }
  .col-left .col-title { color:#e74c3c; }
  .col-right .col-title { color:#2ecc71; }
  .item { font-size:16px; color:rgba(255,255,255,0.85); margin-bottom:6px; line-height:1.35; }
  .col-left .item { opacity:0.65; text-decoration:line-through; }
  .bottom { position:absolute; bottom:0; left:0; right:0; height:180px; background:rgba(75,90,60,0.95); display:flex; align-items:center; padding:0 48px; gap:24px; }
  .bottom-product img { height:140px; width:auto; object-fit:contain; filter:drop-shadow(0 8px 20px rgba(0,0,0,0.4)); }
  .bottom-text { color:white; font-weight:700; font-size:24px; line-height:1.3; }
  .bottom-sub { color:rgba(255,255,255,0.6); font-weight:400; font-size:16px; margin-top:6px; }
</style></head><body>
  <div class="bg"></div>
  <div class="overlay"></div>
  <div class="headline">${headline}</div>
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
    <div class="bottom-product"><img src="data:image/png;base64,${PRODUCT_B64}"></div>
    <div>
      <div class="bottom-text">Oercrème — simpel maar effectief</div>
      <div class="bottom-sub">Grasgevoerd rundvet · 5 ingrediënten · Gaat 90 dagen mee</div>
    </div>
  </div>
</body></html>`;
}

// ============================================================
// AD DEFINITIONS — 15 ads, 5 angles × 3 variaties
// ============================================================

const ADS = [
  // ANGLE 1: Handgeschreven briefje
  { name: "briefje_pro_1", bgPrompt: "Warm wooden desk with a handwritten note on craft paper, small dried flowers, warm morning light, cozy atmosphere, overhead view, cream tones, no text no people",
    config: { headline: "Bij elke bestelling schrijven we je een persoonlijk briefje.", subtext: "Geen mega-fabriek. Gewoon Jorn & Rosa die je pakketje inpakken.", productSize: 320, productX: 680, productY: 620, textAlign: "left", textColor: "#ffffff", overlay: "rgba(0,0,0,0.4)" }},
  { name: "briefje_pro_2", bgPrompt: "Close up of craft paper wrapping with twine and dried herbs on rustic wooden surface, warm golden light, natural aesthetic, no text no people no faces",
    config: { headline: "Dit zit er bij elke bestelling van Oergezond.", subtext: "Een handgeschreven briefje. Omdat je geen ordernummer bent maar een mens.", productSize: 350, productX: 640, productY: 580, textAlign: "left", textColor: "#ffffff", overlay: "rgba(0,0,0,0.45)" }},
  { name: "briefje_pro_3", bgPrompt: "Minimal kraft paper envelope on marble counter with rosemary sprig, soft daylight, clean minimal aesthetic, warm tones, no text no people",
    config: { headline: "Wanneer heb je voor het laatst een handgeschreven briefje gekregen?", subtext: "Bij ons krijg je er eentje. Bij elke bestelling.", productSize: 340, productX: 660, productY: 600, textAlign: "left", textColor: "#ffffff", overlay: "rgba(30,30,20,0.5)" }},

  // ANGLE 2: Bonnetje / ingrediënten vergelijking
  { name: "bonnetje_pro_1", bgPrompt: "Dark moody bathroom counter with various commercial skincare products bottles and jars scattered, harsh fluorescent light, clinical cold feeling, no text no people",
    type: "comparison", config: { headline: "Wat betaal je eigenlijk voor troep?", leftTitle: "Drogist — €14,99", leftItems: ["Aqua (water)", "Paraffinum Liquidum", "Cetearyl Alcohol", "Phenoxyethanol", "Methylparaben", "BHT", "Parfum (synthetisch)", "+ 15 andere stoffen"], rightTitle: "Oercrème — €28,95", rightItems: ["Grasgevoerd rundvet", "Olijfolie", "Bijenwas", "Essentiële olie", "Vitamine E", "", "Dat is alles.", "Gaat 3x langer mee."] }},
  { name: "bonnetje_pro_2", bgPrompt: "Close up of a store receipt on a bathroom counter next to skincare products, cold clinical light, slightly messy, realistic, no text no people",
    config: { headline: "€0,32 per dag voor huidverzorging zonder troep.", subtext: "Oercrème gaat 90 dagen mee. Goedkoper dan je dagcrème. Zonder de 23 chemicaliën.", productSize: 380, productX: 620, productY: 560, textAlign: "left", textColor: "#ffffff", overlay: "rgba(0,0,0,0.5)" }},
  { name: "bonnetje_pro_3", bgPrompt: "Someone turning over a commercial skincare product to read ingredient list, blurred bathroom background, warm light, close up of product label, no faces no text",
    config: { headline: "Draai je dagcrème om. Lees de ingrediënten. Schrik je?", subtext: "De meeste crèmes bevatten 20+ synthetische stoffen. Oercrème bevat er 5.", productSize: 340, productX: 660, productY: 600, textAlign: "left", textColor: "#ffffff", overlay: "rgba(0,0,0,0.45)" }},

  // ANGLE 3: Vergelijking
  { name: "vergelijking_pro_1", bgPrompt: "Dark moody split scene - left side industrial factory with metal pipes, right side peaceful green meadow with grazing cows, dramatic contrast, no text",
    type: "comparison", config: { headline: "Wat zit er écht in je bodylotion?", leftTitle: "Gewone bodylotion", leftItems: ["70% water", "Petroleumderivaten", "Synthetische geur", "Hormoonverstorende parabenen", "Siliconen", "Gaat 30 dagen mee"], rightTitle: "Oercrème", rightItems: ["0% water", "Grasgevoerd rundvet", "Essentiële oliën", "Geen parabenen", "Voedt de huidbarrière", "Gaat 90 dagen mee"] }},
  { name: "vergelijking_pro_2", bgPrompt: "Side by side comparison, left side: many colorful commercial skincare bottles crowded together, right side: single elegant glass jar on natural stone, dramatic lighting, no text no people",
    type: "comparison", config: { headline: "Nivea vs. Oercrème", leftTitle: "Nivea — 12+ stoffen", leftItems: ["Aqua", "Paraffinum Liquidum", "Cera Microcristallina", "Glycerin", "Lanolin Alcohol", "Decyl Oleate", "Aluminum Stearate", "Parfum"], rightTitle: "Oercrème — 5 stoffen", rightItems: ["Grasgevoerd rundvet", "Olijfolie", "Bijenwas", "Essentiële olie", "Vitamine E", "", "", "Klaar."] }},
  { name: "vergelijking_pro_3", bgPrompt: "Dark dramatic close up of chemical laboratory glassware with colored liquids, ominous cold blue lighting, scientific industrial feeling, no text no people",
    config: { headline: "168 chemicaliën per dag op je huid.", subtext: "Of je begint met 1 product dat puur is. 5 ingrediënten. 0 troep.", productSize: 400, productX: 600, productY: 540, textAlign: "left", textColor: "#ffffff", overlay: "rgba(0,0,0,0.5)" }},

  // ANGLE 4: Meme / herkenning
  { name: "meme_pro_1", bgPrompt: "Overhead photo of messy bathroom counter covered in many skincare products bottles tubes, chaotic, too many products, warm light, no text no people",
    config: { headline: "10-staps skincare routine. 47 ingrediënten per product.", subtext: "Of gewoon 1 potje. 5 ingrediënten. Betere huid.", productSize: 360, productX: 640, productY: 580, textAlign: "left", textColor: "#ffffff", overlay: "rgba(0,0,0,0.5)" }},
  { name: "meme_pro_2", bgPrompt: "Close up of a commercial skincare product ingredient label with tiny unreadable text, blurred background, cold light, alarming feeling, no faces",
    config: { headline: "Kun jij de ingrediënten van je dagcrème uitspreken?", subtext: "Wij wel. Rundvet. Olijfolie. Bijenwas. Olie. Vitamine E.", productSize: 340, productX: 660, productY: 600, textAlign: "left", textColor: "#ffffff", overlay: "rgba(0,0,0,0.5)" }},
  { name: "meme_pro_3", bgPrompt: "Pile of money euros burning, dramatic dark background, fire and smoke, waste concept, moody dramatic lighting, no text no people",
    config: { headline: "€200/maand aan skincare. Nog steeds droge huid.", subtext: "€28,95 voor 3 maanden Oercrème. Huid hersteld.", productSize: 350, productX: 650, productY: 590, textAlign: "left", textColor: "#ffffff", overlay: "rgba(0,0,0,0.5)" }},

  // ANGLE 5: Resultaat / testimonial
  { name: "resultaat_pro_1", bgPrompt: "Soft close up of healthy glowing skin texture, natural soft light, warm tones, dewy fresh skin, no face just skin detail, beauty editorial",
    config: { headline: "\"Na 2 weken was mijn eczeem weg. Na een maand was mijn huid zachter dan ooit.\"", subtext: "— Lisa, 34 · 30 dagen Oercrème", productSize: 300, productX: 700, productY: 660, textAlign: "left", textColor: "#ffffff", overlay: "rgba(75,90,60,0.55)" }},
  { name: "resultaat_pro_2", bgPrompt: "Mother and child hands touching gently, soft warm light, tender moment, natural skin, no faces visible just hands and arms, warm tones",
    config: { headline: "\"Ik gebruik het nu voor mijn hele gezin. Geen droge plekken meer.\"", subtext: "— Sanne, 38 · 60 dagen Oercrème", productSize: 280, productX: 720, productY: 680, textAlign: "left", textColor: "#ffffff", overlay: "rgba(45,58,45,0.55)" }},
  { name: "resultaat_pro_3", bgPrompt: "Man looking at himself in bathroom mirror, confident, healthy skin, warm morning light, natural grooming, no visible face details just silhouette and light",
    config: { headline: "\"Mijn vrouw lachte me uit. Nu steelt ze mijn potje.\"", subtext: "— Mark, 41 · 14 dagen Oercrème", productSize: 300, productX: 700, productY: 660, textAlign: "left", textColor: "#ffffff", overlay: "rgba(0,0,0,0.45)" }},
];

// ============================================================
// MAIN
// ============================================================

async function main() {
  console.log(`\nGenereer ${ADS.length} pro ad creatives (1080x1080)\n`);

  for (let i = 0; i < ADS.length; i++) {
    const ad = ADS[i];
    console.log(`[${i+1}/${ADS.length}] ${ad.name}...`);

    try {
      // Genereer achtergrond via Freepik
      console.log("  Achtergrond genereren...");
      const bgB64 = await generateBackground(ad.bgPrompt);
      console.log("  Achtergrond klaar, compositing...");

      let html;
      if (ad.type === "comparison") {
        html = comparisonCompositeHtml(bgB64, ad.config);
      } else {
        html = compositeHtml(bgB64, ad.config);
      }

      const buffer = await htmlToImage(html);
      const outPath = path.join(OUT_DIR, `${ad.name}.png`);
      fs.writeFileSync(outPath, buffer);
      console.log(`  ✅ ${ad.name}.png`);
    } catch (e) {
      console.log(`  ❌ ${e.message}`);
    }

    await sleep(1000); // Rate limit buffer
  }

  console.log(`\nKlaar! Check ${OUT_DIR}`);
}

main().catch(e => { console.error(e); process.exit(1); });
