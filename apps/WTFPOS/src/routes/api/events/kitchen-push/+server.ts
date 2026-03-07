/**
 * Receives an order snapshot from the branch browser and broadcasts it
 * to all SSE clients connected to /api/sse/kitchen-orders on this server.
 *
 * Body: { locationId: string; locationName: string; orders: Order[] }
 */
import type { RequestHandler } from './$types';
import { broadcastSnapshot } from '$lib/server/kitchen-sse';

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = await request.json();
		broadcastSnapshot(body);
		return new Response(null, { status: 204 });
	} catch {
		return new Response(null, { status: 400 });
	}
};
