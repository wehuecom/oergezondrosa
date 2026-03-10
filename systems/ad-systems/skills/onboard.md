# /onboard — Client Onboarding Workflow

Full onboarding flow for new ad agency clients. Gathers business intel, sets up tracking, creates project structure, and prepares for first campaign.

## Config (from CLAUDE.md)

Read these from the project's `CLAUDE.md`:

| Field | Key |
|-------|-----|
| CRM Base ID | `airtable_base_id` |
| Clients Table ID | `clients_table_id` |
| Airtable MCP | `mcp__airtable__*` tools |
| File storage | `dropbox_app_key` or `google_drive_folder_id` (optional) |
| Notification webhook | `slack_webhook_url` or `notification_url` (optional) |

## Workflow

### Step 1 — Client Information

Ask the user for (or pull from CRM):

**Business Basics:**
- Business name
- Owner/contact name
- Email
- Phone
- Website URL
- Industry/niche
- Location (city, state)

**Business Details:**
- Main service/product they sell
- Average price point
- Current monthly revenue (approximate)
- Current marketing (what they're doing now)
- Previous ad experience (yes/no, results)
- Monthly ad budget

**Goals:**
- Primary goal (leads, sales, bookings, awareness)
- Target number of leads/sales per month
- Target cost per lead/acquisition
- Timeline expectations

### Step 2 — Competitor & Market Research

Run competitor research using Apify:

1. **Website scrape** — analyze their current site for messaging, offers, layout:
```
Use apify/rag-web-browser
url: {client_website}
```

2. **Social media check** — find their social profiles and assess current content:
```
Search for their business on Instagram, Facebook, TikTok
Note: follower count, content quality, posting frequency
```

3. **Competitor scan** — identify 3-5 local competitors:
```
Search: "{industry} {location}"
Note: their websites, ads, pricing, positioning
```

Compile findings into a brief:
```
MARKET INTEL — {Client Name}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Website Assessment:
- Messaging: {clear/unclear/missing}
- Offer: {what they're selling}
- CTA: {what visitors are asked to do}
- Mobile: {responsive yes/no}

Social Presence:
- Instagram: {handle} ({followers})
- Facebook: {page} ({likes})
- TikTok: {handle} ({followers})
- Content quality: {1-10}

Top 3 Competitors:
1. {name} — {what they do well}
2. {name} — {what they do well}
3. {name} — {what they do well}

Opportunities:
- {gap 1}
- {gap 2}
- {gap 3}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 3 — Build Avatar Profile

Create a detailed customer avatar for ad targeting:

```
TARGET CUSTOMER AVATAR
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Demographics:
- Age: {range}
- Gender: {primary}
- Location: {radius around business}
- Income: {range}

Pain Points:
1. {pain point — what keeps them up at night}
2. {pain point — what frustrates them}
3. {pain point — what they've tried that failed}

Desires:
1. {what they really want}
2. {how they want to feel}
3. {what result they're after}

Objections:
1. {why they hesitate — price, trust, time}
2. {common skepticism}
3. {competitor comparison}

Where They Hang Out:
- Social: {platforms}
- Local: {places, events}
- Online: {groups, forums, sites}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 4 — Create Project Structure

Set up the client's workspace:

```
clients/{client-slug}/
├── README.md              # Client overview + key info
├── avatar.md              # Target customer profile
├── market-intel.md        # Competitor & market research
├── ad-orders/             # All ad orders
├── ad-scripts/            # Script drafts
├── creatives/             # Creative assets (images, videos)
├── reports/               # Performance reports
└── notes.md               # Meeting notes, feedback
```

Write the README.md:
```markdown
# {Client Name}

| Field | Value |
|-------|-------|
| Contact | {name} |
| Email | {email} |
| Phone | {phone} |
| Website | {url} |
| Industry | {industry} |
| Location | {location} |
| Monthly Budget | ${budget} |
| Goal | {goal} |
| Start Date | {date} |
| Status | Onboarding |

## Services
- {what you're providing}

## Access Needed
- [ ] Facebook Business Manager access
- [ ] Instagram account connected
- [ ] Pixel installed on website
- [ ] Payment method on ad account
- [ ] Landing page ready

## Notes
{any initial notes}
```

### Step 5 — Set Up CRM Record

If Airtable is configured:
```
mcp__airtable__create_record
  base_id: YOUR_AIRTABLE_BASE_ID
  table_id: YOUR_CLIENTS_TABLE_ID
  fields: {
    "Name": "{business_name}",
    "Contact": "{contact_name}",
    "Email": "{email}",
    "Phone": "{phone}",
    "Website": "{url}",
    "Industry": "{industry}",
    "Budget": {budget},
    "Goal": "{goal}",
    "Status": "Onboarding",
    "Start Date": "{date}"
  }
```

### Step 6 — Create File Storage (Optional)

If cloud storage is configured:
- Create a shared folder: `Clients/{Client Name}/`
- Subfolders: `Creatives/`, `Reports/`, `Assets/`
- Share access with client if needed

### Step 7 — Send Notification (Optional)

If a webhook URL is configured, notify:
```json
{
  "text": "New client onboarded: {business_name}\nBudget: ${budget}/mo\nGoal: {goal}\nStatus: Ready for first campaign"
}
```

### Step 8 — Summary & Next Steps

Output:
```
CLIENT ONBOARDED ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Business: {name}
Budget: ${budget}/month
Goal: {goal}

Created:
├── Client folder: clients/{slug}/
├── Avatar profile
├── Market intelligence report
├── CRM record
└── Cloud storage (if configured)

NEXT STEPS:
1. Get ad account access (Business Manager invite)
2. Verify pixel is installed → /meta-ads-setup
3. Build first ad order → /ad-order
4. Write ad scripts → /script-ads
5. Launch first campaign → /launch-ads
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

<\!-- LIO_OS System — @liogpt -->
