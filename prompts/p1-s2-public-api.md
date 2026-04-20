# Sprint 2 — Public API

> Prerequisites: Sprint 1 complete. Exit criteria verified.

## Prompt To Give Antigravity

```
Sprint 2: Public API endpoints.

Build the backend endpoints that the public booking engine will call. No UI yet.

SCOPE:

1. src/app/api/v1/games/route.ts
   GET: returns active games with current pricing.
   Uses anon client. Filters by is_active = true, orders by display_order.
   Response shape per docs/architecture-v1.1.md Section 5.1.

2. src/app/api/v1/bundles/route.ts
   GET: returns visible + active bundles with computed total.
   Uses anon client. Filters by is_visible = true AND is_active = true.
   For pricing_mode = 'per_player', return total = price_value * player_count.
   For pricing_mode = 'fixed_total', return total = price_value.
   Include pricing_mode in response so frontend can display appropriately.

3. src/app/api/v1/availability/route.ts
   GET ?date=YYYY-MM-DD: returns slot availability for that Cairo-local date.
   Calls fn_get_availability RPC (no game_id; venue-wide per D5).
   Returns each slot with: time (12-hour display), time_24h (internal), available_30, available_60, reason.
   Rate limit: 60/min per IP.
   Validate date with Zod: must be today or future, within 90 days, valid Cairo date.

4. src/lib/booking/create-booking.ts
   Service-layer function callable from API route and (later) admin UI.
   Inputs: game_id, bundle_id?, date, start_time, duration_minutes, player_count, customer_name, customer_phone, customer_email?, customer_notes?, source, created_by_user_id?
   Flow:
   - Validate inputs with Zod
   - Validate phone as Egyptian mobile (regex: /^\+?20?1[0-25][0-9]{8}$/)
   - Call fn_create_booking RPC
   - On SLOT_CONFLICT error, throw typed ConflictError
   - Return booking record shape for API

5. src/app/api/v1/bookings/route.ts
   POST: create a public online booking.
   - Validates Turnstile/CAPTCHA token (use placeholder that always passes in dev if CAPTCHA not yet configured; add TODO marker)
   - Rate limit: 5/hour per IP, 2/hour per phone
   - Calls create-booking service with source='online'
   - On success, writes audit_log entry (actor is the customer; use NULL actor_user_id, actor_email=customer_email or 'anonymous')
   - Returns booking payload + WhatsApp deep link + PDF URL per Section 5.1

6. src/lib/booking/whatsapp-deep-link.ts
   Helper to generate https://wa.me/... link with pre-filled message:
   "Hi Warriors Arena, this is my booking confirmation: {code}. Deposit: {amount} EGP. I'm sending the InstaPay screenshot."
   Phone and InstaPay identifier pulled from system_settings.

7. src/app/api/v1/bookings/[code]/route.ts
   GET: public read of a booking by code.
   Requires ?phone_last4=XXXX query param that matches the last 4 digits of the stored phone.
   If no match → 404 (not 403 — don't leak existence).
   Returns minimal booking info (code, date, time, game, status, deposit_instructions).

8. src/app/api/cron/mark-completed-bookings/route.ts
   - Validates Authorization: Bearer $CRON_SECRET
   - Calls fn_complete_bookings_due RPC
   - Logs result, returns count
   - Already scaffolded in Phase 0; wire up the actual call

INTEGRATION TESTS (required for Sprint 2):

tests/e2e/public-api.spec.ts covers:
- GET /api/v1/games returns 2 games (laser_tag, gel_blasters) from seed
- GET /api/v1/availability?date=<tomorrow> returns 6 slots all available
- POST /api/v1/bookings happy path with valid data returns booking_code
- POST /api/v1/bookings duplicate slot returns 409
- POST /api/v1/bookings invalid phone returns 400
- Rate limit triggers on 6th rapid POST
- Concurrency: fire 10 parallel bookings for the same slot, exactly 1 succeeds

WORKING MODE:
- Ask before editing src/lib/booking/create-booking.ts — it is Critical.
- The concurrency test must actually pass. If fn_create_booking has a bug, fix it, but consult me first — migration changes are significant.
- All endpoints go through the rate limiter even in tests (use a test-specific scope).

EXIT CRITERIA:
- All integration tests pass including concurrency test.
- Manual curl test: create a booking, then try to create again at same slot → 409.
- Every API response has proper JSON error shape: { error: { code, message } }.
- Audit log has an entry for each booking creation.
- No service-role key reachable from client code (verify via build output).

Begin with the plan.
```

---

*End of Sprint 2 Prompt*
