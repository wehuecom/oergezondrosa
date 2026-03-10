# /launch-ads — Meta Ads Campaign Launcher

Launch Meta ad campaigns from Claude Code. Creates the full campaign → ad set → creative → ad stack via the Graph API.

## Prerequisites

- Meta Ads MCP server configured (run `/meta-ads-setup` if not)
- Ad account access with `ads_management` permission
- Page access token for the Facebook Page running ads
- Ad creatives (images/videos) uploaded to your ad account or accessible via URL

## Config (from CLAUDE.md)

Read these values from the project's `CLAUDE.md` under `## Meta Ads Config`:

| Field | CLAUDE.md Key |
|-------|---------------|
| Ad Account ID | `ad_account_id` |
| Page ID | `page_id` |
| Instagram Actor ID | `instagram_actor_id` (optional) |
| Pixel ID | `pixel_id` |
| Business ID | `business_id` |
| System User Token | Use Meta Ads MCP auth |

## Workflow

### Step 1 — Confirm Campaign Details

Ask the user:
1. **Campaign name** — what are we calling this?
2. **Objective** — `OUTCOME_LEADS`, `OUTCOME_SALES`, `OUTCOME_TRAFFIC`, `OUTCOME_AWARENESS`, `OUTCOME_ENGAGEMENT`
3. **Daily budget** — dollar amount (converted to cents for API)
4. **Target audience** — location, age range, interests, custom audiences
5. **Placements** — automatic or manual (Facebook Feed, Instagram Feed, Stories, Reels)
6. **Creative assets** — image/video URLs or local file paths
7. **Ad copy** — primary text, headline, description, CTA button
8. **Landing page URL** — where clicks go
9. **Optimization goal** — `LEAD_GENERATION`, `OFFSITE_CONVERSIONS`, `LINK_CLICKS`, etc.

### Step 2 — Create Campaign

```
POST /{ad_account_id}/campaigns

{
  "name": "{campaign_name}",
  "objective": "{objective}",
  "status": "PAUSED",
  "special_ad_categories": []
}
```

Save the returned `campaign_id`.

### Step 3 — Create Ad Set

```
POST /{ad_account_id}/adsets

{
  "name": "{campaign_name} — Ad Set",
  "campaign_id": "{campaign_id}",
  "daily_budget": {budget_in_cents},
  "billing_event": "IMPRESSIONS",
  "optimization_goal": "{optimization_goal}",
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
  "targeting": {
    "geo_locations": { "countries": ["US"] },
    "age_min": {age_min},
    "age_max": {age_max},
    "flexible_spec": [{ "interests": [{interest_ids}] }]
  },
  "promoted_object": {
    "pixel_id": "{pixel_id}",
    "custom_event_type": "LEAD"
  },
  "status": "PAUSED"
}
```

Save the returned `adset_id`.

### Step 4 — Upload Creative

If the user provided a local file or URL, upload it first:

**For images:**
```
POST /{ad_account_id}/adimages
Content-Type: multipart/form-data
file: {image_file}
```

**For videos:**
```
POST /{ad_account_id}/advideos
Content-Type: multipart/form-data
file: {video_file}
```

Save the returned `image_hash` or `video_id`.

### Step 5 — Create Ad Creative

```
POST /{ad_account_id}/adcreatives

{
  "name": "{campaign_name} — Creative",
  "object_story_spec": {
    "page_id": "{page_id}",
    "instagram_actor_id": "{instagram_actor_id}",
    "video_data": {
      "video_id": "{video_id}",
      "title": "{headline}",
      "message": "{primary_text}",
      "call_to_action": {
        "type": "{cta_type}",
        "value": { "link": "{landing_page_url}" }
      }
    }
  }
}
```

For image ads, replace `video_data` with `link_data`:
```json
{
  "link_data": {
    "image_hash": "{image_hash}",
    "link": "{landing_page_url}",
    "message": "{primary_text}",
    "name": "{headline}",
    "description": "{description}",
    "call_to_action": { "type": "{cta_type}" }
  }
}
```

Save the returned `creative_id`.

### Step 6 — Create Ad

```
POST /{ad_account_id}/ads

{
  "name": "{campaign_name} — Ad",
  "adset_id": "{adset_id}",
  "creative": { "creative_id": "{creative_id}" },
  "status": "PAUSED"
}
```

### Step 7 — Confirm & Activate

Show the user a summary:
```
Campaign: {campaign_name}
├── Objective: {objective}
├── Budget: ${daily_budget}/day
├── Audience: {targeting_summary}
├── Placement: {placements}
└── Status: PAUSED

Ad Set: {adset_name}
├── Optimization: {optimization_goal}
└── Bid: Lowest Cost

Ad: {ad_name}
├── Creative: {creative_type}
├── CTA: {cta_type}
└── Landing: {landing_page_url}
```

Ask: **"Ready to activate? I'll switch the campaign from PAUSED to ACTIVE."**

If yes:
```
POST /{campaign_id}
{ "status": "ACTIVE" }
```

### Step 8 — Log to CRM (if configured)

If CLAUDE.md has an Airtable base configured under `## Ad Tracking`:
- Create a record with campaign ID, ad set ID, ad ID, budget, launch date, status
- Link to client record if applicable

## CTA Options Reference

| CTA Type | Use For |
|----------|---------|
| `LEARN_MORE` | Content, awareness |
| `SIGN_UP` | Lead gen, free trials |
| `BOOK_NOW` | Services, appointments |
| `GET_OFFER` | Discounts, promos |
| `SHOP_NOW` | E-commerce |
| `CONTACT_US` | Service businesses |
| `APPLY_NOW` | Applications |
| `SUBSCRIBE` | Memberships |

## Multiple Ads

If the user wants to test multiple creatives:
1. Create one campaign + one ad set
2. Create multiple ad creatives (one per asset)
3. Create multiple ads under the same ad set
4. This lets Meta optimize delivery across creatives

## Error Handling

| Error | Fix |
|-------|-----|
| `(#2654) Ad creative not valid` | Check image/video specs — 1080x1080 min for feed |
| `(#100) Invalid parameter` | Verify targeting fields exist in the API |
| `(#2446) Ad account disabled` | Account needs reactivation in Business Manager |
| `(#1487534) Budget too low` | Minimum $1/day for most objectives |

<\!-- LIO_OS System — @liogpt -->
