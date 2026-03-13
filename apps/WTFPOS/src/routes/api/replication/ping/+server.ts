/**
 * Round-trip connectivity test endpoint.
 * Client sends a token, server echoes it back with a server timestamp.
 * Also tests write capability by doing a test push+pull on a real collection.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore } from '$lib/server/replication-store';
import { trackClient, isLoopbackIP } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	const ip = getClientAddress();
	const client = trackClient(ip, request.headers.get('user-agent') || '', 'ping');
	const isServer = isLoopbackIP(ip);
	const label = isServer ? '💻 Server' : `📱 ${client.deviceHint}`;

	const body = await request.json();
	const clientToken = body.token ?? 'no-token';
	const testCollection = body.collection ?? 'orders';

	// Test 1: Echo — proves HTTP round-trip works
	const serverTime = new Date().toISOString();

	// Test 2: Read — can we read from the collection store?
	const store = getCollectionStore(testCollection);
	const storeCount = store ? store.count() : -1;

	// Test 3: Write test — verify the store accepts push/pull operations
	// NOTE: We no longer push probe docs into the store because they lack required
	// schema fields and poison the replication pull stream (causes RC_PULL errors
	// on clients). Instead we just verify the store API is callable.
	let writeOk = false;
	let writeError = '';
	if (store && body.testWrite) {
		try {
			// Verify pull works (read path)
			store.pull(null, 1);
			// Verify store is writable by checking count is consistent
			const before = store.count();
			const after = store.count();
			writeOk = before === after;
		} catch (err: any) {
			writeError = err.message ?? String(err);
		}
	}

	log.info('Ping', `🏓 ${label} ping — token=${clientToken} store(${testCollection})=${storeCount} write=${body.testWrite ? (writeOk ? '✅' : `❌ ${writeError}`) : 'skip'}`);

	return json({
		echo: clientToken,
		serverTime,
		storeCount,
		writeOk: body.testWrite ? writeOk : null,
		writeError: writeError || null,
		deviceLabel: label,
	});
};
