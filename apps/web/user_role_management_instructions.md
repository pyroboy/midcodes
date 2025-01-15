# User Role Management System Implementation Guide

## Overview
This guide outlines the implementation of a role management system that integrates with your existing PostgreSQL enum-based user roles system. The system will provide a UI for managing the available roles while maintaining data integrity and security.

## Current Database Structure

Your system currently uses the following user role enum:
```sql
CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'org_admin',
    'user',
    'event_admin',
    'event_qr_checker'
);
```

These roles are used in:
- `profiles` table (default role is 'user')
- `role_emulation_sessions` table (for role switching)
- Various RLS policies and functions

## Database Enhancements

### 1. Add Role Management Functions
```sql
-- Function to safely add new role values
CREATE OR REPLACE FUNCTION add_user_role_value(new_role text)
RETURNS void AS $$
BEGIN
    -- Check if the role already exists
    IF NOT EXISTS (
        SELECT 1 FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
        WHERE t.typname = 'user_role'
        AND e.enumlabel = new_role
    ) THEN
        -- Add new enum value
        EXECUTE format('ALTER TYPE user_role ADD VALUE IF NOT EXISTS %L', new_role);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- View to list available roles
CREATE OR REPLACE VIEW available_user_roles AS
SELECT e.enumlabel as role_name,
       e.enumsortorder as sort_order
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- Function to check if a role is in use
CREATE OR REPLACE FUNCTION is_role_in_use(role_to_check text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM profiles 
        WHERE role::text = role_to_check
        UNION
        SELECT 1 FROM role_emulation_sessions
        WHERE original_role::text = role_to_check
        OR emulated_role::text = role_to_check
    );
END;
$$ LANGUAGE plpgsql;
```

## Implementation Steps

### 1. Backend API Routes

Create these endpoints in your SvelteKit application:

- `GET /api/roles` - List all available roles
- `POST /api/roles` - Add new role (super_admin only)
- `GET /api/roles/usage` - Get role usage statistics

### 2. Frontend Components

#### Required Files:
1. `src/routes/admin/roles/+page.svelte` - Main role management page
2. `src/routes/admin/roles/+page.server.ts` - Server-side logic
3. `src/routes/admin/roles/RoleList.svelte` - Role listing component
4. `src/routes/admin/roles/RoleForm.svelte` - Role creation form

### 3. Role Schema (schema.ts)
```typescript
import { z } from 'zod';

export const roleSchema = z.object({
    role_name: z.string()
        .min(1, 'Role name is required')
        .regex(/^[a-z_]+$/, 'Role name must contain only lowercase letters and underscores'),
});

export type Role = z.infer<typeof roleSchema>;
```

### 4. Server-side Logic (+page.server.ts)
```typescript
import { superValidate } from 'sveltekit-superforms/server';
import { roleSchema } from './schema';
import type { Actions, PageServerLoad } from './$types';
import { error, fail } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const { supabase } = locals;
    const form = await superValidate(roleSchema);

    // Get available roles
    const { data: roles, error: rolesError } = await supabase
        .from('available_user_roles')
        .select('*')
        .order('sort_order');

    if (rolesError) {
        throw error(500, 'Error fetching roles');
    }

    // Get role usage statistics
    const { data: roleStats, error: statsError } = await supabase
        .rpc('get_role_usage_stats');

    if (statsError) {
        throw error(500, 'Error fetching role statistics');
    }

    return { form, roles, roleStats };
};

export const actions: Actions = {
    create: async ({ request, locals }) => {
        const form = await superValidate(request, roleSchema);
        if (!form.valid) return fail(400, { form });

        const { supabase } = locals;

        try {
            // Check if user is super_admin
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .single();

            if (profile?.role !== 'super_admin') {
                throw new Error('Only super admins can add new roles');
            }

            // Add new role
            const { error: addError } = await supabase
                .rpc('add_user_role_value', {
                    new_role: form.data.role_name
                });

            if (addError) throw addError;
            return { form };
        } catch (err) {
            return fail(500, { 
                form, 
                error: err instanceof Error ? err.message : 'Failed to add role' 
            });
        }
    }
};
```

### 5. Role Management UI (+page.svelte)
```svelte
<script lang="ts">
    import { superForm } from 'sveltekit-superforms/client';
    import type { PageData } from './$types';
    import RoleList from './RoleList.svelte';
    import RoleForm from './RoleForm.svelte';

    export let data: PageData;

    const { form, errors, enhance } = superForm(data.form);
</script>

<div class="container mx-auto p-4">
    <div class="flex justify-between mb-8">
        <h1 class="text-2xl font-bold">Role Management</h1>
        {#if data.isSuper}
            <RoleForm {form} {errors} {enhance} />
        {/if}
    </div>
    
    <RoleList 
        roles={data.roles}
        roleStats={data.roleStats}
    />
</div>
```

## Security Considerations

1. Only super_admin users can add new roles
2. System-critical roles ('super_admin', 'user') cannot be removed
3. Roles in use cannot be removed
4. Role names must follow naming conventions (lowercase, underscores)
5. All role management actions are logged

## Testing

1. Test cases should cover:
   - Adding new roles (as super_admin)
   - Attempting to add roles as non-super_admin
   - Attempting to add invalid role names
   - Viewing role statistics
   - Concurrent role additions
   - SQL injection prevention

2. UI testing for:
   - Form validation
   - Error messages
   - Loading states
   - Role list display
   - Statistics display
   - Permission-based UI elements

## Deployment Steps

1. Create a new migration file with the new functions and view
2. Test the migration in a staging environment
3. Backup the database before deployment
4. Deploy the migration during a low-traffic period
5. Verify all existing role-based functionality still works

## Next Steps

1. Add role descriptions and metadata
2. Implement role-based permission system
3. Add role hierarchy
4. Create role assignment approval workflow
5. Add role usage analytics dashboard
