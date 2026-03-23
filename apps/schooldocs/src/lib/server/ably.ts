/**
 * Server-side Ably helpers for schooldocs.
 *
 * Channels:
 *   orders          — broadcast order status changes to all connected admins/staff
 *   orders:{id}     — per-order updates for detail views
 *   notifications   — new order alerts for admin dashboard
 *
 * Architecture note:
 *   Neon is the master — all writes go to Neon first.
 *   After a successful write, call publishOrderEvent() to broadcast the change via Ably.
 *   Connected clients update their local RxDB cache from the Ably event.
 */

import Ably from 'ably';
import { env } from './env';

let _rest: Ably.Rest | null = null;

function getAblyRest(): Ably.Rest {
	if (!_rest) {
		_rest = new Ably.Rest({ key: env.ABLY_API_KEY });
	}
	return _rest;
}

export type OrderEvent =
	| { type: 'order.created'; order: Record<string, unknown> }
	| { type: 'order.updated'; orderId: string; changes: Record<string, unknown> }
	| { type: 'order.status_changed'; orderId: string; status: string; changedBy: string }
	| { type: 'order.assigned'; orderId: string; assignedTo: string }
	| { type: 'order.flagged'; orderId: string; flags: Record<string, unknown> };

/**
 * Publish an order event to the orders channel.
 * All connected admin/staff clients will receive this and update their local RxDB cache.
 */
export async function publishOrderEvent(event: OrderEvent): Promise<void> {
	try {
		const rest = getAblyRest();
		const channel = rest.channels.get('orders');
		await channel.publish(event.type, event);
	} catch (err) {
		// Non-fatal — Neon already has the data. Clients will reconcile on next load.
		console.error('[Ably] Failed to publish order event:', err);
	}
}

/**
 * Generate a short-lived Ably token request for a client.
 * Called from /api/ably-token — clients exchange this for a real token.
 */
export async function createAblyTokenRequest(userId: string, role: string): Promise<unknown> {
	const rest = getAblyRest();

	// Define channel permissions based on role
	const capability: Record<string, string[]> = {
		'orders': ['subscribe'],
		'notifications': ['subscribe']
	};

	// Admin/staff can also publish (for optimistic updates)
	if (['admin', 'staff', 'super_admin', 'registrar'].includes(role)) {
		capability['orders'] = ['subscribe', 'publish'];
		capability['notifications'] = ['subscribe', 'publish'];
	}

	return new Promise((resolve, reject) => {
		rest.auth.createTokenRequest(
			{
				clientId: userId,
				capability: JSON.stringify(capability),
				ttl: 3600000 // 1 hour
			},
			(err, tokenRequest) => {
				if (err) reject(err);
				else resolve(tokenRequest);
			}
		);
	});
}
