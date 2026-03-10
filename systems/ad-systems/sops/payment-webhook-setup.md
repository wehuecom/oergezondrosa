# SOP: Payment Webhook Setup

How to connect Stripe payment events to your CRM using n8n webhooks. Automatically update client records when payments are received.

## Overview

```
Client Pays → Stripe → Webhook → n8n → CRM Update → Notification
```

When a client makes a payment:
1. Stripe fires a webhook event
2. n8n catches it and extracts payment data
3. CRM record updates (status, payment date, amount)
4. You get notified

## Prerequisites

- [ ] Stripe account with API access
- [ ] n8n instance running
- [ ] Airtable base with Clients table
- [ ] (Optional) Slack for notifications

## Step 1: Create n8n Webhook

1. Open your n8n instance
2. Create new workflow: **"Payment Webhook — Stripe"**
3. Add a **Webhook** node:
   - Method: `POST`
   - Path: `stripe-payment`
   - Response Mode: `Immediately`
4. Copy the production webhook URL

## Step 2: Configure Stripe Webhook

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click **"Add endpoint"**
3. Paste your n8n webhook URL:
   ```
   https://YOUR_N8N_INSTANCE/webhook/stripe-payment
   ```
4. Select events to listen for:
   - `checkout.session.completed` — one-time payments
   - `invoice.payment_succeeded` — subscription payments
   - `customer.subscription.created` — new subscriptions
   - `customer.subscription.deleted` — cancellations
5. Save and copy the **Signing Secret** (starts with `whsec_`)

## Step 3: Build n8n Workflow

### Node 1: Webhook (Trigger)
Already configured.

### Node 2: Set Node (Extract Payment Data)
```
Event Type: {{ $json.body.type }}
Customer Email: {{ $json.body.data.object.customer_email || $json.body.data.object.customer_details?.email }}
Amount: {{ ($json.body.data.object.amount_total || $json.body.data.object.amount_paid) / 100 }}
Currency: {{ $json.body.data.object.currency }}
Payment Date: {{ $now.toISO() }}
Stripe Customer ID: {{ $json.body.data.object.customer }}
Subscription ID: {{ $json.body.data.object.subscription || "" }}
Product: {{ $json.body.data.object.metadata?.product_name || "Unknown" }}
```

### Node 3: IF Node (Route by Event Type)
- **Branch 1:** `checkout.session.completed` → New payment
- **Branch 2:** `invoice.payment_succeeded` → Recurring payment
- **Branch 3:** `customer.subscription.deleted` → Cancellation

### Node 4a: Airtable — Search for Client
```
mcp__airtable__search_records
  base_id: YOUR_AIRTABLE_BASE_ID
  table_id: YOUR_CLIENTS_TABLE_ID
  search_term: {{ $json["Customer Email"] }}
```

### Node 4b: Airtable — Update Client Record
```
mcp__airtable__update_records
  records: [{
    "id": "{record_id}",
    "fields": {
      "Status": "Active",
      "Last Payment": "{payment_date}",
      "Last Amount": {amount},
      "Stripe Customer ID": "{stripe_customer_id}"
    }
  }]
```

### Node 5: Slack Notification
```
💰 Payment received!
Client: {{ $json["Customer Email"] }}
Amount: ${{ $json.Amount }}
Product: {{ $json.Product }}
```

### For Cancellations (Branch 3):
Update status to "Churned" and notify:
```
⚠️ Subscription cancelled
Client: {{ $json["Customer Email"] }}
Product: {{ $json.Product }}
Action needed: Follow up to save the client
```

## Step 4: Verify Webhook Signature (Recommended)

Add security by verifying Stripe's webhook signature:

1. Add a **Code** node before the Set node
2. Use the signing secret from Step 2:

```javascript
const crypto = require('crypto');
const secret = 'YOUR_STRIPE_WEBHOOK_SECRET';
const signature = $input.first().headers['stripe-signature'];
const payload = JSON.stringify($input.first().body);

const elements = signature.split(',');
const timestamp = elements.find(e => e.startsWith('t=')).split('=')[1];
const sig = elements.find(e => e.startsWith('v1=')).split('=')[1];

const signedPayload = `${timestamp}.${payload}`;
const expected = crypto.createHmac('sha256', secret).update(signedPayload).digest('hex');

if (sig !== expected) {
  throw new Error('Invalid webhook signature');
}

return $input.all();
```

**Note:** Store the signing secret as an n8n credential, not hardcoded.

## Step 5: Test

1. Activate the workflow
2. Go to Stripe Dashboard → Webhooks → your endpoint
3. Click **"Send test webhook"**
4. Select `checkout.session.completed`
5. Check n8n execution log
6. Verify CRM updated
7. Verify notification sent

## Step 6: Go Live

1. Ensure workflow is Active
2. Make a test purchase through your actual payment link
3. Verify end-to-end flow
4. Monitor for first few real payments

## Event Reference

| Stripe Event | What Happened | CRM Action |
|-------------|---------------|------------|
| `checkout.session.completed` | One-time payment | Create/update record, set Active |
| `invoice.payment_succeeded` | Subscription renewed | Update last payment date |
| `customer.subscription.created` | New subscription | Set status to Active |
| `customer.subscription.updated` | Plan changed | Update plan details |
| `customer.subscription.deleted` | Cancelled | Set status to Churned |
| `charge.refunded` | Refund issued | Flag for review |

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Webhook not firing | Check Stripe endpoint is Active; check URL is correct |
| Signature validation fails | Verify signing secret matches; check payload isn't modified |
| Client not found in CRM | Ensure email matches; add fuzzy matching or create new record |
| Amounts wrong | Stripe sends cents — divide by 100 |
| Duplicate events | Add idempotency check using Stripe event ID |
