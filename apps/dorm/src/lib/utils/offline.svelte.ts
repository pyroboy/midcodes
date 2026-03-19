import { mutationQueue } from '$lib/stores/mutation-queue.svelte';

/**
 * W11: Reactive online status tracker.
 * Returns a getter for the current online status.
 * pendingCount now reads from the central mutation queue.
 */
export function createOnlineStatus() {
	let online = $state(typeof navigator !== 'undefined' ? navigator.onLine : true);

	if (typeof window !== 'undefined') {
		window.addEventListener('online', () => { online = true; });
		window.addEventListener('offline', () => { online = false; });
	}

	return {
		get value() { return online; },
		get pendingCount() { return mutationQueue.pending; }
	};
}

export const onlineStatus = createOnlineStatus();
