/**
 * Audit Log Store — Svelte 5 Runes
 * Central log for every meaningful action across the app.
 */
import { nanoid } from 'nanoid';

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
	meta?: Record<string, string | number>;  // optional extra data
}

// ─── Reactive State ───────────────────────────────────────────────────────────

export const auditLog = $state<LogEntry[]>([
	// Seed with demo entries
	{ id: 'l-1',  isoTimestamp: ts(-5),  timestamp: fmt(-5),  user: 'Maria Santos',   role: 'staff',   action: 'order',   description: 'Added 250g Samgyupsal to T3',                 branch: 'QC' },
	{ id: 'l-2',  isoTimestamp: ts(-8),  timestamp: fmt(-8),  user: 'Juan Reyes',     role: 'manager', action: 'payment', description: 'Applied Senior Citizen discount on T2 (20%)',  branch: 'QC' },
	{ id: 'l-3',  isoTimestamp: ts(-15), timestamp: fmt(-15), user: 'Pedro Cruz',     role: 'kitchen', action: 'order',   description: 'Marked Samgyupsal (T5) as served',             branch: 'QC' },
	{ id: 'l-4',  isoTimestamp: ts(-30), timestamp: fmt(-30), user: 'Maria Santos',   role: 'staff',   action: 'stock',   description: 'Logged 150g Galbi as waste — Dropped',        branch: 'QC' },
	{ id: 'l-5',  isoTimestamp: ts(-45), timestamp: fmt(-45), user: 'Juan Reyes',     role: 'manager', action: 'payment', description: 'Closed T1 — Cash ₱4,820.00',                  branch: 'QC' },
	{ id: 'l-6',  isoTimestamp: ts(-60), timestamp: fmt(-60), user: 'Maria Santos',   role: 'staff',   action: 'order',   description: 'Opened T5 — 🔥 Unli Pork & Beef · 4 pax',     branch: 'QC' },
	{ id: 'l-7',  isoTimestamp: ts(-90), timestamp: fmt(-90), user: 'Pedro Cruz',     role: 'kitchen', action: 'stock',   description: 'Stock count submitted — Afternoon session',    branch: 'QC' },
	{ id: 'l-8',  isoTimestamp: ts(-120),timestamp: fmt(-120),user: 'Ana Reyes',      role: 'staff',   action: 'order',   description: 'Added 2× Iced Tea to T3',                     branch: 'MKTI' },
	{ id: 'l-9',  isoTimestamp: ts(-180),timestamp: fmt(-180),user: 'Pedro Cruz',     role: 'kitchen', action: 'stock',   description: 'Received 5,000g Samgyupsal — Metro Meat Co.', branch: 'QC' },
	{ id: 'l-10', isoTimestamp: ts(-240),timestamp: fmt(-240),user: 'Maria Santos',   role: 'staff',   action: 'auth',    description: 'Login — Maria Santos (staff)',                 branch: 'QC' },
]);

import { session } from '$lib/stores/session.svelte';

// ─── Action: Log ─────────────────────────────────────────────────────────────

export function writeLog(
	action: ActionType,
	description: string,
	opts: { user?: string; role?: string; branch?: string; meta?: Record<string, string | number> } = {}
) {
	const now = new Date();
	auditLog.unshift({
		id: nanoid(),
		isoTimestamp: now.toISOString(),
		timestamp: now.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
		user:   opts.user   ?? (session.userName || 'Staff'),
		role:   opts.role   ?? session.role,
		branch: opts.branch ?? (session.locationId === 'qc' ? 'QC' : session.locationId === 'mkti' ? 'MKTI' : session.locationId === 'wh-qc' ? 'WH-QC' : session.locationId.toUpperCase()),
		action,
		description,
		meta: opts.meta,
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
	tableClosed: (tableLabel: string, total: number, method?: string) =>
		writeLog('payment', `Checkout ${tableLabel} — ₱${total.toFixed(2)}${method ? ` (${method})` : ''}`),

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
	wastLogged: (itemName: string, qty: number, unit: string, reason: string) =>
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
};

// ─── Seed Helpers ─────────────────────────────────────────────────────────────

function ts(minutesAgo: number): string {
	return new Date(Date.now() + minutesAgo * 60 * 1000).toISOString();
}

function fmt(minutesAgo: number): string {
	return new Date(Date.now() + minutesAgo * 60 * 1000)
		.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
}
