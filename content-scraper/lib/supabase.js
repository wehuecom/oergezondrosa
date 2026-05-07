"use strict";

const { createClient } = require("@supabase/supabase-js");
const cfg = require("../config.js");

const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);

// ============================================================
// SCRAPED POSTS — alle posts + reels van competitors/hashtags
// Outlier scores en engagement rates worden hier berekend
// ============================================================

async function saveScrapedPosts(posts) {
  if (!posts || posts.length === 0) return 0;

  const rows = posts.map((p) => ({
    username: p.ownerUsername || p.account || p.username || "onbekend",
    type: p.type || "unknown",
    caption: (p.caption || "").slice(0, 2000),
    likes: p.likesCount || p.likes || 0,
    comments: p.commentsCount || p.comments || 0,
    views: p.videoViewCount || p.views || 0,
    short_code: p.shortCode || p.code || null,
    engagement: (p.likesCount || p.likes || 0) + (p.commentsCount || p.comments || 0) * 3,
  })).filter((r) => r.short_code);

  const { error } = await supabase
    .from("scraped_posts")
    .upsert(rows, { onConflict: "short_code", ignoreDuplicates: true });

  if (error) console.log(`[supabase] Posts opslaan fout: ${error.message}`);
  return rows.length;
}

/**
 * Haal account stats op — berekend uit scraped_posts.
 * Geeft per account: avg views, avg likes, total posts.
 */
async function getAccountStats(username) {
  const { data, error } = await supabase
    .from("scraped_posts")
    .select("likes, comments, views")
    .eq("username", username);

  if (error || !data || data.length === 0) return null;

  const total = data.length;
  const avgViews = Math.round(data.reduce((s, p) => s + (p.views || 0), 0) / total);
  const avgLikes = Math.round(data.reduce((s, p) => s + (p.likes || 0), 0) / total);
  const avgComments = Math.round(data.reduce((s, p) => s + (p.comments || 0), 0) / total);
  const totalViews = data.reduce((s, p) => s + (p.views || 0), 0);

  return { username, total, avgViews, avgLikes, avgComments, totalViews };
}

/**
 * Bereken outlier score voor een post.
 * Viral = 5x+ gemiddeld | Hit = 2-5x | Boven Gemiddeld = 1.5-2x | Gemiddeld = 0.5-1.5x | Onder Gemiddeld = <0.5x
 */
function calculateOutlierScore(postViews, avgViews) {
  if (!avgViews || avgViews === 0) return "Geen Data";
  const ratio = postViews / avgViews;
  if (ratio >= 5) return "Viral";
  if (ratio >= 2) return "Hit";
  if (ratio >= 1.5) return "Boven Gemiddeld";
  if (ratio >= 0.5) return "Gemiddeld";
  return "Onder Gemiddeld";
}

/**
 * Haal top posts op met outlier scores.
 */
async function getPostsWithScores(limit = 50) {
  const { data: posts, error } = await supabase
    .from("scraped_posts")
    .select("*")
    .order("scraped_at", { ascending: false })
    .limit(limit);

  if (error || !posts) return [];

  // Bereken gemiddelden per account
  const accountAvgs = {};
  for (const p of posts) {
    if (!accountAvgs[p.username]) accountAvgs[p.username] = { total: 0, views: 0 };
    accountAvgs[p.username].total++;
    accountAvgs[p.username].views += p.views || 0;
  }

  return posts.map((p) => {
    const avg = accountAvgs[p.username];
    const avgViews = avg ? Math.round(avg.views / avg.total) : 0;
    const views = p.views || 0;
    const engRate = views > 0
      ? Math.round(((p.likes + p.comments * 2) / views) * 10000) / 100
      : 0;

    return {
      ...p,
      outlier_score: calculateOutlierScore(views, avgViews),
      engagement_rate: engRate,
      account_avg_views: avgViews,
    };
  });
}

// ============================================================
// GENERATED CONTENT — nieuws, tweets, scripts, hooks
// Werkt ook als content queue (status tracking)
// ============================================================

async function saveGeneratedContent(ideas) {
  const rows = [];

  for (const np of ideas.newsPosts || []) {
    rows.push({
      type: "news",
      onderwerp: np.onderwerp || "",
      bron: np.bron || "",
      headline: np.headline || "",
      image_prompt: np.imagePrompt || "",
    });
  }

  for (const tp of ideas.tweetPosts || []) {
    rows.push({
      type: "tweet",
      onderwerp: tp.onderwerp || "",
      bron: tp.bron || "",
      tweet_text: tp.text || "",
    });
  }

  if (rows.length === 0) return 0;

  const { error } = await supabase.from("generated_content").insert(rows);
  if (error) console.log(`[supabase] Content opslaan fout: ${error.message}`);
  return rows.length;
}

/**
 * Sla viral reel + script op in generated_content.
 */
async function saveReelWithScript(reel, research, script) {
  const row = {
    type: "reel_script",
    onderwerp: research.onderwerp || "",
    bron: (research.bronnen || []).join("; "),
    headline: script.hook || "",
    tweet_text: script.script || "",
    caption: script.cta || "",
    image_prompt: JSON.stringify({
      account: reel.account,
      views: reel.views,
      likes: reel.likes,
      url: reel.url,
      duur: script.geschatteDuur,
      visueel: script.visueleInstructies,
      waaromViraal: research.waaromViraal,
      kernboodschap: research.kernboodschap,
    }),
  };

  const { error } = await supabase.from("generated_content").insert([row]);
  if (error) console.log(`[supabase] Reel script opslaan fout: ${error.message}`);
}

// ============================================================
// USED TOPICS — dedup
// ============================================================

async function saveUsedTopics(topics) {
  if (!topics || topics.length === 0) return;
  const rows = topics.map((t) => ({ topic: t }));
  await supabase
    .from("used_topics")
    .upsert(rows, { onConflict: "topic", ignoreDuplicates: true });
}

async function getUsedTopics() {
  const { data, error } = await supabase
    .from("used_topics")
    .select("topic")
    .order("used_at", { ascending: false })
    .limit(80);

  if (error) {
    console.log(`[supabase] Topics ophalen fout: ${error.message}`);
    return [];
  }
  return (data || []).map((r) => r.topic);
}

// ============================================================
// SCRAPER RUNS — logging
// ============================================================

async function logRun(stats) {
  const today = new Date().toISOString().slice(0, 10);
  await supabase.from("scraper_runs").upsert(
    {
      run_date: today,
      posts_scraped: stats.postsScraped || 0,
      content_generated: stats.contentGenerated || 0,
      reels_report: stats.reelsReport || false,
      status: stats.status || "completed",
    },
    { onConflict: "run_date" }
  );
}

async function alreadyRanToday() {
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from("scraper_runs")
    .select("id")
    .eq("run_date", today)
    .limit(1);
  return data && data.length > 0;
}

module.exports = {
  supabase,
  saveScrapedPosts,
  getAccountStats,
  calculateOutlierScore,
  getPostsWithScores,
  saveGeneratedContent,
  saveReelWithScript,
  saveUsedTopics,
  getUsedTopics,
  logRun,
  alreadyRanToday,
};
