# Warriors Arena Operations Runbook

## Backup & Restore Procedures

### Daily Automated Backups
- Supabase performs automatic backups daily at 2:00 AM UTC
- Retention: 7 days
- Location: Supabase project → Settings → Backups

### Emergency Data Recovery
1. Identify the recovery point (date/time)
2. Log into Supabase project
3. Go to Settings → Backups
4. Click "Restore" on the desired backup
5. Confirm: "This will overwrite all current data"
6. Wait 10-30 minutes for restoration to complete
7. Verify data integrity: `SELECT COUNT(*) FROM bookings;`
8. Monitor Sentry for any errors in first 1 hour

### Creating Manual Backups Before Major Changes
1. Export bookings table: `SELECT * FROM bookings` → CSV
2. Save to secure location (e.g., Google Drive encrypted folder)
3. Proceed with changes

## Incident Response

### Booking Creation Failure
- Check: `/api/v1/bookings` endpoint responding?
- Check: Supabase project status (https://status.supabase.com)
- Check: Sentry for database connection errors
- Check: `rate_limits` table for bot attacks

### Revenue Numbers Not Matching
- Run: `SELECT SUM(total_price_at_booking) FROM bookings WHERE status='confirmed';`
- Compare to admin dashboard
- If mismatch: Check `audit_log` for mutation issues

### PDF Receipt Download Fails
- Check: Vercel function logs (receipt route, 1024MB memory)
- Check: Chromium availability on Vercel
- Check: Sentry for Puppeteer errors

## Monitoring & Alerts

- **UptimeRobot**: Ping `https://warriorsarena.com/en` every 5 min
- **Sentry**: All CRITICAL errors → email notification
- **Meta Pixel**: Monitor event counts daily
- **Admin**: Check `audit_log` weekly for unusual patterns
