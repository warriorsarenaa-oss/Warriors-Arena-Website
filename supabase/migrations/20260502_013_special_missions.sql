-- Migration 013: Special Missions System
-- Author: Warriors Arena

-- Special Missions Table
CREATE TABLE IF NOT EXISTS special_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_en TEXT NOT NULL,
  name_ar TEXT,
  description_en TEXT,
  description_ar TEXT,
  rules_en TEXT,
  rules_ar TEXT,
  icon TEXT DEFAULT '🎯',
  additional_price_per_player NUMERIC(10,2) DEFAULT 0,
  duration_bonus_minutes INTEGER DEFAULT 0,  -- Extra time added to base game
  compatible_games UUID[],  -- Which game IDs this mission works with (null = all)
  min_players INTEGER DEFAULT 2,
  max_players INTEGER DEFAULT 6,
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link missions to bookings
ALTER TABLE bookings
ADD COLUMN IF NOT EXISTS special_mission_id UUID REFERENCES special_missions(id),
ADD COLUMN IF NOT EXISTS mission_additional_price NUMERIC(10,2) DEFAULT 0;

-- Enable RLS
ALTER TABLE special_missions ENABLE ROW LEVEL SECURITY;

-- Public read access to active special missions
CREATE POLICY "Public read access to active special_missions" ON special_missions
FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin full access to special_missions" ON special_missions
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.id = auth.uid() AND roles.name IN ('admin', 'super_admin')
  )
);

-- Seed example missions
INSERT INTO special_missions (name_en, name_ar, description_en, icon, additional_price_per_player, is_active) VALUES
('Capture the Flag', 'الاستيلاء على العلم', 'Two teams compete to capture the enemy flag and return it to base.', '🚩', 25, true),
('VIP Escort', 'حماية الشخصية المهمة', 'One team protects the VIP while the other tries to eliminate them.', '🛡️', 30, true),
('Bomb Defusal', 'تفكيك القنبلة', 'Counter-terrorism mission: plant or defuse the bomb before time runs out.', '💣', 35, false)
ON CONFLICT DO NOTHING;
