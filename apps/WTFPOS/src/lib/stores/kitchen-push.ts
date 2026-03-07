/**
 * Kitchen Push — browser-side store that watches local RxDB orders and
 * pushes snapshots to this server's POST /api/events/kitchen-push endpoint.
 *
 * Only active when session.locationId is a specific branch (not 'all').
 * The server broadcasts snapshots to any connected SSE clients (including
 * the aggregate proxy on the owner's device).
 *
 * Call startKitchenPush() inside a Svelte $effect and return its cleanup fn.
 */
import { browser } from '$app/environment';
import { getDb } from '$lib/db';
import { session, LOCATIONS } from '$lib/stores/session.svelte';
import type { Order } from '$lib/types';

const DEBOUNCE_MS = 3_000;

export function startKitchenPush(): () => void {
	// Only run on a specific branch — aggregate and warehouse devices don't push
	if (!browser || session.locationId === 'all' || session.locationId === 'wh-tag') {
		return () => {};
	}

	const locationId = session.locationId;
	const locationName = LOCATIONS.find((l) => l.id === locationId)?.name ?? locationId;

	let timer: ReturnType<typeof setTimeout> | null = null;
	let sub: { unsubscribe(): void } | null = null;

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
				if (timer) clearTimeout(timer);
				timer = setTimeout(
					() => push(docs.map((d: any) => d.toJSON() as Order)),
					DEBOUNCE_MS
				);
			});
		})
		.catch(() => {});

	return () => {
		if (timer) clearTimeout(timer);
		sub?.unsubscribe();
	};
}
