import type { Handle } from '@sveltejs/kit';
import { auth } from '$lib/server/auth';

export const handle: Handle = async ({ event, resolve }) => {
	// Let Better Auth handle its own routes
	if (event.url.pathname.startsWith('/api/auth')) {
		return auth.handler(event.request);
	}

	// Get session for all other routes
	const session = await auth.api.getSession({ headers: event.request.headers });

	if (session?.user) {
		event.locals.user = {
			id: session.user.id,
			name: session.user.name,
			email: session.user.email,
			role: (session.user as any).role ?? 'owner',
			businessId: (session.user as any).businessId ?? null
		};
	} else {
		event.locals.user = null;
	}

	return resolve(event);
};
