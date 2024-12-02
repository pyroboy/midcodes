import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { z } from 'zod';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms/server';
import type { PaymentSummary } from '$lib/types/database';

// Schema for payment status update
const paymentUpdateSchema = z.object({
    attendeeId: z.string().uuid(),
    isPaid: z.boolean(),
    receivedBy: z.string().uuid()
});

export type PaymentUpdateSchema = typeof paymentUpdateSchema;

// Type for the Supabase response
interface AttendeeWithProfile {
    id: string;
    basic_info: Record<string, any>;
    event_id: string;
    ticket_info: { price: number } & Record<string, any>;
    is_paid: boolean;
    received_by: string | null;
    reference_code_url: string | null;
    created_at: string;
    updated_at: string;
    profiles: Array<{
        id: string;
        full_name: string;
    }>;
}

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

    // Get attendees with payment info
    const { data: attendees, error: attendeesError } = await supabase
        .from('attendees')
        .select(`
            id,
            basic_info,
            event_id,
            ticket_info,
            is_paid,
            received_by,
            reference_code_url,
            created_at,
            updated_at
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

    if (attendeesError) {
        throw error(500, 'Failed to fetch attendees');
    }

    // Calculate payment summary
    const initialSummary: PaymentSummary = {
        grandTotal: 0,
        totalByReceiver: {},
        totalPaid: 0,
        totalUnpaid: 0
    };

    const paymentSummary = (attendees as AttendeeWithProfile[]).reduce((summary, attendee) => {
        const ticketPrice = attendee.ticket_info?.price || 0;
        summary.grandTotal += ticketPrice;

        if (attendee.is_paid) {
            summary.totalPaid += ticketPrice;
            if (attendee.received_by) {
                summary.totalByReceiver[attendee.received_by] = 
                    (summary.totalByReceiver[attendee.received_by] || 0) + ticketPrice;
            }
        } else {
            summary.totalUnpaid += ticketPrice;
        }

        return summary;
    }, initialSummary);

    // Initialize the form with the schema
    const form = await superValidate(zod(paymentUpdateSchema));

    return {
        form,
        event,
        attendees,
        paymentSummary
    };
}) satisfies PageServerLoad;

export const actions = {
    updatePayment: async ({ request, locals: { supabase }, params }) => {
        const formData = await request.formData();
        const attendeeId = formData.get('attendeeId') as string;
        const isPaid = formData.get('isPaid') === 'true';
        const receivedBy = formData.get('receivedBy') as string;

        const { error: updateError } = await supabase
            .from('attendees')
            .update({
                is_paid: isPaid,
                received_by: isPaid ? receivedBy : null
            })
            .eq('id', attendeeId);

        if (updateError) {
            return fail(500, { message: 'Failed to update payment status' });
        }

        // Fetch updated data
        const { data: event } = await supabase
            .from('events')
            .select('*, organizations(id)')
            .eq('event_url', params.event_url)
            .single();

        const { data: attendees } = await supabase
            .from('attendees')
            .select(`
                id,
                basic_info,
                event_id,
                ticket_info,
                is_paid,
                received_by,
                reference_code_url,
                created_at,
                updated_at
            `)
            .eq('event_id', event.id)
            .order('created_at', { ascending: false });

        // Calculate new payment summary
        const initialSummary: PaymentSummary = {
            grandTotal: 0,
            totalByReceiver: {},
            totalPaid: 0,
            totalUnpaid: 0
        };

        const paymentSummary = (attendees as AttendeeWithProfile[]).reduce((summary, attendee) => {
            const ticketPrice = attendee.ticket_info?.price || 0;
            summary.grandTotal += ticketPrice;

            if (attendee.is_paid) {
                summary.totalPaid += ticketPrice;
                if (attendee.received_by) {
                    summary.totalByReceiver[attendee.received_by] = 
                        (summary.totalByReceiver[attendee.received_by] || 0) + ticketPrice;
                }
            } else {
                summary.totalUnpaid += ticketPrice;
            }

            return summary;
        }, initialSummary);

        return {
            type: 'success',
            status: 200,
            data: {
                attendees,
                paymentSummary
            }
        };
    }
} satisfies Actions;
