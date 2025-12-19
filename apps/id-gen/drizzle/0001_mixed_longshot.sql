ALTER TABLE "admin_audit" ALTER COLUMN "target_id" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "admin_audit" ADD COLUMN "ip_address" text;--> statement-breakpoint
ALTER TABLE "admin_audit" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "idcards" ADD COLUMN "original_assets" jsonb DEFAULT '{}'::jsonb;--> statement-breakpoint
ALTER TABLE "idcards" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now();--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "sample_front_url" text;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "sample_back_url" text;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "blank_front_url" text;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "blank_back_url" text;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "thumb_front_url" text;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "thumb_back_url" text;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "preview_front_url" text;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "preview_back_url" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "role" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "banned" boolean;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_reason" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "ban_expires" timestamp with time zone;