#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");
const puppeteer = require(path.join(__dirname, "..", "content-scraper", "node_modules", "puppeteer"));

const md = fs.readFileSync(path.join(__dirname, "opwarmplan-oergezond-app.md"), "utf-8");

function mdToHtml(text) {
  let html = text;
  // Escape HTML
  html = html.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

  // Code blocks → styled boxes
  html = html.replace(/```([\s\S]*?)```/g, (_, code) =>
    `<div class="code-block">${code.trim().replace(/\n/g, "<br>")}</div>`
  );

  // Tables
  html = html.replace(/((?:\|.*\|[ \t]*\n)+)/g, (tableBlock) => {
    const rows = tableBlock.trim().split("\n").filter(r => r.trim());
    if (rows.length < 2) return tableBlock;
    const parseRow = r => r.split("|").slice(1, -1).map(c => c.trim());
    const headerCells = parseRow(rows[0]);
    // skip separator row
    const startIdx = rows[1] && rows[1].match(/^\|[\s\-:|]+\|$/) ? 2 : 1;
    let t = "<table><thead><tr>" + headerCells.map(c => `<th>${applyInline(c)}</th>`).join("") + "</tr></thead><tbody>";
    for (let i = startIdx; i < rows.length; i++) {
      const cells = parseRow(rows[i]);
      t += "<tr>" + cells.map(c => `<td>${applyInline(c)}</td>`).join("") + "</tr>";
    }
    t += "</tbody></table>";
    return t;
  });

  // Headers
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^#### (.+)$/gm, '<h4>$1</h4>');

  // Blockquotes
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

  // Horizontal rules
  html = html.replace(/^---$/gm, '<hr>');

  // Checkboxes
  html = html.replace(/^- \[ \] (.+)$/gm, '<div class="checkbox">☐ $1</div>');

  // List items
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');

  // Paragraphs for remaining lines
  html = html.replace(/^(?!<[hubltrd/]|<hr|<block|<div|<ul)(.+)$/gm, '<p>$1</p>');

  // Inline formatting
  html = applyInline(html);

  // Clean up empty paragraphs
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}

function applyInline(text) {
  text = text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return text;
}

function buildHtml(content) {
  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;800&family=Inter:wght@400;500;600;700&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', sans-serif;
    color: #1a1a1a;
    background: #fff;
    font-size: 12px;
    line-height: 1.6;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding: 0;
  }

  .cover {
    page-break-after: always;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: linear-gradient(160deg, #4b5a3c 0%, #2d3625 100%);
    color: #fff;
    text-align: center;
    padding: 80px 60px;
  }
  .cover-label { font-size: 12px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; opacity: 0.5; margin-bottom: 32px; }
  .cover-title { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
  .cover-title span { color: #a8c090; }
  .cover-subtitle { font-size: 16px; opacity: 0.8; max-width: 500px; line-height: 1.6; margin-bottom: 48px; }
  .cover-features { display: flex; flex-wrap: wrap; gap: 12px; justify-content: center; margin-bottom: 48px; }
  .cover-feature { background: rgba(255,255,255,0.1); padding: 8px 16px; border-radius: 20px; font-size: 12px; font-weight: 500; }
  .cover-line { width: 60px; height: 2px; background: rgba(255,255,255,0.3); margin-bottom: 48px; }
  .cover-brand { font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.4; }

  .content { padding: 40px 50px; }

  h1 {
    font-family: 'Playfair Display', serif;
    font-size: 28px;
    font-weight: 800;
    color: #2d3625;
    margin: 40px 0 16px;
    page-break-after: avoid;
    border-bottom: 3px solid #4b5a3c;
    padding-bottom: 8px;
  }
  h2 {
    font-family: 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: #4b5a3c;
    margin: 28px 0 12px;
    page-break-after: avoid;
  }
  h3 {
    font-size: 15px;
    font-weight: 700;
    color: #2d3625;
    margin: 20px 0 8px;
    page-break-after: avoid;
  }
  h4 {
    font-size: 13px;
    font-weight: 700;
    color: #4b5a3c;
    margin: 16px 0 6px;
    page-break-after: avoid;
  }
  p {
    font-size: 12px;
    color: #333;
    margin-bottom: 8px;
    line-height: 1.7;
    orphans: 3;
    widows: 3;
  }
  strong { font-weight: 700; color: #1a1a1a; }
  em { font-style: italic; color: #555; }

  ul {
    margin: 8px 0 12px 20px;
    padding: 0;
  }
  li {
    font-size: 12px;
    color: #333;
    margin-bottom: 4px;
    line-height: 1.6;
  }

  blockquote {
    background: #f4f6f0;
    border-left: 4px solid #4b5a3c;
    padding: 12px 16px;
    margin: 12px 0;
    font-size: 12px;
    color: #444;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
  }

  .code-block {
    background: #f8f8f8;
    border: 1px solid #e0e0e0;
    border-left: 4px solid #4b5a3c;
    padding: 12px 16px;
    margin: 8px 0 12px;
    font-family: 'Courier New', monospace;
    font-size: 11px;
    line-height: 1.5;
    color: #333;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin: 12px 0;
    font-size: 11px;
    page-break-inside: avoid;
  }
  th {
    background: #4b5a3c;
    color: #fff;
    font-weight: 600;
    text-align: left;
    padding: 8px 12px;
  }
  th:first-child { border-radius: 4px 0 0 0; }
  th:last-child { border-radius: 0 4px 0 0; }
  td {
    padding: 7px 12px;
    border-bottom: 1px solid #eee;
    color: #333;
  }
  tr:nth-child(even) td { background: #fafafa; }

  hr {
    border: none;
    height: 1px;
    background: #ddd;
    margin: 24px 0;
  }

  .checkbox {
    font-size: 12px;
    padding: 6px 0;
    color: #333;
    border-bottom: 1px solid #eee;
  }

  .footer {
    text-align: center;
    font-size: 10px;
    color: #999;
    margin-top: 40px;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-label">Launch Playbook</div>
  <div class="cover-title">Opwarmplan<br><span>Oergezond App</span></div>
  <div class="cover-subtitle">Het complete plan om jullie audience op te warmen voor de app launch — van eerste hint tot duizenden downloads.</div>
  <div class="cover-features">
    <div class="cover-feature">Barcode Scanner</div>
    <div class="cover-feature">Boerderijwinkel Kaart</div>
    <div class="cover-feature">Weekmenu's</div>
    <div class="cover-feature">Ademhaling</div>
    <div class="cover-feature">Workouts</div>
    <div class="cover-feature">Community</div>
  </div>
  <div class="cover-line"></div>
  <div class="cover-brand">Oergezond</div>
</div>

<div class="content">
${content}
<div class="footer">Oergezond App Launch Playbook — Intern document — Mei 2026</div>
</div>

</body>
</html>`;
}

async function main() {
  console.log("Converting markdown to HTML...");
  const contentHtml = mdToHtml(md);
  const fullHtml = buildHtml(contentHtml);

  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"]
  });

  const page = await browser.newPage();
  await page.setContent(fullHtml, { waitUntil: "networkidle0" });

  const outPath = path.join(__dirname, "Oergezond-App-Opwarmplan.pdf");
  await page.pdf({
    path: outPath,
    format: "A4",
    printBackground: true,
    margin: { top: "20mm", bottom: "20mm", left: "0", right: "0" }
  });

  await browser.close();
  console.log("PDF opgeslagen:", outPath);
}

main().catch(err => { console.error(err); process.exit(1); });
