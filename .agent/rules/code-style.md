# Code Style Rules

> Conventions for code that will be merged. Style violations are easy to fix; cumulative style debt is not. Apply these from the start.

## R-STYLE-01: ASCII Quotes Only

Use straight ASCII quotes (`'` and `"`) in all code, comments, JSON, and file content.

- Smart quotes (`'`, `'`, `"`, `"`) break JSON parsers, YAML parsers, and shell scripts.
- If you find smart quotes in a file, replace them.
- This rule applies even inside string literals: `const greeting = "Hello, world"` not `const greeting = "Hello, world"`.

## R-STYLE-02: TypeScript Strict Mode

`tsconfig.json` enables `"strict": true`. Do not relax this.

- No `any` without an inline comment explaining why and a TODO for refinement.
- No `// @ts-ignore` without explanation. Prefer `// @ts-expect-error` with a comment.
- No `as unknown as Foo` casts without justification.
- Prefer narrow types over broad ones. `string` is better than `any`. A union of string literals is better than `string`.

## R-STYLE-03: Complete File Outputs

When generating or editing a file, output the complete file. No truncation.

- "Rest of file unchanged" comments are not acceptable.
- If a file is too long for one response, split into named sections and complete each.
- After every file write, verify by reading back the relevant section.

## R-STYLE-04: Imports Verified

Every import in a written file must reference a file or package that exists.

- Before declaring a file complete, verify each `import` statement resolves.
- Common failure: importing `@/lib/foo` when the file is at `@/lib/bar/foo`.
- Use the IDE/Antigravity file tree as the source of truth, not memory.

## R-STYLE-05: Buttons Have Explicit Type

Every `<button>` element has an explicit `type` attribute.

- `type="button"` for buttons that trigger JS handlers
- `type="submit"` for the single submit button per form
- `type="reset"` is rarely needed and discouraged

The default is `type="submit"` which silently submits enclosing forms — a frequent source of bugs.

## R-STYLE-06: Hydration Hygiene

- Add `suppressHydrationWarning={true}` to the root `<body>` tag in the layout (browser extensions inject attributes that cause noise).
- Avoid rendering different content on server vs. client unless gated by `useEffect`.
- For locale-dependent rendering (dates, numbers), pass the formatted string from server to client to avoid mismatch.

## R-STYLE-07: Re-Fetch After Mutation

After any create/update/delete action, re-fetch fresh data before declaring the UI updated.

- Never derive UI state from optimistic predictions of what the server did.
- Use the React Query / SWR pattern: invalidate the relevant query key after mutation, let it refetch.
- For server actions, return the new state from the action and consume it.

## R-STYLE-08: Server Actions And API Routes

- Mutations from forms can use Server Actions (Next.js 15 pattern).
- Mutations from non-form interactions (button clicks, async flows) use API routes.
- Public-facing endpoints (called by anon users) always use API routes, never server actions (rate limiting and validation are clearer).

## R-STYLE-09: Logical CSS Properties For RTL Compatibility

In components that render on the public site (which supports Arabic RTL):

- Use `ms-` (margin-start), `me-` (margin-end), `ps-` (padding-start), `pe-` (padding-end).
- Avoid `ml-`, `mr-`, `pl-`, `pr-` (these are direction-specific).
- For absolute positioning: prefer `start-0`, `end-0` over `left-0`, `right-0`.
- Admin components are English-only; either convention is fine there, but prefer logical for consistency.

## R-STYLE-10: No Premature Abstractions

Build for the use case in front of you. Abstract when the second use case appears.

- A function used once is just code, not an abstraction.
- A component prop with one possible value is dead weight.
- An interface with one implementation is overhead.

Resist the urge to "make it reusable" before there is a second use.

## R-STYLE-11: Naming

- Components: PascalCase, descriptive (`BookingWizardStep3`, not `Step3`).
- Functions: camelCase, verb-first (`createBooking`, `formatBookingTime`).
- Constants: UPPER_SNAKE_CASE for true constants; camelCase for derived values.
- Files: kebab-case (`booking-wizard.tsx`, `format-time.ts`).
- DB tables: snake_case, plural (`bookings`, `expense_categories`).
- DB columns: snake_case (`booking_code`, `created_at`).
- API endpoints: kebab-case in URLs (`/api/v1/admin/expense-categories`).

## R-STYLE-12: Test Files Live Next To Source

- `src/lib/booking/create-booking.ts`
- `src/lib/booking/create-booking.test.ts`

Co-location makes tests discoverable and ensures they get updated when source changes.

## R-STYLE-13: One Concern Per Migration

Each Supabase migration file does one thing and is named for that thing.

- Good: `20260420_001_create_games_table.sql`
- Good: `20260420_002_seed_default_operating_hours.sql`
- Bad: `20260420_001_initial_schema.sql` (too broad)

This makes rollback and selective re-run possible.

## R-STYLE-14: Comments Explain Why, Not What

```typescript
// BAD: increment counter
counter++;

// GOOD: retry up to 5 times to handle transient Supabase connection drops
counter++;
```

The code shows the what. Comments earn their space by explaining intent, gotchas, or non-obvious decisions.

## R-STYLE-15: No Console Logs In Committed Code

- `console.log` is for active debugging, not for production code.
- If you need persistent logging, use the logger (`src/lib/log.ts`).
- Linter is configured to flag `console.log`. Do not disable.

---

*End of code-style.md*
