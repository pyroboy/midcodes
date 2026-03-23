/**
 * Ably client for schooldocs.
 *
 * Initializes the Ably Realtime client using a server-issued token request
 * (never expose the API key to the browser).
 *
 * Usage in a Svelte component or store:
 *   import { subscribeToOrders } from '$lib/ably';
 *   const unsubscribe = await subscribeToOrders((event) => { ... });
 *
 * The server publishes events after every Neon write.
 * Clients patch their local RxDB cache in the handler so the UI stays live.
 */

import Ably from 'ably';
import { browser } from '$app/environment';
import { upsertRxDoc } from '$lib/db';

let _client: Ably.Realtime | null = null;

async function getAblyClient(): Promise<Ably.Realtime> {
	if (_client) return _client;

	_client = new Ably.Realtime({
		authUrl: '/api/ably-token',
		authMethod: 'POST'
	});

	return new Promise((resolve, reject) => {
		_client!.connection.once('connected', () => resolve(_client!));
		_client!.connection.once('failed', (err) => reject(err));
	});
}

export type OrderChannelMessage = {
	type: string;
	order?: Record<string, unknown>;
	orderId?: string;
	changes?: Record<string, unknown>;
	status?: string;
	changedBy?: string;
};

/**
 * Subscribe to order events on the shared 'orders' channel.
 * Automatically patches the local RxDB orders collection on each event.
 *
 * Returns an unsubscribe function — call it on component destroy.
 */
export async function subscribeToOrders(
	onEvent?: (msg: OrderChannelMessage) => void
): Promise<() => void> {
	if (!browser) return () => {};

	const client = await getAblyClient();
	const channel = client.channels.get('orders');

	const handler = async (message: Ably.Message) => {
		const data = message.data as OrderChannelMessage;

		// Sync Ably events into local RxDB cache
		if (data.type === 'order.created' && data.order) {
			await upsertRxDoc('orders', data.order);
		} else if (data.type === 'order.updated' && data.orderId && data.changes) {
			// Partial update: fetch existing doc and merge
			const { getDb } = await import('$lib/db');
			const db = await getDb();
			const existing = await db.orders.findOne(data.orderId).exec();
			if (existing) {
				await existing.patch(data.changes);
			}
		} else if (data.type === 'order.status_changed' && data.orderId && data.status) {
			const { getDb } = await import('$lib/db');
			const db = await getDb();
			const existing = await db.orders.findOne(data.orderId).exec();
			if (existing) {
				await existing.patch({ status: data.status, updated_at: new Date().toISOString() });
			}
		}

		onEvent?.(data);
	};

	await channel.subscribe(handler);

	return () => {
		channel.unsubscribe(handler);
	};
}

/**
 * Subscribe to notifications (new order alerts for admin dashboard).
 */
export async function subscribeToNotifications(
	onEvent: (msg: Record<string, unknown>) => void
): Promise<() => void> {
	if (!browser) return () => {};

	const client = await getAblyClient();
	const channel = client.channels.get('notifications');

	const handler = (message: Ably.Message) => {
		onEvent(message.data);
	};

	await channel.subscribe(handler);

	return () => {
		channel.unsubscribe(handler);
	};
}

/**
 * Close the Ably connection (call on app teardown if needed).
 */
export function closeAbly(): void {
	_client?.close();
	_client = null;
}
