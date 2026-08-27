#!/usr/bin/env node
/**
 * Genereer Oergezond reel covers als PNG en stuur naar Telegram.
 * Run: node generate-reel-covers.js
 */

"use strict";

const https = require("https");
const puppeteer = require("puppeteer");
const cfg = require("./config.js");

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

const covers = [
  {
    titel: "Wat zit er écht\nin je eten?",
    subtitel: "Draai het etiket om",
    icon: "🏷️",
    bg: "linear-gradient(160deg, #4b5a3c 0%, #2d3625 100%)",
  },
  {
    titel: "Je huid is\neen spons",
    subtitel: "26 seconden tot je bloed",
    icon: "🧴",
    bg: "linear-gradient(160deg, #5c6b4a 0%, #3a4530 100%)",
  },
  {
    titel: "Zaadoliën zijn\nhet nieuwe roken",
    subtitel: "Wat de industrie verzwijgt",
    icon: "🛢️",
    bg: "linear-gradient(160deg, #4b5a3c 0%, #1f2a17 100%)",
  },
  {
    titel: "Waarom je\naltijd moe bent",
    subtitel: "Het ligt niet aan je slaap",
    icon: "⚡",
    bg: "linear-gradient(160deg, #5a6948 0%, #333d28 100%)",
  },
  {
    titel: "De voedings-\npiramide is\neen leugen",
    subtitel: "Wie betaalde het onderzoek?",
    icon: "🔺",
    bg: "linear-gradient(160deg, #4b5a3c 0%, #2a3320 100%)",
  },
  {
    titel: "Wat zon écht\ndoet met\nje lichaam",
    subtitel: "Het is niet wat ze zeggen",
    icon: "☀️",
    bg: "linear-gradient(160deg, #6b7a58 0%, #4b5a3c 100%)",
  },
  {
    titel: "Je dermatoloog\nweet dit niet",
    subtitel: "En dat is het probleem",
    icon: "🩺",
    bg: "linear-gradient(160deg, #4b5a3c 0%, #252e1c 100%)",
  },
  {
    titel: "Hormoon-\nverstorders\nin je badkamer",
    subtitel: "Ze staan op het etiket",
    icon: "⚠️",
    bg: "linear-gradient(160deg, #556644 0%, #3a4530 100%)",
  },
  {
    titel: "Eet zoals je\novergrootmoeder",
    subtitel: "Terug naar echt voedsel",
    icon: "🥩",
    bg: "linear-gradient(160deg, #5c6b4a 0%, #2d3625 100%)",
  },
  {
    titel: "Kunstlicht\nmaakt je ziek",
    subtitel: "Je slaapprobleem is een lichtprobleem",
    icon: "🌙",
    bg: "linear-gradient(160deg, #3d4a30 0%, #1f2a17 100%)",
  },
  {
    titel: "De maagzuur-\nremmer leugen",
    subtitel: "Je hebt te weinig, niet te veel",
    icon: "💊",
    bg: "linear-gradient(160deg, #4b5a3c 0%, #333d28 100%)",
  },
  {
    titel: "Wat tallow\ndoet voor\nje huid",
    subtitel: "Je huid herkent het",
    icon: "✋",
    bg: "linear-gradient(160deg, #6b7a58 0%, #4b5a3c 100%)",
  },
];

function buildCoverHtml(cover) {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1080px; height: 1920px;
    font-family: 'Inter', sans-serif;
    background: ${cover.bg};
    color: #fff;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    position: relative;
    overflow: hidden;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  /* Subtle grain texture */
  body::before {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0; bottom: 0;
    background: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.03'/%3E%3C/svg%3E");
    pointer-events: none;
  }

  /* Decorative line top */
  .line-top {
    position: absolute;
    top: 120px;
    width: 60px;
    height: 3px;
    background: rgba(255,255,255,0.3);
    border-radius: 2px;
  }

  .logo {
    position: absolute;
    top: 160px;
    font-size: 22px;
    font-weight: 700;
    letter-spacing: 6px;
    text-transform: uppercase;
    opacity: 0.5;
  }

  .icon {
    font-size: 72px;
    margin-bottom: 48px;
    filter: grayscale(20%);
  }

  .titel {
    font-size: 82px;
    font-weight: 900;
    line-height: 1.05;
    letter-spacing: -2px;
    padding: 0 80px;
    margin-bottom: 32px;
    text-shadow: 0 4px 30px rgba(0,0,0,0.3);
  }

  .subtitel {
    font-size: 30px;
    font-weight: 500;
    opacity: 0.7;
    letter-spacing: 1px;
    padding: 0 100px;
    line-height: 1.4;
  }

  /* Bottom bar */
  .bottom {
    position: absolute;
    bottom: 100px;
    display: flex;
    align-items: center;
    gap: 12px;
    opacity: 0.4;
  }

  .bottom-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #fff;
  }

  .bottom-text {
    font-size: 18px;
    font-weight: 600;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  /* Decorative corner elements */
  .corner-tl, .corner-br {
    position: absolute;
    width: 40px;
    height: 40px;
    border-color: rgba(255,255,255,0.15);
    border-style: solid;
  }
  .corner-tl {
    top: 60px; left: 60px;
    border-width: 2px 0 0 2px;
  }
  .corner-br {
    bottom: 60px; right: 60px;
    border-width: 0 2px 2px 0;
  }
</style>
</head>
<body>
  <div class="corner-tl"></div>
  <div class="corner-br"></div>
  <div class="line-top"></div>
  <div class="logo">Oergezond</div>
  <div class="icon">${cover.icon}</div>
  <div class="titel">${cover.titel}</div>
  <div class="subtitel">${cover.subtitel}</div>
  <div class="bottom">
    <div class="bottom-dot"></div>
    <div class="bottom-text">@oergezond</div>
  </div>
</body>
</html>`;
}

async function sendTelegramPhoto(buffer, caption) {
  const boundary = "----FormBoundary" + Date.now();
  const parts = [
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${cfg.TELEGRAM_CHAT_ID}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="cover.png"\r\nContent-Type: image/png\r\n\r\n`),
    buffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ];
  const body = Buffer.concat(parts);

  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${cfg.TELEGRAM_TOKEN}/sendPhoto`,
      method: "POST",
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": body.length },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function sendTelegramMessage(text) {
  const body = JSON.stringify({ chat_id: cfg.TELEGRAM_CHAT_ID, text, parse_mode: "Markdown" });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${cfg.TELEGRAM_TOKEN}/sendMessage`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log(`Genereer ${covers.length} reel covers...`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1080, height: 1920 });

    await sendTelegramMessage(`*Oergezond Reel Covers*\n${covers.length} covers in huisstijl — klaar om in Canva te bewerken`);

    for (let i = 0; i < covers.length; i++) {
      const cover = covers[i];
      const cleanTitle = cover.titel.replace(/\n/g, " ");
      console.log(`[${i + 1}/${covers.length}] ${cleanTitle}`);

      const html = buildCoverHtml(cover);
      try {
        await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
      } catch {
        await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });
      }

      await Promise.race([
        page.evaluate(() => document.fonts.ready),
        new Promise((r) => setTimeout(r, 8000)),
      ]);

      const pngBuffer = await page.screenshot({ type: "png", clip: { x: 0, y: 0, width: 1080, height: 1920 } });
      const buf = Buffer.from(pngBuffer);

      const res = await sendTelegramPhoto(buf, `*${i + 1}/${covers.length}* — ${cleanTitle}`);
      if (!res.ok) console.error(`  Telegram fout: ${JSON.stringify(res).slice(0, 200)}`);
      else console.log(`  Verstuurd ✅`);

      await sleep(1500);
    }

    console.log("Klaar!");
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
