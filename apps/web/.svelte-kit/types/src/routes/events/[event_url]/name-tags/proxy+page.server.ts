// @ts-nocheck
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { z } from 'zod';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms/server';
import type { Attendee } from '$lib/types/database';
import { generateReferenceCode } from '$lib/utils/generators';

// Schema for updating printed status
const printStatusSchema = z.object({
    attendeeId: z.string().uuid(),
    isPrinted: z.boolean()
});

export type PrintStatusSchema = z.infer<typeof printStatusSchema>;

export const load = (async ({ locals: { supabase }, params }) => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        throw error(401, 'Unauthorized');
    }

    // Fetch event data first to verify access
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*, organizations(id)')
        .eq('event_url', params.event_url)
        .single();

    if (eventError || !event) {
        throw error(404, 'Event not found');
    }

    // Fetch all attendees for this event with their printed status
    const { data: attendees, error: attendeesError } = await supabase
        .from('attendees')
        .select(`
            id,
            basic_info,
            event_id,
            ticket_info,
            is_printed,
            reference_code_url,
            created_at,
            updated_at
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

    if (attendeesError) {
        throw error(500, 'Failed to fetch attendees');
    }

    // Generate reference codes for attendees who don't have one
    for (const attendee of attendees) {
        if (!attendee.reference_code_url) {
            const referenceCode = generateReferenceCode();
            const { error: updateError } = await supabase
                .from('attendees')
                .update({ 
                    reference_code_url: `${event.event_url}/${referenceCode}`
                })
                .eq('id', attendee.id);
            
            if (!updateError) {
                attendee.reference_code_url = `${event.event_url}/${referenceCode}`;
            }
        }
    }

    // Initialize the form with the schema
    const form = await superValidate(zod(printStatusSchema));

    return {
        form,
        event,
        attendees,
        session: {
            user: session.user
        }
    };
}) satisfies PageServerLoad;

export const actions = {
    updatePrintStatus: async ({ request, locals: { supabase, getSession } }: import('./$types').RequestEvent) => {
        const session = await getSession();
        if (!session) {
            return fail(401, { message: 'Unauthorized' });
        }

        const form = await superValidate(request, zod(printStatusSchema));
        
        if (!form.valid) {
            return fail(400, { form });
        }

        const { error: updateError } = await supabase
            .from('attendees')
            .update({ 
                is_printed: form.data.isPrinted,
                updated_at: new Date().toISOString()
            })
            .eq('id', form.data.attendeeId);

        if (updateError) {
            return fail(500, { 
                form,
                message: 'Failed to update print status'
            });
        }

        return { form };
    }
};
;null as any as Actions;