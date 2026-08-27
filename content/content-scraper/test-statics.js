"use strict";
const fs = require("fs");
const path = require("path");
const https = require("https");
const FormData = require("form-data");
const cfg = require("./config.js");
const { generateTweetPost, generateNewsPost } = require("./generate-statics.js");

async function sendPhotoToTelegram(buffer, caption) {
  return new Promise((resolve, reject) => {
    const form = new FormData();
    form.append("chat_id", cfg.TELEGRAM_CHAT_ID);
    form.append("caption", caption);
    form.append("photo", buffer, { filename: "image.png", contentType: "image/png" });

    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${cfg.TELEGRAM_TOKEN}/sendPhoto`,
      method: "POST",
      headers: form.getHeaders(),
    }, (res) => {
      let data = "";
      res.on("data", c => data += c);
      res.on("end", () => resolve(JSON.parse(data)));
    });
    req.on("error", reject);
    form.pipe(req);
  });
}

async function main() {
  console.log("Genereer tweet post (kort)...");
  const tweetKort = await generateTweetPost({
    text: "Je lichaam is niet kapot. Het reageert precies zoals het hoort op wat jij het geeft.",
  });
  fs.writeFileSync(path.join(__dirname, "test_tweet_kort.png"), tweetKort);
  console.log("✓ Gegenereerd, sturen naar Telegram...");
  await sendPhotoToTelegram(tweetKort, "🐦 Tweet post — kort (groot font)");
  console.log("✓ Kort tweet verzonden");

  console.log("Genereer tweet post (lang)...");
  const tweetLang = await generateTweetPost({
    text: "Zonnecrème met SPF 50 blokkeert niet alleen UV — het blokkeert ook de vitamine D aanmaak die je immuunsysteem nodig heeft. Elke dag smeren is elke dag tekort. Je huid heeft zon nodig, geen filter.",
  });
  fs.writeFileSync(path.join(__dirname, "test_tweet_lang.png"), tweetLang);
  console.log("✓ Gegenereerd, sturen naar Telegram...");
  await sendPhotoToTelegram(tweetLang, "🐦 Tweet post — lang (kleiner font)");
  console.log("✓ Lang tweet verzonden");

  console.log("Genereer nieuws post...");
  const news = await generateNewsPost({
    headline: "Je darmen bepalen je immuunsysteem — niet je pillen",
    highlightWords: ["darmen", "immuunsysteem"],
    imagePrompt: "close-up of healthy gut bacteria microbiome, organic natural textures, dark moody studio lighting",
  });
  fs.writeFileSync(path.join(__dirname, "test_news_fixed.png"), news);
  console.log("✓ Gegenereerd, sturen naar Telegram...");
  await sendPhotoToTelegram(news, "📰 Nieuws post — test");
  console.log("✓ Nieuws verzonden");
}

main().catch(console.error);
