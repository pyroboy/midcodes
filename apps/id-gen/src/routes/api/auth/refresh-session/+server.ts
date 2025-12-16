import { json, type RequestHandler } from '@sveltejs/kit';
import {
	checkRateLimit,
	createRateLimitResponse,
	RateLimitConfigs
} from '$lib/utils/rate-limiter';

/**
 * Forces a session refresh to get fresh app_metadata from the database.
 * This is needed after role emulation changes since the JWT contains stale data.
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	const session = await locals.safeGetSession();

	if (!session.session) {
		return json({ error: 'No session found' }, { status: 401 });
	}

	// SECURITY FIX: Apply rate limiting to prevent abuse
	const rateLimitResult = checkRateLimit(
		request,
		RateLimitConfigs.AUTH,
		'auth:refresh',
		session.user?.id
	);

	if (rateLimitResult.limited) {
		return createRateLimitResponse(rateLimitResult.resetTime);
	}

	try {
		// Force a session refresh using the refresh token
		// This will fetch a new JWT with updated app_metadata from the database
		const { data, error } = await locals.supabase.auth.refreshSession({
			refresh_token: session.session.refresh_token
		});

		if (error) {
			console.error('Failed to refresh session:', error);
			return json({ error: 'Failed to refresh session' }, { status: 500 });
		}

		if (!data.session) {
			return json({ error: 'No session returned after refresh' }, { status: 500 });
		}

		return json({
			success: true,
			// Return minimal info for debugging
			refreshed: true,
			expiresAt: data.session.expires_at
		});
	} catch (err) {
		console.error('Error refreshing session:', err);
		return json({ error: 'Internal error during session refresh' }, { status: 500 });
	}
};
