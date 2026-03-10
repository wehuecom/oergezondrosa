---
name: ad-brief
description: Generate an Ad Intelligence Brief from scraped competitor ads in Airtable. Produces executive summary, niche-tiered sub-briefs, per-competitor breakdowns, and a strategic playbook with priority ads to create. Requires populated Ad Research table (from /scrape-ads).
---

# Ad Intelligence Brief

You are a creative strategist producing a multi-layered competitive intelligence report from Meta Ad Library data stored in Airtable. Your core thesis: **longevity = profitability** — ads running 30+ days are validated winners because advertisers keep spending on what converts.

**What you produce:** A comprehensive 8-section brief with executive summary, niche-tiered analysis, per-competitor breakdowns, and a priority-ordered strategic playbook — all backed by specific data points and exact hook quotes.

---

## Prerequisites

1. **Airtable PAT** — in project `.mcp.json` under an `airtable-*` server, or in `.env` as `AIRTABLE_API_KEY`
2. **Ad Research table populated** — run `/scrape-ads` first to fill the table with competitor ads
3. **Competitors table** — with linked records, each competitor having a `Category` field
4. **Project CLAUDE.md** — must contain an `Ad Research Config` section (see below)

### Required CLAUDE.md Config

The project's CLAUDE.md must include this block. Read it before doing anything:

```
## Ad Research Config
Brand: [Your Brand Name]

### Niche Tiers
Direct: [competitors that sell the same thing to the same audience]
Adjacent: [competitors in overlapping markets or adjacent audiences]
Aspirational: [large advertisers whose creative playbook is worth studying]
```

If the config block is missing, ask the user to add it before proceeding.

---

## Airtable Schema

Read table IDs and base ID from the project's CLAUDE.md.

### Ad Research Table Fields

| Field | Type | Use In Brief |
|-------|------|-------------|
| Ad Archive ID | singleLineText | Dedup key |
| Page Name | singleLineText | Competitor name display |
| Competitor | multipleRecordLinks | Link to Competitors table |
| Ad Library URL | url | Reference link |
| Start Date | date | Longevity calculation |
| Is Active | checkbox | Active vs killed |
| Display Format | singleSelect | V/I/D breakdown |
| Body Text | multilineText | Copy analysis, A/B detection, DCO filter |
| Title | singleLineText | Hook quoting |
| CTA Text | singleLineText | CTA patterns |
| CTA Type | singleLineText | CTA patterns |
| Hook (Video) | multilineText | Video hook quoting |
| Word Count | number | Copy length analysis |
| Video Duration (sec) | number | Duration analysis |
| Video Aspect Ratio | singleSelect | Format recommendations |
| Angle Category | singleSelect | Angle analysis |
| Ad Format Type | singleSelect | Format analysis |
| Platforms | multipleSelects | Platform distribution |

**Skip these fields** (too large for context): Transcript, Video URL, Image URL, Preview

### Competitors Table Fields

| Field | Type |
|-------|------|
| Name | singleLineText |
| Category | singleSelect |
| Status | singleSelect |

---

## Step 1: Pull Data from Airtable

### 1a. Read project config

Read the project's CLAUDE.md to get:
- Base ID
- Ad Research table ID
- Competitors table ID
- Brand name
- Niche tier groupings (Direct / Adjacent / Aspirational)

### 1b. Fetch all competitor records

```
GET /v0/{baseId}/{competitorsTableId}
  ?fields[]=Name&fields[]=Category&fields[]=Status
  &filterByFormula={Status}='Active'
```

Build a lookup: `record_id → {name, category}`. Then map each competitor to its niche tier using the CLAUDE.md config.

### 1c. Find the most recent scrape batch

```
GET /v0/{baseId}/{adResearchTableId}
  ?pageSize=1
  &fields[]=Scrape Date
  &sort[0][field]=Scrape Date&sort[0][direction]=desc
```

### 1d. Fetch ad records (paginated)

```
GET /v0/{baseId}/{adResearchTableId}
  ?pageSize=100
  &fields[]=Ad Archive ID
  &fields[]=Page Name
  &fields[]=Competitor
  &fields[]=Ad Library URL
  &fields[]=Start Date
  &fields[]=Is Active
  &fields[]=Display Format
  &fields[]=Body Text
  &fields[]=Title
  &fields[]=CTA Text
  &fields[]=CTA Type
  &fields[]=Hook (Video)
  &fields[]=Word Count
  &fields[]=Video Duration (sec)
  &fields[]=Video Aspect Ratio
  &fields[]=Angle Category
  &fields[]=Ad Format Type
  &fields[]=Platforms
```

Paginate with cursor until no offset is returned.

### Token budget guide

- **Under 500 ads:** Pull all fields as-is
- **500-1000 ads:** Truncate Body Text to first 100 chars
- **1000+ ads:** Filter to most recent scrape batch AND truncate Body Text

### 1e. Enrich each ad record

```python
from datetime import date

today = date.today()

# Calculate days active
start = parse_date(ad["Start Date"])
days_active = (today - start).days

# Assign longevity tier
if days_active >= 90:
    tier = "Long-Runner"
elif days_active >= 30:
    tier = "Performer"
else:
    tier = "Test"

# Resolve competitor name and niche tier from lookup
competitor_id = ad["Competitor"][0]
competitor = competitor_lookup[competitor_id]

# DCO filter
is_dco = "{{product" in (ad.get("Body Text") or "")
```

---

## Step 2: Generate the Brief

Write ALL 8 sections. Every claim must reference specific data. Every hook must be an exact quote from the data.

---

### Section 1: Executive Summary

Open with total ads analyzed and real creative count. Then 6 numbered findings:

1. **Winning format** — which format type + aspect ratio has the most Long-Runners
2. **Winning angle** — which angle has highest median longevity; which scales best at 90d+
3. **Copy length** — compare median longevity of short (<50 words) vs long (150+) body text
4. **Video duration** — which duration bracket has the highest Long-Runner rate
5. **Testing patterns** — who's running the most variants and how
6. **Market gaps** — which angles/formats have low competitor adoption but signal opportunity

Format each as: **Bold claim** followed by supporting evidence with numbers.

---

### Section 2: Big Niche — Full Competitive Landscape

#### Who's Spending the Most

Ranked list by total ads. For each competitor show:
- Name, total ads, breakdown (V/I/D counts), real creative count

#### Market-Wide Patterns

**Angle x Longevity table** (exclude DCO):

| Angle | Real Ads | Median Days | 90d+ Count | # Competitors Using |
|-------|----------|-------------|------------|---------------------|

Sort by median days descending. Discover angles dynamically from data — do NOT hardcode.

**Format x Longevity table** (exclude DCO):

| Format | Real Ads | Median Days | 90d+ Count |
|--------|----------|-------------|------------|

Sort by median days descending.

#### The A/B Testing Playbook

Explain the universal pattern observed:
1. Write one strong offer/body copy (the constant)
2. Record multiple video hooks (the variable)
3. Run all variants simultaneously
4. Kill losers after 7-14 days

Evidence: For each competitor with 10+ ads, count how many variants share similar body text (first 50 chars match) but have different hooks.

---

### Section 3: Niche Tier — Direct Competitors

Intro paragraph: who these competitors are and why they matter.

**Total ads:** {count}

#### The Story

Strategic narrative about competitive density. Blue ocean or red ocean?

#### What They're Running

Per-competitor ad listings:
```
**[Competitor Name]** ({N} ads):
- [{Angle}] [{Format}] "{Hook or Title — exact quote}"
```

#### Takeaway for [Brand]

3-5 bulleted, actionable insights.

---

### Section 4: Niche Tier — Adjacent Competitors

Same structure as Section 3, plus:

#### What's Working

Top 10 longest-running ads in this tier.

#### Deep Dives

For the 2-3 competitors with the most real creative:
- Total ads, angle distribution
- Strategy summary
- Testing methodology
- Longest-running hook with exact quote

---

### Section 5: Niche Tier — Aspirational Competitors

Same structure as Section 4, plus:

#### Deep Dive on Largest Advertiser

Full breakdown of the competitor with the most ads:
- Hook-testing methodology
- Funnel structure
- Top 5 hooks by longevity with exact quotes
- Format mix

---

### Section 6: Micro Briefs — Per-Competitor Breakdown

For EVERY competitor:

```
### [Competitor Name]
**{total} ads** | {V}V / {I}I / {D}D | {real} real creative

**Primary angle:** {angle} ({count}/{real} ads)
**Primary format:** {format} ({count}/{real} ads)
**Longest-running ad:** {days}d
> "{exact hook or title quote}"

**What to steal:**
- {1-3 specific hooks or patterns worth replicating}
```

---

### Section 7: Strategic Playbook

#### What to Create First (Priority Order)

4-5 specific ad briefs. Each must cite data:
- **Ad N: [Angle] [Format] ({duration}, {aspect ratio})**
- Why this works (longevity data, competitor usage)
- Hook pattern to follow

#### What to Avoid

Patterns with evidence of failure — zero long-runners, high kill rates.

#### The Meta Ads Testing Framework

Week-by-week cadence:
1. **Week 1:** Launch N ads, one per angle
2. **Week 2:** Kill criteria and scaling triggers
3. **Week 3:** New hook variants for survivors
4. **Week 4:** Analyze — surviving body copy = proven offer
5. **Ongoing:** Continuous hook rotation

---

### Section 8: Methodology

- **Longevity = profitability:** Ads running 30+ days are validated winners
- **Long-Runner:** 90+ days active
- **Performer:** 30-90 days active
- **Test:** <30 days active
- **Kill rate:** % of inactive ads that ran <30 days
- **DCO template ads:** Excluded from creative analysis
- **A/B detection heuristic:** Same competitor + first 50 chars of body text match + different hook/title/format
- **Data source:** Meta Ad Library via Apify, stored in Airtable

---

## Niche-Agnostic Design Rules

1. **Read niche tiers from project CLAUDE.md** — every project defines its own groupings
2. **Discover vocabularies dynamically** — angle categories, format types all come from the data
3. **Never hardcode base IDs or table IDs** — always read from CLAUDE.md
4. **Brand name** — replace `[Brand]` with the brand name from config
5. **Handle missing data gracefully** — skip sections that have no data

---

## After Analysis: Save Report

Save the completed brief to:
```
{project}/research/briefs/ad-brief-{YYYY-MM-DD}.md
```

---

## Output Quality Rules

1. **Every claim needs a number.** "Social Proof works" is wrong. "Social Proof has median 45d longevity across 141 ads from 6 competitors" is right.
2. **Every hook must be an exact quote** from Airtable data. Do not fabricate hooks.
3. **Strategic recommendations must reference data.**
4. **Sort tables by the insight metric** (usually median days), not alphabetically.
5. **The brief should be immediately actionable** — a creative team should be able to start producing ads today.
