-- Add low_res columns to templates table
ALTER TABLE templates 
ADD COLUMN IF NOT EXISTS front_background_low_res TEXT,
ADD COLUMN IF NOT EXISTS back_background_low_res TEXT;

-- Add low_res columns to idcards table (for completeness, though primary focus is templates)
ALTER TABLE idcards 
ADD COLUMN IF NOT EXISTS front_image_low_res TEXT,
ADD COLUMN IF NOT EXISTS back_image_low_res TEXT;
