/**
 * Audit Log Store — RxDB-backed persistent log.
 * Central log for every meaningful action across the app.
 */
import { nanoid } from 'nanoid';
import { createStore } from '$lib/stores/create-store.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { browser } from '$app/environment';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActionType = 'order' | 'payment' | 'stock' | 'auth' | 'admin' | 'expense';

export interface LogEntry {
	id: string;
	timestamp: string;          // e.g. "3:45 PM"
	isoTimestamp: string;       // for sorting
	user: string;
	role: string;
	action: ActionType;
	description: string;
	branch: string;
	meta?: string;  // JSON stringified metadata
}

// ─── Reactive State (RxDB Store) ──────────────────────────────────────────────

const _auditLog = createStore<LogEntry>('audit_logs', db =>
	db.audit_logs.find({ sort: [{ isoTimestamp: 'desc' }] }),
	{ sort: (a, b) => b.isoTimestamp.localeCompare(a.isoTimestamp) }
);

export const auditLog = {
	get value() { return _auditLog.value; },
	get initialized() { return _auditLog.initialized; }
};

import { session } from '$lib/stores/session.svelte';
import { formatAuditDuration } from '$lib/stores/audit.utils';

// ─── Action: Log ─────────────────────────────────────────────────────────────

export function writeLog(
	action: ActionType,
	description: string,
	opts: { user?: string; role?: string; branch?: string; meta?: Record<string, string | number> } = {}
) {
	if (!browser) return;

	const now = new Date();
	const entry: LogEntry = {
		id: nanoid(),
		isoTimestamp: now.toISOString(),
		timestamp: now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
		user:   opts.user   ?? (session.userName || 'Staff'),
		role:   opts.role   ?? session.role,
		branch: opts.branch ?? (session.locationId === 'tag' ? 'TAG' : session.locationId === 'pgl' ? 'PGL' : session.locationId === 'wh-tag' ? 'WH-TAG' : session.locationId.toUpperCase()),
		action,
		description,
		...(opts.meta && { meta: JSON.stringify(opts.meta) }),
	};

	// Fire-and-forget insert via write proxy
	const col = getWritableCollection('audit_logs');
	col.insert({ ...entry, updatedAt: now.toISOString() }).catch((err: any) => {
		console.error('[AUDIT] Failed to write log entry:', err);
	});
}

// ─── Convenience Wrappers ─────────────────────────────────────────────────────

export const log = {
	/** POS: table opened */
	tableOpened: (tableLabel: string, packageName: string | null, pax: number) =>
		writeLog('order', `Opened ${tableLabel}${packageName ? ` — ${packageName}` : ''} · ${pax} pax`),

	/** POS: item charged / added to table */
	itemCharged: (itemName: string, tableLabel: string, weight?: number | null, qty?: number) => {
		const qty_str = weight ? `${weight}g` : `${qty ?? 1}×`;
		writeLog('order', `Charged ${qty_str} ${itemName} → ${tableLabel}`);
	},

	/** POS: discount applied to order */
	discountApplied: (tableLabel: string, discountType: string, amount: number) =>
		writeLog('payment', `Discount applied on ${tableLabel} — ${discountType} (−₱${amount.toFixed(2)})` ),

	/** POS: discount removed */
	discountRemoved: (tableLabel: string) =>
		writeLog('payment', `Discount removed on ${tableLabel}`),

	/** POS: order checked out / table closed */
	tableClosed: (tableLabel: string, total: number, method?: string, durationSeconds?: number) =>
		writeLog('payment', `Checkout ${tableLabel} — ₱${total.toFixed(2)}${method ? ` (${method})` : ''}${formatAuditDuration(durationSeconds)}`),

	/** POS: table voided with no chargeable items (walkout before ordering) */
	zeroValueCancellation: (tableLabel: string, reason?: string, durationSeconds?: number) =>
		writeLog('payment', `Zero-value cancellation: ${tableLabel}${reason ? ` — ${reason}` : ''}${formatAuditDuration(durationSeconds, true)}`),

	/** POS: order voided with value */
	orderVoided: (tableLabel: string, total: number, reason?: string, durationSeconds?: number) =>
		writeLog('payment', `VOIDED: ${tableLabel} — ₱${total.toFixed(2)}${reason ? ` (${reason})` : ''}${formatAuditDuration(durationSeconds, true)}`),

	/** POS: single item voided with manager PIN + reason */
	itemVoided: (itemName: string, tableLabel: string, reason: string) =>
		writeLog('order', `VOIDED ITEM: ${itemName} on ${tableLabel} — ${reason}`, {
			meta: { reason },
		}),

	/** Stock: transfer logged */
	stockTransferred: (itemName: string, qty: number, unit: string, fromBranch: string, toBranch: string) =>
		writeLog('stock', `Transfer: ${qty}${unit} ${itemName} — ${fromBranch.toUpperCase()} → ${toBranch.toUpperCase()}`),

	/** Stock: item restored from void/cancel */
	stockRestored: (itemName: string, qty: number, unit: string, orderId: string) =>
		writeLog('stock', `Restored ${qty}${unit} ${itemName} (void order ${orderId})`),

	/** KDS: item marked as served */
	itemServed: (itemName: string, tableNumber: number | null) =>
		writeLog('order', `Served: ${itemName} → ${tableNumber !== null ? `T${tableNumber}` : 'Takeout'}`),

	/** EOD: report submitted */
	eodSubmitted: () =>
		writeLog('admin', 'EOD report submitted and locked'),

	/** Stock: delivery received */
	deliveryReceived: (itemName: string, qty: number, unit: string, supplier: string) =>
		writeLog('stock', `Received ${qty.toLocaleString()}${unit} ${itemName} — ${supplier}`),

	/** Stock: waste logged */
	wasteLogged: (itemName: string, qty: number, unit: string, reason: string) =>
		writeLog('stock', `Waste: ${qty}${unit} ${itemName} — ${reason}`),

	/** Stock: count submitted */
	countSubmitted: (period: string) =>
		writeLog('stock', `Stock count submitted — ${period} session`),

	/** Admin: user created */
	userCreated: (displayName: string, role: string, branch: string) =>
		writeLog('admin', `User created: ${displayName} (${role}) — ${branch}`),

	/** Admin: user status toggled */
	userStatusChanged: (displayName: string, newStatus: string) =>
		writeLog('admin', `User ${newStatus}: ${displayName}`),

	/** Expense recorded */
	expenseLogged: (category: string, amount: number, description: string) =>
		writeLog('expense', `Expense: ${category} — ₱${amount.toFixed(2)} (${description})`),

	// ─── Menu Editor ─────────────────────────────────────────────────────────

	menuItemCreated: (name: string, category: string) =>
		writeLog('admin', `Menu item created: ${name} (${category})`),

	menuItemUpdated: (name: string, fields: string) =>
		writeLog('admin', `Menu item updated: ${name} — ${fields}`),

	menuItemDeleted: (name: string) =>
		writeLog('admin', `Menu item deleted: ${name}`),

	menuItemToggled: (name: string, available: boolean) =>
		writeLog('admin', `Menu item ${available ? 'enabled' : "86'd"}: ${name}`),

	// ─── Takeout Lifecycle ───────────────────────────────────────────────────

	takeoutAdvanced: (customerName: string, newStatus: string) =>
		writeLog('order', `Takeout (${customerName}) → ${newStatus}`),

	// ─── Table Transfer ──────────────────────────────────────────────────────

	tableTransferred: (fromLabel: string, toLabel: string) =>
		writeLog('order', `Table transferred: ${fromLabel} → ${toLabel}`),

	// ─── Package Change ──────────────────────────────────────────────────────

	packageChanged: (tableLabel: string, oldPkg: string, newPkg: string, direction: string, diff: number) =>
		writeLog('order', `Package ${direction}: ${tableLabel} — ${oldPkg} → ${newPkg} (${direction === 'upgrade' ? '+' : '-'}₱${diff.toFixed(2)})`),

	// ─── Split Bill ──────────────────────────────────────────────────────────

	splitInitiated: (tableLabel: string, splitType: string, count: number) =>
		writeLog('order', `Bill split initiated: ${tableLabel} — ${splitType} (${count} ways)`),

	subBillPaid: (guestLabel: string, tableLabel: string, amount: number, method: string) =>
		writeLog('payment', `Split payment: ${guestLabel} on ${tableLabel} — ₱${amount.toFixed(2)} (${method})`),

	splitCancelled: (tableLabel: string) =>
		writeLog('order', `Bill split cancelled: ${tableLabel}`),

	// ─── Hardware ────────────────────────────────────────────────────────────

	cashDrawerOpened: (reason: string, requestedBy: string) =>
		writeLog('admin', `Cash drawer opened manually (${reason}) — by ${requestedBy}`),

	// ─── Manager PIN ─────────────────────────────────────────────────────

	managerPinVerified: (action: string) =>
		writeLog('admin', `Manager PIN verified for: ${action}`),

	// ─── Pending Payment ─────────────────────────────────────────────────

	paymentHeld: (tableLabel: string) =>
		writeLog('payment', `Payment held — awaiting confirmation: ${tableLabel}`),

	paymentConfirmed: (tableLabel: string, total: number, method: string) =>
		writeLog('payment', `Held payment confirmed: ${tableLabel} — ₱${total.toFixed(2)} (${method})`),

	paymentCancelled: (tableLabel: string) =>
		writeLog('payment', `Payment hold cancelled: ${tableLabel}`),

	// ─── Table Maintenance ───────────────────────────────────────────────

	tableMaintenanceToggled: (tableLabel: string, isMaintenance: boolean) =>
		writeLog('admin', `Table ${tableLabel} ${isMaintenance ? 'set to maintenance (out of order)' : 'returned to service'}`),

	// ─── X-Read ──────────────────────────────────────────────────────────

	xReadGenerated: () =>
		writeLog('admin', 'X-Read mid-shift report generated'),

	// ─── KDS Recall ──────────────────────────────────────────────────────

	kdsTicketRecalled: (tableNumber: number | null) =>
		writeLog('order', `KDS ticket recalled for ${tableNumber !== null ? `T${tableNumber}` : 'Takeout'}`),

	// ─── Pax Change ──────────────────────────────────────────────────────

	paxChanged: (tableLabel: string, oldPax: number, newPax: number) =>
		writeLog('order', `Pax changed on ${tableLabel}: ${oldPax} → ${newPax}`),

	// ─── Leftover Penalty ────────────────────────────────────────────────

	leftoverPenaltyApplied: (tableLabel: string, weightGrams: number, penalty: number) =>
		writeLog('order', `Leftover penalty: ${tableLabel} — ${weightGrams}g → ₱${penalty.toFixed(2)}`),

	leftoverPenaltyWaived: (tableLabel: string) =>
		writeLog('order', `Leftover penalty waived: ${tableLabel}`),

	// ─── Kitchen Refusal ─────────────────────────────────────────────────

	kitchenRefusal: (itemName: string, tableNumber: number | null, reason: string) =>
		writeLog('order', `Kitchen refused: ${itemName} for ${tableNumber !== null ? `T${tableNumber}` : 'Takeout'} — ${reason}`),

	// ─── Yield Tracking ──────────────────────────────────────────────────

	yieldRecorded: (itemName: string, rawWeight: number, cleanedWeight: number, yieldPct: number) =>
		writeLog('stock', `Yield: ${itemName} — ${rawWeight}g raw → ${cleanedWeight}g cleaned (${yieldPct.toFixed(1)}%)`),

	// ─── Station Responsibility Matrix ─────────────────────────────────────

	meatLabelPrinted: (meatName: string, tableNumber: number | null, weightGrams: number) =>
		writeLog('order', `Label printed: ${weightGrams}g ${meatName} → ${tableNumber !== null ? `T${tableNumber}` : 'Takeout'}`),

	dispatchOrderCleared: (tableNumber: number | null) =>
		writeLog('order', `Order cleared by dispatch: ${tableNumber !== null ? `T${tableNumber}` : 'Takeout'}`),
};
