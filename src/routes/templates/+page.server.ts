import type { PageServerLoad } from './$types';
import { supabase } from '../../lib/supabaseClient';
import { error, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
    const { session } = await locals.safeGetSession();
    
    if (!session) {
        throw redirect(303, '/auth');
    }

    const { data: templates, error: templatesError } = await supabase
        .from('templates')
        .select('*');

    if (templatesError) {
        throw error(500, 'Error loading templates');
    }

    return {
        templates: templates || []
    };
};
