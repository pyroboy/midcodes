// @ts-nocheck
import { error, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { z } from 'zod';
import { zod } from 'sveltekit-superforms/adapters';
import { superValidate } from 'sveltekit-superforms/server';

// Schema for QR scan update
const qrScanSchema = z.object({
    attendeeId: z.string().uuid(),
    scannedUrl: z.string().url(),
    scanType: z.enum(['entry', 'exit']),
    scanNotes: z.string().optional()
});

export type QrScanSchema = typeof qrScanSchema;

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

    // Get scan logs for this event
    const { data: scanLogs, error: scanLogsError } = await supabase
        .from('attendees')
        .select(`
            id,
            basic_info,
            qr_scan_info,
            attendance_status,
            reference_code_url
        `)
        .eq('event_id', event.id)
        .order('created_at', { ascending: false });

    if (scanLogsError) {
        throw error(500, 'Failed to fetch scan logs');
    }

    // Initialize the form with the schema
    const form = await superValidate(zod(qrScanSchema));

    return {
        form,
        event,
        scanLogs,
        session: {
            user: session.user
        }
    };
}) satisfies PageServerLoad;

export const actions = {
    recordScan: async ({ request, locals: { supabase } }: import('./$types').RequestEvent) => {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
            return fail(401, { message: 'Unauthorized' });
        }

        const form = await superValidate(request, zod(qrScanSchema));
        
        if (!form.valid) {
            return fail(400, { form });
        }

        // First, verify the attendee exists and get their event_id
        const { data: attendee, error: attendeeError } = await supabase
            .from('attendees')
            .select('event_id, qr_scan_info')
            .eq('id', form.data.attendeeId)
            .single();

        if (attendeeError || !attendee) {
            return fail(404, { 
                form,
                message: 'Attendee not found'
            });
        }

        // Create new scan info object
        const newScanInfo = {
            scan_time: new Date().toISOString(),
            scanned_by: session.user.id,
            scan_type: form.data.scanType,
            scan_notes: form.data.scanNotes || null,
            scan_location: null // Can be added later if needed
        };

        // Update attendee with new scan info
        const { error: updateError } = await supabase
            .from('attendees')
            .update({
                qr_scan_info: attendee.qr_scan_info ? [...attendee.qr_scan_info, newScanInfo] : [newScanInfo],
                attendance_status: form.data.scanType === 'entry' ? 'present' : 'exited',
                updated_at: new Date().toISOString()
            })
            .eq('id', form.data.attendeeId);

        if (updateError) {
            return fail(500, { 
                form,
                message: 'Failed to update attendee scan info'
            });
        }

        return { 
            form,
            success: true,
            message: `Successfully recorded ${form.data.scanType} scan`
        };
    }
};
;null as any as Actions;