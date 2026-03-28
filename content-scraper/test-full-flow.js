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
    }, res => {
      let d = ""; res.on("data", c => d += c); res.on("end", () => resolve(JSON.parse(d)));
    });
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

async function main() {
  const datum = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });

  // Header
  await send(`📊 *Viral deze week — ${datum}*\n_Top 5 posts op engagement_`);
  await sleep(500);

  // Mock virale posts met knoppen
  const mockPosts = [
    { account: "dr.axe", type: "🖼️", stats: "48.200 likes · 312 reacties", caption: "\"Your gut is your second brain. Feed it right.\"", url: "https://www.instagram.com/p/C4xQ2aJuXyZ/" },
    { account: "carnivore.md", type: "🎬", stats: "31.500 likes · 89.000 views · 204 reacties", caption: "\"Remove seed oils for 30 days. This is what happens.\"", url: "https://www.instagram.com/p/C4mN8bKoPqR/" },
    { account: "paul.saladino", type: "🖼️", stats: "27.800 likes · 445 reacties", caption: "\"The sun is not your enemy. Sunscreen might be.\"", url: "https://www.instagram.com/p/C4hT1cWvLmS/" },
  ];

  for (let i = 0; i < mockPosts.length; i++) {
    const p = mockPosts[i];
    await tgPost("sendMessage", {
      chat_id: CHAT,
      text: `${p.type} *${i + 1}. @${p.account}*\n${p.stats}\n_${p.caption}_\n${p.url}`,
      parse_mode: "Markdown",
    });
    await sleep(300);
    await tgPost("sendMessage", {
      chat_id: CHAT,
      text: `↑ Post ${i + 1} namaken als:`,
      parse_mode: "Markdown",
      reply_markup: {
        inline_keyboard: [[
          { text: "🐦 Tweet post", callback_data: `tweet:${i}` },
          { text: "📰 Nieuws post", callback_data: `news:${i}` },
        ]],
      },
    });
    await sleep(400);
  }

  // Reel ideeën
  await send(`🎬 *Reel Ideeën*\n\n*Reel 1*\nHook: Jij smeert dit elke dag op je huid — en je weet niet wat het doet\nOpbouw: Ingrediënten van gemiddelde zonnebrand naast elkaar leggen, uitleg per stof\nCTA: Sla op voor later\n\n*Reel 2*\nHook: Stop 30 dagen met zaadoliën. Dit verandert er\nOpbouw: Dagboek-stijl, dag 1/10/30, energieniveau + huid\nCTA: Wie doet het mee?`);
  await sleep(500);

  // Story ideeën
  await send(`📖 *Story Ideeën*\n\n*Story 1 — poll*\nGebruik jij zonnebrand? Ja / Nee, ik vermijd het\n\n*Story 2 — tip*\nTip van de dag: 15 minuten zon zonder crème = genoeg vitamine D voor de dag`);
  await sleep(500);

  // Statics genereren
  await send(`🖼️ *Statics worden nu gegenereerd...*`);
  await sleep(500);

  // Tweet post
  console.log("Genereer tweet post...");
  const tweetBuf = await generateTweetPost({
    text: "Jij smeert elke dag een hormoonverstorende cocktail op je huid. En noemt het huidverzorging.",
  });
  await sendPhoto(tweetBuf, `🐦 *Tweet post klaar*`);
  await sleep(400);
  await send(`📋 *Instagram caption tweet post — kopieer naar Business Suite:*\n\nJe huid absorbeert alles wat je erop smeert. Alles.\n\nGemiddelde dagcrème bevat 12–15 ingrediënten die je endocriene systeem verstoren. Elke dag. Jaar na jaar.\n\nJe lichaam houdt de score bij — ook als jij het niet doet.\n\nWat zit er in jouw potje?\n\n.\n.\n.\n#oergezond #hormoonvriendelijk #puureverzorging #toxinevrij #huidverzorging #naturalskincare #endocrinesysteem #bewustleven #oercrème #schonehuid #ingrediënten #hormonen #dutchwellness #nederlandsgezond #huidgezondheid`);
  await sleep(500);

  // Nieuws post
  console.log("Genereer nieuws post...");
  const newsBuf = await generateNewsPost({
    headline: "Zonnebrand blokkeert vitamine D — elke dag smeren is elke dag tekort",
    highlightWords: ["Zonnebrand", "vitamine D"],
    imagePrompt: "sunlight through green leaves, warm golden hour lighting, natural organic texture, dark moody background",
  });
  await sendPhoto(newsBuf, `📰 *Nieuws post klaar*`);
  await sleep(400);
  await send(`📋 *Instagram caption nieuws post — kopieer naar Business Suite:*\n\nSPF 50 beschermt je huid. En blokkeert tegelijk het enige wat je immuunsysteem echt nodig heeft.\n\nVitamine D wordt aangemaakt via UV-B — precies wat zonnebrand tegenhoudt. Elke dag smeren = elke dag minder aanmaak.\n\nNiet de zon is het probleem. Het gebrek aan zon is het probleem.\n\nSla op voor later. Stuur door aan iemand die altijd SPF gebruikt.\n\n.\n.\n.\n#oergezond #vitamined #zonnebrand #spf #immuunsysteem #hormoonvriendelijk #bewustleven #zonlicht #nederlandsgezond #huidverzorging #puureleven #oervoeding #circadiaanritme #dutchwellness #toxinevrij`);

  console.log("✅ Volledige flow verstuurd naar Telegram!");
}

main().catch(console.error);
