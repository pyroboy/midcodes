/**
 * POS Payments — Payment hold/confirm, cash/digital checkout, and split bill.
 */
import type { PaymentMethod, SubBill } from '$lib/types';
import { nanoid } from 'nanoid';
import { log, writeLog } from '$lib/stores/audit.svelte';
import { session } from '$lib/stores/session.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { closeTable, tables } from '$lib/stores/pos/tables.svelte';
import { orders } from '$lib/stores/pos/orders.svelte';
import { bumpTicketsForOrder } from '$lib/stores/pos/kds.svelte';
import { getOrderLabel } from '$lib/stores/pos/label.utils';
import { calculateEqualSplit, formatPaymentMethod } from '$lib/stores/pos/payment.utils';

// ─── Direct Checkout (cash / GCash / Maya) ───────────────────────────────────

/**
 * Finalise a dine-in or takeout order: record payment(s), mark as paid, and free
 * the table. Accepts multiple payment entries for split-tender transactions.
 */
export async function checkoutOrder(
	orderId: string,
	payments: { method: string; amount: number }[],
	tableId: string | null,
) {
	const col = getWritableCollection('orders');

	const capturedElapsed = tableId
		? (tables.value.find(t => t.id === tableId)?.elapsedSeconds ?? null)
		: null;

	await col.incrementalModify(orderId, (doc: any) => {
		doc.payments = payments;
		doc.status = 'paid';
		doc.closedAt = new Date().toISOString();
		doc.closedBy = session.userName || 'Staff';
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	if (tableId) await closeTable(tableId);
	await bumpTicketsForOrder(orderId);

	const order = orders.value.find(o => o.id === orderId);
	const methodLabel = payments.length === 1
		? formatPaymentMethod(payments[0].method)
		: 'Split';
	const label = getOrderLabel(order, tableId);

	log.tableClosed(label, order?.total ?? 0, methodLabel, capturedElapsed ?? undefined);
}

// ─── Pending Payment Hold ────────────────────────────────────────────────────

export async function holdPayment(orderId: string, method: 'gcash' | 'maya') {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'open') return;

	const col = getWritableCollection('orders');
	await col.incrementalPatch(orderId, {
		status: 'pending_payment',
		pendingPaymentMethod: method,
	});

	const label = getOrderLabel(order);
	log.paymentHeld(label);
}

export async function confirmHeldPayment(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'pending_payment') return;

	const col = getWritableCollection('orders');
	const method = order.pendingPaymentMethod ?? 'gcash';
	const label = getOrderLabel(order);

	const capturedElapsed = order.tableId
		? (tables.value.find(t => t.id === order.tableId)?.elapsedSeconds ?? null)
		: null;

	await col.incrementalModify(orderId, (doc: any) => {
		doc.payments = [...doc.payments, { method, amount: doc.total }];
		doc.status = 'paid';
		doc.closedAt = new Date().toISOString();
		doc.closedBy = session.userName || 'Staff';
		doc.updatedAt = new Date().toISOString();
		return doc;
	});

	if (order.tableId) await closeTable(order.tableId);
	await bumpTicketsForOrder(orderId);

	const methodLabel = formatPaymentMethod(method);
	log.paymentConfirmed(label, order.total, methodLabel);
	log.tableClosed(label, order.total, methodLabel, capturedElapsed ?? undefined);
}

export async function cancelHeldPayment(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.status !== 'pending_payment') return;

	const col = getWritableCollection('orders');
	await col.incrementalPatch(orderId, {
		status: 'open',
		pendingPaymentMethod: '',
	});

	const label = getOrderLabel(order);
	log.paymentCancelled(label);
}

// ─── Split Bill ──────────────────────────────────────────────────────────────

export async function initEqualSplit(orderId: string, splitCount: number) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || splitCount <= 0) return;

	const col = getWritableCollection('orders');

	await col.incrementalModify(orderId, (doc: any) => {
		if (doc.total <= 0) return doc;

		const amounts = calculateEqualSplit(doc.total, splitCount);
		const subBills = amounts.map((amount: number, i: number) => ({
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

	const label = getOrderLabel(order);
	log.splitInitiated(label, 'equal', splitCount);
}

export async function initItemSplit(orderId: string, splitCount: number) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order) return;

	const col = getWritableCollection('orders');
	const subBills = Array.from({ length: splitCount }, (_, i) => ({
		id: nanoid(),
		label: `Guest ${i + 1}`,
		itemIds: [],
		subtotal: 0, discountAmount: 0, vatAmount: 0, total: 0,
		payment: null, paidAt: null
	}));

	await col.incrementalPatch(orderId, { splitType: 'by-item', subBills });

	const label = getOrderLabel(order);
	log.splitInitiated(label, 'by-item', splitCount);
}

export async function assignItemToSubBill(orderId: string, itemId: string, subBillId: string) {
	const col = getWritableCollection('orders');

	await col.incrementalModify(orderId, (doc: any) => {
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
	const col = getWritableCollection('orders');

	let tableId: string | null = null;
	let allPaid = false;
	let guestLabel = '';
	let totalPaid = 0;

	await col.incrementalModify(orderId, (doc: any) => {
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

	const tableLabel = getOrderLabel(order, tableId);
	log.subBillPaid(guestLabel, tableLabel, amount, formatPaymentMethod(method));

	if (allPaid && tableId) {
		const capturedElapsed = tables.value.find(t => t.id === tableId)?.elapsedSeconds ?? undefined;
		await closeTable(tableId);
		await bumpTicketsForOrder(orderId);
		log.tableClosed(tableLabel, totalPaid, 'Split', capturedElapsed);
	}
}

export async function cancelSplit(orderId: string) {
	const order = orders.value.find(o => o.id === orderId);
	if (!order || order.subBills?.some(sb => sb.payment !== null)) return;

	const col = getWritableCollection('orders');
	await col.incrementalPatch(orderId, {
		splitType: '',
		subBills: [],
	});

	const label = getOrderLabel(order);
	log.splitCancelled(label);
}

// ─── Payment Method Correction (Manager PIN required) ────────────────────────

/**
 * Corrects the payment method on a closed (paid) order.
 * Replaces all payments with a single entry for the new method.
 * Must be PIN-gated in the UI before calling.
 */
export async function correctPaymentMethod(orderId: string, newMethod: PaymentMethod): Promise<void> {
	const order = orders.value.find(o => o.id === orderId && o.status === 'paid');
	if (!order) return;

	const col = getWritableCollection('orders');

	const prevMethods = order.payments.map(p => p.method).join(', ') || 'unknown';
	const correctedPayment = { id: nanoid(), method: newMethod, amount: order.total };

	await col.incrementalPatch(orderId, {
		payments: [correctedPayment],
	});

	const label = getOrderLabel(order);
	writeLog('payment', `Payment corrected on ${label}: ${prevMethods} → ${newMethod}`);
}
