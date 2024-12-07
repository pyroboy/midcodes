import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load = (async ({ locals: { safeGetSession, supabase }, params }) => {
    const sessionInfo = await safeGetSession();
    console.log('Test Route - Session Info:', {
        hasSession: !!sessionInfo.session,
        hasProfile: !!sessionInfo.profile,
        role: sessionInfo.profile?.role,
        context: sessionInfo.profile?.context
    });
    
    if (!sessionInfo.session || !sessionInfo.profile) {
        throw error(401, 'Unauthorized');
    }

    // Fetch event data to verify it exists and for debugging
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*, organizations(id, name)')
        .eq('event_url', params.event_url)
        .single();

    console.log('Test Route - Event Data:', {
        event,
        error: eventError,
        requestedUrl: params.event_url
    });

    if (eventError || !event) {
        throw error(404, 'Event not found');
    }

    return {
        event,
        debug: {
            url: params.event_url,
            profile: sessionInfo.profile,
            timestamp: new Date().toISOString()
        }
    };
}) satisfies PageServerLoad;
