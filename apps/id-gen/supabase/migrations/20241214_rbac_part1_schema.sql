-- RBAC Part 1: Create Tables and Policies
-- Run this first

-- 1. Create roles table
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add unique constraint that handles NULL org_id
CREATE UNIQUE INDEX IF NOT EXISTS idx_roles_org_name ON roles (COALESCE(org_id, '00000000-0000-0000-0000-000000000000'::uuid), name);

-- 2. Create role_permissions table
CREATE TABLE IF NOT EXISTS role_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  resource TEXT NOT NULL,
  action TEXT NOT NULL,
  granted BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(role_id, resource, action)
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_roles_org_id ON roles(org_id);
CREATE INDEX IF NOT EXISTS idx_roles_name ON roles(name);
CREATE INDEX IF NOT EXISTS idx_role_permissions_role_id ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_resource ON role_permissions(resource);

-- 4. Enable Row Level Security
ALTER TABLE roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE role_permissions ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies for roles
DROP POLICY IF EXISTS "Users can read roles in their org" ON roles;
CREATE POLICY "Users can read roles in their org"
  ON roles FOR SELECT
  USING (
    org_id IS NULL
    OR org_id IN (
      SELECT org_id FROM profiles WHERE id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can manage roles in their org" ON roles;
CREATE POLICY "Admins can manage roles in their org"
  ON roles FOR ALL
  USING (
    org_id IN (
      SELECT p.org_id FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role IN ('super_admin', 'org_admin', 'id_gen_super_admin', 'id_gen_org_admin')
    )
  );

-- 6. RLS Policies for role_permissions
DROP POLICY IF EXISTS "Users can read permissions for accessible roles" ON role_permissions;
CREATE POLICY "Users can read permissions for accessible roles"
  ON role_permissions FOR SELECT
  USING (
    role_id IN (
      SELECT roles.id FROM roles
      WHERE roles.org_id IS NULL
      OR roles.org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage permissions for their org roles" ON role_permissions;
CREATE POLICY "Admins can manage permissions for their org roles"
  ON role_permissions FOR ALL
  USING (
    role_id IN (
      SELECT roles.id FROM roles
      WHERE roles.org_id IN (
        SELECT p.org_id FROM profiles p
        WHERE p.id = auth.uid()
        AND p.role IN ('super_admin', 'org_admin', 'id_gen_super_admin', 'id_gen_org_admin')
      )
    )
  );

-- 7. Trigger for updated_at
CREATE OR REPLACE FUNCTION update_roles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS roles_updated_at ON roles;
CREATE TRIGGER roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW
  EXECUTE FUNCTION update_roles_updated_at();
