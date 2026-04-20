# Sprint 8 — Launch Prep (Meta Pixel + CAPI + Security Review + Launch)

> Prerequisites: Sprint 7 complete. All admin screens operational on staging.

## Prompt To Give Antigravity

```
Sprint 8: Final preparations for launch.

No new user-facing features. Focus: analytics, security hardening, and go-live readiness.

SCOPE:

1. Meta Pixel + Conversions API:
   - Verify client-side Pixel fires events: PageView, ViewContent, InitiateCheckout, AddToCart, Purchase (Sprint 4 scaffolded; verify events reach Meta Events Manager)
   - Server-side CAPI in src/lib/analytics/capi.ts:
     - Send matching events with same event_id (deduplication key) and hashed user data (phone, email where available)
     - Fire from /api/v1/bookings route handler after successful creation
     - Use Meta's recommended event data: value, currency, content_ids, content_type
   - Test via Meta Events Manager → Test Events tool with META_CAPI_TEST_EVENT_CODE env var

2. Sentry polish:
   - Source map uploads on Vercel production builds
   - Performance monitoring enabled (sample rate 10% to stay under free tier)
   - User context: set sentry user on admin sessions (anonymized for public bookings)
   - Confirm all environments reporting separately (dev, staging, production)

3. Rate limiting verification:
   - Run load test: 100 POSTs to /api/v1/bookings within 1 minute
   - Verify 5 succeed, 95 get 429
   - Verify per-phone limit triggers after 2 attempts from same phone

4. Accessibility pass (public site minimum):
   - Every form field has a label
   - Every button has accessible name
   - Focus visible on all interactive elements
   - Contrast ratios pass WCAG AA (4.5:1 text, 3:1 large)
   - Use axe DevTools or Lighthouse accessibility audit → 0 errors

5. Mobile QA:
   - Test on actual iPhone (or accurate simulator) + mid-range Android
   - Booking flow complete on both
   - Arabic flow end-to-end on both
   - Long press doesn't trigger selection menu at wrong times

6. Error pages:
   - /en/not-found and /ar/not-found (404)
   - /en/error and /ar/error (500)
   - Both localized, both with back-to-home CTA

7. SEO basics:
   - <title> per page (localized)
   - <meta description> (localized)
   - Open Graph tags for social sharing (og:image = hero image)
   - sitemap.xml at /sitemap.xml
   - robots.txt: allow all except /admin and /api
   - Verify in Google Search Console (if indexing is desired — otherwise noindex meta)

8. SECURITY REVIEW — spawn the reviewer subagent per .agent/agents/reviewer.md:
   - Give it NO context from this session
   - Give it: docs/architecture-v1.1.md, .agent/rules/security.md, .agent/rules/architecture.md, and the entire src/ + supabase/ directories
   - Ask it to run the security-scanner checklist from .agent/agents/security-scanner.md
   - Address every CRITICAL and HIGH finding before launch
   - Re-run after fixes

9. Backup verification:
   - Supabase: confirm automatic daily backups are enabled and retention is acceptable
   - Do a manual test restore onto a throwaway project to confirm the backup is usable
   - Document the restore procedure in docs/ops-runbook.md (new file)

10. Launch checklist document: docs/launch-checklist.md
    Pre-launch (DO all before changing DNS):
    - All env vars set in production Vercel scope
    - Production Supabase migrations + seeds applied
    - Production super-admin created
    - Real values set for system_settings (InstaPay, WhatsApp number, park fees)
    - At least one real game icon and one real hero image uploaded
    - Brand palette applied (if screenshot has been provided)
    - Privacy policy and Terms pages reviewed by client
    - Domain pointed to Vercel
    - SSL cert issued and verified
    - Meta Pixel verified via Events Manager (events showing up)
    - Sentry receiving events from production
    - UptimeRobot ping configured
    - Manual end-to-end booking test on production
    - Manual end-to-end cancel test on production
    - Revenue dashboard shows the test booking correctly
    - Test PDF receipt downloads and renders correctly
    
    Day of launch:
    - Announce to team via shared channel
    - Monitor Sentry for first 4 hours actively
    - Super-admin on standby for questions
    
    Day 1 post-launch:
    - Review all bookings made in first 24h
    - Review Sentry errors, resolve any P1 issues
    - Check Meta Pixel event counts
    - Verify auto-complete cron is working

WORKING MODE:
- Security review uses a fresh subagent context — treat it as an adversary finding flaws, not a rubber stamp.
- Do not skip the manual test restore of the backup — it is the only way to know if backups are actually usable.
- This sprint can take 3-5 days of steady work. Do not rush.

EXIT CRITERIA:
- Security review returns zero CRITICAL or HIGH findings (or all have been addressed and re-verified).
- Production deploy succeeds.
- End-to-end test on production works: landing → book → success → PDF → admin sees booking.
- Meta Events Manager shows the test purchase event with value + currency.
- Sentry shows a test error from production.
- UptimeRobot reports green.
- Launch checklist document exists and every pre-launch box is checked.

At end of Sprint 8, Phase 1 is complete and Warriors Arena is ready to launch.

Begin with the plan.
```

---

*End of Sprint 8 Prompt*
