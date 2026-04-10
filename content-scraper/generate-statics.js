/**
 * Static Post Generator
 * =====================
 * Genereert PNG afbeeldingen voor:
 * 1. Carousel (5 slides: cover + 4 content)
 * 2. Nieuws post (Gemini achtergrond + tekst overlay)
 * 3. Tweet post (groene blader achtergrond, witte kaart)
 */

"use strict";

const puppeteer = require("puppeteer");
const https = require("https");
const fs = require("fs");
const path = require("path");
const cfg = require("./config.js");

const GEMINI_KEY = cfg.GEMINI_API_KEY;
const FREEPIK_KEY = cfg.FREEPIK_API_TOKEN;
const BRAND_GREEN = "#4b5a3c";

// Echte logo's uit de originele templates geladen
const LOGO_DARK_B64 = fs.readFileSync(path.join(__dirname, "templates", "logo-dark.png")).toString("base64");
const LOGO_LIGHT_B64 = fs.readFileSync(path.join(__dirname, "templates", "logo-light.png")).toString("base64");
const LOGO_LIGHT_TRANSPARENT_B64 = fs.readFileSync(path.join(__dirname, "templates", "logo-light-transparent.png")).toString("base64");

// Logo HTML — gebruikt de echte geëxtraheerde logo PNG
const LOGO_HTML = (size = 70, dark = true, circle = false) => {
  const b64 = dark ? LOGO_DARK_B64 : LOGO_LIGHT_B64;
  const extra = circle ? "border-radius:50%;object-fit:cover;" : "object-fit:contain;";
  return `<img src="data:image/png;base64,${b64}" style="width:${size}px;height:${size}px;flex-shrink:0;display:block;${extra}">`;
};

// ============================================================
// PUPPETEER — HTML → PNG
// ============================================================
async function htmlToImage(html, width = 1080, height = 1080) {
  const browser = await puppeteer.launch({
    headless: true,
    timeout: 60000,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--disable-extensions",
      "--no-first-run",
      "--no-zygote",
    ],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width, height, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    const buffer = await page.screenshot({ type: "png", fullPage: false });
    return buffer;
  } finally {
    await browser.close();
  }
}

// ============================================================
// FREEPIK MYSTIC — ACHTERGROND GENEREREN (async polling)
// ============================================================
function freepikRequest(path, body = null) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request(
      {
        hostname: "api.freepik.com",
        path,
        method: body ? "POST" : "GET",
        headers: {
          "Content-Type": "application/json",
          "Accept-Language": "en-US",
          "x-freepik-api-key": FREEPIK_KEY,
          ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve(JSON.parse(data)); }
          catch (e) { reject(e); }
        });
      }
    );
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

async function generateFreepikBackground(prompt) {
  // Start de Mystic taak
  const create = await freepikRequest("/v1/ai/mystic", {
    prompt,
    negative_prompt: "text, watermark, people, faces, logo, blurry, low quality",
    image: { size: "square_1_1" },
    styling: { style: "photo", color: "dark", lightning: "studio" },
  });

  const taskId = create?.data?.task_id;
  if (!taskId) throw new Error("Geen task_id van Freepik Mystic: " + JSON.stringify(create).substring(0, 200));

  // Poll totdat klaar (max 150s) — Mystic geeft URL terug
  for (let i = 0; i < 50; i++) {
    await new Promise(r => setTimeout(r, 3000));
    const poll = await freepikRequest(`/v1/ai/mystic/${taskId}`);
    const status = poll?.data?.status;
    const url = poll?.data?.generated?.[0];
    if (url && typeof url === "string") return await fetchImageAsBase64(url);
    if (status === "FAILED") throw new Error("Freepik Mystic taak mislukt");
  }
  throw new Error("Freepik Mystic timeout na 150s");
}

// ============================================================
// 1. CAROUSEL
// ============================================================

function carouselCoverHtml(title, subtitle) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1080px;
    background: #ffffff;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 80px;
    position: relative;
  }
  .logo-wrap { position: absolute; top: 48px; left: 48px; }
  .title {
    font-family: 'Playfair Display', serif;
    font-weight: 800;
    font-size: 68px;
    color: ${BRAND_GREEN};
    text-align: center;
    line-height: 1.15;
    margin-bottom: 32px;
    font-style: normal;
  }
  .subtitle {
    font-family: 'Open Sans', sans-serif;
    font-weight: 400;
    font-size: 30px;
    color: #222;
    text-align: center;
    line-height: 1.5;
    max-width: 800px;
  }
  .divider {
    width: 60px; height: 3px;
    background: ${BRAND_GREEN};
    margin: 36px auto;
  }
  .arrow {
    position: absolute;
    bottom: 48px; right: 56px;
    font-size: 36px;
    color: ${BRAND_GREEN};
    font-family: 'Open Sans', sans-serif;
    font-weight: 600;
  }
</style>
</head>
<body>
  <div class="logo-wrap">${LOGO_HTML(72, true)}</div>
  <div class="title">${title}</div>
  <div class="divider"></div>
  <div class="subtitle">${subtitle}</div>
  <div class="arrow">→</div>
</body>
</html>`;
}

function carouselSlideHtml(slideNum, totalSlides, headline, body) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Open+Sans:wght@400;600&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1080px;
    background: #ffffff;
    display: flex; flex-direction: column;
    justify-content: center;
    padding: 80px 88px;
    position: relative;
  }
  .slide-num {
    font-family: 'Open Sans', sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: ${BRAND_GREEN};
    letter-spacing: 3px;
    margin-bottom: 48px;
    opacity: 0.7;
  }
  .headline {
    font-family: 'Playfair Display', serif;
    font-weight: 800;
    font-size: 60px;
    color: ${BRAND_GREEN};
    line-height: 1.2;
    margin-bottom: 36px;
    font-style: normal;
  }
  .accent-line {
    width: 48px; height: 3px;
    background: ${BRAND_GREEN};
    margin-bottom: 36px;
    opacity: 0.5;
  }
  .body-text {
    font-family: 'Open Sans', sans-serif;
    font-size: 30px;
    color: #222;
    line-height: 1.6;
    max-width: 860px;
  }
  .logo-wrap { position: absolute; bottom: 48px; left: 56px; }
  .arrow { position: absolute; bottom: 48px; right: 56px; font-size: 36px; color: ${BRAND_GREEN}; font-family: 'Open Sans', sans-serif; font-weight: 600; }
</style>
</head>
<body>
  <div class="slide-num">0${slideNum} / 0${totalSlides}</div>
  <div class="headline">${headline}</div>
  <div class="accent-line"></div>
  <div class="body-text">${body}</div>
  <div class="logo-wrap">${LOGO_HTML(56, true)}</div>
  <div class="arrow">→</div>
</body>
</html>`;
}

async function generateCarousel(data) {
  // data: { title, subtitle, slides: [{headline, body}] }
  const buffers = [];

  const cover = await htmlToImage(carouselCoverHtml(data.title, data.subtitle));
  buffers.push({ name: "cover", buffer: cover });

  for (let i = 0; i < data.slides.length; i++) {
    const slide = data.slides[i];
    const html = carouselSlideHtml(i + 1, data.slides.length, slide.headline, slide.body);
    const buf = await htmlToImage(html);
    buffers.push({ name: `slide_${i + 1}`, buffer: buf });
  }

  return buffers;
}

// ============================================================
// 2. NIEUWS POST
// ============================================================

async function generateNewsPost(data) {
  // data: { headline, highlightWords: [], imagePrompt }

  // Genereer achtergrond via Freepik
  let photoBgBase64 = null;
  try {
    const freepikPrompt = `${data.imagePrompt}. Context: news headline about "${data.headline}". Conceptual dark moody photo, no text, no people, no faces, dark background, high contrast, editorial style`;
    photoBgBase64 = await generateFreepikBackground(freepikPrompt);
  } catch (e) {
    console.log("Freepik niet beschikbaar voor nieuws post:", e.message.slice(0, 80));
  }

  // Bouw headline HTML — wit tekst, highlight woorden in brand groen
  let headlineHtml = data.headline;
  (data.highlightWords || []).forEach((word) => {
    const regex = new RegExp(`(${word})`, "gi");
    headlineHtml = headlineHtml.replace(
      regex,
      `<span style="color:${BRAND_GREEN};">$1</span>`
    );
  });

  // Achtergrond afbeelding (Freepik) of lege dark zone
  const bgStyle = photoBgBase64
    ? `background-image: url('data:image/jpeg;base64,${photoBgBase64}'); background-size: cover; background-position: center;`
    : `background: #093e38;`;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Open+Sans:wght@700;800&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px;
    background: #02100e;
    position: relative; overflow: hidden;
  }
  /* Foto als volledige bovenste achtergrond */
  .photo-bg {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 780px;
    ${bgStyle}
  }
  /* Schaduw overloop */
  .photo-fade {
    position: absolute;
    top: 560px; left: 0; right: 0;
    height: 220px;
    background: linear-gradient(to bottom, transparent 0%, #02100e 100%);
  }
  /* Onderste sectie */
  .bottom {
    position: absolute;
    top: 720px; left: 0; right: 0; bottom: 0;
    display: flex; flex-direction: column;
  }
  /* Divider: logo gecentreerd met ruimte tussen lijnen en logo */
  .divider-row {
    position: relative;
    width: 100%;
    height: 200px;
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  /* Twee aparte lijnen — eindigen op 120px van het midden, zodat er ruimte is rond het logo */
  .divider-line-left {
    position: absolute;
    left: 48px; right: calc(50% + 120px);
    top: 140px;
    height: 1.5px;
    background: rgba(255,255,255,0.45);
  }
  .divider-line-right {
    position: absolute;
    left: calc(50% + 120px); right: 48px;
    top: 140px;
    height: 1.5px;
    background: rgba(255,255,255,0.45);
  }
  .logo-wrap {
    position: relative;
    z-index: 2;
    line-height: 0;
  }
  /* Tekst sectie */
  .text-section {
    flex: 1;
    padding: 24px 60px 56px;
    text-align: center;
    display: flex; align-items: center; justify-content: center;
  }
  .headline {
    font-family: 'Open Sans', sans-serif;
    font-weight: 800;
    font-size: 68px;
    color: #ffffff;
    line-height: 1.2;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }
</style>
</head>
<body>
  <div class="photo-bg"></div>
  <div class="photo-fade"></div>
  <div class="bottom">
    <div class="divider-row">
      <div class="divider-line-left"></div>
      <div class="divider-line-right"></div>
      <div class="logo-wrap">
        <img src="data:image/png;base64,${LOGO_LIGHT_TRANSPARENT_B64}" style="height:200px;width:auto;display:block;">
      </div>
    </div>
    <div class="text-section">
      <div class="headline" id="hl">${headlineHtml}</div>
    </div>
  </div>
  <script>
    const el = document.getElementById('hl');
    const maxH = 520;
    let size = 68;
    el.style.fontSize = size + 'px';
    while (el.scrollHeight > maxH && size > 28) {
      size -= 2;
      el.style.fontSize = size + 'px';
    }
  </script>
</body>
</html>`;

  return await htmlToImage(html, 1080, 1350);
}

// ============================================================
// 3. TWEET POST — exact template overlay
// ============================================================

async function generateTweetPost(data) {
  const fs = require("fs");
  const path = require("path");
  const bgBase64 = fs.readFileSync(
    path.join(__dirname, "templates", "tweet-template.png")
  ).toString("base64");

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@800&family=Open+Sans:wght@400;600;700&display=swap" rel="stylesheet">
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1350px;
    position: relative; overflow: hidden;
  }
  .bg {
    position: absolute; inset: 0;
    background-image: url('data:image/png;base64,${bgBase64}');
    background-size: 1080px 1350px;
    background-position: center;
  }
  /* Transparant overlay op de template kaart — alleen tekst, header zit al in template */
  .card {
    position: absolute;
    top: 265px; left: 68px;
    width: 944px; height: 670px;
    background: transparent;
    border-radius: 10px;
    padding: 210px 52px 48px;
    display: flex; flex-direction: column;
  }
  .tweet-text {
    font-family: 'Open Sans', sans-serif;
    font-weight: 400; font-size: 44px;
    color: #0f1419; line-height: 1.6;
  }
</style>
</head>
<body>
  <div class="bg"></div>
  <div class="card">
    <div class="tweet-text" id="txt">${data.text}</div>
  </div>
  <script>
    const el = document.getElementById('txt');
    const maxH = 412; // beschikbare hoogte in de kaart (670 - 210 padding-top - 48 padding-bottom)
    let size = 64;
    el.style.fontSize = size + 'px';
    while (el.scrollHeight > maxH && size > 28) {
      size -= 2;
      el.style.fontSize = size + 'px';
    }
  </script>
</body>
</html>`;

  return await htmlToImage(html, 1080, 1350);
}

module.exports = { generateCarousel, generateNewsPost, generateTweetPost };
