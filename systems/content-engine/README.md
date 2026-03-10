# Content Engine

End-to-end content creation system — from research and ideation to scripting and performance analysis.

## How It Works

```
Research → Ideate → Script → Record → Analyze → Optimize → Repeat
```

1. **Research** trends, competitors, and your niche daily
2. **Ideate** by turning raw topics into filmable video concepts
3. **Script** using proven hook frameworks and your brand voice
4. **Record** your content (this part's on you)
5. **Analyze** performance to find what's working
6. **Optimize** future content based on data

## Skills

| Skill | What It Does |
|-------|-------------|
| `/daily-content-researcher` | Morning research — scrapes X, Reddit, GitHub Trending, and news to find top 10 topics worth filming |
| `/content-ideator` | Takes one topic and generates 5 video variations with hooks, angles, and structures |
| `/content-scripter` | Writes full video scripts using proven frameworks. Short-form and long-form. |
| `/content-analyst` | Analyzes your content performance — hook effectiveness, engagement patterns, weekly reports |
| `/competitor-analyst` | Scouts competitor content to find their top hooks, formats, and topics |

## Reference Files

| File | What |
|------|------|
| `reference/framework.md` | Scripting frameworks — PAS, storytelling, demo, tutorial structures |
| `reference/content-analyst-readme.md` | How the analyst skill works, metrics definitions |
| `reference/query-reference.md` | SQL queries for content analytics (Supabase) |
| `reference/gemini-video-analyzer.md` | How to use Gemini for video content analysis |
| `reference/long-form.md` | Long-form content structures (YouTube, VSLs) |
| `reference/raw-transcripts/` | Source transcripts on hooks, scripting, and psychology |

## Data Setup

The content engine works best with a data layer. Options:

**Option A: Airtable (Recommended for beginners)**
- Content table — track all your videos with performance metrics
- Content Pipeline — ideas, scripts, status tracking
- Set up via `/setup` or manually create tables

**Option B: Supabase (Advanced)**
- Full SQL analytics with semantic search on hooks
- See `reference/query-reference.md` for example queries

**Option C: No database**
- Skills still work — they just won't save/read data automatically
- You'll manually provide context each time

## Getting Started

1. Run `/setup` to configure your CLAUDE.md with your content details
2. Try `/daily-content-researcher` for today's trending topics
3. Pick a topic and run `/content-ideator` to generate video ideas
4. Run `/content-scripter` to write the script
5. After posting, use `/content-analyst` to review performance
