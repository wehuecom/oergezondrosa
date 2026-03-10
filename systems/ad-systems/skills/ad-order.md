# /ad-order — Generate Ad Order

Create a structured ad order document for a client. Pulls client info from CRM, generates creative briefs, audience targeting, and budget allocation.

## Config (from CLAUDE.md)

Read these from the project's `CLAUDE.md`:

| Field | Key |
|-------|-----|
| CRM Base ID | `airtable_base_id` |
| Clients Table ID | `clients_table_id` |
| Ad Orders Table ID | `ad_orders_table_id` |
| Airtable MCP | `mcp__airtable__*` tools |

## Workflow

### Step 1 — Select Client

Ask: **"Which client is this ad order for?"**

If Airtable is configured, search the clients table:
```
mcp__airtable__search_records
  base_id: YOUR_AIRTABLE_BASE_ID
  table_id: YOUR_CLIENTS_TABLE_ID
  search_term: {client_name}
```

Pull from the client record:
- Business name
- Industry/niche
- Target audience
- Website URL
- Previous ad performance (if available)
- Monthly budget
- Goals

If no CRM, ask the user for this info manually.

### Step 2 — Define Campaign Parameters

Ask or confirm:
1. **Campaign goal** — leads, sales, traffic, brand awareness
2. **Monthly budget** — total ad spend
3. **Number of ads** — how many creatives to produce
4. **Ad format** — video (UGC, animated), static (image), carousel
5. **Platforms** — Meta (FB + IG), TikTok, Google, YouTube
6. **Landing page** — existing URL or need to build
7. **Offer/hook** — what's the angle for this round

### Step 3 — Build Targeting

Based on the client's audience:

```
TARGETING BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Location: {geo}
Age: {min}-{max}
Gender: {all/male/female}
Interests: {list}
Lookalike: {if available — source audience}
Custom: {if available — retargeting lists}
Exclusions: {existing customers, etc}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4 — Generate Creative Briefs

For each ad, create:

```
AD #{number}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Angle: {pain_point / benefit / social_proof / comparison}
Format: {video / static / carousel}
Hook: "{the first line / visual}"
Body: {key message points}
CTA: {what we want them to do}
Landing: {URL}

Visual Direction:
- {shot list or design notes}
- {colors, style, mood}

Copy:
- Primary: {ad text}
- Headline: {headline}
- Description: {description}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 5 — Budget Allocation

```
BUDGET BREAKDOWN
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total monthly budget: ${total}

Campaign 1 — {name}: ${amount}/mo (${daily}/day)
  └── Testing phase (Week 1-2): ${test_budget}
  └── Scale phase (Week 3-4): ${scale_budget}

Creative production: ${creative_cost} (if applicable)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 6 — Generate Final Document

Output the complete ad order:

```markdown
# Ad Order — {Client Name}
Date: {date}
Campaign: {campaign_name}

## Client Info
- Business: {name}
- Industry: {industry}
- Website: {url}
- Goal: {goal}

## Campaign Overview
- Objective: {objective}
- Budget: ${monthly}/month
- Platforms: {platforms}
- Duration: {start} — {end}
- Ads: {count} creatives

## Targeting
{targeting brief from Step 3}

## Creative Briefs
{all ad briefs from Step 4}

## Budget Allocation
{budget breakdown from Step 5}

## Timeline
- Week 1: Creative production
- Week 2: Launch + testing phase
- Week 3: Analyze + optimize
- Week 4: Scale winners, kill losers

## Success Metrics
- Target CPA: ${target}
- Target ROAS: {ratio}x
- Lead/sale target: {number}
```

### Step 7 — Save

Save the ad order to the project directory:
- `ad-orders/{client-name}-{date}.md`

If Airtable is configured, create a record in the ad orders table:
```
mcp__airtable__create_record
  base_id: YOUR_AIRTABLE_BASE_ID
  table_id: YOUR_AD_ORDERS_TABLE_ID
  fields: { client, campaign_name, budget, status: "Draft", ... }
```

Confirm with user: **"Ad order saved. Want me to generate the ad scripts now with /script-ads?"**

<\!-- LIO_OS System — @liogpt -->
