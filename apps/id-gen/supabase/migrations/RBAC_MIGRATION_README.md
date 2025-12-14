# RBAC Migration Documentation

This document describes the Role-Based Access Control (RBAC) migrations applied on **December 14, 2024**.

## Overview

Extended the existing RBAC system to support granular ID Generator roles and permissions while maintaining backward compatibility with the existing enum-based permission system.

## Migrations Applied

| Version | Name | Description |
|---------|------|-------------|
| 20251214082205 | `extend_roles_table_columns` | Added `display_name` and `updated_at` columns to roles table |
| 20251214082220 | `add_id_gen_roles_to_enum` | Added 8 new ID-gen roles to `app_role` enum |
| 20251214082232 | `add_id_gen_permissions_to_enum` | Added 16 new permissions to `app_permission` enum |
| 20251214082246 | `insert_id_gen_roles` | Inserted new roles into `roles` table with descriptions |
| 20251214082311 | `insert_id_gen_role_permissions` | Assigned permissions to each new role |
| 20251214082342 | `enable_rls_on_roles` | Enabled RLS and added security policies |

## New Roles Added

| Role Name | Display Name | Description | Permissions |
|-----------|--------------|-------------|-------------|
| `id_gen_super_admin` | ID Gen Super Admin | Full system access across all organizations | 31 permissions |
| `id_gen_org_admin` | ID Gen Organization Admin | Full access within their organization | 29 permissions |
| `id_gen_accountant` | ID Gen Accountant | View and manage invoices and credits | 9 permissions |
| `id_gen_encoder` | ID Gen Encoder | Create ID cards from templates | 4 permissions |
| `id_gen_printer` | ID Gen Printer | Print and view ID cards only | 1 permission |
| `id_gen_viewer` | ID Gen Viewer | Read-only access to cards and templates | 3 permissions |
| `id_gen_template_designer` | ID Gen Template Designer | Create and manage templates only | 9 permissions |
| `id_gen_auditor` | ID Gen Auditor | Read-only access to all resources | 9 permissions |

## New Permissions Added

### Template Assets
- `template_assets.create`
- `template_assets.read`
- `template_assets.update`
- `template_assets.delete`

### Invoices
- `invoices.create`
- `invoices.read`
- `invoices.update`
- `invoices.delete`

### Credits
- `credits.create`
- `credits.read`
- `credits.update`
- `credits.delete`

### Users
- `users.create`
- `users.read`
- `users.update`
- `users.delete`

### Analytics
- `analytics.read`

## Role Permission Matrix

| Role | Templates | Template Assets | ID Cards | Invoices | Credits | Users | Analytics |
|------|-----------|-----------------|----------|----------|---------|-------|-----------|
| id_gen_super_admin | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | R |
| id_gen_org_admin | CRUD | CRUD | CRUD | CRUD | CRUD | CRUD | R |
| id_gen_accountant | - | - | - | CRU | CRU | R | R |
| id_gen_encoder | R | R | CR | - | - | - | - |
| id_gen_printer | - | - | R | - | - | - | - |
| id_gen_viewer | R | R | R | - | - | - | - |
| id_gen_template_designer | CRUD | CRUD | R | - | - | - | - |
| id_gen_auditor | R | R | R | R | R | R | R |

*Legend: C=Create, R=Read, U=Update, D=Delete*

## Schema Changes

### `roles` Table
```sql
-- New columns added
display_name TEXT          -- Human-readable role name
updated_at   TIMESTAMPTZ   -- Auto-updated timestamp

-- New trigger
roles_updated_at           -- Updates updated_at on row changes
```

### Row Level Security (RLS)

**Policy: "Users can read roles in their org"**
- Users can read system roles (`org_id IS NULL`)
- Users can read roles belonging to their organization

**Policy: "Admins can manage roles in their org"**
- Admins (`super_admin`, `org_admin`, `id_gen_admin`) can manage non-system roles in their org
- System roles (`is_system = TRUE`) are protected from modification

## Usage Examples

### Check user permissions
```sql
SELECT rp.permission
FROM role_permissions rp
JOIN profiles p ON p.role::text = rp.role::text
WHERE p.id = auth.uid();
```

### Get role details with permissions
```sql
SELECT r.name, r.display_name, r.description,
       array_agg(rp.permission) as permissions
FROM roles r
LEFT JOIN role_permissions rp ON rp.role::text = r.name
GROUP BY r.id;
```

### Check if user has specific permission
```sql
SELECT EXISTS (
  SELECT 1 FROM role_permissions rp
  JOIN profiles p ON p.role::text = rp.role::text
  WHERE p.id = auth.uid()
  AND rp.permission = 'templates.create'
) as has_permission;
```

## Migration Notes

1. **Backward Compatibility**: The existing `app_role` and `app_permission` enums were extended, not replaced. All existing permissions continue to work.

2. **Two Enum Systems**:
   - `user_role` - Used in `profiles.role` column (for user assignment)
   - `app_role` - Used in `role_permissions.role` column (for permission mapping)

3. **Original Migration Files**: The original migration files (`20241214_rbac_*.sql`) were designed for a fresh database. These adapted migrations work with the existing schema.

## Files (Original - Not Applied)

The following files in `supabase/migrations/` were **analyzed but not directly applied** due to schema conflicts:
- `20241214_rbac_part1_schema.sql` - Original schema (would conflict)
- `20241214_rbac_part2_seed.sql` - Original seed data (would conflict)
- `20241214_rbac_roles_permissions.sql` - Combined version (would conflict)

These files can be safely deleted or kept for reference.
