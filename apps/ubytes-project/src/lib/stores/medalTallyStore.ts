import { writable } from 'svelte/store';
import type { SupabaseClient, RealtimeChannel } from '@supabase/supabase-js';

interface MedalTallyData {
    department_id: string;
    updated_at: string | null;
    updated_by: string | null;
    updated_by_username: string | null;
    gold_count: number;
    silver_count: number;
    bronze_count: number;
    events: number;
}

function createMedalTallyStore() {
    const { subscribe, set } = writable<MedalTallyData[]>([]);
    let supabase: SupabaseClient;
    let channel: RealtimeChannel | null = null;
    let isInitialized = false;
    let isConnected = false;
    let pollInterval: NodeJS.Timeout | null = null;
    let cleanupFunction: (() => void) | null = null;

    const logEvent = (type: string, message: string, data?: unknown) => {
        const timestamp = new Date().toISOString();
        console.log(`[Medal Tally Store] ${timestamp} - ${type}: ${message}`, data ? data : '');
    };

    const fetchMedalTally = async () => {
        if (!supabase || !isInitialized) return;

        try {
            const { data, error } = await supabase
                .from('combined_tabulation_medal_tally_view')
                .select('department_id, updated_at, updated_by, updated_by_username, gold_count, silver_count, bronze_count, events');

            if (error) throw error;

            set(data || []);
            logEvent('FETCH', 'Medal tally fetched successfully', {
                totalEntries: data?.length,
                timestamp: new Date().toISOString()
            });
        } catch (error) {
            logEvent('ERROR', 'Failed to fetch medal tally', error);
        }
    };

    const startPolling = () => {
        if (pollInterval) return;
        pollInterval = setInterval(fetchMedalTally, 10000);
        fetchMedalTally();
    };

    const stopPolling = () => {
        if (pollInterval) {
            clearInterval(pollInterval);
            pollInterval = null;
        }
    };

    
const setupChannel = async () => {


    // Unsubscribe existing channel if it exists
    if (channel) {
        try {
            await channel.unsubscribe();
        } catch (err: unknown) {
            console.error('Failed to unsubscribe existing channel:', err);
        }
    }

    // Initialize a new channel for broadcasts
    channel = supabase.channel('medal_tally_realtime');

    channel.on('broadcast', { event: 'update' }, (payload) => {
        console.log('Broadcast message received:', payload);

        // Handle the broadcast payload
        const { message, timestamp } = payload.payload;
        console.log(`Message: ${message}, Timestamp: ${timestamp}`);

        // Optionally call your function to refresh the UI or fetch new data
        fetchMedalTally();
    });

    // Subscribe to the channel
    channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
            console.log('Channel successfully subscribed to broadcasts');
        } else {
            console.warn(`Channel subscription status: ${status}`);
        }
    });
};
    
    const cleanup = () => {
        logEvent('CLEANUP', 'Cleaning up resources');
        stopPolling();
        
        if (channel) {
            channel.unsubscribe();
            channel = null;
        }

        if (cleanupFunction) {
            cleanupFunction = null;
        }
    };

    return {
        subscribe,
        initialize: (supabaseClient: SupabaseClient) => {
            if (isInitialized) {
                logEvent('INIT', 'Store already initialized');
                return () => {};
            }

            supabase = supabaseClient;
            isInitialized = true;
            fetchMedalTally()
            setupChannel();
            // startPolling();

            cleanupFunction = () => {
                cleanup();
                isInitialized = false;
                isConnected = false;
            };

            return cleanupFunction;
        },
        refresh: fetchMedalTally,
        getStatus: () => ({ 
            isInitialized, 
            isConnected 
        })
    };
}

export const medalTallyStore = createMedalTallyStore();