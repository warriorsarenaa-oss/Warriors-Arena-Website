# Warriors Arena Launch Checklist

## Pre-Launch (DO all before changing DNS)

### Environment & Configuration
- [x] All environment variables set in Vercel production scope
  - NEXT_PUBLIC_SUPABASE_URL
  - SUPABASE_SERVICE_ROLE_KEY
  - NEXT_PUBLIC_SUPABASE_ANON_KEY
  - SENTRY_DSN
  - SENTRY_AUTH_TOKEN
  - NEXT_PUBLIC_META_PIXEL_ID
  - META_CAPI_ACCESS_TOKEN
  - NEXT_PUBLIC_TURNSTILE_SITE_KEY
  - TURNSTILE_SECRET_KEY
  - CRON_SECRET

### Database
- [x] Production Supabase migrations applied (001-008)
- [x] Production seeds applied (games, pricing, bundles, roles, permissions, super_admin)
- [x] Backup auto-enabled and retention set to 7+ days
- [x] Manual test restore successful

### Branding & Content
- [x] Real game icons uploaded to public/games/
- [x] Real hero image uploaded
- [x] Brand palette applied
- [x] Privacy Policy reviewed and posted
- [x] Terms of Service reviewed and posted
- [x] Arabic translations reviewed for accuracy

### System Settings (Update in Supabase)
- [x] system_settings.whatsapp_number = real WhatsApp
- [x] system_settings.instapay_identifier = real InstaPay ID
- [x] system_settings.contact_email = real email
- [x] system_settings.contact_phone = real phone
- [x] system_settings.park_entry_fee_regular = 30 EGP
- [x] system_settings.park_entry_fee_holiday = 50 EGP
- [x] system_settings.deposit_percentage = 25%

### Domain & SSL
- [x] Domain purchased
- [x] Domain DNS A record points to Vercel IP
- [x] Vercel auto-generates SSL certificate
- [x] HTTPS works without warnings

### Third-Party Integrations
- [x] Meta Pixel ID created
- [x] Meta Pixel verified (test event fires)
- [x] CAPI token created and validated
- [x] Sentry project created, SENTRY_DSN set
- [x] UptimeRobot monitor created
- [x] Turnstile site key/secret created

### Code & Build
- [x] All Sprint 7 subsections complete
- [x] All Sprint 8 subsections complete
- [x] npm run build passes (zero errors)
- [x] npm run test passes (14/14 or more)
- [x] npm run lint passes (zero errors)
- [x] No console warnings or errors

### Security Review
- [x] Security subagent audit complete
- [x] All CRITICAL findings resolved
- [x] All HIGH findings resolved
- [x] MEDIUM/LOW findings documented

### Testing
- [x] Rate limiting load test passed
- [x] Accessibility audit passed (axe: 0 violations, Lighthouse: ≥90)
- [x] Mobile QA passed (iOS + Android)
- [x] PDF receipt downloads correctly
- [x] Meta Pixel test event in Events Manager
- [x] Sentry test error reported
- [x] Backup restoration tested

### Documentation
- [x] docs/launch-checklist.md complete (this file)
- [x] docs/ops-runbook.md created
- [x] ACCESSIBILITY.md created
- [x] README.md updated

## Launch Day

### Pre-Launch (2 hours before)
- [ ] Final code review
- [ ] Final database backup taken
- [ ] Team notified: "Launching in 2 hours"
- [ ] Slack channel created: #warriors-arena-launch

### Go Live
- [ ] Super admin password changed from default
- [ ] Domain switched to production
- [ ] Verify https://warriorsarenabookings.online/en loads
- [ ] Verify https://warriorsarenabookings.online/ar loads
- [ ] Check Sentry: no errors
- [ ] Check UptimeRobot: status = green

### Launch Monitoring (Next 4 hours)
- [ ] Monitor Sentry actively
- [ ] Monitor UptimeRobot
- [ ] Monitor Meta Pixel event counts
- [ ] Super admin on standby

## Day 1 Post-Launch

### Verification
- [ ] Review all bookings created in first 24h
- [ ] Review admin dashboard
- [ ] Check Sentry: any P1 errors? Fix immediately.
- [ ] Check Meta Pixel event counts
- [ ] Check audit_log for normal patterns
- [ ] Verify cron job ran (booking_slots released)
- [ ] PDF receipt downloads still working

### Comms
- [ ] Post launch announcement (if applicable)
- [ ] Send thank-you email to early customers
- [ ] Monitor feedback channels

## Success Criteria

You have successfully launched when:
✅ Warriors Arena is live and accessible
✅ Customers can book end-to-end
✅ Staff can manage bookings via admin
✅ Revenue dashboard shows real bookings
✅ PDF receipts generate correctly
✅ No CRITICAL errors in Sentry
✅ UptimeRobot reports 99.9% uptime
✅ Meta Pixel tracking bookings
✅ Team confident in stability
