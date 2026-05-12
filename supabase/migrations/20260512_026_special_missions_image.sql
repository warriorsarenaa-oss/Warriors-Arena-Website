-- Migration: Add image_url to special_missions
ALTER TABLE special_missions ADD COLUMN IF NOT EXISTS image_url TEXT;
