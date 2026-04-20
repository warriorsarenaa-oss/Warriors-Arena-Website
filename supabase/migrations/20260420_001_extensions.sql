-- Migration 001: Required PostgreSQL Extensions
-- Author: Warriors Arena
-- Notes: Run before any schema migration. Most are bundled with Supabase.

-- UUID generation (for primary keys)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Case-insensitive text (used for emails, usernames if desired)
CREATE EXTENSION IF NOT EXISTS "citext";
