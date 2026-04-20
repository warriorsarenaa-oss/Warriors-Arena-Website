-- Migration 004: Games and Pricing
-- Author: Warriors Arena
-- Notes: Games are referenced by ID throughout the system. Pricing is per-game per-duration.

-- ============================================
-- games
-- ============================================
CREATE TABLE games (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug            TEXT UNIQUE NOT NULL,
  name_en         TEXT NOT NULL,
  name_ar         TEXT NOT NULL,
  description_en  TEXT,
  description_ar  TEXT,
  icon_url        TEXT,
  hero_image_url  TEXT,
  display_order   INT NOT NULL DEFAULT 0,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_games_active_order ON games(is_active, display_order) WHERE is_active = true;

CREATE TRIGGER trg_games_updated_at
  BEFORE UPDATE ON games
  FOR EACH ROW EXECUTE FUNCTION fn_set_updated_at();

COMMENT ON TABLE games IS 'Game types. Adding a new game requires only a row insert; zero code changes.';

-- ============================================
-- game_pricing
-- ============================================
CREATE TABLE game_pricing (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id           UUID NOT NULL REFERENCES games(id) ON DELETE RESTRICT,
  duration_minutes  INT NOT NULL CHECK (duration_minutes IN (30, 60)),
  price_per_player  NUMERIC(10,2) NOT NULL CHECK (price_per_player > 0),
  currency          TEXT NOT NULL DEFAULT 'EGP',
  is_active         BOOLEAN NOT NULL DEFAULT true,
  effective_from    TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_game_pricing_active_unique
  ON game_pricing(game_id, duration_minutes)
  WHERE is_active = true;

CREATE INDEX idx_game_pricing_game_id ON game_pricing(game_id);

COMMENT ON TABLE game_pricing IS 'Per-game, per-duration pricing. Only one active price per (game, duration). Historical rows kept for audit.';

-- ============================================
-- RLS — public read, no public write
-- ============================================
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY games_anon_read ON games
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY games_authenticated_read ON games
  FOR SELECT TO authenticated USING (true);

ALTER TABLE game_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY game_pricing_anon_read ON game_pricing
  FOR SELECT TO anon USING (is_active = true);
CREATE POLICY game_pricing_authenticated_read ON game_pricing
  FOR SELECT TO authenticated USING (true);
