---
name: scrape-ads
description: Scrape all competitor ads from Meta Ad Library via Apify. Reads competitors from Airtable, scrapes their active ads, downloads video ads, transcribes with Whisper, classifies angles/formats, and pushes everything to the Ad Research table with previews. Run manually or on a schedule.
---

# Scrape Competitor Ads — Full Pipeline

You are a competitive ad intelligence system. You scrape every active Meta ad from tracked competitors, download videos, transcribe them, classify the angle and format, and push everything to Airtable.

**What you produce:** A complete database of competitor ads with copy, media, transcripts, hooks, and classifications — ready for creative analysis.

---

## Prerequisites

The user needs:
1. **Airtable PAT** — in `.mcp.json` under an `airtable-*` server, or in `.env` as `AIRTABLE_API_KEY`
2. **Apify token** — in `.mcp.json` under an `apify-*` server, or in `.env` as `APIFY_TOKEN`
3. **Competitors table populated** — at least 1 competitor with a `Facebook Page ID` (the Ad Library ID, not profile ID)
4. **whisper.cpp installed** — for video transcription (optional — scrape works without it)
5. **ffmpeg installed** — for audio extraction from video files

If whisper.cpp or ffmpeg is missing, skip the video transcription step and note it in the summary. The scrape + Airtable push still works without it.

---

## Airtable Config

Read these values from your project's CLAUDE.md:

```
## Ad Research Config
Base ID: [your base ID]
Competitors Table: [your table ID]
Ad Research Table: [your table ID]
```

### Competitors Table Schema

| Field | Type |
|-------|------|
| Name | singleLineText — company name |
| Facebook Page ID | singleLineText — **Ad Library page ID** (used in scrape URL) |
| Status | singleSelect — only scrape `Active` competitors |

### Ad Research Table Schema

Create this table if it doesn't exist. These are the fields you need:

| Field | Type |
|-------|------|
| Ad Archive ID | singleLineText |
| Page Name | singleLineText |
| Page ID | singleLineText |
| Competitor | multipleRecordLinks (→ Competitors table) |
| Ad Library URL | url |
| Start Date | date |
| End Date | date |
| Is Active | checkbox |
| Platforms | multipleSelects |
| Display Format | singleSelect (Video, Image, Carousel, DCO) |
| Body Text | multilineText |
| Title | singleLineText |
| CTA Text | singleLineText |
| CTA Type | singleLineText |
| Link URL | url |
| Link Description | multilineText |
| Caption | singleLineText |
| Video URL | url |
| Image URL | url |
| Video Duration (sec) | number |
| Video Aspect Ratio | singleSelect (9:16, 4:5, 1:1, 16:9, Other) |
| Transcript | multilineText |
| Hook (Video) | multilineText |
| Word Count | number |
| Angle Category | singleSelect |
| Ad Format Type | singleSelect |
| Scrape Date | date |
| Scrape Batch ID | singleLineText |
| Preview | multipleAttachments |

---

## Step 1: Load Credentials

Read credentials from the project's config files:

```python
# Airtable key
cat {project_root}/.mcp.json → mcpServers.airtable-*.env.AIRTABLE_API_KEY

# Apify token
cat {project_root}/.mcp.json → mcpServers.apify-*.env.APIFY_TOKEN
```

If `.mcp.json` doesn't exist, check `.env` for `AIRTABLE_API_KEY` and `APIFY_TOKEN`.

---

## Step 2: Read Active Competitors from Airtable

Fetch all records from Competitors table where `Status = Active`:

```
GET /v0/{baseId}/{competitorsTableId}
  ?filterByFormula={Status}='Active'
  &fields[]=Name&fields[]=Facebook Page ID
```

Each competitor MUST have a `Facebook Page ID` (the Ad Library ID). Skip any that don't.

Print the competitor list before proceeding:
```
Found 11 active competitors:
  1. Competitor A (583616842053401)
  2. Competitor B (1234567890)
  ...
```

---

## Step 3: Scrape Each Competitor via Apify

For each competitor, build the Ad Library URL and run the Apify scraper:

```bash
curl -s -X POST "https://api.apify.com/v2/acts/curious_coder~facebook-ads-library-scraper/runs?token={APIFY_TOKEN}" \
  -H "Content-Type: application/json" \
  -d '{
    "urls": [{"url": "https://www.facebook.com/ads/library/?active_status=active&ad_type=all&country=US&is_targeted_country=false&media_type=all&search_type=page&sort_data[direction]=desc&sort_data[mode]=total_impressions&view_all_page_id={PAGE_ID}"}],
    "maxAds": 50
  }'
```

**IMPORTANT:** This is an async call. The response returns a `defaultDatasetId`. Poll for completion:

```bash
# Check run status
GET https://api.apify.com/v2/actor-runs/{runId}?token={APIFY_TOKEN}

# Once status = "SUCCEEDED", fetch results:
GET https://api.apify.com/v2/datasets/{datasetId}/items?token={APIFY_TOKEN}
```

**Run competitors in sequence** (not parallel) to avoid Apify rate limits. Each scrape takes 30-90 seconds.

After each scrape completes, print progress:
```
[3/11] Competitor C: 23 ads scraped (12 video, 5 image, 6 DCO)
```

---

## Step 4: Dedup Against Existing Records

Before inserting, check which ads already exist in the Ad Research table:

```
GET /v0/{baseId}/{adResearchTableId}
  ?fields[]=Ad Archive ID
  &filterByFormula={Competitor}='...'
```

Build a set of existing `Ad Archive ID` values. Only insert new ads.

**Status tracking for re-scrapes:**
- Ads in Airtable that are NOT in the new scrape → mark `Is Active` = false, set `End Date` to today
- Ads in the new scrape that are already in Airtable and marked active → skip (no update needed)
- Ads in the new scrape that are NOT in Airtable → insert as new records

---

## Step 5: Transform and Insert New Ads

For each new ad, transform the Apify data into an Airtable record:

```python
from datetime import datetime, date

today = date.today()

# Start date — Apify returns unix timestamps
start_raw = ad.get("start_date")
if start_raw:
    start_date = datetime.utcfromtimestamp(int(start_raw)).date()
    start_iso = start_date.isoformat()

# Platforms
platform_map = {
    "facebook": "Facebook", "instagram": "Instagram",
    "messenger": "Messenger", "audience_network": "Audience Network"
}
platforms = [platform_map[p.lower()] for p in ad.get("publisher_platform", []) if p.lower() in platform_map]

# Display format
format_map = {"VIDEO": "Video", "IMAGE": "Image", "CAROUSEL": "Carousel", "DCO": "DCO"}
display_format = format_map.get(snap.get("display_format"))

# Video URL — HD first, fallback to SD
videos = snap.get("videos", [])
video_url = videos[0].get("video_hd_url") or videos[0].get("video_sd_url") if videos else None

# Image URL
images = snap.get("images", [])
image_url = (images[0].get("original_image_url") or images[0].get("resized_image_url")) if images else None

# Preview thumbnail (for video ads, use video_preview_image_url)
preview_url = None
if videos:
    preview_url = videos[0].get("video_preview_image_url")
elif images:
    preview_url = image_url

# Body text — preserve exact formatting
body = snap.get("body", {})
body_text = body.get("text", "") if isinstance(body, dict) else ""
```

**Airtable record fields:**
```python
fields = {
    "Ad Archive ID": str(ad["ad_archive_id"]),
    "Page Name": snap.get("page_name", ""),
    "Page ID": str(ad.get("page_id", "")),
    "Competitor": [competitor_record_id],  # Link to Competitors table
    "Ad Library URL": f"https://www.facebook.com/ads/library/?id={ad['ad_archive_id']}",
    "Is Active": True,
    "Scrape Date": today.isoformat(),
    "Scrape Batch ID": dataset_id,
}
# Add optional fields only if they have values (don't send nulls)
```

Insert in batches of 10 (Airtable limit). Add Preview attachment for ads with thumbnails/images.

---

## Step 6: Download and Transcribe Video Ads

For each new video ad that has a Video URL:

```bash
# 1. Download video
curl -s -L -o /tmp/ad_videos/{safe_name}.mp4 --max-time 60 "{video_url}"

# 2. Get metadata
ffprobe -v quiet -print_format json -show_format -show_streams {video_path}
# Extract: duration, width/height → aspect ratio

# 3. Extract audio
ffmpeg -i {video_path} -ar 16000 -ac 1 -f wav {wav_path} -y

# 4. Transcribe with whisper
whisper-cli -m {model_path} -f {wav_path} --no-prints

# 5. Extract hook (first complete sentence or two)
# Use regex: split on sentence boundaries, take first 1-2 sentences
# If first sentence < 8 words, include second sentence
```

**Aspect ratio detection:**
```python
ratio = width / height
if abs(ratio - 9/16) < 0.05: aspect = "9:16"
elif abs(ratio - 4/5) < 0.05: aspect = "4:5"
elif abs(ratio - 1) < 0.05: aspect = "1:1"
elif abs(ratio - 16/9) < 0.05: aspect = "16:9"
else: aspect = "Other"
```

Update Airtable records with: `Video Duration (sec)`, `Video Aspect Ratio`, `Transcript`, `Hook (Video)`, `Word Count`.

Clean up downloaded files after processing.

---

## Step 7: Classify Angle and Format

For every new ad (video and non-video), classify based on content:

### Angle Category

Analyze body text + title + transcript for signals:

| Angle | Signals |
|-------|---------|
| Social Proof | Testimonials, revenue numbers, "since we signed up", "my name is", case studies |
| Pain-to-Transformation | Fees, losing money, switching pain, "save you thousands", "fight back" |
| Tips/Education | How-to, listicles, "reason number", "watch this", educational framing |
| Growth Problem | More orders, scaling, "drive sales", "increase your", growth language |
| Profit Problem | Costs, margins, wasted spend, "paying too much" |
| Authority | Platform features, "only platform", data access, expert positioning |
| Scarcity/Urgency | Limited time, spots filling, deadline language |
| Behind-the-Scenes | Day-in-the-life, process reveal, "how we" |

### Ad Format Type

| Format | How to detect |
|--------|---------------|
| UGC Testimonial | Video with first-person experience ("my name is", "our sales", "since we") |
| UGC Talking Head | Video with presenter explaining features/benefits |
| Interview/Case Study | Video with Q&A pattern, multiple speakers |
| Motion Graphics | Video with no speech (transcript = music/silence only) |
| Static Image | Image or DCO with real copy |
| Screenshot/UI Demo | Image showing product interface |
| Other | DCO with template variables or unclassifiable |

Update all new records with classifications in batches of 10.

---

## Step 8: Print Summary

After all competitors are processed, print a complete summary:

```
=== Ad Scrape Complete ===

Competitors scraped: 11
Total ads found: 347
  New ads added: 198
  Already existed: 142
  Marked inactive: 7

By competitor:
  Competitor A: 50 ads (16 video, 5 image, 29 DCO)
  Competitor B: 23 ads (8 video, 12 image, 3 DCO)
  ...

By angle:
  Social Proof: 89
  Pain-to-Transformation: 45
  Growth Problem: 32
  Tips/Education: 18
  Other: 14

Videos transcribed: 67
Estimated Apify cost: ~$0.11

Top hooks discovered:
  1. "Since joining [brand], our sales per month have grown over 30,000..."
  2. "Business owners watch this..."
  3. ...
```

---

## Key Lessons (from building this)

1. **Apify actor `curious_coder~facebook-ads-library-scraper`** is the one that works. The official `apify/facebook-ads-scraper` requires different input format.

2. **Start dates are unix timestamps** in the Apify response. Convert with `datetime.utcfromtimestamp(int(ts))`.

3. **DCO ads have no media URLs.** Display format = DCO and body text = `{{product.name}}` means Meta assembles the creative dynamically. Skip video pipeline for these.

4. **Whisper tiny.en model** (75MB) is fast and good enough for ad transcription. Medium.en (1.5GB) is more accurate but takes longer to download. Use whatever model is available.

5. **Hook extraction:** Don't hard-cut at N words. Split on sentence boundaries (`. ! ?`), take the first 1-2 complete sentences. If the first sentence is very short (<8 words), include the second.

6. **Preview thumbnails:** Video ads have `video_preview_image_url` in the Apify response. Image ads have `original_image_url` or `resized_image_url`. Use these for the Preview attachment field.

7. **Airtable batch limit is 10 records per request.** Always batch your creates and updates.

8. **Dedup on Ad Archive ID.** Same ad can appear in multiple scrapes. Check existing records before inserting.

9. **Status tracking on re-scrapes:** Ads that disappear from the Ad Library between scrapes should be marked `Is Active = false` with `End Date = today`. This tracks when competitors kill ads.

10. **Facebook Page ID vs Profile ID:** The Competitors table stores the Ad Library page ID (from Apify `pageAdLibrary.id`), NOT the profile ID. The Ad Library URL uses `view_all_page_id={this_id}`.

<\!-- Built with LIO_OS by @liogpt — https://github.com/novusordos666/LIO_OS -->
