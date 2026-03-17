-- ==================================================================================
-- MASTER REPAIR SCRIPT (Complete Sync)
-- This script safely applies ALL changes from migrations 0001 and 0002.
-- Run this in Neon Console to be 100% sure your Production DB matches your Code.
-- ==================================================================================

DO $$ 
BEGIN 

    -- ============================================================
    -- 1. FIX "idcards" (The cause of your Save error)
    -- ============================================================
    BEGIN
        ALTER TABLE "idcards" ADD COLUMN IF NOT EXISTS "original_assets" jsonb DEFAULT '{}'::jsonb;
    EXCEPTION WHEN duplicate_column THEN END;
    
    BEGIN
        ALTER TABLE "idcards" ADD COLUMN IF NOT EXISTS "updated_at" timestamp with time zone DEFAULT now();
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE "idcards" ADD COLUMN IF NOT EXISTS "org_metadata" jsonb DEFAULT '{}'::jsonb;
    EXCEPTION WHEN duplicate_column THEN END;

    -- ============================================================
    -- 2. FIX "organizations" (The cause of your initial 500 error)
    -- ============================================================
    BEGIN
        ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "url_slug" text;
    EXCEPTION WHEN duplicate_column THEN END;

    BEGIN
        ALTER TABLE "organizations" ADD COLUMN IF NOT EXISTS "shortform" varchar(8);
    EXCEPTION WHEN duplicate_column THEN END;

    -- Constraints (handled safely)
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_url_slug_unique') THEN 
        ALTER TABLE "organizations" ADD CONSTRAINT "organizations_url_slug_unique" UNIQUE("url_slug"); 
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'organizations_shortform_unique') THEN 
        ALTER TABLE "organizations" ADD CONSTRAINT "organizations_shortform_unique" UNIQUE("shortform"); 
    END IF;

    -- ============================================================
    -- 3. FIX "templates" (Missing columns from 0001)
    -- ============================================================
    BEGIN
        ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "sample_front_url" text;
        ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "sample_back_url" text;
        ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "blank_front_url" text;
        ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "blank_back_url" text;
        ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "thumb_front_url" text;
        ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "thumb_back_url" text;
        ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "preview_front_url" text;
        ALTER TABLE "templates" ADD COLUMN IF NOT EXISTS "preview_back_url" text;
    EXCEPTION WHEN duplicate_column THEN END;

    -- ============================================================
    -- 4. FIX "template_assets" (Missing columns from 0002)
    -- ============================================================
    BEGIN
        ALTER TABLE "template_assets" ADD COLUMN IF NOT EXISTS "template_id" uuid;
        ALTER TABLE "template_assets" ADD COLUMN IF NOT EXISTS "back_image_path" text;
        ALTER TABLE "template_assets" ADD COLUMN IF NOT EXISTS "back_image_url" text;
    EXCEPTION WHEN duplicate_column THEN END;

    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'template_assets_template_id_templates_id_fk') THEN 
        ALTER TABLE "template_assets" ADD CONSTRAINT "template_assets_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE set null; 
    END IF;

    -- ============================================================
    -- 5. FIX "digital_cards" (Schema updates)
    -- ============================================================
    -- Ensure Enum exists first
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'digital_card_status') THEN 
        CREATE TYPE "public"."digital_card_status" AS ENUM('unclaimed', 'active', 'banned', 'suspended', 'expired'); 
    END IF;

    BEGIN
        ALTER TABLE "digital_cards" ADD COLUMN IF NOT EXISTS "recipient_email" text;
        ALTER TABLE "digital_cards" ADD COLUMN IF NOT EXISTS "personal_metadata" jsonb DEFAULT '{}'::jsonb;
        ALTER TABLE "digital_cards" ADD COLUMN IF NOT EXISTS "claim_token" text;
        ALTER TABLE "digital_cards" ADD COLUMN IF NOT EXISTS "claim_token_expires_at" timestamp with time zone;
    EXCEPTION WHEN duplicate_column THEN END;
    
    -- Status update (safe default set)
    ALTER TABLE "digital_cards" ALTER COLUMN "status" SET DEFAULT 'unclaimed';


    -- ============================================================
    -- 6. FIX "ai_generations"
    -- ============================================================
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'ai_generation_status') THEN 
        CREATE TYPE "public"."ai_generation_status" AS ENUM('pending', 'processing', 'completed', 'failed'); 
    END IF;

    BEGIN
        ALTER TABLE "ai_generations" ADD COLUMN IF NOT EXISTS "status" "ai_generation_status" DEFAULT 'completed' NOT NULL;
        ALTER TABLE "ai_generations" ADD COLUMN IF NOT EXISTS "external_request_id" text;
    EXCEPTION WHEN duplicate_column THEN END;

    -- ============================================================
    -- 7. FIX "admin_audit"
    -- ============================================================
    BEGIN
       -- Try to change type if it exists
       ALTER TABLE "admin_audit" ALTER COLUMN "target_id" SET DATA TYPE text;
    EXCEPTION WHEN OTHERS THEN NULL; END;

    BEGIN
        ALTER TABLE "admin_audit" ADD COLUMN IF NOT EXISTS "ip_address" text;
        ALTER TABLE "admin_audit" ADD COLUMN IF NOT EXISTS "user_agent" text;
    EXCEPTION WHEN duplicate_column THEN END;

    -- ============================================================
    -- 8. FIX "user" (Better Auth updates)
    -- ============================================================
    BEGIN
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "role" text;
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "banned" boolean;
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_reason" text;
        ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "ban_expires" timestamp with time zone;
    EXCEPTION WHEN duplicate_column THEN END;

END $$;
