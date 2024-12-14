import type { PageServerLoad } from './$types';
import { error, redirect } from '@sveltejs/kit';




export const load = (async ({ locals: { supabase, session } }) => {

    let event: Event ;
    
    // Fetch event data first
    // if (session) {
    //     const { data, error: eventError } = await supabase



    if (!session) {
        throw redirect(303, '/auth');
    }

    // Check if user is super_admin
    const userRole = session.user.user_metadata?.role;
    if (userRole !== 'super_admin') {
        return {
            templates: []
        };
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
})
