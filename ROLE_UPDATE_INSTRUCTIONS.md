# Role Update Instructions

This document outlines the steps required to update user roles in the application. There are two main files that need to be modified.

## 1. Update Role Configuration (`src/lib/auth/roleConfig.ts`)

### A. Update UserRole Type
Add new roles to the UserRole type:
```typescript
export type UserRole =
  | 'super_admin'
  | 'org_admin'
  | 'user'
  | 'event_admin'
  | 'event_qr_checker'
  | 'property_admin'
  | 'property_manager'
  | 'property_accountant'
  | 'property_maintenance'
  | 'property_utility'
  | 'property_frontdesk'
  | 'property_tenant'
  | 'property_guest'
  | 'id_gen_admin'
  | 'id_gen_user';
```

### B. Update RoleConfig
Add configurations for each new role following this structure:
```typescript
export const RoleConfig: Record<UserRole, RoleConfiguration> = {
  // Existing roles (do not modify)
  super_admin: { /* Existing super_admin config */ },
  org_admin: { /* Existing org_admin config */ },
  user: { /* Existing user config */ },
  event_admin: { /* Existing event_admin config */ },
  event_qr_checker: { /* Existing event_qr_checker config */ },
  property_admin: { /* Existing property_admin config */ },
  property_manager: { /* Existing property_manager config */ },
  property_accountant: { /* Existing property_accountant config */ },
  property_maintenance: { /* Existing property_maintenance config */ },
  property_utility: { /* Existing property_utility config */ },
  property_frontdesk: { /* Existing property_frontdesk config */ },
  property_tenant: { /* Existing property_tenant config */ },
  property_guest: { /* Existing property_guest config */ },

  // New roles (add configuration following this structure)
  new_role_name: {
    allowedPaths: [
      { path: 'path/to/resource', showInNav: boolean, label: 'Nav Label' },
      { path: 'path/to/resource/**' },
      // Add more paths as needed
    ],
    defaultPath() {
      return '/default/path';
    },
    isAdmin: boolean,
    label: 'Role Label'
  },
  // Add more new roles as needed
};
```

## 2. Update Role Emulation (`supabase/functions/role-emulation/index.ts`)

### A. Update allowedRoles Array
Add all roles to the allowedRoles array:
```typescript
const allowedRoles = [
  'super_admin',
  'org_admin',
  'user',
  'event_admin',
  'event_qr_checker',
  'property_admin',
  'property_manager',
  'property_accountant',
  'property_maintenance',
  'property_utility',
  'property_frontdesk',
  'property_tenant',
  'property_guest',
  'id_gen_admin',
  'id_gen_user'
];
```

### B. Deploy Updated Function
After making changes, deploy the updated function:
1. Navigate to the function directory:
   ```
   cd supabase/functions/role-emulation
   ```
2. Deploy the function:
   ```
   supabase functions deploy role-emulation
   ```
3. Verify the deployment was successful and only the `allowedRoles` array was modified.

### B. Update Role Validation
Ensure the role validation logic accounts for the new roles:
```typescript
// Example validation for property roles
if (role.startsWith('property_') && !user.app_metadata.property_id) {
  throw new Error('Property ID required for property roles');
}

// Example validation for event roles
if (role.startsWith('event_') && !user.app_metadata.event_id) {
  throw new Error('Event ID required for event roles');
}
```

## Testing Checklist

After updating the roles, verify:

1. Role Type Safety
   - [ ] Compile the application to ensure no TypeScript errors
   - [ ] Check that all role strings are properly typed

2. Role Configuration
   - [ ] Verify each role has appropriate `allowedPaths`
   - [ ] Test `defaultPath` redirects
   - [ ] Confirm `navItems` show correctly in navigation

3. Role Emulation
   - [ ] Test emulating each new role
   - [ ] Verify role-specific validations work
   - [ ] Check error messages for invalid role assignments

4. Access Control
   - [ ] Test navigation restrictions for each role
   - [ ] Verify API endpoint access control
   - [ ] Check database policy enforcement

## Notes

- Keep the role hierarchy consistent (super_admin > org_admin > specific roles)
- Ensure database policies are updated to handle new roles
- Update any role-based UI components to handle new roles
- Document any new role-specific features or restrictions
