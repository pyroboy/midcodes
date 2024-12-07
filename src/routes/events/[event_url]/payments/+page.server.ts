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

export interface PaymentSummary {
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

    // Get attendees
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

    // Get payment summary from view
    const { data: receiverSummary, error: summaryError } = await supabase
        .from('payment_summary_by_receiver')
        .select('*')
        .order('total_amount', { ascending: false });

    if (summaryError) {
        throw error(500, 'Failed to fetch payment summary');
    }

    // Calculate overall totals
    const paymentSummary = (attendees || []).reduce((summary: PaymentSummary, attendee) => {
        // Skip archived entries entirely unless they're paid
        if (attendee.attendance_status === 'archived' && !attendee.is_paid) {
            return summary;
        }

        const ticketPrice = attendee.ticket_info?.price || 0;
        summary.grandTotal += ticketPrice;

        if (attendee.is_paid) {
            summary.totalPaid += ticketPrice;
        } else {
            summary.totalUnpaid += ticketPrice;
        }

        return summary;
    }, {
        grandTotal: 0,
        totalPaid: 0,
        totalUnpaid: 0,
        totalByReceiver: (receiverSummary || []).reduce((acc, { receiver_email, total_amount }) => {
            acc[receiver_email] = total_amount;
            return acc;
        }, {} as Record<string, number>)
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

export const actions: Actions = {
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
        console.log('Calling RPC with:', { p_attendee_id: form.data.attendeeId , p_received_by: form.data.receivedBy });
        const { data: result, error: paymentError } = await supabase.rpc('confirm_attendee_payment', {
            p_attendee_id: form.data.attendeeId,p_received_by: form.data.receivedBy
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

    clearExpired: async ({ request, locals: { safeGetSession,supabase } }) => {
        console.log('[Server] Starting cleanup operation');
        
        const sessionInfo = await safeGetSession();
        if (!sessionInfo.session || !sessionInfo.profile) {
            console.log('[Server] Cleanup failed: Unauthorized');
            return fail(401, { message: 'Unauthorized' });
        }

        const formData = await request.formData();
        const attendeeIdsStr = formData.get('attendeeIds');
        
        if (!attendeeIdsStr) {
            console.log('[Server] No attendee IDs provided');
            return fail(400, { message: 'No attendee IDs provided' });
        }

        let attendeeIds;
        try {
            attendeeIds = JSON.parse(attendeeIdsStr.toString());
            console.log('[Server] Parsed attendee IDs:', { count: attendeeIds.length });
        } catch (error) {
            console.error('[Server] Error parsing attendeeIds:', error);
            return fail(400, { message: 'Invalid attendee IDs format' });
        }

        console.log('[Server] Calling archive_expired_attendees RPC');
        const { data: result, error: cleanupError } = await supabase
            .rpc('archive_expired_attendees', {
                p_attendee_ids: attendeeIds
            });

        if (cleanupError) {
            console.error('[Server] Cleanup error:', cleanupError);
            return fail(500, {
                message: cleanupError.message || 'Failed to archive expired entries'
            });
        }

        console.log('[Server] Cleanup result:', {
            success: result?.success,
            message: result?.message,
            data: result
        });

        return {
            success: true,
            message: result?.message || 'Cleanup completed'
        };
    },

    deleteAllArchived: async ({ request, locals: { supabase } }) => {
        const formData = await request.formData();
        const eventUrl = formData.get('eventUrl')?.toString();

        if (!eventUrl) {
            return fail(400, { message: 'Event URL is required' });
        }

        const { error } = await supabase
            .from('attendees')
            .delete()
            .eq('event_url', eventUrl)
            .eq('attendance_status', 'archived');

        if (error) {
            console.error('Error deleting archived entries:', error);
            return fail(500, { message: 'Failed to delete archived entries' });
        }

        return { success: true };
    }
};