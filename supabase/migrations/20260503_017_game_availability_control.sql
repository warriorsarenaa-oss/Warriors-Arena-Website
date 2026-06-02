-- Game availability by day of week
CREATE TABLE IF NOT EXISTS game_day_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sun, 6=Sat
  is_available BOOLEAN DEFAULT true,
  UNIQUE (game_id, day_of_week)
);

-- Game availability overrides by specific date
CREATE TABLE IF NOT EXISTS game_date_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_available BOOLEAN NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (game_id, override_date)
);

-- Seed: Both games available all days by default
INSERT INTO game_day_availability (game_id, day_of_week, is_available)
SELECT g.id, d.day, true
FROM games g
CROSS JOIN generate_series(0, 6) d(day)
ON CONFLICT DO NOTHING;
