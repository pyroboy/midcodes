import type { Handle } from '@sveltejs/kit';
import { hasAuthCredentials } from '$lib/server/env';

export const handle: Handle = async ({ event, resolve }) => {
	event.locals.user = null;
	event.locals.session = null;

	if (hasAuthCredentials()) {
		try {
			const { auth } = await import('$lib/server/auth');
			const sessionData = await auth.api.getSession({ headers: event.request.headers });
			event.locals.user = sessionData?.user
				? {
						id: sessionData.user.id,
						name: sessionData.user.name,
						email: sessionData.user.email,
						role: (sessionData.user as any).role
					}
				: null;
			event.locals.session = sessionData?.session
				? { id: sessionData.session.id, expiresAt: sessionData.session.expiresAt }
				: null;
		} catch {
			// Auth not available — continue without session
		}
	}

	return resolve(event);
};
