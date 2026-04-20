# Warriors Arena — Agent Instructions

> This file is the project brain. Read it at the start of every session before any other file. It tells you what we are building, what conventions are non-negotiable, and where to find the source of truth for any decision.

---

## What We Are Building

A unified web application for **Warriors Arena**, a Laser Tag and Gel Blasters venue in Heliopolis, Cairo. Two interfaces share one codebase:

- **Public booking engine** — bilingual (Arabic + English with RTL), mobile-first, conversion-optimized reservation flow.
- **Admin operations platform** — English-only dashboard with role-based access for reservations, pricing, bundles, financials, commissions, analytics.

Customers book a slot online. They pay a 25% deposit via InstaPay (manual confirmation in v1; Paymob in v1.1). Staff manage operations through the admin panel.

---

## Source of Truth Hierarchy

When you face a decision, follow this order. Stop at the first source that answers the question.

1. **`docs/architecture-v1.1.md`** — The complete system specification. Every business rule, schema definition, API contract, and state machine lives here.
2. **`.agent/rules/*.md`** — Architectural and security constraints that apply to all code.
3. **The user's most recent message** — Always trumps prior context.
4. **Your training knowledge** — Last resort, and only when items 1-3 are silent.

If two sources conflict, ask the user. Do not guess.

---

## Critical Conventions (Non-Negotiable)

These cannot be violated under any circumstances. If a request would require violating them, stop and ask the user first.

### Time
- **Display:** 12-hour format with AM/PM ("6:00 PM"). Never display 24-hour times to end users.
- **Storage:** 24-hour ISO format in PostgreSQL `TIME` and `TIMESTAMPTZ` columns.
- **Timezone:** All business logic operates in `Africa/Cairo` (UTC+2, no DST since 2014).
- **Never use `.toISOString().split("T")[0]`** for date strings. Use `formatInTimeZone(date, "Africa/Cairo", "yyyy-MM-dd")` from `date-fns-tz`.
- **All time comparisons use minutes-since-midnight integer math.** Never compare time strings.

### Database-Driven Configuration
- **Every** game name, price, operating hour, bundle, and expense category lives in the database.
- **Never** hardcode prices, game names, hours, or business values in frontend or backend code.
- Adding a new game type must require zero code changes — only a database insert.

### Money & Financial Records
- All monetary values use `NUMERIC(10,2)` in PostgreSQL. Never `FLOAT` or `REAL`.
- Currency is always EGP (Egyptian Pound). Stored alongside amount as `currency_at_booking` column.
- **Pricing on historical bookings is immutable.** Booking row stores `total_price_at_booking` at creation. Admin price changes affect future bookings only.
- Financial entries are append-only. Soft-delete via reversing entry, never hard `DELETE`.

### Slot Mechanics
- Atomic slot unit is 30 minutes.
- Default operating hours: 6:00 PM – 9:00 PM Cairo (six 30-min slots).
- 60-minute booking consumes two consecutive slots.
- **Slot exclusivity is venue-wide, not per-game.** If 7:00 PM is booked for any game, no other game can be booked at 7:00 PM.
- Database guarantee: unique partial index on `booking_slots(slot_date, slot_time) WHERE released = false`.

### Concurrency
- All slot reservations go through the `fn_create_booking` PostgreSQL function (SECURITY DEFINER).
- The function uses an explicit transaction with `SELECT ... FOR UPDATE` on target slots before INSERT.
- **Never** check-then-insert in application code. Always atomic via the RPC.

### Authorization
- Every admin endpoint validates the session + checks the required permission server-side.
- **Hiding UI buttons is not security.** It is a UX nicety only.
- The anon Supabase key is for public reads. The service-role key is server-only and never sent to the browser.

### Audit Log
- Every state-changing admin action writes to `audit_log` with: actor, action, entity, before-state, after-state, IP, user-agent.
- Cancellations require a reason from the enum (`customer_request`, `no_deposit_received`, `customer_no_show`, `venue_issue`, `staff_error`, `other`).

### v1 vs v1.1+ Behavior
- v1 booking lifecycle has only **3 statuses**: `confirmed`, `completed`, `cancelled`.
- v1.1+ statuses (`pending_deposit`, `cancelled_refunded`, etc.) are present in the schema CHECK constraint but not used by v1 logic.
- Do not write v1.1 logic in v1. Foundation columns are nullable for a reason.

### Code Style
- Use straight ASCII quotes only (`'` and `"`), never smart quotes.
- TypeScript strict mode. No `any` without an inline comment justifying it.
- Validate every API input with Zod at the route boundary.
- Never log secrets, passwords, or full PII (phone/email).
- Buttons that trigger JavaScript must have explicit `type="button"`.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) + TypeScript |
| Styling | Tailwind CSS |
| Animations (runtime) | Framer Motion |
| i18n | next-intl |
| Database | Supabase (PostgreSQL 15+) |
| Auth | Supabase Auth |
| PDF | Puppeteer in serverless function |
| Payments (v1.1+) | Paymob |
| Messaging (v1.1+) | WhatsApp Business API |
| Analytics | Meta Pixel + Conversions API + Vercel Analytics |
| Hosting | Vercel + Supabase managed DB |
| Monitoring | Sentry, UptimeRobot |

---

## Project Structure

```
warriors-arena/
├── AGENTS.md              # This file
├── CLAUDE.md              # Mirror of AGENTS.md for Claude Code compatibility
├── .agent/
│   ├── rules/             # Architectural and security rules (load these contextually)
│   ├── skills/            # Reusable task patterns
│   └── agents/            # Subagent task templates (reviewer, security scanner)
├── docs/
│   └── architecture-v1.1.md   # Authoritative spec
├── supabase/
│   ├── migrations/        # Versioned SQL schema migrations
│   └── seed/              # Initial data
├── src/
│   ├── app/
│   │   ├── (public)/      # Landing, booking, FAQ, terms
│   │   ├── admin/         # Admin dashboard
│   │   └── api/v1/        # API routes
│   ├── components/
│   │   ├── public/
│   │   ├── admin/
│   │   └── animations/    # Per-component animation library
│   ├── lib/
│   │   ├── db/            # Supabase clients (anon + service-role)
│   │   ├── auth/          # Permission middleware
│   │   ├── booking/       # Booking domain logic
│   │   ├── time/          # Cairo TZ helpers, 12-hour formatters
│   │   └── i18n/          # next-intl setup
│   └── messages/
│       ├── en.json
│       └── ar.json
├── content/
│   ├── en/                # English copy (FAQ, landing, terms)
│   └── ar/                # Arabic copy
├── public/
│   └── uploads/           # Local media (v1; migrates to R2 in Phase 2)
└── tests/
    ├── e2e/               # Playwright
    └── unit/
```

---

## Working Mode by Code Area

Different parts of the codebase have different risk profiles. Adjust your verification depth accordingly.

| Area | Risk | Mode |
|------|------|------|
| `fn_create_booking` PostgreSQL function | Critical | Plan first, verify line-by-line, ask before edits |
| `src/lib/booking/*` | Critical | Plan first, write tests, ask before edits |
| `src/lib/auth/*` (RBAC middleware) | Critical | Plan first, ask before edits |
| Financial calculations (revenue, commission, profit) | Critical | Plan first, write tests, ask before edits |
| `audit_log` writes | High | Verify the write happens for every state-changing action |
| Admin forms (non-financial) | Medium | Standard flow, screenshot verify UI |
| Public UI components | Medium | Screenshot verify against reference images when provided |
| Animations | Low | Iterate freely; verify against user reference images |
| Style/polish | Low | Iterate freely |

---

## Workflow Expectations

### Before Writing Code
1. Read the relevant section of `docs/architecture-v1.1.md`.
2. Read the relevant rules in `.agent/rules/`.
3. State your plan in 3-5 bullets. Wait for user approval if the plan touches a Critical area.

### While Writing Code
1. Write complete files, not snippets. No `// TODO` placeholders unless explicitly approved.
2. Verify imports exist before declaring the file complete.
3. Use straight ASCII quotes only.
4. After SQL changes, verify column names with `SELECT column_name FROM information_schema.columns WHERE table_name = '...'`.

### After Writing Code
1. Run lint and typecheck. Fix all errors before declaring done.
2. For UI: take a screenshot, compare to reference if provided.
3. For API: write or run the relevant test.
4. Update `AGENTS.md` if a new convention emerged.

### When Things Go Wrong
1. State what you observed.
2. State what you expected.
3. State your hypothesis.
4. State your next step.
5. Wait for user input if the next step is destructive (DROP, DELETE, force-push).

---

## What NOT To Do

The previous build of this system failed for these reasons. Do not repeat them.

- Do not silently fall back to localhost or default values when env vars are missing. Validate at boot, fail loudly.
- Do not paste real API keys or credentials into prompts, comments, or commit messages.
- Do not use `.eq("column", null)` in Supabase queries. Use `.is("column", null)`.
- Do not compare time strings. Use minute integers.
- Do not forget to strip seconds (`.substring(0, 5)`) from PostgreSQL `TIME` values before display.
- Do not derive availability from local component state. Always re-fetch after mutation.
- Do not hardcode prices, game names, or hours in the frontend.
- Do not use `@react-pdf/renderer` directly in Next.js API routes. Use Puppeteer in an isolated function.
- Do not skip `await context.params` in Next.js 15 dynamic route handlers.
- Do not omit `type="button"` on buttons inside forms.

---

## Open Items (Project-Level)

These are unresolved at the project level. If your task touches one, ask the user.

- Final domain name
- Final WhatsApp business number
- Final InstaPay identifier
- Logo SVG file
- Brand color palette (will be provided as screenshot at start of UI build)
- Customer support contact (same as WhatsApp deposit number, or separate?)
- Super-admin recovery email

---

*End of AGENTS.md — Always start here.*
