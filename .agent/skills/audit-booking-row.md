# Skill: Audit A Booking Row

> When debugging a specific booking, gather the full picture in one query.

## When To Use

When the user provides a booking code or asks "what happened with booking X?" — use this pattern to assemble all related data.

## Full Audit Query

```sql
-- The booking itself
SELECT
  b.*,
  g.name_en AS game_name,
  bn.title_en AS bundle_name,
  u_created.email AS created_by_email,
  u_cancelled.email AS cancelled_by_email
FROM bookings b
LEFT JOIN games g ON b.game_id = g.id
LEFT JOIN bundles bn ON b.bundle_id = bn.id
LEFT JOIN users u_created ON b.created_by_user_id = u_created.id
LEFT JOIN users u_cancelled ON b.cancelled_by_user_id = u_cancelled.id
WHERE b.booking_code = $1;

-- Slots occupied (active and historical)
SELECT
  slot_date,
  slot_time,
  released,
  created_at
FROM booking_slots
WHERE booking_id = $1  -- pass the booking UUID, not the code
ORDER BY slot_time;

-- Audit log entries
SELECT
  actor_email,
  action,
  before_state,
  after_state,
  created_at
FROM audit_log
WHERE entity_type = 'booking'
  AND entity_id = $1
ORDER BY created_at ASC;
```

## Interpretation Guide

### Status flow
- `confirmed` + `cancelled_at` IS NULL → currently active
- `confirmed` + slot time has passed → should be transitioned to `completed` by cron
- `cancelled` + check `cancellation_reason` for why
- `completed` → played successfully

### Slot occupation
- All `released = false` slots show what's currently blocking the calendar
- All `released = true` slots are historical (someone cancelled)
- Number of slots should match `duration_minutes / 30`

### Money
- `total_price_at_booking` is what the customer was told
- `deposit_amount` is what they should send via InstaPay (v1)
- `commission_amount` is what the worker earns (NULL for online bookings)

## Common Issues To Look For

1. **Booking is `confirmed` but should be `completed`:** Cron may not have run. Check timestamps.
2. **Slot still occupied after cancellation:** Bug in cancellation logic. Slots should be `released = true`.
3. **Slot occupied but no booking:** Orphaned slot row. Should never happen due to FK CASCADE; if seen, schema bug.
4. **`commission_amount` set on online booking:** Bug. Should be NULL per BR-COMM-01.
5. **`total_price_at_booking` differs from `players × current price`:** Expected if pricing changed since booking. Per BR-PRICE-04.

## Reporting Back To User

Format findings as:
```
Booking WA-1005-K3P7
  Status: confirmed (created 2026-05-08 14:32:11 Cairo)
  Game: Laser Tag, 30 min, 4 players
  Total: 600 EGP, Deposit: 150 EGP
  Slot: 2026-05-10 at 7:00 PM (occupied)
  Customer: Ahmed Hassan (+201234567890)
  
  Audit trail:
  - 2026-05-08 14:32:11 — created by online (booking.create)
  - 2026-05-08 15:10:44 — admin Youssef confirmed deposit (booking.update)
```

---

*End of skill: audit-booking-row*
