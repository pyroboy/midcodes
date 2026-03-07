/**
 * POS Tables — Table state and lifecycle (open, close, timers, layout).
 * Does NOT read from orders or KDS — no circular dependencies.
 */
import type { Table, TableZone, TableStatus, ChairConfig } from '$lib/types';
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';
import { session, isWarehouseSession } from '$lib/stores/session.svelte';
import { createRxStore } from '$lib/stores/sync.svelte';
import { getDb } from '$lib/db';
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

const _tables = createRxStore<Table>('tables', db => db.tables.find());

export const tables = {
	get value() { return _tables.value; },
	get initialized() { return _tables.initialized; }
};

// ─── Table Actions ────────────────────────────────────────────────────────────

export async function openTable(tableId: string, pax: number = 4, packageName?: string): Promise<string> {
	if (isWarehouseSession()) return '';
	const table = tables.value.find((t) => t.id === tableId);
	if (!table || table.status !== 'available') return table?.currentOrderId ?? '';

	const db = await getDb();
	const orderId = nanoid();

	const tableDoc = await db.tables.findOne(tableId).exec();
	if (tableDoc) {
		await tableDoc.incrementalPatch({
			status: 'occupied',
			sessionStartedAt: new Date().toISOString(),
			elapsedSeconds: 0,
			currentOrderId: orderId,
			billTotal: 0,
			updatedAt: new Date().toISOString()
		});
	}

	await db.orders.insert({
		id: orderId,
		locationId: table.locationId,
		orderType: 'dine-in',
		tableId,
		tableNumber: table.number,
		packageName: packageName ?? null,
		packageId: null,
		pax,
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

	log.tableOpened(table.label, packageName ?? null, pax);
	return orderId;
}

export async function closeTable(tableId: string) {
	const table = tables.value.find(t => t.id === tableId);
	if (!table) return;

	const db = await getDb();
	const doc = await db.tables.findOne(tableId).exec();
	if (!doc) {
		console.warn(`[closeTable] Table ${tableId} not found`);
		return;
	}
	await doc.incrementalPatch({
		status: 'available',
		sessionStartedAt: null,
		elapsedSeconds: null,
		currentOrderId: null,
		billTotal: null,
		updatedAt: new Date().toISOString()
	});
}

export async function printBill(orderId: string) {
	const db = await getDb();
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (!orderDoc) return;

	const order = orderDoc.toJSON();
	await orderDoc.incrementalPatch({ billPrinted: true, updatedAt: new Date().toISOString() });

	if (order.tableId) {
		const tableDoc = await db.tables.findOne(order.tableId).exec();
		if (tableDoc) await tableDoc.incrementalPatch({ status: 'billing', updatedAt: new Date().toISOString() });
	}
}

export async function setTableMaintenance(tableId: string, isMaintenance: boolean) {
	const table = tables.value.find(t => t.id === tableId);
	if (!table) return;
	if (isMaintenance && table.status !== 'available') return;

	const db = await getDb();
	const doc = await db.tables.findOne(tableId).exec();
	if (doc) {
		await doc.incrementalPatch({
			status: isMaintenance ? 'maintenance' : 'available',
			updatedAt: new Date().toISOString()
		});
	}
	log.tableMaintenanceToggled(table.label, isMaintenance);
}

export async function updateTableTimers() {
	if (!browser || session.locationId === 'wh-tag') return;
	const db = await getDb();
	const SESSION_SECONDS = 2 * 60 * 60; // 2 hours

	for (const table of tables.value) {
		if (table.status === 'available' || table.status === 'maintenance' || !table.sessionStartedAt) continue;

		const start = new Date(table.sessionStartedAt).getTime();
		const now = Date.now();
		const seconds = Math.floor((now - start) / 1000);

		const updates: Partial<Table> = {};

		if (seconds !== table.elapsedSeconds) {
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
			const doc = await db.tables.findOne(table.id).exec();
			if (doc) await doc.incrementalPatch({ ...updates, updatedAt: new Date().toISOString() });
		}
	}
}

export async function updateTableLayout(tableUpdates: Pick<Table, 'id' | 'x' | 'y' | 'width' | 'height'>[]) {
	if (!browser) return;
	const db = await getDb();
	for (const update of tableUpdates) {
		const doc = await db.tables.findOne(update.id).exec();
		if (doc) {
			await doc.incrementalPatch({ x: update.x, y: update.y, width: update.width, height: update.height, updatedAt: new Date().toISOString() });
		}
	}
}

export async function addTable(locationId: string, label: string, capacity: number, x: number, y: number) {
	if (!browser) return;
	const db = await getDb();
	const number = tables.value.filter(t => t.locationId === locationId).length + 1;
	const id = `${locationId === 'tag' ? 'TAG' : 'PGL'}-T${number}-${nanoid(4)}`;
	await db.tables.insert({
		id, locationId, number, label, zone: 'main', capacity,
		x, y, width: 112, height: 112,
		shape: 'rect',
		status: 'available', sessionStartedAt: null, elapsedSeconds: null, currentOrderId: null, billTotal: null,
		updatedAt: new Date().toISOString()
	});
}

export async function deleteTable(tableId: string) {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.tables.findOne(tableId).exec();
	if (doc && doc.status === 'available') {
		await doc.remove();
	}
}

export async function updateTableChairs(tableId: string, chairConfig: ChairConfig | null) {
	if (!browser) return;
	const db = await getDb();
	const doc = await db.tables.findOne(tableId).exec();
	if (doc) {
		const plain = chairConfig ? JSON.parse(JSON.stringify(chairConfig)) : null;
		await doc.incrementalPatch({ chairConfig: plain, updatedAt: new Date().toISOString() });
	}
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
	const db = await getDb();
	const doc = await db.tables.findOne(tableId).exec();
	if (doc) {
		await doc.incrementalPatch({ ...JSON.parse(JSON.stringify(style)), updatedAt: new Date().toISOString() });
	}
}

export async function updateTableOrder(tableId: string, orderId: string | null) {
	const table = tables.value.find(t => t.id === tableId);
	if (!table) return;

	const db = await getDb();
	const doc = await db.tables.findOne(tableId).exec();
	if (doc) {
		await doc.incrementalPatch({ currentOrderId: orderId, updatedAt: new Date().toISOString() });
	}
}
