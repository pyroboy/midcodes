import { browser } from '$app/environment';
import { getDb } from '$lib/db';
import { createRxStore } from './sync.svelte';
import { session } from './session.svelte';
import { connectionState } from './connection.svelte';
import { APP_VERSION, BUILD_DATE } from '$lib/version';
import { nanoid } from 'nanoid';

// ─── Device ID (persisted in localStorage, unique per browser/tablet) ────────

const DEVICE_ID_KEY = 'wtfpos_device_id';
const DEVICE_NAME_KEY = 'wtfpos_device_name';

function getDeviceId(): string {
	if (!browser) return '';
	let id = localStorage.getItem(DEVICE_ID_KEY);
	if (!id) {
		id = `dev-${nanoid(10)}`;
		localStorage.setItem(DEVICE_ID_KEY, id);
	}
	return id;
}

function getDeviceName(): string {
	if (!browser) return '';
	return localStorage.getItem(DEVICE_NAME_KEY) || 'Unnamed Device';
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

export const devices = createRxStore<DeviceRecord>('devices', (db: any) => db.devices.find());

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
}

// ─── Heartbeat ──────────────────────────────────────────────────────────────

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

async function upsertDevice() {
	if (!browser) return;
	const db = await getDb();
	const deviceId = getDeviceId();

	const record: DeviceRecord = {
		id: deviceId,
		name: getDeviceName(),
		locationId: session.locationId || '',
		role: session.role || '',
		userName: session.userName || '',
		appVersion: APP_VERSION,
		buildDate: BUILD_DATE,
		lastSeenAt: new Date().toISOString(),
		isOnline: connectionState.isOnline,
		syncStatus: 'local-only',
		deviceType: detectDeviceType(),
		screenWidth: window.innerWidth,
		userAgent: navigator.userAgent
	};

	const existing = await db.devices.findOne(deviceId).exec();
	if (existing) {
		await existing.patch({
			lastSeenAt: record.lastSeenAt,
			isOnline: record.isOnline,
			locationId: record.locationId,
			role: record.role,
			userName: record.userName,
			appVersion: record.appVersion,
			buildDate: record.buildDate,
			screenWidth: record.screenWidth
		});
	} else {
		await db.devices.insert(record);
	}
}

/**
 * Call once from root layout on mount.
 * Registers this device and starts a 30-second heartbeat.
 */
export function initDeviceHeartbeat() {
	if (!browser) return;
	if (heartbeatInterval) return; // already running

	// Initial registration
	upsertDevice();

	// Heartbeat every 30 seconds
	heartbeatInterval = setInterval(() => {
		upsertDevice();
	}, 30_000);
}

export function stopDeviceHeartbeat() {
	if (heartbeatInterval) {
		clearInterval(heartbeatInterval);
		heartbeatInterval = null;
	}
}

/**
 * Update the device name (user-editable from admin panel).
 */
export async function renameDevice(deviceId: string, newName: string) {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.devices.findOne(deviceId).exec();
	if (doc) {
		await doc.patch({ name: newName });
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
