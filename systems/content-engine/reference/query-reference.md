# Quick Reference Queries

Pre-built SQL queries for common analysis tasks.

---

## Account-Level Queries

### All Account Stats
```sql
SELECT handle, total_videos, 
  ROUND(avg_views::numeric, 0) as avg_views, 
  ROUND(total_views::numeric, 0) as total_views
FROM account_stats
ORDER BY avg_views DESC
```

### Your Performance vs Competitors Summary
```sql
SELECT 
  CASE WHEN handle = 'YOUR_HANDLE' THEN 'YOUR_HANDLE' ELSE 'Competitors (avg)' END as account,
  ROUND(AVG(avg_views)::numeric, 0) as avg_views,
  SUM(total_videos) as total_videos
FROM account_stats
GROUP BY CASE WHEN handle = 'YOUR_HANDLE' THEN 'YOUR_HANDLE' ELSE 'Competitors (avg)' END
```

---

## Outlier Analysis

### All Outliers (2.0+) with Details
```sql
SELECT 
  handle, 
  spoken_hook, 
  hook_framework, 
  topic,
  views,
  ROUND(calc_outlier_score::numeric, 2) as outlier_score,
  calc_outlier_category,
  url
FROM content_with_scores
WHERE calc_outlier_category IN ('viral', 'hit')
ORDER BY calc_outlier_score DESC
```

### Outlier Count by Account
```sql
SELECT 
  handle,
  COUNT(*) as total_videos,
  SUM(CASE WHEN calc_outlier_category IN ('viral', 'hit') THEN 1 ELSE 0 END) as outliers,
  ROUND(SUM(CASE WHEN calc_outlier_category IN ('viral', 'hit') THEN 1 ELSE 0 END)::numeric / COUNT(*)::numeric * 100, 1) as outlier_pct
FROM content_with_scores
GROUP BY handle
ORDER BY outlier_pct DESC
```

### Your Outliers Only
```sql
SELECT spoken_hook, hook_framework, visual_format, topic, views, url, 
  ROUND(calc_outlier_score::numeric, 2) as outlier_score
FROM content_with_scores cws
JOIN content c ON c.id = cws.id
WHERE c.handle = 'YOUR_HANDLE' 
  AND calc_outlier_category IN ('viral', 'hit')
ORDER BY calc_outlier_score DESC
```

---

## Visual Format Analysis

### Your Visual Format Performance
```sql
SELECT 
  c.visual_format,
  COUNT(*) as videos,
  ROUND(AVG(c.views)::numeric, 0) as avg_views,
  MAX(c.views) as max_views,
  SUM(CASE WHEN cws.calc_outlier_category IN ('viral', 'hit') THEN 1 ELSE 0 END) as outliers
FROM content c
JOIN content_with_scores cws ON c.id = cws.id
WHERE c.handle = 'YOUR_HANDLE' AND c.visual_format IS NOT NULL
GROUP BY c.visual_format
ORDER BY avg_views DESC
```

### All Accounts Visual Format Performance
```sql
SELECT 
  c.handle,
  c.visual_format,
  COUNT(*) as videos,
  ROUND(AVG(c.views)::numeric, 0) as avg_views,
  SUM(CASE WHEN cws.calc_outlier_category IN ('viral', 'hit') THEN 1 ELSE 0 END) as outliers
FROM content c
JOIN content_with_scores cws ON c.id = cws.id
WHERE c.visual_format IS NOT NULL
GROUP BY c.handle, c.visual_format
ORDER BY c.handle, avg_views DESC
```

---

## Hook Analysis

### Top Hook Frameworks Overall
```sql
SELECT 
  hook_framework,
  COUNT(*) as times_used,
  ROUND(AVG(views)::numeric, 0) as avg_views,
  MAX(views) as max_views,
  STRING_AGG(DISTINCT handle, ', ') as used_by
FROM content
WHERE hook_framework IS NOT NULL
GROUP BY hook_framework
HAVING COUNT(*) >= 2
ORDER BY avg_views DESC
LIMIT 20
```

### Your Top Hooks
```sql
SELECT spoken_hook, hook_framework, views, url
FROM content
WHERE handle = 'YOUR_HANDLE' AND spoken_hook IS NOT NULL
ORDER BY views DESC
LIMIT 10
```

### Competitor Top Hooks
```sql
SELECT handle, spoken_hook, hook_framework, views, url
FROM content
WHERE handle != 'YOUR_HANDLE' AND spoken_hook IS NOT NULL
ORDER BY views DESC
LIMIT 20
```

---

## Topic Analysis

### Top Topics by Performance
```sql
SELECT 
  topic,
  COUNT(*) as videos,
  ROUND(AVG(views)::numeric, 0) as avg_views,
  STRING_AGG(DISTINCT handle, ', ') as creators
FROM content
WHERE topic IS NOT NULL
GROUP BY topic
HAVING COUNT(*) >= 2
ORDER BY avg_views DESC
LIMIT 20
```

### Topics You Haven't Covered
```sql
WITH competitor_topics AS (
  SELECT topic, COUNT(*) as videos, ROUND(AVG(views)::numeric, 0) as avg_views
  FROM content 
  WHERE handle != 'YOUR_HANDLE' AND topic IS NOT NULL
  GROUP BY topic
),
noe_topics AS (
  SELECT DISTINCT topic FROM content WHERE handle = 'YOUR_HANDLE' AND topic IS NOT NULL
)
SELECT ct.topic, ct.videos, ct.avg_views
FROM competitor_topics ct
LEFT JOIN noe_topics nt ON LOWER(ct.topic) = LOWER(nt.topic)
WHERE nt.topic IS NULL
ORDER BY ct.avg_views DESC
LIMIT 15
```

### Your Top Topics
```sql
SELECT topic, COUNT(*) as videos, ROUND(AVG(views)::numeric, 0) as avg_views
FROM content
WHERE handle = 'YOUR_HANDLE' AND topic IS NOT NULL
GROUP BY topic
ORDER BY avg_views DESC
LIMIT 10
```

---

## Competitor Comparison

### Specific Competitor vs You
```sql
SELECT 
  handle,
  COUNT(*) as videos,
  ROUND(AVG(views)::numeric, 0) as avg_views,
  ROUND(AVG(likes)::numeric, 0) as avg_likes,
  ROUND(AVG(comments)::numeric, 0) as avg_comments,
  SUM(CASE WHEN calc_outlier_category IN ('viral', 'hit') THEN 1 ELSE 0 END) as outliers
FROM content_with_scores
WHERE handle IN ('YOUR_HANDLE', 'COMPETITOR_HANDLE')
GROUP BY handle
```

### Competitor Deep Dive (replace HANDLE)
```sql
SELECT 
  spoken_hook,
  hook_framework,
  topic,
  visual_format,
  views,
  ROUND(calc_outlier_score::numeric, 2) as outlier_score,
  url
FROM content_with_scores cws
JOIN content c ON c.id = cws.id
WHERE c.handle = 'HANDLE'
ORDER BY views DESC
LIMIT 10
```

---

## Kallaway Hooks

### Top Kallaway Hooks
```sql
SELECT spoken_hook, spoken_hook_framework, visual_hook_graphic, text_hook_word_structure, views
FROM kallaway_hooks
ORDER BY views DESC
LIMIT 15
```

### Kallaway Hooks by Niche
```sql
SELECT niche, COUNT(*) as hooks, ROUND(AVG(views)::numeric, 0) as avg_views
FROM kallaway_hooks
GROUP BY niche
```

### Find Similar Kallaway Patterns
```sql
SELECT spoken_hook_framework, views, visual_hook_graphic
FROM kallaway_hooks
WHERE spoken_hook_framework ILIKE '%PATTERN%'
ORDER BY views DESC
```

---

## Engagement Analysis

### Engagement Rates by Account
```sql
SELECT 
  handle,
  ROUND(AVG(calc_engagement_rate)::numeric, 2) as avg_engagement_rate,
  ROUND(AVG(CASE WHEN views > 0 THEN likes::numeric / views * 100 END)::numeric, 2) as like_rate,
  ROUND(AVG(CASE WHEN views > 0 THEN comments::numeric / views * 100 END)::numeric, 3) as comment_rate
FROM content_with_scores
GROUP BY handle
ORDER BY avg_engagement_rate DESC
```

### High Engagement Videos (Good for studying hooks/content)
```sql
SELECT handle, spoken_hook, topic, views, 
  ROUND(calc_engagement_rate::numeric, 2) as engagement_rate,
  url
FROM content_with_scores
WHERE calc_engagement_rate > 5
ORDER BY calc_engagement_rate DESC
LIMIT 20
```

---

## Transcript/Script Analysis

### Get Full Transcripts for Comparison
```sql
SELECT handle, topic, transcript, views, url
FROM content
WHERE handle IN ('YOUR_HANDLE', 'COMPETITOR')
  AND transcript IS NOT NULL
ORDER BY views DESC
LIMIT 5
```

### Body Structure Breakdown
```sql
SELECT 
  handle,
  body_structure,
  COUNT(*) as count,
  ROUND(AVG(views)::numeric, 0) as avg_views
FROM content
WHERE body_structure IS NOT NULL
GROUP BY handle, body_structure
ORDER BY handle, avg_views DESC
```

---

## Time-Based Analysis

### Recent Performance (if post_date available)
```sql
SELECT
  handle,
  DATE_TRUNC('week', post_date) as week,
  COUNT(*) as videos,
  ROUND(AVG(views)::numeric, 0) as avg_views
FROM content
WHERE post_date IS NOT NULL
GROUP BY handle, DATE_TRUNC('week', post_date)
ORDER BY week DESC, handle
```

---

## Auto-Compare: Find Similar Videos

**CRITICAL: Use EXACT topic matching, not keyword matching.**

### Find Competitor Videos on EXACT Same Topic as Yours
```sql
-- This is the PRIMARY comparison query - exact topic match only
SELECT
  n.topic,
  n.views as your_views,
  LEFT(n.spoken_hook, 100) as your_hook,
  n.visual_format as your_format,
  n.url as your_url,
  c.handle as competitor,
  c.views as their_views,
  LEFT(c.spoken_hook, 100) as their_hook,
  c.visual_format as their_format,
  c.url as their_url,
  ROUND((c.views::float / NULLIF(n.views, 0))::numeric, 1) as view_multiplier
FROM content n
JOIN content c ON LOWER(TRIM(c.topic)) = LOWER(TRIM(n.topic))
  AND c.handle != 'YOUR_HANDLE'
WHERE n.handle = 'YOUR_HANDLE'
  AND n.topic IS NOT NULL
  AND c.views > n.views
ORDER BY view_multiplier DESC
LIMIT 10
```

### Learning Opportunities (Exact Topic Match Only)
```sql
-- Find topics where you underperformed but competitors crushed it
SELECT
  n.topic,
  n.views as your_views,
  n.visual_format as your_format,
  n.url as your_url,
  c.handle as competitor,
  c.views as their_views,
  c.visual_format as their_format,
  c.url as their_url,
  ROUND((c.views::float / NULLIF(n.views, 0))::numeric, 0) as they_got_Xx_more
FROM content n
JOIN content c ON LOWER(TRIM(c.topic)) = LOWER(TRIM(n.topic))
  AND c.handle != 'YOUR_HANDLE'
WHERE n.handle = 'YOUR_HANDLE'
  AND n.topic IS NOT NULL
  AND c.views > n.views * 10  -- They got 10x+ more views
ORDER BY (c.views::float / NULLIF(n.views, 0)) DESC
LIMIT 10
```

### Find Videos Using Same Hook Framework
```sql
SELECT
  handle,
  spoken_hook,
  hook_framework,
  views,
  ROUND(calc_outlier_score::numeric, 2) as outlier_score,
  url
FROM content c
JOIN content_with_scores cws ON c.id = cws.id
WHERE hook_framework ILIKE '%PATTERN%'
ORDER BY views DESC
```

### Find Videos with Same Visual Format + Similar Topic
```sql
SELECT
  handle,
  topic,
  visual_format,
  spoken_hook,
  views,
  url
FROM content
WHERE visual_format = 'Split Screen'
  AND topic ILIKE '%ai agent%'
ORDER BY views DESC
```

### Side-by-Side Comparison Query
```sql
SELECT
  handle,
  topic,
  visual_format,
  spoken_hook,
  hook_framework,
  views,
  ROUND(calc_outlier_score::numeric, 2) as outlier_score,
  url
FROM content c
JOIN content_with_scores cws ON c.id = cws.id
WHERE c.id IN ('NOE_VIDEO_ID', 'COMPETITOR_VIDEO_ID')
```
