#!/usr/bin/env node
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
  body { font-family: 'Inter', sans-serif; color: #1a1a1a; background: #fff; font-size: 13.5px; line-height: 1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .cover { page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(160deg, #4b5a3c 0%, #2d3625 100%); color: #fff; text-align: center; padding: 80px 60px; }
  .cover-label { font-size: 13px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; opacity: 0.5; margin-bottom: 32px; }
  .cover-title { font-family: 'Playfair Display', serif; font-size: 46px; font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
  .cover-title span { color: #a8c090; }
  .cover-subtitle { font-size: 17px; opacity: 0.75; max-width: 500px; line-height: 1.7; margin-bottom: 48px; }
  .cover-line { width: 60px; height: 2px; background: rgba(255,255,255,0.3); margin-bottom: 48px; }
  .cover-brand { font-size: 16px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.35; }
  .cover-url { font-size: 13px; opacity: 0.2; margin-top: 8px; }

  .page { padding: 0 56px; margin-bottom: 12px; }
  .page-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #4b5a3c; margin-bottom: 8px; margin-top: 32px; }
  .page-divider { width: 40px; height: 3px; background: #4b5a3c; margin-bottom: 18px; }
  .page h2 { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 800; color: #2d3625; line-height: 1.25; margin-bottom: 14px; page-break-after: avoid; }
  .page h3 { font-size: 16px; font-weight: 700; color: #4b5a3c; margin: 20px 0 8px; page-break-after: avoid; }
  .page p { font-size: 13px; color: #333; margin-bottom: 10px; line-height: 1.7; orphans: 3; widows: 3; }
  .source { font-size: 10.5px; color: #999; font-style: italic; margin-top: -4px; margin-bottom: 10px; }

  .warn-card { background: #fef8f0; border-left: 4px solid #d4880f; border-radius: 4px; padding: 14px 18px; margin-bottom: 12px; page-break-inside: avoid; }
  .warn-card h4 { font-size: 13.5px; font-weight: 700; color: #9a6500; margin-bottom: 3px; }
  .warn-card p { font-size: 12.5px; color: #555; margin: 0; line-height: 1.6; }
  .warn-card .src { font-size: 10px; color: #aaa; margin-top: 4px; font-style: italic; }

  .danger-card { background: #fef2f2; border-left: 4px solid #c0392b; border-radius: 4px; padding: 14px 18px; margin-bottom: 12px; page-break-inside: avoid; }
  .danger-card h4 { font-size: 13.5px; font-weight: 700; color: #c0392b; margin-bottom: 3px; }
  .danger-card p { font-size: 12.5px; color: #444; margin: 0; line-height: 1.6; }
  .danger-card .src { font-size: 10px; color: #aaa; margin-top: 4px; font-style: italic; }

  .safe-card { background: #f4f6f0; border-left: 4px solid #4b5a3c; border-radius: 4px; padding: 14px 18px; margin-bottom: 12px; page-break-inside: avoid; }
  .safe-card h4 { font-size: 13.5px; font-weight: 700; color: #4b5a3c; margin-bottom: 3px; }
  .safe-card p { font-size: 12.5px; color: #444; margin: 0; line-height: 1.6; }

  .compare-table { width: 100%; border-collapse: collapse; margin: 16px 0; font-size: 12.5px; page-break-inside: avoid; }
  .compare-table th { background: #4b5a3c; color: white; padding: 10px 14px; text-align: left; font-weight: 600; font-size: 12px; letter-spacing: 0.5px; }
  .compare-table td { padding: 9px 14px; border-bottom: 1px solid #eee; color: #333; }
  .compare-table tr:nth-child(even) td { background: #fafbf9; }
  .compare-table .bad { color: #c0392b; font-weight: 600; }
  .compare-table .good { color: #4b5a3c; font-weight: 600; }

  .quote-block { border-left: 3px solid #4b5a3c; padding: 12px 18px; margin: 16px 0; background: #f4f6f0; border-radius: 0 4px 4px 0; page-break-inside: avoid; }
  .quote-block p { font-style: italic; color: #444; font-size: 13px; margin: 0; }
  .quote-block cite { display: block; font-size: 10.5px; color: #999; margin-top: 5px; font-style: normal; }

  .checklist { list-style: none; padding: 0; }
  .checklist li { padding: 8px 0 8px 28px; border-bottom: 1px solid #eee; position: relative; font-size: 13px; color: #333; line-height: 1.5; page-break-inside: avoid; }
  .checklist li::before { content: "✓"; position: absolute; left: 0; color: #4b5a3c; font-weight: 700; font-size: 15px; }

  .back-cover { page-break-before: always; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #4b5a3c; color: white; text-align: center; padding: 80px 60px; }
  .back-cover h2 { font-family: 'Playfair Display', serif; font-size: 30px; font-weight: 800; margin-bottom: 16px; }
  .back-cover p { font-size: 16px; opacity: 0.8; max-width: 460px; line-height: 1.7; margin-bottom: 32px; }
  .back-cover .url { font-size: 18px; font-weight: 600; opacity: 0.7; margin-bottom: 8px; }
  .back-cover .brand { font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.4; }
</style>
</head>
<body>

<div class="cover">
  <div class="cover-label">Rapport 2026</div>
  <div class="cover-title">Lab-Voedsel:<br><span>Wat Je Verliest</span></div>
  <div class="cover-subtitle">Kweekvis, synthetische zuivel en vlees uit bioreactors — wat er écht in zit, wat je lichaam ermee doet, en waarom echt eten onvervangbaar is.</div>
  <div class="cover-line"></div>
  <div class="cover-brand">Oergezond</div>
  <div class="cover-url">www.oergezond.com</div>
</div>

<div class="page">
  <div class="page-label">Hoofdstuk 1</div>
  <div class="page-divider"></div>
  <h2>Lab-voedsel in 2026: waar staan we?</h2>

  <p>In 2020 werd Singapore het eerste land ter wereld dat kweekvelees goedkeurde voor commerciële verkoop. In de VS volgde goedkeuring in 2023 voor twee bedrijven: Upside Foods en Good Meat.</p>
  <p class="source">Bron: just-food.com, "Protein pioneers: the countries which have approved cultivated meat"</p>

  <p>In Europa gaat het langzamer. In april 2024 organiseerde het Nederlandse Meatable de eerste legale publieke proeverij van kweekvlees in de EU — een worstje. In juli 2024 diende het Franse Gourmey als eerste Europees bedrijf een aanvraag in bij de EFSA (European Food Safety Authority). Mosa Meat volgde in januari 2025.</p>
  <p class="source">Bron: GFI Europe + Euronews, november 2024</p>

  <p>De EFSA heeft nog geen enkel product goedgekeurd. Maar de richting is duidelijk: de industrie bereidt zich voor op een Europese marktlancering.</p>

  <h3>Het gaat verder dan vlees</h3>
  <p>Parallel aan kweekvlees wordt er gewerkt aan:</p>

  <div class="warn-card">
    <h4>Kweekvis en zeevruchten</h4>
    <p>Cellen van vis worden gekweekt in bioreactors met groeimedia om visfilets na te maken. Bedrijven als BlueNalu en Wildtype produceren al kweekzalm in de VS.</p>
    <div class="src">Bron: Nature, "Tissue-like cultured fish fillets through a synthetic food pipeline", 2023</div>
  </div>

  <div class="warn-card">
    <h4>Synthetische zuivel</h4>
    <p>Melkeiwitgenen worden in micro-organismen geplaatst die in bioreactors groeien en melkproteïnen produceren — zonder koe. Perfect Day en New Culture zijn marktleiders.</p>
    <div class="src">Bron: European Livestock Voice, "After cultured meat and fish, artificial milk is coming"</div>
  </div>

  <div class="warn-card">
    <h4>Complete maaltijden uit bioreactors</h4>
    <p>De ambitie van de industrie is om volledige voedselproducten te produceren via cellulaire landbouw — niet alleen vlees, maar vetten, eiwitten en zelfs structuren die natuurlijk voedsel nabootsen.</p>
  </div>
</div>

<div class="page">
  <div class="page-label">Hoofdstuk 2</div>
  <div class="page-divider"></div>
  <h2>Hoe wordt kweekvlees gemaakt?</h2>

  <p>Kweekvlees wordt geproduceerd via tissue engineering — dezelfde technologie die oorspronkelijk werd ontwikkeld voor medische doeleinden zoals orgaantransplantatie.</p>

  <h3>Het proces in 5 stappen</h3>

  <p><strong>Stap 1: Celafname.</strong> Er worden stamcellen afgenomen van een levend dier via een biopsie — meestal spierstamcellen (satelietcellen).</p>

  <p><strong>Stap 2: Groeimedium.</strong> De cellen worden geplaatst in een voedingsrijke vloeistof (groeimedium) die de cellen alles geeft wat ze nodig hebben om te delen. Traditioneel bevat dit Fetal Bovine Serum (FBS) — serum uit ongeboren kalveren. Vanwege ethische bezwaren zoeken bedrijven naar alternatieven, maar FBS is nog steeds de gouden standaard qua effectiviteit.</p>
  <p class="source">Bron: Ong et al., Comprehensive Reviews in Food Science and Food Safety, 2021</p>

  <p><strong>Stap 3: Bioreactor.</strong> De cellen groeien in grote stalen tanks (bioreactors) onder streng gecontroleerde omstandigheden: temperatuur, pH, zuurstof, glucose. Vergelijkbaar met het brouwen van bier, maar dan met dierlijke cellen.</p>

  <p><strong>Stap 4: Differentiatie.</strong> De stamcellen worden gestimuleerd om zich te ontwikkelen tot spiervezels, vetcellen of bindweefsel — afhankelijk van het gewenste eindproduct.</p>

  <p><strong>Stap 5: Oogsten en structureren.</strong> De gekweekte cellen worden geoogst en gevormd tot een product dat lijkt op vlees. Bij eenvoudige producten (gehakt, kipnuggets) is dit relatief simpel. Bij complexe structuren (een steak, een visfilet) is het aanzienlijk moeilijker en vereist het scaffolding — een soort steigerwerk waar cellen omheen groeien.</p>

  <div class="quote-block">
    <p>"Kweekvlees wordt geproduceerd via tissue engineering methodologieën in bioreactors — een gesloten systeem dat celproliferatie ondersteunt door middel van groeimedia."</p>
    <cite>— Food Protection, 2024</cite>
  </div>
</div>

<div class="page">
  <div class="page-label">Hoofdstuk 3</div>
  <div class="page-divider"></div>
  <h2>Wat verlies je als voedsel uit een fabriek komt?</h2>

  <p>De industrie claimt dat kweekvlees "nutritioneel vergelijkbaar" is met conventioneel vlees. Maar de details vertellen een ander verhaal.</p>

  <h3>1. Micronutriënten: een ander profiel</h3>
  <p>Echt vlees van grasgevoerde dieren bevat een complex pakket aan voedingsstoffen dat in duizenden jaren co-evolutie met de mens is ontstaan: vitamine B12, ijzer (heem-ijzer), zink, selenium, vitamine A, D, E, K2, CLA (conjugated linoleic acid), creatine en carnosine.</p>
  <p>Kweekvlees bevat mogelijk minder van bepaalde B-vitamines en essentiële mineralen die van nature in conventioneel vlees voorkomen. Het micronutriëntenprofiel is afhankelijk van het groeimedium — en dat is synthetisch samengesteld.</p>
  <p class="source">Bron: PMC, "Cultured Meat Reformulation: Health Potential and Challenges", 2025</p>

  <h3>2. Voedingsmatrix: meer dan de som der delen</h3>
  <p>Echt voedsel is niet zomaar een optelsom van losse voedingsstoffen. Het is een matrix — een complex systeem waarin voedingsstoffen samenwerken. De ijzer in een biefstuk wordt beter opgenomen dankzij de aminozuren die ernaast zitten. De vetoplosbare vitamines in orgaanvlees worden getransporteerd door de dierlijke vetten die er van nature bij horen.</p>
  <p>Kweekvlees reduceert voeding tot losse componenten en probeert die opnieuw samen te stellen. Maar de natuur heeft dit systeem al geperfectioneerd.</p>

  <h3>3. Wat er simpelweg ontbreekt</h3>

  <table class="compare-table">
    <tr><th>Voedingsstof</th><th>Echt grasgevoerd vlees</th><th>Kweekvlees</th></tr>
    <tr><td>Heem-ijzer</td><td class="good">Natuurlijk aanwezig, hoge opname</td><td class="bad">Mogelijk lager, afhankelijk van medium</td></tr>
    <tr><td>Vitamine B12</td><td class="good">Van nature hoog</td><td class="bad">Moet worden toegevoegd</td></tr>
    <tr><td>CLA</td><td class="good">Aanwezig bij grasgevoerd</td><td class="bad">Afwezig — wordt niet aangemaakt</td></tr>
    <tr><td>Vitamine K2</td><td class="good">Aanwezig in vet en orgaanvlees</td><td class="bad">Niet aanwezig</td></tr>
    <tr><td>Creatine</td><td class="good">Natuurlijk in spierweefsel</td><td class="bad">Onbekend / variabel</td></tr>
    <tr><td>Voedingsmatrix</td><td class="good">Duizenden jaren geoptimaliseerd</td><td class="bad">Synthetisch samengesteld</td></tr>
    <tr><td>Omega-3/omega-6 balans</td><td class="good">Gunstig bij grasgevoerd</td><td class="bad">Afhankelijk van groeimedium</td></tr>
  </table>
  <p class="source">Bron: PMC, "Sensorial and Nutritional Aspects of Cultured Meat in Comparison to Traditional Meat", 2020 + PMC, "Cultured Meat Reformulation", 2025</p>
</div>

<div class="page">
  <div class="page-label">Hoofdstuk 4</div>
  <div class="page-divider"></div>
  <h2>De zorgen die niemand benoemt</h2>

  <div class="danger-card">
    <h4>Genetische instabiliteit</h4>
    <p>Na meerdere delingscycli in een bioreactor kunnen cellen genetisch veranderen (genetische drift). Dit kan leiden tot onvoorspelbare celkarakteristieken. Er is nog geen langetermijnonderzoek naar wat dit betekent voor het eindproduct dat je eet.</p>
    <div class="src">Bron: Ong et al., Comprehensive Reviews in Food Science and Food Safety, 2021</div>
  </div>

  <div class="danger-card">
    <h4>Mycoplasma-besmetting</h4>
    <p>Tot 35% van cellijnen in productie wordt besmet met mycoplasma-bacteriën. Dit is een van de grootste uitdagingen in de kweekvleesindustrie. De langetermijneffecten van mycoplasma-residuen in het eindproduct zijn onbekend.</p>
    <div class="src">Bron: Food Protection, "Understanding Cell-Cultured Seafood and Its Food Safety Challenges", 2024</div>
  </div>

  <div class="danger-card">
    <h4>Groeimedium: wat zit erin?</h4>
    <p>Het groeimedium bevat hormonen, groeifactoren, aminozuren, glucose en vaak antibiotica om besmetting te voorkomen. Hoewel goedgekeurde producten claimen antibioticarvrij te zijn, is de volledige samenstelling van groeimedia vaak bedrijfsgeheim.</p>
    <div class="src">Bron: PMC, "The Myth of Cultured Meat: A Review", 2020</div>
  </div>

  <div class="danger-card">
    <h4>Onbekende microbiota-effecten</h4>
    <p>Het is onbekend hoe de microbiële samenstelling van kweekvlees verschilt van conventioneel vlees en wat dit betekent voor houdbaarheid, opslag en veiligheid. De impact op je darmmicrobioom is volledig onbestudeerd.</p>
    <div class="src">Bron: Ong et al., Comprehensive Reviews in Food Science and Food Safety, 2021</div>
  </div>

  <div class="danger-card">
    <h4>Geen langetermijnstudies op mensen</h4>
    <p>Er is geen enkele langetermijnstudie uitgevoerd naar de gezondheidseffecten van het regelmatig eten van kweekvlees. We zijn het experiment.</p>
  </div>

  <div class="quote-block">
    <p>"De introductie van kweekvlees in de voedselketen is een van de grootste ongecontroleerde experimenten in de moderne voedingswetenschap."</p>
    <cite>— Naar analogie van Dr. Cate Shanahan over zaadoliën</cite>
  </div>
</div>

<div class="page">
  <div class="page-label">Hoofdstuk 5</div>
  <div class="page-divider"></div>
  <h2>Waarom echt eten onvervangbaar is</h2>

  <p>Je lichaam is geen fabriek. Het is een levend systeem dat in honderdduizenden jaren is geëvolueerd om voedingsstoffen uit natuurlijke bronnen te herkennen, op te nemen en te gebruiken.</p>

  <h3>Voedingsintelligentie</h3>
  <p>Grasgevoerd vlees, wild gevangen vis, eieren van vrije kippen, groenten uit de grond — ze bevatten voedingsstoffen in een vorm die je cellen herkennen. Niet omdat iemand dat zo heeft ontworpen, maar omdat mens en voedsel samen zijn geëvolueerd.</p>
  <p>Die co-evolutie kun je niet nabootsen in een bioreactor. Je kunt losse moleculen samenstellen, maar je kunt niet de complexe interacties repliceren die duizenden jaren van natuurlijke selectie hebben geoptimaliseerd.</p>

  <h3>Wat echt eten je geeft</h3>

  <div class="safe-card">
    <h4>Grasgevoerd vlees</h4>
    <p>Compleet aminozuurprofiel, heem-ijzer, B12, zink, CLA, creatine, carnosine. Vetzuurbalans die ontstekingen remt in plaats van bevordert.</p>
  </div>

  <div class="safe-card">
    <h4>Orgaanvlees (lever, hart, nieren)</h4>
    <p>De meest nutriëntdichte voedingsmiddelen die bestaan. Lever bevat meer vitamine A, B12, folaat, koper en ijzer per gram dan welk ander voedingsmiddel ook.</p>
  </div>

  <div class="safe-card">
    <h4>Wild gevangen vis</h4>
    <p>Omega-3 (EPA en DHA) in de meest biobeschikbare vorm. Selenium, jodium, vitamine D. Essentieel voor hersenfunctie en ontstekingsregulatie.</p>
  </div>

  <div class="safe-card">
    <h4>Eieren van vrije kippen</h4>
    <p>Choline (essentieel voor hersenen en lever), vetoplosbare vitamines, compleet eiwit. Het meest complete enkelvoudige voedingsmiddel dat bestaat.</p>
  </div>

  <div class="safe-card">
    <h4>Groenten en fruit van de grond</h4>
    <p>Vezels, polyfenolen, mineralen, antioxidanten — in een matrix die je darmmicrobioom voedt en je immuunsysteem ondersteunt.</p>
  </div>
</div>

<div class="page">
  <div class="page-label">Hoofdstuk 6</div>
  <div class="page-divider"></div>
  <h2>Wat kun je doen?</h2>

  <ul class="checklist">
    <li>Kies echt vlees van grasgevoerde dieren boven ultra-bewerkte vleesvervangers</li>
    <li>Eet orgaanvlees — lever, hart, nieren. De meest nutriëntdichte voedingsmiddelen die bestaan</li>
    <li>Kies wild gevangen vis boven kweekvis — zeker boven lab-vis</li>
    <li>Koop lokaal en seizoensgebonden. Ken je boer als het kan</li>
    <li>Vermijd producten met ingrediëntenlijsten die je niet kunt uitspreken</li>
    <li>Lees etiketten. "Plantaardig" of "duurzaam" zegt niets over voedingswaarde</li>
    <li>Kook zelf. Dan weet je wat erin zit. Dat is altijd de veiligste optie</li>
    <li>Vertrouw op voedsel dat je overgrootmoeder zou herkennen</li>
  </ul>

  <div class="quote-block">
    <p>"Herstel begint niet met supplementen of ingewikkelde protocollen. Het begint met echt eten. Puur, onbewerkt en van de grond."</p>
    <cite>— Jorn & Rosa, Oergezond</cite>
  </div>

  <div class="page-label" style="margin-top:32px;">Bronnen</div>
  <div class="page-divider"></div>

  <p><strong>PMC (2025)</strong> — "Cultured Meat Reformulation: Health Potential and Challenges." PubMed Central.</p>
  <p><strong>PMC (2020)</strong> — "Sensorial and Nutritional Aspects of Cultured Meat in Comparison to Traditional Meat."</p>
  <p><strong>PMC (2020)</strong> — "The Myth of Cultured Meat: A Review."</p>
  <p><strong>Ong et al. (2021)</strong> — "Food safety considerations and research priorities for the cultured meat and seafood industry." Comprehensive Reviews in Food Science and Food Safety.</p>
  <p><strong>Nature (2023)</strong> — "Tissue-like cultured fish fillets through a synthetic food pipeline." npj Science of Food.</p>
  <p><strong>Nature (2025)</strong> — "A global comprehensive review on cultured seafood." npj Science of Food.</p>
  <p><strong>Food Protection (2024)</strong> — "Understanding Cell-Cultured Seafood and Its Food Safety Challenges."</p>
  <p><strong>GFI Europe</strong> — "Cultivated meat: regulatory status in Europe."</p>
  <p><strong>Euronews (2024)</strong> — "Could lab-grown meat arrive in supermarkets soon?"</p>
  <p><strong>European Livestock Voice</strong> — "After cultured meat and fish, artificial milk is coming."</p>
</div>

<div class="back-cover">
  <h2>Je lichaam herkent echt eten. Geef het wat het nodig heeft.</h2>
  <p>Eet puur. Eet onbewerkt. Eet zoals de natuur het bedoeld heeft.</p>
  <div class="url">www.oergezond.com</div>
  <div class="brand">Oergezond</div>
</div>

</body>
</html>`;
}

async function main() {
  console.log("Lab-Voedsel Gids PDF genereren...");
  const html = buildHtml();
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"] });
  try {
    const page = await browser.newPage();
    try { await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 }); }
    catch { await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 }); }
    await Promise.race([page.evaluate(() => document.fonts.ready), new Promise((r) => setTimeout(r, 10000))]);
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "48px", bottom: "48px", left: "0", right: "0" } });
    const buf = Buffer.from(pdfBuffer);
    console.log("PDF: " + (buf.length / 1024).toFixed(0) + " KB");

    const boundary = "----FormBoundary" + Date.now();
    const filename = "lab-voedsel-gids-oergezond.pdf";
    const caption = "*Lab-Voedsel: Wat Je Verliest — Oergezond*\n\nEvidence-based gids:\n- Status kweekvlees, kweekvis, synthetische zuivel 2026\n- Hoe het productieproces werkt\n- Voedingsvergelijking (tabel) echt vs. kweek\n- Genetische instabiliteit, mycoplasma, groeimedium zorgen\n- Waarom echt eten onvervangbaar is\n- Actieplan + volledige bronnenlijst";
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
      const req = https.request({ hostname: "api.telegram.org", path: "/bot" + cfg.TELEGRAM_TOKEN + "/sendDocument", method: "POST",
        headers: { "Content-Type": "multipart/form-data; boundary=" + boundary, "Content-Length": body.length },
      }, (res) => { let data = ""; res.on("data", (c) => (data += c)); res.on("end", () => resolve(JSON.parse(data))); });
      req.on("error", reject); req.write(body); req.end();
    });
    if (res.ok) console.log("PDF verstuurd naar Telegram!");
    else console.error("Telegram fout:", JSON.stringify(res));
  } finally { await browser.close(); }
}
main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
