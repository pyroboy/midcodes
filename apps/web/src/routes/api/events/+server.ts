import { error, json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ locals: { supabase, safeGetSession } }) => {
    try {
        const { session } = await safeGetSession();
        if (!session?.access_token) {
            throw error(401, 'Unauthorized');
        }

        // Get current org_id from the session
        const currentOrgId = session.user.user_metadata?.org_id;

        // Get current role
        const currentRole = session.user.user_metadata?.role;

        let query = supabase
            .from('events')
            .select('id, event_url, event_name, org_id, is_public');

        // Filter based on role and org_id
        if (currentRole === 'super_admin') {
            // Super admin can see all events
        } else if (currentRole === 'org_admin' && currentOrgId) {
            // Org admin can see all events in their organization
            query = query.eq('org_id', currentOrgId);
        } else if (currentOrgId) {
            // Other roles can see public events and events in their organization
            query = query.or(`org_id.eq.${currentOrgId},is_public.eq.true`);
        } else {
            // If no org_id, only show public events
            query = query.eq('is_public', true);
        }

        const { data, error: eventsError } = await query;

        if (eventsError) {
            console.error('Error fetching events:', eventsError);
            throw error(500, 'Failed to fetch events');
        }

        return json({ data: data || [], error: null });
    } catch (err) {
        console.error('Error in events endpoint:', err);
        throw error(500, err instanceof Error ? err.message : 'An unknown error occurred');
    }
};
