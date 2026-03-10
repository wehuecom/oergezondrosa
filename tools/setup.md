# /setup — Premium Toolkit Personalization

One-time setup that interviews you about your business, creates your CLAUDE.md, and customizes every skill and reference file for your specific use case.

## What This Does

1. Asks you a series of questions about your business
2. Generates a complete `CLAUDE.md` for your project
3. Scans all installed skills and reference files
4. Replaces all `YOUR_*` placeholders with your actual values
5. Configures MCP servers for your tools
6. Sets up your CRM schema (if using Airtable)

## Workflow

### Phase 1 — Business Interview

Ask these questions one section at a time. Don't overwhelm — group into 3-4 questions per prompt.

**Section 1: The Basics**
1. What's your business name?
2. What do you do? (1-2 sentence description)
3. What's your website URL?
4. What industry/niche are you in?

**Section 2: Your Audience**
1. Who's your target customer? (age, gender, location, role)
2. What's their biggest pain point?
3. What result do they want?
4. How much do they typically pay you?

**Section 3: Your Content (if applicable)**
1. Do you create content? (Yes/No)
2. If yes — what platforms? (Instagram, TikTok, YouTube, X, LinkedIn)
3. What's your handle/username on your main platform?
4. What type of content? (demos, tutorials, talking head, educational, entertainment)
5. What topics/keywords define your niche? (comma-separated)

**Section 4: Your Tools**
1. Do you use Airtable? (Yes/No → get base IDs)
2. Do you use n8n? (Yes/No → get instance URL)
3. Do you run Meta Ads? (Yes/No → get ad account ID)
4. Do you use Stripe? (Yes/No)
5. Do you use a CRM? (Which one?)
6. Any other tools you want Claude to connect to?

**Section 5: Your Brand Voice**
1. How would you describe your communication style? (casual, professional, technical, funny, direct)
2. Give me an example sentence in your natural voice
3. Any words/phrases you always use or never use?

### Phase 2 — Generate CLAUDE.md

Using the answers above, generate a complete `CLAUDE.md` file in the user's project root:

```markdown
# {Business Name}

{Description}

---

## Brand Config

| Field | Value |
|-------|-------|
| **Business** | {name} |
| **Website** | {url} |
| **Industry** | {niche} |
| **Platforms** | {platforms} |
| **Handle** | {handle} |
| **Content style** | {style description} |

### Niche Keywords
{comma-separated keywords}

### Content Types
| Type | When | Examples |
|------|------|---------|
{filled from interview}

---

## Target Audience

| Field | Value |
|-------|-------|
| **Age** | {range} |
| **Gender** | {primary} |
| **Location** | {geo} |
| **Role** | {job/title} |
| **Pain point** | {biggest pain} |
| **Desire** | {main desire} |
| **Price point** | {average} |

---

## Connected Tools

| Tool | Config |
|------|--------|
{filled based on which tools they use}

## Content Data

{If they use Airtable for content, map their base/table IDs here}

## Ad Agency CRM

{If they run ads, map their client/lead tracking here}

## n8n Config

{If they use n8n, add instance URL and API key reference}

---

## Key Files

| File | Contents |
|------|----------|
| `CLAUDE.md` | This file — project config |
{add relevant files based on which systems they use}
```

### Phase 3 — Customize All Files

Scan the installed toolkit directories and replace placeholders:

**Directories to scan:**
- `~/.claude/commands/` — all skill files
- `~/.claude/skills/` — skill + reference bundles
- `~/.lio_os/templates/` — template files
- `~/.lio_os/prompts/` — prompt packs
- `~/.lio_os/mcp-configs/` — MCP server configs

**Replacements to make:**

| Placeholder | Replace With |
|-------------|-------------|
| `YOUR_BUSINESS_NAME` | Business name |
| `YOUR_HANDLE` | Social media handle |
| `YOUR_WEBSITE` | Website URL |
| `YOUR_NICHE` | Industry/niche |
| `YOUR_AIRTABLE_BASE_ID` | Airtable base ID |
| `YOUR_CONTENT_TABLE_ID` | Content table ID |
| `YOUR_CONTENT_PIPELINE_TABLE_ID` | Pipeline table ID |
| `YOUR_CLIENTS_TABLE_ID` | Clients table ID |
| `YOUR_LEADS_TABLE_ID` | Leads table ID |
| `YOUR_AD_ORDERS_TABLE_ID` | Ad orders table ID |
| `YOUR_N8N_INSTANCE` | n8n URL |
| `YOUR_META_APP_ID` | Meta app ID |
| `YOUR_META_APP_SECRET` | Meta app secret |
| `YOUR_META_ACCESS_TOKEN` | Meta access token |
| `YOUR_AD_ACCOUNT_ID` | Meta ad account ID |
| `YOUR_STRIPE_PAYMENT_LINK` | Stripe link |
| `YOUR_WEBHOOK_URL` | Primary webhook URL |
| `YOUR_SLACK_WEBHOOK_URL` | Slack webhook |
| `YOUR_CALENDAR_LINK` | Booking calendar URL |
| `YOUR_EMAIL` | Contact email |

**Important:** Only replace placeholders the user provided values for. Skip any they didn't answer.

### Phase 4 — Configure MCP Servers

Based on which tools they use, offer to set up MCP configs:

1. **Airtable** — copy `~/.lio_os/mcp-configs/airtable.json` → `~/.claude/settings.json`
2. **Meta Ads** — copy `~/.lio_os/mcp-configs/meta-ads.json` → `~/.claude/settings.json`
3. **Slack** — copy `~/.lio_os/mcp-configs/slack.json` → `~/.claude/settings.json`
4. **Notion** — copy `~/.lio_os/mcp-configs/notion.json` → `~/.claude/settings.json`
5. **Google Drive** — copy `~/.lio_os/mcp-configs/google-drive.json` → `~/.claude/settings.json`
6. **Filesystem** — copy `~/.lio_os/mcp-configs/filesystem.json` → `~/.claude/settings.json`

Merge into existing settings.json — don't overwrite.

### Phase 5 — Summary

```
SETUP COMPLETE ✓
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Business: {name}
Industry: {niche}

Created:
├── CLAUDE.md (your project config)
├── Customized {X} skill files
├── Configured {Y} MCP servers
└── Set up {Z} integrations

SYSTEMS ACTIVATED:
{only show systems relevant to them}
├── Content Engine ✓ (content creation + analytics)
├── Video Pipeline ✓ (record → edit → publish)
├── Ad Systems ✓ (campaigns, scripts, leads)
└── Automation ✓ (n8n workflow builder)

TRY THESE FIRST:
1. /content-scripter — write your first video script
2. /content-ideator — generate content ideas
3. /n8n — build an automation
4. /launch-ads — launch an ad campaign

To update later, just run /setup again.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Notes

- This skill should be run ONCE when first setting up the toolkit
- Running it again will re-interview and overwrite customizations
- The CLAUDE.md it generates is the single source of truth for all other skills
- All skills read from CLAUDE.md at runtime — keep it updated

<\!-- Built with LIO_OS by @liogpt — https://github.com/novusordos666/LIO_OS -->
