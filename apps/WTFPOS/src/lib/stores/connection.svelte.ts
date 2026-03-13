/**
 * Connection State — Svelte 5 Runes
 * Monitors network connectivity with three-tier detection:
 *   full    = internet + LAN server reachable
 *   lan     = LAN server reachable but no internet
 *   offline = nothing reachable
 */
import { CircuitBreaker } from '$lib/utils/circuit-breaker';

export type ConnectivityTier = 'full' | 'lan' | 'offline';

export const connectionState = $state({
	isOnline: true,
	connectivityTier: 'full' as ConnectivityTier,
	lastOnlineAt: new Date().toISOString(),
	kdsReachable: true,
	kdsAlertDismissed: false,
});

const lanBreaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 30_000 });
const internetBreaker = new CircuitBreaker({ failureThreshold: 3, resetTimeoutMs: 60_000 });

let probeInterval: ReturnType<typeof setInterval> | null = null;

async function probeLan(): Promise<boolean> {
	try {
		return await lanBreaker.execute(async () => {
			// Use the ping endpoint for a proper round-trip test.
			// The status endpoint is a GET that only proves the SvelteKit process is responding —
			// the ping endpoint also tests read/write on the replication store.
			const token = `probe-${Date.now()}`;
			const res = await fetch('/api/replication/ping', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, collection: 'tables', testWrite: false }),
				signal: AbortSignal.timeout(5_000)
			});
			if (!res.ok) return false;
			const data = await res.json();
			// Verify the server echoed our token back — proves it's a real server, not a cached response
			return data.echo === token;
		});
	} catch {
		return false;
	}
}

async function probeInternet(): Promise<boolean> {
	try {
		return await internetBreaker.execute(async () => {
			// Use a tiny favicon-style request to a known CDN — fast and low bandwidth
			const res = await fetch('https://www.gstatic.com/generate_204', {
				mode: 'no-cors',
				signal: AbortSignal.timeout(5_000)
			});
			// no-cors returns opaque response (status 0) — if we get here, request succeeded
			return true;
		});
	} catch {
		return false;
	}
}

async function probeConnectivity() {
	if (!navigator.onLine) {
		connectionState.isOnline = false;
		connectionState.connectivityTier = 'offline';
		return;
	}

	const lanOk = await probeLan();
	if (!lanOk) {
		connectionState.isOnline = false;
		connectionState.connectivityTier = 'offline';
		return;
	}

	const internetOk = await probeInternet();
	connectionState.isOnline = true;
	connectionState.connectivityTier = internetOk ? 'full' : 'lan';
	connectionState.lastOnlineAt = new Date().toISOString();
}

const PROBE_INTERVAL_MS = 60_000;

export function initConnectionMonitor() {
	if (typeof navigator !== 'undefined') {
		connectionState.isOnline = navigator.onLine;
	}
	if (typeof window !== 'undefined') {
		window.addEventListener('online', () => {
			// Probe immediately on reconnect instead of trusting the event
			probeConnectivity();
		});
		window.addEventListener('offline', () => {
			connectionState.isOnline = false;
			connectionState.connectivityTier = 'offline';
		});

		// Initial probe + periodic re-check
		probeConnectivity();
		if (probeInterval) clearInterval(probeInterval);
		probeInterval = setInterval(probeConnectivity, PROBE_INTERVAL_MS);
	}
}

// Simulation helpers for dev/testing
export function simulateOffline() { connectionState.isOnline = false; connectionState.connectivityTier = 'offline'; }
export function simulateOnline() { connectionState.isOnline = true; connectionState.connectivityTier = 'full'; connectionState.lastOnlineAt = new Date().toISOString(); }
export function simulateLanOnly() { connectionState.isOnline = true; connectionState.connectivityTier = 'lan'; }
export function simulateKdsDown() { connectionState.kdsReachable = false; connectionState.kdsAlertDismissed = false; }
export function simulateKdsUp() { connectionState.kdsReachable = true; }
export function dismissKdsAlert() { connectionState.kdsAlertDismissed = true; }
