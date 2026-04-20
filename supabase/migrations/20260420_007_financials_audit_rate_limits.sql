-- Migration 007: Financials, Audit Log, Rate Limits
-- Author: Warriors Arena
-- Notes: Supporting tables for operations.

-- ============================================
-- expense_categories
-- ============================================
CREATE TABLE expense_categories (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT UNIQUE NOT NULL,
  display_order       INT NOT NULL DEFAULT 0,
  is_system           BOOLEAN NOT NULL DEFAULT false,
  is_active           BOOLEAN NOT NULL DEFAULT true,
  created_by_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expense_categories_active_order
  ON expense_categories(is_active, display_order)
  WHERE is_active = true;

COMMENT ON TABLE expense_categories IS 'Expense categories. System seeds cannot be deleted but can be deactivated. Admin can add custom categories.';

ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY expense_categories_authenticated_read ON expense_categories
  FOR SELECT TO authenticated USING (true);

-- ============================================
-- expenses
-- ============================================
CREATE TABLE expenses (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title                   TEXT NOT NULL CHECK (length(trim(title)) > 0),
  category_id             UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  amount                  NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  currency                TEXT NOT NULL DEFAULT 'EGP',
  expense_date            DATE NOT NULL,
  notes                   TEXT,
  created_by_user_id      UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  reversed_by_expense_id  UUID REFERENCES expenses(id) ON DELETE SET NULL,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_creator ON expenses(created_by_user_id);

COMMENT ON TABLE expenses IS 'Append-only expense records. Soft-delete via reversing entry, never hard DELETE.';

ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
-- Service role only. Reads go through permission-checked API.

-- ============================================
-- worker_salary_payments
-- ============================================
CREATE TABLE worker_salary_payments (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  pay_period_month      INT NOT NULL CHECK (pay_period_month BETWEEN 1 AND 12),
  pay_period_year       INT NOT NULL CHECK (pay_period_year BETWEEN 2020 AND 2100),
  fixed_salary_amount   NUMERIC(10,2) NOT NULL CHECK (fixed_salary_amount >= 0),
  commission_amount     NUMERIC(10,2) NOT NULL CHECK (commission_amount >= 0),
  total_paid            NUMERIC(10,2) GENERATED ALWAYS AS (fixed_salary_amount + commission_amount) STORED,
  paid_at               TIMESTAMPTZ,
  notes                 TEXT,
  created_by_user_id    UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),

  UNIQUE (user_id, pay_period_month, pay_period_year)
);

CREATE INDEX idx_salary_payments_user ON worker_salary_payments(user_id);
CREATE INDEX idx_salary_payments_period ON worker_salary_payments(pay_period_year, pay_period_month);

COMMENT ON TABLE worker_salary_payments IS 'Monthly salary + commission payout records per worker.';

ALTER TABLE worker_salary_payments ENABLE ROW LEVEL SECURITY;

-- ============================================
-- audit_log
-- ============================================
CREATE TABLE audit_log (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  actor_email    TEXT NOT NULL,
  action         TEXT NOT NULL,
  entity_type    TEXT NOT NULL,
  entity_id      UUID,
  before_state   JSONB,
  after_state    JSONB,
  ip_address     TEXT,
  user_agent     TEXT,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id, created_at DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor_user_id, created_at DESC);
CREATE INDEX idx_audit_created ON audit_log(created_at DESC);

COMMENT ON TABLE audit_log IS 'Immutable log of every state-changing admin action. Retention: minimum 2 years.';

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- rate_limit_buckets
-- ============================================
CREATE TABLE rate_limit_buckets (
  bucket_key   TEXT PRIMARY KEY,
  tokens       INT NOT NULL,
  last_refill  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE rate_limit_buckets IS 'Sliding-window rate limit state. Key format: {scope}:{identifier}:{action}.';

ALTER TABLE rate_limit_buckets ENABLE ROW LEVEL SECURITY;
