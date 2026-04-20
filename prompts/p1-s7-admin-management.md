# Sprint 7 — Admin Management (Pricing, Games, Bundles, Hours, Users, Expenses, Audit)

> Prerequisites: Sprint 6 complete. Admin core in use.

## Prompt To Give Antigravity

```
Sprint 7: Admin configuration and management.

Build every remaining admin screen. The venue should be fully operable from the dashboard after this sprint.

SCOPE:

1. src/app/admin/hours/page.tsx — Operating Hours Management:
   - Default hours card (one row from operating_hours with scope='default')
   - Day-of-week list (7 slots, create/edit/delete each)
   - Exact-date overrides: searchable table + "Add Exact Date" modal that includes calendar picker and "Mark as closed" shortcut
   - Live preview: "On Friday May 15, 2026, the venue will be: Open 6:00 PM — 9:00 PM (source: day_of_week override)"
   - Requires permission: manage_hours
   - Uses fn_resolve_operating_hours for preview

2. src/app/admin/pricing/page.tsx — Pricing table:
   - Table: game × duration → editable price_per_player
   - Save per row with confirmation ("This applies to all future bookings. Existing bookings unchanged.")
   - History: expandable row showing past prices (from inactive game_pricing rows)
   - Requires permission: manage_pricing

3. src/app/admin/games/page.tsx — Games CRUD:
   - List with drag-reorder for display_order, active toggle
   - Create/Edit modal: name_en, name_ar, description_en, description_ar, icon upload, hero_image upload
   - Create flow requires at least one pricing entry (enforce in UI by showing pricing form inline)
   - Requires permission: manage_games

4. src/app/admin/bundles/page.tsx — Bundles CRUD:
   - List with visibility toggle, active toggle, display_order drag
   - Create/Edit modal:
     - Title (EN + AR)
     - Description (EN + AR) — optional
     - Game dropdown, duration, player_count
     - Pricing mode toggle: per_player vs fixed_total (D14)
     - Price input (label changes: "Price per player" or "Total bundle price")
     - Image upload
     - Visibility toggle + placement dropdown
     - Display order
     - Promo window (starts_at / ends_at) — optional
   - Live preview card showing how bundle appears on landing page (computed total)
   - Requires permission: manage_bundles

5. src/app/admin/users/page.tsx — User management:
   - List of staff with role, worker_code, commission%, fixed_salary, is_active
   - Invite modal: username, email, full_name, role (dropdown excluding super_admin unless current user is super_admin), commission%, fixed_salary
   - New users created with temp password (server generates, returns once) + must_change_password=true
   - Edit modal: role change, commission update, salary update, deactivate
   - Cannot edit own role or own commission (UX: fields disabled with tooltip)
   - Requires permission: manage_users

6. src/app/admin/financials/page.tsx — Financial management:
   Tabs: Overview / Expenses / Salaries / Categories
   
   Overview tab:
   - P&L: Realized Revenue – Expenses – Salaries = Profit
   - Period selector (month / quarter / year / custom)
   - Requires permission: view_financials
   
   Expenses tab:
   - Filterable table (category, date range, amount range)
   - Add Expense modal:
     - Title input
     - Category dropdown (fetch from expense_categories, grouped: "System" + "Custom")
     - "+ Add new category" inline link → small form that inserts new expense_categories row, reloads dropdown
     - Amount, date, notes (notes required when category.name='Other')
   - Edit creates audit_log entry; "Delete" inserts reversing expense row, preserves history
   - Requires permission: manage_financials
   
   Salaries tab:
   - Worker list with current month's computed pay
   - "Compute pay for [Month/Year]" button calculates salary + commission for each worker
   - Record payment button sets paid_at
   - Payment history per worker
   - Requires permission: manage_financials (AND not assigned to staff role per matrix)
   
   Categories tab:
   - List of expense_categories
   - Cannot delete is_system=true rows; can deactivate (is_active=false)
   - Custom categories: full CRUD
   - Requires permission: manage_financials

7. src/app/admin/export/page.tsx — Data export:
   - Date range picker
   - Filter options (game, status)
   - Format: xlsx (use exceljs or sheetjs)
   - Requires permission: export_data
   - Generates file server-side, streams download

8. src/app/admin/audit/page.tsx — Audit log:
   - Filterable table: actor, action, entity_type, date range
   - Row expansion shows before/after JSONB diff
   - Super-admin only (manager gets last-30-days view per matrix)
   - Requires permission: view_audit

WORKING MODE:
- Do not ship this entire sprint in one push. Break into: Hours → Pricing → Games → Bundles → Users → Financials → Export → Audit. Review each before next.
- Every form that writes to DB uses Zod on both client and server.
- Every mutation writes to audit_log.
- The "+ Add new category" inline UX is tricky; verify it actually works without losing the expense form state.

EXIT CRITERIA:
- Super admin can add a new game via the UI; it appears on the public landing page without code deploy.
- Admin can add a bundle with fixed_total pricing; it displays correctly on the landing page with the flat price (not per-player math).
- Admin can add a custom expense category; future expenses can use it.
- Admin can close May 1 via exact_date override; that date is disabled in public calendar.
- Staff user cannot see the Financials page (both server 403 and UI hidden).
- Export xlsx contains all reservations in range with correct column headers.
- Audit log shows entries for every change made during testing.

Begin with the plan for the first subsection (Hours).
```

---

*End of Sprint 7 Prompt*
