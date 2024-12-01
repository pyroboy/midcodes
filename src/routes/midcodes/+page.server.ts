import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const { supabase, user, profile } = locals;

    if (!user || !profile) {
        throw error(401, { message: 'Unauthorized' });
    }

    // Verify super admin role
    if (profile.role !== 'super_admin') {
        throw error(403, { message: 'You are not Arjo Magno' });
    }

    // Fetch data from all relevant tables
    const [
        templatesResult,
        idcardsResult,
        organizationsResult,
        profilesResult
    ] = await Promise.all([
        supabase.from('templates').select('*'),
        supabase.from('idcards').select('*'),
        supabase.from('organizations').select('*'),
        supabase.from('profiles').select('*')
    ]);

    if (templatesResult.error) {
        throw error(500, { message: 'Error fetching templates' });
    }

    if (idcardsResult.error) {
        throw error(500, { message: 'Error fetching ID cards' });
    }

    if (organizationsResult.error) {
        throw error(500, { message: 'Error fetching organizations' });
    }

    if (profilesResult.error) {
        throw error(500, { message: 'Error fetching profiles' });
    }

    // Calculate statistics
    const stats = {
        totalTemplates: templatesResult.data.length,
        totalIdCards: idcardsResult.data.length,
        totalOrganizations: organizationsResult.data.length,
        totalUsers: profilesResult.data.length,
        templatesPerOrg: organizationsResult.data.map(org => ({
            orgName: org.name,
            count: templatesResult.data.filter(t => t.org_id === org.id).length
        })),
        idCardsPerOrg: organizationsResult.data.map(org => ({
            orgName: org.name,
            count: idcardsResult.data.filter(card => card.org_id === org.id).length
        })),
        usersByRole: {
            superAdmin: profilesResult.data.filter(p => p.role === 'super_admin').length,
            orgAdmin: profilesResult.data.filter(p => p.role === 'org_admin').length,
            user: profilesResult.data.filter(p => p.role === 'user').length
        }
    };

    return {
        stats,
        templates: templatesResult.data,
        idcards: idcardsResult.data,
        organizations: organizationsResult.data,
        profiles: profilesResult.data
    };
};
