import type { Handle } from '@sveltejs/kit';

/**
 * Better Auth session handler.
 * Populates event.locals.session and event.locals.user on every request.
 * Skips auth when credentials aren't configured (prototype/demo mode).
 */
export const handle: Handle = async ({ event, resolve }) => {
	try {
		const { auth } = await import('$lib/server/auth');
		const session = await auth.api.getSession({
			headers: event.request.headers
		});

		event.locals.session = session?.session ?? null;
		event.locals.user = session?.user ?? null;
	} catch {
		// No DB credentials — run in demo mode without auth
		event.locals.session = null;
		event.locals.user = null;
	}

	return resolve(event);
};
