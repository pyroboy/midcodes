import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getTrackedClients } from '$lib/server/client-tracker';

/**
 * GET /api/device/clients
 * Returns all server-tracked client connections (from in-memory client-tracker).
 * This is the source of truth for which devices are actually making requests.
 */
export const GET: RequestHandler = async () => {
	const clients = getTrackedClients();

	const now = Date.now();
	const result = clients.map(c => ({
		ip: c.displayIp,
		isServer: c.isServer,
		deviceHint: c.deviceHint,
		deviceName: c.deviceName,
		userName: c.userName,
		role: c.role,
		locationId: c.locationId,
		currentRoute: c.currentRoute,
		lastSeenAt: c.lastSeenAt.toISOString(),
		// Consider active if seen in the last 90 seconds (accounts for page idle)
		isActive: (now - c.lastSeenAt.getTime()) < 90_000,
		isScreenActive: c.isScreenActive,
		hitCount: c.hitCount,
		connectionTypes: Array.from(c.connectionTypes),
		lastSyncAt: c.lastSyncAt?.toISOString() ?? null,
	}));

	return json({ clients: result });
};
