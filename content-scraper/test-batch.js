"use strict";

const https = require("https");
const cfg = require("./config.js");
const { generateTweetPost, generateNewsPost } = require("./generate-statics.js");
const FormData = require("form-data");

const TOKEN = cfg.TELEGRAM_TOKEN;
const CHAT = cfg.TELEGRAM_CHAT_ID;

function tgPost(path, body) {
  const str = JSON.stringify(body);
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${TOKEN}/${path}`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(str) },
    }, res => { let d = ""; res.on("data", c => d += c); res.on("end", () => resolve(JSON.parse(d))); });
    req.on("error", reject);
    req.write(str); req.end();
  });
}

async function sendPhoto(buffer, caption) {
  const form = new FormData();
  form.append("chat_id", CHAT);
  form.append("caption", caption);
  form.append("parse_mode", "Markdown");
  form.append("photo", buffer, { filename: "post.png", contentType: "image/png" });
  return new Promise((resolve, reject) => {
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${TOKEN}/sendPhoto`,
      method: "POST",
      headers: form.getHeaders(),
    }, res => { let d = ""; res.on("data", c => d += c); res.on("end", () => resolve(JSON.parse(d))); });
    req.on("error", reject);
    form.pipe(req);
  });
}

async function send(text) {
  await tgPost("sendMessage", { chat_id: CHAT, text, parse_mode: "Markdown" });
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ===== CONTENT =====

const TWEETS = [
  {
    text: "Jij smeert elke dag een hormoonverstorende cocktail op je huid. En noemt het huidverzorging.",
    caption: "Je huid absorbeert alles wat je erop smeert. Alles.\n\nGemiddelde dagcrème bevat 12–15 ingrediënten die je endocriene systeem verstoren. Elke dag. Jaar na jaar.\n\nJe lichaam houdt de score bij — ook als jij het niet doet.\n\nWat zit er in jouw potje?\n\n.\n.\n.\n#oergezond #hormoonvriendelijk #puureverzorging #toxinevrij #huidverzorging",
  },
  {
    text: "Zaadoliën zijn geen voeding. Het is industrieel afval waar ze een gezondheidsclaim op hebben geplakt.",
    caption: "Zonnebloemolie. Raapzaad. Soja. Mais.\n\nHonderd jaar geleden bestond dit niet op je bord. Nu zit het in zowat elk bewerkt product in de supermarkt.\n\nJe lichaam herkent het niet. Je ontsteking wel.\n\nLees etiketten. Kook met boter, reuzel of olijfolie. Klaar.\n\n.\n.\n.\n#oergezond #zaadoliën #oervoeding #puureten",
  },
  {
    text: "Je bent niet moe. Je bent ondervoed op een manier die geen enkele multivitamine oplost.",
    caption: "Vermoeidheid is geen karaktertrek. Het is een signaal.\n\nMeeste mensen eten genoeg calorieën maar bijna geen voedingsstoffen. Bewerkt eten vult je maag, niet je cellen.\n\nEchte energie komt uit echt eten. Vlees, eieren, orgaanvlees, boter, fruit.\n\nSimpel maar effectief.\n\n.\n.\n.\n#oergezond #oervoeding #energie #herstelvanbinnenuit",
  },
  {
    text: "De zon is niet je vijand. Het gebrek aan zon is het probleem.",
    caption: "We zijn bang gemaakt voor het enige dat ons lichaam dagelijks nodig heeft.\n\n15 minuten ochtendzon = betere slaap, betere hormonen, betere stemming. Gratis.\n\nZoals de natuur het bedoeld heeft.\n\n.\n.\n.\n#oergezond #vitamined #circadiaanritme #zonlicht",
  },
  {
    text: "Je darmen bepalen je humeur meer dan je denkt. En je voedt ze met troep.",
    caption: "90% van je serotonine wordt in je darmen gemaakt. Niet in je hoofd.\n\nStress, somberheid, brain fog — begin onderin, niet bovenin.\n\nHaal de troep eruit. Voeg echt eten toe. Je hoofd volgt vanzelf.\n\n.\n.\n.\n#oergezond #darmgezondheid #oervoeding #herstelvanbinnenuit",
  },
];

const NEWS = [
  {
    headline: "Zonnebrand blokkeert vitamine D — elke dag smeren is elke dag tekort",
    highlightWords: ["Zonnebrand", "vitamine D"],
    imagePrompt: "sunlight through green leaves, warm golden hour lighting, natural organic texture, dark moody background",
    caption: "SPF 50 beschermt je huid. En blokkeert tegelijk het enige wat je immuunsysteem echt nodig heeft.\n\nVitamine D wordt aangemaakt via UV-B — precies wat zonnebrand tegenhoudt.\n\nNiet de zon is het probleem. Het gebrek aan zon is het probleem.\n\n.\n.\n.\n#oergezond #vitamined #zonnebrand",
  },
  {
    headline: "Zaadoliën in 80% van supermarktproducten gelinkt aan chronische ontsteking",
    highlightWords: ["Zaadoliën", "chronische ontsteking"],
    imagePrompt: "golden butter and beef tallow on rustic wooden board, warm natural lighting, dark moody background",
    caption: "Industrieel geperst, chemisch gebleekt, gepresenteerd als gezond.\n\nZaadoliën zijn overal — en je lichaam herkent ze niet.\n\nKook met boter, reuzel, olijfolie. Zoals vroeger.\n\n.\n.\n.\n#oergezond #zaadoliën #oervoeding",
  },
  {
    headline: "Microplastics gevonden in menselijke placenta — dagelijkse blootstelling via verzorgingsproducten",
    highlightWords: ["Microplastics", "verzorgingsproducten"],
    imagePrompt: "pure natural skincare ingredients on linen cloth, herbs and oils, warm natural lighting, dark moody background",
    caption: "Je dagcrème, je shampoo, je deodorant. Elke dag een druppel troep.\n\nJe lichaam slaat het op waar het niet hoort.\n\nTerug naar simpel. Terug naar puur.\n\n.\n.\n.\n#oergezond #toxinevrij #puureverzorging",
  },
  {
    headline: "Ochtendzonlicht reset je bioritme beter dan elke slaappil op de markt",
    highlightWords: ["Ochtendzonlicht", "bioritme"],
    imagePrompt: "early morning sunrise through forest trees, golden light rays, natural peaceful scene, dark moody background",
    caption: "10 minuten zon in je ogen binnen een uur na opstaan. Gratis. Elke dag beschikbaar.\n\nJe slaaphormonen worden aangezet door licht, niet door pillen.\n\nZoals de natuur het bedoeld heeft.\n\n.\n.\n.\n#oergezond #circadiaanritme #slaap",
  },
  {
    headline: "Orgaanvlees bevat meer voedingsstoffen dan elk supplement in de apotheek",
    highlightWords: ["Orgaanvlees", "voedingsstoffen"],
    imagePrompt: "fresh grass-fed beef liver on wooden cutting board, rustic herbs, warm natural lighting, dark moody background",
    caption: "Lever, hart, nier. Onze voorouders aten het eerst. Wij gooien het weg.\n\nGeen pil komt in de buurt van wat de natuur zelf verpakt heeft.\n\nGrasgevoerd, puur, compleet.\n\n.\n.\n.\n#oergezond #orgaanvlees #oervoeding #grasgevoerd",
  },
];

const REELS = `🎬 *Reel Ideeën — 5 stuks*

*Reel 1 — Ingrediënten shock*
Hook: "Jij smeert dit elke dag op je huid — en je weet niet wat het doet"
Opbouw: Ingrediëntenlabel van bekende dagcrème close-up, elke stof uitlichten met effect
CTA: Sla op voor later

*Reel 2 — 30 dagen zonder zaadoliën*
Hook: "Stop 30 dagen met zaadoliën. Dit gebeurt er"
Opbouw: Dagboek-stijl dag 1 / 10 / 30 — energie, huid, brain fog
CTA: Wie doet het mee?

*Reel 3 — Ochtendroutine*
Hook: "De eerste 30 minuten na wakker worden bepalen je hele dag"
Opbouw: POV ochtendzon in ogen, glas zout water, geen telefoon, buiten lopen
CTA: Probeer het morgen. Vertel me wat er veranderde

*Reel 4 — Boodschappen swap*
Hook: "Deze 5 dingen zou ik nooit meer kopen in de supermarkt"
Opbouw: Winkelwagen, producten eruit halen, vervanging ernaast leggen
CTA: Welke ga jij swappen?

*Reel 5 — Lever koken*
Hook: "Het meest onderschatte superfood ligt voor €2 bij de slager"
Opbouw: Lever bakken in boter, ui, kruiden — 3 minuten per kant
CTA: Tag iemand die dit moet proberen`;

async function main() {
  const datum = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });

  await send(`📦 *Testrun content — ${datum}*\n_5 tweet posts · 5 nieuws posts · 5 reel ideeën_`);
  await sleep(500);

  // Tweet posts
  await send(`🐦 *Tweet posts worden gegenereerd...*`);
  for (let i = 0; i < TWEETS.length; i++) {
    console.log(`Tweet ${i + 1}/5...`);
    try {
      const buf = await generateTweetPost({ text: TWEETS[i].text });
      await sendPhoto(buf, `🐦 *Tweet post ${i + 1}/5*`);
      await sleep(400);
      await send(`📋 *Caption tweet ${i + 1}:*\n\n${TWEETS[i].caption}`);
      await sleep(500);
    } catch (e) {
      console.error(`Tweet ${i + 1} fout:`, e.message);
      await send(`⚠️ Tweet ${i + 1} mislukt: ${e.message}`);
    }
  }

  // Nieuws posts
  await send(`📰 *Nieuws posts worden gegenereerd (dit duurt even — Freepik async)...*`);
  for (let i = 0; i < NEWS.length; i++) {
    console.log(`Nieuws ${i + 1}/5...`);
    try {
      const buf = await generateNewsPost({
        headline: NEWS[i].headline,
        highlightWords: NEWS[i].highlightWords,
        imagePrompt: NEWS[i].imagePrompt,
      });
      await sendPhoto(buf, `📰 *Nieuws post ${i + 1}/5*`);
      await sleep(400);
      await send(`📋 *Caption nieuws ${i + 1}:*\n\n${NEWS[i].caption}`);
      await sleep(500);
    } catch (e) {
      console.error(`Nieuws ${i + 1} fout:`, e.message);
      await send(`⚠️ Nieuws ${i + 1} mislukt: ${e.message}`);
    }
  }

  // Reels
  await send(REELS);

  await send(`✅ *Testrun klaar* — 5 tweets + 5 nieuws + 5 reels verstuurd`);
  console.log("✅ Klaar");
}

main().catch(e => { console.error(e); process.exit(1); });
