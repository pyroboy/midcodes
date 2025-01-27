import type { PageServerLoad } from './$types';

export interface ActivityLogView {
    id: number;
    user_id: string | null;
    activity: string;
    previous_data: Record<string, unknown> | null;
    new_data: Record<string, unknown> | null;
    created_at: string;
    username: string | null;
    role: string | null;
}

export interface PageData {
    activities: ActivityLogView[];
    error?: string;
}

export const load: PageServerLoad = async ({ locals: { supabase }, url }) => {
    const eventName = url.searchParams.get('eventName');

    // Start by setting up the query
    let query = supabase
        .from('activity_logs_view')
        .select('id, user_id, activity, created_at, username, role')
        .order('created_at', { ascending: false });

    // If eventName is provided, apply a filter on the activity
    if (eventName) {
        query = query.ilike('activity', `%${eventName}%`);
    }

    try {
        // Execute the query to fetch activity logs
        const { data: activities, error } = await query;

        // Handle errors from Supabase query
        if (error) {
            console.error('Error fetching activity logs:', error);
            throw new Error('Failed to fetch activity logs from the database');
        }

        // Return the successful result
        return { activities: activities as ActivityLogView[] };
    } catch (error) {
        // Catch any errors during the process
        console.error('Error fetching activity logs:', error);

        // Return an error message
        return {
            activities: [],
            error: 'Failed to fetch activity logs. Please try again later.',
        };
    }
};
