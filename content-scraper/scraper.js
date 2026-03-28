#!/usr/bin/env node
/**
 * Oergezond Content Scraper
 * ==========================
 * Draait elke keer als de laptop opstart.
 * Scrapet viral Instagram posts van competitors + hashtags,
 * laat Claude content ideeën genereren en stuurt ze naar Telegram.
 *
 * Starten: node scraper.js
 */

"use strict";

const https = require("https");
const cfg = require("./config.js");
const { COMPETITORS, HASHTAGS } = require("./accounts.js");
const { generateCarousel, generateNewsPost, generateTweetPost } = require("./generate-statics.js");

const APIFY_TOKEN = cfg.APIFY_API_TOKEN;
const TELEGRAM_TOKEN = cfg.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = cfg.TELEGRAM_CHAT_ID;
const CLAUDE_API_KEY = cfg.CLAUDE_API_KEY;

const POSTS_PER_ACCOUNT = 5; // hoeveel posts per account ophalen
const POSTS_PER_HASHTAG = 15; // hoeveel posts per hashtag ophalen
const TOP_POSTS_FOR_CLAUDE = 20; // hoeveel top posts naar Claude sturen

// ============================================================
// HELPERS
// ============================================================

function httpsRequest(options, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data) });
        } catch {
          resolve({ status: res.statusCode, body: data });
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(Buffer.isBuffer(body) ? body : (typeof body === "string" ? body : JSON.stringify(body)));
    req.end();
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg) {
  const time = new Date().toLocaleTimeString("nl-NL");
  console.log(`[${time}] ${msg}`);
}

// ============================================================
// APIFY
// ============================================================

async function runApifyActor(input) {
  log("Apify run starten...");
  const body = JSON.stringify(input);

  const res = await httpsRequest(
    {
      hostname: "api.apify.com",
      path: `/v2/acts/apify~instagram-scraper/runs?token=${APIFY_TOKEN}`,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body
  );

  if (res.status !== 201) {
    throw new Error(`Apify start mislukt: ${JSON.stringify(res.body)}`);
  }

  const runId = res.body.data.id;
  log(`Apify run gestart: ${runId}`);
  return runId;
}

async function waitForApifyRun(runId, maxWaitMs = 480000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    await sleep(8000);
    const res = await httpsRequest({
      hostname: "api.apify.com",
      path: `/v2/actor-runs/${runId}?token=${APIFY_TOKEN}`,
      method: "GET",
    });

    const status = res.body?.data?.status;
    log(`Apify status: ${status}`);

    if (status === "SUCCEEDED") return true;
    if (status === "FAILED" || status === "ABORTED") {
      throw new Error(`Apify run mislukt: ${status}`);
    }
  }
  throw new Error("Apify timeout na 3 minuten");
}

async function getApifyResults(runId) {
  const res = await httpsRequest({
    hostname: "api.apify.com",
    path: `/v2/actor-runs/${runId}/dataset/items?token=${APIFY_TOKEN}&limit=200`,
    method: "GET",
  });
  return res.body || [];
}

// ============================================================
// SCRAPEN
// ============================================================

async function scrapeCompetitors() {
  const urls = COMPETITORS.map(
    (h) => `https://www.instagram.com/${h}/`
  );

  log(`Scrapen van ${COMPETITORS.length} competitor accounts...`);

  const runId = await runApifyActor({
    directUrls: urls,
    resultsType: "posts",
    resultsLimit: POSTS_PER_ACCOUNT,
    addParentData: true,
  });

  await waitForApifyRun(runId);
  const posts = await getApifyResults(runId);
  log(`${posts.length} posts opgehaald van competitors`);
  return posts;
}

async function scrapeHashtags() {
  const urls = HASHTAGS.map(
    (tag) => `https://www.instagram.com/explore/tags/${tag}/`
  );

  log(`Scrapen van ${HASHTAGS.length} hashtags...`);

  const runId = await runApifyActor({
    directUrls: urls,
    resultsType: "posts",
    resultsLimit: POSTS_PER_HASHTAG,
    addParentData: true,
  });

  await waitForApifyRun(runId);
  const posts = await getApifyResults(runId);
  log(`${posts.length} posts opgehaald van hashtags`);
  return posts;
}

// ============================================================
// FILTEREN — top posts op engagement
// ============================================================

function filterTopPosts(posts, limit) {
  return posts
    .filter((p) => p.likesCount !== undefined || p.commentsCount !== undefined)
    .map((p) => ({
      account: p.ownerUsername || p.username || "onbekend",
      type: p.type || (p.videoUrl ? "video" : "image"),
      caption: (p.caption || p.alt || "").slice(0, 300),
      likes: p.likesCount || 0,
      comments: p.commentsCount || 0,
      views: p.videoViewCount || p.videoPlayCount || 0,
      engagement: (p.likesCount || 0) + (p.commentsCount || 0) * 3,
      url: p.url || p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : "",
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit);
}

// ============================================================
// CLAUDE
// ============================================================

async function generateContentIdeas(topPosts) {
  log("Claude om content ideeën vragen...");

  const postsText = topPosts
    .map(
      (p, i) =>
        `${i + 1}. @${p.account} [${p.type}] | ${p.likes} likes, ${p.comments} comments${p.views ? `, ${p.views} views` : ""}
   Caption: ${p.caption || "(geen caption)"}`
    )
    .join("\n\n");

  const prompt = `Je bent de content strategist van Oergezond — een Nederlands gezondheidsplatform dat mensen helpt moderne gezondheidsproblemen op te lossen met oervoeding, circadiaans ritme, hormoonbalans, natuurlijke huidverzorging en holistische leefstijl.

Oergezond is GEEN gewone crème-webshop. Het is een gezondheidsplatform. Thema's: voeding (carnivore, paleo, oervoeding, neus-tot-staart eten), hormonen, slaap, circadiaans ritme, toxines vermijden, huid van binnenuit herstellen, mentale helderheid, energie, kinderen gezond opvoeden.

Brand voice: confronterend eerlijk, rustig zelfverzekerd, educatief. Spreektaal. Korte zinnen.
Gebruik: troep, puur, oer-, echt, gewoon, hormoonvriendelijk, grasgevoerd, herstel van binnenuit.
Nooit: journey, ritual, glow up, clean beauty, superfoods, revolutionair.

Hier zijn de ${topPosts.length} meest virale posts uit de gezondheids-niche op Instagram deze week:

${postsText}

Analyseer wat viral gaat en genereer content voor Oergezond. Geef je output ALLEEN als geldig JSON in dit exacte formaat:

{
  "reels": [
    {
      "hook": "eerste 3 seconden tekst",
      "opbouw": "wat laat je zien/vertellen",
      "cta": "call to action"
    }
  ],
  "carousel": {
    "title": "pakkende cover titel die triggert om verder te lezen (max 8 woorden)",
    "subtitle": "kort en confronterend, max 15 woorden",
    "slides": [
      { "headline": "korte krachtige stelling max 6 woorden", "body": "1-2 zinnen toelichting, simpel en direct" },
      { "headline": "...", "body": "..." },
      { "headline": "...", "body": "..." },
      { "headline": "...", "body": "..." }
    ]
  },
  "newsPost": {
    "headline": "ALLES HOOFDLETTERS, max 18 woorden, confronterend feit of stelling",
    "highlightWords": ["woord1", "woord2"],
    "imagePrompt": "beschrijving voor AI afbeelding die past bij het onderwerp, naturalistisch en donker"
  },
  "tweetPost": {
    "text": "tweet tekst, max 280 tekens, confronterend en deelbaar, geen hashtags"
  },
  "stories": [
    { "format": "poll/swipe/vraag/tip", "tekst": "..." },
    { "format": "...", "tekst": "..." }
  ]
}

Geef ALLEEN de JSON terug, geen extra tekst.`;

  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const res = await httpsRequest(
    {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body
  );

  if (res.status !== 200) {
    throw new Error(`Claude API mislukt: ${JSON.stringify(res.body)}`);
  }

  return res.body.content[0].text;
}

// ============================================================
// INSTAGRAM CAPTION GENERATOR
// ============================================================

async function generateInstagramCaption(postType, data) {
  const onderwerp = postType === "tweet"
    ? `Tweet post met tekst: "${data.text}"`
    : `Nieuws post met headline: "${data.headline}"`;

  const prompt = `Je schrijft een Instagram caption voor Oergezond (@oergezond).

Brand voice: confronterend eerlijk, rustig zelfverzekerd, educatief. Spreektaal. Korte zinnen.
Gebruik: troep, puur, oer-, echt, gewoon, hormoonvriendelijk, grasgevoerd, herstel van binnenuit.
Nooit: journey, ritual, glow up, clean beauty, superfoods, revolutionair.

Structuur:
1. Openingszin die triggert (confronterend of verrassend feit)
2. Kort probleem benoemen (2-3 zinnen)
3. Simpele oplossing of inzicht
4. CTA: korte vraag of actie (bijv. "Sla op voor later." of "Ken jij iemand die dit moet lezen?")
5. Witregel
6. 8-12 relevante hashtags (mix van groot en niche, Nederlands en Engels)

Onderwerp: ${onderwerp}

Geef ALLEEN de caption terug, geen uitleg. Klaar om te kopiëren naar Instagram.`;

  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  const res = await httpsRequest(
    {
      hostname: "api.anthropic.com",
      path: "/v1/messages",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Length": Buffer.byteLength(body),
      },
    },
    body
  );

  if (res.status !== 200) throw new Error(`Claude caption mislukt: ${res.status}`);
  return res.body.content[0].text;
}

// ============================================================
// TELEGRAM
// ============================================================

async function sendTelegram(text) {
  // Telegram max 4096 tekens per bericht — splits indien nodig
  const chunks = [];
  let remaining = text;
  while (remaining.length > 0) {
    chunks.push(remaining.slice(0, 4000));
    remaining = remaining.slice(4000);
  }

  for (const chunk of chunks) {
    const body = JSON.stringify({
      chat_id: TELEGRAM_CHAT_ID,
      text: chunk,
      parse_mode: "Markdown",
    });

    await httpsRequest(
      {
        hostname: "api.telegram.org",
        path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(body),
        },
      },
      body
    );

    await sleep(500);
  }
}

// ============================================================
// TELEGRAM FOTO STUREN
// ============================================================

async function sendTelegramPhoto(buffer, caption = "", replyMarkup = null) {
  const boundary = "----FormBoundary" + Date.now();
  const parts = [
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${TELEGRAM_CHAT_ID}\r\n`),
  ];
  if (caption) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`));
  }
  if (replyMarkup) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="reply_markup"\r\n\r\n${JSON.stringify(replyMarkup)}\r\n`));
  }
  parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="photo"; filename="post.png"\r\nContent-Type: image/png\r\n\r\n`));
  parts.push(buffer);
  parts.push(Buffer.from(`\r\n--${boundary}--\r\n`));

  const body = Buffer.concat(parts);

  await httpsRequest(
    {
      hostname: "api.telegram.org",
      path: `/bot${TELEGRAM_TOKEN}/sendPhoto`,
      method: "POST",
      headers: {
        "Content-Type": `multipart/form-data; boundary=${boundary}`,
        "Content-Length": body.length,
      },
    },
    body
  );
}

async function answerCallbackQuery(callbackQueryId) {
  const body = JSON.stringify({ callback_query_id: callbackQueryId });
  await httpsRequest({
    hostname: "api.telegram.org",
    path: `/bot${TELEGRAM_TOKEN}/answerCallbackQuery`,
    method: "POST",
    headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
  }, body);
}

// Poll voor callback queries en genereer statics op aanvraag
async function pollCallbacks(topPosts, durationMs = 20 * 60 * 1000) {
  log("Luisteren naar knopreacties (20 min)...");
  let offset = 0;
  const end = Date.now() + durationMs;

  while (Date.now() < end) {
    const res = await httpsRequest({
      hostname: "api.telegram.org",
      path: `/bot${TELEGRAM_TOKEN}/getUpdates?offset=${offset}&timeout=30&allowed_updates=["callback_query"]`,
      method: "GET",
    });

    const updates = res.body?.result || [];
    for (const update of updates) {
      offset = update.update_id + 1;
      const cq = update.callback_query;
      if (!cq) continue;

      await answerCallbackQuery(cq.id);
      const [action, idxStr] = cq.data.split(":");
      const idx = parseInt(idxStr);
      const post = topPosts[idx];
      if (!post) continue;

      log(`Knop gedrukt: ${action} voor post ${idx + 1} (@${post.account})`);
      await sendTelegram(`⏳ Genereer *${action === "tweet" ? "Tweet post" : "Nieuws post"}* voor post van @${post.account}...`);

      try {
        // Laat Claude een tekst maken specifiek voor deze post
        const ideaRaw = await generateContentIdeas([post]);
        const jsonMatch = ideaRaw.match(/\{[\s\S]*\}/);
        const idea = JSON.parse(jsonMatch ? jsonMatch[0] : ideaRaw);

        if (action === "tweet") {
          const buf = await generateTweetPost(idea.tweetPost);
          await sendTelegramPhoto(buf, `🐦 *Tweet post klaar*`);
          const caption = await generateInstagramCaption("tweet", idea.tweetPost);
          await sendTelegram(`📋 *Instagram caption — kopieer naar Business Suite:*\n\n${caption}`);
        } else {
          const buf = await generateNewsPost(idea.newsPost);
          await sendTelegramPhoto(buf, `📰 *Nieuws post klaar*`);
          const caption = await generateInstagramCaption("news", idea.newsPost);
          await sendTelegram(`📋 *Instagram caption — kopieer naar Business Suite:*\n\n${caption}`);
        }
      } catch (e) {
        await sendTelegram(`⚠️ Genereren mislukt: ${e.message}`);
      }
    }

    if (updates.length === 0) await sleep(2000);
  }
  log("Klaar met luisteren naar knopreacties.");
}

// ============================================================
// DAGELIJKSE RUN CHECK
// ============================================================

const LAST_RUN_FILE = require("path").join(__dirname, ".last-run");

function alreadyRanToday() {
  try {
    const last = require("fs").readFileSync(LAST_RUN_FILE, "utf8").trim();
    return last === new Date().toISOString().slice(0, 10);
  } catch { return false; }
}

function markRanToday() {
  require("fs").writeFileSync(LAST_RUN_FILE, new Date().toISOString().slice(0, 10), "utf8");
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  log("=== Oergezond Content Scraper gestart ===");

  if (alreadyRanToday()) {
    log("Al gedraaid vandaag — stop.");
    return;
  }

  try {
    // Scrapen
    const [competitorPosts, hashtagPosts] = await Promise.all([
      scrapeCompetitors(),
      scrapeHashtags(),
    ]);

    const allPosts = [...competitorPosts, ...hashtagPosts];
    log(`Totaal ${allPosts.length} posts verzameld`);

    if (allPosts.length === 0) {
      await sendTelegram("⚠️ Content Scraper: geen posts gevonden vandaag. Apify quota mogelijk bereikt.");
      return;
    }

    // Top posts selecteren
    const topPosts = filterTopPosts(allPosts, TOP_POSTS_FOR_CLAUDE);
    log(`Top ${topPosts.length} posts geselecteerd op engagement`);

    // Ideeën genereren
    const rawIdeas = await generateContentIdeas(topPosts);

    // JSON parsen
    let ideas;
    try {
      const jsonMatch = rawIdeas.match(/\{[\s\S]*\}/);
      ideas = JSON.parse(jsonMatch ? jsonMatch[0] : rawIdeas);
    } catch (e) {
      throw new Error("Claude gaf geen geldige JSON: " + e.message);
    }

    const datum = new Date().toLocaleDateString("nl-NL", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });

    // Bericht 1: header
    await sendTelegram(`📊 *Viral deze week — ${datum}*\n_Top ${topPosts.length} posts op engagement_`);

    // Bericht per virale post — met knoppen om na te maken
    for (let i = 0; i < topPosts.length; i++) {
      const p = topPosts[i];
      const type = p.type === "video" ? "🎬" : "🖼️";
      const stats = `${p.likes.toLocaleString("nl-NL")} likes${p.views ? ` · ${p.views.toLocaleString("nl-NL")} views` : ""} · ${p.comments} reacties`;
      const caption = p.caption ? `\n_"${p.caption.slice(0, 120)}${p.caption.length > 120 ? "…" : ""}"_` : "";
      const text = `${type} *${i + 1}. @${p.account}*\n${stats}${caption}\n${p.url}`;
      const markup = {
        inline_keyboard: [[
          { text: "🐦 Tweet post", callback_data: `tweet:${i}` },
          { text: "📰 Nieuws post", callback_data: `news:${i}` },
        ]],
      };
      await sendTelegram(text);
      // Stuur een apart bericht met de knoppen onder de post
      const btnBody = JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: `↑ Post ${i + 1} namaken als:`,
        parse_mode: "Markdown",
        reply_markup: markup,
      });
      await httpsRequest({
        hostname: "api.telegram.org",
        path: `/bot${TELEGRAM_TOKEN}/sendMessage`,
        method: "POST",
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(btnBody) },
      }, btnBody);
      await sleep(300);
    }

    // Bericht 2: Reel ideeën (tekst)
    const reelText = ideas.reels
      .map((r, i) => `*Reel ${i + 1}*\nHook: ${r.hook}\nOpbouw: ${r.opbouw}\nCTA: ${r.cta}`)
      .join("\n\n");
    await sendTelegram(`🎬 *Reel Ideeën*\n\n${reelText}`);

    // Bericht 3: Story ideeën (tekst)
    const storyText = ideas.stories
      .map((s, i) => `*Story ${i + 1} — ${s.format}*\n${s.tekst}`)
      .join("\n\n");
    await sendTelegram(`📖 *Story Ideeën*\n\n${storyText}`);

    // Statics genereren
    log("Carousel genereren...");
    await sendTelegram(`🖼️ *Statics worden nu gegenereerd...*`);

    const carouselSlides = await generateCarousel(ideas.carousel);
    for (const slide of carouselSlides) {
      await sendTelegramPhoto(slide.buffer);
      await sleep(600);
    }
    log("Carousel verstuurd ✅");

    log("Nieuws post genereren...");
    const newsBuffer = await generateNewsPost(ideas.newsPost);
    await sendTelegramPhoto(newsBuffer, `📰 *Nieuws post klaar*`);
    const newsCaption = await generateInstagramCaption("news", ideas.newsPost);
    await sendTelegram(`📋 *Instagram caption nieuws post:*\n\n${newsCaption}`);
    log("Nieuws post verstuurd ✅");

    log("Tweet post genereren...");
    const tweetBuffer = await generateTweetPost(ideas.tweetPost);
    await sendTelegramPhoto(tweetBuffer, `🐦 *Tweet post klaar*`);
    const tweetCaption = await generateInstagramCaption("tweet", ideas.tweetPost);
    await sendTelegram(`📋 *Instagram caption tweet post:*\n\n${tweetCaption}`);
    log("Tweet post verstuurd ✅");

    log("Alles verstuurd naar Telegram ✅");
    markRanToday();

    // Luister 20 minuten naar knopreacties
    await pollCallbacks(topPosts);

  } catch (err) {
    log(`FOUT: ${err.message}`);
    await sendTelegram(`⚠️ Content Scraper fout: ${err.message}`).catch(() => {});
    process.exit(1);
  }
}

main();
