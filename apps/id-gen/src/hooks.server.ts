import { auth } from '$lib/server/auth';
import { db } from '$lib/server/db';
import { profiles } from '$lib/server/schema';
import { eq } from 'drizzle-orm';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { getUserPermissions } from '$lib/services/permissions';
import '$lib/utils/setup-logging';
import { logger } from '$lib/utils/logger';
import { validateAndLogEnvironment } from '$lib/utils/env-validation';
import { generateCSRFTokens } from '$lib/server/csrf';

// SECURITY: Validate environment variables at startup
validateAndLogEnvironment();

const betterAuthHandle: Handle = async ({ event, resolve }) => {
	// Better Auth session management
	const result = await auth.api.getSession({
		headers: event.request.headers
	}) as any; // Cast to any to handle type mismatch from Better Auth SDK in this environment

	event.locals.auth = auth;
	event.locals.session = result?.session ?? null;
	event.locals.user = result?.user ?? null;


	if (result?.user) {
		// Fetch profile data from Neon via Drizzle
		const [userProfile] = await db
			.select()
			.from(profiles)
			.where(eq(profiles.id, result.user.id))
			.limit(1);

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

			// Get permissions
			const permissions = await getUserPermissions(effectiveRoles, userProfile.id);

			event.locals.org_id = userProfile.orgId ?? undefined;
			event.locals.permissions = permissions;
			event.locals.effectiveRoles = effectiveRoles;
			event.locals.roleEmulation = emulationState;
		}
	}

	return resolve(event);
};

const securityHeadersHandle: Handle = async ({ event, resolve }) => {
	// SECURITY: Build Content Security Policy
	const cspDirectives = [
		"default-src 'self'",
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net",
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		"img-src 'self' data: blob: https://*.supabase.co https://*.neon.tech", // Added Neon
		"font-src 'self' https://fonts.gstatic.com",
		"connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paymongo.com https://api.runware.ai https://*.runware.ai https://*.neon.tech", // Added Neon
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
		...(dev ? {} : {
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
	const isPublicRoute =
		path === '/' ||
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
			throw redirect(303, '/');
		}
	} else if (!isAuthRoute && !isPublicRoute) {
		const returnTo = path === '/' ? '' : `?returnTo=${encodeURIComponent(path)}`;
		throw redirect(303, `/auth${returnTo}`);
	}

	return resolve(event);
};

export const handle = sequence(betterAuthHandle, securityHeadersHandle, authGuard);
