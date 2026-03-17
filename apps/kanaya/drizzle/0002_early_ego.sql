CREATE TYPE "public"."ai_generation_status" AS ENUM('pending', 'processing', 'completed', 'failed');--> statement-breakpoint
CREATE TYPE "public"."digital_card_status" AS ENUM('unclaimed', 'active', 'banned', 'suspended', 'expired');--> statement-breakpoint
ALTER TABLE "digital_cards" ALTER COLUMN "status" SET DEFAULT 'unclaimed'::"public"."digital_card_status";--> statement-breakpoint
ALTER TABLE "digital_cards" ALTER COLUMN "status" SET DATA TYPE "public"."digital_card_status" USING "status"::"public"."digital_card_status";--> statement-breakpoint
ALTER TABLE "ai_generations" ADD COLUMN "status" "ai_generation_status" DEFAULT 'completed' NOT NULL;--> statement-breakpoint
ALTER TABLE "ai_generations" ADD COLUMN "external_request_id" text;--> statement-breakpoint
ALTER TABLE "digital_cards" ADD COLUMN "recipient_email" text;--> statement-breakpoint
ALTER TABLE "digital_cards" ADD COLUMN "personal_metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "digital_cards" ADD COLUMN "claim_token" text;--> statement-breakpoint
ALTER TABLE "digital_cards" ADD COLUMN "claim_token_expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "idcards" ADD COLUMN "org_metadata" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "url_slug" text;--> statement-breakpoint
ALTER TABLE "organizations" ADD COLUMN "shortform" varchar(8);--> statement-breakpoint
ALTER TABLE "template_assets" ADD COLUMN "template_id" uuid;--> statement-breakpoint
ALTER TABLE "template_assets" ADD COLUMN "back_image_path" text;--> statement-breakpoint
ALTER TABLE "template_assets" ADD COLUMN "back_image_url" text;--> statement-breakpoint
ALTER TABLE "template_assets" ADD CONSTRAINT "template_assets_template_id_templates_id_fk" FOREIGN KEY ("template_id") REFERENCES "public"."templates"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_url_slug_unique" UNIQUE("url_slug");--> statement-breakpoint
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_shortform_unique" UNIQUE("shortform");