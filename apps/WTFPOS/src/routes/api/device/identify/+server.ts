import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { networkInterfaces, hostname } from 'node:os';
import { getCollectionStore } from '$lib/server/replication-store';
import { SERVER_EPOCH } from '$lib/server/epoch';
import { trackClient, isLoopbackIP, displayIP } from '$lib/server/client-tracker';

console.log('[Device Identify] Module loaded');

/** Returns the set of all local IP addresses on this machine */
function getLocalIPs(): Set<string> {
	const ips = new Set<string>();
	const ifaces = networkInterfaces();
	for (const entries of Object.values(ifaces)) {
		if (!entries) continue;
		for (const entry of entries) {
			ips.add(entry.address);
			if (entry.address.startsWith('::ffff:')) {
				ips.add(entry.address.slice(7));
			}
			if (entry.family === 'IPv4') {
				ips.add(`::ffff:${entry.address}`);
			}
		}
	}
	return ips;
}

/**
 * Returns the server's primary LAN IPv4 address (non-loopback).
 * This is the IP that clients use to reach the server over WiFi.
 */
function getServerLanIp(): string {
	const ifaces = networkInterfaces();
	for (const [name, entries] of Object.entries(ifaces)) {
		if (!entries) continue;
		for (const entry of entries) {
			// Want: IPv4, non-internal (non-loopback), typically en0/en1/wlan0
			if (entry.family === 'IPv4' && !entry.internal) {
				return entry.address;
			}
		}
	}
	return '';
}

/** Check if client IP matches any local IP (server detection) */
function isLocalIP(clientIp: string): boolean {
	if (isLoopbackIP(clientIp)) return true;
	const localIPs = getLocalIPs();
	if (localIPs.has(clientIp)) return true;
	if (localIPs.has(displayIP(clientIp))) return true;
	return false;
}

/** Re-export shared epoch for this endpoint */
const serverEpoch = SERVER_EPOCH;

/**
 * Attempt to re-identify a device that lost its ID.
 * Matches against known devices in the server's in-memory store
 * using hardware fingerprint: {userAgent, deviceType, screenWidth, ipAddress}.
 */
function tryServerReidentify(
	userAgent: string | null,
	deviceType: string | null,
	screenWidth: number | null,
	_ipAddress: string
): string | null {
	if (!userAgent) return null;

	const devicesStore = getCollectionStore('devices');
	if (!devicesStore) return null;

	const { documents } = devicesStore.pull(null, 1000);
	// Match devices seen within last 7 days — these are candidates for re-identification.
	// Devices offline >7 days are too stale to confidently re-identify (hardware may have changed hands).
	const staleThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000;

	for (const doc of documents) {
		if (doc.userAgent !== userAgent) continue;
		if (deviceType && doc.deviceType !== deviceType) continue;
		if (screenWidth !== null && Math.abs(doc.screenWidth - screenWidth) > 50) continue;
		const lastSeen = new Date(doc.lastSeenAt).getTime();
		// Skip devices that are too old — only match recently active ones
		if (lastSeen < staleThreshold) continue;
		return doc.id;
	}

	return null;
}

export const GET: RequestHandler = async (event) => {
	try {
		const clientIp = event.getClientAddress();
		const isServer = isLocalIP(clientIp);
		const ipForDisplay = displayIP(clientIp);
		const hn = hostname();
		const serverLanIp = getServerLanIp();
		const userAgent = event.request.headers.get('user-agent') || '';

		trackClient(clientIp, userAgent, 'device/identify');

		return json({
			// For the server device, show LAN IP instead of useless loopback (::1)
			ipAddress: isServer && serverLanIp ? serverLanIp : ipForDisplay,
			isServer,
			serverHostname: hn,
			serverLanIp,
			serverEpoch,
		});
	} catch (err) {
		console.error('[Device Identify GET] ERROR:', err);
		return json({
			ipAddress: 'unknown',
			isServer: false,
			serverHostname: 'unknown',
			serverLanIp: '',
			serverEpoch,
		});
	}
};

/**
 * POST /api/device/identify — server-side re-identification.
 * Client sends its hardware fingerprint; server searches for a matching stale device.
 */
export const POST: RequestHandler = async (event) => {
	try {
		const clientIp = event.getClientAddress();
		const displayIp = displayIP(clientIp);
		const userAgent = event.request.headers.get('user-agent') || '';

		trackClient(clientIp, userAgent, 'device/identify POST');

		const body = await event.request.json();

		const matchedId = tryServerReidentify(
			body.userAgent ?? null,
			body.deviceType ?? null,
			body.screenWidth ?? null,
			displayIp
		);
		console.log(`[Device Identify POST] matchedId=${matchedId}`);
		return json({ matchedDeviceId: matchedId });
	} catch (err) {
		console.error('[Device Identify POST] ERROR:', err);
		return json({ matchedDeviceId: null });
	}
};
