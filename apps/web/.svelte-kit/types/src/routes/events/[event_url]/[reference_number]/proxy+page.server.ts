// @ts-nocheck
import { error } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import type { Event } from '$lib/types/database';
import { zod } from 'sveltekit-superforms/adapters';

// Schema for email receipt
const emailReceiptSchema = z.object({
    email: z.string().email('Invalid email address')
});

export type EmailReceiptSchema = z.infer<typeof emailReceiptSchema>;

export const load = (async ({ locals: { supabase, session }, params }) => {
    const { event_url, reference_number } = params;

    let event: Event ;
    
    // Fetch event data first
    if (session) {
        const { data, error: eventError } = await supabase
            .from('events')
            .select('*, organizations(id)')
            .eq('event_url', event_url)
            .single();
            
        if (eventError || !data) {
            throw error(404, 'Event not found');
        }
        event = data;
    } else {
        const { data, error: eventError } = await supabase
            .from('public_events')
            .select('*')
            .eq('event_url', event_url)
            .single();
            
        if (eventError || !data) {
            throw error(404, 'Event not found');
        }
        event = data;
        
        if (!event.is_public) {
            throw error(403, 'This event is private. Please log in to view registration details.');
        }
    }

    // Fetch attendee data
    const { data: attendee, error: attendeeError } = await supabase
        .from('attendees')
        .select(`
            id,
            basic_info,
            is_paid,
            qr_link,
            reference_code_url,
            ticket_info,
            created_at,
            updated_at
        `)
        .eq('event_id', event.id)
        .eq('reference_code_url', reference_number)
        .single();

    if (attendeeError || !attendee) {
        throw error(404, 'Attendee not found');
    }

    // Initialize the form with the schema
    const form = await superValidate(zod(emailReceiptSchema));

    return {
        form,
        event,
        attendee,
        session
    };
}) satisfies PageServerLoad;

export const actions = {
    sendReceipt: async ({ request, locals: { supabase }, params }) => {
        const form = await superValidate(request, zod(emailReceiptSchema));
        
        if (!form.valid) {
            return { form };
        }

        try {
            // TODO: Implement email sending functionality
            // This could use a service like SendGrid, AWS SES, or any other email service
            // For now, we'll just return success
            return {
                form,
                success: true
            };
        } catch (err) {
            console.error('Error sending receipt:', err);
            return {
                form,
                error: 'Failed to send receipt'
            };
        }
    }
} satisfies Actions;
;null as any as Actions;