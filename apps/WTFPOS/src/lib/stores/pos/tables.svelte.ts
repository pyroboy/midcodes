/**
 * POS Tables — Table state and lifecycle (open, close, timers, layout).
 * Does NOT read from orders or KDS — no circular dependencies.
 */
import type { Table, TableZone, TableStatus, ChairConfig } from '$lib/types';
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';
import { session, isWarehouseSession } from '$lib/stores/session.svelte';
import { createStore } from '$lib/stores/create-store.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { browser } from '$app/environment';

const FLOOR_POSITIONS = [
	{ x: 40,  y: 50  }, { x: 200, y: 35  }, { x: 360, y: 52  }, { x: 520, y: 38  },
	{ x: 45,  y: 205 }, { x: 205, y: 195 }, { x: 368, y: 212 }, { x: 528, y: 198 },
	{ x: 60,  y: 355 }, { x: 215, y: 345 }, { x: 375, y: 360 }, { x: 535, y: 348 },
];

function makeTables(): Table[] {
	const gen = (locationId: string, prefix: string) => [
		...Array.from({ length: 8 }, (_, i) => ({
			id: `${prefix}-T${i + 1}`, locationId, number: i + 1, label: `T${i + 1}`, zone: 'main' as TableZone, capacity: i < 6 ? 4 : 2,
			x: FLOOR_POSITIONS[i]?.x ?? (i % 4) * 155 + 40,
			y: FLOOR_POSITIONS[i]?.y ?? Math.floor(i / 4) * 155 + 40,
			width: 112, height: 112,
			status: 'available' as const, sessionStartedAt: null, elapsedSeconds: null, currentOrderId: null, billTotal: null,
		updatedAt: new Date().toISOString()
		}))
	];
	return [...gen('tag', 'TAG'), ...gen('pgl', 'PGL')];
}

export const INITIAL_TABLES = makeTables();

const _tables = createStore<Table>('tables', db => db.tables.find());

export const tables = {
	get value() { return _tables.value; },
	get initialized() { return _tables.initialized; }
};

// ─── Table Actions ────────────────────────────────────────────────────────────

export async function openTable(tableId: string, pax: number = 4, packageName?: string, childPax: number = 0, freePax: number = 0, scCount: number = 0, pwdCount: number = 0): Promise<string> {
	if (isWarehouseSession()) return '';
	const table = tables.value.find((t) => t.id === tableId);
	if (!table || table.status !== 'available') return table?.currentOrderId ?? '';

	const tablesCol = getWritableCollection('tables');
	const ordersCol = getWritableCollection('orders');
	const orderId = nanoid();

	// Patch table to occupied — server may reject if already occupied (race condition guard)
	const patchResult = await tablesCol.incrementalPatch(tableId, {
		status: 'occupied',
		sessionStartedAt: new Date().toISOString(),
		elapsedSeconds: 0,
		currentOrderId: orderId,
		billTotal: 0,
	});

	// If the server guard blocked this (table already occupied), return the existing order
	if (patchResult?.guarded && patchResult?.document?.currentOrderId) {
		console.warn(`[openTable] Server blocked: table ${tableId} already occupied with order ${patchResult.document.currentOrderId}`);
		return patchResult.document.currentOrderId;
	}

	// Insert the order — server may also reject if a duplicate dine-in order exists
	const insertResult = await ordersCol.insert({
		id: orderId,
		locationId: table.locationId,
		orderType: 'dine-in',
		tableId,
		tableNumber: table.number,
		packageName: packageName ?? null,
		packageId: null,
		pax,
		childPax,
		freePax,
		scCount: scCount > 0 ? scCount : undefined,
		pwdCount: pwdCount > 0 ? pwdCount : undefined,
		items: [],
		status: 'open',
		discountType: 'none',
		subtotal: 0,
		discountAmount: 0,
		vatAmount: 0,
		total: 0,
		payments: [],
		createdAt: new Date().toISOString(),
		closedAt: null,
		billPrinted: false,
		notes: '',
		updatedAt: new Date().toISOString()
	});

	// If the server guard blocked the order insert, return the existing order's ID
	if (insertResult?.guarded && insertResult?.document?.id) {
		console.warn(`[openTable] Server blocked order insert: table ${tableId} already has order ${insertResult.document.id}`);
		return insertResult.document.id;
	}

	log.tableOpened(table.label, packageName ?? null, pax);
	return orderId;
}

export async function closeTable(tableId: string) {
	const table = tables.value.find(t => t.id === tableId);
	if (!table) return;

	const col = getWritableCollection('tables');
	try {
		await col.incrementalPatch(tableId, {
			status: 'available',
			sessionStartedAt: null,
			elapsedSeconds: null,
			currentOrderId: null,
			billTotal: null,
		});
	} catch (e) {
		console.warn(`[closeTable] Table ${tableId} not found`);
	}
}

export async function printBill(orderId: string) {
	const ordersCol = getWritableCollection('orders');
	const tablesCol = getWritableCollection('tables');

	const orderDoc = await ordersCol.findOne(orderId).exec();
	if (!orderDoc) return;

	const order = typeof orderDoc.toJSON === 'function' ? orderDoc.toJSON() : orderDoc;
	await ordersCol.incrementalPatch(orderId, { billPrinted: true });

	if (order.tableId) {
		await tablesCol.incrementalPatch(order.tableId, { status: 'billing' });
	}
}

export async function setTableMaintenance(tableId: string, isMaintenance: boolean) {
	const table = tables.value.find(t => t.id === tableId);
	if (!table) return;
	if (isMaintenance && table.status !== 'available') return;

	const col = getWritableCollection('tables');
	await col.incrementalPatch(tableId, {
		status: isMaintenance ? 'maintenance' : 'available',
	});
	log.tableMaintenanceToggled(table.label, isMaintenance);
}

export async function updateTableTimers() {
	if (!browser || session.locationId === 'wh-tag') return;
	const col = getWritableCollection('tables');
	const SESSION_SECONDS = 2 * 60 * 60; // 2 hours

	for (const table of tables.value) {
		if (table.status === 'available' || table.status === 'maintenance' || !table.sessionStartedAt) continue;

		const start = new Date(table.sessionStartedAt).getTime();
		const now = Date.now();
		const seconds = Math.floor((now - start) / 1000);

		const updates: Partial<Table> = {};

		// Only write elapsedSeconds every 30s — display shows minutes, so 30s granularity is invisible.
		// This reduces RxDB writes from 8/sec to 8/30sec (30x reduction), cutting the reactive cascade.
		if (seconds !== table.elapsedSeconds && seconds % 30 === 0) {
			updates.elapsedSeconds = seconds;
		}

		const lockedStatuses: TableStatus[] = ['billing', 'maintenance'];
		if (!lockedStatuses.includes(table.status)) {
			let nextStatus: TableStatus = 'occupied';
			if (seconds >= SESSION_SECONDS - (5 * 60)) nextStatus = 'critical';
			else if (seconds >= SESSION_SECONDS - (15 * 60)) nextStatus = 'warning';

			if (nextStatus !== table.status) {
				updates.status = nextStatus;
				console.log(`[TIMER] Table ${table.label}: ${table.status} -> ${nextStatus} (${seconds}s elapsed)`);
			}
		}

		if (Object.keys(updates).length > 0) {
			await col.incrementalPatch(table.id, { ...updates });
		}
	}
}

export async function updateTableLayout(tableUpdates: Pick<Table, 'id' | 'x' | 'y' | 'width' | 'height'>[]) {
	if (!browser) return;
	const col = getWritableCollection('tables');
	for (const update of tableUpdates) {
		await col.incrementalPatch(update.id, { x: update.x, y: update.y, width: update.width, height: update.height });
	}
}

export async function addTable(locationId: string, label: string, capacity: number, x: number, y: number) {
	if (!browser) return;
	const col = getWritableCollection('tables');
	const number = tables.value.filter(t => t.locationId === locationId).length + 1;
	const id = `${locationId === 'tag' ? 'TAG' : 'PGL'}-T${number}-${nanoid(4)}`;
	await col.insert({
		id, locationId, number, label, zone: 'main', capacity,
		x, y, width: 112, height: 112,
		shape: 'rect',
		status: 'available', sessionStartedAt: null, elapsedSeconds: null, currentOrderId: null, billTotal: null,
		updatedAt: new Date().toISOString()
	});
}

export async function deleteTable(tableId: string) {
	if (!browser) return;
	const table = tables.value.find(t => t.id === tableId);
	if (table && table.status === 'available') {
		await getWritableCollection('tables').remove(tableId);
	}
}

export async function updateTableChairs(tableId: string, chairConfig: ChairConfig | null) {
	if (!browser) return;
	const col = getWritableCollection('tables');
	const plain = chairConfig ? JSON.parse(JSON.stringify(chairConfig)) : null;
	await col.incrementalPatch(tableId, { chairConfig: plain });
}

export async function updateTableStyle(tableId: string, style: {
	color?: string | null;
	opacity?: number | null;
	borderRadius?: number | null;
	rotation?: number | null;
	label?: string;
	capacity?: number;
	width?: number;
	height?: number;
}) {
	if (!browser) return;
	const col = getWritableCollection('tables');
	await col.incrementalPatch(tableId, JSON.parse(JSON.stringify(style)));
}

export async function updateTableOrder(tableId: string, orderId: string | null) {
	const table = tables.value.find(t => t.id === tableId);
	if (!table) return;

	const col = getWritableCollection('tables');
	await col.incrementalPatch(tableId, { currentOrderId: orderId });
}
