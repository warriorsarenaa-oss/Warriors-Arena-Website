-- CMS Content Table
CREATE TABLE IF NOT EXISTS cms_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,        -- 'hero', 'lineup', 'protocol', 'gallery', 'faq', 'contact'
  key TEXT NOT NULL,            -- 'slogan', 'subtitle', 'location_badge', etc.
  value_en TEXT,                -- English content
  value_ar TEXT,                -- Arabic content
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'image', 'json', 'number')),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id),
  UNIQUE (section, key)
);

-- Gallery Images Table
CREATE TABLE IF NOT EXISTS gallery_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  alt_en TEXT,
  alt_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMPTZ DEFAULT NOW(),
  uploaded_by UUID REFERENCES auth.users(id)
);

-- FAQ Table
CREATE TABLE IF NOT EXISTS faq_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_en TEXT NOT NULL,
  question_ar TEXT,
  answer_en TEXT NOT NULL,
  answer_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Protocol Steps Table
CREATE TABLE IF NOT EXISTS protocol_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  step_number INTEGER NOT NULL,
  title_en TEXT NOT NULL,
  title_ar TEXT,
  description_en TEXT NOT NULL,
  description_ar TEXT,
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed initial CMS content
INSERT INTO cms_content (section, key, value_en, value_ar, content_type) VALUES
-- Hero Section
('hero', 'location_badge', 'HELIOPOLIS · CAIRO', 'هليوبوليس · القاهرة', 'text'),
('hero', 'slogan_line1', 'LOCK AND LOAD', 'استعد للمعركة', 'text'),
('hero', 'slogan_line2', 'YOUR SQUAD', 'فريقك ينتظر', 'text'),
('hero', 'subtitle', 'Cairo''s most intense tactical arena — laser tag & gel blasters. 30-minute exclusive slots. 6-player squads. No spectators, just warfare.', 'أشرس ساحة تكتيكية في القاهرة — ليزر تاج وجل بلاسترز. جلسات حصرية 30 دقيقة. 6 لاعبين لكل حجز. لا متفرجين، فقط معركة حقيقية.', 'text'),
('hero', 'hero_image_url', '', '', 'image'),
-- Stat Cards
('hero', 'stat1_value', '30 MIN', '30 دقيقة', 'text'),
('hero', 'stat1_label', 'Exclusive slot', 'جلسة حصرية', 'text'),
('hero', 'stat2_value', '6 MAX', '6 كحد أقصى', 'text'),
('hero', 'stat2_label', 'Players per booking', 'لاعب لكل حجز', 'text'),
('hero', 'stat3_value', '2 MODES', 'وضعان', 'text'),
('hero', 'stat3_label', 'Laser · Gel', 'ليزر · جيل', 'text'),
-- Lineup Section
('lineup', 'heading', 'CHOOSE YOUR WEAPON', 'اختر سلاحك', 'text'),
('lineup', 'subheading', 'Two game modes. One winner. Pick your loadout and own the arena.', 'وضعان للعبة. فائز واحد. اختر تجهيزاتك وسيطر على الساحة.', 'text')
ON CONFLICT (section, key) DO NOTHING;

-- Game Stats Update
ALTER TABLE games
ADD COLUMN IF NOT EXISTS stat1_name TEXT DEFAULT 'Intensity',
ADD COLUMN IF NOT EXISTS stat1_value INTEGER DEFAULT 92,
ADD COLUMN IF NOT EXISTS stat2_name TEXT DEFAULT 'Tactical Depth',
ADD COLUMN IF NOT EXISTS stat2_value INTEGER DEFAULT 78,
ADD COLUMN IF NOT EXISTS stat3_name TEXT DEFAULT 'Adrenaline',
ADD COLUMN IF NOT EXISTS stat3_value INTEGER DEFAULT 88,
ADD COLUMN IF NOT EXISTS max_players INTEGER DEFAULT 6,
ADD COLUMN IF NOT EXISTS stat1_name_ar TEXT DEFAULT 'الشدة',
ADD COLUMN IF NOT EXISTS stat2_name_ar TEXT DEFAULT 'العمق التكتيكي',
ADD COLUMN IF NOT EXISTS stat3_name_ar TEXT DEFAULT 'الأدرينالين';

-- Permissions Update
INSERT INTO permissions (key, description) VALUES
  ('manage_content', 'Access to CMS content management')
ON CONFLICT (key) DO NOTHING;

INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id FROM roles r, permissions p
WHERE r.name IN ('super_admin', 'admin') AND p.key = 'manage_content'
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE cms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocol_steps ENABLE ROW LEVEL SECURITY;

-- Allow public read access to CMS content
CREATE POLICY "Public read access to cms_content" ON cms_content FOR SELECT USING (true);
CREATE POLICY "Public read access to gallery_images" ON gallery_images FOR SELECT USING (true);
CREATE POLICY "Public read access to faq_items" ON faq_items FOR SELECT USING (true);
CREATE POLICY "Public read access to protocol_steps" ON protocol_steps FOR SELECT USING (true);

-- Allow authenticated users with admin/super_admin role to write
CREATE POLICY "Admin write access to cms_content" ON cms_content FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.id = auth.uid() AND roles.name IN ('admin', 'super_admin')
  )
);
CREATE POLICY "Admin write access to gallery_images" ON gallery_images FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.id = auth.uid() AND roles.name IN ('admin', 'super_admin')
  )
);
CREATE POLICY "Admin write access to faq_items" ON faq_items FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.id = auth.uid() AND roles.name IN ('admin', 'super_admin')
  )
);
CREATE POLICY "Admin write access to protocol_steps" ON protocol_steps FOR ALL USING (
  EXISTS (
    SELECT 1 FROM users
    JOIN roles ON users.role_id = roles.id
    WHERE users.id = auth.uid() AND roles.name IN ('admin', 'super_admin')
  )
);
