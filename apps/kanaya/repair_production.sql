-- ==================================================================================
-- MANUAL REPAIR SCRIPT FOR PRODUCTION DATABASE
-- Run this in the Neon Console (SQL Editor) to fix the 500 Error.
-- ==================================================================================

-- 1. FIX THE IMMEDIATE 500 ERROR (Missing columns in 'organizations')
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "url_slug" text;
ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "shortform" varchar(8);

-- Add unique constraints safely
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_url_slug_unique') THEN 
        ALTER TABLE "organizations" ADD CONSTRAINT "organizations_url_slug_unique" UNIQUE("url_slug"); 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_shortform_unique') THEN 
        ALTER TABLE "organizations" ADD CONSTRAINT "organizations_shortform_unique" UNIQUE("shortform"); 
    END IF;
END $$;

-- 2. ADD OTHER MISSING COLUMNS (To sync Schema with Code)

-- ENUMS (Handle existence safely)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_generation_status') THEN 
        CREATE TYPE "public"."ai_generation_status" AS ENUM('pending', 'processing', 'completed', 'failed'); 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'digital_card_status') THEN 
        CREATE TYPE "public"."digital_card_status" AS ENUM('unclaimed', 'active', 'banned', 'suspended', 'expired'); 
    END IF;
END $$;

-- Table Updates
ALTER TABLE "digital_cards" ALTER COLUMN "status" SET DEFAULT 'unclaimed';
-- Safe cast only if needed, usually simple alter works if compatible, usually manual intervention needed if data differs.
-- Assuming status is text currently or missing type cast.
-- ALTER TABLE "digital_cards" ALTER COLUMN "status" SET DATA TYPE "public"."digital_card_status" USING "status"::"public"."digital_card_status";

ALTER TABLE "ai_generations" ADD COLUMN IF NOT EXISTS "status" "ai_generation_status" DEFAULT 'completed' NOT NULL;
ALTER TABLE "ai_generations" ADD COLUMN IF NOT EXISTS "external_request_id" text;

ALTER TABLE "digital_cards" ADD COLUMN IF NOT EXISTS "recipient_email" text;
ALTER TABLE "digital_cards" ADD COLUMN IF NOT EXISTS "personal_metadata" jsonb DEFAULT '{}'::jsonb;
ALTER TABLE "digital_cards" ADD COLUMN IF NOT EXISTS "claim_token" text;
ALTER TABLE "digital_cards" ADD COLUMN IF NOT EXISTS "claim_token_expires_at" timestamp with time zone;

ALTER TABLE "idcards" ADD COLUMN IF NOT EXISTS "org_metadata" jsonb DEFAULT '{}'::jsonb;

-- Template Assets
ALTER TABLE "template_assets" ADD COLUMN IF NOT EXISTS "template_id" uuid;
ALTER TABLE "template_assets" ADD COLUMN IF NOT EXISTS "back_image_path" text;
ALTER TABLE "template_assets" ADD COLUMN IF NOT EXISTS "back_image_url" text;

DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'template_assets_template_id_templates_id_fk') THEN 
        ALTER TABLE "template_assets" ADD CONSTRAINT "template_assets_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE set null; 
    END IF;
END $$;
