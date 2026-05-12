-- SPRINT 3: Gel Blasters Ammo System + Refills

-- 1. Update game_pricing table structure
ALTER TABLE game_pricing
ADD COLUMN IF NOT EXISTS pricing_type TEXT DEFAULT 'time' 
  CHECK (pricing_type IN ('time', 'ammo')),
ADD COLUMN IF NOT EXISTS ammo_count INTEGER,
ADD COLUMN IF NOT EXISTS duration_minutes_display TEXT;

-- 2. Update bookings table structure
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS ammo_package INTEGER,
ADD COLUMN IF NOT EXISTS ammo_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS refills JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS total_refill_cost NUMERIC(10,2) DEFAULT 0;

-- 3. Create booking_refills table
CREATE TABLE IF NOT EXISTS booking_refills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  booking_code TEXT NOT NULL,
  player_count INTEGER NOT NULL,
  ammo_per_player INTEGER DEFAULT 400,
  price_per_player NUMERIC(10,2) DEFAULT 50,
  total_cost NUMERIC(10,2) NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  added_by UUID REFERENCES auth.users(id)
);

-- 4. Create refill_packages table
CREATE TABLE IF NOT EXISTS refill_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,
  ammo_count INTEGER NOT NULL,
  price_per_player NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true
);

-- 5. Data Migration: Update Gel Blasters to Ammo-based pricing
-- Use the ID found: 76eadc2a-7c52-43e7-ac7c-213ff3bc7f6e
DELETE FROM game_pricing WHERE game_id = '76eadc2a-7c52-43e7-ac7c-213ff3bc7f6e';

INSERT INTO game_pricing (game_id, pricing_type, ammo_count, price_per_player, duration_minutes, duration_minutes_display) 
VALUES
  ('76eadc2a-7c52-43e7-ac7c-213ff3bc7f6e', 'ammo', 400, 100, 30, '30 min limit'),
  ('76eadc2a-7c52-43e7-ac7c-213ff3bc7f6e', 'ammo', 800, 150, 60, '60 min limit');

-- 6. Insert default refill package for Gel Blasters
INSERT INTO refill_packages (game_id, ammo_count, price_per_player)
SELECT id, 400, 50 FROM games WHERE name_en ILIKE '%gel%'
ON CONFLICT DO NOTHING;

-- 7. Add index for performance
CREATE INDEX IF NOT EXISTS idx_booking_refills_booking_id ON booking_refills(booking_id);
