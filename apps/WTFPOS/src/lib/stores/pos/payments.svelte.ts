/**
 * POS Payments — Payment hold/confirm, cash/digital checkout, and split bill.
 */
import type { PaymentMethod, SubBill } from '$lib/types';
import { nanoid } from 'nanoid';
import { log } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';
import { getDb } from '$lib/db';
import { closeTable, tables } from '$lib/stores/pos/tables.svelte';
import { orders } from '$lib/stores/pos/orders.svelte';
import { calculateEqualSplit } from '$lib/stores/pos/payment.utils';

// ─── Direct Checkout (cash / GCash / Maya) ───────────────────────────────────

/**
 * Finalise a dine-in or takeout order: record payment, mark as paid, and free
 * the table. Used by CheckoutModal instead of direct proxy mutation.
 */
export async function checkoutOrder(
	orderId: string,
	method: 'cash' | 'gcash' | 'maya',
	tableId: string | null,
) {
	const db = await getDb();
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (!orderDoc) return;

	const capturedElapsed = tableId
		? (tables.value.find(t => t.id === tableId)?.elapsedSeconds ?? null)
		: null;

	await orderDoc.incrementalModify((doc: any) => {
		doc.payments = [...doc.payments, { method, amount: doc.total }];
		doc.status = 'paid';
		doc.closedAt = new Date().toISOString();
		doc.closedBy = session.userName || 'Staff';
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	if (tableId) await closeTable(tableId);

	const order = orders.value.find(o => o.id === orderId);
	const methodLabel = method === 'gcash' ? 'GCash' : method === 'maya' ? 'Maya' : 'Cash';
	const label = tableId
		? (tables.value.find(t => t.id === tableId)?.label ?? tableId)
		: `Takeout (${order?.customerName ?? 'Walk-in'})`;

	log.tableClosed(label, order?.total ?? 0, methodLabel, capturedElapsed ?? undefined);
}

// ─── Pending Payment Hold ────────────────────────────────────────────────────

export async function holdPayment(orderId: string, method: 'gcash' | 'maya') {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'open') return;

	const db = await getDb();
	const doc = await db.orders.findOne(orderId).exec();
	if (doc) {
		await doc.incrementalPatch({
			status: 'pending_payment',
			pendingPaymentMethod: method,
			updatedAt: new Date().toISOString()
		});
	}

	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.paymentHeld(label);
}

export async function confirmHeldPayment(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'pending_payment') return;

	const db = await getDb();
	const method = order.pendingPaymentMethod ?? 'gcash';
	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;

	const capturedElapsed = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.elapsedSeconds ?? null)
		: null;

	const orderDoc = await db.orders.findOne(orderId).exec();
	if (orderDoc) {
		await orderDoc.incrementalModify((doc: any) => {
			doc.payments = [...doc.payments, { method, amount: doc.total }];
			doc.status = 'paid';
			doc.closedAt = new Date().toISOString();
			doc.closedBy = session.userName || 'Staff';
			doc.updatedAt = new Date().toISOString();
			return doc;
		});
	}

	if (order.tableId) await closeTable(order.tableId);

	log.paymentConfirmed(label, order.total, method === 'gcash' ? 'GCash' : 'Maya');
	log.tableClosed(label, order.total, method === 'gcash' ? 'GCash' : 'Maya', capturedElapsed ?? undefined);
}

export async function cancelHeldPayment(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'pending_payment') return;

	const db = await getDb();
	const doc = await db.orders.findOne(orderId).exec();
	if (doc) {
		await doc.incrementalPatch({
			status: 'open',
			pendingPaymentMethod: '',
			updatedAt: new Date().toISOString()
		});
	}

	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.paymentCancelled(label);
}

// ─── Split Bill ──────────────────────────────────────────────────────────────

export async function initEqualSplit(orderId: string, splitCount: number) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || splitCount <= 0) return;

	const db = await getDb();
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (!orderDoc) {
		console.warn(`[initEqualSplit] Order ${orderId} not found`);
		return;
	}

	await orderDoc.incrementalModify((doc: any) => {
		if (doc.total <= 0) return doc;

		const amounts = calculateEqualSplit(doc.total, splitCount);
		const subBills = amounts.map((amount, i) => ({
			id: nanoid(),
			label: `Guest ${i + 1}`,
			itemIds: [],
			subtotal: amount,
			discountAmount: 0,
			vatAmount: 0,
			total: amount,
			payment: null,
			paidAt: null
		}));

		doc.splitType = 'equal';
		doc.subBills = subBills;
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.splitInitiated(label, 'equal', splitCount);
}

export async function initItemSplit(orderId: string, splitCount: number) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;

	const db = await getDb();
	const subBills = Array.from({ length: splitCount }, (_, i) => ({
		id: nanoid(),
		label: `Guest ${i + 1}`,
		itemIds: [],
		subtotal: 0, discountAmount: 0, vatAmount: 0, total: 0,
		payment: null, paidAt: null
	}));

	const orderDoc = await db.orders.findOne(orderId).exec();
	if (orderDoc) await orderDoc.incrementalPatch({ splitType: 'by-item', subBills, updatedAt: new Date().toISOString() });

	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.splitInitiated(label, 'by-item', splitCount);
}

export async function assignItemToSubBill(orderId: string, itemId: string, subBillId: string) {
	const db = await getDb();
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (!orderDoc) return;

	await orderDoc.incrementalModify((doc: any) => {
		if (!doc.subBills) return doc;

		const updatedSubBills = doc.subBills.map((sb: any) => {
			let itemIds = sb.itemIds.filter((id: string) => id !== itemId);
			if (sb.id === subBillId) itemIds.push(itemId);
			return { ...sb, itemIds };
		});

		for (const sb of updatedSubBills) {
			const items = doc.items.filter((i: any) => sb.itemIds.includes(i.id) && i.status !== 'cancelled' && i.tag !== 'FREE');
			sb.subtotal = items.reduce((s: number, i: any) => s + i.unitPrice * i.quantity, 0);

			const subtotalRatio = doc.subtotal > 0 ? sb.subtotal / doc.subtotal : 0;
			const proportionalDiscount = Math.round(doc.discountAmount * subtotalRatio);
			const net = Math.max(0, sb.subtotal - proportionalDiscount);
			const vat = doc.discountType !== 'none' && doc.discountType !== 'promo' && doc.discountType !== 'comp' && doc.discountType !== 'service_recovery'
				? 0
				: Math.round(net - net / 1.12);

			sb.discountAmount = proportionalDiscount;
			sb.vatAmount = vat;
			sb.total = net;
		}

		doc.subBills = updatedSubBills;
		doc.updatedAt = new Date().toISOString();
		return doc;
	});
}

export async function paySubBill(orderId: string, subBillId: string, method: PaymentMethod, amount: number) {
	const order = orders.value.find(o => o.id === orderId);
	const db = await getDb();
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (!orderDoc) return;

	let tableId: string | null = null;
	let allPaid = false;
	let guestLabel = '';
	let totalPaid = 0;

	await orderDoc.incrementalModify((doc: any) => {
		if (!doc.subBills) return doc;

		tableId = doc.tableId ?? null;
		const updatedSubBills = doc.subBills.map((sb: any) =>
			sb.id === subBillId ? { ...sb, payment: { method, amount }, paidAt: new Date().toISOString() } : sb
		);
		allPaid = updatedSubBills.every((s: any) => s.payment !== null);
		const paidBill = updatedSubBills.find((s: any) => s.id === subBillId);
		guestLabel = paidBill?.label ?? 'Guest';
		totalPaid = updatedSubBills.filter((s: any) => s.payment).reduce((sum: number, s: any) => sum + s.payment.amount, 0);

		doc.subBills = updatedSubBills;
		if (allPaid) {
			doc.payments = [...doc.payments, ...updatedSubBills.map((s: any) => s.payment)];
			doc.status = 'paid';
			doc.closedAt = new Date().toISOString();
			doc.closedBy = session.userName || 'Staff';
		}
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	const tableLabel = tableId
		? (tables.value.find(t => t.id === tableId)?.label ?? tableId)
		: `Takeout (${order?.customerName ?? 'Walk-in'})`;
	const methodLabel = method === 'gcash' ? 'GCash' : method === 'maya' ? 'Maya' : method === 'card' ? 'Card' : 'Cash';
	log.subBillPaid(guestLabel, tableLabel, amount, methodLabel);

	if (allPaid && tableId) {
		const capturedElapsed = tables.value.find(t => t.id === tableId)?.elapsedSeconds ?? undefined;
		await closeTable(tableId);
		log.tableClosed(tableLabel, totalPaid, 'Split', capturedElapsed);
	}
}

export async function cancelSplit(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.subBills?.some(sb => sb.payment !== null)) return;

	const db = await getDb();
	const orderDoc = await db.orders.findOne(orderId).exec();
	if (!orderDoc) {
		console.warn(`[cancelSplit] Order ${orderId} not found`);
		return;
	}

	await orderDoc.incrementalPatch({
		splitType: '',
		subBills: [],
		updatedAt: new Date().toISOString()
	});

	const label = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.label ?? '')
		: `Takeout (${order.customerName ?? 'Walk-in'})`;
	log.splitCancelled(label);
}
