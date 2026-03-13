/**
 * Kitchen Push — browser-side store that watches local RxDB orders and
 * pushes snapshots to this server's POST /api/events/kitchen-push endpoint.
 *
 * Only active when session.locationId is a specific branch (not 'all').
 * The server broadcasts snapshots to any connected SSE clients (including
 * the aggregate proxy on the owner's device).
 *
 * Smart debounce: critical changes (new/removed orders, status changes,
 * KDS bumps/refuses) push immediately. Non-critical changes (item edits,
 * notes, quantity tweaks) are debounced at 3s.
 *
 * Call startKitchenPush() inside a Svelte $effect and return its cleanup fn.
 */
import { browser } from '$app/environment';
import { getDb } from '$lib/db';
import { needsRxDb } from '$lib/stores/data-mode.svelte';
import { session, LOCATIONS } from '$lib/stores/session.svelte';
import type { Order } from '$lib/types';

const DEBOUNCE_MS = 3_000;

interface OrderFingerprint {
	count: number;
	statuses: string;
	kdsSignature: string;
}

function fingerprint(orders: Order[]): OrderFingerprint {
	const active = orders.filter(
		(o) => o.status === 'open' || o.status === 'pending_payment'
	);
	return {
		count: active.length,
		statuses: active.map((o) => `${o.id}:${o.status}`).sort().join(','),
		kdsSignature: active
			.flatMap((o) => (o.items ?? []).map((i: any) => `${i.id}:${i.bumpedAt ?? ''}:${i.refusedAt ?? ''}`))
			.sort()
			.join(',')
	};
}

function isCriticalChange(prev: OrderFingerprint | null, next: OrderFingerprint): boolean {
	if (!prev) return true; // first snapshot is always critical
	if (prev.count !== next.count) return true; // order added or removed
	if (prev.statuses !== next.statuses) return true; // status changed
	if (prev.kdsSignature !== next.kdsSignature) return true; // KDS bump or refuse
	return false;
}

export function startKitchenPush(): () => void {
	// Only run on POS devices (RxDB mode) for a specific branch
	if (!browser || !needsRxDb() || session.locationId === 'all' || session.locationId === 'wh-tag') {
		return () => {};
	}

	const locationId = session.locationId;
	const locationName = LOCATIONS.find((l) => l.id === locationId)?.name ?? locationId;

	let timer: ReturnType<typeof setTimeout> | null = null;
	let sub: { unsubscribe(): void } | null = null;
	let lastFingerprint: OrderFingerprint | null = null;

	function push(orders: Order[]) {
		const active = orders.filter(
			(o) => o.status === 'open' || o.status === 'pending_payment'
		);
		fetch('/api/events/kitchen-push', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ locationId, locationName, orders: active })
		}).catch(() => {}); // best-effort — silent failure is acceptable
	}

	getDb()
		.then((db) => {
			const query = db.orders.find().where('locationId').eq(locationId);
			sub = query.$.subscribe((docs: any[]) => {
				const orders = docs.map((d: any) => d.toJSON() as Order);
				const next = fingerprint(orders);
				const critical = isCriticalChange(lastFingerprint, next);
				lastFingerprint = next;

				if (timer) clearTimeout(timer);

				if (critical) {
					// Push immediately for critical changes
					push(orders);
				} else {
					// Debounce non-critical changes
					timer = setTimeout(() => push(orders), DEBOUNCE_MS);
				}
			});
		})
		.catch(() => {});

	return () => {
		if (timer) clearTimeout(timer);
		sub?.unsubscribe();
	};
}
