import { createServerClient } from '@supabase/ssr';
import type { User, Session } from '@supabase/supabase-js';
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
			get: (key) => event.cookies.get(key),
			set: (key, value, options) => {
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
			remove: (key, options) => {
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

	logger.debug('[Auth Guard] Checking session for path:', event.url.pathname);
	const sessionInfo = await event.locals.safeGetSession();

	logger.debug('[Auth Guard] Session info', {
		hasSession: !!sessionInfo.session,
		hasUser: !!sessionInfo.user,
		hasOrgId: !!sessionInfo.org_id,
		permissionsCount: sessionInfo.permissions?.length || 0
	});

	// Set all info in locals
	event.locals = {
		...event.locals,
		session: sessionInfo.session,
		user: sessionInfo.user,
		permissions: sessionInfo.permissions,
		org_id: sessionInfo.org_id ?? undefined
	};

	// Handle API routes
	if (event.url.pathname.startsWith('/api')) {
		if (!sessionInfo.user) {
			logger.warn('[Auth Guard] API route unauthorized');
			throw throwError(401, 'Unauthorized');
		}
		return resolve(event);
	}

	// Allow access to auth routes when not authenticated
	if (event.url.pathname.startsWith('/auth')) {
		logger.debug('[Auth Guard] Auth route access');
		// If user is already authenticated and trying to access auth routes (except signout),
		// handle role-based redirects
		if (sessionInfo.session && event.url.pathname !== '/auth/signout') {
			const returnTo = event.url.searchParams.get('returnTo');
			if (returnTo) {
				logger.debug('[Auth Guard] Redirecting authenticated user', { returnTo });
				throw redirect(303, returnTo);
			}
		}
		return resolve(event);
	}

	// Require authentication for all other routes
	if (!sessionInfo.session && !event.url.pathname.startsWith('/auth')) {
		logger.info('[Auth Guard] No session, redirecting to auth');
		throw redirect(303, `/auth?returnTo=${event.url.pathname}`);
	}

	return resolve(event);
};

export const handle = sequence(initializeSupabase, authGuard);
