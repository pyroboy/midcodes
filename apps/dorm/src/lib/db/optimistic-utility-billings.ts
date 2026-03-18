import { bgResync } from '$lib/db/optimistic-utils';
import { syncStatus } from '$lib/stores/sync-status.svelte';

export function resyncUtilityData() {
	console.log('[Optimistic] Resyncing utility data (readings, billings, meters)...');
	syncStatus.addLog('Optimistic: resyncing utility data (readings, billings, meters)...', 'info');
	bgResync('readings');
	bgResync('billings');
	bgResync('meters');
}
