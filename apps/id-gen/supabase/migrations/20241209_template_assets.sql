-- Template Assets Table
-- Run this in Supabase SQL Editor to create the template_assets table

CREATE TABLE IF NOT EXISTS template_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Asset metadata
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  tags TEXT[] DEFAULT '{}',
  
  -- Size and type
  size_preset_id UUID REFERENCES template_size_presets(id) ON DELETE SET NULL,
  sample_type TEXT NOT NULL CHECK (sample_type IN ('data_filled', 'blank_template')),
  orientation TEXT NOT NULL CHECK (orientation IN ('landscape', 'portrait')),
  
  -- Image storage
  image_path TEXT NOT NULL,
  image_url TEXT NOT NULL,
  width_pixels INT NOT NULL,
  height_pixels INT NOT NULL,
  
  -- Publishing
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  
  -- Admin info
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create index for common queries
CREATE INDEX IF NOT EXISTS idx_template_assets_size_preset ON template_assets(size_preset_id);
CREATE INDEX IF NOT EXISTS idx_template_assets_sample_type ON template_assets(sample_type);
CREATE INDEX IF NOT EXISTS idx_template_assets_is_published ON template_assets(is_published);

-- Enable RLS
ALTER TABLE template_assets ENABLE ROW LEVEL SECURITY;

-- Policy: Admins can do everything
CREATE POLICY "Admins can manage template assets"
ON template_assets FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Policy: Users can view published assets
CREATE POLICY "Users can view published template assets"
ON template_assets FOR SELECT
TO authenticated
USING (is_published = true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_template_assets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER template_assets_updated_at
  BEFORE UPDATE ON template_assets
  FOR EACH ROW
  EXECUTE FUNCTION update_template_assets_updated_at();
