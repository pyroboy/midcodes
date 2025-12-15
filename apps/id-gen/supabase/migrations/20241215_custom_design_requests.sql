-- Custom Design Requests Table
-- Stores user requests for custom template designs
-- Run this in Supabase SQL Editor

-- Create the custom_design_requests table
CREATE TABLE IF NOT EXISTS custom_design_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Request info
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  org_id UUID REFERENCES organizations(id) ON DELETE SET NULL,
  size_preset_id UUID REFERENCES template_size_presets(id) ON DELETE SET NULL,
  
  -- Size info (stored directly for when preset is deleted)
  width_pixels INTEGER NOT NULL,
  height_pixels INTEGER NOT NULL,
  size_name TEXT NOT NULL,
  
  -- Design request details
  design_instructions TEXT NOT NULL,
  reference_assets TEXT[] DEFAULT '{}',  -- Storage paths for uploaded reference images
  
  -- Status workflow
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'approved', 'rejected', 'completed')),
  admin_notes TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  rejected_reason TEXT,
  
  -- Result (when design is completed)
  resulting_template_id UUID REFERENCES templates(id) ON DELETE SET NULL
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_custom_design_requests_user ON custom_design_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_custom_design_requests_org ON custom_design_requests(org_id);
CREATE INDEX IF NOT EXISTS idx_custom_design_requests_status ON custom_design_requests(status);
CREATE INDEX IF NOT EXISTS idx_custom_design_requests_created ON custom_design_requests(created_at DESC);

-- Enable RLS
ALTER TABLE custom_design_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own requests
CREATE POLICY "Users can view own custom design requests"
ON custom_design_requests FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Policy: Users can create requests for themselves
CREATE POLICY "Users can create custom design requests"
ON custom_design_requests FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Policy: Admins can view all requests
CREATE POLICY "Admins can view all custom design requests"
ON custom_design_requests FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'org_admin', 'id_gen_admin')
  )
);

-- Policy: Admins can update requests (for approval workflow)
CREATE POLICY "Admins can update custom design requests"
ON custom_design_requests FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role IN ('super_admin', 'org_admin', 'id_gen_admin')
  )
);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_custom_design_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER custom_design_requests_updated_at
  BEFORE UPDATE ON custom_design_requests
  FOR EACH ROW
  EXECUTE FUNCTION update_custom_design_requests_updated_at();

-- Create storage bucket for custom design reference images (if not exists)
-- Note: Run this separately or via Supabase dashboard
-- INSERT INTO storage.buckets (id, name, public) 
-- VALUES ('custom-design-assets', 'custom-design-assets', false)
-- ON CONFLICT (id) DO NOTHING;
