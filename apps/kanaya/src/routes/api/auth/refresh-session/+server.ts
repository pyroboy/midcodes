import { json, type RequestHandler } from '@sveltejs/kit';
import { checkRateLimit, createRateLimitResponse, RateLimitConfigs } from '$lib/utils/rate-limiter';

/**
 * Forces a session refresh to get fresh app_metadata from the database.
 * This is needed after role emulation changes since the session contains stale data.
 */
export const POST: RequestHandler = async ({ locals, request }) => {
	const { session, user } = locals;

	if (!session || !user) {
		return json({ error: 'No session found' }, { status: 401 });
	}

	// SECURITY FIX: Apply rate limiting to prevent abuse
	const rateLimitResult = checkRateLimit(request, RateLimitConfigs.AUTH, 'auth:refresh', user.id);

	if (rateLimitResult.limited) {
		return createRateLimitResponse(rateLimitResult.resetTime);
	}

	try {
		// With Better Auth, session data is generally fresher or handled via hooks.
		// If the client needs to re-fetch, it should hit the session endpoint or reload.
		// For compatibility with the frontend expecting this endpoint:
		// We'll return success, assuming the next request will pick up the updated session/locals
		// from the `handle` hook logic which should be checking DB/Better Auth.

		// Note: Better Auth doesn't have a direct "refresh my session token now" in the same way
		// Supabase JWTs do, but the session is validated on every request.
		// If role emulation changes, the cookie/header should handle the next request.

		return json({
			success: true,
			// Return minimal info for debugging
			refreshed: true,
			expiresAt: (session as any).expiresAt
		});
	} catch (err) {
		console.error('Error refreshing session:', err);
		return json({ error: 'Internal error during session refresh' }, { status: 500 });
	}
};
