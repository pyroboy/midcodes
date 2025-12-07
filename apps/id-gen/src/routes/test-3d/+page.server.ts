import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
    const { supabase, org_id } = locals;

    if (!org_id) {
        return {
            cards: []
        };
    }

    // Fetch recent ID cards for textures
    const { data: cardsData, error: cardsError } = await supabase
        .from('idcards')
        .select(`
			id, 
			template_id, 
			front_image, 
			back_image, 
			created_at
		`)
        .eq('org_id', org_id)
        .order('created_at', { ascending: false })
        .limit(12);

    if (cardsError) {
        console.error('❌ [test-3d] Error fetching cards:', cardsError);
    }

    return {
        cards: cardsData || []
    };
};
