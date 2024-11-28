import type { LayoutServerLoadEvent } from './$types';
import type { Organization, Profile } from '$lib/types/database';

export const load = async ({ locals: { supabase, safeGetSession }, url }: LayoutServerLoadEvent) => {
    // Get authenticated session data using the safe method
    const { session, user } = await safeGetSession();

    // Add security headers
    const response = new Response();
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');

    if (!session || !user) {
        console.log('No session or user found');
        return {
            session: null,
            user: null,
            profile: null,
            organizations: [] as Organization[],
            currentOrg: null
        };
    }

    // Only fetch essential profile fields
    const { data: profile, error } = await supabase
        .from('profiles')
        .select('role, org_id')
        .eq('id', user.id)
        .single();

    if (error) {
        console.error('Error fetching profile:', error);
        return {
            session,
            user,
            profile: null,
            organizations: [] as Organization[],
            currentOrg: null
        };
    }

    let organizations: Organization[] = [];
    let currentOrg: Organization | null = null;

    // Get the org_id from URL if super_admin is switching organizations
    const urlOrgId = url.searchParams.get('org');

    // For super_admin, use org_id from URL if available
    const effectiveOrgId = profile.role === 'super_admin' && urlOrgId ? urlOrgId : profile.org_id;
    // console.log('Server Layout: Role:', profile.role, 'Effective Org ID:', effectiveOrgId);

    // Fetch organizations based on role
    if (profile.role === 'super_admin') {
        const { data: orgsData, error: orgsError } = await supabase
            .from('organizations')
            .select('*')
            .order('name');

        if (orgsError) {
            console.error('Error fetching organizations:', orgsError);
            return {
                session,
                user,
                profile,
                organizations: [] as Organization[],
                currentOrg: null
            };
        }

        organizations = orgsData as Organization[];
        // console.log('Server Layout: Fetched organizations for super_admin:', organizations);

        // If an org is selected, get its details
        if (effectiveOrgId) {
            currentOrg = organizations.find(org => org.id === effectiveOrgId) || null;
            // console.log('Server Layout: Set current org for super_admin:', currentOrg);
        }
    } else if (profile.role === 'org_admin' && effectiveOrgId) {
        // console.log('Server Layout: Fetching org for org_admin with ID:', effectiveOrgId);
        const { data: orgData, error: orgError } = await supabase
            .from('organizations')
            .select('*')
            .eq('id', effectiveOrgId)
            .single();

        if (orgError) {
            console.error('Error fetching organization:', orgError);
            return {
                session,
                user,
                profile,
                organizations: [] as Organization[],
                currentOrg: null
            };
        }

        currentOrg = orgData as Organization;
        // console.log('Server Layout: Set current org for org_admin:', currentOrg);
        organizations = currentOrg ? [currentOrg] : [];
    }

    return {
        session,
        user,
        profile,
        organizations,
        currentOrg
    };
};