-- RBAC: Roles and Permissions Tables
-- This migration creates the role-based access control system

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

-- 5. RLS Policies for roles (org members can read, admins can write)
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
      SELECT r.id FROM roles r
      WHERE r.org_id IS NULL
      OR r.org_id IN (SELECT org_id FROM profiles WHERE id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "Admins can manage permissions for their org roles" ON role_permissions;
CREATE POLICY "Admins can manage permissions for their org roles"
  ON role_permissions FOR ALL
  USING (
    role_id IN (
      SELECT r.id FROM roles r
      WHERE r.org_id IN (
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

-- 8. Insert default system roles (org_id = NULL means system-wide)
INSERT INTO roles (org_id, name, display_name, description, is_system) VALUES
  (NULL, 'id_gen_super_admin', 'Super Admin', 'Full system access across all organizations', TRUE),
  (NULL, 'id_gen_org_admin', 'Organization Admin', 'Full access within their organization', TRUE),
  (NULL, 'id_gen_admin', 'ID Generator Admin', 'Manage templates and users', TRUE),
  (NULL, 'id_gen_user', 'ID Generator User', 'Generate ID cards only', TRUE),
  (NULL, 'id_gen_accountant', 'Accountant', 'View and manage invoices and credits', TRUE),
  (NULL, 'id_gen_encoder', 'Encoder', 'Create ID cards from templates', TRUE),
  (NULL, 'id_gen_printer', 'Printer', 'Print and view ID cards only', TRUE),
  (NULL, 'id_gen_viewer', 'Viewer', 'Read-only access to cards and templates', TRUE),
  (NULL, 'id_gen_template_designer', 'Template Designer', 'Create and manage templates only', TRUE),
  (NULL, 'id_gen_auditor', 'Auditor', 'Read-only access to all resources for audit purposes', TRUE)
ON CONFLICT DO NOTHING;

-- 9. Insert permissions using simple INSERT statements
-- Define resources and actions
DO $$
DECLARE
  v_role_id UUID;
  resources TEXT[] := ARRAY['idcards', 'templates', 'template_assets', 'users', 'invoices', 'credits', 'organizations', 'analytics'];
  actions TEXT[] := ARRAY['read', 'write', 'edit', 'delete'];
  r TEXT;
  a TEXT;
BEGIN
  -- Super Admin: All permissions
  SELECT id INTO v_role_id FROM roles WHERE name = 'id_gen_super_admin' AND is_system = TRUE LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    FOREACH r IN ARRAY resources LOOP
      FOREACH a IN ARRAY actions LOOP
        INSERT INTO role_permissions (role_id, resource, action, granted) 
        VALUES (v_role_id, r, a, TRUE)
        ON CONFLICT (role_id, resource, action) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;

  -- Org Admin: All permissions
  SELECT id INTO v_role_id FROM roles WHERE name = 'id_gen_org_admin' AND is_system = TRUE LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    FOREACH r IN ARRAY resources LOOP
      FOREACH a IN ARRAY actions LOOP
        INSERT INTO role_permissions (role_id, resource, action, granted) 
        VALUES (v_role_id, r, a, TRUE)
        ON CONFLICT (role_id, resource, action) DO NOTHING;
      END LOOP;
    END LOOP;
  END IF;

  -- ID Gen Admin: idcards, templates, template_assets, users (all actions) + analytics read
  SELECT id INTO v_role_id FROM roles WHERE name = 'id_gen_admin' AND is_system = TRUE LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    FOREACH r IN ARRAY ARRAY['idcards', 'templates', 'template_assets', 'users'] LOOP
      FOREACH a IN ARRAY actions LOOP
        INSERT INTO role_permissions (role_id, resource, action, granted) 
        VALUES (v_role_id, r, a, TRUE)
        ON CONFLICT (role_id, resource, action) DO NOTHING;
      END LOOP;
    END LOOP;
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'analytics', 'read', TRUE) ON CONFLICT DO NOTHING;
  END IF;

  -- ID Gen User: idcards read/write, templates read
  SELECT id INTO v_role_id FROM roles WHERE name = 'id_gen_user' AND is_system = TRUE LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'idcards', 'read', TRUE) ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'idcards', 'write', TRUE) ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'templates', 'read', TRUE) ON CONFLICT DO NOTHING;
  END IF;

  -- Accountant: invoices/credits read/write/edit, analytics read, users read
  SELECT id INTO v_role_id FROM roles WHERE name = 'id_gen_accountant' AND is_system = TRUE LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    FOREACH r IN ARRAY ARRAY['invoices', 'credits'] LOOP
      FOREACH a IN ARRAY ARRAY['read', 'write', 'edit'] LOOP
        INSERT INTO role_permissions (role_id, resource, action, granted) 
        VALUES (v_role_id, r, a, TRUE)
        ON CONFLICT (role_id, resource, action) DO NOTHING;
      END LOOP;
    END LOOP;
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'analytics', 'read', TRUE) ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'users', 'read', TRUE) ON CONFLICT DO NOTHING;
  END IF;

  -- Encoder: idcards read/write, templates read
  SELECT id INTO v_role_id FROM roles WHERE name = 'id_gen_encoder' AND is_system = TRUE LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'idcards', 'read', TRUE) ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'idcards', 'write', TRUE) ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'templates', 'read', TRUE) ON CONFLICT DO NOTHING;
  END IF;

  -- Printer: idcards read only (for printing)
  SELECT id INTO v_role_id FROM roles WHERE name = 'id_gen_printer' AND is_system = TRUE LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'idcards', 'read', TRUE) ON CONFLICT DO NOTHING;
  END IF;

  -- Viewer: read-only access to cards and templates
  SELECT id INTO v_role_id FROM roles WHERE name = 'id_gen_viewer' AND is_system = TRUE LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'idcards', 'read', TRUE) ON CONFLICT DO NOTHING;
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'templates', 'read', TRUE) ON CONFLICT DO NOTHING;
  END IF;

  -- Template Designer: templates and template_assets full access
  SELECT id INTO v_role_id FROM roles WHERE name = 'id_gen_template_designer' AND is_system = TRUE LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    FOREACH a IN ARRAY actions LOOP
      INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'templates', a, TRUE) ON CONFLICT DO NOTHING;
      INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'template_assets', a, TRUE) ON CONFLICT DO NOTHING;
    END LOOP;
    INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, 'idcards', 'read', TRUE) ON CONFLICT DO NOTHING;
  END IF;

  -- Auditor: read-only access to everything
  SELECT id INTO v_role_id FROM roles WHERE name = 'id_gen_auditor' AND is_system = TRUE LIMIT 1;
  IF v_role_id IS NOT NULL THEN
    FOREACH r IN ARRAY resources LOOP
      INSERT INTO role_permissions (role_id, resource, action, granted) VALUES (v_role_id, r, 'read', TRUE) ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END $$;
