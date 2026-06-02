-- Migration 002: Shared Utility Functions
-- Author: Warriors Arena
-- Notes: Helpers used by other migrations. Idempotent.

-- Auto-update updated_at on row update
CREATE OR REPLACE FUNCTION fn_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION fn_set_updated_at IS 'Trigger function: sets updated_at to now() on UPDATE.';
