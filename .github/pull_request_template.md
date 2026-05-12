## Summary

<!-- What does this PR do? One paragraph max. -->

## Type of Change

- [ ] Bug fix (non-breaking)
- [ ] New feature (non-breaking)
- [ ] Breaking change (API, schema, or behavior change)
- [ ] Refactor / tech debt
- [ ] Docs / config only

## Testing

<!-- How was this tested? Check all that apply. -->

- [ ] Unit tests added / updated (`npm test`)
- [ ] Manual test on local dev server
- [ ] Tested on mobile viewport (≤ 390px)
- [ ] Tested with Arabic locale (`?lang=ar`)
- [ ] Tested with an inactive / low-permission user account

## Database Changes

<!-- If this PR touches Supabase: -->

- [ ] No schema changes
- [ ] Migration file added under `supabase/migrations/`
- [ ] RLS policies reviewed / updated
- [ ] No breaking changes to existing columns

## Checklist

- [ ] ESLint passes with zero errors (`npm run lint`)
- [ ] TypeScript passes with zero errors (`npx tsc --noEmit`)
- [ ] No `console.log` left in production code (only `console.warn` / `console.error` allowed)
- [ ] No raw `error.message` returned to API clients
- [ ] Audit log written for any state-changing admin action
- [ ] `CLAUDE.md` / `AGENTS.md` updated if conventions changed

## Screenshots (if UI change)

<!-- Before / After screenshots or a Loom recording. -->
