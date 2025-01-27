import type { SupabaseClient } from '@supabase/supabase-js';
import type { EventStatus } from './types';

const logUpdate = (message: string, error?: unknown) => {
    const timestamp = new Date().toISOString();
    if (error) {
        console.error(`[${timestamp}] ${message}`, error);
        return;
    }
    console.log(`[${timestamp}] ${message}`);
};

export async function refreshMaterializedView(supabase: SupabaseClient) {
    logUpdate('Attempting to refresh materialized view...');
    
    const startTime = performance.now();
    const { data, error } = await supabase.rpc('refresh_medal_tally');
    const duration = Math.round(performance.now() - startTime);

    if (error) {
        logUpdate('Failed to refresh materialized view:', error);
        throw new Error(`Could not refresh materialized view: ${error.message}`);
    }

    logUpdate(`Successfully refreshed materialized view in ${duration}ms`);
    return data;
}

export async function notifyMedalTallyUpdate(supabase: SupabaseClient) {
    logUpdate('Sending medal tally update notification...');

    try {
        // Attempt to call the RPC function
        const { error } = await supabase.rpc('refresh_medal_tally');

        if (error) {
            throw new Error(`RPC error: ${JSON.stringify(error)}`);
        }

        logUpdate('Successfully triggered refresh_medal_tally RPC');
        
        // Notify the Realtime channel
        const channel = supabase.channel('medal_tally_realtime');
        const broadcastResult = await channel.send({
            type: 'broadcast',
            event: 'update',
            payload: { message: 'Medal tally updated', timestamp: new Date().toISOString() }
        });

        if (!broadcastResult) {
            throw new Error('Failed to broadcast to Realtime channel');
        }

        logUpdate('Successfully sent medal tally update notification');
    } catch (err) {
        logUpdate('Failed to notify medal tally update:', err);
        throw new Error(`Failed to notify subscribers: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
}


export async function shouldRefreshMedalTally(
    previousStatus: EventStatus, 
    newStatus: EventStatus
): Promise<boolean> {
    const shouldRefresh = previousStatus === 'locked_published' || newStatus === 'locked_published';
    return shouldRefresh;
}

export async function handleMedalTallyUpdate(
    supabase: SupabaseClient,
    eventName: string,
    previousStatus: EventStatus,
    newStatus: EventStatus,
    userId: string
) {
    const statusChange = `${previousStatus} → ${newStatus}`;
    const context = {
        eventName,
        userId,
        statusChange,
        timestamp: new Date().toISOString()
    };

    logUpdate(`Medal tally update check for "${eventName}" (${statusChange})`);

    if (await shouldRefreshMedalTally(previousStatus, newStatus)) {
        try {
            logUpdate(`Refreshing medal tally for "${eventName}"...`);
            
            const startTime = performance.now();
            await refreshMaterializedView(supabase);
            const duration = Math.round(performance.now() - startTime);
            
            logUpdate(`Successfully refreshed medal tally for "${eventName}" in ${duration}ms`);
            
            await notifyMedalTallyUpdate(supabase)
                .catch(error => {
                    logUpdate(`Warning: Notification failed but view was refreshed`, error);
                });
                
            return { success: true, ...context };
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            logUpdate(`Failed to refresh medal tally for "${eventName}":`, err);
            throw new Error(`Failed to refresh medal tally: ${errorMessage}`);
        }
    } else {
        logUpdate(`No medal tally update needed for status change: ${statusChange}`);
        return { skipped: true, ...context };
    }
}