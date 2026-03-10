# Client CRM Schema

Recommended Airtable schema for managing ad agency clients. Set up these tables, then update your `CLAUDE.md` with the base and table IDs.

## Tables

### 1. Clients

| Field | Type | Description |
|-------|------|-------------|
| Name | Single line text | Business name |
| Contact Name | Single line text | Primary contact |
| Email | Email | Contact email |
| Phone | Phone | Contact phone |
| Website | URL | Business website |
| Industry | Single select | Business category |
| Location | Single line text | City, State |
| Monthly Budget | Currency | Ad spend budget |
| Management Fee | Currency | Your monthly fee |
| Goal | Single select | Leads / Sales / Bookings / Awareness |
| Status | Single select | Prospect / Onboarding / Active / Paused / Churned |
| Start Date | Date | Contract start |
| Ad Account ID | Single line text | Meta ad account ID |
| Pixel ID | Single line text | Meta pixel ID |
| Page ID | Single line text | Facebook Page ID |
| Calendar Link | URL | Booking link |
| Notes | Long text | General notes |
| Ad Orders | Link to Ad Orders | Related ad orders |
| Leads | Link to Leads | Related leads |

### 2. Ad Orders

| Field | Type | Description |
|-------|------|-------------|
| Order Name | Single line text | Campaign name / description |
| Client | Link to Clients | Which client |
| Campaign Objective | Single select | Leads / Sales / Traffic / Awareness |
| Budget | Currency | Monthly campaign budget |
| Platforms | Multiple select | Meta / TikTok / Google / YouTube |
| Ad Count | Number | Number of creatives |
| Creative Format | Multiple select | Video / Image / Carousel |
| Status | Single select | Draft / Approved / In Production / Live / Completed |
| Launch Date | Date | Target launch |
| End Date | Date | Campaign end (if applicable) |
| Campaign IDs | Long text | Meta campaign IDs after launch |
| Results | Long text | Performance summary |
| Notes | Long text | Creative direction, feedback |

### 3. Leads

| Field | Type | Description |
|-------|------|-------------|
| Name | Single line text | Lead's name |
| Phone | Phone | Lead's phone |
| Email | Email | Lead's email |
| Client | Link to Clients | Which client generated this lead |
| Source | Single select | Facebook / Instagram / TikTok / Google / Referral / Walk-in |
| Campaign | Single line text | Which campaign / ad set |
| Stage | Single select | New / Contacted / Engaged / Booked / Showed / No-Show / Closed / Lost |
| First Contact | Date | When first message sent |
| Last Contact | Date | Last touchpoint |
| Appointment Date | Date | Scheduled appointment |
| Value | Currency | Deal value (if closed) |
| Notes | Long text | Conversation notes |
| Messages | Long text | Message log |

### 4. Reports (Optional)

| Field | Type | Description |
|-------|------|-------------|
| Report Name | Single line text | "Week 1 — Jan 2025" |
| Client | Link to Clients | Which client |
| Period | Single line text | Date range |
| Spend | Currency | Total ad spend |
| Impressions | Number | Total impressions |
| Clicks | Number | Total clicks |
| Leads | Number | Total leads generated |
| CPL | Currency | Cost per lead |
| CTR | Percent | Click-through rate |
| ROAS | Number | Return on ad spend |
| Summary | Long text | Key findings, recommendations |
| Attachments | Attachment | Screenshots, PDFs |

## Views

### Clients Table
- **All Clients** — Grid view, all records
- **Active Clients** — Filter: Status = "Active"
- **Onboarding** — Filter: Status = "Onboarding"
- **Pipeline** — Kanban by Status

### Leads Table
- **All Leads** — Grid view
- **New Leads** — Filter: Stage = "New" (uncontacted)
- **Follow-Up Needed** — Filter: Stage = "Contacted" AND Last Contact < 24h ago
- **Pipeline** — Kanban by Stage
- **By Client** — Grouped by Client

### Ad Orders Table
- **All Orders** — Grid view
- **Active Campaigns** — Filter: Status = "Live"
- **By Client** — Grouped by Client

## CLAUDE.md Integration

After creating these tables, add to your `CLAUDE.md`:

```markdown
## Ad Agency CRM

| Field | Value |
|-------|-------|
| Airtable Base ID | YOUR_AIRTABLE_BASE_ID |
| Clients Table | YOUR_CLIENTS_TABLE_ID |
| Ad Orders Table | YOUR_AD_ORDERS_TABLE_ID |
| Leads Table | YOUR_LEADS_TABLE_ID |
| Reports Table | YOUR_REPORTS_TABLE_ID |
```

The `/onboard`, `/ad-order`, `/respond-to-leads`, and `/launch-ads` skills read from these values.

## Setup Checklist

- [ ] Create Airtable base
- [ ] Create Clients table with fields above
- [ ] Create Ad Orders table
- [ ] Create Leads table
- [ ] Create Reports table (optional)
- [ ] Set up Kanban views for pipeline management
- [ ] Configure Airtable MCP server (see `mcp-configs/airtable.json`)
- [ ] Add base/table IDs to CLAUDE.md
- [ ] Test with `/onboard` on a test client

<\!-- LIO_OS System — @liogpt -->
