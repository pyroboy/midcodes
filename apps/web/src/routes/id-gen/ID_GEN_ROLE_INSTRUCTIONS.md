# ID Generator Role Integration Instructions

## Overview
This document provides instructions for implementing role-based access control for the ID Generator module, including database policies and frontend integration.

## 1. Database Policies

### Tables Structure
- `templates`: Stores ID card templates
- `idcards`: Stores generated ID cards
- `organizations`: Organization information
- `profiles`: User profile information

### Role Hierarchy
```
- super_admin
- org_admin
- id_gen_admin
- id_gen_user
```

### Templates Table Policies
```sql
-- Read Access (SELECT)
- super_admin: Full access
- org_admin: Organization-specific access
- id_gen_admin: Organization-specific access
- id_gen_user: Organization-specific read-only access

-- Write Access (INSERT)
- super_admin: Full access
- org_admin: Organization-specific access
- id_gen_admin: Organization-specific access

-- Update/Delete Access
- super_admin: Full access
- id_gen_admin: Organization-specific access
```

### ID Cards Table Policies
```sql
-- Read Access (SELECT)
- super_admin: Full access
- org_admin: Organization-specific access
- id_gen_admin: Organization-specific access
- id_gen_user: Organization-specific access

-- Write Access (INSERT)
- super_admin: Full access
- org_admin: Organization-specific access
- id_gen_admin: Organization-specific access
- id_gen_user: Organization-specific access

-- Update/Delete Access
- super_admin: Full access
- id_gen_admin: Organization-specific access
```

## 2. Frontend Implementation

### Update Role Configuration (`/src/lib/auth/roleConfig.ts`)
```typescript
export const RoleConfig: Record<UserRole, RoleConfiguration> = {
    id_gen_admin: {
        allowedPaths: [
            { path: 'id-gen/templates', showInNav: true, label: 'ID Templates' },
            { path: 'id-gen/templates/**' },
            { path: 'id-gen/use-template' },
            { path: 'id-gen/use-template/**' },
            { path: 'id-gen/all-ids', showInNav: true, label: 'Generated IDs' }
        ],
        isAdmin: true,
        label: 'ID Generator Admin'
    },
    id_gen_user: {
        allowedPaths: [
            { path: 'id-gen/use-template', showInNav: true, label: 'Generate ID' },
            { path: 'id-gen/use-template/**' },
            { path: 'id-gen/all-ids', showInNav: true, label: 'My IDs' }
        ],
        isAdmin: false,
        label: 'ID Generator User'
    }
};
```

### Server-Side Route Protection
Add to each `+page.server.ts`:

```typescript
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { requireAuth } from '$lib/auth/requireAuth';

export const load: PageServerLoad = async (event) => {
    const session = await requireAuth(event);
    if (!session) throw redirect(303, '/auth/signin');
    
    const userRole = session.profile.role;
    const orgId = session.profile.org_id;
    
    // Check role-specific access
    const allowedRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
    if (!allowedRoles.includes(userRole)) {
        throw redirect(303, '/unauthorized');
    }

    // For template management, restrict to admin roles
    if (event.url.pathname.includes('/templates') && 
        !['super_admin', 'org_admin', 'id_gen_admin'].includes(userRole)) {
        throw redirect(303, '/unauthorized');
    }
    
    // ... rest of your load function
};
```

### Client-Side Role Checks
Add to Svelte components:

```typescript
<script lang="ts">
    import { page } from '$app/stores';
    
    $: userRole = $page.data.profile?.role;
    $: orgId = $page.data.profile?.org_id;
    $: isAdmin = ['super_admin', 'org_admin', 'id_gen_admin'].includes(userRole);
    $: canManageTemplates = isAdmin;
    $: canGenerateIds = true; // All roles can generate IDs
</script>

{#if canManageTemplates}
    <!-- Template management UI -->
{/if}

{#if canGenerateIds}
    <!-- ID generation UI -->
{/if}
```

## 3. Testing Checklist

### Database Policies
- [ ] Test template read access for each role
- [ ] Test template write access restrictions
- [ ] Test ID card read access for each role
- [ ] Test ID card write access restrictions
- [ ] Verify organization-specific access controls

### Frontend Access
- [ ] Verify navigation items per role
- [ ] Test template management access restrictions
- [ ] Test ID generation access for all roles
- [ ] Verify organization-specific data visibility

### Error Handling
- [ ] Test unauthorized access redirects
- [ ] Verify proper error messages
- [ ] Test organization mismatch scenarios

## Notes
- All database operations must include org_id checks
- Frontend should hide unauthorized actions
- Implement proper error handling for policy violations
- Consider implementing audit logging for sensitive operations
