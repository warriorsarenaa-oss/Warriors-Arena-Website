# Security Rules

> Security guardrails. These cannot be relaxed for convenience or speed.

## R-SEC-01: Secrets Never In Code

- All secrets (API keys, DB credentials, signing keys, webhook secrets) live in `.env.local` (gitignored) and Vercel environment variables.
- `.env.local.example` shows variable names and shape, never values.
- Never paste real secrets into prompts, comments, commit messages, logs, or test fixtures.
- If a secret accidentally enters the codebase, rotate it immediately and assume it is compromised.

## R-SEC-02: Boot-Time Environment Validation

The application validates required environment variables at startup using Zod.

- Missing variables cause the app to fail to boot, with a clear error message naming the missing variable.
- Never silently fall back to localhost, default values, or empty strings.
- The validation runs once on cold start and the parsed env is exported as a typed object — code accesses env via the typed export, never via `process.env.X` directly.

Example pattern:

```typescript
// src/lib/env.ts
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  META_PIXEL_ID: z.string().min(1),
  META_CAPI_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_BUSINESS_NUMBER: z.string().regex(/^\+?\d+$/),
  INSTAPAY_IDENTIFIER: z.string().min(1),
  // ... more
});

export const env = envSchema.parse(process.env);
```

## R-SEC-03: Input Validation At API Boundaries

Every API route validates its input with Zod before processing.

- Validation happens at the route handler entry, before any business logic.
- Rejected requests return HTTP 400 with a structured error response.
- Never trust client-supplied data, including admin-authenticated requests.
- Server-side validation duplicates client-side validation (client validation is UX only).

## R-SEC-04: Parameterized Queries Only

- Use Supabase client methods (`.from(...).select(...)`, `.insert(...)`) which parameterize automatically.
- For raw SQL via `supabase.rpc(...)`, pass parameters as the second argument, never string-concatenate values into SQL.
- If a feature requires dynamic SQL construction (e.g., dynamic column ordering for export), whitelist the allowed values and check them against the whitelist before substituting.

## R-SEC-05: Permission Check On Every Admin Endpoint

The middleware in `src/lib/auth/permission-middleware.ts` runs on every `/api/v1/admin/*` route:

1. Read session cookie.
2. Validate session against Supabase Auth.
3. Look up the user's role and current permissions in DB (do not trust JWT-cached permissions).
4. Compare against the route's required permission.
5. Return 403 if missing.

Conditional permissions (e.g., "staff can cancel only their own bookings") are checked in the route handler after the basic permission check passes.

## R-SEC-06: No Sensitive Data In Logs

Never log:
- Passwords (hashed or plain)
- Auth tokens or session cookies
- Full email addresses (log domain only if needed: `***@example.com`)
- Full phone numbers (log last 4 digits if needed: `***5678`)
- API keys or signing secrets
- Customer payment information
- Full request bodies for auth or booking endpoints

If you need to log for debugging, log the field name and shape, not the value.

## R-SEC-07: HttpOnly Secure Cookies For Sessions

Session cookies must have:
- `httpOnly: true`
- `secure: true` (production; can be false in local dev only)
- `sameSite: "lax"` (or `"strict"` for admin cookies)
- `path: "/"` (or scoped path for admin cookies)
- Reasonable expiry (8h idle, 24h absolute for admin)

## R-SEC-08: Rate Limiting On Public Endpoints

Required limits (enforced via `rate_limit_buckets` table or Upstash Redis):

- `POST /api/v1/bookings`: 5 per IP per hour, 2 per phone per hour
- `GET /api/v1/availability`: 60 per IP per minute
- `POST /api/v1/admin/auth/login`: 5 per IP per 15 minutes, 5 per username per 15 minutes
- All admin endpoints (per authenticated user): 200 per minute

Returning 429 when exceeded, with `Retry-After` header.

## R-SEC-09: ReCAPTCHA Or Equivalent On Public Booking

Public booking creation requires a CAPTCHA token in the request, validated server-side.

- Recommended: Cloudflare Turnstile (free, GDPR-friendly) or hCaptcha.
- Token validation happens before any DB write.

## R-SEC-10: First-Login Forced Password Change

Users with `must_change_password = true` are redirected to the change-password screen on every request until they complete it.

- The middleware enforces this redirect server-side.
- The change-password endpoint validates: minimum 12 chars, mixed case, number, symbol, not in top-1000 common passwords.
- Sets `must_change_password = false` only after successful change.

## R-SEC-11: File Upload Whitelisting

For all file uploads (bundle images, game icons):

- MIME whitelist: `image/jpeg`, `image/png`, `image/webp`, `image/avif`.
- Detect MIME server-side using magic bytes, not just the request `Content-Type` header.
- Max size 5MB enforced at the API layer.
- Filenames sanitized: only alphanumeric + dash + underscore + extension.
- Stored under `/public/uploads/{type}/{slug}-{timestamp}.{ext}` (v1) — never trust client-supplied paths.

## R-SEC-12: PII Handling

- Customer phone and email stored plain (operationally needed).
- Customer data anonymizable on request: replace `customer_name` with "Anonymized", `customer_phone` with "+20000000000", `customer_email` with NULL. Booking financial fields preserved.
- Audit log retention: minimum 2 years.
- Financial record retention: 5 years (Egyptian norm).

## R-SEC-13: Webhook Signature Verification (v1.1+)

When integrating Paymob and WhatsApp webhooks:

- Verify the signature header on every incoming webhook before any business logic.
- Use `crypto.timingSafeEqual()` for signature comparison, never `===`.
- Reject (with 401) any webhook with invalid or missing signature.
- Webhook endpoints are unauthenticated by session but authenticated by signature.

## R-SEC-14: No Bot-Hardened Path Naming

Do not rely on URL obscurity for security.

- Admin path is `/admin`. Predictable. That is fine.
- Real defense: auth, rate limiting, audit logging, 2FA for super-admin (v1.1+).
- Bot scanners scan everything. Obscure URLs do not stop them.

## R-SEC-15: Subagent Security Review Before Launch

Before Phase 1 launch, run a fresh-context security review:

- Spawn a subagent with no prior context.
- Give it only `docs/architecture-v1.1.md`, `.agent/rules/security.md`, and the source code.
- Ask it to identify: missing permission checks, missing audit log writes, missing input validation, secrets in code, broken rate limiting, missing CSRF defense, broken first-login enforcement.
- Address all findings before launch.

## R-SEC-16: No Direct Bookings Table Writes From Anon

The anon Supabase client must never write to `bookings`, `booking_slots`, `users`, `expenses`, `audit_log`, or `worker_salary_payments`.

- RLS policies enforce this.
- Public booking creation goes through `fn_create_booking` SECURITY DEFINER function.
- If you find anon-key writes anywhere, you have made a security mistake.

---

*End of security.md*
