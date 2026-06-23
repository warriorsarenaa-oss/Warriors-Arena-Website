-- Migration 031: RLS Policy Hardening (intentional, documented security model)
-- Author: Warriors Arena
-- Date: 2026-06-23
--
-- ============================================================================
-- WHAT THIS MIGRATION DOES
-- ============================================================================
-- A database audit found 19 tables with RLS ENABLED but ZERO policies. In
-- PostgreSQL, "RLS enabled + no policies" = deny-all for every role EXCEPT
-- roles that bypass RLS. Supabase's service_role has the BYPASSRLS attribute,
-- so all admin routes (which use supabaseService) keep working. The app works
-- today only because of that bypass. If any route ever used the anon/auth
-- client on these tables, it would return zero rows with no error -- a silent
-- failure class this project has hit before.
--
-- This migration makes that security posture INTENTIONAL and DOCUMENTED rather
-- than accidental. It does NOT add permissive policies. Decision (owner,
-- 2026-06-23): keep these tables service-role-only -- identical to the pattern
-- already used by the `users` table in migration 003. All access flows through
-- server-side service-role API routes, so an authenticated-client policy would
-- be belt-and-suspenders with real lockout risk (see "ROLE MODEL" below).
--
-- Net effect: each table is (re-)confirmed RLS-ENABLED with NO policies. The
-- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` calls are idempotent and safe to
-- re-run. No application code changes. No existing policies are dropped. No
-- data is modified.
--
-- ============================================================================
-- WHY NO admin-only authenticated policy (ROLE MODEL)
-- ============================================================================
-- The template circulating with this task used:
--     ... WHERE r.name IN ('admin', 'super_admin')
-- That is WRONG for this database:
--   * There is no 'admin' role. Seeded roles are super_admin, manager, staff,
--     viewer (migration 003).
--   * The granular RBAC (migration 009) created per-user custom_* roles. Of the
--     8 active backoffice users, only 1 is super_admin; the other 7 hold
--     custom_* roles. A policy keyed on r.name IN ('admin','super_admin') would
--     silently DENY 7 of 8 admins on any authenticated-client path -- the exact
--     zero-rows-no-error bug this work is meant to prevent.
-- Because every admin route already uses the service role (which bypasses RLS),
-- the correct and safest model here is NO permissive policy at all.
--
-- ============================================================================
-- WHY NO anon policy on booking_slots (Group 2)
-- ============================================================================
-- The public booking wizard does NOT read booking_slots. Public availability is
-- served by /api/v1/availability, which uses the SERVICE ROLE and computes
-- availability from `bookings` + operating hours (see the route's own comment).
-- The anon client never touches booking_slots. Adding an anon SELECT policy
-- would expose internal slot rows to the public for zero functional benefit, so
-- booking_slots is treated as an admin/service-role-only table like the rest.
--
-- ============================================================================
-- PRE-FLIGHT GATE (run separately in the Supabase SQL editor BEFORE applying)
-- ============================================================================
-- Confirms the target tables currently have 0 policies. If any target shows
-- policy_count > 0, STOP and review before applying -- this migration assumes
-- they are policy-free and does not touch existing policies.
--
--   SELECT t.tablename, t.rowsecurity, COUNT(p.policyname) AS policy_count
--   FROM pg_tables t
--   LEFT JOIN pg_policies p
--     ON p.tablename = t.tablename AND p.schemaname = 'public'
--   WHERE t.schemaname = 'public'
--     AND t.tablename IN (
--       'bookings','expenses','payroll_records','shift_game_log','staff_shifts',
--       'staff_schedules','arena_events','booking_slots','schedule_edits',
--       'game_date_overrides','game_day_availability','venue_settings',
--       'event_queue','rate_limit_buckets','booking_refills','refill_packages',
--       'audit_log'
--     )
--   GROUP BY t.tablename, t.rowsecurity
--   ORDER BY policy_count DESC, t.tablename;
--
-- ============================================================================

BEGIN;

-- ----------------------------------------------------------------------------
-- GROUP 1 -- Core operational tables (admin / service-role only)
-- RLS enabled, no policies: service_role bypasses, all other roles denied.
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS bookings              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS expenses              ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS payroll_records       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS shift_game_log        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_shifts          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS staff_schedules       ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS arena_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS schedule_edits        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS game_date_overrides   ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS game_day_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS venue_settings        ENABLE ROW LEVEL SECURITY;

-- booking_slots: admin/service-role only (NOT public -- see header). Internal
-- slot ledger; public availability is computed server-side from `bookings`.
ALTER TABLE IF EXISTS booking_slots         ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- GROUP 3 -- Internal / system tables (service-role only is sufficient)
-- Only ever accessed by server-side service-role routes. No anon/auth access.
-- ----------------------------------------------------------------------------
ALTER TABLE IF EXISTS event_queue           ENABLE ROW LEVEL SECURITY; -- internal job queue
ALTER TABLE IF EXISTS rate_limit_buckets    ENABLE ROW LEVEL SECURITY; -- internal rate limiting

-- booking_refills (active, 1 row) and refill_packages (active, 5 rows):
-- confirmed in use, but only via service-role admin routes (reservation refill,
-- admin games). No public/anon access path exists -> service-role only.
ALTER TABLE IF EXISTS booking_refills        ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS refill_packages        ENABLE ROW LEVEL SECURITY;

-- audit_log (singular): NOTE -- this is NOT the live audit table. The canonical
-- audit table is `audit_logs` (plural, 366 rows), standardized in migration 011
-- and excluded from this migration. `audit_log` is an empty (0-row) dead
-- duplicate left behind. Enabling RLS here is harmless defense-in-depth; no
-- policy is added. Dropping the dead table is out of scope for this migration.
ALTER TABLE IF EXISTS audit_log             ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- GROUP 4 -- Dead legacy tables (documented only, intentionally untouched)
-- ----------------------------------------------------------------------------
-- worker_salary_payments: 0 rows, dead legacy table. No policy, no DDL. Skipped.
-- commission_logs:         0 rows, dormant table.   No policy, no DDL. Skipped.

-- ----------------------------------------------------------------------------
-- NOT TOUCHED (already had policies before this migration; left alone):
--   payroll_payments, cms_content, faq_items, gallery_images, game_pricing,
--   games, permissions, role_permissions, roles, special_missions,
--   system_settings, users, audit_logs, expense_categories, protocol_steps
-- ----------------------------------------------------------------------------

COMMIT;

-- ============================================================================
-- VERIFICATION (run after applying)
-- ============================================================================
-- Expected end state for the tables handled here: rowsecurity = true AND
-- policy_count = 0. With the service-role-only model that 0 is CORRECT, not a
-- gap -- service_role bypasses RLS; every other role is denied. Any target
-- table showing rowsecurity = false should be reported.
SELECT t.tablename, t.rowsecurity, COUNT(p.policyname) AS policy_count
FROM pg_tables t
LEFT JOIN pg_policies p
  ON p.tablename = t.tablename AND p.schemaname = 'public'
WHERE t.schemaname = 'public'
GROUP BY t.tablename, t.rowsecurity
ORDER BY policy_count ASC, t.tablename;
