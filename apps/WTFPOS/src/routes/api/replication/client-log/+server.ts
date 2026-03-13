import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { trackClient, isLoopbackIP } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

/** Noisy client info patterns — demote to trace */
const TRACE_PATTERNS = [
	'getDb()',
	'first activity',
	'addCollections()',
];

/** Important client info patterns — keep at info level (low frequency, high diagnostic value) */
const INFO_PATTERNS = [
	'Replication started',
	'startReplication()',
	'LOCAL DB EMPTY',
	'canonical data source',
	'Priority collections synced',
	'Initial sync complete',
];

/** Breaker-open messages are already throttled client-side; demote any that still arrive */
function isBreakerNoise(msg: string, data: string): boolean {
	return msg.includes('breaker is open') || msg.includes('Circuit breaker is open')
		|| data.includes('"Circuit breaker is open"') || msg.includes('suppressed');
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
		const data = body.data ? ` | ${JSON.stringify(body.data)}` : '';
		const full = `${label}: ${msg}${data}`;

		// Breaker-open spam: client throttles, but demote anything that slips through
		if (isBreakerNoise(msg, data)) {
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
			log.info('ClientLog', `ℹ️ ${full}`);
		} else {
			log.debug('ClientLog', `ℹ️ ${full}`);
		}
	} catch {
		log.warn('ClientLog', `${label}: (unparseable body)`);
	}

	return json({ ok: true });
};
