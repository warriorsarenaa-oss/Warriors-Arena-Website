# Sprint 6 — Admin Core (Login, Reservation Center, Revenue)

> Prerequisites: Sprint 5 complete. Public side launched to staging.

## Prompt To Give Antigravity

```
Sprint 6: Admin operational core.

Build the admin screens staff will use day-to-day. English-only. No public-facing changes.

SCOPE:

1. src/app/admin/login/page.tsx
   - Username + password form (Supabase Auth; map username → email internally if the Auth system needs email — document the approach)
   - Rate limit: 5/15min per IP + per username
   - On success: if must_change_password=true → /admin/change-password. Else → /admin.

2. src/app/admin/change-password/page.tsx
   - Force-displayed if user has must_change_password=true; server-side redirect protects it.
   - Validates: different from initial, >=12 chars, mixed case, digit, symbol, not in a top-1000 list.
   - On success: must_change_password=false, redirect to /admin.

3. src/app/admin/layout.tsx — admin shell with:
   - Sidebar nav (Dashboard, Reservations, Revenue, Hours, Pricing, Games, Bundles, Financials, Users, Audit)
   - Top bar with logged-in user, role, logout button
   - Must call permission-middleware-aware API to determine which nav items to show (UI hiding — remember this is UX only, server enforces access)
   - No access for must_change_password users (redirect)

4. src/app/admin/page.tsx — Dashboard home:
   - Today's reservations (count by status + by game)
   - Today's confirmed revenue
   - Mini slot grid for today
   - Quick actions: "New Manual Booking", "View All"
   - Next-slot alert: if any bookings happen in next 60 minutes, show a banner

5. src/app/admin/reservations/page.tsx — Reservation Control Center:
   - Date picker at top (12-hour time display throughout)
   - Slot grid view:
     - Single row per slot time (venue-wide per D5)
     - Color-coded: green/red/gray
     - Booked slot shows game + customer name
     - Click → slideover with full details
   - List view toggle:
     - Filterable table
     - Columns: code, game, date+time, players, customer, total, status, created_by
   - New Manual Booking button:
     - Opens modal with admin booking form
     - Includes game, date, time, players, customer info, player_count can exceed 6 with warning
     - Calls same create-booking service with source='manual', created_by_user_id = current user

6. src/app/admin/reservations/[id]/cancel-dialog — cancellation UI:
   - Modal/slideover with reason dropdown (6 options per BR-REFUND)
   - Free-text note (required when reason='other')
   - Confirm button with double-confirmation ("This slot will be released — proceed?")
   - On confirm: calls API that wraps fn_cancel_booking, writes audit_log

7. API endpoints:
   - POST /api/v1/admin/reservations — manual booking creation (requires create_booking)
   - POST /api/v1/admin/reservations/[id]/cancel — cancel (requires cancel_booking)
   - GET /api/v1/admin/reservations?date=YYYY-MM-DD — slot grid data (requires view_bookings)
   - GET /api/v1/admin/reservations/list?from=&to=&game=&status= — list view (requires view_bookings)

8. src/app/admin/revenue/page.tsx — Revenue dashboard:
   - Tabs: Today / This Week / This Month / Custom Range
   - Uses the generate-revenue-report skill pattern
   - Metric cards: Confirmed Revenue, Realized Revenue, Games Played, Avg Booking Value, Cancellation Rate
   - Charts via Recharts:
     - Today: bar chart, 12-hour slot labels
     - Week: line, days Sun-Sat
     - Month: line, 4 weeks
   - Per-game breakdown table
   - Cancellation reason breakdown

9. API: GET /api/v1/admin/revenue?period=today|week|month|custom&from=&to= (requires view_revenue)

WORKING MODE:
- RBAC middleware is Critical — ask before edits.
- Cancellation logic is Critical — ask before edits.
- All numbers in the revenue dashboard must be verifiable against raw DB queries.
- Test with a non-super-admin user (create a "staff" user manually) to verify permission hiding works both server and client side.

EXIT CRITERIA:
- Super admin logs in, is forced to change password, lands on dashboard with data.
- Staff user sees reservations and can create manual bookings, cannot see financials.
- Viewer user sees revenue + financials but cannot create or cancel.
- Creating a manual booking from admin UI works; appears in public availability as taken.
- Cancelling a booking frees its slot in the public availability API immediately.
- Revenue dashboard numbers match raw SQL queries.
- Audit log shows every cancellation, every manual booking creation, every login.

Begin with the plan.
```

---

*End of Sprint 6 Prompt*
