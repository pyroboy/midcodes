import { error, redirect } from '@sveltejs/kit';
import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { ProfileData, EmulatedProfile } from '$lib/types/roleEmulation';
import type { Session } from '../../../app';

interface PageServerLoad {
    ({ locals }: {
        locals: {
            supabase: SupabaseClient;
            safeGetSession: () => Promise<{
                session: Session | null;
                user: User | null;
                profile: ProfileData | EmulatedProfile | null;
            }>;
            user: User | null;
            profile: ProfileData | EmulatedProfile | null;
        };
    }): Promise<{ templates: any[] }>;
}

export const load = (async ({ locals: { supabase, safeGetSession, user, profile } }) => {
    const { session } = await safeGetSession();
    if (!session) {
        throw error(401, 'Unauthorized');
    }

    if (!profile) {
        throw error(400, 'Profile not found');
    }

    const userRole = profile.role;
    const orgId = profile.org_id;
    
    // Check role-specific access - all roles that can use templates
    const allowedRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
    if (!allowedRoles.includes(userRole)) {
        throw error(403, 'Insufficient permissions');
    }

    // Fetch templates based on role and organization
    let query = supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

    // Filter by organization for non-super-admin roles
    if (userRole !== 'super_admin') {
        query = query.eq('org_id', orgId);
    }

    const { data: templates, error: err } = await query;

    if (err) {
        console.error('Error fetching templates:', err);
        throw error(500, 'Error fetching templates');
    }

    return {
        templates
    };
}) satisfies PageServerLoad;
