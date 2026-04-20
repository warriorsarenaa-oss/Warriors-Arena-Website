# Phase 0 Setup Runbook

> Step-by-step instructions for wiring up the Warriors Arena codebase infrastructure. Follow top to bottom. Each step has a verification line — if that fails, stop and fix before continuing.

**Estimated time:** 2–4 hours for someone familiar with the stack, more if learning along the way.

**Prerequisites confirmed:**
- GitHub account
- Vercel account
- Supabase account
- Sentry account
- Node.js 20+ installed locally
- Git installed locally

---

## Step 1 — Initialize the Next.js project

```bash
npx create-next-app@latest warriors-arena \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint  # we'll configure our own
cd warriors-arena
```

When prompted for Turbopack, say No (stability over speed for this project).

**Verify:** `npm run dev` starts the server and `http://localhost:3000` shows the Next.js welcome page.

---

## Step 2 — Copy Phase 0 Package Files Into Repo

Unzip the Phase 0 package at the repo root. You should now have:

```
warriors-arena/
├── AGENTS.md
├── CLAUDE.md
├── .agent/                    # Rules, skills, agents
├── .env.local.example
├── .gitignore                 # Replace the default one
├── docs/                      # Has architecture-v1.1.md
├── supabase/                  # Has migrations + seed
├── content/                   # FAQ, landing, terms in EN + AR
├── prompts/                   # Phase 1 prompts (used next)
└── (Next.js files)
```

Replace the default `.gitignore` with the one from the package.

**Verify:** `ls -la` shows `.agent/` directory and `AGENTS.md` at the root.

---

## Step 3 — Install Core Dependencies

```bash
npm install \
  @supabase/supabase-js \
  @supabase/ssr \
  zod \
  date-fns \
  date-fns-tz \
  next-intl \
  framer-motion

npm install -D \
  @types/node \
  eslint \
  eslint-config-next \
  prettier \
  @playwright/test \
  vitest \
  @vitest/ui
```

**Verify:** `npm ls` shows all packages. No peer dependency warnings that matter.

---

## Step 4 — Set Up Supabase Projects

### 4a. Create production project
1. Dashboard → New Project
2. Name: `warriors-arena-prod`
3. Region: `eu-central-1` (Frankfurt — closest to Egypt)
4. Strong DB password — save in password manager
5. Wait for provisioning (~2 min)

### 4b. Create staging project
1. Repeat the above with name `warriors-arena-staging`

### 4c. Get credentials for both
Settings → API:
- Project URL
- anon public key
- service_role key (secret — never expose client-side)

Settings → Database → Connection string:
- Copy the direct connection URL

**Verify:** You can open the SQL editor in each project.

---

## Step 5 — Configure Environment Variables

### 5a. Local development

```bash
cp .env.local.example .env.local
```

Fill in `.env.local` with your **staging** Supabase credentials (never production for local dev).

### 5b. Vercel project

1. Vercel Dashboard → Add New Project → Import from GitHub (link your repo)
2. Do NOT deploy yet — click Environment Variables
3. For each variable in `.env.local.example`, add it in Vercel:
   - Production scope: production Supabase credentials
   - Preview scope: staging Supabase credentials
   - Development scope: staging Supabase credentials
4. Save

**Verify:** Vercel → Settings → Environment Variables shows all required keys across all scopes.

---

## Step 6 — Install Supabase CLI and Link Projects

```bash
npm install -g supabase
supabase login
```

Link the repo to production:
```bash
supabase link --project-ref <YOUR_PROD_PROJECT_REF>
```

(The `project_ref` is the subdomain in your Supabase URL: `https://<project_ref>.supabase.co`)

**Verify:** `supabase projects list` shows your project as linked.

---

## Step 7 — Run Migrations On Staging

```bash
# Link to staging first
supabase link --project-ref <YOUR_STAGING_PROJECT_REF>

# Run all migrations
supabase db push
```

If anything fails, fix the migration and re-run. Migrations are idempotent via `CREATE ... IF NOT EXISTS` and `ON CONFLICT DO NOTHING` in seeds.

**Verify in Supabase SQL editor:**
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
```

Expect to see: `audit_log`, `booking_slots`, `bookings`, `bundles`, `expense_categories`, `expenses`, `game_pricing`, `games`, `operating_hours`, `permissions`, `rate_limit_buckets`, `role_permissions`, `roles`, `system_settings`, `users`, `worker_salary_payments`.

---

## Step 8 — Run Seed On Staging

In the Supabase SQL editor for your staging project, open `supabase/seed/001_reference_data.sql` and run it.

You should see the `RAISE NOTICE` output at the end confirming seed counts.

**Verify:**
```sql
SELECT (SELECT count(*) FROM roles) AS roles,
       (SELECT count(*) FROM permissions) AS perms,
       (SELECT count(*) FROM expense_categories WHERE is_system = true) AS cats,
       (SELECT count(*) FROM games) AS games,
       (SELECT count(*) FROM game_pricing WHERE is_active = true) AS pricing,
       (SELECT count(*) FROM operating_hours) AS hours;
-- Expect: 4, 13, 15, 2, 3, 1
```

---

## Step 9 — Create The Super Admin User

Follow `supabase/seed/002_super_admin_instructions.sql`:

1. Supabase Dashboard → Authentication → Users → Add User
   - Email: (your real email for Youssef, or a placeholder like `youssef@warriorsarena.example`)
   - Password: `Warriors@26`
   - Check "Auto Confirm Email"
2. Copy the new user's UUID from the Users list.
3. In SQL editor, run the INSERT from that file, replacing `<AUTH_USER_ID>` with the UUID.

**Verify:**
```sql
SELECT u.username, u.email, r.name AS role, u.must_change_password
FROM users u
JOIN roles r ON u.role_id = r.id
WHERE u.username = 'warriors_admin';
-- Expect: warriors_admin | <email> | super_admin | true
```

---

## Step 10 — Repeat Migrations + Seed + Super Admin On Production

When ready to touch production, repeat steps 7–9 against the production Supabase project.

**Safety tip:** Keep production untouched until Phase 1 is well underway. Do all development against staging.

---

## Step 11 — Create Health Check Endpoint

Create `src/app/api/health/route.ts`:

```typescript
import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    status: "ok",
    timestamp: new Date().toISOString(),
  });
}
```

**Verify:** `curl http://localhost:3000/api/health` returns `{"status":"ok",...}`.

---

## Step 12 — Environment Validation Module

Create `src/lib/env.ts` following the pattern in `.agent/rules/security.md` R-SEC-02.

The module should:
- Import Zod
- Define a schema covering all v1 required env vars
- Make v1.1+ vars optional
- Parse `process.env` at import time
- Export a typed `env` object

Import `env` once in `next.config.js` to force validation at boot.

**Verify:** Rename `.env.local` to `.env.local.backup` temporarily, try to start the dev server — it should fail with a clear error naming missing variables. Restore the file when confirmed.

---

## Step 13 — Initialize Sentry

```bash
npx @sentry/wizard@latest -i nextjs
```

Follow the wizard. When asked:
- Create a new project in Sentry
- Skip source map upload config for now (enable in Phase 2)

**Verify:** `npm run dev`, visit a nonexistent route like `/trigger-404`, check Sentry dashboard for captured error.

---

## Step 14 — Supabase Client Modules

Create the two required client modules:

`src/lib/db/supabase-anon.ts` — Anon client (public reads)
`src/lib/db/supabase-service.ts` — Service-role client (server-only)

Follow R-ARCH-09 strictly:
- The service module must include a top-of-file comment warning it is server-only
- Add a runtime check that throws if imported in a browser context

**Verify:** You can read from `games` table using the anon client via a simple test script.

---

## Step 15 — i18n Scaffold

Initialize `next-intl`:

```bash
npm install next-intl
```

Create:
- `src/i18n/config.ts` — locale config (en, ar)
- `src/messages/en.json` — stub with a few keys from `content/en/landing.md`
- `src/messages/ar.json` — stub with a few keys from `content/ar/landing.md`
- `src/middleware.ts` — locale detection

Configure `next.config.js` with the `next-intl` plugin.

**Verify:** Visit `/en` and `/ar` in the browser; both should render (even if mostly empty).

---

## Step 16 — Git Initial Commit

```bash
git add .
git commit -m "Phase 0: foundation setup

- Project scaffold with Next.js 15 + TypeScript + Tailwind
- AGENTS.md, CLAUDE.md, .agent/ rules and skills
- Supabase migrations and seed applied to staging
- Super admin user created (must_change_password = true)
- Environment validation, Sentry, i18n scaffolded
- Health check endpoint live"

git push origin main
```

**Verify:**
- GitHub repo shows all files
- Vercel auto-deploys
- Staging URL serves the home page
- `/api/health` returns OK on staging

---

## Step 17 — Configure Vercel Cron (Phase 0 stub)

Create `vercel.json` at repo root:

```json
{
  "crons": [
    {
      "path": "/api/cron/mark-completed-bookings",
      "schedule": "*/10 * * * *"
    }
  ]
}
```

Create a stub cron endpoint `src/app/api/cron/mark-completed-bookings/route.ts` that:
- Validates `CRON_SECRET` header
- Calls the `fn_complete_bookings_due` Supabase RPC
- Returns count

Do not wire real behavior yet — just the scaffold.

**Verify:** `curl -H "Authorization: Bearer $CRON_SECRET" https://<staging-url>/api/cron/mark-completed-bookings` returns a JSON response.

---

## Step 18 — Run The Final Phase 0 Checklist

From `docs/architecture-v1.1.md` Section 11.7:

- [x] Repo created on GitHub with structure
- [x] `CLAUDE.md` and `AGENTS.md` in place
- [x] `.agent/rules/*.md` files in place
- [x] `.env.local.example` created
- [x] `.gitignore` complete
- [x] Vercel project linked
- [x] Supabase production + staging projects linked
- [x] Sentry project linked
- [x] Boot-time env validation tested
- [x] Database migrations applied
- [x] Seed data loaded
- [x] Supabase Auth configured with super_admin
- [x] Tailwind + next-intl + base layout scaffolded
- [x] Health check endpoint live
- [x] First deploy reaches staging URL

**Phase 0 exit criteria met.** You can now begin Phase 1.

---

## Common Pitfalls

### "Migration failed: relation already exists"
You ran the same migration twice. The schema migrations are not all fully idempotent — drop the test DB and re-run if necessary, or fix the specific migration to use `CREATE TABLE IF NOT EXISTS`.

### "Function fn_set_updated_at() does not exist"
You ran a later migration before migration 002. Run them in order.

### "Row-level security policy ... already exists"
Same as above but for RLS policies. Drop the old policies first: `DROP POLICY IF EXISTS policy_name ON table_name;`

### "Initial super admin can't log in"
Check:
1. Did you create them via Supabase Auth → Users (not just the `users` table)?
2. Did "Auto Confirm Email" get checked?
3. Does the `users.id` match the Supabase Auth UUID exactly?

### Vercel build fails with env var missing
You didn't set all variables in all scopes. Check production / preview / development all have them.

### Sentry is silent
Client-side errors need `NEXT_PUBLIC_SENTRY_DSN` set (public var). Server-side needs `SENTRY_DSN`. Yes, both, with the same value.

---

*End of Phase 0 Runbook. Ready for Phase 1.*
