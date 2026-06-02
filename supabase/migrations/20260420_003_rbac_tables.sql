-- Migration 003: RBAC Tables (roles, permissions, role_permissions, users)
-- Author: Warriors Arena
-- Notes: Created early because most other tables FK to users.

-- ============================================
-- roles
-- ============================================
CREATE TABLE roles (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE roles IS 'RBAC roles. Seeded: super_admin, manager, staff, viewer.';

-- ============================================
-- permissions
-- ============================================
CREATE TABLE permissions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key         TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE permissions IS 'RBAC permission definitions. See seed for full list.';

-- ============================================
-- role_permissions
-- ============================================
CREATE TABLE role_permissions (
  role_id       UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (role_id, permission_id)
);

COMMENT ON TABLE role_permissions IS 'Many-to-many: which permissions each role has.';

-- ============================================
-- users
-- ============================================
CREATE TABLE users (
  id                       UUID PRIMARY KEY,  -- maps to Supabase Auth user id
  email                    CITEXT UNIQUE NOT NULL,
  username                 TEXT UNIQUE NOT NULL,
  full_name                TEXT NOT NULL,
  phone                    TEXT,
  role_id                  UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
  worker_code              TEXT UNIQUE,
  commission_percentage    NUMERIC(5,2) NOT NULL DEFAULT 0
                           CHECK (commission_percentage >= 0 AND commission_percentage <= 100),
  fixed_monthly_salary     NUMERIC(10,2) NOT NULL DEFAULT 0
                           CHECK (fixed_monthly_salary >= 0),
  is_active                BOOLEAN NOT NULL DEFAULT true,
  must_change_password     BOOLEAN NOT NULL DEFAULT true,
  last_login_at            TIMESTAMPTZ,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_users_role_id ON users(role_id);
CREATE INDEX idx_users_is_active ON users(is_active) WHERE is_active = true;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE users IS 'Admin/staff accounts. Customers are NOT users; they live inside bookings.';
COMMENT ON COLUMN users.must_change_password IS 'When true, user must change password on next login.';

-- ============================================
-- RLS
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
-- No policies = service role only access. UI reads via service-role API routes.

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
-- Allow authenticated reads of roles (for role picker)
CREATE POLICY roles_authenticated_read ON roles
  FOR SELECT TO authenticated USING (true);

ALTER TABLE permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY permissions_authenticated_read ON permissions
  FOR SELECT TO authenticated USING (true);

ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY role_permissions_authenticated_read ON role_permissions
  FOR SELECT TO authenticated USING (true);
