/**
 * Server-side client connection tracker.
 * Logs a prominent banner when a NEW LAN device connects for the first time.
 * Enriches logs with device name, role, and location from the devices collection.
 * Quiets down repeat connections to avoid console noise.
 */

import { getCollectionStore } from './replication-store';
import { log } from './logger';

const LOOPBACK_IPS = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/** Connection type derived from request context */
export type ConnectionType = 'page' | 'sse' | 'push' | 'pull' | 'api';

export interface ClientInfo {
	ip: string;
	displayIp: string;
	isServer: boolean;
	deviceHint: string;
	deviceName: string;
	userName: string;
	role: string;
	locationId: string;
	dataMode: string;
	isOnline: boolean;
	currentRoute: string;
	lastSyncAt: Date | null;
	firstSeenAt: Date;
	lastSeenAt: Date;
	hitCount: number;
	/** Set of connection types this client has used */
	connectionTypes: Set<ConnectionType>;
}

/** Classify a trackClient context string into a ConnectionType */
function classifyContext(context: string): ConnectionType {
	if (context === 'SSE stream') return 'sse';
	if (context.startsWith('push/')) return 'push';
	if (context.startsWith('pull/')) return 'pull';
	if (context.startsWith('/api') || context.startsWith('client-log') || context.startsWith('device/') || context.startsWith('replication/')) return 'api';
	return 'page';
}

/** All known clients by display IP */
const knownClients = new Map<string, ClientInfo>();

// ─── Change notification ─────────────────────────────────────────────────────
// Subscribers are notified when client state changes (new client, route change, etc.)
type ClientChangeListener = () => void;
const clientChangeListeners = new Set<ClientChangeListener>();

/** Subscribe to client-tracker changes. Returns unsubscribe function. */
export function subscribeClientChanges(fn: ClientChangeListener): () => void {
	clientChangeListeners.add(fn);
	return () => clientChangeListeners.delete(fn);
}

function emitClientChange() {
	for (const fn of clientChangeListeners) {
		try { fn(); } catch { /* noop */ }
	}
}

export function displayIP(ip: string): string {
	if (ip.startsWith('::ffff:')) return ip.slice(7);
	return ip;
}

export function isLoopbackIP(ip: string): boolean {
	const clean = displayIP(ip);
	return LOOPBACK_IPS.has(ip) || LOOPBACK_IPS.has(clean);
}

function detectDeviceHint(userAgent: string, isRemote: boolean): string {
	if (/iPad/i.test(userAgent)) return 'iPad';
	if (/Macintosh.*Mobile/i.test(userAgent)) return 'iPad'; // iPadOS 13+ UA
	if (/iPhone/i.test(userAgent)) return 'iPhone';
	if (/Android.*Mobile/i.test(userAgent)) return 'Android Phone';
	if (/Android/i.test(userAgent)) return 'Android Tablet';
	// iPadOS in desktop mode sends "Macintosh" with no "Mobile" —
	// if the IP is remote (not loopback), it's a tablet, not the server Mac
	if (/Macintosh|Mac OS/i.test(userAgent)) return isRemote ? 'iPad' : 'Mac';
	if (/Windows/i.test(userAgent)) return 'Windows';
	return 'Unknown';
}

/** Location ID → display name */
const LOCATION_NAMES: Record<string, string> = {
	tag: 'Tagbilaran',
	pgl: 'Panglao',
	'wh-tag': 'Warehouse',
	all: 'All Branches',
};

/**
 * Look up device info from the replication store's devices collection by IP.
 * Returns the most recently seen device matching this IP.
 */
function lookupDeviceByIp(ip: string): { name: string; userName: string; role: string; locationId: string; dataMode: string; isOnline: boolean } | null {
	const devicesStore = getCollectionStore('devices');
	if (!devicesStore) return null;

	const dip = displayIP(ip);
	const { documents } = devicesStore.pull(null, 1000);

	let best: any = null;
	for (const doc of documents) {
		if (doc.ipAddress === dip || doc.ipAddress === ip) {
			if (!best || doc.lastSeenAt > best.lastSeenAt) {
				best = doc;
			}
		}
	}

	if (!best) return null;
	return {
		name: best.name || '',
		userName: best.userName || '',
		role: best.role || '',
		locationId: best.locationId || '',
		dataMode: best.dataMode || 'full',
		isOnline: !!best.isOnline,
	};
}

/**
 * Track a client connection. Logs a prominent banner for NEW LAN clients.
 * Returns the ClientInfo for further use.
 */
export function trackClient(rawIp: string, userAgent: string, context: string, route?: string): ClientInfo {
	const dip = displayIP(rawIp);
	const isServer = isLoopbackIP(rawIp);
	const deviceHint = detectDeviceHint(userAgent, !isServer);
	const now = new Date();

	const connType = classifyContext(context);

	const existing = knownClients.get(dip);
	if (existing) {
		const routeChanged = route && existing.currentRoute !== route;
		existing.lastSeenAt = now;
		existing.hitCount++;
		existing.connectionTypes.add(connType);
		if (route) existing.currentRoute = route;
		// Notify listeners when route or connection type changes (not every heartbeat)
		if (routeChanged) emitClientChange();

		// Refresh device info periodically (every 20 requests) for non-server clients
		if (!existing.isServer && existing.hitCount % 20 === 0) {
			const devInfo = lookupDeviceByIp(rawIp);
			if (devInfo) {
				existing.deviceName = devInfo.name;
				existing.userName = devInfo.userName;
				existing.role = devInfo.role;
				existing.locationId = devInfo.locationId;
				existing.dataMode = devInfo.dataMode;
				existing.isOnline = devInfo.isOnline;
			}
			const loc = LOCATION_NAMES[existing.locationId] || existing.locationId;
			const status = existing.isOnline ? '🟢 online' : '🔴 offline';
			log.trace('Clients',
				`📱 ${existing.deviceHint} "${existing.deviceName || existing.userName || 'unnamed'}" ` +
				`(${existing.displayIp}) — ${status} | ${existing.role} @ ${loc} | ${existing.hitCount} reqs`
			);
		}
		return existing;
	}

	// New client — look up device info
	const devInfo = lookupDeviceByIp(rawIp);

	const info: ClientInfo = {
		ip: rawIp,
		displayIp: dip,
		isServer,
		deviceHint,
		deviceName: devInfo?.name || '',
		userName: devInfo?.userName || '',
		role: devInfo?.role || '',
		locationId: devInfo?.locationId || '',
		dataMode: devInfo?.dataMode || 'full',
		isOnline: devInfo?.isOnline ?? true,
		currentRoute: route || '/',
		lastSyncAt: null,
		firstSeenAt: now,
		lastSeenAt: now,
		hitCount: 1,
		connectionTypes: new Set([connType]),
	};
	knownClients.set(dip, info);
	emitClientChange(); // New client connected — notify devices page

	if (isServer) {
		const name = devInfo?.name || devInfo?.userName || 'this machine';
		const loc = LOCATION_NAMES[info.locationId] || info.locationId || '(pending)';
		const status = '🟢 online';
		log.banner(
			'💻 SERVER ONLINE',
			`Device:   ${deviceHint}`,
			`Name:     ${name}`,
			`IP:       ${dip} (loopback)`,
			`Role:     ${info.role || 'server'}`,
			`Location: ${loc}`,
			`Status:   ${status}`,
			`Time:     ${now.toLocaleTimeString()}`,
		);
	} else {
		// ═══ Prominent banner for NEW LAN client ═══
		const name = info.deviceName || info.userName || '(registering…)';
		const loc = LOCATION_NAMES[info.locationId] || info.locationId || '(pending)';
		const status = info.isOnline ? '🟢 online' : '⏳ connecting';
		log.banner(
			'📱 NEW CLIENT CONNECTED',
			`Device:   ${deviceHint}`,
			`Name:     ${name}`,
			`IP:       ${dip}`,
			`Role:     ${info.role || '(pending)'}`,
			`Location: ${loc}`,
			`Status:   ${status}`,
			`Time:     ${now.toLocaleTimeString()}`,
		);

		// Schedule a re-check after 5s — the device record may not be pushed yet on first connect
		setTimeout(() => {
			const client = knownClients.get(dip);
			if (client && (!client.deviceName && !client.userName)) {
				const freshInfo = lookupDeviceByIp(rawIp);
				if (freshInfo) {
					client.deviceName = freshInfo.name;
					client.userName = freshInfo.userName;
					client.role = freshInfo.role;
					client.locationId = freshInfo.locationId;
					client.dataMode = freshInfo.dataMode;
					client.isOnline = freshInfo.isOnline;

					const freshName = client.deviceName || client.userName || 'unnamed';
					const freshLoc = LOCATION_NAMES[client.locationId] || client.locationId;
					const freshStatus = client.isOnline ? '🟢 online' : '🔴 offline';
					log.debug('Clients', `📱 ${deviceHint} identified → "${freshName}" | ${client.role} @ ${freshLoc} | ${freshStatus}`);
				}
			}
		}, 5_000);
	}

	return info;
}

/** Record that a client just did a push or pull (sync activity) */
export function recordClientSync(rawIp: string): void {
	const dip = displayIP(rawIp);
	const client = knownClients.get(dip);
	if (client) client.lastSyncAt = new Date();
}

/** Get all currently tracked clients */
export function getTrackedClients(): ClientInfo[] {
	return Array.from(knownClients.values());
}

/** Get count of non-server clients */
export function getLanClientCount(): number {
	return Array.from(knownClients.values()).filter(c => !c.isServer).length;
}

/** Format "Xs ago" / "Xm ago" / "never" for time since */
function timeAgo(date: Date | null): string {
	if (!date) return 'never';
	const secs = Math.round((Date.now() - date.getTime()) / 1000);
	if (secs < 5) return 'just now';
	if (secs < 60) return `${secs}s ago`;
	if (secs < 3600) return `${Math.floor(secs / 60)}m ago`;
	return `${Math.floor(secs / 3600)}h ago`;
}

/** Get server replication store stats: total docs, per-collection counts, latest updatedAt */
function getServerDataStats(): { totalDocs: number; latestUpdatedAt: string | null; counts: Record<string, number> } {
	let totalDocs = 0;
	let latestUpdatedAt: string | null = null;
	const counts: Record<string, number> = {};

	const collections = [
		'tables', 'orders', 'menu_items', 'stock_items', 'deliveries',
		'waste', 'deductions', 'adjustments', 'expenses', 'stock_counts', 'devices',
		'kds_tickets', 'x_reads', 'z_reads', 'audit_logs', 'kitchen_alerts', 'floor_elements'
	];

	for (const name of collections) {
		const store = getCollectionStore(name);
		if (!store) continue;
		const count = store.count();
		if (count > 0) {
			counts[name] = count;
			totalDocs += count;

			// Pull latest doc to get updatedAt
			const { documents } = store.pull(null, 1);
			// Pull from the end by pulling all and checking the last
			// Actually, pull with a high checkpoint will get earliest — let's just pull a big batch
			// Better: pull batchSize=1 gives us the earliest, not latest. We need the sorted index's last entry.
			// For now, iterate to find max updatedAt from a small sample
		}
	}

	// Get latest updatedAt by pulling the last doc from each collection with data
	for (const name of collections) {
		const store = getCollectionStore(name);
		if (!store) continue;
		const count = store.count();
		if (count === 0) continue;
		// Pull all docs up to count to find the latest (sorted by updatedAt asc, so last = newest)
		const { checkpoint } = store.pull(null, count);
		if (checkpoint?.updatedAt) {
			if (!latestUpdatedAt || checkpoint.updatedAt > latestUpdatedAt) {
				latestUpdatedAt = checkpoint.updatedAt;
			}
		}
	}

	return { totalDocs, latestUpdatedAt, counts };
}

/** Format connection types into a compact display string */
function formatConnectionTypes(types: Set<ConnectionType>): string {
	const labels: string[] = [];
	if (types.has('sse')) labels.push('SSE');
	if (types.has('push') || types.has('pull')) labels.push('SYNC');
	if (types.has('page')) labels.push('HTTP');
	if (types.has('api')) labels.push('API');
	return labels.join('+') || '—';
}

/** Log a summary of all connected devices and their current routes */
export function logDeviceRoutes(): void {
	const clients = Array.from(knownClients.values());
	if (clients.length === 0) {
		log.info('Devices', 'No devices tracked yet');
		return;
	}

	// Re-fetch device info for all clients so names/roles stay current
	for (const c of clients) {
		const devInfo = lookupDeviceByIp(c.ip);
		if (devInfo) {
			c.deviceName = devInfo.name;
			c.userName = devInfo.userName;
			c.role = devInfo.role;
			c.locationId = devInfo.locationId;
			c.dataMode = devInfo.dataMode;
			c.isOnline = devInfo.isOnline;
		}
	}

	// Server data stats
	const { totalDocs, latestUpdatedAt, counts } = getServerDataStats();
	const lastDataUpdate = latestUpdatedAt
		? timeAgo(new Date(latestUpdatedAt))
		: 'no data';

	// Top collections by count
	const topCollections = Object.entries(counts)
		.sort((a, b) => b[1] - a[1])
		.slice(0, 5)
		.map(([name, count]) => `${name}:${count}`)
		.join('  ');

	const lines: string[] = [
		'DEVICE ROUTE MAP',
		`Server data: ${totalDocs} docs | last updated: ${lastDataUpdate}`,
		`Top: ${topCollections}`,
		'',
	];

	for (const c of clients) {
		const name = c.isServer
			? 'Server'
			: c.deviceName || c.userName || c.displayIp;
		const loc = LOCATION_NAMES[c.locationId] || c.locationId || '—';
		const icon = c.isServer ? '💻' : '📱';
		const role = c.role || (c.isServer ? 'server' : '—');
		const status = c.isOnline ? '🟢' : '🔴';
		const conn = formatConnectionTypes(c.connectionTypes);
		const sync = c.isServer ? '' : ` | synced: ${timeAgo(c.lastSyncAt)}`;
		lines.push(`${icon} ${status} ${name.padEnd(16)} ${role.padEnd(8)} @ ${loc.padEnd(12)} → ${c.currentRoute} [${conn}]${sync}`);
	}
	log.banner(...lines);
}
