import { error } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import type { PageServerLoad } from './$types';
import { supabase } from '$lib/supabaseClient';

export const paymentStatusSchema = z.object({
    paymentId: z.string(),
    status: z.enum(['verified', 'pending', 'failed'])
});

export type PaymentStatusSchema = typeof paymentStatusSchema;

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

    // Fetch payments with attendee details
    const { data: payments, error: paymentError } = await supabase
        .from('payments')
        .select(`
            *,
            attendee:attendees(
                *,
                ticket_type:event_ticket_types(*)
            )
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

    if (paymentError) {
        throw error(500, 'Failed to load payments');
    }

    // Calculate statistics
    const totalRevenue = payments
        .filter(p => p.status === 'verified')
        .reduce((sum, p) => sum + p.amount, 0);

    const pendingPayments = payments.filter(p => p.status === 'pending').length;

    const successRate = payments.length > 0
        ? Math.round((payments.filter(p => p.status === 'verified').length / payments.length) * 100)
        : 0;

    const form = await superValidate(paymentStatusSchema);

    return {
        event,
        payments,
        totalRevenue,
        pendingPayments,
        successRate,
        form
    };
};
