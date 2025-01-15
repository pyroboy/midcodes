import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals: { safeGetSession, supabase } }) => {
    const {session ,user,profile,roleEmulation}= await safeGetSession();
    // const { user, profile } = session;

    if (!user) {
        throw error(401, 'Unauthorized');
    }

    if (!profile) {
        throw error(400, 'Profile not found');
    }

    // Get the effective organization ID (either emulated or actual)
    const effectiveOrgId = roleEmulation?.active ? 
        roleEmulation.emulated_org_id : 
        profile.org_id;

    console.log('roleEmulation:', roleEmulation);
    console.log('effectiveOrgId:', effectiveOrgId);

    if (!effectiveOrgId) {
        throw error(500, 'Organization ID not found - User is not associated with any organization');
    }

    // Get statistics for the dashboard
    const { data: recentCards, error: cardsError } = await supabase
        .from('idcards')
        .select('id, template_id, front_image, back_image, created_at, data')
        .eq('org_id', effectiveOrgId)
        .order('created_at', { ascending: false })
        .limit(5);

    const { count: totalCards, error: countError } = await supabase
        .from('idcards')
        .select('*', { count: 'exact', head: true })
        .eq('org_id', effectiveOrgId);

    if (cardsError) {
        console.error('Error fetching recent cards:', cardsError);
    }

    if (countError) {
        console.error('Error fetching total cards:', countError);
    }

    return {
        user,
        profile,
        recentCards: recentCards || [],
        totalCards: totalCards || 0,
        error: cardsError || countError
    };
};
