-- Seed: Reference Data
-- Author: Warriors Arena
-- Notes: Run AFTER all migrations. Idempotent via ON CONFLICT.

-- ============================================
-- Roles
-- ============================================
INSERT INTO roles (name, description) VALUES
  ('super_admin', 'Owner. Full access including user management, commissions, audit log.'),
  ('manager',     'Venue manager. Operational access. Cannot create super-admins.'),
  ('staff',       'Shift worker. Can create/manage bookings, view own commission.'),
  ('viewer',      'Read-only. For accountants and investors.')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- Permissions
-- ============================================
INSERT INTO permissions (key, description) VALUES
  ('view_bookings',       'View reservation list and details'),
  ('create_booking',      'Create manual bookings'),
  ('cancel_booking',      'Cancel bookings'),
  ('view_revenue',        'View revenue dashboard'),
  ('view_financials',     'View P&L, expenses, salaries'),
  ('manage_financials',   'Create/edit expenses and salary payments'),
  ('manage_bundles',      'Create/edit bundles'),
  ('manage_games',        'Create/edit/deactivate game types'),
  ('manage_pricing',      'Update per-game pricing'),
  ('manage_hours',        'Update operating hours and date overrides'),
  ('manage_users',        'Create/edit/deactivate staff accounts'),
  ('export_data',         'Export reservation data to Excel'),
  ('view_audit',          'View audit log')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Role → Permission mappings
-- ============================================

-- super_admin: all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'super_admin'
ON CONFLICT DO NOTHING;

-- manager: everything except view_audit (partial — managers get 30-day via runtime check) and cannot manage_games
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'manager'
  AND p.key IN (
    'view_bookings', 'create_booking', 'cancel_booking',
    'view_revenue', 'view_financials', 'manage_financials',
    'manage_bundles', 'manage_pricing', 'manage_hours',
    'manage_users', 'export_data', 'view_audit'
  )
ON CONFLICT DO NOTHING;

-- staff: booking operations, no financials, no management
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'staff'
  AND p.key IN (
    'view_bookings', 'create_booking', 'cancel_booking', 'view_revenue'
  )
ON CONFLICT DO NOTHING;

-- viewer: read-only financial and revenue visibility
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r CROSS JOIN permissions p
WHERE r.name = 'viewer'
  AND p.key IN (
    'view_bookings', 'view_revenue', 'view_financials', 'export_data'
  )
ON CONFLICT DO NOTHING;

-- ============================================
-- Expense Categories (D15 seeds, is_system = true)
-- ============================================
INSERT INTO expense_categories (name, display_order, is_system, is_active) VALUES
  ('Rent / Lease',                    10,  true, true),
  ('Electricity',                     20,  true, true),
  ('Water',                           30,  true, true),
  ('Internet & Phone',                40,  true, true),
  ('Gel Balls / Ammunition',          50,  true, true),
  ('Laser Tag Equipment Maintenance', 60,  true, true),
  ('Cleaning Supplies',               70,  true, true),
  ('Staff Snacks / Refreshments',     80,  true, true),
  ('Marketing / Ads',                 90,  true, true),
  ('Repairs & Maintenance',           100, true, true),
  ('Insurance',                       110, true, true),
  ('Park Fees / Permits',             120, true, true),
  ('Equipment Purchase',              130, true, true),
  ('Software Subscriptions',          140, true, true),
  ('Other',                           999, true, true)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- System Settings
-- ============================================
INSERT INTO system_settings (key, value, description) VALUES
  ('deposit_percentage',
   '{"percentage": 25.00}'::jsonb,
   '25% deposit required to hold reservation.'),

  ('deposit_hold_minutes',
   '{"minutes": 120}'::jsonb,
   'How long to hold a pending_deposit booking before auto-cancel. v1.1+.'),

  ('cancellation_window_hours',
   '{"hours": 6}'::jsonb,
   'Hours before slot start during which customers may self-cancel. v1.1+.'),

  ('whatsapp_number',
   '{"number": "+201000000000"}'::jsonb,
   'WhatsApp business number. UPDATE THIS before launch.'),

  ('instapay_identifier',
   '{"identifier": "warriors@instapay"}'::jsonb,
   'InstaPay handle for deposits. UPDATE THIS before launch.'),

  ('park_entry_fee_regular',
   '{"amount": 30.00, "currency": "EGP"}'::jsonb,
   'Park entrance fee per person on regular days.'),

  ('park_entry_fee_holiday',
   '{"amount": 50.00, "currency": "EGP"}'::jsonb,
   'Park entrance fee per person on holidays.'),

  ('contact_phone',
   '{"number": "+201000000000"}'::jsonb,
   'Primary contact phone number. UPDATE THIS before launch.'),

  ('contact_email',
   '{"email": "hello@warriorsarena.example"}'::jsonb,
   'Primary contact email. UPDATE THIS before launch.'),

  ('default_commission_percentage',
   '{"percentage": 5.00}'::jsonb,
   'Default commission rate suggested when creating a new staff user.')
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- Default Operating Hours (6 PM to 9 PM)
-- ============================================
INSERT INTO operating_hours (scope, open_time, close_time, is_closed)
VALUES ('default', '18:00'::time, '21:00'::time, false)
ON CONFLICT DO NOTHING;

-- ============================================
-- Initial Games (Laser Tag + Gel Blasters)
-- ============================================
INSERT INTO games (slug, name_en, name_ar, description_en, description_ar, display_order, is_active) VALUES
  ('laser_tag',
   'Laser Tag',
   'ليزر تاغ',
   'High-energy tactical combat with infrared laser gear. Safe for all ages. Perfect for groups and parties.',
   'قتال تكتيكي عالي الحماس باستخدام أجهزة الأشعة تحت الحمراء. آمن لجميع الأعمار. مثالي للمجموعات والحفلات.',
   10,
   true),

  ('gel_blasters',
   'Gel Blasters',
   'جيل بلاسترز',
   'Fast-paced action with soft, water-based gel projectiles. Full protective gear provided. More intense than laser, less painful than paintball.',
   'حركة سريعة بمقذوفات جل ناعمة مائية. معدات وقائية كاملة. أكثر إثارة من الليزر وأقل إيلامًا من البينت بول.',
   20,
   true)
ON CONFLICT (slug) DO NOTHING;

-- ============================================
-- Initial Game Pricing
-- ============================================
INSERT INTO game_pricing (game_id, duration_minutes, price_per_player, is_active)
SELECT g.id, 30, 150.00, true FROM games g WHERE g.slug = 'laser_tag'
ON CONFLICT DO NOTHING;

INSERT INTO game_pricing (game_id, duration_minutes, price_per_player, is_active)
SELECT g.id, 60, 300.00, true FROM games g WHERE g.slug = 'laser_tag'
ON CONFLICT DO NOTHING;

INSERT INTO game_pricing (game_id, duration_minutes, price_per_player, is_active)
SELECT g.id, 30, 100.00, true FROM games g WHERE g.slug = 'gel_blasters'
ON CONFLICT DO NOTHING;

-- Note: Gel Blasters 60-min is not offered initially. Admin can add later via UI.

-- ============================================
-- Verify seeds
-- ============================================
DO $$
DECLARE
  v_roles        INT;
  v_perms        INT;
  v_rp           INT;
  v_categories   INT;
  v_settings     INT;
  v_hours        INT;
  v_games        INT;
  v_pricing      INT;
BEGIN
  SELECT count(*) INTO v_roles FROM roles;
  SELECT count(*) INTO v_perms FROM permissions;
  SELECT count(*) INTO v_rp FROM role_permissions;
  SELECT count(*) INTO v_categories FROM expense_categories WHERE is_system = true;
  SELECT count(*) INTO v_settings FROM system_settings;
  SELECT count(*) INTO v_hours FROM operating_hours WHERE scope = 'default';
  SELECT count(*) INTO v_games FROM games;
  SELECT count(*) INTO v_pricing FROM game_pricing WHERE is_active = true;

  RAISE NOTICE 'Seed verification:';
  RAISE NOTICE '  roles: %', v_roles;
  RAISE NOTICE '  permissions: %', v_perms;
  RAISE NOTICE '  role_permissions: %', v_rp;
  RAISE NOTICE '  system expense_categories: %', v_categories;
  RAISE NOTICE '  system_settings: %', v_settings;
  RAISE NOTICE '  default operating_hours: %', v_hours;
  RAISE NOTICE '  games: %', v_games;
  RAISE NOTICE '  active game_pricing rows: %', v_pricing;

  IF v_roles < 4 OR v_perms < 13 OR v_categories < 15 OR v_settings < 10 OR v_hours < 1 THEN
    RAISE EXCEPTION 'Seed verification failed. Expected counts not met.';
  END IF;
END $$;
