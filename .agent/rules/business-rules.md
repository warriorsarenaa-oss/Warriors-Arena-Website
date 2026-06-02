# Business Rules — Source of Truth

> The complete business rules specification lives in **`docs/architecture-v1.1.md`** Section 2.

This file exists to point you there and to call out the rules that are most often violated by AI code generation.

## Read This First

Before implementing any business logic, read:
- `docs/architecture-v1.1.md` Section 2 (Business Rules)
- `docs/architecture-v1.1.md` Section 4 (State Machines)

The rules are numbered (`BR-SLOT-01`, `BR-PRICE-04`, etc.). Reference the rule number in commit messages and PR descriptions when implementing one.

## Rules Most Often Violated By Code Generation

These are the ones to be especially careful about. Re-read the relevant rule before writing the code.

### BR-SLOT-06: Slot Exclusivity Is Venue-Wide
The temptation is to scope availability per game ("is Laser Tag available at 7 PM?"). It is not. The slot is venue-wide. If anything is booked at 7 PM, no other game can book at 7 PM.

### BR-PRICE-04: Pricing Is Immutable On History
The temptation is to JOIN bookings to current pricing for reports. Do not. Use the `total_price_at_booking` snapshot column. If the admin changed the price yesterday, last week's report should still show last week's price.

### BR-BUNDLE-02: Two Pricing Modes
The temptation is to assume per-player. Bundles can be `per_player` or `fixed_total`. Always check `pricing_mode` before computing total.

### v1 vs v1.1 Status Values (Section 4)
The temptation is to implement the full state machine. v1 has only three statuses. Do not write `pending_deposit` logic in v1.

### BR-COMM-01: Commission Only On Manual Bookings
The temptation is to compute commission on all bookings. Online bookings (where `source = 'online'`) generate zero commission regardless of who confirmed them.

### BR-TZ-04: Never Use ISO Date Splitting
The temptation is `date.toISOString().split("T")[0]`. This returns UTC date, which is wrong near midnight Cairo. Use `formatInTimeZone(date, "Africa/Cairo", "yyyy-MM-dd")`.

### BR-FIN-04: Custom Categories Get `created_by_user_id`
The temptation is to seed all categories without `created_by_user_id`. Pre-seeded categories have `is_system = true` and `created_by_user_id = NULL`. Admin-added categories have `is_system = false` and `created_by_user_id` set.

## When In Doubt

Ask the user. Do not guess at business rules. The cost of a clarification message is seconds; the cost of wrong logic in a financial system is hours and trust.

---

*End of business-rules.md*
