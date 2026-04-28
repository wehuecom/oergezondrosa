#!/usr/bin/env node
"use strict";
const https = require("https");

const API_KEY = "pk_UXNDxC_f620eb347ee8d07f8a7df8e9eaa0e6ca9d";

function klaviyoRequest(method, path, body) {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : null;
    const req = https.request({
      hostname: "a.klaviyo.com", path: "/api" + path, method,
      headers: {
        "Authorization": "Klaviyo-API-Key " + API_KEY,
        "Content-Type": "application/json",
        "revision": "2024-02-15",
        ...(bodyStr ? { "Content-Length": Buffer.byteLength(bodyStr) } : {})
      }
    }, res => {
      let d = ""; res.on("data", c => d += c);
      res.on("end", () => { try { resolve(JSON.parse(d)); } catch { resolve(d); } });
    });
    req.on("error", reject);
    if (bodyStr) req.write(bodyStr);
    req.end();
  });
}

function emailHtml(title, subtitle, content) {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<style>
body{font-family:Arial,Helvetica,sans-serif;color:#1a1a1a;background:#f5f5f5;margin:0;padding:0}
.c{max-width:600px;margin:0 auto;background:#fff}
.hd{background:#2d3825;color:#fff;padding:40px 32px;text-align:center}
.hd h1{font-size:26px;margin:0 0 8px;font-weight:800}
.hd p{font-size:14px;opacity:.8;margin:0}
.bd{padding:32px}
.bd h2{font-size:20px;color:#2d3825;margin:24px 0 10px}
.bd h3{font-size:16px;color:#4b5a3c;margin:18px 0 6px}
.bd p{font-size:14px;line-height:1.7;color:#333;margin:0 0 10px}
.w{background:#fef2f2;border-left:4px solid #c0392b;padding:12px 16px;margin:10px 0;border-radius:0 4px 4px 0}
.w h4{font-size:13px;color:#c0392b;margin:0 0 3px}
.w p{font-size:12.5px;color:#444;margin:0;line-height:1.5}
.g{background:#f4f6f0;border-left:4px solid #4b5a3c;padding:12px 16px;margin:10px 0;border-radius:0 4px 4px 0}
.g h4{font-size:13px;color:#4b5a3c;margin:0 0 3px}
.g p{font-size:12.5px;color:#444;margin:0;line-height:1.5}
.s{font-size:10.5px;color:#999;font-style:italic;margin-bottom:10px}
.ft{background:#2d3825;color:rgba(255,255,255,.5);text-align:center;padding:24px;font-size:12px}
.ft a{color:rgba(255,255,255,.6)}
</style></head><body><div class="c"><div class="hd"><h1>${title}</h1><p>${subtitle}</p></div><div class="bd"><p>Hé {{ first_name|default:"" }},</p>${content}<p style="margin-top:24px">Groet,<br>Jorn &amp; Rosa</p></div><div class="ft"><p>&copy; Oergezond &middot; <a href="https://www.oergezond.com">oergezond.com</a></p><p style="margin-top:8px"><a href="{{ manage_subscription_url }}">Uitschrijven</a></p></div></div></body></html>`;
}

const templates = [
  {
    name: "Fast Fashion Gifgids",
    id: "Y5yrBe",
    html: emailHtml("Fast Fashion Gifgids", "Welke toxische stoffen zitten er in je kleding?", `
<p>Hier is je Fast Fashion Gifgids — alles gebaseerd op onafhankelijke labtests en rechtszaken.</p>
<h2>De testresultaten</h2>
<p>Greenpeace testte 56 Shein-producten (nov 2025). 18 boven EU-limieten. In feb 2026 klaagde Texas Shein aan.</p>
<div class="w"><h4>PFAS in jassen — 3.269x boven de limiet</h4><p>Forever chemicals die je lichaam niet afbreekt. Gelinkt aan kanker, schildklier en vruchtbaarheid.</p></div>
<div class="w"><h4>Ftalaten in kinderschoenen — 428x boven de norm</h4><p>Hormoonverstorend. Verlagen testosteron, vroege puberteit bij meisjes.</p></div>
<div class="w"><h4>Lood in kinderkleding — 20x boven de norm</h4><p>Neurotoxine. Geen veilige ondergrens. Vertraagt hersenontwikkeling.</p></div>
<div class="w"><h4>Formaldehyde — 8x boven EU-limiet</h4><p>WHO Groep 1 carcinogeen. Zit in kleding tegen kreukels. Je ademt het ook in.</p></div>
<p class="s">Bronnen: Greenpeace Germany 2025, Texas AG vs Shein 2026, CBC Marketplace, IARC WHO</p>
<h2>Wat deze stoffen doen</h2>
<p>Chemicaliën in kleding worden via je huid opgenomen — vooral bij zweet, wrijving en warmte.</p>
<p><strong>PFAS:</strong> Bouwt zich op in bloed, lever, nieren. Gelinkt aan kanker en schildklieraandoeningen.</p>
<p><strong>Ftalaten:</strong> Bootsen oestrogeen na, verlagen testosteron. Verminderde vruchtbaarheid.</p>
<p><strong>Formaldehyde:</strong> Bewezen kankerverwekkend. Irriteert huid en luchtwegen.</p>
<p><strong>Lood:</strong> Neurotoxine. Bij kinderen: lagere IQ, gedragsproblemen.</p>
<h2>Sportkleding = grootste risico</h2>
<p>Open poriën + zweet + wrijving = maximale absorptie. Sport in kleding van Shein/Temu ondermijnt je eigen inspanning.</p>
<h2>Wat kun je doen?</h2>
<div class="g"><h4>1. Stop met Shein, Temu, AliExpress</h4><p>Als een t-shirt €3 kost, betaal je met je gezondheid.</p></div>
<div class="g"><h4>2. Was nieuwe kleding 2x voor gebruik</h4><p>Formaldehyde spoelt deels uit. Was op 40°C.</p></div>
<div class="g"><h4>3. Kies natuurlijke materialen</h4><p>Katoen, wol, linnen. Vermijd polyester en nylon.</p></div>
<div class="g"><h4>4. Koop tweedehands</h4><p>Al vaak gewassen = veiliger. Beter voor portemonnee en milieu.</p></div>
<div class="g"><h4>5. Koop minder, koop beter</h4><p>5 goede items > 30 giftige items.</p></div>
<h2>Kledingkast checklist</h2>
<p>✓ Check sportkleding — synthetisch + fast fashion? Vervang eerst.<br>✓ Check kinderkleding — zij zijn het meest kwetsbaar.<br>✓ Check ondergoed — kies biologisch katoen.<br>✓ Chemische geur? Dat is formaldehyde. Was het.<br>✓ "Waterafstotend" of "kreukvrij"? Vaak PFAS/formaldehyde.<br>✓ Zoek OEKO-TEX of GOTS certificering.</p>
`)
  },
  {
    name: "Zaadolien Gids",
    html: emailHtml("Zaadoliën: Het Nieuwe Roken", "Alles over de oliën die je elke dag eet", `
<p>Hier is je complete zaadoliën gids — met bronnen.</p>
<h2>Wat zijn zaadoliën?</h2>
<p>Zonnebloemolie, sojaolie, koolzaadolie, maïsolie. Gewonnen via een industrieel proces met hexaan (een chemisch oplosmiddel), daarna gebleekt en gedeodoriseerd. In 1900 at niemand ze. Nu maken ze 20% van je calorieën uit.</p>
<h2>Waarom zijn ze schadelijk?</h2>
<div class="w"><h4>Hart- en vaatziekten</h4><p>Omega-6 bevordert LDL-oxidatie — de trigger voor atherosclerose. Sydney Diet Heart Study: vervangen van dierlijk vet door zaadoliën verhoogde sterftecijfer.</p></div>
<p class="s">Bron: Ramsden et al., BMJ, 2013</p>
<div class="w"><h4>Obesitas</h4><p>Linolzuur stimuleert endocannabinoïde receptoren. Je wordt letterlijk hongeriger van zaadoliën.</p></div>
<p class="s">Bron: Alvheim et al., Obesity, 2012</p>
<div class="w"><h4>Diabetes type 2</h4><p>Verhogen insulineresistentie door ontsteking in vetweefsel.</p></div>
<p class="s">Bron: DiNicolantonio &amp; O'Keefe, Missouri Medicine, 2018</p>
<div class="w"><h4>Depressie</h4><p>Verstoorde omega-6/omega-3 balans gelinkt aan hogere depressie-incidentie.</p></div>
<p class="s">Bron: Kiecolt-Glaser et al., Psychosomatic Medicine, 2007</p>
<h2>Waar zit het in?</h2>
<p>Chips, brood, koekjes, sauzen, kant-en-klaarmaaltijden, margarine, restauranteten. Check etiketten op: zonnebloemolie, sojaolie, koolzaadolie, raapzaadolie, maïsolie, "plantaardig vet".</p>
<h2>Wat wél gebruiken?</h2>
<div class="g"><h4>Roomboter (grasgevoerd)</h4><p>Rijk aan vitamine A, D, K2. Stabiel bij hitte.</p></div>
<div class="g"><h4>Ghee</h4><p>Geklaarde boter. Hoog rookpunt, perfect om in te bakken.</p></div>
<div class="g"><h4>Reuzel</h4><p>Stabiel, neutraal van smaak. Onze overgrootouders bakten hier alles in.</p></div>
<div class="g"><h4>Extra vierge olijfolie</h4><p>Koudgeperst, donkere fles. Voor salades en licht bakken.</p></div>
<div class="g"><h4>Kokosolie</h4><p>Stabiel bij hitte, antibacterieel, rijk aan MCT-vetten.</p></div>
<h2>7-dagen actieplan</h2>
<p><strong>Dag 1-2:</strong> Loop je keuken door, check alle etiketten.<br><strong>Dag 3-4:</strong> Koop boter, ghee, olijfolie. Vervang je bakolie.<br><strong>Dag 5-6:</strong> Vraag restaurants waar ze in bakken.<br><strong>Dag 7:</strong> Check voortaan elk etiket. Kook zelf.</p>
`)
  },
  {
    name: "Slaapprotocol",
    html: emailHtml("Het Oer Slaapprotocol", "5 stappen naar beter slapen — zonder pillen", `
<p>Hier is je Oer Slaapprotocol. 80% van de Nederlanders heeft een verstoord circadiaans ritme. Dit herstelt het.</p>
<h2>Het probleem</h2>
<p>Je lichaam draait op een circadiaans ritme. Ochtendlicht = cortisol = wakker. Avondduisternis = melatonine = slaap. Maar kunstlicht heeft dat systeem kapotgemaakt. Je zit tot 23:00 achter een scherm en je lichaam denkt dat het middag is.</p>
<h2>Het protocol</h2>
<div class="g"><h4>Stap 1: Ochtendzon (binnen 30 min na opstaan)</h4><p>Ga naar buiten, kijk richting de zon (niet recht erin). 10-15 min. Geen zonnebril. Door een raam werkt niet. Dit reset je circadiaanse klok.</p></div>
<div class="g"><h4>Stap 2: Natuurlijk licht overdag</h4><p>Werk bij een raam. Loop buiten in je lunchpauze. Meer licht overdag = sterker melatoninesignaal 's avonds.</p></div>
<div class="g"><h4>Stap 3: Dim verlichting na zonsondergang</h4><p>Schakel over op warm licht. Kaarsen, zoutlampen, dim oranje. Geen TL of felle LED.</p></div>
<div class="g"><h4>Stap 4: Blokkeer blauw licht 2 uur voor bed</h4><p>Blauwlichtbril of telefoon weg. Blauw licht onderdrukt melatonine met 50%.</p></div>
<div class="g"><h4>Stap 5: Pikkedonker en koel slapen</h4><p>Verduisteringsgordijnen. Geen standby-lampjes. 18°C. Geen telefoon naast bed.</p></div>
<p class="s">Bron: Dr. Andrew Huberman, Stanford School of Medicine</p>
<h2>Tip: Oerbril</h2>
<p>Onze Oerbril blokkeert blauw licht zonder dat alles oranje kleurt. Draag hem 's avonds — je melatonine blijft intact, je slaapt dieper.</p>
<p><a href="https://www.oergezond.com/products/oerbril" style="display:inline-block;background:#4b5a3c;color:#fff;padding:12px 24px;border-radius:4px;text-decoration:none;font-weight:700;margin-top:8px">Bekijk de Oerbril →</a></p>
`)
  },
  {
    name: "Maagzuur Protocol",
    html: emailHtml("De Maagzuurremmer Waarheid", "Je hebt te weinig maagzuur, niet te veel", `
<p>Hier is je darmherstel protocol. Miljoenen Nederlanders slikken omeprazol. De meesten hebben het tegenovergestelde probleem.</p>
<h2>Het echte probleem</h2>
<p>Te weinig maagzuur → eten verteert niet → fermentatie → gas → zuur stijgt op → voelt als te veel zuur → maagzuurremmer → nóg minder zuur → herhaal. Een vicieuze cirkel.</p>
<h2>Wat jarenlang maagzuurremmers doen</h2>
<div class="w"><h4>Vitamine B12-tekort</h4><p>Maagzuur is nodig om B12 vrij te maken uit voedsel. Tekort = vermoeidheid, geheugenproblemen, zenuwschade.</p></div>
<p class="s">Bron: Lam et al., JAMA, 2013</p>
<div class="w"><h4>Botontkalking</h4><p>Minder calcium-opname. 35% hoger risico op heupfracturen bij langdurig gebruik.</p></div>
<p class="s">Bron: Yang et al., JAMA, 2006</p>
<div class="w"><h4>Darminfecties</h4><p>Maagzuur is je eerste verdediging. Zonder voldoende zuur: meer kans op C. difficile en SIBO.</p></div>
<p class="s">Bron: Dial et al., JAMA, 2005</p>
<div class="w"><h4>IJzer- en magnesiumtekort</h4><p>Beide afhankelijk van maagzuur voor opname. Vermoeidheid, krampen, verzwakt immuunsysteem.</p></div>
<p class="s">Bron: FDA Drug Safety Communication, 2011</p>
<h2>5 stappen om maagzuur te herstellen</h2>
<div class="g"><h4>1. Appelazijn voor het eten</h4><p>1 eetlepel in water, 15 min voor je maaltijd. Stimuleert maagzuurproductie.</p></div>
<div class="g"><h4>2. Kauw goed</h4><p>20-30 keer per hap. Vertering begint in je mond.</p></div>
<div class="g"><h4>3. Eet bittere groenten</h4><p>Rucola, andijvie, radicchio. Bitterstoffen stimuleren maagzuur en gal.</p></div>
<div class="g"><h4>4. Drink niet tijdens het eten</h4><p>Water verdunt maagzuur. Drink 30 min voor of na je maaltijd.</p></div>
<div class="g"><h4>5. Bottenbouillon</h4><p>Vol glycine en glutamine die je maagslijmvlies herstellen. Dagelijks een kop.</p></div>
`)
  },
  {
    name: "Lab-Voedsel Gids",
    html: emailHtml("Lab-Voedsel: Wat Je Verliest", "Kweekvlees, synthetische zuivel en wat je lichaam écht nodig heeft", `
<p>Hier is je Lab-Voedsel Gids. Alles over kweekvlees, kweekvis en synthetische zuivel — en waarom echt eten onvervangbaar is.</p>
<h2>Waar staan we in 2026?</h2>
<p>Singapore keurde kweekvlees goed in 2020. De VS in 2023. In Europa bereiden Meatable en Mosa Meat zich voor op lancering. Parallel wordt gewerkt aan kweekvis, synthetische zuivel en complete maaltijden uit bioreactors.</p>
<h2>Het productieproces</h2>
<p>Stamcellen van een dier → groeimedium (vaak met Fetal Bovine Serum) → bioreactor → differentiatie tot spiervezels → oogsten en vormen. Vergelijkbaar met bierbrouwen, maar met dierlijke cellen.</p>
<h2>Wat je verliest</h2>
<div class="w"><h4>Micronutriënten</h4><p>Echt vlees bevat B12, heem-ijzer, zink, CLA, K2, creatine in natuurlijke vorm. Kweekvlees mist mogelijk specifieke B-vitamines en mineralen.</p></div>
<div class="w"><h4>Voedingsmatrix</h4><p>Echt voedsel is een complex systeem waarin voedingsstoffen samenwerken. IJzer wordt beter opgenomen dankzij aminozuren ernaast. Dat kun je niet nabootsen.</p></div>
<p class="s">Bron: PMC, "Cultured Meat Reformulation", 2025</p>
<h2>De zorgen</h2>
<div class="w"><h4>Genetische instabiliteit</h4><p>Na meerdere delingscycli veranderen cellen. Langetermijneffecten onbekend.</p></div>
<div class="w"><h4>Mycoplasma-besmetting (35%)</h4><p>Tot 35% van cellijnen raakt besmet. Effecten van residuen in eindproduct onbekend.</p></div>
<div class="w"><h4>Geen langetermijnstudies</h4><p>Geen enkele studie naar gezondheidseffecten van regelmatig kweekvlees eten. Wij zijn het experiment.</p></div>
<p class="s">Bron: Ong et al., Comprehensive Reviews in Food Science, 2021</p>
<h2>Wat echt eten je geeft</h2>
<div class="g"><h4>Grasgevoerd vlees</h4><p>Compleet aminozuurprofiel, heem-ijzer, B12, CLA, creatine.</p></div>
<div class="g"><h4>Orgaanvlees</h4><p>Meest nutriëntdichte voedsel dat bestaat. Lever = vitamine A, B12, folaat, koper, ijzer.</p></div>
<div class="g"><h4>Wild gevangen vis</h4><p>Omega-3 (EPA/DHA), selenium, jodium, vitamine D.</p></div>
<div class="g"><h4>Eieren van vrije kippen</h4><p>Choline, vetoplosbare vitamines, compleet eiwit.</p></div>
<p style="margin-top:16px"><strong>Eet puur. Eet onbewerkt. Eet zoals de natuur het bedoeld heeft.</strong></p>
`)
  }
];

async function main() {
  // Update existing Fast Fashion template
  console.log("Updating Fast Fashion template...");
  await klaviyoRequest("PATCH", "/templates/" + templates[0].id, {
    data: { type: "template", id: templates[0].id, attributes: { name: templates[0].name, html: templates[0].html } }
  });
  console.log("  ✓ " + templates[0].name);

  // Create remaining templates
  for (let i = 1; i < templates.length; i++) {
    console.log("Creating " + templates[i].name + "...");
    const res = await klaviyoRequest("POST", "/templates", {
      data: { type: "template", attributes: { name: templates[i].name, editor_type: "CODE", html: templates[i].html } }
    });
    console.log("  ✓ " + (res.data?.attributes?.name || "?") + " (ID: " + (res.data?.id || "?") + ")");
  }

  // Now create flows for each list
  // Klaviyo API doesn't support flow creation - but we can check
  console.log("\nLijsten aangemaakt:");
  console.log("  Fast Fashion Gids: Y9trXj");
  console.log("  Zaadolien Gids: RVTdXW");
  console.log("  Slaapprotocol: WU2ALr");
  console.log("  Maagzuur Protocol: UuzEDj");
  console.log("  Lab-Voedsel Gids: SBwwMs");

  console.log("\nTemplates aangemaakt - klaar!");
}

main().catch(e => { console.error("FOUT:", e.message); process.exit(1); });
