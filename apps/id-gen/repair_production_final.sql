-- ==================================================================================
-- FINAL REPAIR SCRIPT 
-- Run this in the Neon Console (SQL Editor) to fix the remaining 500 Error.
-- ==================================================================================

-- You are missing "org_metadata" in the idcards table.
-- This was part of the 0002 migration but was missed in the previous repair v2 script.

ALTER TABLE "idcards" ADD COLUMN IF NOT EXISTS "org_metadata" jsonb DEFAULT '{}'::jsonb;

-- Just to be absolutely safe, let's ensure these from 0002 are also present:
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "url_slug" text;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "shortform" varchar(8);

-- Add unique constraints safely if missing
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_url_slug_unique') THEN 
        ALTER TABLE "organizations" ADD CONSTRAINT "organizations_url_slug_unique" UNIQUE("url_slug"); 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_shortform_unique') THEN 
        ALTER TABLE "organizations" ADD CONSTRAINT "organizations_shortform_unique" UNIQUE("shortform"); 
    END IF;
END $$;
