import { createServerClient } from '@supabase/ssr';
import type { User, Session } from '@supabase/supabase-js';
import type { CookieSerializeOptions } from 'cookie';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect, error as throwError } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import type { Handle } from '@sveltejs/kit';
import { jwtDecode } from 'jwt-decode';
import { getUserPermissions } from '$lib/services/permissions';
import type { UserJWTPayload } from '$lib/types/auth';
import '$lib/utils/setup-logging';
import { logger } from '$lib/utils/logger';

export interface GetSessionResult {
	session: Session | null;
	error: Error | null;
	user: User | null;
	org_id: string | null;
	permissions?: string[];
}

const initializeSupabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key: string) => event.cookies.get(key),
			set: (key: string, value: string, options: Record<string, any>) => {
				try {
					event.cookies.set(key, value, {
						...options,
						path: '/',
						sameSite: 'lax',
						secure: process.env.NODE_ENV === 'production'
					});
				} catch (error) {
					console.error('Cookie could not be set:', error);
				}
			},
			remove: (key: string, options: Record<string, any>) => {
				try {
					event.cookies.delete(key, { path: '/', ...options });
				} catch (error) {
					console.error('Cookie could not be removed:', error);
				}
			}
		}
	}) as any;

	event.locals.safeGetSession = async () => {
		// Parallel fetch of user and session data
		const [userResponse, sessionResponse] = await Promise.all([
			event.locals.supabase.auth.getUser(),
			event.locals.supabase.auth.getSession()
		]);

		const {
			data: { user },
			error: userError
		} = userResponse;
		const {
			data: { session: initialSession },
			error: sessionError
		} = sessionResponse;

		if (userError || !user) {
			return {
				session: null,
				error: userError || new Error('User not found'),
				user: null,
				org_id: null,
				permissions: []
			};
		}

		if (sessionError || !initialSession) {
			return {
				session: null,
				error: sessionError || new Error('Session not found'),
				user: null,
				org_id: null,
				permissions: []
			};
		}

		let currentSession = initialSession;
		if (currentSession.expires_at) {
			const expiresAt = Math.floor(new Date(currentSession.expires_at).getTime() / 1000);
			const now = Math.floor(Date.now() / 1000);

			if (now > expiresAt) {
				try {
					const {
						data: { session: refreshedSession },
						error
					} = await event.locals.supabase.auth.setSession({
						access_token: currentSession.access_token,
						refresh_token: currentSession.refresh_token
					});

					if (!error && refreshedSession) {
						currentSession = refreshedSession;
					}
				} catch (err) {
					console.warn('Session refresh failed:', err);
					// Continue with existing session
				}
			}
		}

		// Decode JWT and get permissions
		const decodedToken = currentSession.access_token
			? jwtDecode<UserJWTPayload>(currentSession.access_token)
			: null;

		const permissions = decodedToken
			? await getUserPermissions(decodedToken.user_roles, event.locals.supabase)
			: [];
		// Sanitized logging only; never log raw roles or metadata in production
		logger.info('User authenticated', {
			userId: user.id,
			hasRoles: Boolean(decodedToken?.user_roles?.length)
		});
		return {
			session: currentSession,
			error: null,
			user,
			org_id: user.user_metadata.org_id,
			decodedToken: decodedToken || null,
			permissions
		};
	};

	return resolve(event);
};

const authGuard: Handle = async ({ event, resolve }) => {
	// Set baseline security headers on all responses
	event.setHeaders({
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
	});

	const sessionInfo = await event.locals.safeGetSession();

	// Set all info in locals
	event.locals = {
		...event.locals,
		session: sessionInfo.session,
		user: sessionInfo.user,
		permissions: sessionInfo.permissions,
		org_id: sessionInfo.org_id ?? undefined
	};

	const path = event.url.pathname;

	// 1. Handle API routes first - simple return 401, no redirect loops
	if (path.startsWith('/api')) {
		if (!sessionInfo.user) {
			// Returning Response directly stops SvelteKit from doing anything else
			return new Response(JSON.stringify({ error: 'Unauthorized' }), {
				status: 401,
				headers: { 'Content-Type': 'application/json' }
			});
		}
		return resolve(event);
	}

	// 2. Identify public routes
	const isAuthRoute = path.startsWith('/auth');
	const isPublicRoute =
		path === '/' ||
		path.startsWith('/features') ||
		path.startsWith('/pricing') ||
		path.startsWith('/contact') ||
		path.startsWith('/privacy') ||
		path.startsWith('/terms');

	// 3. Logic:
	// If User is Logged In:
	//   - If trying to access /auth/signin or /auth/signup -> Redirect to dashboard /all-ids
	//   - If accessing /auth/signout -> Allow
	//   - Otherwise -> Allow

	if (sessionInfo.session) {
		if (isAuthRoute && !path.startsWith('/auth/signout')) {
			// Check for specific returnTo to avoid loops, but default to dashboard
			const returnTo = event.url.searchParams.get('returnTo');
			// Prevent redirecting back to auth pages
			if (returnTo && !returnTo.startsWith('/auth')) {
				throw redirect(303, returnTo);
			}
			throw redirect(303, '/');
		}
		// Allow access to everything else for logged in users
		return resolve(event);
	}

	// If User is NOT Logged In:
	//   - If accessing Public Route -> Allow
	//   - If accessing Auth Route -> Allow
	//   - Otherwise -> Redirect to /auth

	if (isAuthRoute || isPublicRoute) {
		return resolve(event);
	}

	// Redirect unauthenticated users to auth page with return URL
	const returnTo = path === '/' ? '' : `?returnTo=${encodeURIComponent(path)}`;
	throw redirect(303, `/auth${returnTo}`);
};

export const handle = sequence(initializeSupabase, authGuard);
