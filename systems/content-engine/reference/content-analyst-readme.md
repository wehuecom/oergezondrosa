# Content Performance Analyst

A Claude skill for analyzing TikTok content performance across your personal account and competitors.

## What This Skill Does

- **Weekly Reports** - Comprehensive analysis of hooks, topics, visual formats, and recommendations
- **Conversational Analysis** - Ask any question about content performance and get data-driven answers
- **Competitor Intelligence** - Compare your content against 10 tracked competitors
- **Content Strategy** - Get recommendations for topics, hooks, and formats based on what's working

## How to Use

### Weekly Report
"Give me my weekly content analysis"
"What's working this week?"
"Weekly report please"

### Specific Questions
"What visual format is working best for me?"
"What are my top 5 hooks?"
"What is Chase AI doing differently than me?"
"What topics should I cover this week?"
"Show me competitor outliers I should study"
"Compare my scripting to nathanhodgson_"

## Data Sources

- **Supabase Creator OS** - Primary database
  - `content` table - 700 videos across 11 accounts
  - `content_with_scores` view - Calculated outlier scores
  - `kallaway_hooks` table - 100 proven hook frameworks
  - `account_stats` view - Account-level metrics

## Key Benchmarks

- **Outlier** = 2.0+ outlier score (2x account average views)
- **Viral** = 3.0+ outlier score
- **Target** = Reverse-engineer 2.0+ videos

## Tracked Accounts

- **Personal**: YOUR_HANDLE
- **Competitors**: maverickgpt, adamstewartmarketing, taki.gpt, theaiwizard, nathanhodgson_, sabrina_ramonov, nocode.joshua, justyn.ai, digitalsamaritan, chase_ai_

## Related Skills

- Works with Supabase MCP tools for database queries

<\!-- LIO_OS System — @liogpt -->
