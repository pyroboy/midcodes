import { error, fail } from '@sveltejs/kit';
import { superValidate } from 'sveltekit-superforms/server';
import { z } from 'zod';
import type { PageServerLoad, Actions } from './$types';
import { supabase } from '$lib/supabaseClient';
import type { ActionResultData } from '$lib/types/database';

export const qrScanSchema = z.object({
    qrCode: z.string().min(1, 'QR code is required')
});

export type QrScanSchema = typeof qrScanSchema;

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

    const form = await superValidate(qrScanSchema);

    return {
        event,
        form
    };
};

export const actions: Actions = {
    default: async ({ request, params }) => {
        const form = await superValidate(request, qrScanSchema);
        
        if (!form.valid) {
            return fail(400, { 
                form,
                data: {
                    success: false,
                    message: 'Invalid QR code'
                } as ActionResultData
            });
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
                return fail(404, { 
                    form,
                    data: {
                        success: false,
                        message: 'Event not found'
                    } as ActionResultData
                });
            }

            // Fetch attendee
            const { data: attendee, error: attendeeError } = await supabase
                .from('attendees')
                .select(`
                    *,
                    ticket_type:event_ticket_types(*),
                    scan_count:event_scans(count),
                    last_scan:event_scans(created_at)
                `)
                .eq('event_id', event.id)
                .eq('reference_code', form.data.qrCode)
                .single();

            if (attendeeError || !attendee) {
                return fail(404, { 
                    form,
                    data: {
                        success: false,
                        message: 'Invalid QR code or attendee not found'
                    } as ActionResultData
                });
            }

            if (!attendee.is_paid) {
                return fail(400, { 
                    form,
                    data: {
                        success: false,
                        message: 'Ticket is not paid'
                    } as ActionResultData
                });
            }

            // Record scan
            const { error: scanError } = await supabase
                .from('event_scans')
                .insert({
                    event_id: event.id,
                    attendee_id: attendee.id
                });

            if (scanError) {
                return fail(500, { 
                    form,
                    data: {
                        success: false,
                        message: 'Failed to record scan'
                    } as ActionResultData
                });
            }

            // Format scan count and last scan
            const scanCount = attendee.scan_count?.[0]?.count || 0;
            const lastScan = attendee.last_scan?.[0]?.created_at;

            return {
                form,
                data: {
                    success: true,
                    message: `Verified: ${attendee.first_name} ${attendee.last_name}`,
                    data: {
                        ...attendee,
                        scan_count: scanCount + 1,
                        last_scan: new Date().toISOString()
                    }
                } as ActionResultData
            };
        } catch (err) {
            console.error('QR scan error:', err);
            return fail(500, { 
                form,
                data: {
                    success: false,
                    message: 'An unexpected error occurred'
                } as ActionResultData
            });
        }
    }
};
