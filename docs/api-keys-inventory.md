# Warriors Arena — API Keys & Credentials Inventory

> Every third-party service, API key, credential, and secret needed from Phase 0 through launch. Organized by when you need them.

---

## Phase 0 — Infrastructure Setup (Required Before Sprint 1)

### Supabase (Database + Auth)
**When:** Step 4 of Phase 0 runbook
**Where:** https://supabase.com

```bash
# Production Project
NEXT_PUBLIC_SUPABASE_URL=https://muctbmjyuoebyfeikoxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Y3RibWp5dW9lYnlmZWlrb3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY4ODAsImV4cCI6MjA5MjI2Mjg4MH0.NFIRQ-D65d6o0zAtjx71bT6wNqYzf-rtGN6gFf6s4fk  # Public, safe to expose
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Y3RibWp5dW9lYnlmZWlrb3h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4Njg4MCwiZXhwIjoyMDkyMjYyODgwfQ.wlAMfGOb42KU6UV8kZQYZxb9KQgJSZ34xTqnQQZaidQ      # SECRET — server-only

# Staging Project (for development)
NEXT_PUBLIC_SUPABASE_URL=https://muctbmjyuoebyfeikoxz.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Y3RibWp5dW9lYnlmZWlrb3h6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2ODY4ODAsImV4cCI6MjA5MjI2Mjg4MH0.NFIRQ-D65d6o0zAtjx71bT6wNqYzf-rtGN6gFf6s4fk
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im11Y3RibWp5dW9lYnlmZWlrb3h6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjY4Njg4MCwiZXhwIjoyMDkyMjYyODgwfQ.wlAMfGOb42KU6UV8kZQYZxb9KQgJSZ34xTqnQQZaidQ
```

**Cost:** Free tier supports 500MB database, 2GB bandwidth, 50k monthly active users. More than enough for Warriors Arena's v1 scale (~360 bookings/month).

---

### Vercel (Hosting)
**When:** Step 5 of Phase 0 runbook
**Where:** https://vercel.com

No explicit keys needed in `.env` — Vercel injects them automatically. But you configure:
- Environment variables in dashboard (copy from `.env.local.example`)
- Domain settings
- Cron jobs (via `vercel.json`)

**Cost:** Free tier: 100GB bandwidth, unlimited requests. Upgrade to Pro ($20/mo) only if you hit limits.

---

### Sentry (Error Monitoring)
**When:** Step 13 of Phase 0 runbook
**Where:** https://sentry.io

```bash
SENTRY_DSN=https://644ad12171b4c2314516bce03ba1d747@o4511249443717120.ingest.de.sentry.io/4511252915748944
NEXT_PUBLIC_SENTRY_DSN=https://abc123@o123.ingest.sentry.io/456  # Same value, client-safe
SENTRY_AUTH_TOKEN=sntrys_...  # For source map uploads (CI/CD only)
SENTRY_PROJECT=warriors-arena
SENTRY_ORG=your-org
```

Run `npx @sentry/wizard@latest -i nextjs` — it creates these automatically.

**Cost:** Free tier: 5k errors/month. Plenty for v1.

---

### GitHub (Version Control)
**When:** Step 16 of Phase 0 runbook
**Where:** https://github.com

No keys in `.env`. You use SSH or HTTPS authentication. Vercel links to your GitHub repo automatically.

**Cost:** Free for public or private repos.

---

## Sprint 4 — Booking Wizard (Optional but Recommended)

### Turnstile / CAPTCHA (Bot Protection)
**When:** Sprint 2 (public booking API) or Sprint 4 (booking wizard UI)
**Where:** https://www.cloudflare.com/products/turnstile/ (free) or https://www.google.com/recaptcha (free)

**Turnstile (Recommended — no annoying puzzles):**
```bash
NEXT_PUBLIC_TURNSTILE_SITE_KEY=0x4A...  # Public, client-side
TURNSTILE_SECRET_KEY=0x4A...secret       # SECRET, server-side verification
```

**Google reCAPTCHA v3 (Alternative):**
```bash
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=6Lc...
RECAPTCHA_SECRET_KEY=6Lc...secret
```

**Setup:**
1. Create Cloudflare account (free)
2. Turnstile → Add Site → warriors-arena.com
3. Copy keys

**Cost:** Free unlimited for Turnstile. Free 1M assessments/month for reCAPTCHA.

**Usage in code:**
- Client: `<Turnstile sitekey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY} />`
- Server: Verify token before calling `create-booking`

---

## Sprint 5 — Receipt PDF (Already Included)

### Puppeteer / Chromium
**No API keys needed.** Uses local `@sparticuz/chromium` package. Vercel serverless functions support this out of the box (with memory config in `vercel.json`).

---

## Sprint 8 — Launch Prep (Required Before Going Live)

### Meta Pixel + Conversions API (Analytics)
**When:** Sprint 8 (can be stubbed earlier)
**Where:** https://business.facebook.com → Events Manager

```bash
NEXT_PUBLIC_META_PIXEL_ID=123456789012345
META_CAPI_ACCESS_TOKEN=EAABsb...          # SECRET, server-side CAPI
META_CAPI_TEST_EVENT_CODE=TEST12345       # Optional, for testing in Events Manager
```

**Setup:**
1. Create Meta Business account (free)
2. Events Manager → Create Pixel → Copy Pixel ID
3. Settings → Conversions API → Generate Access Token
4. (Optional) Test Events tool → get test event code

**Cost:** Free. You pay for ads, not for tracking.

**Usage:**
- Client: Pixel base code in `app/[locale]/layout.tsx`, fires PageView
- Server: CAPI in `src/lib/analytics/capi.ts`, fires Purchase after booking

---

### WhatsApp Business (Customer Communication)
**When:** Sprint 2 (for deep link) or v1.1 (for API auto-send)
**Where:** https://business.whatsapp.com

**v1 (Deep Link Only — No API Keys):**
```bash
# In system_settings table (not .env)
whatsapp_number: "+201234567890"
```

Just a phone number. The deep link is `https://wa.me/201234567890?text=...`.

**Cost:** Free.

**v1.1 (Auto-Send via API — Deferred):**
```bash
WHATSAPP_BUSINESS_ACCOUNT_ID=123456789
WHATSAPP_ACCESS_TOKEN=EAABsb...
WHATSAPP_PHONE_NUMBER_ID=987654321
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_string_you_create
```

Setup: Meta Business Platform → WhatsApp → Business API. Requires business verification (takes 1-2 weeks). Cost: ~$0.005-0.01/message.

**Recommendation:** v1 uses deep link. v1.1 adds API.

---

### InstaPay (Deposit Payment Identifier)
**No API keys for v1.** InstaPay in Egypt works via manual bank transfer — customers send to your InstaPay handle, you confirm manually.

```bash
# In system_settings table (not .env)
instapay_identifier: "warriors@instapay"  # Or phone number
```

**v1.1 (Paymob Integration — Deferred):**
```bash
PAYMOB_API_KEY=ZXlKaG...
PAYMOB_IFRAME_ID=123456
PAYMOB_INTEGRATION_ID=789012
PAYMOB_HMAC_SECRET=abc123def456
```

Setup: https://paymob.com → create account → integrations. Takes 1-2 days for approval.

**Cost:** Paymob charges 2.5% + 1 EGP per transaction.

**Recommendation:** v1 uses manual WhatsApp confirmation. v1.1 adds Paymob auto-payment.

---

## Development Utilities (Optional but Helpful)

### UptimeRobot (Site Monitoring)
**When:** Sprint 8 or post-launch
**Where:** https://uptimerobot.com

No API keys in code. You configure monitors in their dashboard:
- HTTP(s) ping: `https://warriors-arena.com/api/health`
- Interval: 5 minutes
- Alert: Email when down

**Cost:** Free tier: 50 monitors, 5-min interval.

---

### Google Search Console (SEO)
**When:** Sprint 8 (SEO basics)
**Where:** https://search.google.com/search-console

No API keys. You verify domain ownership via DNS TXT record or HTML file.

**Cost:** Free.

---

### Cloudflare (Optional — DNS + CDN)
**When:** If you want custom domain + faster global delivery
**Where:** https://cloudflare.com

```bash
# Only if using Cloudflare R2 for media (Phase 2+)
R2_ACCOUNT_ID=abc123
R2_ACCESS_KEY_ID=...
R2_SECRET_ACCESS_KEY=...
```

**Cost:** Free tier: Unlimited bandwidth (seriously), free DNS. R2 storage: $0.015/GB/month (way cheaper than AWS S3).

**For v1:** Use Next.js `/public` folder for images. Migrate to R2 in Phase 2.

---

## System Settings (Database, Not .env)

These go in the `system_settings` table, not environment variables:

```sql
-- Already seeded in 001_reference_data.sql
INSERT INTO system_settings (key, value) VALUES
  ('whatsapp_number', '{"number": "+201234567890"}'),
  ('instapay_identifier', '{"identifier": "warriors@instapay"}'),
  ('contact_phone', '{"number": "+201234567890"}'),
  ('contact_email', '{"email": "hello@warriorsarena.com"}'),
  ('park_entry_fee_regular', '{"amount": 30.00, "currency": "EGP"}'),
  ('park_entry_fee_holiday', '{"amount": 50.00, "currency": "EGP"}'),
  ('deposit_percentage', '{"percentage": 25.00}');
```

Update these via admin UI (Sprint 7) or SQL editor before launch.

---

## Secret Management Best Practices

### In Development (.env.local)
```bash
cp .env.local.example .env.local
# Fill in staging credentials
# NEVER commit .env.local to git
```

### In Vercel (Production)
Settings → Environment Variables → Add for each scope:
- **Production:** Production Supabase, production Meta Pixel, real Sentry DSN
- **Preview:** Staging Supabase, test Meta Pixel
- **Development:** Staging credentials (mirrors .env.local)

### Rotation Schedule
- **Supabase service role key:** Rotate every 90 days (create new, update Vercel, delete old)
- **Meta CAPI token:** Expires after 60 days — Meta warns you in Events Manager
- **Sentry auth token:** Only used in CI/CD; rotate yearly

### If a Secret Leaks
1. Immediately rotate the key in the provider dashboard
2. Update `.env.local` and Vercel
3. Redeploy
4. Check git history — if committed, rewrite history or change the secret permanently

---

## Cost Summary (Monthly)

| Service | v1 Launch | 6 Months (High Traffic) |
|---------|-----------|-------------------------|
| Supabase | $0 (free tier) | $25 (Pro, 8GB DB) |
| Vercel | $0 (free tier) | $20 (Pro, bandwidth) |
| Sentry | $0 (free tier) | $0 (still under limit) |
| Meta Pixel | $0 | $0 |
| WhatsApp (deep link) | $0 | $0 |
| Turnstile | $0 | $0 |
| **Total** | **$0** | **~$45/mo** |

**With v1.1 integrations (Paymob, WhatsApp API):**
- Paymob: 2.5% of revenue (~360 bookings × 400 EGP avg = ~$900 revenue → $22.50/mo fees)
- WhatsApp API: 360 messages × $0.007 = ~$2.50/mo
- Total: ~$70/mo

---

## Pre-Launch Checklist (Environment Variables)

Before changing DNS to production:

- [ ] All production keys set in Vercel (Production scope)
- [ ] Sentry receiving test errors from production deploy
- [ ] Meta Pixel showing test events in Events Manager
- [ ] Supabase production project has migrations + seeds applied
- [ ] system_settings table has real values (not placeholders)
- [ ] Health check endpoint returns 200 on production URL
- [ ] `.env.local` never committed to git (check: `git log --all --full-history -- .env.local`)

---

*End of API Keys Inventory*
