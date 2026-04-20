# Skill: Generate Revenue Report

> Reusable pattern for any report that aggregates booking financials over a time window.

## When To Use

When the user asks for any of:
- "Show revenue for [period]"
- "Generate a sales report"
- "How much did we make in [month/week/day]"
- "Compare revenue to last [period]"

## Core Principle

Revenue calculation in v1 is simpler than v1.1+ but the pattern is the same. Always pull the snapshot fields from `bookings`, never join to current pricing.

## v1 Implementation

```sql
-- Realized revenue for a period (completed bookings)
SELECT
  COALESCE(SUM(total_price_at_booking), 0) AS realized_revenue,
  COUNT(*) AS bookings_completed,
  COUNT(*) FILTER (WHERE source = 'manual') AS manual_bookings,
  COUNT(*) FILTER (WHERE source = 'online') AS online_bookings
FROM bookings
WHERE status = 'completed'
  AND completed_at >= $1
  AND completed_at < $2;

-- Confirmed revenue for a period (future + today bookings still active)
SELECT
  COALESCE(SUM(total_price_at_booking), 0) AS confirmed_revenue,
  COUNT(*) AS bookings_confirmed
FROM bookings
WHERE status = 'confirmed'
  AND booking_date >= $1
  AND booking_date < $2;

-- Cancellation breakdown
SELECT
  cancellation_reason,
  COUNT(*) AS count,
  COALESCE(SUM(total_price_at_booking), 0) AS lost_revenue
FROM bookings
WHERE status = 'cancelled'
  AND cancelled_at >= $1
  AND cancelled_at < $2
GROUP BY cancellation_reason;

-- Per-game breakdown
SELECT
  g.name_en AS game_name,
  COUNT(*) AS bookings,
  COALESCE(SUM(b.total_price_at_booking), 0) AS revenue
FROM bookings b
JOIN games g ON b.game_id = g.id
WHERE b.status = 'completed'
  AND b.completed_at >= $1
  AND b.completed_at < $2
GROUP BY g.id, g.name_en
ORDER BY revenue DESC;
```

## Date Window Construction

For "today" in Cairo:
```typescript
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

const TZ = "Africa/Cairo";
const todayDate = formatInTimeZone(new Date(), TZ, "yyyy-MM-dd");
const startOfDay = fromZonedTime(`${todayDate} 00:00:00`, TZ);
const startOfNextDay = fromZonedTime(`${todayDate} 24:00:00`, TZ);
```

For "this week" (Sun-Sat in Cairo, since the week starts Sunday in Egypt).

For "this month" (1st of month in Cairo to 1st of next month in Cairo).

## Chart Data Shape

Daily bar chart attributes 60-min booking revenue to its **starting slot only** (per BR-REV-V1-04).

```sql
SELECT
  start_time,
  COALESCE(SUM(total_price_at_booking), 0) AS revenue,
  COUNT(*) AS bookings
FROM bookings
WHERE status IN ('confirmed', 'completed')
  AND booking_date = $1
GROUP BY start_time
ORDER BY start_time;
```

Then in JS, format `start_time` to 12-hour for display:
```typescript
const displayTime = formatInTimeZone(
  new Date(`2000-01-01T${row.start_time}`),
  "Africa/Cairo",
  "h:mm a"
);
```

## v1.1+ Extension

When v1.1 ships, revenue gains the gross/realized/refunded/forfeited distinction:

- Gross Bookings = sum of all confirmed + completed
- Realized = sum of completed + sum of (deposit_amount on cancelled_forfeited and no_show)
- Refunded = sum of deposit_amount on cancelled_refunded where deposit was actually paid

The v1 code path remains valid; v1.1 adds new metrics alongside.

## Output Format

For UI display, return:
```typescript
{
  period: { from: ISOString, to: ISOString, label: "Today" | "This Week" | ... },
  metrics: {
    realized_revenue: number,
    confirmed_revenue: number,
    bookings_completed: number,
    bookings_confirmed: number,
    avg_booking_value: number,
    cancellation_rate: number, // percentage
  },
  by_game: Array<{ game_name: string, bookings: number, revenue: number }>,
  by_cancellation_reason: Array<{ reason: string, count: number, lost_revenue: number }>,
  chart_series: Array<{ x: string, y: number }>,
}
```

## Common Mistakes

- ❌ Joining to current `game_pricing` instead of using snapshot — violates BR-PRICE-04
- ❌ Using `created_at` instead of `completed_at` for realized revenue
- ❌ Including `cancelled` status in revenue counts
- ❌ Returning UTC timestamps to the frontend without conversion to Cairo
- ❌ Floating-point math on monetary values

---

*End of skill: generate-revenue-report*
