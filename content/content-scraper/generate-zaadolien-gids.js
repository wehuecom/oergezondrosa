#!/usr/bin/env node
/**
 * Genereer de Zaadoliën Gids PDF en stuur naar Telegram.
 * Run: node generate-zaadolien-gids.js
 */

"use strict";

const https = require("https");
const puppeteer = require("puppeteer");
const cfg = require("./config.js");

function buildHtml() {
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
    font-size: 14px;
    line-height: 1.6;
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
    background: linear-gradient(160deg, #4b5a3c 0%, #2d3625 100%);
    color: #fff;
    text-align: center;
    padding: 80px 60px;
  }
  .cover-label { font-size: 13px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; opacity: 0.5; margin-bottom: 32px; }
  .cover-title { font-family: 'Playfair Display', serif; font-size: 52px; font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
  .cover-title span { color: #a8c090; }
  .cover-subtitle { font-size: 18px; opacity: 0.8; max-width: 500px; line-height: 1.6; margin-bottom: 48px; }
  .cover-line { width: 60px; height: 2px; background: rgba(255,255,255,0.3); margin-bottom: 48px; }
  .cover-brand { font-size: 16px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.4; }
  .cover-url { font-size: 13px; opacity: 0.3; margin-top: 8px; }

  .page {
    padding: 0 56px;
    margin-bottom: 16px;
  }
  .page:first-of-type { padding-top: 0; }

  .page-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #4b5a3c; margin-bottom: 8px; margin-top: 36px; }
  .page-divider { width: 40px; height: 3px; background: #4b5a3c; margin-bottom: 20px; }
  .page h2 { font-family: 'Playfair Display', serif; font-size: 26px; font-weight: 800; color: #2d3625; line-height: 1.25; margin-bottom: 16px; page-break-after: avoid; }
  .page h3 { font-size: 17px; font-weight: 700; color: #4b5a3c; margin: 22px 0 10px; page-break-after: avoid; }
  .page p { font-size: 13.5px; color: #333; margin-bottom: 12px; line-height: 1.7; orphans: 3; widows: 3; }
  .page .source { font-size: 11px; color: #999; font-style: italic; margin-top: -6px; margin-bottom: 12px; }

  .danger-card {
    background: #fef2f2;
    border-left: 4px solid #c0392b;
    border-radius: 4px;
    padding: 16px 20px;
    margin-bottom: 14px;
    page-break-inside: avoid;
  }
  .danger-card h4 { font-size: 15px; font-weight: 700; color: #c0392b; margin-bottom: 4px; }
  .danger-card p { font-size: 13px; color: #444; margin: 0; line-height: 1.6; }

  .safe-card {
    background: #f4f6f0;
    border-left: 4px solid #4b5a3c;
    border-radius: 4px;
    padding: 16px 20px;
    margin-bottom: 14px;
    page-break-inside: avoid;
  }
  .safe-card h4 { font-size: 15px; font-weight: 700; color: #4b5a3c; margin-bottom: 4px; }
  .safe-card p { font-size: 13px; color: #444; margin: 0; line-height: 1.6; }

  .swap-row {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 12px;
    page-break-inside: avoid;
  }
  .swap-bad {
    flex: 1;
    background: #fef2f2;
    border-left: 4px solid #c0392b;
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    color: #c0392b;
  }
  .swap-arrow { font-size: 20px; font-weight: 700; color: #4b5a3c; }
  .swap-good {
    flex: 1;
    background: #f4f6f0;
    border-left: 4px solid #4b5a3c;
    padding: 12px 16px;
    border-radius: 4px;
    font-size: 14px;
    font-weight: 600;
    color: #4b5a3c;
  }

  .checklist { list-style: none; padding: 0; }
  .checklist li {
    padding: 10px 0 10px 32px;
    border-bottom: 1px solid #eee;
    position: relative;
    font-size: 14px;
    color: #333;
    line-height: 1.5;
    page-break-inside: avoid;
  }
  .checklist li::before {
    content: "✓";
    position: absolute;
    left: 0;
    color: #4b5a3c;
    font-weight: 700;
    font-size: 16px;
  }

  .quote-block {
    border-left: 3px solid #4b5a3c;
    padding: 14px 20px;
    margin: 20px 0;
    background: #f4f6f0;
    border-radius: 0 4px 4px 0;
    page-break-inside: avoid;
  }
  .quote-block p { font-style: italic; color: #444; font-size: 14px; margin: 0; }
  .quote-block cite { display: block; font-size: 11px; color: #999; margin-top: 6px; font-style: normal; }

  .footer-page {
    page-break-before: always;
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: #4b5a3c;
    color: white;
    text-align: center;
    padding: 80px 60px;
  }
  .footer-page h2 { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 800; margin-bottom: 16px; }
  .footer-page p { font-size: 16px; opacity: 0.8; max-width: 460px; line-height: 1.7; margin-bottom: 32px; }
  .footer-page .brand { font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.4; }
  .footer-page .url { font-size: 18px; font-weight: 600; opacity: 0.7; margin-bottom: 8px; }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-label">Gratis gids</div>
  <div class="cover-title">Zaadoliën:<br><span>Het Nieuwe Roken</span></div>
  <div class="cover-subtitle">Alles wat je moet weten over de oliën die je elke dag eet — en waarom je ermee moet stoppen.</div>
  <div class="cover-line"></div>
  <div class="cover-brand">Oergezond</div>
  <div class="cover-url">www.oergezond.com</div>
</div>

<!-- PAGE 1: WAT ZIJN ZAADOLIËN -->
<div class="page">
  <div class="page-label">Hoofdstuk 1</div>
  <div class="page-divider"></div>
  <h2>Wat zijn zaadoliën eigenlijk?</h2>

  <p>Zaadoliën zijn oliën die gewonnen worden uit de zaden van planten. Denk aan zonnebloemolie, sojaolie, koolzaadolie, maïsolie, druivenpitolie en katoenzaadolie.</p>

  <p>Anders dan olijfolie (geperst uit vruchtvlees) of kokosolie (geperst uit vruchtvlees) moeten zaadoliën door een intensief industrieel proces gewonnen worden:</p>

  <h3>Hoe zaadoliën worden gemaakt</h3>
  <p><strong>Stap 1:</strong> De zaden worden vermalen en verwarmd tot hoge temperaturen.</p>
  <p><strong>Stap 2:</strong> Er wordt hexaan doorheen gespoeld — een chemisch oplosmiddel uit de petrochemie — om de laatste druppels olie eruit te halen.</p>
  <p><strong>Stap 3:</strong> De olie wordt gebleekt om de bruine kleur te verwijderen.</p>
  <p><strong>Stap 4:</strong> De olie wordt gedeodoriseerd om de ranzige geur te maskeren.</p>

  <p>Het eindproduct is een heldere, geurloze olie die er "schoon" uitziet. Maar het is een van de meest bewerkte voedingsmiddelen die je kunt kopen.</p>

  <div class="quote-block">
    <p>"De introductie van industrieel verwerkte zaadoliën in het menselijk dieet is het grootste ongecontroleerde experiment in de geschiedenis van de menselijke voeding."</p>
    <cite>— Dr. Cate Shanahan, auteur Deep Nutrition</cite>
  </div>

  <h3>Hoeveel eet je ervan?</h3>
  <p>In 1900 at niemand zaadoliën. Nu maken ze meer dan 20% van de gemiddelde calorie-inname uit. De consumptie van sojaolie alleen is sinds 1909 met meer dan 1.000% gestegen in de VS.</p>
  <p>In Nederland zitten zaadoliën in vrijwel alles: chips, brood, koekjes, sauzen, kant-en-klaarmaaltijden, frituurvet, restauranteten en zelfs in producten die "gezond" worden genoemd.</p>
</div>

<!-- PAGE 2: WAAROM ZIJN ZE SCHADELIJK -->
<div class="page">
  <div class="page-label">Hoofdstuk 2</div>
  <div class="page-divider"></div>
  <h2>Waarom zijn zaadoliën schadelijk?</h2>

  <h3>1. Extreme hoeveelheid omega-6</h3>
  <p>Zaadoliën zijn extreem hoog in linolzuur, een omega-6 vetzuur. In kleine hoeveelheden is omega-6 essentieel. Maar de verhouding omega-6 tot omega-3 in het moderne dieet is volledig uit balans.</p>
  <p>Onze voorouders aten een verhouding van ongeveer 1:1 tot 3:1. Het moderne westerse dieet zit op 20:1 tot 25:1. Die overbelasting aan omega-6 veroorzaakt chronische ontsteking in elk weefsel en elk orgaan.</p>
  <p class="source">Bron: Simopoulos, Biomedicine & Pharmacotherapy, 2002</p>

  <h3>2. Chronische ontsteking</h3>
  <p>Chronische laaggradige ontsteking is de gemeenschappelijke factor achter vrijwel alle moderne welvaartsziekten:</p>

  <div class="danger-card">
    <h4>Hart- en vaatziekten</h4>
    <p>Omega-6 bevordert oxidatie van LDL-cholesterol — de werkelijke trigger voor atherosclerose. De Sydney Diet Heart Study (heranalyse 2013) toonde aan dat het vervangen van dierlijk vet door zaadoliën het sterftecijfer verhoogde.</p>
  </div>
  <p class="source">Bron: Ramsden et al., BMJ, 2013</p>

  <div class="danger-card">
    <h4>Obesitas</h4>
    <p>Linolzuur uit zaadoliën stimuleert het endocannabinoïde systeem — dezelfde receptoren die cannabis activeert. Resultaat: je wordt hongeriger en slaat makkelijker vet op.</p>
  </div>
  <p class="source">Bron: Alvheim et al., Obesity, 2012</p>

  <div class="danger-card">
    <h4>Diabetes type 2</h4>
    <p>Zaadoliën verhogen insulineresistentie door ontsteking in vetweefsel. De stijging van diabetes loopt vrijwel parallel met de stijging van zaadolieconsumptie.</p>
  </div>
  <p class="source">Bron: DiNicolantonio & O'Keefe, Missouri Medicine, 2018</p>

  <div class="danger-card">
    <h4>Depressie en angst</h4>
    <p>Een verstoorde omega-6/omega-3 balans is geassocieerd met hogere incidentie van depressie. Pro-inflammatoire cytokines beïnvloeden je hersenfunctie direct.</p>
  </div>
  <p class="source">Bron: Kiecolt-Glaser et al., Psychosomatic Medicine, 2007</p>

  <h3>3. Oxidatie en vrije radicalen</h3>
  <p>Zaadoliën zijn instabiel bij hitte. Als je ze verhit — wat je doet bij bakken en frituren — oxideren ze en produceren ze aldehyde, een giftig bijproduct. Dit veroorzaakt schade op celniveau en versnelt veroudering.</p>
  <p class="source">Bron: Grootveld et al., Free Radical Research, 2001</p>
</div>

<!-- PAGE 3: WAAR ZIT HET IN -->
<div class="page">
  <div class="page-label">Hoofdstuk 3</div>
  <div class="page-divider"></div>
  <h2>Waar zitten zaadoliën in?</h2>

  <p>Het korte antwoord: bijna overal. Hier de meest voorkomende bronnen.</p>

  <h3>In de supermarkt</h3>
  <div class="danger-card">
    <h4>Chips en snacks</h4>
    <p>Vrijwel alle chips worden gebakken in zonnebloemolie of koolzaadolie. Ook "biologische" chips.</p>
  </div>
  <div class="danger-card">
    <h4>Brood</h4>
    <p>Supermarktbrood bevat bijna altijd zaadoliën. Check het etiket — zonnebloemolie of koolzaadolie staat er standaard bij.</p>
  </div>
  <div class="danger-card">
    <h4>Koekjes, crackers, ontbijtgranen</h4>
    <p>Zaadoliën zijn de standaard vetstof in vrijwel alle verpakte graanproducten.</p>
  </div>
  <div class="danger-card">
    <h4>Sauzen en dressings</h4>
    <p>Mayonaise, ketchup, curry saus, dressings — bijna allemaal op basis van zaadoliën.</p>
  </div>
  <div class="danger-card">
    <h4>Kant-en-klaarmaaltijden</h4>
    <p>Van magnetronmaaltijden tot verse maaltijdboxen — zaadoliën zijn de goedkoopste optie voor fabrikanten.</p>
  </div>
  <div class="danger-card">
    <h4>Margarine en halvarine</h4>
    <p>100% zaadoliën. Vaak gehydrogeneerd, wat transvetten oplevert.</p>
  </div>

  <h3>Buitenshuis</h3>
  <p>Restaurants, cafés, snackbars en fastfoodketens fritturen en bakken vrijwel allemaal in zaadoliën. Het is de goedkoopste optie. Zelfs "gezonde" restaurants gebruiken het meestal.</p>

  <h3>Hoe herken je het op etiketten?</h3>
  <p>Zoek naar deze namen: zonnebloemolie, sojaolie, koolzaadolie, raapzaadolie (canola), maïsolie, druivenpitolie, katoenzaadolie, rijstzemelenolie, plantaardig vet, plantaardige olie.</p>
  <p>Soms staat er "plantaardig vet" of "plantaardige olie" zonder specificatie. Dat is bijna altijd een zaadolie.</p>
</div>

<!-- PAGE 4: WAT WÉL -->
<div class="page">
  <div class="page-label">Hoofdstuk 4</div>
  <div class="page-divider"></div>
  <h2>Wat kun je wél gebruiken?</h2>

  <p>Goede vetten zijn vetten die de mens al duizenden jaren eet. Stabiel bij hitte, niet industrieel verwerkt, en vol vetoplosbare vitamines.</p>

  <div class="safe-card">
    <h4>Roomboter (grasgevoerd)</h4>
    <p>Rijk aan vitamine A, D en K2. Stabiel bij matige hitte. Gebruik voor bakken, braden en als smaakmaker. Kies grasgevoerd voor het beste vetzuurprofiel.</p>
  </div>

  <div class="safe-card">
    <h4>Ghee (geklaarde boter)</h4>
    <p>Boter zonder melkeiwitten — ideaal voor mensen die gevoelig zijn voor zuivel. Hoog rookpunt, perfect om in te bakken. Bevat butyraat, goed voor je darmwand.</p>
  </div>

  <div class="safe-card">
    <h4>Reuzel (varkensvet)</h4>
    <p>Een van de meest stabiele vetten om mee te bakken. Hoog rookpunt en neutraal van smaak. Onze overgrootouders bakten hier alles in.</p>
  </div>

  <div class="safe-card">
    <h4>Tallow (rundvet)</h4>
    <p>Grasgevoerd rundvet. Extreem stabiel bij hoge temperaturen. Rijk aan vetoplosbare vitamines. Perfect voor frituren en braden.</p>
  </div>

  <div class="safe-card">
    <h4>Extra vierge olijfolie</h4>
    <p>Gebruik koudgeperst en in een donkere fles. Ideaal voor salades, koude gerechten en licht bakken. Niet geschikt voor hoge temperaturen.</p>
  </div>

  <div class="safe-card">
    <h4>Kokosolie</h4>
    <p>Stabiel bij hitte, antibacterieel en rijk aan MCT-vetten. Goed voor bakken en als vervanging in recepten die plantaardig vet vragen.</p>
  </div>

  <h3>De snelle swap-lijst</h3>

  <div class="swap-row">
    <div class="swap-bad">Zonnebloemolie</div>
    <div class="swap-arrow">→</div>
    <div class="swap-good">Boter of ghee</div>
  </div>
  <div class="swap-row">
    <div class="swap-bad">Koolzaadolie</div>
    <div class="swap-arrow">→</div>
    <div class="swap-good">Reuzel of kokosolie</div>
  </div>
  <div class="swap-row">
    <div class="swap-bad">Sojaolie</div>
    <div class="swap-arrow">→</div>
    <div class="swap-good">Olijfolie (koud) of tallow (warm)</div>
  </div>
  <div class="swap-row">
    <div class="swap-bad">Margarine</div>
    <div class="swap-arrow">→</div>
    <div class="swap-good">Echte roomboter</div>
  </div>
  <div class="swap-row">
    <div class="swap-bad">Kant-en-klaar sauzen</div>
    <div class="swap-arrow">→</div>
    <div class="swap-good">Zelfgemaakt met boter/olijfolie</div>
  </div>
</div>

<!-- PAGE 5: ACTIEPLAN -->
<div class="page">
  <div class="page-label">Hoofdstuk 5</div>
  <div class="page-divider"></div>
  <h2>Jouw actieplan: zaadoliën eruit in 7 dagen</h2>

  <h3>Dag 1-2: Inventarisatie</h3>
  <ul class="checklist">
    <li>Loop je keuken door en check de etiketten van alle oliën, sauzen, snacks en verpakte producten</li>
    <li>Markeer alles waar zaadoliën in zitten (zonnebloemolie, koolzaadolie, sojaolie, etc.)</li>
    <li>Maak een foto van je "zaadolie-hoek" — je zult schrikken hoeveel het is</li>
  </ul>

  <h3>Dag 3-4: Vervangen</h3>
  <ul class="checklist">
    <li>Koop roomboter (grasgevoerd als je het kunt vinden), ghee en extra vierge olijfolie</li>
    <li>Vervang je bakolie door boter, ghee of reuzel</li>
    <li>Gooi margarine weg en vervang door echte boter</li>
    <li>Zoek chips die gebakken zijn in olijfolie of kokosolie (ze bestaan)</li>
  </ul>

  <h3>Dag 5-6: Buitenshuis</h3>
  <ul class="checklist">
    <li>Vraag in restaurants waar ze in bakken — je krijgt bijna altijd "zonnebloemolie" als antwoord</li>
    <li>Kies gerechten die niet gefrituurd of gebakken zijn als je geen controle hebt over de olie</li>
    <li>Neem je eigen dressing mee (olijfolie + citroensap) als je salade bestelt</li>
  </ul>

  <h3>Dag 7: Nieuwe gewoontes</h3>
  <ul class="checklist">
    <li>Check voortaan elk etiket op zaadoliën voordat je iets koopt</li>
    <li>Kook zoveel mogelijk zelf — dan heb je controle over wat erin gaat</li>
    <li>Onthoud de simpele regel: als je overgrootmoeder het niet zou herkennen als voedsel, eet het dan niet</li>
  </ul>

  <div class="quote-block">
    <p>"Je hoeft niet alles in één keer te veranderen. Begin met je bakolie. Dat alleen al maakt een enorm verschil."</p>
    <cite>— Jorn & Rosa, Oergezond</cite>
  </div>
</div>

<!-- PAGE 6: BRONNEN -->
<div class="page">
  <div class="page-label">Bronnen</div>
  <div class="page-divider"></div>
  <h2>Wetenschappelijke bronnen</h2>

  <p>Alle claims in deze gids zijn gebaseerd op peer-reviewed onderzoek. Hieronder de volledige bronnenlijst.</p>

  <p><strong>Omega-6/omega-3 balans:</strong><br>Simopoulos AP. "The importance of the ratio of omega-6/omega-3 essential fatty acids." Biomedicine & Pharmacotherapy, 2002.</p>

  <p><strong>Hart- en vaatziekten:</strong><br>Ramsden CE et al. "Use of dietary linoleic acid for secondary prevention of coronary heart disease and death." BMJ, 2013. (Heranalyse Sydney Diet Heart Study)</p>

  <p><strong>Obesitas en endocannabinoïden:</strong><br>Alvheim AR et al. "Dietary linoleic acid elevates endogenous 2-AG and anandamide and induces obesity." Obesity, 2012.</p>

  <p><strong>Diabetes en insulineresistentie:</strong><br>DiNicolantonio JJ, O'Keefe JH. "Omega-6 vegetable oils as a driver of coronary heart disease." Missouri Medicine, 2018.</p>

  <p><strong>Depressie:</strong><br>Kiecolt-Glaser JK et al. "Depressive symptoms, omega-6:omega-3 fatty acids, and inflammation in older adults." Psychosomatic Medicine, 2007.</p>

  <p><strong>Oxidatie bij verhitting:</strong><br>Grootveld M et al. "Health effects of oxidized heated oils." Foodservice Research International, 2001.</p>

  <p><strong>Historische consumptie:</strong><br>Blasbalg TL et al. "Changes in consumption of omega-3 and omega-6 fatty acids in the United States during the 20th century." American Journal of Clinical Nutrition, 2011.</p>
</div>

<!-- BACK COVER -->
<div class="footer-page">
  <h2>Je weet het nu.</h2>
  <p>Lees etiketten. Kies echt vet. Eet zoals je overgrootmoeder. De rest is marketing.</p>
  <div class="url">www.oergezond.com</div>
  <div class="brand">Oergezond</div>
</div>

</body>
</html>`;
}

async function main() {
  console.log("Zaadoliën Gids PDF genereren...");

  const html = buildHtml();

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });

  try {
    const page = await browser.newPage();
    try {
      await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 });
    } catch {
      await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 });
    }
    await Promise.race([
      page.evaluate(() => document.fonts.ready),
      new Promise((r) => setTimeout(r, 10000)),
    ]);

    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "48px", bottom: "48px", left: "0", right: "0" },
    });
    const buf = Buffer.from(pdfBuffer);
    console.log("PDF: " + (buf.length / 1024).toFixed(0) + " KB");

    // Verstuur naar Telegram
    const boundary = "----FormBoundary" + Date.now();
    const filename = "zaadolien-gids-oergezond.pdf";
    const caption = "*Zaadoliën: Het Nieuwe Roken — Gratis Gids*\n\n6 pagina's met alles over zaadoliën:\n- Wat ze zijn en hoe ze gemaakt worden\n- Waarom ze schadelijk zijn (met bronnen)\n- Waar ze overal in zitten\n- Wat je wél kunt gebruiken\n- 7-dagen actieplan\n\nKlaar om als lead magnet te gebruiken.";

    const parts = [
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"chat_id\"\r\n\r\n" + cfg.TELEGRAM_CHAT_ID + "\r\n"),
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"caption\"\r\n\r\n" + caption + "\r\n"),
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"parse_mode\"\r\n\r\nMarkdown\r\n"),
      Buffer.from("--" + boundary + "\r\nContent-Disposition: form-data; name=\"document\"; filename=\"" + filename + "\"\r\nContent-Type: application/pdf\r\n\r\n"),
      buf,
      Buffer.from("\r\n--" + boundary + "--\r\n"),
    ];
    const body = Buffer.concat(parts);

    const res = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "api.telegram.org",
        path: "/bot" + cfg.TELEGRAM_TOKEN + "/sendDocument",
        method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=" + boundary, "Content-Length": body.length },
      }, (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(JSON.parse(data)));
      });
      req.on("error", reject);
      req.write(body);
      req.end();
    });

    if (res.ok) console.log("PDF verstuurd naar Telegram!");
    else console.error("Telegram fout:", JSON.stringify(res));
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
