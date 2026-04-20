-- Seed 002: Super Admin User
-- Author: Warriors Arena
--
-- IMPORTANT: This seed is NOT run as plain SQL.
-- Supabase Auth users cannot be created via direct SQL INSERT — they require
-- auth.users to be populated through the Supabase Auth API.
--
-- THE CORRECT WAY TO SEED THE SUPER ADMIN:
--
-- Option A: Supabase Dashboard (one-time, recommended)
--   1. Go to: Supabase Dashboard → Authentication → Users → Add User
--   2. Email: youssef@warriorsarena.example  (or real email)
--   3. Password: Warriors@26
--   4. Check "Auto Confirm Email"
--   5. Create.
--   6. Copy the new user's UUID from the list.
--   7. Run the SQL below, replacing <AUTH_USER_ID> with the copied UUID.
--
-- Option B: Seed script (for CI/staging)
--   Use the Supabase Admin SDK with the service role key:
--
--   import { createClient } from '@supabase/supabase-js';
--   const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);
--   const { data } = await admin.auth.admin.createUser({
--     email: 'youssef@warriorsarena.example',
--     password: 'Warriors@26',
--     email_confirm: true,
--   });
--   // Then run the INSERT below using data.user.id
--
-- In either case, after the auth user exists, run this SQL:

/*
INSERT INTO users (
  id,
  email,
  username,
  full_name,
  role_id,
  commission_percentage,
  fixed_monthly_salary,
  is_active,
  must_change_password
)
SELECT
  '<AUTH_USER_ID>'::UUID,               -- Replace with actual auth.users.id
  'youssef@warriorsarena.example',      -- Replace with real email
  'warriors_admin',
  'Youssef',
  r.id,
  0,
  0,
  true,
  true                                   -- FORCE password change on first login
FROM roles r
WHERE r.name = 'super_admin'
ON CONFLICT (id) DO UPDATE
  SET email = EXCLUDED.email,
      username = EXCLUDED.username,
      full_name = EXCLUDED.full_name,
      role_id = EXCLUDED.role_id,
      is_active = true;
*/

-- After running, verify:
-- SELECT u.username, u.email, r.name AS role, u.must_change_password
-- FROM users u JOIN roles r ON u.role_id = r.id
-- WHERE u.username = 'warriors_admin';
