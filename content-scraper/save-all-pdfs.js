#!/usr/bin/env node
"use strict";
const fs = require("fs");
const puppeteer = require("puppeteer");

async function generatePdf(scriptPath, outName) {
  const code = fs.readFileSync(scriptPath, "utf8");
  // Extract the HTML template string from the buildHtml function
  const start = code.indexOf("return `<!DOCTYPE html>");
  if (start === -1) { console.log("Skip " + scriptPath); return; }
  // Find the matching backtick
  let depth = 0;
  let end = -1;
  for (let i = start + 8; i < code.length; i++) {
    if (code[i] === "`" && code[i-1] !== "\\") { end = i; break; }
  }
  if (end === -1) { console.log("No end backtick for " + scriptPath); return; }
  const html = code.substring(start + 8, end);

  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"] });
  try {
    const page = await browser.newPage();
    try { await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 }); }
    catch { await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 }); }
    await Promise.race([page.evaluate(() => document.fonts.ready), new Promise(r => setTimeout(r, 10000))]);
    const buf = await page.pdf({ format: "A4", printBackground: true, margin: { top: "48px", bottom: "48px", left: "0", right: "0" } });
    fs.writeFileSync("pdfs/" + outName, Buffer.from(buf));
    console.log(outName + ": " + (buf.length / 1024).toFixed(0) + " KB");
  } finally { await browser.close(); }
}

async function main() {
  fs.mkdirSync("pdfs", { recursive: true });
  await generatePdf("generate-zaadolien-gids.js", "zaadolien-gids.pdf");
  await generatePdf("generate-fast-fashion-gids.js", "fast-fashion-gids.pdf");
  await generatePdf("generate-labvoedsel-gids.js", "lab-voedsel-gids.pdf");
  console.log("Alle PDFs opgeslagen in pdfs/");
}
main().catch(e => { console.error("FOUT:", e.message); process.exit(1); });
