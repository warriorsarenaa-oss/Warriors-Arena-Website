# Architecture Rules

> Constraints that apply to all code. These are not suggestions.

## R-ARCH-01: Database-Driven Configuration

All business-configurable values live in the database, never in code.

**This includes but is not limited to:**
- Game names, descriptions, icons, display order, active state
- Prices (per game, per duration)
- Operating hours (default, day-of-week, exact-date)
- Bundles (all fields)
- Expense categories
- Deposit percentage, hold window, contact info, InstaPay identifier
- Park entrance fee amounts

**Frontend code that contains a literal price, game name, or operating hour is a violation.**

If the data isn't in the database yet, add a migration to put it there before referencing it.

---

## R-ARCH-02: Bilingual From The Start

Every user-facing string on the public site must exist in `messages/en.json` and `messages/ar.json`.

- Arabic uses RTL layout. Use Tailwind logical properties (`ms-`, `me-`, `ps-`, `pe-`) instead of directional ones (`ml-`, `mr-`, `pl-`, `pr-`).
- Numbers stay Western Arabic (1, 2, 3) in both languages — Arabic-Indic (١٢٣) is correct linguistically but causes confusion with phone numbers and prices in this region. Confirm with user before changing.
- Currency display: `150 EGP` in English, `150 ج.م` in Arabic.

The admin dashboard is English-only. Do not translate admin UI strings.

---

## R-ARCH-03: Time Display in 12-Hour AM/PM

All times shown to humans use 12-hour format with AM/PM.

- Internal storage: `TIME` columns in 24-hour ISO. Always.
- API responses: include both `time` (12-hour display string) and `time_24h` (24-hour internal) fields.
- Frontend: render `time` in user-visible text, use `time_24h` in form values and state.

Helper to use: `formatInTimeZone(date, "Africa/Cairo", "h:mm a")` from `date-fns-tz`.

---

## R-ARCH-04: Cairo Timezone Everywhere

All business logic operates in `Africa/Cairo`.

- PostgreSQL session timezone: set to `Africa/Cairo` for all queries.
- Date construction in JS: use `formatInTimeZone(date, "Africa/Cairo", "yyyy-MM-dd")`. Never `.toISOString().split("T")[0]`.
- Time math: convert to "minutes since midnight" integers. Never compare time strings.
- All scheduled jobs (Vercel Cron) declare `Africa/Cairo` in their schedule comment, even though Vercel Cron is UTC-based — translate the desired Cairo time to UTC for the actual cron expression and document the conversion.

---

## R-ARCH-05: Slot Exclusivity Is Venue-Wide

A time slot is exclusive across all games, not per-game.

- `booking_slots` table has no `game_id` column. The slot row records date + time only.
- Unique partial index: `UNIQUE(slot_date, slot_time) WHERE released = false`.
- The booking row knows which game; the slot row just records that the venue is busy.

If you find yourself adding `game_id` to slot uniqueness checks, stop. Read `docs/architecture-v1.1.md` Section 3.2 again.

---

## R-ARCH-06: Atomic Booking Creation

All booking creation goes through `fn_create_booking` PostgreSQL function.

- Application code never inserts into `bookings` or `booking_slots` directly.
- The function uses `SELECT ... FOR UPDATE` on the target slots inside a transaction.
- The unique partial index on `booking_slots` is the database-level guarantee.
- No check-then-insert patterns. No "is this slot available?" query followed by an insert.

---

## R-ARCH-07: Pricing Immutability On History

Once a booking exists, its price never changes.

- The `bookings` table stores `price_per_player_at_booking`, `total_price_at_booking`, and `currency_at_booking` as snapshots.
- Admin price edits update `game_pricing` rows; they do not propagate to existing bookings.
- Reports that show "what did this customer pay" use the snapshot fields, not the current price.

---

## R-ARCH-08: v1 Booking Lifecycle Is Three Statuses

v1 uses only: `confirmed`, `completed`, `cancelled`.

- The CHECK constraint on `bookings.status` includes future v1.1 values for forward compatibility — do not narrow it.
- v1 transitions:
  - `confirmed` → `completed` (cron, after slot time + 30 min grace)
  - `confirmed` → `cancelled` (admin action with reason)
- v1.1+ statuses (`pending_deposit`, `cancelled_refunded`, `cancelled_forfeited`, `cancelled_by_admin`, `auto_cancelled`, `no_show`, `rescheduled`) exist in the schema but no v1 code path produces them.

If you find yourself implementing deposit holds, refund logic, or auto-cancellation in v1, stop. That work belongs to v1.1.

---

## R-ARCH-09: Two Supabase Clients

There are two distinct Supabase clients, used in different contexts:

- `lib/db/supabase-anon.ts` — Anon key client. Used in:
  - Server components reading public configuration (games, pricing, bundles, hours)
  - API routes that serve public data
  - **Never** writes anything

- `lib/db/supabase-service.ts` — Service-role key client. Used in:
  - All API routes that mutate data
  - SECURITY DEFINER RPC invocations
  - Admin reads of sensitive tables (bookings, users, financials)
  - **Never** imported into client components

The service-role key must never appear in client-bundled code. If you import the service client outside an API route or server action, you have made a security mistake.

---

## R-ARCH-10: Permission Enforcement Is Server-Side

UI hiding is not security.

- Every `/api/v1/admin/*` endpoint goes through middleware that:
  1. Validates the session cookie
  2. Loads the user's role and permissions from DB (not from JWT cache)
  3. Checks the required permission for the route
  4. Returns 403 if missing
- Hiding admin UI buttons based on role is a UX nicety, not a security boundary.

---

## R-ARCH-11: Audit Log Every State Change

Every state-changing admin action writes to `audit_log` in the same transaction as the change.

Required fields per entry:
- `actor_user_id`, `actor_email` (snapshot — actor email may change later)
- `action` (e.g., `booking.cancel`, `pricing.update`, `bundle.create`)
- `entity_type`, `entity_id`
- `before_state` (JSONB)
- `after_state` (JSONB)
- `ip_address`, `user_agent`

If a state change happens without an audit row, that is a bug.

---

## R-ARCH-12: Bundle Pricing Modes

Bundles support two pricing modes, controlled by `pricing_mode` column.

- `per_player`: `total = price_value × player_count`
- `fixed_total`: `total = price_value` (player_count is informational)

The booking creation logic must check the mode and compute total correctly. Never assume per-player.

---

## R-ARCH-13: Animations Are Per-Component

Animations are not a global theme. They are built component-by-component.

- Every animated element is a self-contained component in `src/components/animations/`.
- Each component has a clear prop interface and a static fallback for `prefers-reduced-motion`.
- Default runtime is Framer Motion. Components should be swappable to other libraries without changing consumers.
- The user provides a reference image and a description for each animation. Do not invent animations unilaterally.

---

## R-ARCH-14: Money Type Is NUMERIC(10,2)

Never use `FLOAT`, `REAL`, or `DOUBLE PRECISION` for money. Always `NUMERIC(10,2)`.

JavaScript handling: parse as string from the API, format with `Intl.NumberFormat`. Avoid floating-point math on money values; if you must compute, use integer arithmetic on cents-equivalent (multiply by 100, do integer math, divide back).

---

## R-ARCH-15: Soft Delete Via Reversal, Not DELETE

Financial records (`expenses`, `worker_salary_payments`, `bookings` after creation) are append-only.

- To "delete" an expense: insert a reversing entry that nets to zero, with a note linking to the original.
- To "cancel" a booking: update its status to `cancelled` and set `cancelled_at`. Never `DELETE`.
- Bundles can be soft-deleted via `is_active = false`. Their historical bookings remain valid.

The only true `DELETE` allowed in normal operation is on `rate_limit_buckets` (cleanup) and `audit_log` (only for retention pruning, never per-record).

---

*End of architecture.md*
