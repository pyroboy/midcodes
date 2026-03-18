import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { DEV_USERS } from '$lib/server/dev-bypass';
// Auth uses lightweight schema-auth.ts (4 tables) — safe for CF Workers CPU limit
import { auth } from '$lib/server/auth';
import { initializeEnv } from '$lib/server/env';

let _envValidated = false;

// ── Auth cache: avoids 2 Neon round-trips (profile + permissions) on every navigation ──
// Keyed by userId, TTL 5 minutes. Invalidated on logout.
const AUTH_CACHE_TTL = 5 * 60 * 1000;
const authCache = new Map<string, { profile: any; permissions: string[]; effectiveRoles: string[]; org_id: string | undefined; ts: number }>();

function getCachedAuth(userId: string) {
	const entry = authCache.get(userId);
	if (!entry) return null;
	if (Date.now() - entry.ts > AUTH_CACHE_TTL) {
		authCache.delete(userId);
		return null;
	}
	return entry;
}

const betterAuthHandle: Handle = async ({ event, resolve }) => {
	// ── Quick-access bypass (works in dev and production) ──
	const roleParam = event.url.searchParams.get('dev_role');
	if (roleParam !== null) {
		if (roleParam === 'logout') {
			event.cookies.delete('dev_role', { path: '/' });
		} else if (DEV_USERS[roleParam]) {
			event.cookies.set('dev_role', roleParam, { path: '/', httpOnly: true, sameSite: 'lax', secure: !dev });
		}
		const cleanUrl = new URL(event.url);
		cleanUrl.searchParams.delete('dev_role');
		throw redirect(303, cleanUrl.pathname + cleanUrl.search);
	}

	const quickRole = event.cookies.get('dev_role');
	if (quickRole && DEV_USERS[quickRole]) {
		const mock = DEV_USERS[quickRole];
		event.locals.session = {
			id: 'quick-session',
			userId: '00000000-0000-0000-0000-000000000001',
			expiresAt: new Date(Date.now() + 86400000),
			createdAt: new Date(),
			updatedAt: new Date(),
			token: 'quick-token'
		} as any;
		event.locals.user = {
			id: '00000000-0000-0000-0000-000000000001',
			email: mock.email,
			name: mock.role,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
			image: null
		} as any;
		event.locals.org_id = 'dev-org';
		event.locals.permissions = mock.permissions;
		event.locals.effectiveRoles = [mock.role];
		return resolve(event);
	}

	// ── Normal auth flow (Better Auth + DB) ──
	if (!_envValidated) {
		try {
			initializeEnv();
		} catch (e) {
			console.error('[AUTH] Environment init FAILED:', e);
			throw e;
		}
		_envValidated = true;
	}

	// ── Skip DB round-trip when there's no session cookie ──
	// Better Auth's default cookie is "better-auth.session_token".
	// If it's absent, the user is definitely unauthenticated — no need
	// to make a cold HTTP call to Neon just to confirm that.
	const hasSessionCookie = event.cookies.get('better-auth.session_token');

	let result: any = null;
	if (hasSessionCookie) {
		try {
			result = await auth.api.getSession({
				headers: event.request.headers
			});
		} catch (e) {
			console.error('[AUTH] getSession FAILED:', e);
		}
	}

	event.locals.session = result?.session ?? null;
	event.locals.user = result?.user ?? null;

	// Only lazy-load the heavy schema when we have an authenticated user
	// and need profile/permissions (avoids loading 716-line schema on every request)
	if (result?.user) {
		// ── Check auth cache first (saves 2 Neon round-trips) ──
		const cached = getCachedAuth(result.user.id);
		if (cached) {
			event.locals.org_id = cached.org_id;
			event.locals.permissions = cached.permissions;
			event.locals.effectiveRoles = cached.effectiveRoles;
		} else {
			const [{ db, dbQuery }, { profiles }, { eq }, { getUserPermissions }] = await Promise.all([
				import('$lib/server/db'),
				import('$lib/server/schema'),
				import('drizzle-orm'),
				import('$lib/services/permissions')
			]);

			let userProfile: any = null;
			try {
				const [profile] = await dbQuery(
					() =>
						db
							.select()
							.from(profiles)
							.where(eq(profiles.id, result.user.id))
							.limit(1),
					5000
				);
				userProfile = profile;
			} catch (e) {
				console.error('[AUTH] Profile fetch FAILED:', e);
			}

			if (userProfile) {
				const roles = userProfile.role ? [userProfile.role] : [];
				const effectiveRoles = roles;

				// ── Run permissions fetch (profile is needed for roles first) ──
				let permissions: string[] = [];
				try {
					permissions = await dbQuery(
						() => getUserPermissions(effectiveRoles, userProfile.id),
						3000
					);
				} catch (e) {
					console.error('[AUTH] Permissions fetch FAILED:', e);
				}

				event.locals.org_id = userProfile.orgId ?? undefined;
				event.locals.permissions = permissions;
				event.locals.effectiveRoles = effectiveRoles;

				// ── Cache for subsequent navigations ──
				authCache.set(result.user.id, {
					profile: userProfile,
					permissions,
					effectiveRoles,
					org_id: userProfile.orgId ?? undefined,
					ts: Date.now()
				});
			}
		}
	}

	return resolve(event);
};

const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	const connectSrc = dev
		? "connect-src 'self' blob: https://*.neon.tech http://localhost:* ws://localhost:* ws://127.0.0.1:*"
		: "connect-src 'self' https://*.neon.tech";

	const cspDirectives = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval'",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"img-src 'self' data: blob: https://*.neon.tech https://images.unsplash.com https://res.cloudinary.com",
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

	// 1. Handle API routes (except auth API and cron)
	if (path.startsWith('/api') && !path.startsWith('/api/auth') && !path.startsWith('/api/cron')) {
		if (!isUserLoggedIn) {
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
	}

	// 2. Public vs Private routing
	const isAuthRoute = path.startsWith('/auth') || path.startsWith('/api/auth');
	const isPublicRoute =
		path.startsWith('/utility-input/') || path === '/terms' || path === '/privacy';

	if (isUserLoggedIn) {
		if (path.startsWith('/auth') && !path.startsWith('/auth/signout')) {
			const returnTo = event.url.searchParams.get('returnTo');
			if (returnTo && !returnTo.startsWith('/auth')) {
				throw redirect(303, returnTo);
			}
			throw redirect(303, '/');
		}
	} else if (!isAuthRoute && !isPublicRoute) {
		throw redirect(303, `/auth?returnTo=${encodeURIComponent(path)}`);
	}

	return resolve(event);
};

// ── Request timing logger (dev only) ──
const timingHandle: Handle = async ({ event, resolve }) => {
	if (!dev) return resolve(event);

	const start = performance.now();
	const method = event.request.method;
	const path = event.url.pathname;

	// Skip noisy requests (HMR, static assets, internal, rxdb replication)
	if (path.startsWith('/__') || path.startsWith('/node_modules') || path.startsWith('/@') || path.startsWith('/api/rxdb/')) {
		return resolve(event);
	}

	const response = await resolve(event);
	const ms = (performance.now() - start).toFixed(1);
	const status = response.status;
	const user = event.locals.user?.email ?? 'anon';
	const tag = status >= 300 && status < 400 ? '→' : status >= 400 ? '✗' : '•';

	console.log(`  ${tag} ${method} ${path} — ${ms}ms [${status}] (${user})`);
	return response;
};

export const handle = sequence(timingHandle, betterAuthHandle, securityHeadersHandle, authGuard);
