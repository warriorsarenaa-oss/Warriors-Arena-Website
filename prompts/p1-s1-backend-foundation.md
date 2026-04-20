# Sprint 1 — Backend Foundation

> Prerequisites: Phase 0 complete. Antigravity has read AGENTS.md, all `.agent/rules/`, and `docs/architecture-v1.1.md` sections 1, 2, 3, 4, 5, 7, 10.

## Prompt To Give Antigravity

```
Sprint 1: Backend Foundation.

Build the plumbing that every other sprint depends on. No user-facing features yet.

SCOPE:
1. src/lib/env.ts — Zod-validated environment variables. Exports typed `env` object. Fails boot if required v1 vars missing. v1.1+ vars optional.

2. src/lib/db/supabase-anon.ts — Anon Supabase client for public reads. Client-safe.

3. src/lib/db/supabase-service.ts — Service-role Supabase client. Server-only. Throws if imported client-side. Per R-ARCH-09.

4. src/lib/time/cairo.ts — Cairo timezone helpers:
   - `formatCairoDate(date): string` → "yyyy-MM-dd"
   - `formatCairoTime(time: string): string` → 12-hour AM/PM from 24-hour input
   - `parseCairoDate(isoString): Date`
   - `minutesSinceMidnight(time: "HH:mm"): number`
   - `cairoNow(): Date`
   Use date-fns-tz. Never `.toISOString().split("T")[0]`.

5. src/lib/auth/session.ts — Read + validate Supabase session from cookies. Used by admin routes.

6. src/lib/auth/permissions.ts — Given a user id, fetch their role and permission keys. Do NOT cache in JWT. Per R-SEC-05.

7. src/lib/auth/permission-middleware.ts — HOF wrapping API route handlers:
   - requirePermission(handler, permission_key)
   - Returns 401 if no session, 403 if missing permission.
   - Populates req with user + permissions.

8. src/lib/log.ts — Minimal logger:
   - info, warn, error methods
   - Strips PII (phone masked to last 4, email to domain only).
   - Uses Sentry for error-level in production.

9. src/lib/audit.ts — audit log writer:
   - `writeAudit({ actorUserId, actorEmail, action, entityType, entityId, before, after, req })`
   - Called inside the same transaction as the state change whenever possible.

10. src/lib/rate-limit.ts — Sliding window rate limit using rate_limit_buckets table:
    - `checkRateLimit(key: string, limit: number, windowSeconds: number): Promise<{ allowed, retryAfter }>`

11. src/app/api/health/route.ts — Health check that confirms:
    - Env vars parsed OK
    - Supabase service client can query `SELECT 1`
    - Returns JSON with ok: true, timestamp, supabase_latency_ms

12. src/middleware.ts — Next.js middleware:
    - i18n locale detection (en default, ar secondary)
    - Redirect admin/change-password if must_change_password = true
    - Must NOT run on /api/health (so health checks work if DB is down)

13. Unit tests for:
    - src/lib/time/cairo.test.ts — especially the "midnight Cairo is yesterday UTC" edge case
    - src/lib/auth/permissions.test.ts — role inheritance, missing permission, inactive user

WORKING MODE:
- Plan before coding. List the 13 files with a 1-line purpose each. Wait for my approval.
- src/lib/auth/* and src/lib/audit.ts are Critical — ask before edits.
- Use straight ASCII quotes, no smart quotes.
- Every file must have zero linter errors when npm run lint completes.

EXIT CRITERIA:
- npm run dev starts without errors.
- Visiting /en renders (blank is fine, no errors).
- curl /api/health returns {"ok": true, ...} with latency < 200ms.
- Unit tests pass (npm run test).
- Removing NEXT_PUBLIC_SUPABASE_URL and re-starting fails with clear error.

Begin with the plan.
```

---

## What To Review When Sprint 1 Completes

Before moving to Sprint 2, personally verify:

- [ ] `env.ts` rejects boot when a required var is missing
- [ ] The service-role key is NOT in any client-bundled file (check via `grep -r "SERVICE_ROLE" .next/static/` after build)
- [ ] `formatCairoTime("18:00")` returns "6:00 PM" (not "18:00" and not "06:00 PM")
- [ ] Permission middleware returns 403 (not 401) when user is logged in but lacks permission
- [ ] Audit log writer does NOT swallow errors silently — failures surface
- [ ] Rate limit works: 2 rapid calls to a limited endpoint, second returns 429
- [ ] Health check still works if database is slow (timeout gracefully)

If any fail, fix before Sprint 2. Sprint 2 builds on all of these.

---

*End of Sprint 1 Prompt*
