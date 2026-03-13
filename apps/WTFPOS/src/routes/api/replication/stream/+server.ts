import type { RequestHandler } from './$types';
import { getCollectionStore, subscribeBroadcast, getServerStoreSummary } from '$lib/server/replication-store';
import { trackClient, isLoopbackIP, displayIP } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

/**
 * Single multiplexed SSE stream for ALL collections.
 * Each event includes a `collection` field so the client knows which store to update.
 * This avoids opening 16+ connections (browsers limit to ~6 per host on HTTP/1.1).
 */

const ALL_COLLECTIONS = [
	'tables', 'orders', 'menu_items', 'stock_items', 'deliveries',
	'waste', 'deductions', 'adjustments', 'expenses', 'stock_counts', 'devices',
	'kds_tickets', 'x_reads', 'z_reads', 'audit_logs', 'kitchen_alerts',
	'floor_elements'
];

/** Prefixes used by test/probe/diagnostic documents — must not leak to client replication */
const TEST_DOC_PREFIXES = ['__repltest_', '__synctest_', '__syncprobe_', '__ping_', '__diag_'];

function isTestDoc(doc: any): boolean {
	const docId = doc?.id ?? doc?.stockItemId ?? '';
	if (typeof docId !== 'string') return false;
	return TEST_DOC_PREFIXES.some(p => docId.startsWith(p));
}

let _clientCounter = 0;
let _activeClients = 0;

export const GET: RequestHandler = async (event) => {
	const encoder = new TextEncoder();
	const clientId = ++_clientCounter;
	const clientIp = event.getClientAddress();
	const dip = displayIP(clientIp);
	const userAgent = event.request.headers.get('user-agent') || '';
	const client = trackClient(clientIp, userAgent, 'SSE stream');
	const label = client.isServer ? 'server' : `${client.deviceHint} (${dip})`;

	_activeClients++;
	const { total, lastPushAt } = getServerStoreSummary();
	const dataStatus = total > 0
		? `server has ${total} docs, last push ${lastPushAt ? new Date(lastPushAt).toLocaleTimeString() : 'never'}`
		: '⚠️ SERVER STORE EMPTY — no data to serve';
	log.info('SSE', `✦ #${clientId} connected — ${label} (${_activeClients} active) | ${dataStatus}`);

	// Track whether we've already cleaned up to prevent double-decrement
	let cleaned = false;
	const unsubscribes: (() => void)[] = [];

	function cleanup() {
		if (cleaned) return;
		cleaned = true;
		unsubscribes.forEach(fn => fn());
		_activeClients--;
		log.info('SSE', `✧ #${clientId} disconnected — ${label} (${_activeClients} active)`);
	}

	const stream = new ReadableStream({
		start(controller) {
			controller.enqueue(encoder.encode(': connected\n\n'));

			for (const name of ALL_COLLECTIONS) {
				const store = getCollectionStore(name);
				if (!store) continue;

				const unsub = store.subscribe((changeEvent) => {
					try {
						// Filter out test/probe docs that would poison client replication metadata
						const filteredDocs = changeEvent.documents.filter((doc: any) => !isTestDoc(doc));
						if (filteredDocs.length === 0) return;
						const payload = JSON.stringify({
							collection: name,
							documents: filteredDocs,
							checkpoint: changeEvent.checkpoint
						});
						controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
					} catch {
						// Client disconnected
					}
				});
				unsubscribes.push(unsub);
			}

			// Listen for global broadcast signals (e.g. RESET_ALL)
			const unsubBroadcast = subscribeBroadcast((signal) => {
				try {
					controller.enqueue(encoder.encode(`event: broadcast\ndata: ${JSON.stringify({ signal })}\n\n`));
				} catch { /* disconnected */ }
			});
			unsubscribes.push(unsubBroadcast);

			// Heartbeat every 30s
			const heartbeat = setInterval(() => {
				try {
					controller.enqueue(encoder.encode(': heartbeat\n\n'));
				} catch {
					clearInterval(heartbeat);
					cleanup();
				}
			}, 30_000);

			// Clean up when request is aborted
			event.request.signal.addEventListener('abort', () => {
				clearInterval(heartbeat);
				cleanup();
			});
		},
		cancel() {
			cleanup();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
