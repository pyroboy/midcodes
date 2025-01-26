import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const load: PageServerLoad = async ({ params }) => {
    const { event_url } = params;

    // Fetch event details
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('url', event_url)
        .single();

    if (eventError || !event) {
        throw error(404, 'Event not found');
    }

    // Fetch ticket types
    const { data: ticketTypes, error: ticketError } = await supabase
        .from('event_ticket_types')
        .select('*')
        .eq('event_id', event.id)
        .order('price', { ascending: true });

    if (ticketError) {
        throw error(500, 'Failed to load ticket types');
    }

    return {
        event,
        ticketTypes
    };
};
