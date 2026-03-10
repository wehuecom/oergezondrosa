# /respond-to-leads — Lead Response System

Manage and respond to inbound leads from ad campaigns. Reads lead data from CRM, drafts personalized SMS/email responses, and tracks pipeline stage.

## Config (from CLAUDE.md)

Read these from the project's `CLAUDE.md`:

| Field | Key |
|-------|-----|
| CRM Base ID | `airtable_base_id` |
| Leads Table ID | `leads_table_id` |
| Airtable MCP | `mcp__airtable__*` tools |
| GHL MCP (optional) | `mcp__ghl__*` tools |
| SMS Platform | `sms_platform` (GHL, Twilio, etc.) |
| Calendar Link | `calendar_link` |
| Business Name | `business_name` |
| Business Phone | `business_phone` |

## Lead Pipeline Stages

| Stage | Description |
|-------|-------------|
| `New` | Just came in from ad, no contact yet |
| `Contacted` | First message sent |
| `Engaged` | Lead replied, conversation active |
| `Booked` | Appointment/demo scheduled |
| `Showed` | They showed up |
| `No-Show` | Missed appointment |
| `Closed` | Deal won |
| `Lost` | Deal lost or disqualified |

## Workflow

### Step 1 — Pull New Leads

Check for uncontacted leads:
```
mcp__airtable__search_records
  base_id: YOUR_AIRTABLE_BASE_ID
  table_id: YOUR_LEADS_TABLE_ID
  search_term: "New"
```

Or if using GHL:
```
mcp__ghl__search_contacts
  query: {search_term}
  limit: 20
```

Display leads:
```
NEW LEADS ({count})
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. {name} — {phone} — {source} — {date}
2. {name} — {phone} — {source} — {date}
...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask: **"Which lead do you want to respond to? Or type 'all' to draft responses for everyone."**

### Step 2 — Draft Response

Read the lead's data (name, source, what they signed up for) and draft a personalized message.

**SMS Response Templates:**

**Template 1 — Friendly Intro (for fresh leads)**
```
Hey {first_name}! This is {your_name} from {business_name}.
I saw you were interested in {offer/service}.

Quick question — what made you check us out?
```

**Template 2 — Value-First (for leads from content)**
```
Hey {first_name}! {your_name} here from {business_name}.

Thanks for reaching out about {offer}. I actually put together
a quick {resource/video/guide} that shows exactly how we
{key_benefit}. Want me to send it over?
```

**Template 3 — Direct Book (for high-intent leads)**
```
Hey {first_name}! This is {your_name} from {business_name}.

Got your request — let's get you set up. I have a few spots
open this week for a quick call: {calendar_link}

What time works best for you?
```

**Template 4 — Re-engage (for leads gone cold)**
```
Hey {first_name}! {your_name} from {business_name} again.

Just checking in — you reached out about {offer} a few days
ago. Still interested? No pressure either way, just didn't
want you to miss out.
```

**Template 5 — Post No-Show**
```
Hey {first_name}! Looks like we missed each other. No worries
at all — things come up.

Here's my link to rebook whenever you're ready: {calendar_link}

If {day} or {day} work better for you, just let me know
and I'll block the time.
```

### Step 3 — Review & Send

Show the drafted message:
```
TO: {name} ({phone})
STAGE: {current_stage} → {new_stage}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{message}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask: **"Send this? (yes / edit / skip)"**

If using GHL for SMS:
```
mcp__ghl__send_message
  contact_id: {contact_id}
  message: {message}
  type: "SMS"
```

If not automated, show the message for manual copy/paste.

### Step 4 — Update Pipeline

After sending, update the lead's stage:
```
mcp__airtable__update_records
  base_id: YOUR_AIRTABLE_BASE_ID
  table_id: YOUR_LEADS_TABLE_ID
  records: [{ "id": "{record_id}", "fields": { "Stage": "Contacted", "Last Contact": "{timestamp}" } }]
```

### Step 5 — Follow-Up Queue

After processing all leads, show follow-up needs:
```
FOLLOW-UP NEEDED
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Contacted (no reply in 24h):
  1. {name} — sent {date} — {original_message_summary}
  2. {name} — sent {date}

No-Shows (need rebook):
  1. {name} — missed {date}

Engaged (waiting on reply):
  1. {name} — last msg {date}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Ask: **"Want to send follow-ups to any of these?"**

## Response Best Practices

1. **Speed wins** — respond within 5 minutes of lead coming in for highest conversion
2. **Personalize** — use their name, reference what they signed up for
3. **Ask a question** — every message should end with a question to keep the conversation going
4. **Don't pitch immediately** — build rapport first, then offer value, then book
5. **Keep it short** — SMS should be 2-4 sentences max
6. **Sound human** — no corporate speak, no "Dear valued customer"
7. **Have a CTA** — every message moves toward a booking or next step
8. **Track everything** — log every touchpoint in the CRM

<\!-- Built with LIO_OS by @liogpt — https://github.com/novusordos666/LIO_OS -->
