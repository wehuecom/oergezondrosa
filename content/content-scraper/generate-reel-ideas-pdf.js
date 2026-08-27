#!/usr/bin/env node
/**
 * Genereer een PDF met virale reel-ideeën en stuur naar Telegram.
 * Eenmalig script — run: node generate-reel-ideas-pdf.js
 */

"use strict";

const https = require("https");
const puppeteer = require("puppeteer");
const cfg = require("./config.js");

function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

// ============================================================
// REEL IDEEËN
// ============================================================

const reelIdeas = [
  {
    categorie: "Anti-Farma",
    titel: "Je arts mag dit niet zeggen",
    hook: "Je huisarts weet dit, maar mag het je niet vertellen.",
    script: `De farmaceutische industrie verdient niks aan gezonde mensen. Laat dat even landen.\n\nJe huisarts krijgt gemiddeld 12 uur voedingsleer in zijn hele opleiding. Twaalf uur. Maar schrijft wel dagelijks medicijnen voor die je de rest van je leven moet slikken.\n\nCholesterolpil. Maagzuurremmer. Bloeddrukpil. Antidepressiva.\n\nNiet omdat je lichaam kapot is. Maar omdat niemand je verteld heeft dat je lichaam zichzelf kan herstellen — als je het de juiste bouwstenen geeft.\n\nEcht voedsel. Dierlijke vetten. Orgaanvlees. Zonlicht. Slaap.\n\nDe natuur heeft geen patent. En dat is precies het probleem.`,
    cta: "Volg ons voor meer waar je arts niet over praat.",
    visueel: "Praat naar camera, rustig en zelfverzekerd. Geen dramatische muziek. Tekst overlay bij kernpunten.",
    duur: "45-60s",
    viraalPotentie: "Zeer hoog — raakt frustratie + conspiratie-gevoel zonder complottheorie te zijn",
  },
  {
    categorie: "Anti-Farma",
    titel: "Waarom chronische ziektes blijven stijgen",
    hook: "Er zijn meer medicijnen dan ooit. Maar mensen worden zieker dan ooit.",
    script: `In 1970 had 15% van de Nederlanders een chronische ziekte. Nu is dat meer dan 50%.\n\nIn diezelfde periode is het aantal medicijnen op de markt verviervoudigd.\n\nMeer medicijnen. Meer zieke mensen. Snap je het probleem?\n\nDe industrie behandelt symptomen. Niet oorzaken. Omdat een genezen patiënt geen klant meer is.\n\nHogebloedruk? Pil. Maar niemand vraagt waarom je bloeddruk hoog is.\nVermoeid? Pil. Maar niemand checkt je slaap, je voeding, je stressniveau.\n\nJe lichaam geeft je signalen. Medicijnen zetten die signalen op mute. Dat is geen genezing — dat is symptoomonderdrukking.\n\nEchte gezondheid begint bij de oorzaak aanpakken. Niet bij de apotheek.`,
    cta: "Sla op voor iemand die dit moet horen.",
    visueel: "Talking head. Statistieken als tekst overlay. Rustige toon, geen schreeuwen.",
    duur: "45-60s",
    viraalPotentie: "Hoog — data-driven, confronterend maar niet agressief",
  },
  {
    categorie: "Anti-Farma",
    titel: "De maagzuurremmer-leugen",
    hook: "Je hebt geen maagzuurremmer nodig. Je hebt te WEINIG maagzuur.",
    script: `Miljoenen Nederlanders slikken een maagzuurremmer. Omeprazol, pantoprazol — je kent ze wel.\n\nDe aanname: je maag maakt te veel zuur. De werkelijkheid: bij de meeste mensen is het precies andersom.\n\nTe weinig maagzuur betekent dat je eten niet goed verteert. Onverteerd eten fermenteert. Gas stijgt op. Brandend maagzuur.\n\nEn wat doet de pil? Nog minder maagzuur. Het probleem wordt erger. Dus je blijft slikken. Jarenlang.\n\nOndertussen neem je minder voedingsstoffen op. B12 daalt. IJzer daalt. Calcium daalt. Botontkalking, vermoeidheid, immuunproblemen.\n\nDe oplossing? Echte voeding. Niet overeten. Goed kauwen. Appelazijn voor het eten. Bittere groenten.\n\nJe maag is niet kapot. Je maag wordt kapot behandeld.`,
    cta: "Deel dit met iemand die al jaren een maagzuurremmer slikt.",
    visueel: "Talking head in keuken. Simpele animatie/tekst van hoe maagzuur werkt. Flesje appelazijn laten zien.",
    duur: "60s",
    viraalPotentie: "Zeer hoog — bijna iedereen kent iemand die omeprazol slikt",
  },
  {
    categorie: "Informatief Gezondheid",
    titel: "Zaadoliën zijn het nieuwe roken",
    hook: "Over 10 jaar kijken we naar zaadoliën zoals we nu naar sigaretten kijken.",
    script: `In de jaren '50 zeiden artsen dat roken gezond was. Letterlijk. Sigarettenreclames met dokters erin.\n\nNu zeggen voedingsrichtlijnen dat plantaardige oliën gezond zijn. Zonnebloemolie. Sojaolie. Koolzaadolie. Overal in.\n\nMaar dit is wat de wetenschap zegt: zaadoliën zijn extreem hoog in omega-6 vetzuren. Die veroorzaken chronische ontstekingen. Chronische ontstekingen zijn de basis van hart- en vaatziekten, diabetes, auto-immuunziekten en zelfs depressie.\n\nIn 1900 at niemand zaadoliën. Nu maken ze meer dan 20% van je calorieën uit.\n\nIn 1900 had bijna niemand hartfalen. Nu is het doodsoorzaak nummer 1.\n\nToeval? Dat mag je zelf bepalen.\n\nBegin met etiketten lezen. Je schrikt van waar het overal in zit. Chips, brood, kant-en-klaarmaaltijden, restauranteten.\n\nVervang het door boter, ghee, reuzel of olijfolie. Simpel maar effectief.`,
    cta: "Volg voor meer waar de voedingsindustrie niet over praat.",
    visueel: "Start met oude sigarettenreclame (beelden/foto's), dan cut naar supermarktschap met zaadoliën. Talking head tussendoor.",
    duur: "60s",
    viraalPotentie: "Zeer hoog — vergelijking roken/zaadoliën is bewezen viral format",
  },
  {
    categorie: "Informatief Gezondheid",
    titel: "Wat zon écht doet met je lichaam",
    hook: "Ze zeggen dat de zon gevaarlijk is. Maar een tekort aan zon is veel gevaarlijker.",
    script: `80% van de Nederlanders heeft een vitamine D-tekort. Tachtig procent.\n\nVitamine D reguleert je immuunsysteem, je hormonen, je stemming, je botdichtheid en je slaap.\n\nEn waar krijg je het van? Zonlicht. Niet van een pilletje — je lichaam maakt het zelf aan als de zon op je huid schijnt.\n\nMaar wat zeggen ze? Smeer factor 50. Blijf uit de zon. De zon is gevaarlijk.\n\nResultaat: een hele generatie met een tekort aan het belangrijkste hormoon dat je lichaam maakt.\n\nDit betekent niet dat je moet verbranden. Het betekent dat je elke dag 15-20 minuten onbeschermde zon nodig hebt. Ochtendzon. Middagzon als je huid het aankan.\n\nBouw het op. Luister naar je lichaam. Je huid wordt rood als het genoeg is — dat is je ingebouwde timer.\n\nDe zon is niet je vijand. Een leven binnenshuis wel.`,
    cta: "Ga vandaag nog 15 minuten naar buiten. Zonder zonnecrème.",
    visueel: "Buitenopname in ochtendzon. Gezicht naar de zon. Rustige toon. Statistieken als tekst overlay.",
    duur: "45-60s",
    viraalPotentie: "Hoog — contrarian take op mainstream advies, goed deelbaar",
  },
  {
    categorie: "Informatief Gezondheid",
    titel: "Waarom je altijd moe bent",
    hook: "Je bent niet moe omdat je te weinig slaapt. Je bent moe omdat je verkeerd eet.",
    script: `Je eet cornflakes als ontbijt. Boterham met jam als lunch. Pasta als avondeten.\n\nJe bloedsuiker schiet omhoog. Insuline dumpt het weer naar beneden. Je lichaam crasht. Je bent moe. Je pakt koffie. Of iets zoets.\n\nEn de cyclus begint opnieuw. Elke dag.\n\nDit is geen energieprobleem. Dit is een voedingsprobleem.\n\nJe lichaam draait op vetten en eiwitten. Niet op suiker en koolhydraten. Als je je auto diesel geeft terwijl hij op benzine rijdt, geef je dan de auto de schuld?\n\nBegin je dag met eieren, boter, vlees. Eet genoeg dierlijk vet. Skip de granen. Skip de suiker.\n\nBinnen een week merk je het verschil. Stabiele energie. Geen middagdip. Geen suikerbehoefte.\n\nJe bent niet kapot. Je tankt verkeerd.`,
    cta: "Probeer het 7 dagen. Je hebt niks te verliezen behalve die vermoeidheid.",
    visueel: "Keuken setting. Laat ontbijt zien (eieren, boter). Cut naar standaard ontbijt (cornflakes). Talking head.",
    duur: "45s",
    viraalPotentie: "Zeer hoog — iedereen kent chronische vermoeidheid, herkenbaar probleem",
  },
  {
    categorie: "Anti-Farma + Product",
    titel: "Je huid is een orgaan, geen reclamebord",
    hook: "Alles wat je op je huid smeert zit binnen 26 seconden in je bloed.",
    script: `26 seconden. Dat is hoe snel stoffen via je huid je bloedstroom bereiken.\n\nNicotinepleisters werken zo. Hormoonpleisters werken zo. Maar als het over huidverzorging gaat, doet het er ineens niet toe wat erin zit?\n\nDe gemiddelde vrouw smeert dagelijks meer dan 160 chemische stoffen op haar huid. Via crème, make-up, deodorant, shampoo, bodylotion.\n\nJe huid is je grootste orgaan. Het is geen muur — het is een spons.\n\nDaarom gebruiken wij tallow. Grasgevoerd rundvet. Het vetzuurprofiel matcht bijna 1-op-1 met menselijk huidvet. Je huid herkent het. Neemt het op. Zonder synthetische troep.\n\nKort ingrediëntenlijstje. Alles uitspreekbaar. Niks wat je niet op je huid wilt.\n\nDraai je producten om. Lees wat erop staat. Als je het niet kunt uitspreken, moet het dan echt op je huid?`,
    cta: "Link in bio — Oercrème. Puur. Simpel. Zoals het hoort.",
    visueel: "Start met nicotinepleister beeld (26 sec stat). Dan badkamer met producten. Dan Oercrème close-up. Talking head.",
    duur: "60s",
    viraalPotentie: "Zeer hoog — 26 seconden feit is bewezen scroll-stopper + product tie-in voelt naturlijk",
  },
  {
    categorie: "Informatief Gezondheid",
    titel: "Wat kunstlicht doet met je slaap",
    hook: "Je slaapt slecht. En het ligt niet aan je matras.",
    script: `Je zit tot 23:00 achter een scherm. Blauw licht. Netflix, telefoon, laptop.\n\nJe lichaam denkt dat het nog middag is. Melatonine — je slaaphormoon — wordt niet aangemaakt.\n\nJe gaat naar bed. Ligt te draaien. Pakt je telefoon. Meer blauw licht.\n\nEn 's ochtends sta je kapot op. Wekker. Koffie. Weer een dag overleven.\n\nDit is geen slaaprobleem. Dit is een lichtprobleem.\n\nJe lichaam draait op een circadiaans ritme. Ochtendlicht vertelt je hersenen: word wakker. Avondduisternis vertelt ze: maak melatonine, ga slapen.\n\nMaar kunstlicht heeft dat systeem volledig verstoord.\n\nDe fix: ochtendzon binnen 30 minuten na opstaan. Dim licht na zonsondergang. Blauw licht blokkeren in de avond.\n\nJe hebt geen slaappil nodig. Je hebt de juiste lichtblootstelling nodig.`,
    cta: "Probeer het vanavond. Dim je licht na 20:00.",
    visueel: "Donkere kamer met schermglow. Dan ochtendzon buitenopname. Oerbril laten zien als subtle product placement.",
    duur: "45-60s",
    viraalPotentie: "Hoog — slaapproblemen zijn enorm herkenbaar, simpele oplossing",
  },
  {
    categorie: "Anti-Farma",
    titel: "De voedingspiramide is een leugen",
    hook: "De voedingspiramide is niet gemaakt door wetenschappers. Hij is gemaakt door de graanindustrie.",
    script: `In 1992 publiceerde de Amerikaanse overheid de voedingspiramide. Basis: 6-11 porties granen per dag. Bovenaan: vetten — zo min mogelijk.\n\nWie betaalde het onderzoek? De graanindustrie. General Mills. Kellogg's. Lobby na lobby.\n\nSindsdien is obesitas verdrievoudigd. Diabetes type 2 is een epidemie. Hartfalen blijft doodsoorzaak nummer 1.\n\nMaar de richtlijn verandert niet. Want er zit te veel geld in granen, suiker en zaadoliën.\n\nOnze voorouders aten vlees, vis, orgaanvlees, dierlijke vetten, seizoensgroenten en fruit. Geen cornflakes. Geen margarine. Geen sojamelk.\n\nEn ze hadden geen hartfalen, geen diabetes, geen obesitas-epidemie.\n\nDe natuur had het al uitgevogeld. De industrie heeft het kapotgemaakt.\n\nEet echt voedsel. Eet wat je overgrootmoeder zou herkennen. De rest is marketing.`,
    cta: "Volg voor meer over wat de voedingsindustrie je niet vertelt.",
    visueel: "Voedingspiramide afbeelding → doorstrepen. Oude foto's van voorouders. Supermarktbeelden. Talking head.",
    duur: "60s",
    viraalPotentie: "Zeer hoog — voedingspiramide debunken is bewezen viral format, breed deelbaar",
  },
  {
    categorie: "Anti-Farma + Product",
    titel: "Waarom dermatologen je huid niet genezen",
    hook: "Je dermatoloog weet niet wat tallow is. Denk daar eens over na.",
    script: `Je gaat naar de dermatoloog met eczeem. Je krijgt een cortisonecrème. Het wordt even beter. Dan komt het terug. Erger.\n\nTerug naar de dermatoloog. Sterkere cortisone. Je huid wordt dunner. Gevoeliger. Afhankelijk.\n\nNiemand vraagt: waarom heb je eczeem? Wat eet je? Wat smeer je? Wat is je darmgezondheid?\n\nDermatologen krijgen gesponsorde bijscholing van farmaceutische bedrijven. Die farmaceutische bedrijven verkopen cortisone en immunosuppressiva. Dat is het businessmodel.\n\nEr is geen geld te verdienen aan een patiënt die geneest.\n\nTallow — grasgevoerd rundvet — bevat dezelfde vetzuren als je eigen huidvet. Vitamine A, D, E, K. Alles wat je huid nodig heeft om zichzelf te herstellen.\n\nMaar dat leert geen enkele dermatoloog. Want er zit geen farmabedrijf achter dat het pusht.\n\nJe huid is niet kapot. Je huid wordt kapot behandeld.`,
    cta: "Link in bio — Oercrème. Herstel van binnenuit.",
    visueel: "Wachtkamer dermatoloog. Cortisone tube close-up. Dan Oercrème. Before/after huid als B-roll. Talking head.",
    duur: "60s",
    viraalPotentie: "Zeer hoog — iedereen met huidproblemen herkent de dermatoloog-loop, emotioneel geladen",
  },
];

// ============================================================
// HTML TEMPLATE
// ============================================================

function buildHtml(ideas, datum) {
  const cards = ideas.map((idea, i) => {
    const scriptHtml = escapeHtml(idea.script).replace(/\\n\\n/g, "</p><p>").replace(/\\n/g, "<br>").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br>");
    return `
    <div class="reel-card">
      <div class="reel-header">
        <div class="reel-number">${i + 1}</div>
        <div class="reel-meta">
          <div class="reel-account">${escapeHtml(idea.titel)}</div>
          <div class="reel-stats">
            <span class="stat cat">${escapeHtml(idea.categorie)}</span>
            <span class="stat">${escapeHtml(idea.duur)}</span>
            <span class="stat potentie">${escapeHtml(idea.viraalPotentie)}</span>
          </div>
        </div>
      </div>

      <div class="section script-section">
        <div class="section-label">HOOK</div>
        <div class="script-hook">${escapeHtml(idea.hook)}</div>
      </div>

      <div class="section">
        <div class="section-label">SCRIPT</div>
        <div class="script-body"><p>${scriptHtml}</p></div>
      </div>

      <div class="section footer-section">
        <div class="script-footer">
          <div class="script-cta"><strong>CTA:</strong> ${escapeHtml(idea.cta)}</div>
        </div>
        <div class="visueel"><strong>Visueel:</strong> ${escapeHtml(idea.visueel)}</div>
      </div>
    </div>`;
  }).join("");

  return `<!DOCTYPE html>
<html lang="nl">
<head>
<meta charset="UTF-8">
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: 'Inter', -apple-system, sans-serif;
    background: #fff; color: #1a1a1a; font-size: 13px; line-height: 1.5;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }
  .cover {
    page-break-after: always; min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    background: #4b5a3c; color: #fff; text-align: center; padding: 60px;
  }
  .cover-title { font-size: 42px; font-weight: 800; margin-bottom: 12px; }
  .cover-subtitle { font-size: 18px; font-weight: 400; opacity: 0.85; margin-bottom: 20px; }
  .cover-count { font-size: 64px; font-weight: 800; opacity: 0.95; margin-bottom: 8px; }
  .cover-count-label { font-size: 16px; font-weight: 500; text-transform: uppercase; letter-spacing: 3px; opacity: 0.7; margin-bottom: 48px; }
  .cover-date { font-size: 15px; font-weight: 500; opacity: 0.7; border-top: 1px solid rgba(255,255,255,0.3); padding-top: 20px; margin-top: 20px; }
  .cover-tags { display: flex; gap: 12px; margin-top: 24px; flex-wrap: wrap; justify-content: center; }
  .cover-tag { background: rgba(255,255,255,0.15); padding: 6px 16px; border-radius: 20px; font-size: 13px; font-weight: 500; }
  .divider-line { width: 60px; height: 2px; background: rgba(255,255,255,0.5); margin: 24px auto; }
  .content { padding: 40px; }
  .reel-card { page-break-inside: avoid; border: 1px solid #e5e7eb; border-radius: 12px; margin-bottom: 32px; overflow: hidden; }
  .reel-header { display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: #f8faf6; border-bottom: 1px solid #e5e7eb; }
  .reel-number { width: 36px; height: 36px; border-radius: 50%; background: #4b5a3c; color: #fff; font-weight: 700; font-size: 16px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .reel-meta { flex: 1; }
  .reel-account { font-weight: 700; font-size: 16px; color: #4b5a3c; }
  .reel-stats { display: flex; gap: 10px; margin-top: 4px; flex-wrap: wrap; }
  .stat { font-size: 11px; color: #6b7280; font-weight: 500; background: #f0f0f0; padding: 2px 10px; border-radius: 10px; }
  .stat.cat { background: #e8eddf; color: #4b5a3c; font-weight: 600; }
  .stat.potentie { background: #fef3c7; color: #92400e; }
  .section { padding: 20px 24px; }
  .section-label { font-size: 10px; font-weight: 700; letter-spacing: 2px; color: #4b5a3c; text-transform: uppercase; margin-bottom: 10px; padding-bottom: 4px; border-bottom: 2px solid #4b5a3c; display: inline-block; }
  .script-section { background: #fafbf9; border-bottom: 1px solid #e5e7eb; }
  .script-hook { font-size: 20px; font-weight: 800; color: #4b5a3c; line-height: 1.3; padding: 14px 18px; background: #f0f3ec; border-radius: 8px; border-left: 4px solid #4b5a3c; }
  .script-body { font-size: 13px; color: #1f2937; line-height: 1.7; }
  .script-body p { margin-bottom: 8px; }
  .footer-section { background: #fafbf9; border-top: 1px solid #e5e7eb; }
  .script-footer { padding: 12px 16px; background: #fff; border-radius: 8px; margin-bottom: 10px; }
  .script-cta { font-size: 13px; color: #374151; }
  .visueel { font-size: 11.5px; color: #6b7280; padding: 10px 14px; background: #fefefe; border: 1px dashed #d1d5db; border-radius: 6px; line-height: 1.55; }
  .page-footer { text-align: center; padding: 32px 40px; font-size: 11px; color: #9ca3af; border-top: 1px solid #e5e7eb; }
</style>
</head>
<body>
<div class="cover">
  <div class="cover-title">Oergezond</div>
  <div class="cover-subtitle">Virale Reel Ideeën</div>
  <div class="divider-line"></div>
  <div class="cover-count">${ideas.length}</div>
  <div class="cover-count-label">reel scripts klaar om te filmen</div>
  <div class="cover-tags">
    <span class="cover-tag">Anti-Farma</span>
    <span class="cover-tag">Informatief Gezondheid</span>
    <span class="cover-tag">Product Tie-ins</span>
  </div>
  <div class="cover-date">${escapeHtml(datum)}</div>
</div>
<div class="content">${cards}</div>
<div class="page-footer">Oergezond Virale Reel Ideeën &mdash; ${escapeHtml(datum)} &mdash; Klaar om te filmen</div>
</body>
</html>`;
}

// ============================================================
// PDF + TELEGRAM
// ============================================================

async function main() {
  console.log("PDF genereren...");

  const datum = new Date().toLocaleDateString("nl-NL", {
    weekday: "long", day: "numeric", month: "long", year: "numeric",
  });

  const html = buildHtml(reelIdeas, datum);

  const browser = await puppeteer.launch({
    headless: true, timeout: 90000,
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
    const pdfBuffer = await page.pdf({ format: "A4", printBackground: true, margin: { top: "0", bottom: "0", left: "0", right: "0" } });
    const buf = Buffer.from(pdfBuffer);
    console.log(`PDF: ${(buf.length / 1024).toFixed(0)} KB`);

    // Verstuur naar Telegram
    const boundary = "----FormBoundary" + Date.now();
    const filename = `virale-reel-ideeen-${new Date().toISOString().slice(0, 10)}.pdf`;
    const caption = `*Virale Reel Ideeën — ${datum}*\n${reelIdeas.length} scripts klaar om te filmen\n\nAnti-farma · Informatief gezondheid · Product tie-ins`;

    const parts = [
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${cfg.TELEGRAM_CHAT_ID}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`),
      Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="document"; filename="${filename}"\r\nContent-Type: application/pdf\r\n\r\n`),
      buf,
      Buffer.from(`\r\n--${boundary}--\r\n`),
    ];
    const body = Buffer.concat(parts);

    const res = await new Promise((resolve, reject) => {
      const req = https.request({
        hostname: "api.telegram.org",
        path: `/bot${cfg.TELEGRAM_TOKEN}/sendDocument`,
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

    if (res.ok) {
      console.log("PDF verstuurd naar Telegram!");
    } else {
      console.error("Telegram fout:", JSON.stringify(res));
    }
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error("FOUT:", e.message); process.exit(1); });
