import { redirect } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ parent, params }) => {
    const { session, supabase } = await parent();
    
    if (!session) {
        throw redirect(303, '/auth');
    }
    
    // Fetch the template data
    const { data: template, error } = await supabase
        .from('templates')
        .select('*')
        .eq('id', params.id)
        .single();

    if (error) {
        console.error('Error fetching template:', error);
        return {
            template: null,
            session
        };
    }

    return {
        template,
        session
    };
};
