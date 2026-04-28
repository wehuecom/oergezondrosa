/**
 * Viral Reels Report Generator
 * =============================
 * Neemt gescrapete reels, doet deep research via Claude,
 * genereert nieuwe scripts in Oergezond brand voice,
 * rendert een professionele PDF via Puppeteer en stuurt naar Telegram.
 *
 * Gebruik:
 *   const { generateViralReelsReport } = require("./viral-reels-report.js");
 *   const pdfBuffer = await generateViralReelsReport(reels, config);
 */

"use strict";

const https = require("https");
const puppeteer = require("puppeteer");

// ============================================================
// HELPERS
// ============================================================

function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(Buffer.isBuffer(body) ? body : (typeof body === "string" ? body : JSON.stringify(body)));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg) {
  const time = new Date().toLocaleTimeString("nl-NL");
  console.log(`[${time}] [reels-report] ${msg}`);
}

function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatNumber(n) {
  if (!n) return "0";
  if (n >= 1000000) return (n / 1000000).toFixed(1).replace(".0", "") + "M";
  if (n >= 1000) return (n / 1000).toFixed(1).replace(".0", "") + "K";
  return String(n);
}

// ============================================================
// CLAUDE API — met retry voor overloaded errors
// ============================================================

async function callClaude(prompt, apiKey, maxTokens = 4000) {
  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: maxTokens,
    messages: [{ role: "user", content: prompt }],
  });

  const maxRetries = 4;
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const res = await httpsRequest(
      {
        hostname: "api.anthropic.com",
        path: "/v1/messages",
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      body
    );

    if (res.status === 200) {
      return res.body.content[0].text;
    }

    const isOverloaded =
      res.status === 529 ||
      res.status === 529 ||
      (res.body && res.body.error && res.body.error.type === "overloaded_error");
    const isRateLimit = res.status === 429;

    if ((isOverloaded || isRateLimit) && attempt < maxRetries) {
      const waitSec = attempt * 20;
      log(`Claude API ${res.status} — poging ${attempt}/${maxRetries}, wacht ${waitSec}s...`);
      await sleep(waitSec * 1000);
      continue;
    }

    throw new Error(`Claude API mislukt (${res.status}): ${JSON.stringify(res.body).slice(0, 300)}`);
  }
}

// ============================================================
// DEEP RESEARCH — per reel
// ============================================================

async function deepResearchReel(reel, apiKey) {
  const prompt = `Je bent een virale content researcher voor Oergezond, een Nederlands gezondheidsplatform.

Analyseer deze virale Instagram reel:
- Account: @${reel.account || reel.ownerUsername || "onbekend"}
- Views: ${formatNumber(reel.views || reel.videoViewCount || 0)}
- Likes: ${formatNumber(reel.likes || reel.likesCount || 0)}
- Comments: ${reel.comments || reel.commentsCount || 0}
- Caption: "${(reel.caption || "").slice(0, 300)}"
- Link: ${reel.url || (reel.shortCode ? "https://www.instagram.com/reel/" + reel.shortCode + "/" : "n/a")}

CONTEXT OVER OERGEZOND:
Oergezond is een Nederlands gezondheidsplatform dat content maakt over oervoeding, natuurlijke huidverzorging (tallow-based), hormoonvriendelijk leven, zaadoliën vermijden, circadiaans ritme, en ancestrale gezondheid.
De content wordt opgenomen door twee mensen (Jorn & Rosa) met een iPhone — geen studio, geen lab, geen dure equipment. Denk: praten naar camera, keuken, buitenopnames, simpele B-roll.

Doe deep research en geef terug als JSON:
{
  "onderwerp": "kort onderwerp in 3-5 woorden",
  "waaromViraal": "waarom werkt deze reel zo goed? Analyseer de hook, het format, de emotionele trigger en de timing. Max 3 zinnen.",
  "wetenschappelijkeBasis": "welke wetenschappelijke bronnen of onderzoeken ondersteunen dit onderwerp? Noem specifieke studies, journals of onderzoekers als die bestaan. Max 4 zinnen.",
  "bronnen": ["bron 1 — bijv. 'Journal of Clinical Nutrition, 2019'", "bron 2"],
  "kernboodschap": "de kernboodschap in 1 zin die Oergezond kan overnemen",
  "relevantVoorOergezond": true/false,
  "redenRelevantie": "leg kort uit waarom dit wel/niet past bij Oergezond en of zij dit realistisch na kunnen maken met een iPhone en geen studio"
}

BELANGRIJK: Zet "relevantVoorOergezond" op false als:
- Het onderwerp NIET past bij oervoeding, natuurlijke gezondheid, huidverzorging, hormonen, zaadoliën, circadiaans ritme of ancestrale gezondheid
- De reel een dure studio, lab, medische apparatuur of professionele setup vereist die niet na te maken is met een iPhone
- Het puur entertainment/comedy is zonder educatieve waarde voor Oergezond's doelgroep

Alleen JSON, geen extra tekst.`;

  const raw = await callClaude(prompt, apiKey, 1500);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    return {
      onderwerp: "Analyse niet beschikbaar",
      waaromViraal: raw.slice(0, 200),
      wetenschappelijkeBasis: "",
      bronnen: [],
      kernboodschap: "",
    };
  }
}

// ============================================================
// SCRIPT GENEREREN — in Oergezond brand voice
// ============================================================

async function generateReelScript(reel, research, apiKey) {
  const prompt = `Je bent de content creator van Oergezond — een Nederlands gezondheidsplatform.

Schrijf een COMPLEET nieuw reel-script in de Oergezond brand voice, gebaseerd op dit virale onderwerp:

Onderwerp: ${research.onderwerp || "gezondheid"}
Kernboodschap: ${research.kernboodschap || reel.caption || ""}
Wetenschappelijke basis: ${research.wetenschappelijkeBasis || "geen specifieke bron"}
Originele caption: "${(reel.caption || "").slice(0, 200)}"

BRAND VOICE REGELS:
- Taal: Nederlands
- Toon: confronterend eerlijk, rustig zelfverzekerd, educatief
- Schrijfstijl: spreektaal, korte zinnen, als een vriend aan de keukentafel
- Gebruik deze woorden: troep, puur, oer-, echt, gewoon, hormoonvriendelijk, grasgevoerd, herstel van binnenuit, zoals de natuur het bedoeld heeft, je huid herkent het, de natuur wint, controle terugpakken, simpel maar effectief
- NOOIT gebruiken: journey, ritual, glow up, clean beauty, superfoods, revolutionair, baanbrekend, holistic, self-care, elevate

Geef terug als JSON:
{
  "hook": "de eerste zin die de kijker stopt met scrollen — max 10 woorden, confronterend of verrassend",
  "script": "volledig transcript van de reel (30-60 seconden spreektijd). Schrijf het als gesproken tekst, niet als opsomming. Gebruik korte paragrafen met witregels ertussen.",
  "cta": "call to action aan het einde — kort en direct",
  "geschatteDuur": "30s / 45s / 60s",
  "visueleInstructies": "wat moet er visueel te zien zijn per sectie van het script — kort beschreven"
}

Alleen JSON, geen extra tekst.`;

  const raw = await callClaude(prompt, apiKey, 2000);
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  try {
    return JSON.parse(jsonMatch ? jsonMatch[0] : raw);
  } catch {
    return {
      hook: "Script niet beschikbaar",
      script: raw.slice(0, 500),
      cta: "",
      geschatteDuur: "?",
      visueleInstructies: "",
    };
  }
}

// ============================================================
// HTML TEMPLATE — professionele PDF
// ============================================================

function buildReportHtml(reelsData, datum) {
  const reelCards = reelsData
    .map((item, i) => {
      const reel = item.reel;
      const research = item.research;
      const script = item.script;
      const reelUrl = reel.url || (reel.shortCode ? `https://www.instagram.com/reel/${reel.shortCode}/` : "#");
      const account = reel.account || reel.ownerUsername || "onbekend";
      const views = formatNumber(reel.views || reel.videoViewCount || 0);
      const likes = formatNumber(reel.likes || reel.likesCount || 0);
      const comments = reel.comments || reel.commentsCount || 0;

      const bronnenHtml = (research.bronnen || [])
        .map((b) => `<li>${escapeHtml(b)}</li>`)
        .join("");

      const scriptText = escapeHtml(script.script || "").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");

      return `
      <div class="reel-card">
        <div class="reel-header">
          <div class="reel-number">${i + 1}</div>
          <div class="reel-meta">
            <div class="reel-account">@${escapeHtml(account)}</div>
            <div class="reel-stats">
              <span class="stat">${views} views</span>
              <span class="stat">${likes} likes</span>
              <span class="stat">${comments} comments</span>
            </div>
          </div>
          <a class="reel-link" href="${escapeHtml(reelUrl)}">Bekijk reel</a>
        </div>

        <div class="reel-caption">${escapeHtml((reel.caption || "").slice(0, 150))}${(reel.caption || "").length > 150 ? "..." : ""}</div>

        <div class="section research-section">
          <div class="section-label">DEEP RESEARCH</div>
          <div class="research-grid">
            <div class="research-item">
              <div class="research-title">Onderwerp</div>
              <div class="research-value">${escapeHtml(research.onderwerp)}</div>
            </div>
            <div class="research-item">
              <div class="research-title">Waarom viraal</div>
              <div class="research-value">${escapeHtml(research.waaromViraal)}</div>
            </div>
            <div class="research-item full-width">
              <div class="research-title">Wetenschappelijke basis</div>
              <div class="research-value">${escapeHtml(research.wetenschappelijkeBasis)}</div>
            </div>
            ${bronnenHtml ? `<div class="research-item full-width"><div class="research-title">Bronnen</div><ul class="bronnen-list">${bronnenHtml}</ul></div>` : ""}
            <div class="research-item full-width">
              <div class="research-title">Kernboodschap</div>
              <div class="research-value kernboodschap">${escapeHtml(research.kernboodschap)}</div>
            </div>
          </div>
        </div>

        <div class="section script-section">
          <div class="section-label">OERGEZOND SCRIPT</div>
          <div class="script-hook">${escapeHtml(script.hook)}</div>
          <div class="script-body"><p>${scriptText}</p></div>
          <div class="script-footer">
            <div class="script-cta"><strong>CTA:</strong> ${escapeHtml(script.cta)}</div>
            <div class="script-duur">${escapeHtml(script.geschatteDuur)}</div>
          </div>
          ${script.visueleInstructies ? `<div class="visueel"><strong>Visueel:</strong> ${escapeHtml(script.visueleInstructies)}</div>` : ""}
        </div>
      </div>`;
    })
    .join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

  * { margin: 0; padding: 0; box-sizing: border-box; }

  body {
    font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    background: #ffffff;
    color: #1a1a1a;
    font-size: 13px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }

  .cover {
    page-break-after: always;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #4b5a3c;
    color: #ffffff;
    text-align: center;
    padding: 60px;
  }

  .cover-title {
    font-size: 42px;
    font-weight: 800;
    letter-spacing: -0.5px;
    margin-bottom: 12px;
  }

  .cover-subtitle {
    font-size: 18px;
    font-weight: 400;
    opacity: 0.85;
    margin-bottom: 40px;
  }

  .cover-date {
    font-size: 15px;
    font-weight: 500;
    opacity: 0.7;
    border-top: 1px solid rgba(255,255,255,0.3);
    padding-top: 20px;
    margin-top: 20px;
  }

  .cover-count {
    font-size: 64px;
    font-weight: 800;
    margin-bottom: 8px;
    opacity: 0.95;
  }

  .cover-count-label {
    font-size: 16px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 3px;
    opacity: 0.7;
    margin-bottom: 48px;
  }

  .divider-line {
    width: 60px;
    height: 2px;
    background: rgba(255,255,255,0.5);
    margin: 24px auto;
  }

  .content {
    padding: 40px;
  }

  .reel-card {
    page-break-inside: avoid;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    margin-bottom: 32px;
    overflow: hidden;
  }

  .reel-header {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 20px 24px;
    background: #f8faf6;
    border-bottom: 1px solid #e5e7eb;
  }

  .reel-number {
    width: 36px;
    height: 36px;
    border-radius: 50%;
    background: #4b5a3c;
    color: #fff;
    font-weight: 700;
    font-size: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .reel-meta {
    flex: 1;
  }

  .reel-account {
    font-weight: 700;
    font-size: 15px;
    color: #4b5a3c;
  }

  .reel-stats {
    display: flex;
    gap: 12px;
    margin-top: 2px;
  }

  .stat {
    font-size: 12px;
    color: #6b7280;
    font-weight: 500;
  }

  .reel-link {
    font-size: 12px;
    color: #4b5a3c;
    text-decoration: none;
    font-weight: 600;
    border: 1px solid #4b5a3c;
    padding: 6px 14px;
    border-radius: 6px;
    flex-shrink: 0;
  }

  .reel-caption {
    padding: 16px 24px;
    font-size: 12px;
    color: #6b7280;
    font-style: italic;
    border-bottom: 1px solid #f3f4f6;
    line-height: 1.6;
  }

  .section {
    padding: 20px 24px;
  }

  .section-label {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 2px;
    color: #4b5a3c;
    text-transform: uppercase;
    margin-bottom: 14px;
    padding-bottom: 6px;
    border-bottom: 2px solid #4b5a3c;
    display: inline-block;
  }

  .research-section {
    background: #fafbf9;
    border-bottom: 1px solid #e5e7eb;
  }

  .research-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 14px;
  }

  .research-item {
    background: #ffffff;
    border-radius: 8px;
    padding: 12px 14px;
    border: 1px solid #eef0ec;
  }

  .research-item.full-width {
    grid-column: 1 / -1;
  }

  .research-title {
    font-size: 10px;
    font-weight: 700;
    color: #4b5a3c;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 4px;
  }

  .research-value {
    font-size: 12.5px;
    color: #374151;
    line-height: 1.55;
  }

  .kernboodschap {
    font-weight: 600;
    color: #4b5a3c;
    font-size: 13px;
  }

  .bronnen-list {
    list-style: none;
    padding: 0;
  }

  .bronnen-list li {
    font-size: 11.5px;
    color: #6b7280;
    padding: 3px 0;
    padding-left: 14px;
    position: relative;
  }

  .bronnen-list li::before {
    content: "";
    position: absolute;
    left: 0;
    top: 10px;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #4b5a3c;
    opacity: 0.4;
  }

  .script-section {
    background: #ffffff;
  }

  .script-hook {
    font-size: 20px;
    font-weight: 800;
    color: #4b5a3c;
    margin-bottom: 14px;
    line-height: 1.3;
    padding: 14px 18px;
    background: #f0f3ec;
    border-radius: 8px;
    border-left: 4px solid #4b5a3c;
  }

  .script-body {
    font-size: 13px;
    color: #1f2937;
    line-height: 1.7;
    margin-bottom: 16px;
  }

  .script-body p {
    margin-bottom: 8px;
  }

  .script-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: #f8faf6;
    border-radius: 8px;
    margin-bottom: 10px;
  }

  .script-cta {
    font-size: 13px;
    color: #374151;
  }

  .script-duur {
    font-size: 12px;
    font-weight: 600;
    color: #4b5a3c;
    background: #e8eddf;
    padding: 4px 12px;
    border-radius: 20px;
  }

  .visueel {
    font-size: 11.5px;
    color: #6b7280;
    padding: 10px 14px;
    background: #fefefe;
    border: 1px dashed #d1d5db;
    border-radius: 6px;
    line-height: 1.55;
  }

  .footer {
    text-align: center;
    padding: 32px 40px;
    font-size: 11px;
    color: #9ca3af;
    border-top: 1px solid #e5e7eb;
  }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-title">Oergezond</div>
  <div class="cover-subtitle">Viral Reels Report</div>
  <div class="divider-line"></div>
  <div class="cover-count">${reelsData.length}</div>
  <div class="cover-count-label">virale reels geanalyseerd</div>
  <div class="cover-date">${escapeHtml(datum)}</div>
</div>

<div class="content">
  ${reelCards}
</div>

<div class="footer">
  Oergezond Viral Reels Report &mdash; ${escapeHtml(datum)} &mdash; Automatisch gegenereerd
</div>

</body>
</html>`;
}

// ============================================================
// PUPPETEER — HTML naar PDF
// ============================================================

async function htmlToPdf(html) {
  const browser = await puppeteer.launch({
    headless: true,
    timeout: 90000,
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
    try {
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });
    } catch {
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    // Wacht op fonts
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise((r) => setTimeout(r, 10000)),
    ]);
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await browser.close();
  }
}

// ============================================================
// TELEGRAM — PDF versturen
// ============================================================

async function sendTelegramDocument(buffer, filename, caption, config) {
  const boundary = "----FormBoundary" + Date.now();
  const parts = [
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${config.TELEGRAM_CHAT_ID}\r\n`),
  ];
  if (caption) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`));
  }
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`));
  parts.push(buffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  const res = await httpsRequest(
    {
      hostname: "api.telegram.org",
      path: `/bot${config.TELEGRAM_TOKEN}/sendDocument`,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
    },
    body
  );

  if (!res.body?.ok) {
    throw new Error(`Telegram sendDocument mislukt: ${JSON.stringify(res.body).slice(0, 200)}`);
  }

  return res;
}

// ============================================================
// MAIN EXPORT — generateViralReelsReport
// ============================================================

/**
 * Genereert een Viral Reels Report PDF.
 *
 * @param {Array} reels — array van reel objecten (max 8 worden verwerkt)
 *   Elk object: { ownerUsername, type, caption, likesCount, commentsCount, videoViewCount, shortCode }
 * @param {Object} config — { CLAUDE_API_KEY, TELEGRAM_TOKEN, TELEGRAM_CHAT_ID }
 * @param {Object} [options] — { sendToTelegram: true }
 * @returns {Buffer} PDF buffer
 */
async function generateViralReelsReport(reels, config, options = {}) {
  const { sendToTelegram = true } = options;
  const apiKey = config.CLAUDE_API_KEY;

  if (!apiKey) throw new Error("CLAUDE_API_KEY ontbreekt in config");
  if (!reels || reels.length === 0) throw new Error("Geen reels om te verwerken");

  // Normaliseer reel objecten (ondersteun zowel scraper output als gefilterde output)
  const normalizedReels = reels.slice(0, 8).map((r) => ({
    account: r.account || r.ownerUsername || "onbekend",
    caption: r.caption || "",
    likes: r.likes || r.likesCount || 0,
    comments: r.comments || r.commentsCount || 0,
    views: r.views || r.videoViewCount || 0,
    url: r.url || (r.shortCode ? `https://www.instagram.com/reel/${r.shortCode}/` : ""),
    shortCode: r.shortCode || "",
  }));

  log(`Verwerk ${normalizedReels.length} reels...`);

  // Stap 1: Deep research per reel (sequentieel om rate limits te vermijden)
  const reelsData = [];
  for (let i = 0; i < normalizedReels.length; i++) {
    const reel = normalizedReels[i];
    log(`[${i + 1}/${normalizedReels.length}] Deep research: @${reel.account}...`);

    let research;
    try {
      research = await deepResearchReel(reel, apiKey);
    } catch (e) {
      log(`  Research mislukt voor @${reel.account}: ${e.message}`);
      research = {
        onderwerp: "Analyse niet beschikbaar",
        waaromViraal: "Kon niet worden geanalyseerd: " + e.message.slice(0, 100),
        wetenschappelijkeBasis: "",
        bronnen: [],
        kernboodschap: "",
      };
    }

    // Korte pauze tussen API calls
    await sleep(2000);

    // Skip irrelevante reels VOOR script-generatie (scheelt API call)
    if (research.relevantVoorOergezond === false) {
      log(`  ⏭️ @${reel.account} overgeslagen — niet relevant: ${research.redenRelevantie || "geen reden"}`);
      if (i < normalizedReels.length - 1) await sleep(2000);
      continue;
    }

    // Stap 2: Script genereren (alleen voor relevante reels)
    log(`[${i + 1}/${normalizedReels.length}] Script genereren: @${reel.account}...`);

    let script;
    try {
      script = await generateReelScript(reel, research, apiKey);
    } catch (e) {
      log(`  Script mislukt voor @${reel.account}: ${e.message}`);
      script = {
        hook: "Script niet beschikbaar",
        script: "Kon niet worden gegenereerd: " + e.message.slice(0, 100),
        cta: "",
        geschatteDuur: "?",
        visueleInstructies: "",
      };
    }

    reelsData.push({ reel, research, script });

    // Pauze tussen reels
    if (i < normalizedReels.length - 1) {
      await sleep(3000);
    }
  }

  if (reelsData.length === 0) {
    log("Geen relevante reels gevonden na filtering — geen PDF");
    return null;
  }

  // Stap 3: PDF genereren
  log("PDF genereren...");
  const datum = new Date().toLocaleDateString("nl-NL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const html = buildReportHtml(reelsData, datum);
  const pdfBuffer = await htmlToPdf(html);
  log(`PDF gegenereerd: ${(pdfBuffer.length / 1024).toFixed(0)} KB`);

  // Stap 4: Verstuur naar Telegram
  if (sendToTelegram && config.TELEGRAM_TOKEN && config.TELEGRAM_CHAT_ID) {
    log("PDF versturen naar Telegram...");
    const dateStr = new Date().toISOString().slice(0, 10);
    const filename = `viral-reels-report-${dateStr}.pdf`;
    const caption = `*Viral Reels Report — ${datum}*\n${reelsData.length} reels geanalyseerd met deep research + Oergezond scripts`;

    try {
      await sendTelegramDocument(pdfBuffer, filename, caption, config);
      log("PDF verstuurd naar Telegram");
    } catch (e) {
      log(`Telegram versturen mislukt: ${e.message}`);
    }
  }

  return pdfBuffer;
}

module.exports = { generateViralReelsReport };
