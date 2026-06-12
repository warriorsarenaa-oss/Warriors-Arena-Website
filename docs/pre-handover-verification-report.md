# Warriors Arena — Final Pre-Handover Verification Report

**Date:** 2026-06-12
**Type:** Read-only QA verification. No database writes, no Save/Submit actions in the admin panel, no emails or WhatsApp messages sent, no destructive actions taken.
**Scope:** 6 sections — Build & Code Integrity, Database Integrity, API Health, Public Website Functional Tests, Admin Panel Functional Tests, Performance Spot Check.

---

## Executive Summary

Sections 1 (Build & Code Integrity) and 2 (Database Integrity) are substantially complete and largely healthy, with a handful of findings documented below. **Sections 3, 4, and 6 are fully BLOCKED** because no live, reachable deployment of the application exists under any URL referenced anywhere in the codebase or docs — this is the single highest-priority issue in this report. **Section 5 (Admin Panel)** is additionally blocked because the Claude in Chrome browser extension was not connected during this session.

**Bottom line: this project is NOT READY for handover in its current state.** The deployment/domain gap must be resolved and Sections 3–6 must be re-run before sign-off. Sections 1–2 findings are mostly minor/hygiene, with two exceptions (concurrency test anomaly, RBAC permissions test failure) that touch Critical-risk code paths per `AGENTS.md` and should be re-verified.

---

## Section 1 — Build & Code Integrity (B1–B7)

| Test | Result | Notes |
|------|--------|-------|
| B1 — `tsc --noEmit` | **BLOCKED (environment)** | `EDEADLK` / "Resource deadlock avoided" reading certain `node_modules/typescript/lib/*.d.ts` files. Appears to be a sandbox/filesystem limitation, not a code defect — but type-check status is **unverified** for handover. |
| B2 — `npm run build` | **BLOCKED (environment)** | Same root cause as B1. Production build status is **unverified**. |
| B3–B7 | **PASS** | |
| B7 (secondary finding) | **FINDING** | `RESEND_API_KEY` and `RESEND_FROM_EMAIL` are absent from `.env.local`. `sendAdminBookingNotification()` in `src/utils/email.ts` checks for these, finds them missing, logs `console.warn("[EMAIL_WARN] Missing Resend environment variables. Email not sent.")`, and returns silently. **Admin booking confirmation emails are not being sent in the current environment**, with no visible error to staff. |

**Section 1 result: 5/7 PASS, 2/7 BLOCKED (environment limitation).**

---

## Section 2 — Database Integrity (D1–D8)

All 8 checks were run as read-only `SELECT` queries against Supabase via the PostgREST REST API.

| Test | Result | Notes |
|------|--------|-------|
| D1–D5, D7, D8 | **PASS** | |
| D6 | **PASS, with 2 findings** | See below |

**D6 finding (a) — Data-model inconsistency:** `final_amount_paid` is not cleared when a booking is cancelled. Currently harmless (the field is not read anywhere in cancelled-booking logic), but it is inconsistent with the append-only / immutable-historical-pricing conventions in `AGENTS.md` and could mislead future reporting or audits.

**D6 finding (b) — Test-data pollution:** Booking `WA-0306-9F7J` appears to be developer/test data left behind in the **production** `bookings` table.

**Section 2 result: 8/8 PASS, 2 informational findings under D6.**

---

## Section 3 — API Health Check (A1–A6) — BLOCKED (CRITICAL)

**Result: 0/6 executable. All BLOCKED.**

### What was tested
The configured `NEXT_PUBLIC_SITE_URL` (`.env.local`) is:

```
https://warriorsarenaa-oss-warriors-arena-website.vercel.app
```

Every path tested against this URL — `/`, `/en`, `/api/health`, `/api/v1/games`, `/api/v1/missions`, `/api/v1/cms/protocol`, `/api/v1/operating-hours/display`, `/api/v1/venue-settings` — returns **HTTP 404 `DEPLOYMENT_NOT_FOUND`** directly from the Vercel edge network. This is not an application-level 404; the deployment itself does not exist on Vercel.

### Search for an alternate URL
The following sources were checked for an alternate/correct production URL and contained none:
- `docs/mobile-dev-workflow.md` — only template/example URLs (e.g. `https://abc123xyz.ngrok-free.app`, `https://warriors-arena-git-feature-branch-yourusername.vercel.app`)
- `README.md` — generic `create-next-app` boilerplate
- `vercel.json` — only cron and function config, no domain info
- `package.json` — no `homepage` or `repository` field
- `.vercel/project.json` — does not exist
- `git remote -v` — no git repository configured in this checkout

### Candidate domains found in code/docs — live-tested
Three "future-state" domains appear scattered across SEO metadata, docs, and seed data:

| Domain | Found in | Live test result |
|--------|----------|-------------------|
| `warriorsarena.com` | `public/robots.txt`, `public/sitemap.xml`, `docs/launch-checklist.md`, `docs/ops-runbook.md`, `docs/api-keys-inventory.md`, seed `contact_email` | **Connection failure** — domain does not resolve / not registered or not pointed anywhere |
| `warriorsarena.gg` | OpenGraph `url` in `src/app/[locale]/layout.tsx` | **Connection failure** — same as above |
| `warriors-arena.com` | Audit-log fallback `actor_email` (`admin@warriors-arena.com`) in ~8 admin API routes | **Resolves, HTTP 200 — but it is an unrelated business.** It serves a frameset titled "WARRIORS ARENA" for a **gym** (`<meta name="description" content="Warriors arena GYM" />`), embedding `https://warriors-app-qw5sk.ondigitalocean.app/`. This is **not** this project. |

### Root cause
`AGENTS.md` → "Open Items (Project-Level)" explicitly lists **"Final domain name"** as unresolved at the project level. Combined with the dead configured Vercel URL, **there is currently no live, reachable deployment of the Warriors Arena application anywhere** — confirmed, not just unverified.

### Impact
This single issue is the root cause for the BLOCKED status of Sections 3, 4, and 6 below (Section 5 has an additional independent blocker). It also means **B1/B2's unverified build status (Section 1) cannot be cross-checked against a live deployment either** — there is currently no end-to-end evidence that the application builds and runs successfully outside local development.

---

## Section 4 — Public Website Functional Tests (W1–W16) — BLOCKED

**Result: 0/16 executable.**

Blocked for two independent reasons:
1. No live URL exists to test against (Section 3).
2. The Claude in Chrome browser extension was not connected during this session (`tabs_context_mcp` returned "Claude in Chrome is not connected" on two attempts).

None of W1–W16 could be attempted.

---

## Section 5 — Admin Panel Functional Tests (AD1–AD9) — BLOCKED

**Result: 0/9 executable.**

Same dual blocker as Section 4 (no live URL + no Chrome access this session), plus the candidate admin credentials (`warriors_admin` / `Warriors@26`) could not be tested or verified. The planned check of the admin sidebar nav against the expected 18-route page list (`/admin/audit`, `/admin/change-password`, `/admin/content`, `/admin/events`, `/admin/export`, `/admin/financials`, `/admin/financials/payroll`, `/admin/games`, `/admin/hours`, `/admin/login`, `/admin/missions`, `/admin/pricing`, `/admin/reservations`, `/admin/revenue`, `/admin/schedules/weekly-planner`, `/admin/staff/payroll`, `/admin/staff/schedule`, `/admin/users`) could not be performed.

---

## Section 6 — Performance Spot Check (P1–P3) — BLOCKED

**Result: 0/3 executable.**

Same dual blocker as Sections 4/5 — Chrome DevTools Network/Performance tabs require a connected browser session and a live URL, neither of which was available.

---

## Additional Findings (outside the formal 42-test checklist)

### From `test_output.txt` (a captured local `npm run test` / Vitest run — timestamp and exact environment conditions of this run were not independently re-verified live, since Section 3/4 are blocked)

1. **RBAC permissions test failure** — `tests/unit/permissions.test.ts`, test "flattens nested permission keys correctly for active admins": `getUserPermissions("admin-id")` returned `role: null`, expected `"super_admin"`. This touches `src/lib/auth/*`, a **Critical-risk** area per `AGENTS.md`'s working-mode table. **Should be re-run and root-caused before handover.**

2. **Concurrency anomaly** — `tests/e2e/public-api.test.ts`, test "POST /bookings handles heavy concurrency atomically": the test itself reported **PASS**, but its own logged output shows `Concurrency Test Results: { successCount: 0, conflictCount: 0, statuses: [500,500,500,500,500,500,500,500,500,500] }` — **all 10 concurrent booking requests returned HTTP 500**. A test that asserts "atomicity" while every request fails with a server error is not meaningfully validating the `fn_create_booking` path (also Critical-risk per `AGENTS.md`). **Should be re-run and investigated before handover** — if reproducible, this suggests the booking API may be broken under concurrent load, or the test's assertions are too weak to catch this.

3. **Playwright config error** — `tests/e2e/receipt.spec.ts` failed with `test.describe() not expected here`, 0 tests executed. Likely a Vitest/`@playwright/test` configuration or version-conflict issue rather than an application-logic bug. Note: this spec reads `NEXT_PUBLIC_SITE_URL` for its `baseURL`, so it is also affected by the Section 3 deployment gap.

### Other findings

4. **Next.js version discrepancy** — `package.json` declares `"next": "16.2.4"`, while `AGENTS.md`'s Tech Stack table states "Next.js 15 (App Router)". Documentation should be reconciled with the actual installed dependency (and any Next 15→16 behavioral changes reviewed, e.g. dynamic route `params` handling referenced in `AGENTS.md`'s "What NOT To Do").

5. **Placeholder/future domain references baked into shipped code and SEO assets** — `warriorsarena.com`, `warriorsarena.gg`, and the fallback email `admin@warriors-arena.com` appear in `public/robots.txt`, `public/sitemap.xml`, OpenGraph metadata (`src/app/[locale]/layout.tsx`), `docs/launch-checklist.md`, `docs/ops-runbook.md`, `docs/api-keys-inventory.md`, seed data (`contact_email`), and as the `actor_email` fallback in roughly 8 admin API routes' audit-log writes — all while `AGENTS.md`'s "Open Items" lists **"Final domain name"** as unresolved. Of particular concern: **`warriors-arena.com` is owned by an unrelated gym business**, and `admin@warriors-arena.com` is used as a real fallback value written into the `audit_log` table. If this placeholder is ever exercised as an actual email address, it would resolve to a domain Warriors Arena does not control. All of these references should be revisited once the final domain is chosen.

---

## Summary Totals

| Section | Tests | Pass | Fail | Blocked |
|---------|-------|------|------|---------|
| 1 — Build & Code Integrity (B1–B7) | 7 | 5 | 0 | 2 (environment) |
| 2 — Database Integrity (D1–D8) | 8 | 8 | 0 | 0 |
| 3 — API Health Check (A1–A6) | 6 | 0 | 0 | 6 |
| 4 — Public Website Functional (W1–W16) | 16 | 0 | 0 | 16 |
| 5 — Admin Panel Functional (AD1–AD9) | 9 | 0 | 0 | 9 |
| 6 — Performance Spot Check (P1–P3) | 3 | 0 | 0 | 3 |
| **Total** | **49** | **13** | **0** | **36** |

No outright test **failures** were recorded — but **36 of 49 tests (≈73%) could not be executed at all**, almost entirely due to a single root cause (no live deployment) plus a session-level blocker (Chrome not connected) for the browser-dependent sections.

---

## Critical Blockers (must resolve before handover)

1. **No live, reachable production deployment exists.** The configured Vercel URL returns `DEPLOYMENT_NOT_FOUND`; no working alternate URL exists anywhere in the codebase. This blocks Sections 3, 4, and 6 in full, and means the application's actual build/runtime health in a deployed environment is currently **unknown**. Resolve `AGENTS.md`'s open "Final domain name" item, get a deployment live, and re-run A1–A6, W1–W16, and P1–P3.
2. **B1/B2 (`tsc --noEmit`, `npm run build`) could not be verified** due to an `EDEADLK` error in this sandbox. Re-run both in a clean environment (or on the deployment platform's build logs) to confirm the project compiles and builds cleanly before sign-off.
3. **Concurrency test shows all-500 responses** for 10 simultaneous booking requests (`tests/e2e/public-api.test.ts`), in a Critical-risk code path (`fn_create_booking`). Re-run and investigate before handover.
4. **RBAC permissions test failure** (`getUserPermissions` returns `role: null` instead of `"super_admin"`) in a Critical-risk area (`src/lib/auth/*`). Re-run and root-cause before handover.
5. **Section 5 (Admin Panel) is entirely unverified** — no functional test of the 18-route admin panel, login, or any AD1–AD9 check has been performed.

## Priorities

**P0 — Blocking handover:**
- Resolve the deployment/domain gap and confirm a live, reachable URL (Section 3 root cause).
- Re-run B1 (`tsc --noEmit`) and B2 (`npm run build`) in a clean environment.
- Investigate the all-500 concurrency test result against `fn_create_booking`.
- Re-run Sections 3, 4, 5, and 6 in full once a live URL and Chrome access are available.

**P1 — Should fix before handover:**
- Root-cause and fix the RBAC permissions test failure (`getUserPermissions` returning `role: null`).
- Configure `RESEND_API_KEY` / `RESEND_FROM_EMAIL`, or explicitly document that admin booking-confirmation emails are out of scope for v1 (B7).
- Verify the admin credentials `warriors_admin` / `Warriors@26` are correct, or document the correct handover credentials.

**P2 — Cleanup / hygiene (can follow handover):**
- Remove the `WA-0306-9F7J` test booking from the production `bookings` table (D6b).
- Clear `final_amount_paid` on cancellation for data-model consistency (D6a).
- Reconcile the Next.js version stated in `AGENTS.md` (15) with the actual dependency (16.2.4).
- Resolve the Playwright config error in `tests/e2e/receipt.spec.ts`.
- Once the final domain is chosen, update all placeholder domain references (`warriorsarena.com`, `warriorsarena.gg`, `admin@warriors-arena.com` audit-log fallbacks, sitemap, robots.txt, OpenGraph metadata, `docs/launch-checklist.md`, `docs/ops-runbook.md`, `docs/api-keys-inventory.md`).

---

## Handover Recommendation

**NOT READY FOR HANDOVER.**

Sections 1 and 2 (16/49 tests, 33%) show a healthy codebase and database with only minor/hygiene findings. However, **73% of the planned verification (Sections 3–6, 36/49 tests) could not be executed**, almost entirely because of one critical, project-level open item: there is no live, reachable deployment of this application anywhere. This is not a testing-tool problem — it was independently confirmed via direct HTTP checks against the configured URL and every candidate domain found in the codebase.

Recommended path to handover:
1. Resolve the final domain / deployment (P0).
2. Re-run B1/B2 in a clean environment to confirm the build is clean (P0).
3. Investigate the concurrency and RBAC test anomalies (P0/P1).
4. Re-run this audit's Sections 3–6 in full against the live deployment with browser access available.
5. Address P2 hygiene items at the team's discretion — none of these block handover on their own.

Until step 4 is complete, the public website, admin panel, and performance characteristics of this application remain **unverified**.
