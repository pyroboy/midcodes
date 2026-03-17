-- ==================================================================================
-- MANUAL REPAIR SCRIPT V2 (Missing 0001 Migration columns)
-- Run this in the Neon Console (SQL Editor) to fix the "insert into idcards" 500 Error.
-- ==================================================================================

-- 1. FIX THE SAVE ERROR (idcards table)
ALTER TABLE "idcards" ADD COLUMN IF NOT EXISTS "original_assets" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "idcards" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();

-- 2. FIX POTENTIAL MISSING TEMPLATE COLUMNS (from same missing migration)
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "sample_front_url" text;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "sample_back_url" text;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "blank_front_url" text;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "blank_back_url" text;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "thumb_front_url" text;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "thumb_back_url" text;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "preview_front_url" text;
ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "preview_back_url" text;

-- 3. FIX OTHER TABLES (just in case)
-- Admin Audit
ALTER TABLE "admin_audit" ADD COLUMN IF NOT EXISTS "ip_address" text;
ALTER TABLE "admin_audit" ADD COLUMN IF NOT EXISTS "user_agent" text;

-- User (Better Auth)
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_reason" text;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_expires" timestamp with time zone;
