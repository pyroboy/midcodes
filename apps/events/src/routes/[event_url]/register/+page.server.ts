import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { registrationSchema } from './schema';
import type { PageServerLoad, Actions } from './$types';
import { supabase } from '$lib/supabaseClient';
import type { Event, EventTicketType } from '$lib/types/database';

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

    // Check if registration is open
    const now = new Date();
    const registrationStart = new Date(event.registration_start);
    const registrationEnd = new Date(event.registration_end);

    if (now < registrationStart) {
        throw error(403, 'Registration has not started yet');
    }

    if (now > registrationEnd) {
        throw error(403, 'Registration has ended');
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

    const form = await superValidate(registrationSchema);

    return {
        event,
        ticketTypes,
        form
    };
};

export const actions: Actions = {
    default: async ({ request, params }) => {
        const form = await superValidate(request, registrationSchema);
        
        if (!form.valid) {
            return fail(400, { form });
        }

        const { event_url } = params;

        try {
            // Fetch event
            const { data: event, error: eventError } = await supabase
                .from('events')
                .select('*')
                .eq('url', event_url)
                .single();

            if (eventError || !event) {
                return fail(404, { form, message: 'Event not found' });
            }

            // Verify ticket availability
            const { data: ticket, error: ticketError } = await supabase
                .from('event_ticket_types')
                .select('*')
                .eq('id', form.data.ticketType)
                .single();

            if (ticketError || !ticket) {
                return fail(400, { form, message: 'Invalid ticket type' });
            }

            if (ticket.sold >= ticket.quantity) {
                return fail(400, { form, message: 'Ticket type is sold out' });
            }

            // Generate reference code
            const referenceCode = generateReferenceCode();

            // Create attendee record
            const { data: attendee, error: attendeeError } = await supabase
                .from('attendees')
                .insert({
                    event_id: event.id,
                    ticket_type_id: ticket.id,
                    first_name: form.data.firstName,
                    last_name: form.data.lastName,
                    email: form.data.email,
                    phone: form.data.phone,
                    reference_code: referenceCode,
                    payment_deadline: new Date(Date.now() + event.payment_timeout_minutes * 60000).toISOString(),
                    additional_info: form.data.additionalInfo || {}
                })
                .select()
                .single();

            if (attendeeError) {
                return fail(500, { form, message: 'Failed to create registration' });
            }

            // Increment sold count
            const { error: updateError } = await supabase
                .from('event_ticket_types')
                .update({ sold: ticket.sold + 1 })
                .eq('id', ticket.id);

            if (updateError) {
                // Log error but don't fail the registration
                console.error('Failed to update ticket count:', updateError);
            }

            return {
                form,
                type: 'success',
                data: {
                    name: `${attendee.first_name} ${attendee.last_name}`,
                    email: attendee.email,
                    phone: attendee.phone,
                    ticketType: ticket.name,
                    referenceCode: attendee.reference_code,
                    paymentTimeoutMinutes: event.payment_timeout_minutes,
                    event: {
                        name: event.event_name,
                        longName: event.long_name,
                        otherInfo: event.other_info
                    }
                }
            };
        } catch (err) {
            console.error('Registration error:', err);
            return fail(500, { form, message: 'An unexpected error occurred' });
        }
    }
};

function generateReferenceCode(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `${timestamp}${random}`.toUpperCase();
}
