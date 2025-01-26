import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';
import { supabase } from '$lib/supabaseClient';
import { sendEmail } from '$lib/email';

export const emailReceiptSchema = z.object({
    email: z.string().email('Invalid email address')
});

export type EmailReceiptSchema = typeof emailReceiptSchema;

export const load: PageServerLoad = async ({ params }) => {
    const { event_url, reference_number } = params;

    // Fetch event details
    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*')
        .eq('url', event_url)
        .single();

    if (eventError || !event) {
        throw error(404, 'Event not found');
    }

    // Fetch attendee details with ticket type
    const { data: attendee, error: attendeeError } = await supabase
        .from('attendees')
        .select(`
            *,
            ticket_type:event_ticket_types(*)
        `)
        .eq('event_id', event.id)
        .eq('reference_code', reference_number)
        .single();

    if (attendeeError || !attendee) {
        throw error(404, 'Registration not found');
    }

    const form = await superValidate(emailReceiptSchema);

    return {
        event,
        attendee,
        form
    };
};

export const actions: Actions = {
    default: async ({ request, params }) => {
        const form = await superValidate(request, emailReceiptSchema);
        
        if (!form.valid) {
            return fail(400, { form });
        }

        const { event_url, reference_number } = params;

        try {
            // Fetch event and attendee details
            const { data: event } = await supabase
                .from('events')
                .select('*')
                .eq('url', event_url)
                .single();

            const { data: attendee } = await supabase
                .from('attendees')
                .select(`
                    *,
                    ticket_type:event_ticket_types(*)
                `)
                .eq('reference_code', reference_number)
                .single();

            if (!event || !attendee) {
                return fail(404, { form, message: 'Registration not found' });
            }

            if (!attendee.is_paid) {
                return fail(400, { form, message: 'Cannot send receipt for unpaid registration' });
            }

            // Send email receipt
            await sendEmail({
                to: form.data.email,
                subject: `Receipt for ${event.event_name}`,
                html: `
                    <h1>Receipt for ${event.event_name}</h1>
                    <p>Dear ${attendee.first_name} ${attendee.last_name},</p>
                    <p>Thank you for your registration. Here are your details:</p>
                    <ul>
                        <li>Event: ${event.event_name}</li>
                        <li>Ticket Type: ${attendee.ticket_type.name}</li>
                        <li>Amount Paid: ₱${attendee.ticket_type.price.toLocaleString()}</li>
                        <li>Reference Number: ${attendee.reference_code}</li>
                    </ul>
                    <p>Please keep this receipt for your records.</p>
                `
            });

            return {
                form,
                message: 'Receipt sent successfully'
            };
        } catch (err) {
            console.error('Failed to send receipt:', err);
            return fail(500, { form, message: 'Failed to send receipt' });
        }
    }
};
