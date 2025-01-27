import type { SupabaseClient } from '@supabase/supabase-js';
import type { RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { medalTallyStore } from '$lib/stores/medalTallyStore';

interface DiagnosticResults {
    viewAccess: boolean;
    rpcAccess: boolean;
    realtimeConnection: boolean;
    storeInitialized: boolean;
    errors: string[];
}

interface SystemPayload {
    timestamp: number;
    message: string;
    status: string;
    extension?: string;
    channel?: string;
}

export async function troubleshootMedalTallySystem(supabase: SupabaseClient): Promise<DiagnosticResults> {
    const results: DiagnosticResults = {
        viewAccess: false,
        rpcAccess: false,
        realtimeConnection: false,
        storeInitialized: false,
        errors: []
    };

    console.group('🔍 Medal Tally System Diagnostics');
    console.time('Diagnostics Duration');

    try {
        const storeStatus = medalTallyStore.getStatus();
        results.storeInitialized = storeStatus.isInitialized;
        console.log(`Store Initialization: ${results.storeInitialized ? '✅' : '❌'}`);

        const viewCheck = await checkViewAccess(supabase);
        results.viewAccess = viewCheck.success;
        if (!viewCheck.success) results.errors.push(viewCheck.error);

        const rpcCheck = await checkRPCAccess(supabase);
        results.rpcAccess = rpcCheck.success;
        if (!rpcCheck.success) results.errors.push(rpcCheck.error);

        const realtimeCheck = await checkRealtimeConnection(supabase);
        results.realtimeConnection = realtimeCheck.success;
        if (!realtimeCheck.success) results.errors.push(realtimeCheck.error);

    } catch (error) {
        results.errors.push(`General error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        console.error('General Error:', error);
    } finally {
        console.timeEnd('Diagnostics Duration');
        console.groupEnd();
    }

    return results;
}

async function checkViewAccess(supabase: SupabaseClient) {
    try {
        const { data, error } = await supabase
            .from('combined_tabulation_medal_tally_view')
            .select('department_id')
            .limit(1);

        if (error) throw error;
        console.log('View Access: ✅');
        return { success: true, error: '' };
    } catch (error) {
        console.error('View Access: ❌', error);
        return { 
            success: false, 
            error: `View access error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

async function checkRPCAccess(supabase: SupabaseClient) {
    try {
        const { error } = await supabase.rpc('refresh_medal_tally');
        if (error) throw error;
        console.log('RPC Access: ✅');
        return { success: true, error: '' };
    } catch (error) {
        console.error('RPC Access: ❌', error);
        return { 
            success: false, 
            error: `RPC access error: ${error instanceof Error ? error.message : 'Unknown error'}`
        };
    }
}

async function checkRealtimeConnection(supabase: SupabaseClient): Promise<{ success: boolean; error: string }> {
    return new Promise((resolve) => {
        const timeout = setTimeout(() => {
            resolve({ success: false, error: 'Realtime connection timeout' });
        }, 5000);

        const channel = supabase.channel('medal_tally_realtime')
        .on('broadcast', { event: 'update' }, (payload) => {
    
            // Handle the broadcast payload
            const { message, timestamp } = payload.payload;
            console.log(`Message: ${message}, Timestamp: ${timestamp}`);
    
        }) 
            .subscribe((status) => {
                if (status === 'SUBSCRIBED') {
                    clearTimeout(timeout);
                    console.log('Realtime Connection: ✅');
                    resolve({ success: true, error: '' });
                } else if (status === 'CHANNEL_ERROR') {
                    clearTimeout(timeout);
                    channel.unsubscribe();
                    resolve({ 
                        success: false, 
                        error: `Channel error: ${status}` 
                    });
                } else {
                    console.log(`Channel Status: ${status}`);
                }
            });

        // Listen for broadcast channel errors
        channel.on('broadcast', { event: 'system' }, payload => {
            console.log('System Event:', payload);
            if ((payload as any).extension === 'postgres_changes' && (payload as any).status === 'error') {
                clearTimeout(timeout);
                channel.unsubscribe();
                resolve({ 
                    success: false, 
                    error: `Realtime configuration error: ${(payload as any).message}` 
                });
            }
        });
    });
}

export async function troubleshootRealtimeConfig(supabase: SupabaseClient) {
    const channel = supabase.channel('medal_tally_stable');
    
    channel
        .on('broadcast', { event: 'system' }, payload => {
            const now = new Date().toISOString();
            console.log('System Event:', {
                localTimestamp: now,
                ...payload
            });
        })
        .subscribe((status) => {
            console.log('Channel Status:', {
                timestamp: new Date().toISOString(),
                status
            });
        });

    return channel;
}