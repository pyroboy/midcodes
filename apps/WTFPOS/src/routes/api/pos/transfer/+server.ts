import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getCollectionStore } from '$lib/server/replication-store';
import { nanoid } from 'nanoid';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getAllDocs(store: NonNullable<ReturnType<typeof getCollectionStore>>): any[] {
	const { documents } = store.pull(null, Infinity);
	return documents;
}

function findById(store: NonNullable<ReturnType<typeof getCollectionStore>>, id: string): any | null {
	return getAllDocs(store).find((doc: any) => doc.id === id && !doc._deleted) ?? null;
}

function writeAuditLog(
	locationId: string,
	description: string,
	meta?: Record<string, unknown>
) {
	const auditStore = getCollectionStore('audit_logs');
	if (!auditStore) return;

	const now = new Date();
	auditStore.push([{
		newDocumentState: {
			id: nanoid(),
			locationId,
			isoTimestamp: now.toISOString(),
			timestamp: now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
			user: 'System',
			role: 'system',
			branch: locationId.toUpperCase(),
			action: 'admin',
			description,
			meta: meta ? JSON.stringify(meta) : undefined,
			updatedAt: now.toISOString(),
		},
		assumedMasterState: null,
	}]);
}

// ─── POST Handler ────────────────────────────────────────────────────────────

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { fromTableId, toTableId } = body as { fromTableId: string; toTableId: string };

	if (!fromTableId || !toTableId) {
		return json({ success: false, error: 'Missing fromTableId or toTableId' }, { status: 400 });
	}

	if (fromTableId === toTableId) {
		return json({ success: false, error: 'Cannot transfer a table to itself' }, { status: 400 });
	}

	// ── Get stores ──
	const tablesStore = getCollectionStore('tables');
	const ordersStore = getCollectionStore('orders');
	const kdsStore = getCollectionStore('kds_tickets');

	if (!tablesStore || !ordersStore) {
		return json({ success: false, error: 'Server stores not available' }, { status: 503 });
	}

	// ── Read current state ──
	const fromTable = findById(tablesStore, fromTableId);
	const toTable = findById(tablesStore, toTableId);

	// ── Pre-validation ──
	if (!fromTable) {
		return json({ success: false, error: `Source table ${fromTableId} not found` });
	}
	if (!toTable) {
		return json({ success: false, error: `Destination table ${toTableId} not found` });
	}
	if (fromTable.status === 'available' || !fromTable.currentOrderId) {
		return json({ success: false, error: 'Source table is not occupied or has no order' });
	}
	if (toTable.status !== 'available') {
		return json({ success: false, error: `Destination table is not available (status: ${toTable.status})` });
	}
	if (fromTable.locationId !== toTable.locationId) {
		return json({ success: false, error: 'Cannot transfer between different locations' });
	}

	const orderId = fromTable.currentOrderId;
	const order = findById(ordersStore, orderId);

	if (!order) {
		return json({ success: false, error: `Order ${orderId} not found` });
	}
	if (order.status !== 'open') {
		return json({ success: false, error: `Order is not open (status: ${order.status})` });
	}

	// ── All validations passed — perform atomic writes ──
	const now = new Date().toISOString();
	const locationId = fromTable.locationId;

	// 1. Patch destination table: copy session from source
	const newToTable = {
		...toTable,
		status: fromTable.status,
		sessionStartedAt: fromTable.sessionStartedAt,
		elapsedSeconds: fromTable.elapsedSeconds,
		currentOrderId: orderId,
		billTotal: fromTable.billTotal,
		updatedAt: now,
	};

	// 2. Patch source table: clear to available
	const newFromTable = {
		...fromTable,
		status: 'available',
		sessionStartedAt: null,
		elapsedSeconds: null,
		currentOrderId: null,
		billTotal: null,
		updatedAt: now,
	};

	// 3. Patch order: update tableId and tableNumber
	const newOrder = {
		...order,
		tableId: toTableId,
		tableNumber: toTable.number,
		updatedAt: now,
	};

	// 4. Find and patch KDS ticket (if any)
	let kdsTicket: any = null;
	let newKdsTicket: any = null;
	if (kdsStore) {
		const allTickets = getAllDocs(kdsStore);
		kdsTicket = allTickets.find((t: any) => t.orderId === orderId && !t._deleted) ?? null;
		if (kdsTicket) {
			newKdsTicket = {
				...kdsTicket,
				tableNumber: toTable.number,
				updatedAt: now,
			};
		}
	}

	// ── Push all changes atomically ──
	// All pushes happen synchronously in-memory, so no interleaving from other requests
	const toTableConflicts = tablesStore.push([
		{ newDocumentState: newToTable, assumedMasterState: toTable }
	]);
	const fromTableConflicts = tablesStore.push([
		{ newDocumentState: newFromTable, assumedMasterState: fromTable }
	]);
	const orderConflicts = ordersStore.push([
		{ newDocumentState: newOrder, assumedMasterState: order }
	]);

	let kdsConflicts: any[] = [];
	if (kdsStore && kdsTicket && newKdsTicket) {
		kdsConflicts = kdsStore.push([
			{ newDocumentState: newKdsTicket, assumedMasterState: kdsTicket }
		]);
	}

	// Check for conflicts
	const totalConflicts = toTableConflicts.length + fromTableConflicts.length +
		orderConflicts.length + kdsConflicts.length;

	if (totalConflicts > 0) {
		writeAuditLog(
			locationId,
			`[Transfer Guard] Transfer ${fromTable.label ?? fromTableId} → ${toTable.label ?? toTableId} completed with ${totalConflicts} conflict(s)`,
			{
				guardType: 'transfer-conflict',
				fromTableId,
				toTableId,
				orderId,
				conflicts: totalConflicts,
			}
		);
	}

	writeAuditLog(
		locationId,
		`[Transfer] Server-side atomic transfer: ${fromTable.label ?? fromTableId} → ${toTable.label ?? toTableId} (order ${orderId.slice(0, 8)}…)`,
		{
			guardType: 'transfer-success',
			fromTableId,
			toTableId,
			orderId,
		}
	);

	return json({
		success: true,
		orderId,
		fromLabel: fromTable.label ?? fromTableId,
		toLabel: toTable.label ?? toTableId,
		conflicts: totalConflicts,
	});
};
