import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore } from '$lib/server/replication-store';
import { setClientScreenState } from '$lib/server/client-tracker';

/**
 * POST /api/device/screen-state
 * Receives screen state changes: sendBeacon (going dark) or fetch (waking up).
 * Parses body as text→JSON to handle sendBeacon's text/plain content-type.
 */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	let body: any;
	try {
		const text = await request.text();
		body = JSON.parse(text);
	} catch {
		return json({ error: 'Invalid payload' }, { status: 400 });
	}

	const { deviceId, isScreenActive } = body;
	if (!deviceId || typeof isScreenActive !== 'boolean') {
		return json({ error: 'Missing deviceId or isScreenActive' }, { status: 400 });
	}

	const now = new Date().toISOString();

	// Patch device doc in replication store (in-place, emits change → SSE)
	const devicesStore = getCollectionStore('devices');
	if (devicesStore) {
		devicesStore.patchDoc(deviceId, { isScreenActive, updatedAt: now });
	}

	// Update client-tracker in-memory state
	try {
		const ip = getClientAddress();
		setClientScreenState(ip, isScreenActive);
	} catch { /* best effort */ }

	return json({ ok: true });
};
