import { auth } from '$lib/server/auth';
import { db, dbQuery } from '$lib/server/db';
import { profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { getUserPermissions } from '$lib/services/permissions';
import { initializeEnv } from '$lib/server/env';

// Flag to track if environment has been validated (runs once on first request)
let _envValidated = false;

const betterAuthHandle: Handle = async ({ event, resolve }) => {
	// SECURITY: Validate environment variables on first request
	if (!_envValidated) {
		try {
			initializeEnv();
		} catch (e) {
			console.error('[AUTH] Environment init FAILED:', e);
			throw e;
		}
		_envValidated = true;
	}

	// Better Auth session management with retry and timeout
	let result: any = null;
	try {
		result = await dbQuery(
			() =>
				auth.api.getSession({
					headers: event.request.headers
				}),
			3000 // 3 second timeout for session retrieval
		);
	} catch (e) {
		console.error('[AUTH] getSession FAILED:', e);
		// Don't throw - allow request to continue without session
	}

	event.locals.session = result?.session ?? null;
	event.locals.user = result?.user ?? null;

	if (result?.user) {
		// Fetch profile data from Neon via Drizzle with retry and timeout
		let userProfile: any = null;
		try {
			const [profile] = await dbQuery(
				() =>
					db
						.select()
						.from(profiles)
						.where(eq(profiles.id, result.user.id))
						.limit(1),
				5000 // 5 second timeout for profile fetch
			);
			userProfile = profile;
		} catch (e) {
			console.error('[AUTH] Profile fetch FAILED:', e);
			// Continue without profile - user will have limited access
		}

		if (userProfile) {
			const roles = userProfile.role ? [userProfile.role] : [];
			const effectiveRoles = roles;

			// Get permissions with retry and timeout
			let permissions: string[] = [];
			try {
				permissions = await dbQuery(
					() => getUserPermissions(effectiveRoles, userProfile.id),
					3000 // 3 second timeout for permissions
				);
			} catch (e) {
				console.error('[AUTH] Permissions fetch FAILED:', e);
			}

			event.locals.org_id = userProfile.orgId ?? undefined;
			event.locals.permissions = permissions;
			event.locals.effectiveRoles = effectiveRoles;
		}
	}

	return resolve(event);
};

const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	// SECURITY: Build Content Security Policy
	const connectSrc = dev
		? "connect-src 'self' blob: https://*.neon.tech http://localhost:* ws://localhost:*"
		: "connect-src 'self' https://*.neon.tech";

	const cspDirectives = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"img-src 'self' data: blob: https://*.neon.tech",
		connectSrc,
		"worker-src 'self' blob:",
		"frame-ancestors 'none'",
		"base-uri 'self'",
		"form-action 'self'"
	].join('; ');

	event.setHeaders({
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'geolocation=(), microphone=(), camera=(self)',
		'Content-Security-Policy': cspDirectives,
		...(dev
			? {}
			: {
					'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
				})
	});

	return resolve(event);
};

const authGuard: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const isUserLoggedIn = !!event.locals.user;

	// 1. Handle API routes (except auth API)
	if (path.startsWith('/api') && !path.startsWith('/api/auth')) {
		if (!isUserLoggedIn) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// 2. Public vs Private routing
	const isAuthRoute = path.startsWith('/auth') || path.startsWith('/api/auth');
	const isPublicRoute = path.startsWith('/utility-input/');

	if (isUserLoggedIn) {
		// Redirect logged-in users away from auth pages (except signout)
		if (path.startsWith('/auth') && !path.startsWith('/auth/signout')) {
			const returnTo = event.url.searchParams.get('returnTo');
			if (returnTo && !returnTo.startsWith('/auth')) {
				throw redirect(303, returnTo);
			}
			throw redirect(303, '/');
		}
	} else if (!isAuthRoute && !isPublicRoute) {
		// Redirect unauthenticated users to auth page
		throw redirect(303, `/auth?returnTo=${encodeURIComponent(path)}`);
	}

	return resolve(event);
};

export const handle = sequence(betterAuthHandle, securityHeadersHandle, authGuard);
