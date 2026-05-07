#!/usr/bin/env node
"use strict";

const puppeteer = require("puppeteer");
const path = require("path");

const html = `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    color: #1a1a1a;
    background: #fff;
    font-size: 13px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    padding: 48px 56px;
  }

  .header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 40px;
  }

  .header-left h1 {
    font-size: 28px;
    font-weight: 800;
    color: #1a1a1a;
    margin-bottom: 12px;
  }

  .company-info {
    font-size: 12.5px;
    color: #555;
    line-height: 1.6;
  }

  .logo {
    width: 90px;
    height: auto;
  }

  .logo-text {
    font-size: 32px;
    font-weight: 800;
    color: #4b5a3c;
    letter-spacing: -0.5px;
  }
  .logo-text span { color: #c0392b; }

  .meta-section {
    display: flex;
    justify-content: space-between;
    margin-bottom: 36px;
    gap: 40px;
  }

  .address-block {
    flex: 1;
  }

  .address-block h3 {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #4b5a3c;
    margin-bottom: 8px;
  }

  .address-block p {
    font-size: 12.5px;
    color: #333;
    line-height: 1.6;
  }

  .invoice-meta {
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    padding: 14px 20px;
    min-width: 200px;
  }

  .invoice-meta-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
    font-size: 13px;
  }

  .invoice-meta-row .label {
    color: #777;
    font-weight: 500;
  }

  .invoice-meta-row .value {
    font-weight: 700;
    color: #1a1a1a;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 28px;
  }

  thead th {
    text-align: left;
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1px;
    color: #4b5a3c;
    padding: 10px 12px;
    border-bottom: 2px solid #4b5a3c;
  }

  thead th:nth-child(4),
  thead th:nth-child(5),
  thead th:nth-child(6) {
    text-align: right;
  }

  tbody td {
    padding: 14px 12px;
    font-size: 13px;
    color: #333;
    border-bottom: 1px solid #eee;
    vertical-align: top;
  }

  tbody td:nth-child(4),
  tbody td:nth-child(5),
  tbody td:nth-child(6) {
    text-align: right;
  }

  .free-label {
    color: #c0392b;
    font-weight: 600;
    font-size: 11px;
  }

  .strikethrough {
    text-decoration: line-through;
    color: #999;
    font-size: 12px;
  }

  .totals-wrapper {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 36px;
  }

  .totals {
    width: 320px;
    border: 1px solid #e0e0e0;
    border-radius: 8px;
    overflow: hidden;
  }

  .totals-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 20px;
    font-size: 13px;
  }

  .totals-row .label { color: #555; }
  .totals-row .value { font-weight: 600; color: #1a1a1a; }

  .totals-row.highlight {
    background: #4b5a3c;
    color: #fff;
    font-weight: 700;
    font-size: 15px;
  }
  .totals-row.highlight .label { color: #fff; }
  .totals-row.highlight .value { color: #fff; }

  .totals-row.paid {
    background: #f4f6f0;
  }
  .totals-row.paid .value { color: #4b5a3c; font-weight: 700; }

  .totals-row.open .label { font-weight: 700; }
  .totals-row.open .value { font-weight: 700; }

  .shipping-section {
    margin-bottom: 24px;
    padding-top: 16px;
    border-top: 1px solid #eee;
  }

  .shipping-section h3 {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    color: #4b5a3c;
    margin-bottom: 8px;
  }

  .shipping-section p {
    font-size: 12.5px;
    color: #555;
    line-height: 1.7;
  }

  .footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #eee;
    font-size: 12px;
    color: #999;
    line-height: 1.6;
  }

  .btw-note {
    font-size: 11px;
    color: #777;
    margin-top: 4px;
    font-style: italic;
  }

  .paid-stamp {
    position: absolute;
    top: 340px;
    right: 100px;
    transform: rotate(-15deg);
    font-size: 48px;
    font-weight: 800;
    color: rgba(75, 90, 60, 0.08);
    letter-spacing: 8px;
    text-transform: uppercase;
    pointer-events: none;
  }
</style>
</head>
<body>

<div class="paid-stamp">BETAALD</div>

<div class="header">
  <div class="header-left">
    <h1>Factuur</h1>
    <div class="company-info">
      Oergezond<br>
      Belkmerweg 58<br>
      1753GD, Sint Maartensvlotbrug<br>
      Nederland<br>
      0614508290<br>
      KvK-nummer: 92911404
    </div>
  </div>
  <div>
    <div class="logo-text">OER<span>GEZOND</span></div>
  </div>
</div>

<div class="meta-section">
  <div class="address-block">
    <h3>Verkocht aan:</h3>
    <p>
      Suzan Kleppe<br>
      rebeLief<br>
      Dorpsstraat 90<br>
      2211 GD Noordwijkerhout<br>
      Netherlands
    </p>
  </div>
  <div class="address-block">
    <h3>Verzenden naar:</h3>
    <p>
      Suzan Kleppe<br>
      rebeLief<br>
      Dorpsstraat 90<br>
      2211 GD Noordwijkerhout<br>
      Netherlands
    </p>
  </div>
  <div class="invoice-meta">
    <div class="invoice-meta-row">
      <span class="label">Factuur:</span>
      <span class="value">#9377</span>
    </div>
    <div class="invoice-meta-row">
      <span class="label">Datum:</span>
      <span class="value">23/03/2026</span>
    </div>
    <div class="invoice-meta-row">
      <span class="label">BTW-tarief:</span>
      <span class="value">21%</span>
    </div>
  </div>
</div>

<table>
  <thead>
    <tr>
      <th>SKU</th>
      <th>Titel</th>
      <th>Aantal</th>
      <th>Prijs excl. BTW</th>
      <th>BTW 21%</th>
      <th>Bedrag incl. BTW</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>154117848896</td>
      <td>Oercrème - Naturel</td>
      <td>2</td>
      <td>&euro; 23,93</td>
      <td>&euro; 5,02</td>
      <td>&euro; 57,90</td>
    </tr>
    <tr>
      <td>154117848896</td>
      <td>Oercrème - Naturel <span class="free-label">(GRATIS)</span></td>
      <td>1</td>
      <td><span class="strikethrough">&euro; 23,93</span><br>&euro; 0,00</td>
      <td>&euro; 0,00</td>
      <td>&euro; 0,00</td>
    </tr>
  </tbody>
</table>

<div class="totals-wrapper">
  <div class="totals">
    <div class="totals-row">
      <span class="label">Subtotaal excl. BTW:</span>
      <span class="value">&euro; 47,85</span>
    </div>
    <div class="totals-row">
      <span class="label">BTW 21%:</span>
      <span class="value">&euro; 10,05</span>
    </div>
    <div class="totals-row">
      <span class="label">Verzending:</span>
      <span class="value">GRATIS</span>
    </div>
    <div class="totals-row highlight">
      <span class="label">Totaal incl. BTW:</span>
      <span class="value">&euro; 57,90</span>
    </div>
    <div class="totals-row paid">
      <span class="label">Betaald bedrag:</span>
      <span class="value">&euro; 57,90</span>
    </div>
    <div class="totals-row open">
      <span class="label">Openstaand bedrag:</span>
      <span class="value">&euro; 0,00</span>
    </div>
  </div>
</div>

<div class="shipping-section">
  <h3>Verzendgegevens</h3>
  <p>
    <strong>Verzendbedrijf:</strong> DHL Parcel<br>
    <strong>Volgnummer:</strong> JVGL0638661900168497185<br>
    <strong>Betaalmethode:</strong> Credit Card
  </p>
</div>

<div class="footer">
  Heb je vragen? Stuur dan een e-mail naar contact@oergezond.com<br>
  Bedankt voor je bestelling!
</div>

</body>
</html>`;

async function main() {
  console.log("Factuur Suzan Kleppe genereren...");

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 30000 });
    } catch {
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 15000 });
    }
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise((r) => setTimeout(r, 8000)),
    ]);

    const outputPath = path.join("C:\\Users\\rosav\\Downloads", "Factuur-9377-Suzan-Kleppe.pdf");

    await page.pdf({
      path: outputPath,
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });

    console.log("PDF opgeslagen: " + outputPath);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
