-- Add organization ID columns to role_emulation_sessions table
ALTER TABLE role_emulation_sessions
ADD COLUMN original_org_id UUID REFERENCES organizations(id),
ADD COLUMN emulated_org_id UUID REFERENCES organizations(id);
