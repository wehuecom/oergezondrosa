# Meta Ads API Reference

Quick reference for the Meta Marketing API endpoints used by the ad-systems skills.

## Authentication

All requests require a System User Token or Page Token with these permissions:
- `ads_management` — create/edit campaigns, ad sets, ads
- `ads_read` — read campaign data and insights
- `pages_manage_ads` — manage ads on behalf of Pages
- `pages_read_engagement` — read Page data

**Base URL:** `https://graph.facebook.com/v21.0`

## Campaign Management

### Create Campaign
```
POST /{ad_account_id}/campaigns
{
  "name": "Campaign Name",
  "objective": "OUTCOME_LEADS",
  "status": "PAUSED",
  "special_ad_categories": []
}
```

**Objectives:**
| Objective | Use For |
|-----------|---------|
| `OUTCOME_LEADS` | Lead generation forms or landing pages |
| `OUTCOME_SALES` | Purchase conversions |
| `OUTCOME_TRAFFIC` | Website visits |
| `OUTCOME_AWARENESS` | Brand awareness / reach |
| `OUTCOME_ENGAGEMENT` | Post engagement, video views |

### Read Campaign
```
GET /{campaign_id}?fields=name,objective,status,daily_budget,lifetime_budget
```

### Update Campaign
```
POST /{campaign_id}
{ "status": "ACTIVE" }
```

### Delete Campaign
```
DELETE /{campaign_id}
```

## Ad Sets

### Create Ad Set
```
POST /{ad_account_id}/adsets
{
  "name": "Ad Set Name",
  "campaign_id": "{campaign_id}",
  "daily_budget": 2000,
  "billing_event": "IMPRESSIONS",
  "optimization_goal": "LEAD_GENERATION",
  "bid_strategy": "LOWEST_COST_WITHOUT_CAP",
  "targeting": {
    "geo_locations": {
      "countries": ["US"],
      "cities": [{ "key": "2420379", "radius": 25, "distance_unit": "mile" }]
    },
    "age_min": 25,
    "age_max": 55,
    "genders": [0],
    "flexible_spec": [
      { "interests": [{ "id": "6003139266461", "name": "Small business" }] }
    ],
    "exclusions": {
      "custom_audiences": [{ "id": "{audience_id}" }]
    }
  },
  "promoted_object": {
    "pixel_id": "{pixel_id}",
    "custom_event_type": "LEAD"
  },
  "status": "PAUSED"
}
```

**Optimization Goals:**
| Goal | When |
|------|------|
| `LEAD_GENERATION` | Lead form or landing page leads |
| `OFFSITE_CONVERSIONS` | Pixel-tracked conversions |
| `LINK_CLICKS` | Maximum clicks |
| `LANDING_PAGE_VIEWS` | Quality clicks (page loaded) |
| `IMPRESSIONS` | Maximum reach |
| `REACH` | Unique reach |
| `VALUE` | ROAS optimization |

**Bid Strategies:**
| Strategy | Description |
|----------|-------------|
| `LOWEST_COST_WITHOUT_CAP` | Let Meta optimize (recommended) |
| `LOWEST_COST_WITH_BID_CAP` | Set max bid per result |
| `COST_CAP` | Target average cost per result |

### Interest Targeting Search
```
GET /search?type=adinterest&q={search_term}
```

Returns interest IDs for use in `flexible_spec`.

## Ad Creatives

### Upload Image
```
POST /{ad_account_id}/adimages
Content-Type: multipart/form-data
file: @/path/to/image.jpg
```

Returns `{ "images": { "filename": { "hash": "abc123" } } }`

### Upload Video
```
POST /{ad_account_id}/advideos
Content-Type: multipart/form-data
file: @/path/to/video.mp4
```

Returns `{ "id": "video_id" }`

### Create Ad Creative (Video)
```
POST /{ad_account_id}/adcreatives
{
  "name": "Creative Name",
  "object_story_spec": {
    "page_id": "{page_id}",
    "instagram_actor_id": "{ig_actor_id}",
    "video_data": {
      "video_id": "{video_id}",
      "title": "Headline",
      "message": "Primary text goes here",
      "call_to_action": {
        "type": "LEARN_MORE",
        "value": { "link": "https://example.com" }
      },
      "image_url": "{thumbnail_url}"
    }
  }
}
```

### Create Ad Creative (Image)
```
POST /{ad_account_id}/adcreatives
{
  "name": "Creative Name",
  "object_story_spec": {
    "page_id": "{page_id}",
    "link_data": {
      "image_hash": "{image_hash}",
      "link": "https://example.com",
      "message": "Primary text",
      "name": "Headline",
      "description": "Description text",
      "call_to_action": { "type": "LEARN_MORE" }
    }
  }
}
```

## Ads

### Create Ad
```
POST /{ad_account_id}/ads
{
  "name": "Ad Name",
  "adset_id": "{adset_id}",
  "creative": { "creative_id": "{creative_id}" },
  "status": "PAUSED"
}
```

## Insights & Reporting

### Campaign Insights
```
GET /{campaign_id}/insights?fields=impressions,clicks,spend,cpc,cpm,ctr,actions,cost_per_action_type&date_preset=last_7d
```

### Ad Set Insights
```
GET /{adset_id}/insights?fields=impressions,reach,clicks,spend,actions,cost_per_action_type&time_range={"since":"2025-01-01","until":"2025-01-31"}
```

### Ad-Level Insights
```
GET /{ad_id}/insights?fields=impressions,clicks,spend,video_avg_time_watched_actions,actions&date_preset=yesterday
```

**Date Presets:** `today`, `yesterday`, `this_month`, `last_7d`, `last_14d`, `last_30d`, `last_90d`

**Key Metrics:**
| Field | What |
|-------|------|
| `impressions` | Times shown |
| `reach` | Unique people |
| `clicks` | All clicks |
| `cpc` | Cost per click |
| `cpm` | Cost per 1000 impressions |
| `ctr` | Click-through rate |
| `spend` | Total spent |
| `actions` | Array of conversion events |
| `cost_per_action_type` | Cost per each action type |

## Custom Audiences

### Create Custom Audience (Customer List)
```
POST /{ad_account_id}/customaudiences
{
  "name": "Customer List",
  "subtype": "CUSTOM",
  "customer_file_source": "USER_PROVIDED_ONLY"
}
```

### Create Lookalike Audience
```
POST /{ad_account_id}/customaudiences
{
  "name": "1% Lookalike — Customers",
  "subtype": "LOOKALIKE",
  "origin_audience_id": "{source_audience_id}",
  "lookalike_spec": {
    "type": "similarity",
    "ratio": 0.01,
    "country": "US"
  }
}
```

## Image/Video Specs

| Placement | Image | Video | Aspect |
|-----------|-------|-------|--------|
| Feed | 1080x1080 | 1080x1080 | 1:1 |
| Stories/Reels | 1080x1920 | 1080x1920 | 9:16 |
| Right Column | 1200x628 | N/A | 1.91:1 |

**Video specs:**
- Max file size: 4GB
- Max duration: 241 minutes
- Min resolution: 600x600
- Formats: MP4, MOV (H.264)
- Recommended: 1080p, 30fps

## Common Errors

| Code | Error | Fix |
|------|-------|-----|
| `100` | Invalid parameter | Check field names and values |
| `2654` | Creative not valid | Verify image/video meets specs |
| `2446` | Account disabled | Reactivate in Business Manager |
| `1487534` | Budget too low | Min $1/day for most objectives |
| `368` | Page not published | Publish the Facebook Page first |
| `190` | Token expired | Refresh the system user token |
