import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';
import { supabase } from '$lib/supabaseClient';

export const testAttendeeSchema = z.object({
    ticket_type_id: z.string(),
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(1, 'Phone number is required'),
    payment_status: z.enum(['paid', 'pending'])
});

export type TestAttendeeSchema = typeof testAttendeeSchema;

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

    const form = await superValidate(testAttendeeSchema);

    return {
        event,
        ticketTypes,
        form
    };
};

export const actions: Actions = {
    default: async ({ request, params }) => {
        const form = await superValidate(request, testAttendeeSchema);
        
        if (!form.valid) {
            return fail(400, { form });
        }

        const { event_url } = params;

        try {
            // Get event details
            const { data: event } = await supabase
                .from('events')
                .select('*')
                .eq('url', event_url)
                .single();

            if (!event) {
                return fail(404, { form, message: 'Event not found' });
            }

            // Generate reference code
            const referenceCode = `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

            // Create attendee
            const { data: attendee, error: attendeeError } = await supabase
                .from('attendees')
                .insert({
                    event_id: event.id,
                    ticket_type_id: form.data.ticket_type_id,
                    first_name: form.data.first_name,
                    last_name: form.data.last_name,
                    email: form.data.email,
                    phone: form.data.phone,
                    reference_code: referenceCode,
                    is_paid: form.data.payment_status === 'paid',
                    payment_deadline: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours from now
                })
                .select()
                .single();

            if (attendeeError) {
                return fail(500, { form, message: 'Failed to create test attendee' });
            }

            // If paid status, create a payment record
            if (form.data.payment_status === 'paid') {
                const { error: paymentError } = await supabase
                    .from('payments')
                    .insert({
                        event_id: event.id,
                        attendee_id: attendee.id,
                        amount: event.ticket_price,
                        status: 'verified',
                        payment_reference: `TEST${Math.random().toString(36).substring(2, 8).toUpperCase()}`
                    });

                if (paymentError) {
                    return fail(500, { form, message: 'Failed to create test payment record' });
                }
            }

            return {
                form,
                message: `Test attendee created successfully with reference code: ${referenceCode}`
            };
        } catch (err) {
            console.error('Failed to create test attendee:', err);
            return fail(500, { form, message: 'An unexpected error occurred' });
        }
    }
};
