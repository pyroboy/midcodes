import type { Handle } from '@sveltejs/kit';
import { trackClient, displayIP, isLoopbackIP, logDeviceRoutes } from '$lib/server/client-tracker';
import { log } from '$lib/server/logger';

/** Routes that are API/internal — don't log these as page navigations */
const SILENT_PREFIXES = ['/api/', '/_app/', '/@', '/favicon', '/__data', '/node_modules', '/src/'];

export const handle: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;

	// Skip API, static assets, and internal SvelteKit/Vite routes
	if (SILENT_PREFIXES.some(p => path.startsWith(p))) {
		return resolve(event);
	}

	// Only log page navigations (not CSS, JS, images)
	const accept = event.request.headers.get('accept') || '';
	if (!accept.includes('text/html')) {
		return resolve(event);
	}

	const rawIp = event.getClientAddress();
	const dip = displayIP(rawIp);
	const isServer = isLoopbackIP(rawIp);
	const ua = event.request.headers.get('user-agent') || '';
	const client = trackClient(rawIp, ua, path, path);

	const label = isServer
		? '💻 Server'
		: `📱 ${client.deviceHint}` + (client.deviceName || client.userName ? ` "${client.deviceName || client.userName}"` : ` (${dip})`);

	log.debug('Route', `${label} → ${path}`);

	// Log device→route map on every navigation so you can see who's where
	logDeviceRoutes();

	return resolve(event);
};
