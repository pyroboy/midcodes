import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { trackClient, isLoopbackIP } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

/** Noisy client info patterns — demote to trace */
const TRACE_PATTERNS = [
	'getDb()',
	'first activity',
	'addCollections()',
	'startReplication() entered',
	'startReplication() proceeding',
];

/** Important client info patterns — keep at info level (low frequency, high diagnostic value) */
const INFO_PATTERNS = [
	'Replication started',
	'LOCAL DB EMPTY',
	'Priority collections synced',
	'Initial sync complete',
	// Reset flow — every step must be visible in server console
	'[Reset/',
	'[DeleteDB]',
	'[Seed',
	'performFullReset',
	'RESET_ALL',
	'BroadcastChannel',
];

/** Throttle "Replication started" per device — only log once per 15s */
const _replStartedAt = new Map<string, number>();
const REPL_THROTTLE_MS = 15_000;
const REPL_THROTTLE_MAX_ENTRIES = 50;

/** Evict oldest entries when map exceeds cap (prevents unbounded growth) */
function evictReplThrottle() {
	if (_replStartedAt.size <= REPL_THROTTLE_MAX_ENTRIES) return;
	// Map iterates in insertion order — delete the first (oldest) entry
	const oldest = _replStartedAt.keys().next().value;
	if (oldest !== undefined) _replStartedAt.delete(oldest);
}

/** Breaker-open messages are already throttled client-side; demote any that still arrive */
function isBreakerNoise(msg: string, data: string): boolean {
	return msg.includes('breaker is open') || msg.includes('Circuit breaker is open')
		|| data.includes('"Circuit breaker is open"') || msg.includes('suppressed');
}

/** SSE reconnect warnings — expected during HMR, not actionable */
function isSseReconnectNoise(msg: string): boolean {
	return msg.includes('SSE stream error') || msg.includes('auto-reconnect')
		|| msg.includes('triggering RESYNC');
}

/**
 * Receives log messages from client-side replication code.
 * This lets us see iPad errors in the server terminal since
 * we don't have access to the iPad's browser console.
 */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	const client = trackClient(ip, request.headers.get('user-agent') || '', 'client-log');
	const isServer = isLoopbackIP(ip);
	const label = isServer ? '💻 Server' : `📱 ${client.deviceHint}`;

	try {
		const body = await request.json();
		const level = body.level ?? 'info';
		const msg = body.message ?? '(no message)';
		const rawData = body.data ? JSON.stringify(body.data) : '';

		// Compact summary for info-level replication logs (strip verbose JSON)
		let data = rawData ? ` | ${rawData}` : '';
		if (rawData && INFO_PATTERNS.some(p => msg.includes(p))) {
			const d = body.data;
			const parts: string[] = [];
			if (d?.collections) parts.push(`${d.collections} collections`);
			if (d?.localTotal != null) parts.push(`${d.localTotal} local docs`);
			if (d?.gen) parts.push(`gen ${d.gen}`);
			data = parts.length > 0 ? ` | ${parts.join(', ')}` : '';
		}
		const full = `${label}: ${msg}${data}`;

		// Breaker-open spam: client throttles, but demote anything that slips through
		if (isBreakerNoise(msg, data)) {
			log.debug('ClientLog', `⚠️ ${full}`);
			return json({ ok: true });
		}

		// SSE reconnect warnings — expected during HMR, not actionable at info level
		if (isSseReconnectNoise(msg)) {
			log.debug('ClientLog', `⚠️ ${full}`);
			return json({ ok: true });
		}

		if (level === 'error') {
			log.error('ClientLog', full);
		} else if (level === 'warn') {
			log.warn('ClientLog', full);
		} else if (TRACE_PATTERNS.some(p => msg.includes(p))) {
			log.trace('ClientLog', `ℹ️ ${full}`);
		} else if (INFO_PATTERNS.some(p => msg.includes(p) || data.includes(p))) {
			// Throttle "Replication started" per device — HMR causes rapid repeats
			if (msg.includes('Replication started')) {
				const now = Date.now();
				const lastAt = _replStartedAt.get(label) ?? 0;
				if (now - lastAt < REPL_THROTTLE_MS) {
					log.debug('ClientLog', `ℹ️ ${full}`);
					return json({ ok: true });
				}
				_replStartedAt.set(label, now);
				evictReplThrottle();
			}
			log.info('ClientLog', `ℹ️ ${full}`);
		} else {
			log.debug('ClientLog', `ℹ️ ${full}`);
		}
	} catch {
		log.warn('ClientLog', `${label}: (unparseable body)`);
	}

	return json({ ok: true });
};
