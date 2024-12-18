import { redirect, error } from '@sveltejs/kit';
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
    }): Promise<{ idCards: any[] }>;
}

export const load = (async ({ locals: { supabase, safeGetSession, user, profile } }) => {
    const { session } = await safeGetSession();
    if (!session) {
        throw error(401, 'Unauthorized');
    }

    if (!profile) {
        throw error(400, 'Profile not found');
    }

    // Get the effective organization ID (either emulated or actual)
    const effectiveOrgId = session?.roleEmulation?.active ? 
        session.roleEmulation.emulated_org_id : 
        profile.org_id;
    
    if (!effectiveOrgId) {
        throw error(500, 'Organization ID not found');
    }

    const userRole = profile.role;
    
    // Check role-specific access
    const allowedRoles = ['super_admin', 'org_admin', 'id_gen_admin', 'id_gen_user'];
    if (!allowedRoles.includes(userRole)) {
        throw redirect(303, '/unauthorized');
    }

    // Fetch ID cards based on role and organization
    const query = supabase
        .from('idcards')
        .select(`
            *,
            templates (
                id,
                name,
                org_id
            )
        `)
        .order('created_at', { ascending: false });

    // Filter by organization for non-super-admin roles
    if (userRole !== 'super_admin') {
        query.eq('org_id', effectiveOrgId);
    }

    const { data: idCards, error: fetchError } = await query;

    if (fetchError) {
        console.error('Error fetching ID cards:', fetchError);
        throw error(500, 'Failed to load ID cards');
    }

    return {
        idCards: idCards || []
    };
}) satisfies PageServerLoad;
