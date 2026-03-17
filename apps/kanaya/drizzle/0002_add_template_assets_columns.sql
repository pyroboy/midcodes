-- Migration: Add missing columns to template_assets table
-- Date: 2025-12-21
-- Description: Adds template_id FK, back_image_path, and back_image_url columns

ALTER TABLE template_assets
ADD COLUMN IF NOT EXISTS template_id UUID REFERENCES templates(id) ON DELETE SET NULL;

ALTER TABLE template_assets
ADD COLUMN IF NOT EXISTS back_image_path TEXT;

ALTER TABLE template_assets
ADD COLUMN IF NOT EXISTS back_image_url TEXT;
