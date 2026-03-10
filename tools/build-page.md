# /build-page — Landing Page Builder

Build conversion-optimized landing pages from Claude Code. Generates complete HTML/CSS/JS landing pages tailored to your offer.

## Before Writing

Read from the project's `CLAUDE.md`:
1. Business name and branding
2. Target audience / avatar (if `reference/avatar.md` exists, read it)
3. Offer details
4. Social proof / testimonials
5. Brand colors, fonts, tone

## Workflow

### Step 1 — Gather Requirements

Ask the user:
1. **What's the page for?** — lead capture, sales, booking, waitlist, event
2. **What's the offer?** — free resource, service, product, consultation
3. **What's the CTA?** — sign up, book a call, buy now, join waitlist
4. **Form fields needed?** — name, email, phone, custom fields
5. **Form destination?** — where do submissions go (webhook URL, email, Stripe, etc.)
6. **Any specific sections?** — hero, features, testimonials, FAQ, pricing
7. **Style preference?** — minimal, bold, dark mode, playful, corporate

### Step 2 — Build the Page

Generate a single `index.html` file with inline CSS and JS. The page should be:
- **Mobile-first** — looks great on phone, scales up to desktop
- **Fast** — no external dependencies, inline everything
- **Conversion-focused** — clear CTA above the fold, minimal distractions
- **Accessible** — semantic HTML, proper contrast, readable fonts

**Page structure:**

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{Page Title}</title>
  <style>
    /* All CSS inline — mobile-first */
  </style>
</head>
<body>
  <!-- Hero Section -->
  <!-- Features/Benefits -->
  <!-- Social Proof -->
  <!-- CTA / Form -->
  <!-- FAQ (optional) -->
  <!-- Footer -->

  <script>
    /* Form handling, smooth scroll, etc */
  </script>
</body>
</html>
```

### Step 3 — Form Integration

Based on where the form submits:

**Webhook (n8n, Zapier, etc.):**
```javascript
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const data = Object.fromEntries(new FormData(form));
  await fetch('YOUR_WEBHOOK_URL', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  // Show success message
});
```

**Stripe Payment Link:**
```javascript
// Redirect to Stripe
window.location.href = 'YOUR_STRIPE_PAYMENT_LINK';
```

**Email (mailto fallback):**
```html
<form action="https://formsubmit.co/YOUR_EMAIL" method="POST">
```

### Step 4 — Deploy

After the page is built, offer deployment options:

1. **Local preview:** `open index.html` in browser
2. **Vercel:** `npx vercel --prod` (if Vercel CLI installed)
3. **Netlify:** drag and drop at netlify.com/drop
4. **GitHub Pages:** push to a repo with Pages enabled
5. **Custom domain:** user configures DNS

### Design Principles

- **One page, one goal** — every element should push toward the CTA
- **Hero headline = biggest pain point or desire** — not your company name
- **Show, don't tell** — use specific numbers, results, examples
- **Reduce friction** — fewer form fields = more conversions
- **Trust signals** — testimonials, logos, "as seen in", guarantees
- **Urgency** — limited spots, countdown, "filling fast" (only if real)
- **Mobile-first** — 60%+ of traffic is mobile. Test on phone first.

### Color Palette Defaults

If no brand colors specified, use a clean default:
```css
:root {
  --bg: #0a0a0a;
  --text: #ffffff;
  --accent: #6366f1;
  --accent-hover: #818cf8;
  --muted: #a1a1aa;
  --card: #18181b;
  --border: #27272a;
}
```

Override with brand colors from CLAUDE.md if available.

<\!-- Built with LIO_OS by @liogpt — https://github.com/novusordos666/LIO_OS -->
