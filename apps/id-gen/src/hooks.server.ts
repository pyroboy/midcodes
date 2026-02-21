import { auth } from '$lib/server/auth';
import { db, dbQuery } from '$lib/server/db';
import { profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { getUserPermissions } from '$lib/services/permissions';
import '$lib/utils/setup-logging';
import { logger } from '$lib/utils/logger';
import { initializeEnv } from '$lib/server/env';
import { generateCSRFTokens } from '$lib/server/csrf';
import { dbCircuitBreaker } from '$lib/server/db-retry';

// Flag to track if environment has been validated (runs once on first request)
let _envValidated = false;

const betterAuthHandle: Handle = async ({ event, resolve }) => {
	console.log('[AUTH DEBUG] betterAuthHandle started for:', event.url.pathname);

	// SECURITY: Validate environment variables on first request
	// (Cloudflare Workers don't allow this at module scope)
	// This ensures $env/dynamic/private is hydrated
	if (!_envValidated) {
		console.log('[AUTH DEBUG] Initializing environment...');
		try {
			initializeEnv();
			console.log('[AUTH DEBUG] Environment initialized successfully');
		} catch (e) {
			console.error('[AUTH DEBUG] Environment init FAILED:', e);
			throw e;
		}
		_envValidated = true;
	}

	// Better Auth session management with retry and timeout
	console.log('[AUTH DEBUG] Getting session from headers...');
	let result: any = null;
	try {
		result = await dbQuery(
			() => auth.api.getSession({
				headers: event.request.headers
			}),
			3000 // 3 second timeout for session retrieval
		);
		console.log(
			'[AUTH DEBUG] Session result:',
			result ? 'Session found' : 'No session',
			result?.user?.email ?? 'no email'
		);
	} catch (e) {
		console.error('[AUTH DEBUG] getSession FAILED:', e);
		// Don't throw - allow request to continue without session
	}

	event.locals.auth = auth;
	event.locals.session = result?.session ?? null;
	event.locals.user = result?.user ?? null;
	console.log('[AUTH DEBUG] locals.user set to:', event.locals.user?.email ?? 'null');

	if (result?.user) {
		console.log('[AUTH DEBUG] Fetching profile for user:', result.user.id);
		// Fetch profile data from Neon via Drizzle with retry and timeout
		let userProfile: any = null;
		try {
			const [profile] = await dbQuery(
				() => db
					.select()
					.from(profiles)
					.where(eq(profiles.id, result.user.id))
					.limit(1),
				5000 // 5 second timeout for profile fetch
			);
			userProfile = profile;
			console.log('[AUTH DEBUG] Profile found:', userProfile ? 'yes' : 'no');
		} catch (e) {
			console.error('[AUTH DEBUG] Profile fetch FAILED:', e);
			// Continue without profile - user will have limited access
		}

		if (userProfile) {
			const roles = userProfile.role ? [userProfile.role] : [];
			let effectiveRoles = roles;
			let emulationState: App.Locals['roleEmulation'] = null;

			// Handle Role Emulation (stored in JSONB context or appMetadata equivalent)
			const context = (userProfile.context as any) || {};
			const emulation = context.role_emulation;

			if (emulation && emulation.active) {
				const now = new Date();
				const expiresAt = emulation.expires_at ? new Date(emulation.expires_at) : null;

				if (expiresAt && now > expiresAt) {
					logger.warn('Role emulation expired', { userId: userProfile.id });
					emulationState = {
						active: false,
						originalRole: emulation.original_role,
						expiresAt: emulation.expires_at,
						startedAt: emulation.started_at
					};
				} else if (emulation.emulated_role) {
					logger.info('Role emulation active', {
						userId: userProfile.id,
						emulating: emulation.emulated_role
					});
					effectiveRoles = [emulation.emulated_role];
					emulationState = {
						active: true,
						emulatedRole: emulation.emulated_role,
						originalRole: emulation.original_role,
						expiresAt: emulation.expires_at,
						startedAt: emulation.started_at
					};
				}
			}

			// Get permissions with retry and timeout
			const permissions = await dbQuery(
				() => getUserPermissions(effectiveRoles, userProfile.id),
				3000 // 3 second timeout for permissions
			);

			event.locals.org_id = userProfile.orgId ?? undefined;
			event.locals.permissions = permissions;
			event.locals.effectiveRoles = effectiveRoles;
			event.locals.roleEmulation = emulationState;
		}
	}

	console.log('[AUTH DEBUG] betterAuthHandle completed successfully');
	return resolve(event);
};

const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	// SECURITY: Build Content Security Policy
	// DEV: blob: added to connect-src for local image cropping (blob URL fetch)
	const connectSrc = dev
		? "connect-src 'self' blob: https://api.runware.ai https://*.runware.ai https://*.neon.tech https://assets.kanaya.app https://cdn.jsdelivr.net http://localhost:* ws://localhost:* https://cloudflareinsights.com https://static.cloudflareinsights.com "
		: "connect-src 'self' https://api.runware.ai https://*.runware.ai https://*.neon.tech https://assets.kanaya.app https://cdn.jsdelivr.net http://localhost:* ws://localhost:* https://cloudflareinsights.com https://static.cloudflareinsights.com ";

	const cspDirectives = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net https://static.cloudflareinsights.com",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"img-src 'self' data: blob: https://*.neon.tech https://assets.kanaya.app https://*.fal.media https://im.runware.ai ", // Custom R2 domain, fal.ai images
		connectSrc, // Custom R2 domain; blob: only in dev
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
		'Cross-Origin-Embedder-Policy': 'credentialless',
		'Cross-Origin-Opener-Policy': 'same-origin',
		'Content-Security-Policy': cspDirectives,
		...(dev
			? {}
			: {
					'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
				})
	});

	// SECURITY: Generate and set CSRF token
	const csrfTokens = generateCSRFTokens();
	event.cookies.set('csrf-token', csrfTokens.cookieToken, {
		path: '/',
		sameSite: 'strict',
		secure: !dev,
		httpOnly: true,
		maxAge: 60 * 60 // 1 hour
	});

	event.locals.csrfToken = csrfTokens.headerToken;

	return resolve(event);
};

const authGuard: Handle = async ({ event, resolve }) => {
	const path = event.url.pathname;
	const isUserLoggedIn = !!event.locals.user;

	// 1. Handle API routes
	if (path.startsWith('/api') && !path.startsWith('/api/auth') && !path.startsWith('/api/debug')) {
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
		path === '/' ||
		path.startsWith('/id/') || // QR code landing pages - must be public
		path.startsWith('/setup') ||
		path.startsWith('/features') ||
		path.startsWith('/pricing') ||
		path.startsWith('/contact') ||
		path.startsWith('/privacy') ||
		path.startsWith('/terms');

	if (isUserLoggedIn) {
		if (path.startsWith('/auth') && !path.startsWith('/auth/signout')) {
			const returnTo = event.url.searchParams.get('returnTo');
			if (returnTo && !returnTo.startsWith('/auth')) {
				throw redirect(303, returnTo);
			}
			throw redirect(303, '/dashboard');
		}
	} else if (!isAuthRoute && !isPublicRoute) {
		const returnTo = path === '/' ? '' : `?returnTo=${encodeURIComponent(path)}`;
		throw redirect(303, `/auth${returnTo}`);
	}

	return resolve(event);
};

export const handle = sequence(betterAuthHandle, securityHeadersHandle, authGuard);
