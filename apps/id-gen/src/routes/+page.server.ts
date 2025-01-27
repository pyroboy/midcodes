import type { PageServerLoad } from './$types';
import { error } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals}) => {

    const { supabase, session, user, org_id, permissions } = locals;
    // const { user, profile } = session;
console.log('session:', session);
console.log('user:', user);
console.log('org_id:', org_id);

    const effectiveOrgId = org_id;


    // Get the effective organization ID (either emulated or actual)

    // console.log('effectiveOrgId:', effectiveOrgId);

    // if (!effectiveOrgId) {
    //     throw error(500, 'Organization ID not found - User is not associated with any organization');
    // }

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
        recentCards: recentCards || [],
        totalCards: totalCards || 0,
        error: cardsError || countError
    };
};
