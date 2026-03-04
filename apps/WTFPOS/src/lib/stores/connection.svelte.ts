/**
 * Connection State — Svelte 5 Runes
 * Monitors network connectivity and KDS reachability.
 */

export const connectionState = $state({
	isOnline: true,
	lastOnlineAt: new Date().toISOString(),
	kdsReachable: true,
	kdsAlertDismissed: false,
});

export function initConnectionMonitor() {
	if (typeof navigator !== 'undefined') {
		connectionState.isOnline = navigator.onLine;
	}
	if (typeof window !== 'undefined') {
		window.addEventListener('online', () => {
			connectionState.isOnline = true;
			connectionState.lastOnlineAt = new Date().toISOString();
		});
		window.addEventListener('offline', () => {
			connectionState.isOnline = false;
		});
	}
}

// Simulation helpers for dev/testing
export function simulateOffline() { connectionState.isOnline = false; }
export function simulateOnline() { connectionState.isOnline = true; connectionState.lastOnlineAt = new Date().toISOString(); }
export function simulateKdsDown() { connectionState.kdsReachable = false; connectionState.kdsAlertDismissed = false; }
export function simulateKdsUp() { connectionState.kdsReachable = true; }
export function dismissKdsAlert() { connectionState.kdsAlertDismissed = true; }
