/**
 * Shared KDS (Kitchen Display System) utilities.
 * Used by dispatch, stove, orders, sides-prep, and weigh-station pages.
 */
import type { KdsTicket, KdsTicketItem } from '$lib/types';
import { formatCountdown } from '$lib/utils';

// ─── Urgency ─────────────────────────────────────────────────────────────────

export const WARN_MS = 5 * 60_000;
export const CRIT_MS = 10 * 60_000;

export type UrgencyLevel = 'critical' | 'warning' | 'normal';

export function urgencyLevel(createdAt: string, now: number): UrgencyLevel {
	const ms = now - new Date(createdAt).getTime();
	if (ms > CRIT_MS) return 'critical';
	if (ms > WARN_MS) return 'warning';
	return 'normal';
}

export function timerBadgeClass(level: UrgencyLevel): string {
	if (level === 'critical') return 'bg-status-red text-white';
	if (level === 'warning') return 'bg-status-yellow text-gray-900';
	return 'bg-gray-100 text-gray-600';
}

export function ticketBorderClass(level: UrgencyLevel): string {
	if (level === 'critical') return 'border-status-red animate-border-pulse-red';
	if (level === 'warning') return 'border-status-yellow';
	return 'border-border';
}

export function timerText(createdAt: string, now: number): string {
	return formatCountdown(Math.floor((now - new Date(createdAt).getTime()) / 1000));
}

// ─── Ticket Merging ──────────────────────────────────────────────────────────

export interface MergedTicket {
	orderId: string;
	tableNumber: number | null;
	customerName?: string;
	createdAt: string;
	items: KdsTicketItem[];
}

/**
 * Merge multiple KDS tickets sharing the same orderId into one per order.
 * Keeps the earliest createdAt and concatenates items.
 */
export function mergeTicketsByOrder(tickets: KdsTicket[]): MergedTicket[] {
	const byOrder = new Map<string, MergedTicket>();
	for (const t of tickets) {
		const existing = byOrder.get(t.orderId);
		if (existing) {
			existing.items = [...existing.items, ...t.items];
			if (t.createdAt < existing.createdAt) existing.createdAt = t.createdAt;
		} else {
			byOrder.set(t.orderId, {
				orderId: t.orderId,
				tableNumber: t.tableNumber,
				customerName: t.customerName,
				createdAt: t.createdAt,
				items: [...t.items]
			});
		}
	}
	return Array.from(byOrder.values());
}

// ─── Progress ────────────────────────────────────────────────────────────────

export function ticketProgress(items: KdsTicketItem[]): { served: number; total: number; pct: number } {
	const total = items.length;
	const served = items.filter((i) => i.status === 'served').length;
	const pct = total > 0 ? (served / total) * 100 : 0;
	return { served, total, pct };
}
