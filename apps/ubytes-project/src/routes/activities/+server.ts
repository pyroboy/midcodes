import { json, error } from '@sveltejs/kit';

export const GET = async ({ url, locals: { supabase } }) => {
    const eventName = url.searchParams.get('eventName');
    
    // Ensure eventName is present in the URL query params
    if (!eventName) {
        throw error(400, 'Missing eventName');
    }

    // Query the logs from your database, e.g., Supabase
    const { data, error: dbError } = await supabase
        .from('activity_logs_view')
        .select('id, user_id, activity, created_at, username, role')
        .ilike('activity', `%${eventName}%`) // Filter by event name
        .order('created_at', { ascending: false });

    // Handle any database errors
    if (dbError) {
        throw error(500, 'Error fetching logs');
    }

    // Return the logs in JSON format
    return json({ activities: data });
};
