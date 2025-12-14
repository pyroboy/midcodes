-- RBAC Part 2: Seed Default Roles and Permissions
-- Run this AFTER Part 1 schema is created

-- Insert default system roles
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

-- Super Admin: All permissions
INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, res, act, TRUE
FROM roles, 
  unnest(ARRAY['idcards', 'templates', 'template_assets', 'users', 'invoices', 'credits', 'organizations', 'analytics']) AS res,
  unnest(ARRAY['read', 'write', 'edit', 'delete']) AS act
WHERE name = 'id_gen_super_admin' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Org Admin: All permissions
INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, res, act, TRUE
FROM roles, 
  unnest(ARRAY['idcards', 'templates', 'template_assets', 'users', 'invoices', 'credits', 'organizations', 'analytics']) AS res,
  unnest(ARRAY['read', 'write', 'edit', 'delete']) AS act
WHERE name = 'id_gen_org_admin' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- ID Gen Admin: idcards, templates, template_assets, users (all actions) + analytics read
INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, res, act, TRUE
FROM roles, 
  unnest(ARRAY['idcards', 'templates', 'template_assets', 'users']) AS res,
  unnest(ARRAY['read', 'write', 'edit', 'delete']) AS act
WHERE name = 'id_gen_admin' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'analytics', 'read', TRUE FROM roles WHERE name = 'id_gen_admin' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- ID Gen User: idcards read/write, templates read
INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'idcards', act, TRUE
FROM roles, unnest(ARRAY['read', 'write']) AS act
WHERE name = 'id_gen_user' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'templates', 'read', TRUE FROM roles WHERE name = 'id_gen_user' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Accountant: invoices/credits read/write/edit, analytics read, users read
INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, res, act, TRUE
FROM roles, 
  unnest(ARRAY['invoices', 'credits']) AS res,
  unnest(ARRAY['read', 'write', 'edit']) AS act
WHERE name = 'id_gen_accountant' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'analytics', 'read', TRUE FROM roles WHERE name = 'id_gen_accountant' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'users', 'read', TRUE FROM roles WHERE name = 'id_gen_accountant' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Encoder: idcards read/write, templates read
INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'idcards', act, TRUE
FROM roles, unnest(ARRAY['read', 'write']) AS act
WHERE name = 'id_gen_encoder' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'templates', 'read', TRUE FROM roles WHERE name = 'id_gen_encoder' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Printer: idcards read only
INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'idcards', 'read', TRUE FROM roles WHERE name = 'id_gen_printer' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Viewer: read-only cards and templates
INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'idcards', 'read', TRUE FROM roles WHERE name = 'id_gen_viewer' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'templates', 'read', TRUE FROM roles WHERE name = 'id_gen_viewer' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Template Designer: templates and template_assets full access + idcards read
INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, res, act, TRUE
FROM roles, 
  unnest(ARRAY['templates', 'template_assets']) AS res,
  unnest(ARRAY['read', 'write', 'edit', 'delete']) AS act
WHERE name = 'id_gen_template_designer' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, 'idcards', 'read', TRUE FROM roles WHERE name = 'id_gen_template_designer' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;

-- Auditor: read-only access to everything
INSERT INTO role_permissions (role_id, resource, action, granted)
SELECT id, res, 'read', TRUE
FROM roles, unnest(ARRAY['idcards', 'templates', 'template_assets', 'users', 'invoices', 'credits', 'organizations', 'analytics']) AS res
WHERE name = 'id_gen_auditor' AND is_system = TRUE
ON CONFLICT (role_id, resource, action) DO NOTHING;
