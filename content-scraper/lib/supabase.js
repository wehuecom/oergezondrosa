"use strict";

const { createClient } = require("@supabase/supabase-js");
const cfg = require("../config.js");

const supabase = createClient(cfg.SUPABASE_URL, cfg.SUPABASE_KEY);

/**
 * Sla gescrapede posts op in Supabase.
 * Duplicaten worden overgeslagen (short_code is unique).
 */
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
  })).filter((r) => r.short_code); // skip posts zonder code

  const { data, error } = await supabase
    .from("scraped_posts")
    .upsert(rows, { onConflict: "short_code", ignoreDuplicates: true });

  if (error) {
    console.log(`[supabase] Posts opslaan fout: ${error.message}`);
    return 0;
  }
  return rows.length;
}

/**
 * Sla gegenereerde content op (nieuws/tweet posts).
 */
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
  if (error) {
    console.log(`[supabase] Content opslaan fout: ${error.message}`);
    return 0;
  }
  return rows.length;
}

/**
 * Sla gebruikte onderwerpen op (dedup).
 */
async function saveUsedTopics(topics) {
  if (!topics || topics.length === 0) return;

  const rows = topics.map((t) => ({ topic: t }));
  await supabase
    .from("used_topics")
    .upsert(rows, { onConflict: "topic", ignoreDuplicates: true });
}

/**
 * Haal gebruikte onderwerpen op.
 */
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

/**
 * Log een scraper run.
 */
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

/**
 * Check of de scraper vandaag al gedraaid heeft.
 */
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
  saveGeneratedContent,
  saveUsedTopics,
  getUsedTopics,
  logRun,
  alreadyRanToday,
};
