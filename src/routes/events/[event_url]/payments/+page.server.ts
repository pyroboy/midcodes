import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { z } from 'zod';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms/server';

const paymentUpdateSchema = z.object({
    attendeeId: z.string().uuid(),

    receivedBy: z.string().uuid()
});

const clearExpiredSchema = z.object({
    attendeeIds: z.array(z.string().uuid())
});

export type PaymentUpdateSchema = typeof paymentUpdateSchema;
export type ClearExpiredSchema = typeof clearExpiredSchema;

interface PaymentSummary {
    grandTotal: number;
    totalPaid: number;
    totalUnpaid: number;
    totalByReceiver: Record<string, number>;
}

export const load = (async ({ locals: { safeGetSession, supabase }, params }) => {
    const sessionInfo = await safeGetSession();
    // console.log('Session info:', { 
    //     hasSession: !!sessionInfo.session, 
    //     userId: sessionInfo.session?.user?.id 
    // });
    
    if (!sessionInfo.session || !sessionInfo.profile) {
        throw error(401, 'Unauthorized');
    }

    const { data: event, error: eventError } = await supabase
        .from('events')
        .select('*, organizations(id, name)')
        .eq('event_url', params.event_url)
        .single();

    if (eventError || !event) {
        throw error(404, 'Event not found');
    }

    const { data: attendees, error: attendeesError } = await supabase
        .from('attendees')
        .select(`
            id,
            basic_info,
            ticket_info,
            is_paid,
            received_by,
            reference_code_url,
            attendance_status,
            created_at,
            updated_at,
            org_id
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

    if (attendeesError) {
        throw error(500, 'Failed to fetch attendees');
    }

    const paymentSummary = (attendees || []).reduce((summary: PaymentSummary, attendee) => {
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
    }, {
        grandTotal: 0,
        totalByReceiver: {},
        totalPaid: 0,
        totalUnpaid: 0
    });

    const form = await superValidate(zod(paymentUpdateSchema));
    const clearForm = await superValidate(zod(clearExpiredSchema));

    return {
        event,
        attendees: attendees || [],
        paymentSummary,
        form,
        clearForm,
        session: {
            user: sessionInfo.session.user
        }
    };
}) satisfies PageServerLoad;

export const actions = {
    updatePayment: async ({ request, locals: { safeGetSession, supabase }}) => {
        const sessionInfo = await safeGetSession();
        if (!sessionInfo.session || !sessionInfo.profile) {
            return fail(401, { message: 'Unauthorized' });
        }

        // Get form data
        const formData = await request.formData();
        console.log('Raw form data received:', Object.fromEntries(formData));

        // Handle superForm submission
        const form = await superValidate(formData, zod(paymentUpdateSchema));
        
        console.log('Form validation result:', {
            isValid: form.valid,
            data: form.data,
            errors: form.errors
        });

        if (!form.valid) {
            console.error('Form validation failed:', form.errors);
            return fail(400, { 
                form,
                message: 'Invalid form data',
                debug: { errors: form.errors }
            });
        }

        // Call RPC with validated data
        console.log('Calling RPC with:', { p_attendee_id: form.data.attendeeId });
        const { data: result, error: paymentError } = await supabase.rpc('confirm_attendee_payment', {
            p_attendee_id: form.data.attendeeId
        });

        console.log('RPC result:', { result, error: paymentError });

        if (paymentError) {
            console.error('Payment error:', paymentError);
            return fail(500, {
                form,
                message: paymentError.message || 'Failed to update payment status'
            });
        }

        if (!result?.success) {
            console.error('Payment not successful:', result);
            const message = result?.message || 'Failed to confirm payment';
            const status = result?.status || 'failed';
            
            return fail(400, {
                form,
                error: status === 'expired' ? 'PAYMENT_EXPIRED' : 'PAYMENT_FAILED',
                message
            });
        }

        console.log('Payment confirmed successfully');
        return { 
            form,
            success: true,
            message: 'Payment confirmed successfully'
        };
    },

    clearExpired: async ({ request, locals: { safeGetSession, supabase }}) => {
        const sessionInfo = await safeGetSession();
        if (!sessionInfo.session || !sessionInfo.profile) {
            return fail(401, { message: 'Unauthorized' });
        }

        const { data: result, error: cleanupError } = await supabase
            .rpc('cleanup_expired_registrations');

        if (cleanupError) {
            return fail(500, {
                message: cleanupError.message || 'Failed to archive expired entries'
            });
        }

        return {
            success: true,
            message: result.message
        };
    }
} satisfies Actions;