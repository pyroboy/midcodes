import type { RequestHandler } from './$types';
import { trackClient, logDeviceRoutes } from '$lib/server/client-tracker';

/**
 * Lightweight route reporter — called by the client on every SvelteKit
 * navigation so the server's device route map stays current.
 * Uses sendBeacon on the client side (fire-and-forget, no response needed).
 */
export const POST: RequestHandler = async ({ request, getClientAddress }) => {
	try {
		const { route } = await request.json();
		if (typeof route !== 'string') {
			return new Response(null, { status: 400 });
		}

		const ip = getClientAddress();
		const ua = request.headers.get('user-agent') || '';
		trackClient(ip, ua, route, route);
		logDeviceRoutes();
	} catch {
		// fire-and-forget — don't fail loudly
	}

	return new Response(null, { status: 204 });
};
