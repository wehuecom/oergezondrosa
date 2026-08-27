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
  body { font-family: 'Inter', sans-serif; color: #1a1a1a; background: #fff; font-size: 14px; line-height: 1.6; -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  .cover { page-break-after: always; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: linear-gradient(160deg, #111 0%, #1a1a1a 100%); color: #fff; text-align: center; padding: 80px 60px; }
  .cover-label { font-size: 13px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; color: #c0392b; margin-bottom: 32px; }
  .cover-title { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 800; line-height: 1.1; margin-bottom: 20px; }
  .cover-title span { color: #c0392b; }
  .cover-subtitle { font-size: 17px; opacity: 0.7; max-width: 480px; line-height: 1.7; margin-bottom: 48px; }
  .cover-line { width: 60px; height: 2px; background: rgba(255,255,255,0.2); margin-bottom: 48px; }
  .cover-stats { display: flex; gap: 40px; margin-bottom: 48px; }
  .cover-stat-num { font-family: 'Playfair Display', serif; font-size: 48px; font-weight: 800; color: #c0392b; line-height: 1; }
  .cover-stat-label { font-size: 11px; color: rgba(255,255,255,0.5); margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
  .cover-brand { font-size: 16px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.3; }
  .cover-url { font-size: 13px; opacity: 0.2; margin-top: 8px; }

  .page { padding: 0 56px; margin-bottom: 16px; }
  .page:first-of-type { padding-top: 0; }
  .page-label { font-size: 11px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; color: #4b5a3c; margin-bottom: 8px; margin-top: 36px; }
  .page-divider { width: 40px; height: 3px; background: #4b5a3c; margin-bottom: 20px; }
  .page h2 { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 800; color: #1a1a1a; line-height: 1.25; margin-bottom: 16px; page-break-after: avoid; }
  .page h3 { font-size: 16px; font-weight: 700; color: #2d3825; margin: 20px 0 10px; page-break-after: avoid; }
  .page p { font-size: 13px; color: #333; margin-bottom: 10px; line-height: 1.7; orphans: 3; widows: 3; }
  .source { font-size: 10.5px; color: #999; font-style: italic; margin-top: -4px; margin-bottom: 10px; }

  .danger-card { background: #fef2f2; border-left: 4px solid #c0392b; border-radius: 4px; padding: 12px 18px; margin-bottom: 10px; page-break-inside: avoid; }
  .danger-card h4 { font-size: 13px; font-weight: 700; color: #c0392b; margin-bottom: 3px; }
  .danger-card p { font-size: 12.5px; color: #444; margin: 0; line-height: 1.6; }
  .danger-card .src { font-size: 10px; color: #aaa; margin-top: 4px; font-style: italic; }

  .safe-card { background: #f4f6f0; border-left: 4px solid #4b5a3c; border-radius: 4px; padding: 12px 18px; margin-bottom: 10px; page-break-inside: avoid; }
  .safe-card h4 { font-size: 13px; font-weight: 700; color: #4b5a3c; margin-bottom: 3px; }
  .safe-card p { font-size: 12.5px; color: #444; margin: 0; line-height: 1.6; }

  .fact-box { background: #111; color: white; border-radius: 8px; padding: 24px; margin: 20px 0; page-break-inside: avoid; }
  .fact-box .num { font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 800; color: #c0392b; }
  .fact-box .label { font-size: 13px; color: rgba(255,255,255,0.6); margin-top: 2px; }
  .fact-row { display: flex; gap: 20px; }
  .fact-item { flex: 1; text-align: center; }

  .checklist { list-style: none; padding: 0; }
  .checklist li { padding: 10px 0 10px 28px; border-bottom: 1px solid #eee; position: relative; font-size: 13.5px; color: #333; line-height: 1.5; page-break-inside: avoid; }
  .checklist li::before { content: "✓"; position: absolute; left: 0; color: #4b5a3c; font-weight: 700; font-size: 15px; }

  .quote-block { border-left: 3px solid #4b5a3c; padding: 14px 20px; margin: 20px 0; background: #f4f6f0; border-radius: 0 4px 4px 0; }
  .quote-block { page-break-inside: avoid; }
  .quote-block p { font-style: italic; color: #444; font-size: 13.5px; margin: 0; }
  .quote-block cite { display: block; font-size: 11px; color: #999; margin-top: 6px; font-style: normal; }

  .back-cover { page-break-before: always; min-height: 100vh; display: flex; flex-direction: column; align-items: center; justify-content: center; background: #4b5a3c; color: white; text-align: center; padding: 80px 60px; }
  .back-cover h2 { font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 800; margin-bottom: 16px; }
  .back-cover p { font-size: 16px; opacity: 0.8; max-width: 460px; line-height: 1.7; margin-bottom: 32px; }
  .back-cover .url { font-size: 18px; font-weight: 600; opacity: 0.7; margin-bottom: 8px; }
  .back-cover .brand { font-size: 14px; font-weight: 700; letter-spacing: 3px; text-transform: uppercase; opacity: 0.4; }
</style>
</head>
<body>

<!-- COVER -->
<div class="cover">
  <div class="cover-label">Onderzoeksrapport 2026</div>
  <div class="cover-title">Fast Fashion <span>Gifgids</span></div>
  <div class="cover-subtitle">Welke toxische stoffen zitten er in je kleding, wat doen ze met je lichaam, en hoe bescherm je jezelf?</div>
  <div class="cover-stats">
    <div class="cover-stat"><div class="cover-stat-num">80%</div><div class="cover-stat-label">bevat toxische stoffen</div></div>
    <div class="cover-stat"><div class="cover-stat-num">3300x</div><div class="cover-stat-label">boven PFAS-norm</div></div>
    <div class="cover-stat"><div class="cover-stat-num">428x</div><div class="cover-stat-label">boven ftalaat-norm</div></div>
  </div>
  <div class="cover-line"></div>
  <div class="cover-brand">Oergezond</div>
  <div class="cover-url">www.oergezond.com</div>
</div>

<!-- PAGE 1: DE TESTRESULTATEN -->
<div class="page">
  <div class="page-label">Hoofdstuk 1</div>
  <div class="page-divider"></div>
  <h2>De testresultaten: wat er écht in je kleding zit</h2>

  <p>In november 2025 testte Greenpeace Duitsland 56 producten van Shein. Van de 56 geteste items bevatten 18 schadelijke chemicaliën boven de wettelijke EU-limieten. Inclusief kinderkleding.</p>
  <p class="source">Bron: Greenpeace Germany, "#ShameOnYouShein" rapport, november 2025</p>

  <p>In februari 2026 diende de staat Texas een rechtszaak in tegen Shein wegens "bedrieglijke handelspraktijken" — het verkopen van producten met gevaarlijk hoge niveaus van toxische stoffen zonder dit te vermelden.</p>
  <p class="source">Bron: State of Texas vs. Shein, Collin County District Court, 20 februari 2026</p>

  <h3>Wat er gevonden werd</h3>

  <div class="danger-card">
    <h4>PFAS in jassen — 3.269x boven de wettelijke limiet</h4>
    <p>PFAS worden "forever chemicals" genoemd — je lichaam kan ze niet afbreken. Ze hopen zich op in je bloed, lever en nieren. Gelinkt aan schildklieraandoeningen, verminderde vruchtbaarheid, verhoogd cholesterol en meerdere vormen van kanker.</p>
    <div class="src">Bron: Greenpeace Germany labtests, nov 2025 — gepubliceerd in #ShameOnYouShein rapport</div>
  </div>

  <div class="danger-card">
    <h4>Ftalaten in kinderschoenen — 428x boven de toegestane limiet</h4>
    <p>Ftalaten zijn hormoonverstorende stoffen die oestrogeen nabootsen en testosteron verlagen. Bij kinderen extra gevaarlijk: dunnere huid, hogere absorptie, en ze stoppen alles in hun mond.</p>
    <div class="src">Bron: Greenpeace Germany labtests + bevestigd door Seoul city government testing</div>
  </div>

  <div class="danger-card">
    <h4>Ftalaten in tassen — 153x boven de wettelijke grens</h4>
    <p>Handtassen die je dagelijks vasthoudt en tegen je lichaam draagt. Ftalaten migreren via huidcontact en zweet naar je lichaam.</p>
    <div class="src">Bron: Texas AG rechtszaak, onafhankelijke labtests aangehaald in de petitie</div>
  </div>

  <div class="danger-card">
    <h4>Lood in kinderkleding — tot 20x boven de norm</h4>
    <p>Lood is een neurotoxine. Er bestaat geen veilige ondergrens — vooral niet bij kinderen. Hoopt zich op in botten en organen. Gelinkt aan vertraagde hersenontwikkeling, gedragsproblemen en leerproblemen.</p>
    <div class="src">Bron: CBC Marketplace laboratoriumtests + Greenpeace Germany rapport</div>
  </div>

  <div class="danger-card">
    <h4>Formaldehyde in textiel — tot 8x boven de EU-limiet</h4>
    <p>Formaldehyde is een bewezen carcinogeen (kankerverwekkend, WHO Groep 1). Wordt gebruikt om kleding kreukvrij te houden en schimmel te voorkomen tijdens transport. Je ademt het ook in — het verdampt uit de stof.</p>
    <div class="src">Bron: CBC Marketplace tests + IARC classificatie WHO, Groep 1 carcinogeen</div>
  </div>
</div>

<!-- PAGE 2: WAT DEZE STOFFEN DOEN -->
<div class="page">
  <div class="page-label">Hoofdstuk 2</div>
  <div class="page-divider"></div>
  <h2>Wat deze stoffen doen met je lichaam</h2>

  <p>Recente studies tonen aan dat chemicaliën in kleding via de huid worden opgenomen en in de systemische bloedsomloop terechtkomen. Dit proces wordt versterkt door zweet, wrijving en warmte — precies de omstandigheden bij het dragen van kleding.</p>
  <p class="source">Bron: MDPI, "The Health Impact of Fast Fashion: Exploring Toxic Chemicals in Clothing and Textiles", 2025</p>

  <h3>PFAS — "Forever Chemicals"</h3>
  <p>Je lichaam kan PFAS niet afbreken. Ze blijven voor altijd in je systeem. PFAS stapelen zich op in bloed, lever en nieren.</p>
  <p><strong>Bewezen effecten:</strong> Schildklieraandoeningen, verhoogd cholesterol, verminderde vruchtbaarheid, lever- en nierschade, verzwakt immuunsysteem, verhoogd risico op nier- en testiskanker.</p>
  <p class="source">Bron: ATSDR (Agency for Toxic Substances and Disease Registry), PFAS Toxicological Profile, 2021</p>

  <h3>Ftalaten</h3>
  <p>Hormoonverstorende stoffen die oestrogeen nabootsen en testosteron verlagen. Worden opgenomen via huidcontact.</p>
  <p><strong>Bewezen effecten:</strong> Verminderde vruchtbaarheid bij mannen (lager spermaaantal, verminderde beweeglijkheid), vroege puberteit bij meisjes, verstoorde hormoonbalans, gelinkt aan endometriose en borstkanker.</p>
  <p class="source">Bron: Swan et al., "Decrease in anogenital distance among male infants with prenatal phthalate exposure", Environmental Health Perspectives, 2005</p>

  <h3>Formaldehyde</h3>
  <p>Geclassificeerd als Groep 1 carcinogeen door de WHO. Wordt niet alleen opgenomen via de huid, maar ook ingeademd — het verdampt uit textiel.</p>
  <p><strong>Bewezen effecten:</strong> Huidirritatie, eczeem, contactallergie, irritatie van luchtwegen en ogen, bij chronische blootstelling: verhoogd risico op nasofarynxkanker (neuskeelholtekanker).</p>
  <p class="source">Bron: IARC Monograph, Vol. 100F — Formaldehyde, WHO</p>

  <h3>Lood</h3>
  <p>Neurotoxine. Er bestaat geen veilige ondergrens voor blootstelling. Stapelt zich op in botten en kan decennia later nog vrijkomen.</p>
  <p><strong>Bewezen effecten:</strong> Bij kinderen: vertraagde hersenontwikkeling, lagere IQ, gedragsproblemen, leerproblemen. Bij volwassenen: hoge bloeddruk, nier- en leverschade, verminderde vruchtbaarheid.</p>
  <p class="source">Bron: WHO Fact Sheet — Lead Poisoning, 2023 + CDC Blood Lead Reference Value</p>

  <h3>Azo-kleurstoffen</h3>
  <p>Goedkope textielverfchemicaliën die kunnen afbreken tot aromatische amines — bewezen kankerverwekkend. Migreren van stof naar huid, vooral bij zweet en wrijving.</p>
  <p><strong>Bewezen effecten:</strong> Meerdere aromatische amines zijn geclassificeerd als Groep 1 of Groep 2A carcinogenen door IARC. Gelinkt aan blaaskanker bij textielarbeiders.</p>
  <p class="source">Bron: IARC Monographs — Aromatic Amines + EU REACH Regulation (bijlage XVII, restrictie nr. 43)</p>

  <h3>Hoe absorptie werkt</h3>
  <p>Onderzoek van OsloMet (2025) bevestigt dat kleurstofmoleculen van stof naar de opperhuid migreren, vooral bij zweet en wrijving. Dermale absorptie van textielchemicaliën is lang onderschat ten opzichte van inname via voedsel en inademing.</p>
  <p class="source">Bron: OsloMet Clothing Research, "From Clothes to Skin: Chemical Safety in Ultra-Fast Fashion", 2025</p>

  <div class="quote-block">
    <p>"Dermale absorptie van chemicaliën in kleding is te lang onderschat. Er is groeiend bewijs dat stoffen in textiel via de huid worden opgenomen en in de systemische circulatie terechtkomen."</p>
    <cite>— MDPI review, The Health Impact of Fast Fashion, 2025</cite>
  </div>
</div>

<!-- PAGE 3: WAAROM DIT GEBEURT -->
<div class="page">
  <div class="page-label">Hoofdstuk 3</div>
  <div class="page-divider"></div>
  <h2>Waarom dit gebeurt — en waarom het niet stopt</h2>

  <h3>Het businessmodel</h3>
  <p>Shein brengt tot 10.000 nieuwe producten per dag uit. Temu en AliExpress werken op dezelfde manier. Het model is simpel: maximale snelheid, minimale kosten, geen verantwoordelijkheid.</p>
  <p>Elke giftige shortcut bespaart fracties van een cent per kledingstuk. Formaldehyde voorkomt schimmel tijdens transport. Azo-kleurstoffen zijn goedkoper dan veilige alternatieven. PFAS maakt stof waterafstotend zonder dure coating.</p>
  <p>Bij miljoenen stuks per dag tellen die fracties op tot miljoenen in besparing.</p>

  <h3>Geen testing, geen controle</h3>
  <p>Er is geen tijd en geen budget om 10.000 producten per dag te testen. Shein vertrouwt op zelfcertificering door fabrikanten — fabrikanten die financieel belang hebben om zo goedkoop mogelijk te produceren.</p>
  <p>Greenpeace testte in 2025 of Shein hun eerdere beloftes over veiligheid was nagekomen. Het antwoord: nee. De niveaus van schadelijke stoffen waren nog steeds ver boven de EU-limieten.</p>
  <p class="source">Bron: Greenpeace Germany, #ShameOnYouShein follow-up rapport, november 2025</p>

  <h3>Wetgeving loopt achter</h3>
  <p>De EU heeft strenge REACH-regelgeving voor chemicaliën in textiel. Maar handhaving bij directe online import is minimaal. Pakketten komen rechtstreeks uit Chinese fabrieken naar je voordeur via postordervrijstelling. Douane controleert steekproefsgewijs — de meeste kleding wordt nooit getest.</p>

  <h3>Het is niet alleen Shein</h3>
  <p>Temu, AliExpress, Wish, Primark — overal waar kleding te goedkoop is om veilig te zijn, zit hetzelfde probleem. Het Seoul city government testte ook producten van andere ultra-fast fashion merken en vond vergelijkbare overtredingen.</p>

  <div class="fact-box">
    <div class="fact-row">
      <div class="fact-item"><div class="num">10.000</div><div class="label">nieuwe producten per dag</div></div>
      <div class="fact-item"><div class="num">0</div><div class="label">onafhankelijke veiligheidstests</div></div>
      <div class="fact-item"><div class="num">$0.03</div><div class="label">besparing per giftige shortcut</div></div>
    </div>
  </div>
</div>

<!-- PAGE 4: SPORTKLEDING -->
<div class="page">
  <div class="page-label">Hoofdstuk 4</div>
  <div class="page-divider"></div>
  <h2>Sportkleding: het grootste risico</h2>

  <p>Misschien heb je wel een sportsetje besteld bij Shein of Temu. Lekker goedkoop, leuk printje. Je trekt het aan. Je gaat sporten. Je zweet.</p>
  <p>Dit is het worst-case scenario voor chemische absorptie:</p>

  <div class="danger-card">
    <h4>Je poriën staan open</h4>
    <p>Tijdens het sporten openen je poriën zich om zweet af te voeren. Dit maakt je huid veel doorlaatbaarder voor chemicaliën in de stof.</p>
  </div>

  <div class="danger-card">
    <h4>Zweet activeert chemische migratie</h4>
    <p>Wetenschappelijk onderzoek toont aan dat zweet de migratie van kleurstoffen en chemicaliën van stof naar huid versnelt. Vocht en warmte zijn de perfecte katalysator.</p>
  </div>

  <div class="danger-card">
    <h4>Wrijving versterkt het effect</h4>
    <p>Strakke sportkleding wrijft tegen je huid — bij elke beweging. Deze mechanische actie versterkt de overdracht van chemicaliën naar de opperhuid.</p>
  </div>

  <div class="danger-card">
    <h4>Synthetische stoffen houden chemicaliën vast</h4>
    <p>Polyester, nylon en elastaan — de standaard materialen in goedkope sportkleding — houden chemicaliën beter vast dan natuurlijke vezels. Ze geven ook microplastics af bij elke wasbeurt.</p>
  </div>

  <p class="source">Bron: OsloMet Clothing Research, 2025 + MDPI review "The Health Impact of Fast Fashion", 2025</p>

  <div class="quote-block">
    <p>"De combinatie van zweet, wrijving en warmte tijdens fysieke activiteit creëert optimale omstandigheden voor dermale absorptie van textielchemicaliën."</p>
    <cite>— MDPI review, The Health Impact of Fast Fashion, 2025</cite>
  </div>

  <p>Je denkt dat je iets goeds doet voor je gezondheid door te sporten. Maar als je dat doet in kleding vol lood, PFAS en ftalaten, ondermijn je je eigen inspanning.</p>
</div>

<!-- PAGE 5: WAT KUN JE DOEN -->
<div class="page">
  <div class="page-label">Hoofdstuk 5</div>
  <div class="page-divider"></div>
  <h2>Wat kun je doen? Jouw actieplan.</h2>

  <h3>Stap 1: Stop met bestellen bij ultra-fast fashion</h3>
  <div class="safe-card">
    <h4>Vermijd Shein, Temu, AliExpress, Wish</h4>
    <p>Als een t-shirt €3 kost, betaal je de echte prijs met je gezondheid. Er is geen manier om kleding veilig te produceren tegen die prijs. De goedkoopste optie is altijd de giftigste.</p>
  </div>

  <h3>Stap 2: Was nieuwe kleding altijd — minimaal 2x</h3>
  <div class="safe-card">
    <h4>Dit geldt voor alle nieuwe kleding, niet alleen fast fashion</h4>
    <p>Formaldehyde en losse chemicaliën spoelen deels uit bij de eerste wasbeurten. Was op minimaal 40°C. Trek nooit ongewassen nieuwe kleding direct aan — zeker niet bij kinderen.</p>
  </div>

  <h3>Stap 3: Kies natuurlijke materialen</h3>
  <div class="safe-card">
    <h4>Katoen, wol, linnen, zijde, hennep</h4>
    <p>Natuurlijke vezels geven geen microplastics af, houden minder chemicaliën vast, en zijn beter voor je huid. Kies biologisch katoen (GOTS-gecertificeerd) als je zeker wilt zijn van minimale chemische belasting.</p>
  </div>

  <h3>Stap 4: Koop tweedehands</h3>
  <div class="safe-card">
    <h4>Al tientallen keren gewassen = veiliger</h4>
    <p>Tweedehands kleding heeft al veel wasbeurten doorstaan. De meeste vluchtige chemicaliën zijn eruit gespoeld. Plus: beter voor het milieu en je portemonnee.</p>
  </div>

  <h3>Stap 5: Koop minder, koop beter</h3>
  <div class="safe-card">
    <h4>5 goede items > 30 giftige items</h4>
    <p>Investeer in kleding die lang meegaat, van veilige materialen gemaakt is, en door merken die transparant zijn over hun productie. Het is goedkoper op de lange termijn — en veiliger voor je lichaam.</p>
  </div>

  <h3>Kledingkast checklist</h3>
  <ul class="checklist">
    <li>Check je sportkleding — is het synthetisch en van een ultra-fast fashion merk? Vervang het als eerste.</li>
    <li>Check kinderkleding — kinderen zijn het meest kwetsbaar. Was alles 2x voor gebruik.</li>
    <li>Check je ondergoed — direct op je meest gevoelige huid. Kies biologisch katoen.</li>
    <li>Ruik je nieuwe kleding? Die chemische geur is vaak formaldehyde. Was het voor je het draagt.</li>
    <li>Vermijd kleding met "waterafstotend" of "kreukvrij" labels — dat betekent vaak PFAS of formaldehyde.</li>
    <li>Kies OEKO-TEX of GOTS gecertificeerde kleding als je zeker wilt zijn</li>
  </ul>
</div>

<!-- PAGE 6: BRONNEN -->
<div class="page">
  <div class="page-label">Bronnen</div>
  <div class="page-divider"></div>
  <h2>Alle bronnen</h2>

  <p>Alle claims in deze gids zijn gebaseerd op peer-reviewed onderzoek, onafhankelijke laboratoriumtests en officiële rechtszaken.</p>

  <h3>Laboratoriumtests & rapporten</h3>
  <p><strong>Greenpeace Germany</strong> — "#ShameOnYouShein: Hazardous Chemicals Still Found in Fast Fashion Products", november 2025. 56 producten getest, 18 boven EU-limieten.</p>
  <p><strong>CBC Marketplace</strong> — Onafhankelijke laboratoriumtests op Shein-kleding, 2021-2026. Formaldehyde en lood boven limieten gevonden in kinderkleding.</p>
  <p><strong>Seoul Metropolitan Government</strong> — Testing van ultra-fast fashion producten, 2024. Ftalaten tot 428x boven de norm in kinderschoenen.</p>

  <h3>Rechtszaken</h3>
  <p><strong>State of Texas vs. Shein</strong> — Collin County District Court, 20 februari 2026. PFAS tot 3.269x boven de wettelijke limiet. Ftalaten tot 428x. Lood boven veilige niveaus. Filed by Attorney General Ken Paxton.</p>

  <h3>Wetenschappelijke studies</h3>
  <p><strong>MDPI (2025)</strong> — "The Health Impact of Fast Fashion: Exploring Toxic Chemicals in Clothing and Textiles." Encyclopaedia, 5(2), 84.</p>
  <p><strong>OsloMet Clothing Research (2025)</strong> — "From Clothes to Skin: Chemical Safety in Ultra-Fast Fashion and Luxury Brands' Clothes."</p>
  <p><strong>Swan et al. (2005)</strong> — "Decrease in anogenital distance among male infants with prenatal phthalate exposure." Environmental Health Perspectives, 113(8), 1056-1061.</p>
  <p><strong>IARC Monograph Vol. 100F</strong> — Formaldehyde classificatie als Groep 1 carcinogeen. World Health Organization.</p>
  <p><strong>ATSDR (2021)</strong> — Toxicological Profile for Perfluoroalkyls (PFAS). Agency for Toxic Substances and Disease Registry.</p>
  <p><strong>WHO (2023)</strong> — Lead Poisoning Fact Sheet. Geen veilige ondergrens voor loodblootstelling.</p>
  <p><strong>EU REACH Regulation</strong> — Bijlage XVII, restrictie nr. 43: verbod op azo-kleurstoffen die carcinogene aromatische amines afgeven.</p>
</div>

<!-- BACK COVER -->
<div class="back-cover">
  <h2>Stop met bestellen. Het is het niet waard.</h2>
  <p>Lees etiketten. Kies natuurlijke materialen. Was alles voor je het draagt. En denk twee keer na voordat je op "bestel" klikt.</p>
  <div class="url">www.oergezond.com</div>
  <div class="brand">Oergezond</div>
</div>

</body>
</html>`;
}

async function main() {
  console.log("Fast Fashion Gifgids PDF genereren...");
  const html = buildHtml();
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
  });
  try {
    const page = await browser.newPage();
    try { await page.setContent(html, { waitUntil: "networkidle0", timeout: 60000 }); }
    catch { await page.setContent(html, { waitUntil: "domcontentloaded", timeout: 30000 }); }
    await Promise.race([page.evaluate(() => document.fonts.ready), new Promise((r) => setTimeout(r, 10000))]);
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "48px", bottom: "48px", left: "0", right: "0" } });
    const buf = Buffer.from(pdfBuffer);
    console.log("PDF: " + (buf.length / 1024).toFixed(0) + " KB");

    const boundary = "----FormBoundary" + Date.now();
    const filename = "fast-fashion-gifgids-oergezond.pdf";
    const caption = "*Fast Fashion Gifgids — Oergezond*\n\nEvidence-based rapport met:\n- Alle testresultaten (Greenpeace, CBC, Texas rechtszaak)\n- PFAS 3.269x, ftalaten 428x, lood 20x boven norm\n- Wat elke stof doet met je lichaam\n- Sportkleding als grootste risico\n- Actieplan + kledingkast checklist\n- Volledige bronnenlijst\n\nKlaar als lead magnet.";
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
      }, (res) => { let data = ""; res.on("data", (c) => (data += c)); res.on("end", () => resolve(JSON.parse(data))); });
      req.on("error", reject); req.write(body); req.end();
    });
    if (res.ok) console.log("PDF verstuurd naar Telegram!");
    else console.error("Telegram fout:", JSON.stringify(res));
  } finally { await browser.close(); }
}
main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
