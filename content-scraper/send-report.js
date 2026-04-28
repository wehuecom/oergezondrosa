#!/usr/bin/env node
"use strict";
const https = require("https");

const TOKEN = "8640244732:AAGqtmb4MITZBv9vVcY03GJeO6iWLkY3OXc";
const CHAT = "-5279920497";

function send(text) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ chat_id: CHAT, text });
    const req = https.request({
      hostname: "api.telegram.org",
      path: `/bot${TOKEN}/sendMessage`,
      method: "POST",
      headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
    }, (res) => {
      let d = "";
      res.on("data", (c) => d += c);
      res.on("end", () => { console.log("Status:", res.statusCode); resolve(); });
    });
    req.on("error", reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  const report1 = [
    "INSTAGRAM FORMAT ANALYSE",
    "zondag 27 april 2026",
    "120 posts van 10 accounts",
    "",
    "=== FORMAT PERFORMANCE ===",
    "",
    "VIDEO (51x)",
    "  Gem. likes: 83.933",
    "  Gem. comments: 870",
    "  Gem. engagement rate: 9,52%",
    "",
    "CAROUSEL (51x)",
    "  Gem. likes: 16.257",
    "  Gem. comments: 621",
    "  Gem. engagement rate: 4,16%",
    "",
    "IMAGE (18x)",
    "  Gem. likes: 1.648",
    "  Gem. comments: 22",
    "  Gem. engagement rate: 0,17%",
    "",
    "Winnaar: VIDEO met 9,52% gem. ER",
    "Beste non-video: CAROUSEL (4,16% vs 0,17% image)",
    "",
    "=== TOP 10 NON-VIDEO POSTS ===",
    "",
    "1. @vitallymelanie [carousel 10x] 60,89% ER | 105.269 likes",
    "2. @vitallymelanie [carousel] 16,12% ER | 27.703 likes",
    "3. @vitallymelanie [carousel] 13,09% ER | 22.412 likes",
    "4. @vitallymelanie [carousel] 12,41% ER | 20.470 likes",
    "5. @vitallymelanie [carousel] 12,20% ER | 21.007 likes",
    "6. @vitallymelanie [carousel] 11,23% ER | 19.304 likes",
    "7. @vitallymelanie [carousel] 10,58% ER | 18.237 likes",
    "8. @vitallymelanie [carousel] 10,20% ER | 17.629 likes",
    "9. @vitallymelanie [carousel] 8,95% ER | 15.287 likes",
    "10. @vitallymelanie [carousel] 8,19% ER | 14.098 likes",
    "",
    "@vitallymelanie domineert de top 10 volledig met carousels!",
  ].join("\n");

  const report2 = [
    "=== CAPTION LENGTE vs ENGAGEMENT ===",
    "",
    "Zeer lang (1000+): 18,26% ER (22 posts)",
    "Kort (0-100): 5,80% ER (16 posts)",
    "Lang (501-1000): 3,94% ER (35 posts)",
    "Middel (101-500): 1,46% ER (47 posts)",
    "",
    "=== CAROUSEL SLIDES SWEET SPOT ===",
    "",
    "10 slides: 22,29% ER (5x) - WINNAAR",
    "5 slides: 6,39% ER (4x)",
    "8 slides: 5,37% ER (2x)",
    "3 slides: 2,74% ER (9x)",
    "9 slides: 2,72% ER (9x)",
    "",
    "Sweet spot: 10 slides",
    "",
    "=== HASHTAGS ===",
    "",
    "Met hashtags: 1,15% ER (38 posts)",
    "Zonder hashtags: 8,67% ER (82 posts)",
    "",
    "Conclusie: hashtags helpen NIET",
    "",
    "=== ACCOUNT RANKING (gem. engagement rate) ===",
    "",
    "@vitallymelanie - 15,69% ER | 174.843 flw | alleen carousels",
    "@niallkiddle - 10,42% ER | 548.282 flw | video dominant",
    "@natural_living00 - 7,21% ER | 352.560 flw | mix",
    "@seedoilscout - 6,45% ER | 584.907 flw | video + carousel",
    "@holistichealths - 5,68% ER | 594.400 flw | video + carousel",
    "@gewoonbalans - 4,87% ER | 43.790 flw | carousel dominant",
    "@thehealthymail - 3,08% ER | 516.563 flw | carousel + video",
    "@drmarkhyman - 0,34% ER | 3.714.489 flw | video + carousel",
    "@feelwellbyanna - 0,26% ER | 311.343 flw | image + carousel",
    "@carnivoreaurelius - 0,18% ER | 1.111.079 flw | carousel + image",
    "",
    "=== KEY TAKEAWAYS VOOR OERGEZOND ===",
    "",
    "1. CAROUSELS zijn het beste non-video format (4,16% ER vs 0,17% voor images)",
    "2. Images presteren dramatisch slecht - vermijd single images",
    "3. 10 slides is de sweet spot voor carousels (22,29% ER)",
    "4. Zeer lange captions (1000+) presteren het best (18,26% ER)",
    "5. Hashtags verlagen engagement - beter weglaten",
    "6. @vitallymelanie is het rolmodel: puur carousels, mega engagement",
    "7. Voor Oergezond: focus op carousels (10 slides) + lange educatieve captions + geen hashtags",
  ].join("\n");

  await send(report1);
  await new Promise(r => setTimeout(r, 600));
  await send(report2);
  console.log("Done!");
}

main();
