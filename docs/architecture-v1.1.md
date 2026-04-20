# Warriors Arena — System Architecture Document

**Version:** 1.1 (Approved with Changes)
**Status:** Approved — Phase 0 Setup Authorized
**Timezone:** Africa/Cairo (UTC+2, no DST since 2014)
**Last Updated:** April 2026
**Supersedes:** v1.0

---

## Changelog from v1.0

| # | Change | Source |
|---|--------|--------|
| C1 | Animation strategy: per-component prompts + reference images, Framer Motion as runtime | Client Round 4 |
| C2 | All time displays in 12-hour AM/PM format (storage stays 24-hour ISO) | Client Round 4 |
| C3 | Slot exclusivity changed: a time slot is venue-wide exclusive (not per-game) | Client Round 4 |
| C4 | v1 booking lifecycle simplified: 3 statuses only (confirmed/completed/cancelled). Foundation kept for v1.1 expansion | Client Round 4 |
| C5 | Bundles support both per-player AND fixed-total pricing modes | Client Round 4 |
| C6 | Pre-seeded expense categories with custom-add capability | Client Round 4 |
| C7 | Hero will be animation, not video | Client Round 4 |
| C8 | Local public folder for media in v1; Blob/R2 deferred | Client Round 4 |
| C9 | Phase 0 incorporates CLAUDE.md, .claude/rules/, security.md (selectively from Vibe Coding doc) | Client recommendations |
| C10 | First-login password change enforcement added for super-admin seed | Consultant addition |

---

## Table of Contents

1. [Executive Summary & Decisions Locked](#1-executive-summary--decisions-locked)
2. [Business Rules Specification](#2-business-rules-specification)
3. [Database Schema](#3-database-schema)
4. [State Machines](#4-state-machines)
5. [API Contract](#5-api-contract)
6. [RBAC Permission Matrix](#6-rbac-permission-matrix)
7. [Screen-by-Screen Specification](#7-screen-by-screen-specification)
8. [Security Architecture](#8-security-architecture)
9. [Infrastructure & Hosting Plan](#9-infrastructure--hosting-plan)
10. [Phased Build Roadmap](#10-phased-build-roadmap)
11. [Phase 0 Detailed Setup Plan](#11-phase-0-detailed-setup-plan)
12. [Pre-Flight Checklist Status](#12-pre-flight-checklist-status)
13. [Remaining Open Decisions](#13-remaining-open-decisions)

---

## 1. Executive Summary & Decisions Locked

### 1.1 What We Are Building

A unified web application for **Warriors Arena** (Heliopolis, Cairo) comprising:

- **Public booking engine** — Mobile-first, bilingual (AR/EN), conversion-optimized reservation flow for Laser Tag and Gel Blasters sessions.
- **Admin operations platform** — English-only dashboard with role-based access for reservations, pricing, bundles, financials, commissions, and analytics.

### 1.2 Decisions Locked

| # | Decision | Value |
|---|----------|-------|
| D1 | Deposit flow (v1) | Manual confirmation; admin cancels if no deposit received |
| D2 | Deposit flow (v1.1+) | Paymob integration, payment-agnostic architecture from day 1 |
| D3 | Admin model | Full team with shift-based access, RBAC from day 1 |
| D4 | Launch strategy | Phased, quality-first, no fixed deadline |
| D5 | Slot capacity | One session per time slot, **venue-wide exclusive** (not per-game) |
| D6 | Max players | 6 players per session (hard cap) |
| D7 | v1 cancellation policy | Admin-controlled; refund/forfeit logic deferred to v1.1 |
| D8 | Date closure | Handled via empty operating hours override |
| D9 | Languages | Bilingual public (AR+EN with RTL), English-only admin |
| D10 | Brand identity | Client to provide palette screenshot at start of UI build |
| D11 | Analytics | Meta Pixel + server-side CAPI + WhatsApp click tracking, all in v1 |
| D12 | Hero element | Custom animation (no video); built component-by-component with reference images |
| D13 | Time display format | 12-hour AM/PM (e.g., "6:00 PM"); storage stays 24-hour ISO |
| D14 | Bundle pricing modes | Per-player OR fixed-total; admin chooses per bundle |
| D15 | Expense categories | Pre-seeded common types + admin custom-add |
| D16 | Media hosting | Local Next.js public folder for v1; Blob/R2 in Phase 2+ |

### 1.3 Core Architectural Principles

1. **Database-driven configuration.** Every price, game, operating hour, bundle, and expense category is a DB row. Zero hardcoded values in frontend.
2. **Payment-agnostic booking engine.** v1 schema includes deposit fields (nullable, unused) so v1.1 Paymob integration is additive, not a migration.
3. **Atomic concurrency.** Slot reservations use PostgreSQL `FOR UPDATE SKIP LOCKED` inside transactions plus a unique partial index as the database-level guarantee.
4. **Audit everything.** Every state-changing admin action is logged with actor, timestamp, before/after values.
5. **Cairo time as the source of truth.** All business logic operates on Cairo local time. UTC is storage-only. UI displays in 12-hour AM/PM.
6. **Server-side enforcement.** Every permission check, price calculation, and slot availability check runs on the server.
7. **Revenue clarity.** v1 uses simple confirmed/cancelled tracking. v1.1 will add gross/realized/refunded/forfeited distinctions without schema changes.
8. **Foundation over feature parity.** v1 ships the simplest correct logic. v1.1 layers complexity on stable foundations.

### 1.4 Technology Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Frontend framework | Next.js 15 (App Router) + TypeScript | Team familiarity from prior build; SSR for SEO + Meta Pixel server events |
| Styling | Tailwind CSS | Mobile-first utility approach, small bundle |
| Animations (runtime) | Framer Motion | Tree-shakable, ~30KB, GPU-accelerated. Per-component prompts + reference images drive specific animation designs (D12). |
| 3D (Phase 4 only) | React Three Fiber, lazy-loaded | Reserved for select moments; not v1 |
| i18n | next-intl | Best-in-class for App Router; RTL-compatible |
| Backend | Next.js API Routes (monolith) | Correct scale; no microservices |
| Database | Supabase (managed PostgreSQL 15+) | Dual client pattern (anon/service-role), partial RLS, managed backups |
| Auth (admin) | Supabase Auth + custom JWT role claims | Battle-tested, saves weeks |
| PDF generation | Puppeteer in isolated serverless function | HTML→PDF; avoids React-in-API-route conflicts from prior build |
| Payments | Paymob (v1.1+) | Egypt-native; InstaPay, Fawry, card support |
| Messaging | WhatsApp Business API (v1.1+, 360dialog or Twilio) | Manual WhatsApp in v1 via pre-filled deep links |
| Analytics | Meta Pixel + Conversions API (server) + Vercel Analytics | CAPI recovers attribution lost client-side |
| Media (v1) | Next.js `public/` folder, served by Vercel CDN | Zero subscription overhead for launch (D16) |
| Media (Phase 2+) | Cloudflare R2 or Vercel Blob | Migration path documented |
| Hosting | Vercel (frontend/API) + Supabase (DB) | ~$0–25/mo at launch |
| Monitoring | Sentry free tier + Supabase logs + UptimeRobot | Zero-cost baseline |
| CI/CD | Vercel Git integration + Supabase migrations via CLI | Preview deploys per PR |

---

## 2. Business Rules Specification

This is the source of truth for every rule. If code contradicts this document, the code is wrong.

### 2.1 Slot Mechanics

- **BR-SLOT-01:** The atomic slot unit is 30 minutes.
- **BR-SLOT-02:** Default operating hours: **6:00 PM – 9:00 PM** Cairo time (six 30-min slots: 6:00 PM, 6:30 PM, 7:00 PM, 7:30 PM, 8:00 PM, 8:30 PM). [Stored internally as 18:00–21:00; displayed as 6:00 PM–9:00 PM per D13.]
- **BR-SLOT-03:** A 30-minute booking consumes exactly one slot.
- **BR-SLOT-04:** A 60-minute booking consumes two consecutive slots.
- **BR-SLOT-05:** The last valid start time for a 60-minute booking is the slot where the second half ends exactly at closing time (e.g., with 9:00 PM closing, last 60-min start = 8:00 PM).
- **BR-SLOT-06:** **Each time slot is venue-wide exclusive (D5).** If 7:00 PM is booked for any game, no other booking — Laser Tag, Gel Blasters, bundle, or future game type — can occupy 7:00 PM. The slot represents shared venue capacity, not game-specific capacity.
- **BR-SLOT-07:** A cancelled booking frees its slot(s) immediately.
- **BR-SLOT-08:** Manual admin bookings follow identical slot rules — no overrides.

### 2.2 Pricing

- **BR-PRICE-01:** Game prices are per-player, per-duration.
- **BR-PRICE-02:** Launch prices (locked as defaults, admin-configurable post-launch):
  - Laser Tag 30 min: 150 EGP/player
  - Laser Tag 60 min: 300 EGP/player
  - Gel Blasters 30 min: 100 EGP/player
- **BR-PRICE-03:** Standard booking total = `players × per_player_price`.
- **BR-PRICE-04:** **Pricing is immutable on historical bookings.** Every booking stores `total_price_at_booking` and `currency_at_booking` at creation. Admin price changes affect future bookings only.
- **BR-PRICE-05:** Park entrance fee (30 EGP weekday / 50 EGP holiday per person) is informational only. Not charged through the platform. Displayed as a pre-booking notice on confirmation screen and receipt.
- **BR-PRICE-06:** Deposit percentage (v1.1+): default 25%, configurable in `system_settings`. **In v1, deposit amount is calculated and shown to the customer for the WhatsApp deposit flow but no automatic state machine depends on it.**

### 2.3 Booking Lifecycle (v1 — Simplified)

Per D7, v1 uses a deliberately simple state machine. Foundations for v1.1 expansion are present in the schema but not exercised.

**v1 Status values:**

| Status | Meaning | Slot Released? | Counted as Revenue? |
|--------|---------|----------------|---------------------|
| `confirmed` | Booking created and active | No | Yes (in pipeline) |
| `completed` | Slot time has passed; booking honored | No | Yes (realized) |
| `cancelled` | Cancelled by anyone (admin manually); reason logged | Yes | No |

**v1 Allowed transitions:**

- `confirmed` → `completed` (cron, after slot time + 30 min grace)
- `confirmed` → `cancelled` (admin action; reason required)

That's the entire v1 state machine. Three statuses, two transitions.

**v1 Cancellation reasons (enum, captured for analytics):**

- `customer_request` — Customer asked to cancel
- `no_deposit_received` — Used when admin cancels because deposit didn't arrive
- `customer_no_show` — Customer didn't show up
- `venue_issue` — Equipment failure, weather, force majeure
- `staff_error` — Booking entered incorrectly by staff
- `other` — Free-text note required

This gives you analytical insight from day 1 without complicating the state machine.

**Note on cancelled_by:** Even in v1, the booking records `cancelled_by_user_id` so we always know which staff member cancelled. This is part of the audit trail and costs nothing.

### 2.4 Booking Lifecycle Foundation for v1.1+ (Pre-Built, Not Activated)

These columns exist in v1 schema as nullable, populated where data is available, but no v1 logic depends on them:

- `deposit_amount` (calculated and stored, displayed in WhatsApp message)
- `deposit_status` (defaults to `not_tracked` in v1)
- `hold_expires_at` (NULL in v1)
- `confirmed_at`, `cancelled_at`, `completed_at` timestamps (populated as transitions occur)

When v1.1 lands, we activate:
- `pending_deposit` status as a precursor to `confirmed`
- Auto-cancellation cron based on `hold_expires_at`
- Refunded vs. forfeited cancellation outcomes
- Customer-facing cancellation rules (6-hour window)
- Reschedule as a first-class operation

**Zero schema migration required for v1→v1.1.** We add new status values to the CHECK constraint and write new transition logic. Existing v1 bookings continue to work because they only use the `confirmed`/`completed`/`cancelled` subset.

### 2.5 Booking Code

- **BR-CODE-01:** Format: `WA-DDMM-XXXX` where XXXX is 4 random alphanumeric characters (uppercase letters + digits, excluding O/0 and I/1 to prevent confusion).
- **BR-CODE-02:** Uniqueness enforced at database level (unique index). Collision handler retries up to 5 times before erroring.
- **BR-CODE-03:** Code is human-readable and phone-dictatable.

### 2.6 Revenue Recognition (v1 — Simple)

Per D7 simplification:

- **BR-REV-V1-01:** **Confirmed Revenue** = sum of `total_price_at_booking` for all `confirmed` bookings in period (future + today).
- **BR-REV-V1-02:** **Realized Revenue** = sum of `total_price_at_booking` for all `completed` bookings in period.
- **BR-REV-V1-03:** **Cancelled bookings count zero revenue in v1.** The deposit-forfeiture nuance is deferred to v1.1.
- **BR-REV-V1-04:** Daily column chart attributes a 60-min booking's revenue to its **starting slot only** (cleaner than splitting).

**v1.1 will introduce:**
- Gross Bookings vs. Realized Revenue distinction
- Forfeited deposit revenue from late cancellations / no-shows
- Refunded amount tracking

### 2.7 Players

- **BR-PLAYER-01:** Public booking minimum 1, maximum 6 (D6). UI is a stepper.
- **BR-PLAYER-02:** Admin manual booking can override for special events (UI warns above 6 but allows).

### 2.8 Bundles

Updated per D14:

- **BR-BUNDLE-01:** A bundle is a fixed combination of (game, duration, player_count, pricing_mode, price_value, optional title, visibility).
- **BR-BUNDLE-02:** Bundles support **two pricing modes**:
  - `per_player` — `price_value` is the per-player rate; total = `price_value × player_count` at booking time
  - `fixed_total` — `price_value` is the absolute booking total, regardless of players
- **BR-BUNDLE-03:** Admin chooses pricing mode per bundle at creation.
- **BR-BUNDLE-04:** Bundles consume slots identically to standard bookings (BR-SLOT-06 applies).
- **BR-BUNDLE-05:** Bundles have a `visibility` toggle and an `is_active` flag — hidden bundles are not shown to public but remain valid for existing bookings.
- **BR-BUNDLE-06:** Bundles can be tagged with a `display_placement` (e.g., `landing_featured`, `landing_secondary`, `booking_flow_sidebar`, `hidden`).
- **BR-BUNDLE-07:** Bundle pricing is immutable on historical bookings (same rule as BR-PRICE-04).

### 2.9 Operating Hours (Slot Configuration)

- **BR-HOURS-01:** Three levels of configuration, in priority order (highest wins):
  1. **Exact Date Override** — specific calendar date
  2. **Day-of-Week Override** — all Fridays, all Sundays, etc.
  3. **Default** — baseline hours
- **BR-HOURS-02:** A configuration specifies: `open_time`, `close_time`, `is_closed` (can be true to indicate closure that day).
- **BR-HOURS-03:** To close a specific date (holiday, maintenance), admin creates an Exact Date Override with `is_closed = true`. No separate blocking entity needed (D8).
- **BR-HOURS-04:** Changing operating hours does NOT affect existing bookings in those hours. Bookings outside new hours remain valid until cancelled.
- **BR-HOURS-05:** All hours displayed in 12-hour AM/PM format per D13.

### 2.10 Worker Commissions (D3)

- **BR-COMM-01:** Commissions earned only on manual bookings (created via admin dashboard by staff).
- **BR-COMM-02:** Online customer bookings generate zero commission.
- **BR-COMM-03:** Each worker account has a `commission_percentage` field (default 0, super-admin configurable).
- **BR-COMM-04:** Commission amount = `total_price_at_booking × commission_percentage / 100`, calculated and stored at booking creation.
- **BR-COMM-05:** A booking is attributed to the worker actively creating it via the admin UI.
- **BR-COMM-06 (v1):** Commission on cancelled bookings is reversed to zero. (v1.1 will introduce pro-rated commission on forfeited deposits.)
- **BR-COMM-07:** Monthly worker payout = `fixed_salary` + `sum(commission_amount)` for `completed` bookings in that month.

### 2.11 Financial Management (D6 — Updated)

- **BR-FIN-01:** Three primary tables: `expenses`, `worker_salary_payments`, plus auto-derived revenue from `bookings`.
- **BR-FIN-02:** **Expense categories are stored in a dedicated `expense_categories` table** (D15) with a `is_system` flag distinguishing pre-seeded vs. admin-added categories.
- **BR-FIN-03:** **Pre-seeded expense categories** (system defaults, cannot be deleted but can be deactivated):
  - Rent / Lease
  - Electricity
  - Water
  - Internet & Phone
  - Gel Balls / Ammunition
  - Laser Tag Equipment Maintenance
  - Cleaning Supplies
  - Staff Snacks / Refreshments
  - Marketing / Ads
  - Repairs & Maintenance
  - Insurance
  - Park Fees / Permits
  - Equipment Purchase
  - Software Subscriptions
  - Other (free-text note required when used)
- **BR-FIN-04:** Admin can add custom categories via a "+ Add Category" button. Custom categories are saved with `is_system = false` and `created_by_user_id` recorded.
- **BR-FIN-05:** Profit (v1 simple definition) = `Realized Revenue − (Total Expenses + Total Salary Payments)` for the period.
- **BR-FIN-06:** Financial entries are append-only. Soft-delete via reversing entry, never hard delete. Edit creates audit log row.

### 2.12 Timezone Rules (Critical)

- **BR-TZ-01:** All UI displays use Cairo local time, 12-hour AM/PM format (D13).
- **BR-TZ-02:** Database stores `TIMESTAMPTZ`. PostgreSQL session timezone set to `Africa/Cairo` for all queries.
- **BR-TZ-03:** Date-only fields (`booking_date`) use `DATE` type. Constructed from Cairo-local `YYYY-MM-DD` strings.
- **BR-TZ-04:** **Never use `.toISOString().split("T")[0]` in JavaScript.** Use `formatInTimeZone(date, "Africa/Cairo", "yyyy-MM-dd")` from `date-fns-tz`.
- **BR-TZ-05:** All time comparisons use "minutes since midnight" integer math, never string comparison.
- **BR-TZ-06:** All scheduled jobs (cron) specify `Africa/Cairo` timezone.
- **BR-TZ-07:** UI conversion: `formatInTimeZone(date, "Africa/Cairo", "h:mm a")` produces "6:00 PM" format.

### 2.13 Park Entrance Fee

- **BR-PARK-01:** Displayed as informational notice on booking confirmation screen and PDF receipt. Not charged through platform.
- **BR-PARK-02:** Display logic: "30 EGP per person park entrance fee on regular days (50 EGP on holidays). Paid at park entry, separate from your reservation."

---

## 3. Database Schema

Postgres dialect. All tables include `created_at`, `updated_at` (with trigger). Primary keys are UUIDs unless specified.

### 3.1 Configuration Tables

#### `games`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK, default gen_random_uuid() |
| slug | TEXT | UNIQUE NOT NULL |
| name_en | TEXT | NOT NULL |
| name_ar | TEXT | NOT NULL |
| description_en | TEXT | |
| description_ar | TEXT | |
| icon_url | TEXT | |
| hero_image_url | TEXT | |
| display_order | INT | NOT NULL DEFAULT 0 |
| is_active | BOOLEAN | NOT NULL DEFAULT true |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

#### `game_pricing`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| game_id | UUID | FK games(id) ON DELETE RESTRICT |
| duration_minutes | INT | NOT NULL CHECK IN (30, 60) |
| price_per_player | NUMERIC(10,2) | NOT NULL CHECK > 0 |
| currency | TEXT | NOT NULL DEFAULT 'EGP' |
| is_active | BOOLEAN | NOT NULL DEFAULT true |
| effective_from | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

`UNIQUE(game_id, duration_minutes) WHERE is_active = true`

#### `operating_hours`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| scope | TEXT | NOT NULL CHECK IN ('default', 'day_of_week', 'exact_date') |
| day_of_week | INT | NULL CHECK 0..6, only when scope='day_of_week' |
| exact_date | DATE | NULL, only when scope='exact_date' |
| open_time | TIME | NULL if is_closed |
| close_time | TIME | NULL if is_closed |
| is_closed | BOOLEAN | NOT NULL DEFAULT false |
| created_by_user_id | UUID | FK users(id) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Partial unique indexes:
- `UNIQUE(scope) WHERE scope='default'`
- `UNIQUE(day_of_week) WHERE scope='day_of_week'`
- `UNIQUE(exact_date) WHERE scope='exact_date'`

#### `bundles` (Updated for D14)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| slug | TEXT | UNIQUE NOT NULL |
| title_en | TEXT | NOT NULL |
| title_ar | TEXT | NOT NULL |
| description_en | TEXT | |
| description_ar | TEXT | |
| game_id | UUID | FK games(id) ON DELETE RESTRICT |
| duration_minutes | INT | NOT NULL CHECK IN (30, 60) |
| player_count | INT | NOT NULL CHECK BETWEEN 1 AND 6 |
| **pricing_mode** | TEXT | **NOT NULL CHECK IN ('per_player', 'fixed_total')** |
| **price_value** | NUMERIC(10,2) | **NOT NULL CHECK > 0** (interpreted per pricing_mode) |
| currency | TEXT | NOT NULL DEFAULT 'EGP' |
| display_placement | TEXT | CHECK IN ('landing_featured', 'landing_secondary', 'booking_flow_sidebar', 'hidden') |
| image_url | TEXT | |
| is_visible | BOOLEAN | NOT NULL DEFAULT true |
| is_active | BOOLEAN | NOT NULL DEFAULT true |
| display_order | INT | NOT NULL DEFAULT 0 |
| starts_at | TIMESTAMPTZ | NULL (optional promo window start) |
| ends_at | TIMESTAMPTZ | NULL (optional promo window end) |
| created_by_user_id | UUID | FK users(id) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

Computed total at booking time:
- If `pricing_mode = 'per_player'`: `total = price_value × player_count`
- If `pricing_mode = 'fixed_total'`: `total = price_value` (player_count informational)

#### `system_settings`

| Column | Type |
|--------|------|
| key | TEXT PK |
| value | JSONB NOT NULL |
| description | TEXT |
| updated_by_user_id | UUID FK users(id) |
| updated_at | TIMESTAMPTZ NOT NULL DEFAULT now() |

Seed entries: `deposit_percentage`, `deposit_hold_minutes` (v1.1), `cancellation_window_hours` (v1.1), `whatsapp_number`, `instapay_identifier`, `park_entry_fee_regular`, `park_entry_fee_holiday`, `contact_phone`, `contact_email`, `default_commission_percentage`.

### 3.2 Booking Tables (Updated for D5, D7)

#### `bookings`

Note: All deposit/cancellation foundation columns present but nullable for v1; activated in v1.1.

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| booking_code | TEXT | UNIQUE NOT NULL |
| game_id | UUID | FK games(id) ON DELETE RESTRICT |
| bundle_id | UUID | NULL FK bundles(id) ON DELETE RESTRICT |
| booking_date | DATE | NOT NULL (Cairo local) |
| start_time | TIME | NOT NULL (Cairo local, 24h storage) |
| end_time | TIME | NOT NULL (Cairo local, 24h storage) |
| duration_minutes | INT | NOT NULL CHECK IN (30, 60) |
| player_count | INT | NOT NULL CHECK BETWEEN 1 AND 6 (or higher for manual) |
| price_per_player_at_booking | NUMERIC(10,2) | NULL (null for fixed_total bundles) |
| total_price_at_booking | NUMERIC(10,2) | NOT NULL CHECK > 0 |
| deposit_amount | NUMERIC(10,2) | NULL (calculated for display, no v1 logic) |
| deposit_status | TEXT | NOT NULL DEFAULT 'not_tracked' CHECK IN ('not_tracked', 'pending', 'confirmed', 'refunded', 'forfeited') |
| currency_at_booking | TEXT | NOT NULL DEFAULT 'EGP' |
| **status** | TEXT | **NOT NULL CHECK IN ('confirmed', 'completed', 'cancelled', 'pending_deposit', 'cancelled_refunded', 'cancelled_forfeited', 'cancelled_by_admin', 'auto_cancelled', 'no_show', 'rescheduled')** |
| source | TEXT | NOT NULL CHECK IN ('online', 'manual') |
| customer_name | TEXT | NOT NULL |
| customer_phone | TEXT | NOT NULL |
| customer_email | TEXT | NULL |
| customer_notes | TEXT | NULL |
| created_by_user_id | UUID | NULL FK users(id) — only for manual bookings |
| commission_percentage | NUMERIC(5,2) | NULL — snapshot at creation |
| commission_amount | NUMERIC(10,2) | NULL — calculated at creation |
| hold_expires_at | TIMESTAMPTZ | NULL (v1.1+) |
| confirmed_at | TIMESTAMPTZ | NULL |
| cancelled_at | TIMESTAMPTZ | NULL |
| **cancellation_reason** | TEXT | **NULL CHECK IN ('customer_request', 'no_deposit_received', 'customer_no_show', 'venue_issue', 'staff_error', 'other')** |
| cancellation_note | TEXT | NULL (free-text; required when reason='other') |
| cancelled_by_user_id | UUID | NULL FK users(id) |
| completed_at | TIMESTAMPTZ | NULL |
| rescheduled_to_booking_id | UUID | NULL (v1.1+) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |
| updated_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

**v1 Status values used:** `confirmed`, `completed`, `cancelled`. Other values present in CHECK constraint for v1.1 readiness.

**Indexes:**
- `UNIQUE(booking_code)`
- `INDEX(booking_date, start_time)` — venue-wide availability lookups (no game_id needed per D5)
- `INDEX(status, booking_date)` — daily admin views
- `INDEX(created_by_user_id, booking_date)` — worker commission reports
- `INDEX(customer_phone)` — customer lookup

#### `booking_slots` (Updated for D5)

**Slot occupation is now venue-wide, not per-game.**

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| booking_id | UUID | FK bookings(id) ON DELETE CASCADE |
| slot_date | DATE | NOT NULL |
| slot_time | TIME | NOT NULL |
| released | BOOLEAN | NOT NULL DEFAULT false |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

**Note:** `game_id` is intentionally NOT on this table because D5 makes slot exclusivity venue-wide. The booking row knows which game; the slot just records "this 30-min window is taken."

**Critical unique index (D5):**
```sql
CREATE UNIQUE INDEX idx_active_slot_occupation
  ON booking_slots(slot_date, slot_time)
  WHERE released = false;
```

Database-level guarantee: at any moment, only ONE active booking can occupy a given (date, time) slot, regardless of game type.

When a booking is cancelled, we set `released = true` (preserving history) and the unique index allows a new booking in that slot.

### 3.3 RBAC Tables

#### `users`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK (mapped from Supabase Auth user id) |
| email | TEXT | UNIQUE NOT NULL |
| username | TEXT | UNIQUE NOT NULL (e.g., 'warriors_admin') |
| full_name | TEXT | NOT NULL |
| phone | TEXT | NULL |
| role_id | UUID | FK roles(id) NOT NULL |
| worker_code | TEXT | UNIQUE NULL — for staff identification |
| commission_percentage | NUMERIC(5,2) | NOT NULL DEFAULT 0 |
| fixed_monthly_salary | NUMERIC(10,2) | NOT NULL DEFAULT 0 |
| is_active | BOOLEAN | NOT NULL DEFAULT true |
| **must_change_password** | BOOLEAN | **NOT NULL DEFAULT true** (C10 — forces first-login change) |
| last_login_at | TIMESTAMPTZ | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

#### `roles`
| id | name | description |
|----|------|-------------|
| UUID | TEXT UNIQUE | TEXT |

Seeded: `super_admin`, `manager`, `staff`, `viewer`.

#### `permissions`
| id | key | description |
|----|-----|-------------|
| UUID | TEXT UNIQUE | TEXT |

#### `role_permissions`
Many-to-many. `(role_id, permission_id)` UNIQUE.

### 3.4 Financial Tables (Updated for D15)

#### `expense_categories` (NEW per D15)

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| name | TEXT | UNIQUE NOT NULL |
| display_order | INT | NOT NULL DEFAULT 0 |
| is_system | BOOLEAN | NOT NULL DEFAULT false |
| is_active | BOOLEAN | NOT NULL DEFAULT true |
| created_by_user_id | UUID | NULL FK users(id) (NULL for system seeds) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

System categories cannot be deleted. They can be deactivated to hide from picker.

#### `expenses`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| title | TEXT | NOT NULL |
| **category_id** | UUID | **NOT NULL FK expense_categories(id) ON DELETE RESTRICT** |
| amount | NUMERIC(10,2) | NOT NULL CHECK > 0 |
| currency | TEXT | NOT NULL DEFAULT 'EGP' |
| expense_date | DATE | NOT NULL |
| notes | TEXT | (Required when category is "Other") |
| created_by_user_id | UUID | FK users(id) NOT NULL |
| reversed_by_expense_id | UUID | NULL FK expenses(id) — soft-delete via reversal |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

#### `worker_salary_payments`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| user_id | UUID | FK users(id) NOT NULL |
| pay_period_month | INT | NOT NULL CHECK 1..12 |
| pay_period_year | INT | NOT NULL |
| fixed_salary_amount | NUMERIC(10,2) | NOT NULL |
| commission_amount | NUMERIC(10,2) | NOT NULL |
| total_paid | NUMERIC(10,2) | GENERATED ALWAYS AS (fixed_salary_amount + commission_amount) STORED |
| paid_at | TIMESTAMPTZ | NULL |
| notes | TEXT | |
| created_by_user_id | UUID | FK users(id) |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

`UNIQUE(user_id, pay_period_month, pay_period_year)`

### 3.5 Audit & Infrastructure

#### `audit_log`

| Column | Type | Constraints |
|--------|------|-------------|
| id | UUID | PK |
| actor_user_id | UUID | NULL FK users(id) |
| actor_email | TEXT | NOT NULL (durability snapshot) |
| action | TEXT | NOT NULL |
| entity_type | TEXT | NOT NULL |
| entity_id | UUID | NULL |
| before_state | JSONB | NULL |
| after_state | JSONB | NULL |
| ip_address | TEXT | NULL |
| user_agent | TEXT | NULL |
| created_at | TIMESTAMPTZ | NOT NULL DEFAULT now() |

`INDEX(entity_type, entity_id, created_at DESC)`

#### `rate_limit_buckets`

| Column | Type |
|--------|------|
| bucket_key | TEXT PK |
| tokens | INT |
| last_refill | TIMESTAMPTZ |

### 3.6 Row-Level Security (RLS) Strategy

| Table | RLS | Notes |
|-------|-----|-------|
| games, game_pricing, operating_hours | OFF | Public read-only config |
| bundles | OFF (with WHERE is_visible=true filter on anon queries) | Public read, admin write |
| system_settings | OFF reads (limited keys); service-role only writes | |
| bookings | ON | Anon cannot read directly; creation via SECURITY DEFINER RPC |
| booking_slots | OFF for aggregated availability via RPC | Public reads only via function |
| users | ON | Service role only |
| roles, permissions, role_permissions | OFF for reads | |
| expense_categories | OFF reads (admin UI), service-role writes | Public never reads |
| expenses, salary_payments, audit_log | ON | Service role only |

Public booking creation: SECURITY DEFINER RPC `fn_create_booking` validates and inserts atomically. Anon never writes to `bookings` directly.

---

## 4. State Machines

### 4.1 v1 Booking Lifecycle (Active)

```
                ┌──────────────────────┐
                │  Booking Created     │
                │  (status=confirmed)  │
                └──────────┬───────────┘
                           │
              ┌────────────┴────────────┐
              │                         │
   slot time passes +              admin cancels
   30min grace (cron)         (with reason captured)
              │                         │
              ▼                         ▼
        ┌──────────┐              ┌────────────┐
        │completed │              │ cancelled  │
        └──────────┘              │  + reason  │
                                  │  + by_user │
                                  └────────────┘
```

**Three statuses, two transitions. That's v1.**

### 4.2 v1.1+ Booking Lifecycle (Reserved, not active)

When v1.1 ships, the state machine expands without schema migration:

```
[Online creation] ──► pending_deposit ─┬─► confirmed ──► completed
                                       │       │
                                       │       ├─► cancelled_refunded (>6h)
                                       │       ├─► cancelled_forfeited (<6h)
                                       │       ├─► cancelled_by_admin
                                       │       ├─► no_show
                                       │       └─► rescheduled
                                       │
                                       └─► auto_cancelled (hold expired)

[Manual creation] ──► confirmed (skips pending)
```

The status CHECK constraint in `bookings` already includes all v1.1 values. No ALTER TABLE needed.

### 4.3 Deposit State (v1.1+, foundation present in v1)

| Status | v1 Behavior | v1.1 Behavior |
|--------|-------------|---------------|
| `not_tracked` | Default for all v1 bookings | Used when admin doesn't track deposits |
| `pending` | Not used | Awaiting Paymob/WhatsApp confirmation |
| `confirmed` | Not used | Deposit verified |
| `refunded` | Not used | Deposit returned to customer |
| `forfeited` | Not used | Deposit kept as revenue |

---

## 5. API Contract

All routes under `/api/v1/*`. JSON responses. Errors use problem+json structure.

### 5.1 Public Endpoints (anon key, rate-limited)

#### `GET /api/v1/games`
Returns active games with current pricing.

#### `GET /api/v1/bundles`
Returns visible bundles with computed display total.

Response includes `pricing_mode` so frontend can show "150 EGP/player × 4" or "1500 EGP for the group" appropriately.

#### `GET /api/v1/availability?date=YYYY-MM-DD`

**Note: no `game_id` parameter.** Per D5, slot availability is venue-wide.

Response:
```json
{
  "date": "2026-05-10",
  "is_open": true,
  "operating_hours": { "open": "6:00 PM", "close": "9:00 PM" },
  "slots": [
    { "time": "6:00 PM", "time_24h": "18:00", "available_30": true, "available_60": true },
    { "time": "6:30 PM", "time_24h": "18:30", "available_30": true, "available_60": true },
    { "time": "7:00 PM", "time_24h": "19:00", "available_30": false, "available_60": false, "reason": "booked" },
    { "time": "7:30 PM", "time_24h": "19:30", "available_30": false, "available_60": false, "reason": "booked" },
    { "time": "8:00 PM", "time_24h": "20:00", "available_30": true, "available_60": true },
    { "time": "8:30 PM", "time_24h": "20:30", "available_30": true, "available_60": false, "reason": "closing" }
  ]
}
```

API returns both 12-hour display format and 24-hour internal format. Frontend uses `time` for display, `time_24h` for state and submission.

#### `POST /api/v1/bookings`
Create booking. Atomic. v1 result: `status = confirmed` immediately.

Request:
```json
{
  "game_id": "uuid",
  "bundle_id": "uuid|null",
  "date": "YYYY-MM-DD",
  "start_time": "18:00",
  "duration_minutes": 30,
  "player_count": 4,
  "customer_name": "Ahmed Hassan",
  "customer_phone": "+201234567890",
  "customer_email": "optional",
  "customer_notes": "optional",
  "recaptcha_token": "..."
}
```

Server actions:
1. Validate input (Zod).
2. Call `fn_create_booking` RPC:
   - Open transaction
   - Compute end_time and slot list
   - `SELECT FROM booking_slots WHERE slot_date=? AND slot_time IN (?) AND released=false FOR UPDATE`
   - If any slot occupied → reject with 409 Conflict
   - Validate against operating hours
   - Compute price (game_pricing or bundle pricing_mode)
   - Generate unique booking code (retry on collision)
   - Insert booking row with `status='confirmed'`
   - Insert booking_slots rows
   - Compute and store deposit_amount for display
   - Return booking payload
3. Emit Meta Pixel `Purchase` event server-side via CAPI (since v1 has no pending state, the booking IS the purchase event).
4. Return booking code, WhatsApp deep link, PDF download URL.

Response:
```json
{
  "booking": {
    "id": "uuid",
    "booking_code": "WA-1005-K3P7",
    "status": "confirmed",
    "date": "May 10, 2026",
    "start_time": "6:00 PM",
    "end_time": "6:30 PM",
    "total_price": 600,
    "currency": "EGP",
    "deposit_amount": 150,
    "deposit_instructions": {
      "instapay_identifier": "warriors@instapay",
      "whatsapp_number": "+20XXXXXXXXX",
      "whatsapp_deep_link": "https://wa.me/20XXXXXXXXX?text=..."
    }
  },
  "pdf_url": "https://.../api/v1/bookings/WA-1005-K3P7/receipt"
}
```

#### `GET /api/v1/bookings/:code/receipt.pdf`
Streams generated PDF receipt. Code + last 4 phone digits as access guard (Phase 3 upgrade to magic link).

### 5.2 Admin Endpoints (authenticated, permission-checked)

| Endpoint | Permission | Purpose |
|----------|------------|---------|
| `GET /api/v1/admin/reservations?date=...` | `view_bookings` | Slot grid view |
| `POST /api/v1/admin/reservations` | `create_booking` | Manual booking (auto-confirmed) |
| `POST /api/v1/admin/reservations/:id/cancel` | `cancel_booking` | Cancel with reason (required) |
| `GET /api/v1/admin/reservations/:id/history` | `view_bookings` | Audit log for booking |
| `GET /api/v1/admin/revenue?period=today\|week\|month\|custom` | `view_revenue` | Dashboard metrics |
| `GET /api/v1/admin/financials?from=...&to=...` | `view_financials` | P&L view |
| `POST/PUT/DELETE /api/v1/admin/bundles[/:id]` | `manage_bundles` | CRUD bundles |
| `POST/PUT /api/v1/admin/games[/:id]` | `manage_games` | CRUD games |
| `PUT /api/v1/admin/pricing/:game_id/:duration` | `manage_pricing` | Update price |
| `POST/PUT/DELETE /api/v1/admin/operating-hours[/:id]` | `manage_hours` | Hours config |
| `GET /api/v1/admin/expense-categories` | `view_financials` | List categories |
| `POST /api/v1/admin/expense-categories` | `manage_financials` | Add custom category |
| `POST /api/v1/admin/expenses` | `manage_financials` | Add expense |
| `POST /api/v1/admin/salaries/compute?month=...&year=...` | `manage_financials` | Compute monthly pay |
| `POST /api/v1/admin/salaries` | `manage_financials` | Record payment |
| `GET/POST/PUT /api/v1/admin/users[/:id]` | `manage_users` | Staff management |
| `POST /api/v1/admin/auth/change-password` | (self only) | First-login forced change handler |
| `GET /api/v1/admin/export/reservations?from=...&to=...` | `export_data` | Streams .xlsx |
| `GET /api/v1/admin/audit-log?...` | `view_audit` | Audit history |

### 5.3 Cron Jobs (Vercel Cron)

| Job | Schedule | Purpose | v1? |
|-----|----------|---------|-----|
| `mark_completed_bookings` | every 10 min | Flip confirmed→completed after slot+grace | ✅ v1 |
| `daily_metrics_snapshot` | 01:00 Cairo | Cache daily metrics for fast dashboard | ✅ v1 |
| `auto_cancel_expired_holds` | every 1 min | Cancel pending_deposit past hold | v1.1 |
| `noshow_candidates_alert` | hourly | Alert admin of unhandled past slots | v1.1 |

---

## 6. RBAC Permission Matrix

### 6.1 Roles

| Role | Description |
|------|-------------|
| `super_admin` | Owner. All permissions. Only role that can create other admins, set commissions, access audit log. |
| `manager` | Venue manager. All operational permissions. Cannot create super_admin, cannot edit own commission. |
| `staff` | Shift worker. Can create and manage bookings, view own commission stats. Cannot see others' salaries or financials. |
| `viewer` | Read-only. For accountants, investors. Reports without edit rights. |

### 6.2 Permission Matrix

| Permission | super_admin | manager | staff | viewer |
|-----------|:-:|:-:|:-:|:-:|
| view_bookings | ✅ | ✅ | ✅ | ✅ |
| create_booking | ✅ | ✅ | ✅ | ❌ |
| cancel_booking | ✅ | ✅ | ⚠️ (own shift) | ❌ |
| view_revenue | ✅ | ✅ | ⚠️ (own commission) | ✅ |
| view_financials | ✅ | ✅ | ❌ | ✅ |
| manage_financials | ✅ | ⚠️ (expenses, not salaries) | ❌ | ❌ |
| manage_bundles | ✅ | ✅ | ❌ | ❌ |
| manage_games | ✅ | ❌ | ❌ | ❌ |
| manage_pricing | ✅ | ⚠️ | ❌ | ❌ |
| manage_hours | ✅ | ✅ | ❌ | ❌ |
| manage_users | ✅ | ⚠️ (cannot create managers+) | ❌ | ❌ |
| export_data | ✅ | ✅ | ❌ | ✅ |
| view_audit | ✅ | ⚠️ (last 30 days) | ❌ | ❌ |

Conditional permissions enforced via API middleware runtime checks.

---

## 7. Screen-by-Screen Specification

### 7.1 Public Site

#### P1. Landing Page (`/`)

**Sections (top to bottom):**

1. **Hero** — Custom animated hero (D12, built component-by-component with reference images you provide). Tagline + primary "Book Now" CTA. Language toggle (top-right floating).
2. **Games Grid** — Dynamic cards from `/api/v1/games`. Each card: image, name, starting price, duration options, "Book" CTA.
3. **Featured Bundles** — Dynamic from `/api/v1/bundles?placement=landing_featured`. Carousel on mobile, grid on desktop. Display reflects `pricing_mode` (per-player vs. fixed-total).
4. **How It Works** — 4 steps: Pick game → Choose time → Book online → Play.
5. **Venue Photo Gallery** — Lazy-loaded, AVIF primary, 6-8 images.
6. **Park Entry Notice** — Prominent info card per BR-PARK-02.
7. **FAQ Accordion** — 8 questions in AR + EN (Claude-drafted).
8. **Location & Contact** — Google Maps embed (lazy), WhatsApp button, operating hours displayed in 12-hour format.
9. **Footer** — Social links, Terms, Privacy.

**Mobile-first breakpoints:** 375px base, 768px tablet, 1024px desktop.

#### P2. Reservation Wizard (`/book`)

5 steps with progress indicator, persisted to `sessionStorage`.

- **Step 1 — Choose Game:** Card grid.
- **Step 2 — Configure:** Duration radio, player stepper (1-6), live price calculation.
- **Step 3 — Select Date:** Calendar widget, min=today, max=today+90 days, closed days disabled visually.
- **Step 4 — Select Time:** Slot grid for that date. **Slots are venue-wide** per D5 — a slot taken by Gel Blasters appears as "Booked" even if customer is selecting Laser Tag. Display in 12-hour format.
- **Step 5 — Customer Info + Confirm:** Name, phone (Egyptian mobile regex), email (optional), notes, terms checkbox. "Confirm Reservation" CTA.
- **Success Screen:**
  - Booking code prominently (copy button)
  - Receipt PDF download
  - Deposit amount + InstaPay instructions
  - One-tap WhatsApp deep link with pre-filled message:
    *"Hi Warriors Arena, this is my booking confirmation: WA-1005-K3P7. Deposit: 150 EGP. I'm sending the InstaPay screenshot."*
  - Park entrance fee notice
  - Cancellation policy (text, not enforced by v1 logic)

**Meta Pixel events fired (v1):**
- `ViewContent` on Step 1
- `InitiateCheckout` on Step 2
- `AddToCart` on Step 4 (slot validated)
- `Purchase` on Success Screen (with value, currency)

CAPI server events mirror with event_id dedup.

#### P3. FAQ Page (`/faq`)
Static content drafted in AR + EN.

#### P4. Terms & Policies (`/terms`)
Cancellation, deposit, data privacy. Friendly copy.

#### P5. Booking Lookup (`/my-booking`) — Phase 3
Deferred. Phase 1 fallback: customers contact via WhatsApp with booking code.

### 7.2 Admin Dashboard

#### A0. First-Login Password Change (`/admin/change-password`)

Forced screen for users with `must_change_password = true` (C10). Cannot navigate elsewhere until completed. Validates:
- Different from initial password
- Min 12 chars, mixed case, number, symbol
- Not a top-1000 common password

Sets `must_change_password = false` on success.

#### A1. Login (`/admin/login`)
Username + password (Supabase Auth backed). On success, checks `must_change_password` → redirects to A0 if true.

#### A2. Dashboard Home (`/admin`)
- Today's reservations count (by game, by status)
- Today's confirmed revenue
- Today's slot grid snapshot (mini)
- Quick actions: "New Manual Booking", "View All Reservations"
- Quick alerts (e.g., bookings happening within next hour)

#### A3. Reservation Control Center (`/admin/reservations`)

- Date picker at top, defaults to today, in 12-hour display.
- View toggle: Slot grid / List view.
- **Slot grid view (per D5):** X-axis = time slots, Y-axis = single row per slot (no per-game rows since slots are venue-wide). Cell shows status with color and game type:
  - Green: Available
  - Red: Booked (with game name and customer)
  - Gray: Closed
  - Purple border: Bundle booking
- Click cell → slideover with booking details or "Create Manual Booking" form.
- Filter bar: game filter, status filter, source filter.
- Bulk actions: export selection.

#### A4. Revenue Dashboard (`/admin/revenue`)

Tabs: Today / This Week / This Month / Custom Range.

Metric cards (v1):
- Confirmed Revenue (future + today bookings)
- Realized Revenue (completed bookings)
- Games Played
- Breakdown by Game
- Average Booking Value
- Cancellation Rate (with reason breakdown)

Charts:
- **Today:** Bar chart, time slots (12-hour labels), realized revenue Y-axis. 60-min bookings attributed to starting slot.
- **Week:** Line chart, days Sun–Sat.
- **Month:** Line chart, 4 weeks.

Export: current view as PDF or .xlsx.

#### A5. Slot Management (`/admin/hours`)

- **Default Hours** card — single editable config (12-hour input).
- **Day-of-Week Overrides** list — 7 days, CRUD each.
- **Exact Date Overrides** table — calendar view, "Mark this date as closed" quick action.

Live preview pane: "On Friday May 15, 2026, the venue will be: Open 6:00 PM – 9:00 PM" (resolves priority hierarchy live).

#### A6. Pricing (`/admin/pricing`)

Table: game × duration → editable price. Save-per-row. Confirmation modal: "This will apply to all future bookings. Confirm?"

#### A7. Bundles (`/admin/bundles`)

List + CRUD. Per bundle:
- Title (AR + EN)
- Game, duration, player count
- **Pricing mode toggle (D14):** "Per Player" or "Fixed Total"
- Price value (label changes per mode: "Price per Player" or "Total Bundle Price")
- Visibility, placement, display order
- Image upload
- Live preview card showing how it appears on landing page with computed total

#### A8. Games (`/admin/games`)

List with active toggle. Edit modal: name AR/EN, description AR/EN, icon, display order, active. Create flow requires at least one pricing entry.

#### A9. Financials (`/admin/financials`)

Tabs: Overview / Expenses / Salaries / Categories.

- **Overview:** P&L summary: Realized Revenue – Expenses – Salaries = Profit.
- **Expenses:** Table + "Add Expense" modal:
  - Title input
  - Category dropdown (pre-seeded D15 list + admin-added categories)
  - "+ Add new category" link in dropdown opens inline form
  - Amount, date, notes
  - Notes required when category = "Other"
- **Salaries:** Worker list, "Compute pay for [Month/Year]" button, payment history.
- **Categories:** Manage `expense_categories`. Cannot delete system categories, can deactivate. CRUD custom categories.

#### A10. Users & Roles (`/admin/users`)

List staff. Invite modal: username, email, full name, role, commission %, fixed salary. New users get a temporary password and `must_change_password = true`.

#### A11. Audit Log (`/admin/audit`)

Searchable/filterable table. Super-admin only.

---

## 8. Security Architecture

### 8.1 Authentication

- **Admin:** Supabase Auth backed. Username + password (username maps to email internally for Supabase compatibility, or via custom auth). Session = httpOnly secure cookie, 8-hour idle, 24-hour absolute timeout.
- **First login:** Forced password change for any user with `must_change_password = true`.
- **2FA:** Required for `super_admin` (v1.1).
- **Public:** No auth for booking creation. Magic link for future booking lookup (Phase 3).
- **API keys:** Service role key server-only. Anon key public reads. Never logged.

### 8.2 Authorization

- Middleware validates session + permission on every `/api/v1/admin/*` route.
- Permissions resolved per-request, not cached in JWT (allows immediate revocation).
- Server-side enforcement only.

### 8.3 Input Validation

- Zod at every API boundary.
- Phone: Egyptian mobile regex.
- SQL injection: parameterized queries only.
- XSS: React escapes by default; DOMPurify for any unsafe HTML.

### 8.4 Rate Limiting

| Endpoint | Limit | Scope |
|----------|-------|-------|
| POST /bookings | 5/hour | IP |
| POST /bookings | 2/hour | Phone number |
| GET /availability | 60/min | IP |
| POST /admin/login | 5/15min | IP + username |
| All admin endpoints | 200/min | User |

### 8.5 Concurrency

Unique partial index on `booking_slots(slot_date, slot_time) WHERE released = false` is the hard guarantee against double-booking (D5: now venue-wide, not per-game).

`fn_create_booking` RPC uses explicit transaction with `FOR UPDATE`.

### 8.6 Secrets

- All secrets in `.env.local` (gitignored) and Vercel env vars.
- Boot validation rejects startup if any required secret missing.
- Initial super-admin credentials seeded via migration; **forced password change on first login (C10)**.

### 8.7 PII Handling

- Customer phone/email plain-stored for operational use.
- No customer passwords (no customer accounts in v1).
- Admin passwords hashed (Supabase Auth).
- Audit log retained 2 years minimum.
- Customer data anonymizable on request (booking financial records preserved for 5 years per Egyptian retention norms).

### 8.8 File Upload (v1: Local public folder)

- Bundle/game images uploaded to `/public/uploads/{type}/{slug}-{timestamp}.{ext}`.
- Max 5MB, MIME whitelist (jpg, png, webp, avif), server-side type detection.
- Admin-only.
- Migration path to Cloudflare R2 / Vercel Blob documented for Phase 2.

### 8.9 Backups

- Supabase automatic daily backups (free tier 7 days).
- Weekly pg_dump to off-site storage manually until Phase 2.
- Monthly restore test on staging.

### 8.10 Monitoring & Alerts

- Sentry for frontend + API errors.
- Supabase logs for DB slow queries.
- UptimeRobot pinging `/api/health` every 5 min.
- Daily email summary to super_admin.

### 8.11 .claude/rules/security.md Foundation (Phase 0)

Per Vibe Coding doc recommendation, Phase 0 includes a `security.md` rules file enforced by Claude during all code generation:

- Never write secrets in code or comments
- Always use parameterized queries
- Always validate input with Zod at API boundaries
- Always check permissions server-side
- Never log passwords, tokens, or PII
- Always use httpOnly + secure cookies for sessions
- Always wrap state-changing actions in audit_log inserts

---

## 9. Infrastructure & Hosting Plan

### 9.1 Environments

- **Development** — Local, dev's own Supabase free tier project.
- **Staging** — Vercel preview deploys + shared Supabase staging project.
- **Production** — Vercel production + dedicated Supabase project.

### 9.2 Domains & DNS

- Primary: TBD (client to provide; recommend `.com` over `.eg` for international ad delivery)
- Staging: `staging.{primary}` (Vercel password-protected)
- Admin: `{primary}/admin` (path, not subdomain — simpler session cookies)

### 9.3 Monthly Cost (Launch — Updated for D16)

| Service | Tier | Cost |
|---------|------|------|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| Domain | | ~$1/mo amortized |
| Media hosting (D16) | Local public folder | $0 |
| Sentry | Free | $0 |
| UptimeRobot | Free | $0 |
| **v1 Launch Total** | | **~$1-5/mo** |

**Phase 2-3 estimates:**
- Vercel Pro (when traffic warrants): +$20
- Supabase Pro (PITR backups, more rows): +$25
- Cloudflare R2 (when migrating media): ~$1-5
- Paymob: 2.75% per transaction
- WhatsApp Business API: ~$5-20

### 9.4 CI/CD

- GitHub repo. Branches: `main` (prod), `staging`, feature branches.
- PR opens → Vercel preview + Supabase migration dry-run.
- Merge to `staging` → staging deploy + migrations.
- Merge to `main` → production deploy with manual approval.
- Migrations via Supabase CLI.

### 9.5 Scaling Path

| Traffic level | Adjustment |
|---------------|-----------|
| 0-1K bookings/mo | Default tier |
| 1K-10K | Vercel Pro, Supabase Pro |
| 10K+ | Read replica for availability, CDN for API |

Realistic cap: 12 slots/day × 30 days = 360 max bookings/month. We will never leave starter tiers for technical reasons.

---

## 10. Phased Build Roadmap

### Phase 0 — Foundation (1 week) — see Section 11 for detail

Setup, conventions, project brain, security rules, environment validation.

### Phase 1 — Core Booking Engine (3-4 weeks) — Updated for v1 simplifications

**Backend:**
- All config tables seeded (games, pricing, operating hours, system settings, expense categories)
- `fn_create_booking` RPC (atomic, venue-wide slot exclusivity per D5)
- Public API: games, bundles, availability, bookings, PDF receipt
- Admin API: reservations CRUD, simple cancellation with reason, revenue dashboard, hours, pricing, games, users, expenses, expense categories
- Cron: mark_completed_bookings, daily_metrics_snapshot
- Audit log
- RBAC with all 4 roles seeded

**Frontend:**
- Public landing page with placeholder animated hero (custom animations come per-component with your reference images)
- Full booking wizard (Steps 1-5) with simplified v1 status flow
- Receipt PDF via Puppeteer
- Admin: login, first-login password change, dashboard home, reservation control center, revenue dashboard, hours, pricing, games, bundles (with per-player + fixed-total modes), users, expenses (with category management), audit log
- Bilingual (AR/EN) public, English admin
- 12-hour AM/PM time display throughout
- Meta Pixel + CAPI for core events

**Polish:**
- Mobile QA on 3 devices
- Lighthouse 90+ mobile target
- E2E tests for booking flow (Playwright)
- Reviewer subagent security audit (per Vibe Coding doc)

**🚀 v1 launch.**

### Phase 2 — Operations Depth (2-3 weeks post-launch)

- Excel export for reservations
- Commissions & salary tracking activation
- Financial dashboard polish
- More granular reports
- Migration from local public folder to Cloudflare R2
- Custom domain + SSL hardening

### Phase 3 — Growth Layer (3-4 weeks)

- Paymob integration (activates v1.1 deposit lifecycle)
- WhatsApp Business API (auto-confirmation replies, reminders)
- Magic-link booking lookup (`/my-booking`)
- Reschedule as first-class operation
- Customer self-cancellation with 6-hour rule
- Refund/forfeit revenue distinction in dashboards
- Automated reminder 24hr before slot
- 2FA for super_admin

### Phase 4 — Scale & Polish (2-3 weeks)

- 3D hero element (lazy-loaded, static fallback)
- Advanced brand animations
- Accessibility audit (WCAG 2.2 AA)
- Performance tuning pass
- Staff training materials
- Admin API docs

---

## 11. Phase 0 Detailed Setup Plan

This is the new section incorporating selectively from the Vibe Coding recommendations.

### 11.1 Repository Structure

```
warriors-arena/
├── .claude/
│   ├── rules/
│   │   ├── architecture.md       # DB-driven config rule, time format, etc.
│   │   ├── security.md            # Per recommendation: Zod validation, no secrets in code, etc.
│   │   ├── code-style.md          # ASCII quotes, no truncation, file-complete responses
│   │   └── business-rules.md      # Pointer to this architecture doc as source of truth
│   ├── skills/                    # Reusable: revenue-report.md, booking-audit.md, etc.
│   ├── agents/                    # Subagent definitions (reviewer, security-scanner)
│   └── settings.local.json        # Gitignored local prefs
├── CLAUDE.md                      # Project brain — high-density summary
├── docs/
│   └── architecture-v1.1.md       # This document
├── supabase/
│   ├── migrations/                # Versioned SQL
│   ├── seed.sql                   # Initial data
│   └── functions/                 # SECURITY DEFINER RPCs
├── src/
│   ├── app/
│   │   ├── (public)/             # Landing, booking, FAQ
│   │   ├── admin/                # Dashboard
│   │   └── api/v1/               # API routes
│   ├── components/
│   │   ├── public/
│   │   ├── admin/
│   │   └── animations/           # Per-component animation library (D12)
│   ├── lib/
│   │   ├── db/                   # Supabase clients (anon + service)
│   │   ├── auth/                 # Permission middleware
│   │   ├── booking/              # Booking domain logic
│   │   ├── time/                 # Cairo TZ helpers, 12h formatters
│   │   └── i18n/                 # next-intl setup
│   ├── messages/
│   │   ├── en.json
│   │   └── ar.json
│   └── styles/
├── public/
│   └── uploads/                  # v1 local media (D16)
├── tests/
│   ├── e2e/                      # Playwright
│   └── unit/
├── .env.local.example            # Template (no real secrets)
├── .gitignore                    # Includes .env.local, .claude/settings.local.json
└── package.json
```

### 11.2 CLAUDE.md (Project Brain)

Created in Phase 0, kept current throughout. Contains:

- One-paragraph project description
- Tech stack summary (links to Section 1.4 of this doc)
- File structure map
- Critical conventions (12-hour display, ASCII quotes, server-side permissions)
- Pointer to `docs/architecture-v1.1.md` as authoritative spec
- "Do NOT" list (don't hardcode prices, don't use .toISOString().split(), don't write to bookings without RPC, etc.)

Generated by `/init` at start of Phase 0, manually refined.

### 11.3 .claude/rules/ Files (Phase 0 deliverables)

**architecture.md:**
- All configurable data lives in DB (games, pricing, hours, bundles, expense categories)
- Frontend never hardcodes business values
- All time storage in 24-hour ISO; all display in 12-hour AM/PM
- All financial fields immutable on historical records

**security.md:**
- See Section 8.11 — full list of security guardrails
- Reviewer subagent runs at end of Phase 1 with zero parent context

**code-style.md:**
- ASCII straight quotes only
- No truncation, complete file outputs
- Verify imports exist before completing response
- TypeScript strict mode, no `any` without comment justification

**business-rules.md:**
- Single source of truth: `docs/architecture-v1.1.md`
- Any rule conflict → ask user before deviating

### 11.4 Skills (Phase 1 onwards as needed)

Skills built incrementally:
- `generate-revenue-report.md` — Reusable revenue analysis pattern
- `audit-booking-row.md` — Inspect a booking + its slots + audit trail
- `validate-operating-hours.md` — Test hours-resolution function

### 11.5 Subagents (Phase 1 critical points)

- **reviewer-agent** — Spawned with zero context to review:
  - The atomic booking RPC
  - RBAC middleware
  - Financial calculations
  - Final pre-launch sweep
- **security-scanner** — End-of-phase code scan for common vulnerabilities

### 11.6 Working Mode Discipline

| Code area | Mode |
|-----------|------|
| Booking RPC, atomic logic | "Ask before edits" mode |
| Financial calculations | "Ask before edits" mode |
| RBAC middleware | "Ask before edits" mode |
| Audit log writes | "Ask before edits" mode |
| Public UI components | Standard fast mode + screenshot verification loop |
| Admin forms (non-financial) | Standard mode |
| Animations | Standard mode + reference image comparison |

### 11.7 Phase 0 Deliverables Checklist

- [ ] Repo created on GitHub with structure above
- [ ] `CLAUDE.md` written
- [ ] `.claude/rules/*.md` four files written
- [ ] `.env.local.example` created (no real secrets)
- [ ] `.gitignore` complete
- [ ] Vercel project linked
- [ ] Supabase production + staging projects linked, env vars set
- [ ] Sentry project linked
- [ ] Boot-time env validation written and tested
- [ ] Database migrations 001-010 created (schema from Section 3)
- [ ] Seed data: roles, permissions, role_permissions, default operating hours, expense_categories (system seeds), super_admin user with `must_change_password=true`
- [ ] Supabase Auth configured
- [ ] Tailwind + next-intl + base layout scaffolded
- [ ] Health check endpoint live
- [ ] First "hello world" admin page renders behind auth

**Phase 0 exit criteria:** Empty admin shell loads, super_admin can log in with `warriors_admin / Warriors@26`, is forced to change password, lands on empty dashboard. All infrastructure reachable. No business features yet.

---

## 12. Pre-Flight Checklist Status

Updated based on your responses.

### Product

- ✅ Document reviewed and signed off (v1.1 approved by client)
- ⏳ Brand palette screenshot — to be sent at start of UI build
- ⏳ Domain name — to be uploaded once available
- ⏳ WhatsApp business number — to be uploaded once available
- ⏳ InstaPay identifier — to be uploaded once available
- ✅ Park entry fee policy confirmed (30/50 EGP)
- 📝 Initial FAQ content — Claude to draft (8 Q&A in AR + EN, deliverable in Phase 1)
- 📝 Terms and policies — Claude to draft (deliverable in Phase 1)

### Technical

- ✅ GitHub organization / repo
- ✅ Vercel account
- ✅ Supabase project (production + staging)
- ✅ Sentry account
- ⏳ Cloudflare/Blob — postponed to Phase 2 (D16)
- ⏳ Meta Business + pixel ID — to be uploaded once available
- ⏳ Meta CAPI access token — to be uploaded once available
- ✅ Initial super-admin: **username `warriors_admin`, password `Warriors@26`** — will be seeded with `must_change_password = true`. Youssef will be required to change on first login.
- ✅ Staff accounts — Youssef will create via admin UI after first login
- 📝 Initial landing page content — Claude to draft (hero tagline AR/EN, about) per best practices
- ⏳ Venue photos — to be uploaded once available; Phase 1 ships with placeholder images
- ✅ Hero video → cancelled in favor of custom animation (D12)

### Operational

- ⏳ Staff training plan — at launch
- ✅ Pending deposits handling — staff via WhatsApp
- ⏳ On-call rotation — to be defined post-launch
- ⏳ Customer support phone/WhatsApp dedicated line — same as InstaPay WhatsApp number? (open question)
- ⏳ Backup contact for super_admin recovery email — open question

---

## 13. Remaining Open Decisions

These do not block Phase 0 start but should be resolved before Phase 1 launch:

1. **Domain name** — Final choice (recommend .com).
2. **WhatsApp number** — Dedicated business number or shared?
3. **InstaPay identifier** — Final value.
4. **Customer support channel** — Same WhatsApp as deposits, or separate?
5. **Super-admin recovery email** — In case Youssef loses access.
6. **Initial commission % default** — Recommend 5% as starting baseline (can be adjusted per worker).
7. **Customer PII retention period after booking** — Recommend 2 years; financial records 5 years anonymized.
8. **Holiday calendar source** — How does the system know "today is a holiday" for the 50 EGP park notice display? Manual flag in operating_hours? Or admin-maintained list? (Recommend: a `holidays` table that admin manually adds dates to.)
9. **Logo files** — SVG logo for receipt PDF branding.

---

## Sign-off

**v1.1 Status:** Approved by client (Round 4 feedback incorporated).

**Authorization:** Phase 0 setup may begin upon delivery of this document.

**Phase 1 prerequisites still needed before code:**
- Brand palette screenshot
- Logo files
- Domain decision

**Document version control:** Future revisions will be v1.2, v1.3, etc., delivered as fresh documents (not diffs) with changelog at the top.

---

*End of Document — Warriors Arena Architecture v1.1*
