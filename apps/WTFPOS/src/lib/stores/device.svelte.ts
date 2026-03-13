import { browser } from '$app/environment';
import { getDb } from '$lib/db';
import { createStore } from './create-store.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { needsRxDb, getDataMode } from '$lib/stores/data-mode.svelte';
import { session } from './session.svelte';
import { connectionState } from './connection.svelte';
import { APP_VERSION, BUILD_DATE } from '$lib/version';
import { nanoid } from 'nanoid';

// ─── Device ID (persisted in localStorage + cookie backup) ──────────────────

const DEVICE_ID_KEY = 'wtfpos_device_id';
const DEVICE_NAME_KEY = 'wtfpos_device_name';
const DEVICE_ID_COOKIE = 'wtfpos_did';

/** Read device ID from cookie (1-year max-age backup). */
function getCookieDeviceId(): string | null {
	try {
		const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${DEVICE_ID_COOKIE}=([^;]+)`));
		return match ? decodeURIComponent(match[1]) : null;
	} catch { return null; }
}

/** Write device ID to cookie with 1-year expiry. */
function setCookieDeviceId(id: string) {
	try {
		document.cookie = `${DEVICE_ID_COOKIE}=${encodeURIComponent(id)};path=/;max-age=31536000;SameSite=Lax`;
	} catch { /* noop */ }
}

function getDeviceId(): string {
	if (!browser) return '';
	// Layer 1: localStorage (primary)
	let id = localStorage.getItem(DEVICE_ID_KEY);
	if (id) {
		setCookieDeviceId(id); // keep cookie in sync
		return id;
	}
	// Layer 2: cookie backup (survives localStorage clear)
	id = getCookieDeviceId();
	if (id) {
		localStorage.setItem(DEVICE_ID_KEY, id); // restore to primary
		return id;
	}
	// Layer 3: generate new (collision-safe nanoid(16) = 96 bits entropy) + persist to both
	id = `dev-${nanoid(16)}`;
	localStorage.setItem(DEVICE_ID_KEY, id);
	setCookieDeviceId(id);
	return id;
}

function getDeviceName(): string {
	if (!browser) return '';
	return localStorage.getItem(DEVICE_NAME_KEY) || session.userName || 'Unnamed Device';
}

function detectDeviceType(): 'tablet' | 'phone' | 'desktop' {
	if (!browser) return 'desktop';
	const width = window.innerWidth;
	const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
	if (!isTouchDevice) return 'desktop';
	if (width < 768) return 'phone';
	return 'tablet';
}

// ─── Reactive device list (all registered devices) ──────────────────────────

export const devices = createStore<DeviceRecord>('devices', (db: any) => db.devices.find());

export interface DeviceRecord {
	id: string;
	name: string;
	locationId: string;
	role: string;
	userName: string;
	appVersion: string;
	buildDate: string;
	lastSeenAt: string;
	isOnline: boolean;
	syncStatus: 'local-only' | 'syncing' | 'synced' | 'error';
	deviceType: string;
	screenWidth: number;
	userAgent: string;
	dbLastUpdated: string;
	dbDocCount: number;
	isServer: boolean;
	ipAddress: string;
	dataMode: 'full-rxdb' | 'selective-rxdb' | 'sse-only' | 'api-fetch';
	updatedAt: string;
}

// ─── Auto-detected device identity (IP + server status) ─────────────────────

let deviceIdentity = $state({ ipAddress: '', isServer: false, serverEpoch: 0, serverLanIp: '' });

/** Track the last known server epoch to detect restarts */
const SERVER_EPOCH_KEY = 'wtfpos_server_epoch';

async function fetchDeviceIdentity(retries = 3) {
	if (!browser) return;
	for (let attempt = 0; attempt < retries; attempt++) {
		try {
			const res = await fetch('/api/device/identify', { signal: AbortSignal.timeout(5000) });
			if (res.ok) {
				const data = await res.json();
				deviceIdentity.ipAddress = data.ipAddress || '';
				deviceIdentity.isServer = !!data.isServer;
				deviceIdentity.serverLanIp = data.serverLanIp || '';

				// Epoch-based split-brain detection: if server epoch changed,
				// another server startup happened — trigger re-sync
				const newEpoch = data.serverEpoch ?? 0;
				const lastEpoch = parseInt(localStorage.getItem(SERVER_EPOCH_KEY) || '0', 10);
				if (lastEpoch > 0 && newEpoch !== lastEpoch) {
					console.warn(`[Device] Server epoch changed (${lastEpoch} → ${newEpoch}) — server restarted`);
				}
				if (newEpoch > 0) {
					localStorage.setItem(SERVER_EPOCH_KEY, String(newEpoch));
					deviceIdentity.serverEpoch = newEpoch;
				}
				console.log(`[Device] Identity resolved: ip=${data.ipAddress}, isServer=${data.isServer}`);
				return; // success — done
			}
		} catch {
			// will retry
		}
		// Wait before retry (1s, 2s)
		if (attempt < retries - 1) {
			await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
		}
	}
	console.warn('[Device] fetchDeviceIdentity() — all retries failed');
}

/**
 * Check if this device is the server (auto-detected via IP).
 */
export function isThisDeviceServer(): boolean {
	return deviceIdentity.isServer;
}

/**
 * Get the current device identity (IP + server status).
 */
export function getDeviceIdentity() {
	return deviceIdentity;
}

// ─── DB Fingerprint (cached — recomputed every 5 minutes, not every heartbeat) ─

const DB_FINGERPRINT_COLLECTIONS = [
	'tables', 'orders', 'menu_items', 'stock_items', 'deliveries',
	'waste', 'deductions', 'adjustments', 'expenses', 'stock_counts', 'devices',
	'kds_tickets', 'x_reads', 'z_reads', 'audit_logs', 'kitchen_alerts',
	'floor_elements'
] as const;

const FINGERPRINT_CACHE_TTL = 60 * 1000; // 60 seconds — faster updates for new devices
let cachedFingerprint: { dbLastUpdated: string; dbDocCount: number } | null = null;
let lastFingerprintAt = 0;

async function getDbFingerprint(db: any): Promise<{ dbLastUpdated: string; dbDocCount: number }> {
	// DB fingerprinting is RxDB-only — no IndexedDB in sse-only/api-fetch modes
	if (!needsRxDb()) {
		return { dbLastUpdated: '', dbDocCount: 0 };
	}

	const now = Date.now();
	if (cachedFingerprint && (now - lastFingerprintAt) < FINGERPRINT_CACHE_TTL) {
		return cachedFingerprint;
	}

	let latestUpdated = '';
	let totalDocs = 0;

	for (const colName of DB_FINGERPRINT_COLLECTIONS) {
		try {
			const col = db[colName];
			if (!col) continue;
			const count = await col.count().exec();
			totalDocs += count;

			// Only find the latest updatedAt doc (much cheaper than loading all docs)
			const latest = await col.findOne({ sort: [{ updatedAt: 'desc' }] }).exec();
			if (latest) {
				const upd = latest.updatedAt || '';
				if (upd > latestUpdated) latestUpdated = upd;
			}
		} catch {
			// collection might not exist yet
		}
	}

	cachedFingerprint = { dbLastUpdated: latestUpdated, dbDocCount: totalDocs };
	lastFingerprintAt = now;
	return cachedFingerprint;
}

/**
 * Force refresh the fingerprint cache (e.g. after a known data change).
 */
export function invalidateFingerprintCache() {
	cachedFingerprint = null;
	lastFingerprintAt = 0;
}

// ─── Heartbeat ──────────────────────────────────────────────────────────────

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let identityInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Instant registration: creates device record with minimal data (no fingerprint).
 * Takes <50ms instead of 5-10s. The record appears in Device Monitor immediately.
 */
async function quickRegisterDevice() {
	if (!browser) return;
	const col = getWritableCollection('devices');
	const deviceId = getDeviceId();
	const now = new Date().toISOString();

	const existing = await col.findOne(deviceId).exec();
	if (existing) {
		await col.incrementalPatch(deviceId, {
			lastSeenAt: now,
			isOnline: connectionState.isOnline,
			locationId: session.locationId || '',
			role: session.role || '',
			userName: session.userName || '',
			dataMode: getDataMode(),
			updatedAt: now
		});
	} else {
		const record: DeviceRecord = {
			id: deviceId,
			name: getDeviceName(),
			locationId: session.locationId || '',
			role: session.role || '',
			userName: session.userName || '',
			appVersion: APP_VERSION,
			buildDate: BUILD_DATE,
			lastSeenAt: now,
			isOnline: connectionState.isOnline,
			syncStatus: 'local-only',
			deviceType: detectDeviceType(),
			screenWidth: window.innerWidth,
			userAgent: navigator.userAgent,
			dbLastUpdated: '',
			dbDocCount: 0,
			isServer: false,
			ipAddress: '',
			dataMode: getDataMode(),
			updatedAt: now
		};
		await col.insert(record);
	}
	console.log(`[Device] Quick-registered ${deviceId} in <50ms`);
}

/**
 * Full upsert: patches device record with fingerprint + identity (slow but complete).
 * Called after quick registration to enrich the record in the background.
 */
async function upsertDevice() {
	if (!browser) return;
	const col = getWritableCollection('devices');
	const deviceId = getDeviceId();

	// getDbFingerprint handles non-RxDB mode internally (returns empty data)
	const db = needsRxDb() ? await getDb() : null;
	const fingerprint = await getDbFingerprint(db);

	const now = new Date().toISOString();
	const existing = await col.findOne(deviceId).exec();
	if (existing) {
		const patch: Record<string, any> = {
			lastSeenAt: now,
			isOnline: connectionState.isOnline,
			locationId: session.locationId || '',
			role: session.role || '',
			userName: session.userName || '',
			appVersion: APP_VERSION,
			buildDate: BUILD_DATE,
			screenWidth: window.innerWidth,
			dbLastUpdated: fingerprint.dbLastUpdated,
			dbDocCount: fingerprint.dbDocCount,
			isServer: deviceIdentity.isServer,
			ipAddress: deviceIdentity.ipAddress,
			dataMode: getDataMode(),
			updatedAt: now
		};
		// Auto-fix "Unnamed Device": if a user has since logged in, update the name
		// (only if user hasn't manually renamed it via admin UI)
		const currentName = typeof existing.toJSON === 'function' ? existing.toJSON().name : existing.name;
		if (currentName === 'Unnamed Device' && !localStorage.getItem(DEVICE_NAME_KEY)) {
			const betterName = getDeviceName();
			if (betterName !== 'Unnamed Device') {
				patch.name = betterName;
			}
		}
		await col.incrementalPatch(deviceId, patch);
	} else {
		const record: DeviceRecord = {
			id: deviceId,
			name: getDeviceName(),
			locationId: session.locationId || '',
			role: session.role || '',
			userName: session.userName || '',
			appVersion: APP_VERSION,
			buildDate: BUILD_DATE,
			lastSeenAt: now,
			isOnline: connectionState.isOnline,
			syncStatus: 'local-only',
			deviceType: detectDeviceType(),
			screenWidth: window.innerWidth,
			userAgent: navigator.userAgent,
			dbLastUpdated: fingerprint.dbLastUpdated,
			dbDocCount: fingerprint.dbDocCount,
			isServer: deviceIdentity.isServer,
			ipAddress: deviceIdentity.ipAddress,
			dataMode: getDataMode(),
			updatedAt: now
		};
		await col.insert(record);
	}
}

/**
 * Attempt to re-identify this device from existing device records.
 * Matches on {userAgent, deviceType, screenWidth} to recover from ID loss
 * (e.g. after full browser data clear). Only triggers when a new ID was just generated.
 */
async function tryReidentify() {
	if (!browser) return;
	const currentId = getDeviceId();

	const ua = navigator.userAgent;
	const type = detectDeviceType();
	const width = window.innerWidth;

	// Local DB search is only possible in RxDB mode
	if (needsRxDb()) {
		const db = await getDb();

		// Only attempt re-identification if this device has no existing record
		const existingDoc = await db.devices.findOne(currentId).exec();
		if (existingDoc) return; // already registered — no re-identification needed

		// Search for an orphaned device record matching this hardware profile
		const allDevices = await db.devices.find().exec();
		const staleThreshold = Date.now() - 7 * 24 * 60 * 60 * 1000; // offline >7 days = too old
		const candidate = allDevices.find((d: any) => {
			if (d.id === currentId) return false;
			if (d.userAgent !== ua) return false;
			if (d.deviceType !== type) return false;
			if (Math.abs(d.screenWidth - width) > 50) return false; // allow small viewport drift
			// Match devices seen within 7 days — skip truly stale ones
			const lastSeen = new Date(d.lastSeenAt).getTime();
			return lastSeen >= staleThreshold;
		});

		if (candidate) {
			const oldId = candidate.id;
			console.log(`[Device] Re-identified as ${oldId} (was ${currentId}) via local hardware fingerprint`);
			localStorage.setItem(DEVICE_ID_KEY, oldId);
			setCookieDeviceId(oldId);
			return;
		}
	}

	// Server-side re-identification (works in all modes)
	try {
		const res = await fetch('/api/device/identify', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ userAgent: ua, deviceType: type, screenWidth: width })
		});
		if (res.ok) {
			const data = await res.json();
			if (data.matchedDeviceId) {
				console.log(`[Device] Re-identified as ${data.matchedDeviceId} (was ${currentId}) via server fingerprint`);
				localStorage.setItem(DEVICE_ID_KEY, data.matchedDeviceId);
				setCookieDeviceId(data.matchedDeviceId);
			}
		}
	} catch { /* server unreachable — skip server re-identification */ }
}

/**
 * Call once from root layout on mount.
 * Phase 1 (instant): Registers device with minimal data so it appears in Device Monitor immediately.
 * Phase 2 (background): Enriches with IP, server status, DB fingerprint, and starts heartbeat.
 */
export async function initDeviceHeartbeat() {
	if (!browser) return;
	if (heartbeatInterval) return; // already running

	// ── Phase 1: INSTANT registration (<100ms) ──
	// Device appears in Device Monitor immediately with basic info
	await quickRegisterDevice();

	// Force-push so the server sees us right away
	triggerDevicesReSync();

	// ── Phase 2: BACKGROUND enrichment (parallel, non-blocking) ──
	// Fetch IP/server identity and re-identification in parallel
	const enrichPromise = Promise.allSettled([
		fetchDeviceIdentity(),
		tryReidentify()
	]).then(async () => {
		// Now do a full upsert with identity + fingerprint
		await upsertDevice();
		triggerDevicesReSync();
		console.log('[Device] Background enrichment complete');
	});

	// Don't await — let it run in background
	enrichPromise.catch(() => {});

	// ── Phase 3: Fast initial heartbeat cadence ──
	// 5s intervals for first 30s (6 beats), then slow to 30s
	let fastBeatCount = 0;
	const fastHeartbeat = setInterval(async () => {
		fastBeatCount++;
		await upsertDevice();
		triggerDevicesReSync();
		if (fastBeatCount >= 6) {
			clearInterval(fastHeartbeat);
			console.log('[Device] Fast heartbeat phase complete, switching to 30s cadence');
		}
	}, 5_000);

	// Start periodic heartbeat (leader-gated to avoid duplicate writes across tabs)
	// Leader election requires RxDB — in non-RxDB modes, start heartbeat directly
	if (needsRxDb()) {
		try {
			const { waitForLeadership } = await import('$lib/db');
			waitForLeadership().then(() => {
				console.log('[Device] This tab is the leader — starting periodic heartbeat');
				startPeriodicHeartbeat();
			});
		} catch {
			// Fallback: if leader election fails, run heartbeat anyway
			startPeriodicHeartbeat();
		}
	} else {
		console.log('[Device] Non-RxDB mode — starting heartbeat without leader election');
		startPeriodicHeartbeat();
	}
}

/** Trigger an immediate reSync of the devices collection so the server sees changes fast. */
function triggerDevicesReSync() {
	import('$lib/db/replication').then(({ getActiveReplication }) => {
		const devicesRep = getActiveReplication('devices');
		if (devicesRep?.reSync) devicesRep.reSync();
	}).catch(() => { /* replication might not be started yet */ });
}

function startPeriodicHeartbeat() {
	// Heartbeat every 30 seconds
	heartbeatInterval = setInterval(() => {
		upsertDevice();
	}, 30_000);

	// Re-fetch identity every 5 minutes (handles DHCP IP changes)
	identityInterval = setInterval(() => {
		fetchDeviceIdentity();
	}, 5 * 60 * 1000);

	// Prune stale devices every 5 minutes
	setInterval(() => {
		pruneStaleDevices();
	}, 5 * 60 * 1000);

	// Also prune on startup (once, after a short delay to let stores initialize)
	setTimeout(() => pruneStaleDevices(), 10_000);

	// Catch up after tab sleep/background: when the page becomes visible again,
	// immediately fire a heartbeat so the device doesn't appear stale/offline.
	if (typeof document !== 'undefined') {
		document.addEventListener('visibilitychange', () => {
			if (document.visibilityState === 'visible') {
				console.log('[Device] Tab became visible — sending catch-up heartbeat');
				upsertDevice();
				triggerDevicesReSync();
			}
		});
	}
}

export function stopDeviceHeartbeat() {
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
		heartbeatInterval = null;
	}
	if (identityInterval) {
		clearInterval(identityInterval);
		identityInterval = null;
	}
}

/**
 * Update the device name (user-editable from admin panel).
 */
export async function renameDevice(deviceId: string, newName: string) {
	if (!browser) return;
	const col = getWritableCollection('devices');
	const doc = await col.findOne(deviceId).exec();
	if (doc) {
		await col.incrementalPatch(deviceId, { name: newName, updatedAt: new Date().toISOString() });
		// Persist locally if it's this device
		if (deviceId === getDeviceId()) {
			localStorage.setItem(DEVICE_NAME_KEY, newName);
		}
	}
}

/**
 * Get the current device's ID for highlighting in the admin panel.
 */
export function getCurrentDeviceId(): string {
	return getDeviceId();
}

/**
 * Remove device records that haven't heartbeated in over 24 hours.
 * Called periodically from the heartbeat loop (leader only).
 */
export async function pruneStaleDevices() {
	if (!browser) return;
	const STALE_THRESHOLD_MS = 24 * 60 * 60 * 1000; // 24 hours
	const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS).toISOString();
	const currentId = getDeviceId();

	const staleDevices = (devices.value || []).filter(d =>
		d.id !== currentId && // never prune self
		d.lastSeenAt < cutoff
	);

	if (staleDevices.length === 0) return;

	const col = getWritableCollection('devices');
	for (const device of staleDevices) {
		try {
			await col.remove(device.id);
			console.log(`[Device] Pruned stale device: ${device.name || device.id} (last seen: ${device.lastSeenAt})`);
		} catch { /* ignore removal errors */ }
	}
}

/**
 * Remove a single device record by ID.
 * Will not remove the current device.
 */
export async function removeDevice(deviceId: string) {
	if (!browser) return;
	if (deviceId === getDeviceId()) return; // never remove self
	const col = getWritableCollection('devices');
	await col.remove(deviceId);
	console.log(`[Device] Manually removed device: ${deviceId}`);
}
