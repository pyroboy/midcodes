/**
 * Guard Event Store — tracks write guard activations for debugging.
 *
 * Guards prevent multi-device race conditions (e.g. two tablets opening the same table).
 * This store makes guard events visible and auditable instead of silent console.warn's.
 *
 * Three guard layers feed into this:
 * 1. Replication push guard (server-side — writes audit log, client polls via SSE)
 * 2. Write API guard (thin client HTTP writes — returns guarded:true, client logs here)
 * 3. Client pre-check (table.status !== 'available' — logged here before server call)
 */
import { browser } from '$app/environment';
import { session } from '$lib/stores/session.svelte';

// ─── Types ────────────────────────────────────────────────────────────────────

export type GuardType = 'duplicate-order' | 'duplicate-occupancy' | 'table-unavailable' | 'orphan-auto-healed' | 'table-close-with-open-order' | 'stock-negative' | 'duplicate-active-shift' | 'invalid-order-transition' | 'duplicate-z-read';
export type GuardLayer = 'replication' | 'write-api' | 'client';

export interface GuardEvent {
	id: string;
	type: GuardType;
	layer: GuardLayer;
	tableId: string;
	tableLabel: string;
	existingOrderId: string | null;
	attemptedOrderId: string | null;
	reason: string;
	timestamp: string;
	user: string;
	locationId: string;
	/** Whether the user has seen/dismissed this event */
	seen: boolean;
}

// ─── Reactive State ───────────────────────────────────────────────────────────

let _events = $state<GuardEvent[]>([]);
let _counter = 0;

/** Max events to keep in memory (FIFO) */
const MAX_EVENTS = 50;

/** How long before auto-marking as seen (ms) */
const AUTO_SEEN_MS = 60_000; // 1 minute

// ─── Public API ───────────────────────────────────────────────────────────────

export const guardEvents = {
	get value() { return _events; },
	get unseenCount() { return _events.filter(e => !e.seen).length; },
	get hasUnseen() { return _events.some(e => !e.seen); },
};

/**
 * Record a guard event — makes it visible in the UI indicator and writes to audit log.
 */
export function recordGuardEvent(opts: {
	type: GuardType;
	layer: GuardLayer;
	tableId: string;
	tableLabel?: string;
	existingOrderId?: string | null;
	attemptedOrderId?: string | null;
	reason: string;
}) {
	if (!browser) return;

	const event: GuardEvent = {
		id: `guard-${++_counter}-${Date.now()}`,
		type: opts.type,
		layer: opts.layer,
		tableId: opts.tableId,
		tableLabel: opts.tableLabel ?? opts.tableId,
		existingOrderId: opts.existingOrderId ?? null,
		attemptedOrderId: opts.attemptedOrderId ?? null,
		reason: opts.reason,
		timestamp: new Date().toISOString(),
		user: session.userName || 'Unknown',
		locationId: session.locationId || 'unknown',
		seen: false,
	};

	// Prepend (newest first), cap at MAX_EVENTS
	_events = [event, ..._events].slice(0, MAX_EVENTS);

	// Auto-mark as seen after timeout
	setTimeout(() => {
		markSeen(event.id);
	}, AUTO_SEEN_MS);

	// Write to audit log for persistence + traceability (lazy import to avoid circular deps)
	const layerLabel = opts.layer === 'replication' ? 'Sync Guard'
		: opts.layer === 'write-api' ? 'Write Guard'
		: 'Client Guard';

	const shortIds = [
		opts.existingOrderId ? `existing:${opts.existingOrderId.slice(0, 8)}…` : null,
		opts.attemptedOrderId ? `attempted:${opts.attemptedOrderId.slice(0, 8)}…` : null,
	].filter(Boolean).join(', ');

	import('$lib/stores/audit.svelte').then(({ writeLog }) => {
		writeLog('admin', `[${layerLabel}] ${opts.reason}${shortIds ? ` (${shortIds})` : ''}`, {
			meta: {
				guardType: opts.type,
				guardLayer: opts.layer,
				tableId: opts.tableId,
				...(opts.existingOrderId && { existingOrderId: opts.existingOrderId }),
				...(opts.attemptedOrderId && { attemptedOrderId: opts.attemptedOrderId }),
			},
		});
	}).catch(() => { /* audit not available yet */ });

	console.warn(
		`[Guard Event] ${layerLabel} — ${opts.reason}`,
		{ type: opts.type, layer: opts.layer, tableId: opts.tableId, existingOrderId: opts.existingOrderId, attemptedOrderId: opts.attemptedOrderId }
	);
}

export function markSeen(eventId: string) {
	_events = _events.map(e => e.id === eventId ? { ...e, seen: true } : e);
}

export function markAllSeen() {
	_events = _events.map(e => ({ ...e, seen: true }));
}

export function clearGuardEvents() {
	_events = [];
}
