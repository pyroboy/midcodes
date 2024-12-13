import type { PageServerLoad, RequestEvent } from './$types';
import { error } from '@sveltejs/kit';
import type { Profile } from '../../../lib/types/database';

export const load: PageServerLoad = async ({ locals }: RequestEvent) => {
    const { supabase, user, profile } = locals;

    if (!user || !profile) {
        throw error(403, 'Unauthorized');
    }

    const userProfile = profile as Profile;
    
    // Verify role permissions
    const allowedRoles = ['super_admin', 'org_admin'];
    if (!allowedRoles.includes(userProfile.role)) {
        throw error(403, 'Insufficient permissions');
    }

    // Check if org_admin has an org_id
    if (userProfile.role === 'org_admin' && !userProfile.org_id) {
        throw error(403, 'Organization ID is required for org_admin users');
    }

    // Get templates based on role
    let templatesQuery = supabase.from('templates').select('*, organizations(*)');
    
    // For org_admin, only show templates from their organization
    if (userProfile.role === 'org_admin' && userProfile.org_id) {
        templatesQuery = templatesQuery.eq('org_id', userProfile.org_id);
    }

    const { data: templates, error: templatesError } = await templatesQuery;

    if (templatesError) {
        console.error('Error fetching templates:', templatesError);
        throw error(500, 'Error fetching templates');
    }

    // Get organization info
    let organization = null;
    if (userProfile.role === 'org_admin' && userProfile.org_id) {
        const { data: orgData } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', userProfile.org_id)
            .single();
        organization = orgData;
    }

    return {
        user,
        profile: userProfile,
        templates,
        organization
    };
};
