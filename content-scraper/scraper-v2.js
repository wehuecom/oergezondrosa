#!/usr/bin/env node
/**
 * Oergezond Content Pipeline v3
 * ==============================
 * Dagelijks:  Viral Reels Report (PDF naar Telegram)
 * Ma/Wo/Vr:  3 nieuws + 3 tweet statics
 *
 * Draait via pm2 op de Mac Mini.
 * Starten: node scraper-v2.js
 */

"use strict";

const https = require("https");
const fs = require("fs");
const path = require("path");
const cfg = require("./config.js");
const { COMPETITORS, HASHTAGS } = require("./accounts.js");
const { generateNewsPost, generateTweetPost } = require("./generate-statics.js");
const { generateViralReelsReport } = require("./viral-reels-report.js");

const TELEGRAM_TOKEN = cfg.TELEGRAM_TOKEN;
const TELEGRAM_CHAT_ID = cfg.TELEGRAM_CHAT_ID;
const CLAUDE_API_KEY = cfg.CLAUDE_API_KEY;
const IG_SESSION_ID = cfg.IG_SESSION_ID;

const POSTS_PER_ACCOUNT = 5;
const POSTS_PER_HASHTAG = 8;
const MAX_REELS_FOR_REPORT = 8;

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
// INSTAGRAM PRIVATE API
// ============================================================

const SESSION_ID = decodeURIComponent(IG_SESSION_ID);

function igRequest(method, path, params = {}, bodyStr = null) {
  const qs = Object.keys(params).length
    ? "?" + Object.entries(params).map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`).join("&")
    : "";
  const bodyBuf = bodyStr ? Buffer.from(bodyStr) : null;

  return new Promise((resolve, reject) => {
    const headers = {
      "User-Agent": "Instagram 269.0.0.18.75 Android (26/8.0.0; 480dpi; 1080x1920; OnePlus; ONEPLUS A3010; OnePlus3T; qcom; nl_NL; 314665256)",
      Cookie: `sessionid=${SESSION_ID}`,
      "X-IG-App-ID": "936619743392459",
      Accept: "*/*",
      "Accept-Language": "nl-NL",
    };
    if (bodyBuf) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      headers["Content-Length"] = bodyBuf.length;
    }

    const req = https.request(
      { hostname: "i.instagram.com", path: `/api/v1${path}${qs}`, method, headers },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
          catch { resolve({ status: res.statusCode, body: data }); }
        });
      }
    );
    req.on("error", reject);
    if (bodyBuf) req.write(bodyBuf);
    req.end();
  });
}

function mapIgPost(item, username) {
  const isVideo = item.media_type === 2;
  return {
    ownerUsername: item.user?.username || username,
    type: isVideo ? "video" : item.media_type === 8 ? "carousel" : "image",
    caption: item.caption?.text || "",
    likesCount: item.like_count || 0,
    commentsCount: item.comment_count || 0,
    videoViewCount: item.play_count || item.view_count || 0,
    shortCode: item.code || String(item.pk || ""),
    videoUrl: isVideo ? "yes" : null,
    timestamp: item.taken_at || 0,
  };
}

async function scrapeAccount(username) {
  try {
    const profRes = await igRequest("GET", "/users/web_profile_info/", { username });
    if (profRes.status !== 200) {
      log(`  [IG] @${username}: profiel ${profRes.status} — overgeslagen`);
      return [];
    }
    const userId = profRes.body?.data?.user?.id;
    if (!userId) { log(`  [IG] @${username}: geen user ID`); return []; }

    await sleep(3000);
    const feedRes = await igRequest("GET", `/feed/user/${userId}/`, { count: String(POSTS_PER_ACCOUNT) });
    if (feedRes.status !== 200) {
      log(`  [IG] @${username}: feed ${feedRes.status}`);
      return [];
    }
    const items = feedRes.body?.items || [];
    log(`  [IG] @${username}: ${items.length} posts`);
    return items.map((it) => mapIgPost(it, username));
  } catch (e) {
    log(`  [IG] @${username} fout: ${e.message}`);
    return [];
  }
}

async function scrapeHashtag(tag) {
  try {
    const res = await igRequest("POST", `/tags/${tag}/sections/`, `tab=top&page=1&surface=explore`);
    if (res.status !== 200) {
      log(`  [IG] #${tag}: ${res.status} — overgeslagen`);
      return [];
    }
    const sections = res.body?.sections || [];
    const items = sections.flatMap((s) => s.layout_content?.medias?.map((m) => m.media) || []);
    log(`  [IG] #${tag}: ${items.length} posts`);
    return items.slice(0, POSTS_PER_HASHTAG).map((it) => mapIgPost(it, it.user?.username || tag));
  } catch (e) {
    log(`  [IG] #${tag} fout: ${e.message}`);
    return [];
  }
}

// ============================================================
// SCRAPEN
// ============================================================

async function scrapeAll() {
  log(`Scrapen van ${COMPETITORS.length} accounts + ${HASHTAGS.length} hashtags...`);
  const all = [];

  for (const username of COMPETITORS) {
    const posts = await scrapeAccount(username);
    all.push(...posts);
    await sleep(3000);
  }

  for (const tag of HASHTAGS) {
    const posts = await scrapeHashtag(tag);
    all.push(...posts);
    await sleep(3000);
  }

  log(`Totaal ${all.length} posts verzameld`);
  return all;
}

// ============================================================
// FILTER — alleen reels, gesorteerd op views
// ============================================================

function filterReels(posts, limit = MAX_REELS_FOR_REPORT) {
  return posts
    .filter((p) => p.type === "video" && p.shortCode)
    .map((p) => ({
      account: p.ownerUsername,
      caption: (p.caption || "").slice(0, 300),
      likes: p.likesCount || 0,
      comments: p.commentsCount || 0,
      views: p.videoViewCount || 0,
      url: `https://www.instagram.com/reel/${p.shortCode}/`,
      shortCode: p.shortCode,
    }))
    .sort((a, b) => (b.views || b.likes * 10) - (a.views || a.likes * 10))
    .slice(0, limit);
}

function filterTopPosts(posts, limit) {
  return posts
    .map((p) => ({
      account: p.ownerUsername,
      type: p.type,
      caption: (p.caption || "").slice(0, 300),
      likes: p.likesCount || 0,
      comments: p.commentsCount || 0,
      views: p.videoViewCount || 0,
      engagement: (p.likesCount || 0) + (p.commentsCount || 0) * 3,
      url: p.shortCode ? `https://www.instagram.com/p/${p.shortCode}/` : "",
    }))
    .sort((a, b) => b.engagement - a.engagement)
    .slice(0, limit);
}

// ============================================================
// DEDUP — eerder gezien bijhouden
// ============================================================

const SEEN_REELS_FILE = path.join(__dirname, ".seen-reels.json");
const USED_TOPICS_FILE = path.join(__dirname, ".used-topics.json");

function loadSeenReels() {
  try { return JSON.parse(fs.readFileSync(SEEN_REELS_FILE, "utf8")); }
  catch { return []; }
}

function saveSeenReels(codes) {
  const unique = [...new Set(codes)].slice(-200);
  fs.writeFileSync(SEEN_REELS_FILE, JSON.stringify(unique, null, 2), "utf8");
}

function loadUsedTopics() {
  try { return JSON.parse(fs.readFileSync(USED_TOPICS_FILE, "utf8")); }
  catch { return []; }
}

function saveUsedTopics(topics) {
  const unique = [...new Set(topics)].slice(-80);
  fs.writeFileSync(USED_TOPICS_FILE, JSON.stringify(unique, null, 2), "utf8");
}

// ============================================================
// DAGELIJKSE RUN CHECK
// ============================================================

const LAST_RUN_FILE = path.join(__dirname, ".last-run");

function alreadyRanToday() {
  try {
    const last = fs.readFileSync(LAST_RUN_FILE, "utf8").trim();
    return last === new Date().toISOString().slice(0, 10);
  } catch { return false; }
}

function markRanToday() {
  fs.writeFileSync(LAST_RUN_FILE, new Date().toISOString().slice(0, 10), "utf8");
}

// ============================================================
// TELEGRAM
// ============================================================

async function sendTelegram(text) {
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
        headers: { "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) },
      },
      body
    );
    await sleep(500);
  }
}

async function sendTelegramPhoto(buffer, caption = "") {
  const boundary = "----FormBoundary" + Date.now();
  const parts = [
    Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="chat_id"\r\n\r\n${TELEGRAM_CHAT_ID}\r\n`),
  ];
  if (caption) {
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="caption"\r\n\r\n${caption}\r\n`));
    parts.push(Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="parse_mode"\r\n\r\nMarkdown\r\n`));
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
      headers: { "Content-Type": `multipart/form-data; boundary=${boundary}`, "Content-Length": body.length },
    },
    body
  );
}

// ============================================================
// CLAUDE — STATICS GENEREREN (3 nieuws + 3 tweet)
// ============================================================

async function generateStaticContent(topPosts, usedTopics) {
  log("Claude om static content vragen (3 nieuws + 3 tweet)...");

  const postsText = topPosts
    .map((p, i) => `${i + 1}. @${p.account} [${p.type}] | ${p.likes} likes, ${p.comments} comments${p.views ? `, ${p.views} views` : ""}\n   Caption: ${p.caption || "(geen)"}`)
    .join("\n\n");

  const prompt = `Je bent de content strategist van Oergezond — een Nederlands gezondheidsplatform. Oervoeding, circadiaans ritme, hormoonbalans, natuurlijke huidverzorging, holistische leefstijl.

Brand voice: confronterend eerlijk, rustig zelfverzekerd, educatief. Spreektaal. Korte zinnen.
Gebruik: troep, puur, oer-, echt, gewoon, hormoonvriendelijk, grasgevoerd, herstel van binnenuit.
Nooit: journey, ritual, glow up, clean beauty, superfoods, revolutionair.

${topPosts.length > 0 ? `Hier zijn ${topPosts.length} virale posts uit de niche:\n\n${postsText}\n\n` : ""}${usedTopics.length > 0 ? `⛔ VERMIJD deze onderwerpen (al eerder gebruikt):\n${usedTopics.join(", ")}\n\n` : ""}Genereer HOGE KWALITEIT content. Elke post moet:
- Gebaseerd zijn op een feitelijk onderbouwde claim met echte bron
- Een scroll-stopping headline hebben die mensen STOPT
- Direct relevant zijn voor iemand met huidproblemen, vermoeidheid, of voedingsinteresse

Geef output als JSON:
{
  "newsPosts": [
    {
      "onderwerp": "kort thema",
      "bron": "concrete bron — bijv. 'JAMA 2021', 'onderzoek Dr. Chris Kresser'",
      "headline": "ALLES HOOFDLETTERS, max 12 woorden, confronterend en hard",
      "highlightWords": ["woord1", "woord2"],
      "imagePrompt": "Engelse beschrijving (max 12 woorden) van concreet object, donker, realistisch. Geen mensen."
    },
    { ... },
    { ... }
  ],
  "tweetPosts": [
    {
      "onderwerp": "kort thema",
      "bron": "concrete bron",
      "text": "tweet tekst max 280 tekens, confronterend en deelbaar, geen hashtags"
    },
    { ... },
    { ... }
  ]
}

Regels:
- 3 nieuws + 3 tweet = 6 posts over 6 COMPLEET VERSCHILLENDE onderwerpen
- Elke claim moet feitelijk kloppen en traceerbaar naar de bron
- Nederlands, geen anglicismen
- Headlines HOOFDLETTERS, max 12 woorden
- Alleen posts die je zou STOPPEN voor op Instagram. Geen vulling.
- Alleen JSON terug.`;

  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 3000,
    messages: [{ role: "user", content: prompt }],
  });

  for (let attempt = 1; attempt <= 3; attempt++) {
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

    if (res.status === 200) return res.body.content[0].text;

    const isOverloaded = res.status === 529 || res.status === 429;
    if (isOverloaded && attempt < 3) {
      log(`Claude API ${res.status} — poging ${attempt}/3, wacht ${attempt * 20}s...`);
      await sleep(attempt * 20000);
      continue;
    }
    throw new Error(`Claude API mislukt: ${res.status}`);
  }
}

// ============================================================
// INSTAGRAM CAPTION
// ============================================================

async function generateInstagramCaption(postType, data) {
  const onderwerp = postType === "tweet"
    ? `Tweet post met tekst: "${data.text}"`
    : `Nieuws post met headline: "${data.headline}"`;

  const prompt = `Schrijf een Instagram caption voor Oergezond (@oergezond).

Brand voice: confronterend eerlijk, rustig zelfverzekerd, educatief. Spreektaal. Korte zinnen. Nederlands.
Gebruik: troep, puur, oer-, echt, gewoon, hormoonvriendelijk, grasgevoerd, herstel van binnenuit.

Structuur:
1. Openingszin die triggert
2. Probleem kort benoemen (2-3 zinnen)
3. Simpele oplossing
4. CTA: korte vraag of actie
5. Witregel
6. 8-12 hashtags (mix groot en niche, NL en EN)

Onderwerp: ${onderwerp}

Geef ALLEEN de caption terug. Klaar om te kopiëren.`;

  const body = JSON.stringify({
    model: "claude-sonnet-4-6",
    max_tokens: 600,
    messages: [{ role: "user", content: prompt }],
  });

  for (let attempt = 1; attempt <= 3; attempt++) {
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

    if (res.status === 200) return res.body.content[0].text;
    if ((res.status === 529 || res.status === 429) && attempt < 3) {
      await sleep(attempt * 15000);
      continue;
    }
    throw new Error(`Claude caption mislukt: ${res.status}`);
  }
}

// ============================================================
// KWALITEITSCHECK (snelle versie)
// ============================================================

function qualityCheck(ideas) {
  const news = ideas.newsPosts || [];
  const tweets = ideas.tweetPosts || [];

  // Check minimale aantallen
  if (news.length < 3 || tweets.length < 3) return false;

  // Check of headlines niet te lang zijn
  for (const n of news) {
    if (!n.headline || !n.bron || !n.onderwerp) return false;
  }
  for (const t of tweets) {
    if (!t.text || !t.bron || !t.onderwerp) return false;
    if (t.text.length > 300) return false;
  }

  return true;
}

// ============================================================
// MAIN
// ============================================================

async function main() {
  log("=== Oergezond Content Pipeline v3 gestart ===");

  if (alreadyRanToday()) {
    log("Al gedraaid vandaag — stop.");
    return;
  }

  try {
    // FASE 1: Scrapen
    log("=== FASE 1: SCRAPEN ===");
    let allPosts = [];
    try {
      allPosts = await scrapeAll();
    } catch (e) {
      log(`Scraping mislukt (${e.message}) — ga door zonder posts`);
    }

    // Check werkdag (ma-vr)
    const dayOfWeek = new Date().getDay(); // 0=zo, 1=ma, 2=di, 3=wo, 4=do, 5=vr, 6=za
    const isWeekday = dayOfWeek >= 1 && dayOfWeek <= 5;

    if (!isWeekday) {
      log("Weekend — geen content vandaag.");
      markRanToday();
      return;
    }

    // FASE 2: VIRAL REELS REPORT (ma-vr)
    log("=== FASE 2: VIRAL REELS REPORT ===");
    const seenReels = loadSeenReels();
    const reels = filterReels(allPosts, 20)
      .filter((r) => !seenReels.includes(r.shortCode))
      .slice(0, MAX_REELS_FOR_REPORT);

    if (reels.length >= 3) {
      log(`${reels.length} nieuwe reels gevonden — PDF genereren...`);
      try {
        await generateViralReelsReport(reels, cfg, { sendToTelegram: true });
        log("Viral Reels Report verstuurd ✅");
        saveSeenReels([...seenReels, ...reels.map((r) => r.shortCode)]);
      } catch (e) {
        log(`Reels report mislukt: ${e.message}`);
        await sendTelegram(`⚠️ Viral Reels Report mislukt: ${e.message}`).catch(() => {});
      }
    } else {
      log(`Te weinig nieuwe reels (${reels.length}) — skip report`);
      await sendTelegram(`ℹ️ Vandaag minder dan 3 nieuwe reels gevonden. Morgen weer een vers rapport.`);
    }

    // FASE 3: STATICS (alleen ma/wo/vr)
    const isStaticDay = [1, 3, 5].includes(dayOfWeek);

    if (isStaticDay) {
      log("=== FASE 3: STATICS (ma/wo/vr) ===");
      const usedTopics = loadUsedTopics();
      const topPosts = filterTopPosts(allPosts, 10);

      const rawIdeas = await generateStaticContent(topPosts, usedTopics);
      let ideas;
      try {
        const jsonMatch = rawIdeas.match(/\{[\s\S]*\}/);
        ideas = JSON.parse(jsonMatch ? jsonMatch[0] : rawIdeas);
      } catch (e) {
        throw new Error("Claude gaf geen geldige JSON: " + e.message);
      }

      if (!qualityCheck(ideas)) {
        log("Kwaliteitscheck gefaald — retry...");
        const retry = await generateStaticContent(topPosts, usedTopics);
        const retryMatch = retry.match(/\{[\s\S]*\}/);
        ideas = JSON.parse(retryMatch ? retryMatch[0] : retry);
      }

      const datum = new Date().toLocaleDateString("nl-NL", { weekday: "long", day: "numeric", month: "long" });

      // 3 Nieuws posts
      const newsPosts = (ideas.newsPosts || []).slice(0, 3);
      if (newsPosts.length > 0) {
        await sendTelegram(`📰 *Nieuws Posts — ${datum}*\n_${newsPosts.length} posts gegenereerd_`);
        for (let i = 0; i < newsPosts.length; i++) {
          const np = newsPosts[i];
          log(`  nieuws ${i + 1}/3: ${np.onderwerp}...`);
          try {
            const buf = await generateNewsPost(np);
            await sendTelegramPhoto(buf, `📰 *${i + 1}/3 — ${np.onderwerp}*\n_Bron: ${np.bron}_`);
            const caption = await generateInstagramCaption("news", np);
            await sendTelegram(`📋 *Caption:*\n\n${caption}`);
            log(`  nieuws ${i + 1} verstuurd ✅`);
          } catch (e) {
            log(`  nieuws ${i + 1} mislukt: ${e.message}`);
          }
          await sleep(1000);
        }
      }

      // 3 Tweet posts
      const tweetPosts = (ideas.tweetPosts || []).slice(0, 3);
      if (tweetPosts.length > 0) {
        await sendTelegram(`🐦 *Tweet Posts — ${datum}*`);
        for (let i = 0; i < tweetPosts.length; i++) {
          const tp = tweetPosts[i];
          log(`  tweet ${i + 1}/3: ${tp.onderwerp}...`);
          try {
            const buf = await generateTweetPost(tp);
            await sendTelegramPhoto(buf, `🐦 *${i + 1}/3 — ${tp.onderwerp}*\n_Bron: ${tp.bron}_`);
            const caption = await generateInstagramCaption("tweet", tp);
            await sendTelegram(`📋 *Caption:*\n\n${caption}`);
            log(`  tweet ${i + 1} verstuurd ✅`);
          } catch (e) {
            log(`  tweet ${i + 1} mislukt: ${e.message}`);
          }
          await sleep(1000);
        }
      }

      // Onderwerpen opslaan voor dedup
      const newTopics = [
        ...newsPosts.map((p) => p.onderwerp).filter(Boolean),
        ...tweetPosts.map((p) => p.onderwerp).filter(Boolean),
      ];
      saveUsedTopics([...usedTopics, ...newTopics]);
      log(`${newTopics.length} onderwerpen opgeslagen voor dedup`);
    } else {
      log(`Vandaag geen statics (alleen ma/wo/vr)`);
    }

    // Klaar
    markRanToday();
    log("=== Pipeline klaar ===");

  } catch (err) {
    log(`FOUT: ${err.message}`);
    await sendTelegram(`⚠️ Content Pipeline fout: ${err.message}`).catch(() => {});
    process.exit(1);
  }
}

main();
