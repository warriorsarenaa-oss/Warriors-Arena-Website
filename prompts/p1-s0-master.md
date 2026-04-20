# Phase 1 — Master Sprint Prompt

> This is the single prompt you give Antigravity (or any agentic coding tool) to begin Phase 1. It establishes context, loads the rules, and points to the individual sprint prompts that follow.

---

## Initial Prompt (paste this at the start of a fresh Antigravity session)

```
We are building Warriors Arena — a booking system for a laser tag and gel blasters venue in Heliopolis, Cairo.

Phase 0 is complete. The repository has:
- AGENTS.md (read this first, every session)
- .agent/rules/ (load all files; they are constraints, not guidance)
- docs/architecture-v1.1.md (the authoritative spec)
- supabase/migrations/ (schema applied)
- supabase/seed/ (reference data loaded)
- content/en/ and content/ar/ (FAQ, landing, terms drafts)

Your first task:
1. Read AGENTS.md in full.
2. Read each file in .agent/rules/.
3. Read docs/architecture-v1.1.md sections 1, 2, 3, 4, 5, 7, 10.
4. Confirm understanding by summarizing (in 10 lines or less):
   - What we are building
   - The three booking statuses in v1
   - The slot exclusivity rule (BR-SLOT-06)
   - The atomic booking creation pattern
   - The two pricing modes for bundles

Do not write any code yet. After your summary, I will give you the Sprint 1 prompt.

Before you start, note:
- Time display is 12-hour AM/PM. Storage is 24-hour ISO.
- Slot exclusivity is venue-wide, not per game.
- v1 has three statuses only: confirmed, completed, cancelled.
- All business config lives in the database.
- Every state change writes to audit_log.

Begin.
```

---

## Sprint Sequence

Phase 1 is built in 8 sprints. Do them in order. Each sprint has its own prompt file in `prompts/`.

| # | Sprint | Prompt File | Target |
|---|--------|-------------|--------|
| 1 | Core backend: Supabase clients, env, auth middleware, i18n | `prompts/p1-s1-backend-foundation.md` | Foundation that every other sprint uses |
| 2 | Public API: games, bundles, availability, booking creation | `prompts/p1-s2-public-api.md` | Booking engine backend |
| 3 | Public UI: landing page | `prompts/p1-s3-landing-page.md` | Converting visitors |
| 4 | Public UI: booking wizard (5 steps + success) | `prompts/p1-s4-booking-wizard.md` | The conversion flow |
| 5 | Receipt PDF via Puppeteer | `prompts/p1-s5-receipt-pdf.md` | Post-booking artifact |
| 6 | Admin UI: login, password change, reservation center, revenue | `prompts/p1-s6-admin-core.md` | Operational visibility |
| 7 | Admin UI: pricing, games, bundles, users, expenses, hours, audit | `prompts/p1-s7-admin-management.md` | Full operational control |
| 8 | Meta Pixel + CAPI + security review + launch checklist | `prompts/p1-s8-launch-prep.md` | Go-live |

---

## Working Rules For Every Sprint

Tell Antigravity these rules at the start of each sprint:

1. **Plan before coding.** State what files you will create/modify and why. Wait for approval if touching Critical areas (see AGENTS.md Working Mode table).
2. **No truncation.** Output complete files, never snippets with "rest unchanged".
3. **Verify imports.** Every `import` must resolve to a real file.
4. **ASCII quotes only.** Never smart quotes in code.
5. **Re-fetch after mutation.** Never show stale state.
6. **Test the sprint's exit criteria** before declaring complete.

---

*End of Phase 1 Master Prompt*
