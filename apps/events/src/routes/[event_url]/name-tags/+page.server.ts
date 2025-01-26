import { error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const printStatusSchema = z.object({
    attendeeIds: z.array(z.string())
});

export type PrintStatusSchema = typeof printStatusSchema;

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

    // Fetch attendees with ticket types
    const { data: attendees, error: attendeeError } = await supabase
        .from('attendees')
        .select(`
            *,
            ticket_type:event_ticket_types(*)
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

    if (attendeeError) {
        throw error(500, 'Failed to load attendees');
    }

    const form = await superValidate(printStatusSchema);

    return {
        event,
        attendees,
        form
    };
};
