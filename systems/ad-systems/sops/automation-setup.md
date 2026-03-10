# SOP: Lead Automation Setup

How to set up automated lead capture from Meta ads into your CRM using n8n webhooks.

## Overview

```
Meta Ad → Lead Form → Webhook → n8n → CRM (Airtable) → Notification (Slack/SMS)
```

When someone fills out a lead form on your ad, this automation:
1. Catches the lead data via webhook
2. Creates a record in your CRM
3. Sends you a notification
4. (Optional) Triggers an auto-response

## Prerequisites

- [ ] n8n instance running (cloud or self-hosted)
- [ ] Airtable base with Leads table (see `reference/client-crm-schema.md`)
- [ ] Meta developer app with webhooks configured
- [ ] (Optional) Slack workspace for notifications
- [ ] (Optional) SMS platform (Twilio/GHL) for auto-responses

## Step 1: Create n8n Webhook

1. Open your n8n instance
2. Create new workflow: **"Lead Capture — {Client Name}"**
3. Add a **Webhook** node:
   - Method: `POST`
   - Path: `lead-capture-{client-slug}`
   - Response Mode: `Immediately`
4. Copy the webhook URL — you'll need it for Meta

**Your webhook URL will look like:**
```
https://YOUR_N8N_INSTANCE/webhook/lead-capture-{client-slug}
```

## Step 2: Configure Meta Webhook

1. Go to [Meta Developers](https://developers.facebook.com/apps/)
2. Select your app → **Webhooks** → **Page**
3. Subscribe to `leadgen` events
4. Set callback URL to your n8n webhook
5. Set verify token (use a random string, configure in n8n)

**Alternative: Use Meta's Leads Center to set up integrations directly.**

## Step 3: Build n8n Workflow

### Node 1: Webhook (Trigger)
- Already configured in Step 1

### Node 2: Set Node (Map Fields)
Map the incoming data to your CRM fields:
```
Name: {{ $json.body.full_name || $json.body.first_name + ' ' + $json.body.last_name }}
Email: {{ $json.body.email }}
Phone: {{ $json.body.phone_number }}
Source: "Facebook"
Campaign: {{ $json.body.campaign_name || "Unknown" }}
Ad Set: {{ $json.body.adset_name || "" }}
Stage: "New"
Created: {{ $now.toISO() }}
```

### Node 3: Airtable (Create Record)
- Operation: Create
- Base: `YOUR_AIRTABLE_BASE_ID`
- Table: `YOUR_LEADS_TABLE_ID`
- Map all fields from Set node

### Node 4: Slack Notification (Optional)
- Channel: `#leads` or `#client-{name}`
- Message:
```
🔔 New Lead!
Name: {{ $json.Name }}
Phone: {{ $json.Phone }}
Source: {{ $json.Campaign }}
```

### Node 5: Auto-Response SMS (Optional)
- Use Twilio or HTTP Request to your SMS platform
- Message: First message from Flow 1 in `reference/sms-playbook.md`

## Step 4: Test the Webhook

1. Activate the workflow in n8n
2. Use Meta's Lead Ads Testing Tool:
   - Go to: `https://developers.facebook.com/tools/lead-ads-testing/`
   - Select your Page
   - Select your Form
   - Click "Create Lead"
3. Check n8n execution log
4. Verify the record appeared in Airtable
5. Verify Slack notification (if configured)

## Step 5: Go Live

1. Set workflow to **Active** in n8n
2. Run a test ad with a small budget ($5)
3. Fill out the form yourself
4. Verify the full pipeline works
5. Scale up

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Webhook not receiving data | Check Meta webhook subscription is active; verify callback URL |
| Missing fields | Map your form fields — Meta sends different field names per form |
| Duplicate leads | Add a deduplication check (search Airtable by phone/email before creating) |
| Delayed notifications | Check n8n execution queue; webhook should be near-instant |
| Auth errors | Verify Airtable API token and base permissions |

## Maintenance

- **Weekly:** Check n8n execution log for failed runs
- **Monthly:** Review lead quality — are the right people coming in?
- **Per campaign:** Update the Set node if form fields change
