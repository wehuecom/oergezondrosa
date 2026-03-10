# Ad Systems

Complete ad agency toolkit — from competitive research to campaign launch to lead management.

## How It Works

```
Research Competitors → Scrape Ads → Generate Brief → Script Ads → Launch Campaign → Respond to Leads → Report
```

1. **Research** competitors — build a database with Facebook Page IDs, Ad Library links, logos
2. **Scrape** every competitor ad from Meta Ad Library — transcribe, classify, store
3. **Brief** — generate an intelligence report with data-backed ad recommendations
4. **Script** UGC ad scripts using proven direct-response frameworks
5. **Launch** Meta ad campaigns directly from Claude Code
6. **Respond** to inbound leads with personalized SMS/email
7. **Track** everything in your CRM

## Skills

| Skill | What It Does |
|-------|-------------|
| `/competitor-research` | Build a competitor database — web research → FB Page IDs → Ad Library links → Airtable |
| `/scrape-ads` | Scrape all competitor ads from Meta Ad Library. Download, transcribe, classify, push to Airtable. |
| `/ad-brief` | Generate an 8-section Ad Intelligence Brief — executive summary, niche analysis, strategic playbook |
| `/onboard` | Full client onboarding — research, avatar, project setup, CRM record |
| `/ad-order` | Generate structured ad orders with creative briefs and budgets |
| `/script-ads` | Write UGC ad scripts using PAS, storytelling, before/after frameworks |
| `/launch-ads` | Create and launch Meta ad campaigns via the Graph API |
| `/respond-to-leads` | Manage leads — draft personalized responses, track pipeline stages |
| `/meta-ads-setup` | Step-by-step wizard to configure Meta Ads MCP server |

## Reference Files

| File | What |
|------|------|
| `reference/meta-ads-api.md` | Meta Marketing API reference — endpoints, targeting, creatives |
| `reference/avatar-guide.md` | Framework for building customer avatars with examples |
| `reference/client-crm-schema.md` | Recommended Airtable schema for agency CRM |
| `reference/sms-playbook.md` | SMS conversation flows for lead conversion |

## SOPs

| File | What |
|------|------|
| `sops/automation-setup.md` | Connect Meta lead forms → n8n → CRM → notifications |
| `sops/payment-webhook-setup.md` | Connect Stripe payments → n8n → CRM updates |

## Templates

| File | What |
|------|------|
| `templates/client-proposal.md` | Client proposal template |
| `templates/email-sequences.md` | Email sequence templates for client communication |
| `templates/onboarding-flow.md` | Onboarding process checklist |

## Prerequisites

**For Meta Ads:**
- Meta Business Manager account
- Ad account with payment method
- System User token with `ads_management` permission
- Meta Ads MCP server configured (run `/meta-ads-setup`)

**For CRM:**
- Airtable account (free tier works)
- Airtable MCP server configured (see `mcp-configs/airtable.json`)
- Tables created per `reference/client-crm-schema.md`

**For Lead Response:**
- SMS platform (GoHighLevel, Twilio, or manual)
- CRM with leads table configured

## Getting Started

1. Run `/setup` to configure your CLAUDE.md with ad account details
2. Set up Meta Ads MCP with `/meta-ads-setup`
3. Create your CRM tables using `reference/client-crm-schema.md`
4. Onboard your first client with `/onboard`
5. Generate an ad order with `/ad-order`
6. Write ad scripts with `/script-ads`
7. Launch the campaign with `/launch-ads`
8. Respond to leads with `/respond-to-leads`
