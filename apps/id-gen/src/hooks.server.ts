import { createServerClient } from '@supabase/ssr';
import type { User, Session } from '@supabase/supabase-js';
import { sequence } from '@sveltejs/kit/hooks';
import { redirect } from '@sveltejs/kit';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import { jwtDecode } from 'jwt-decode';
import { getUserPermissions } from '$lib/services/permissions';
import type { UserJWTPayload } from '$lib/types/auth';
import '$lib/utils/setup-logging';
import { logger } from '$lib/utils/logger';
import { validateAndLogEnvironment } from '$lib/utils/env-validation';
import { generateCSRFTokens } from '$lib/server/csrf';

// SECURITY: Validate environment variables at startup
validateAndLogEnvironment();

export interface GetSessionResult {
	session: Session | null;
	error: Error | null;
	user: User | null;
	org_id: string | null;
	permissions?: string[];
	effectiveRoles?: string[];
	roleEmulation?: {
		active: boolean;
		emulatedRole: string | null;
		originalRole: string | null;
		expiresAt: string | null;
		startedAt: string | null;
	} | null;
	decodedToken?: any;
}

const initializeSupabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			get: (key: string) => event.cookies.get(key),
			set: (key: string, value: string, options: { path?: string; sameSite?: boolean | 'lax' | 'strict' | 'none'; secure?: boolean; maxAge?: number; domain?: string }) => {
				try {
					event.cookies.set(key, value, {
						...options,
						path: '/',
						sameSite: 'lax',
						secure: !dev,
						// SECURITY FIX: Add httpOnly flag to prevent XSS attacks from accessing cookies
						httpOnly: true
					});
				} catch (error) {
					console.error('Cookie could not be set:', error);
				}
			},
			remove: (key: string, options: { path?: string; sameSite?: boolean | 'lax' | 'strict' | 'none'; secure?: boolean; maxAge?: number; domain?: string }) => {
				try {
					event.cookies.delete(key, { path: '/', ...options });
				} catch (error) {
					console.error('Cookie could not be removed:', error);
				}
			}
		}
	}) as any;

	event.locals.safeGetSession = async () => {
		// Get session first - this is cached and fast
		// Wrap in try-catch to handle invalid refresh tokens gracefully
		let session = null;
		let sessionError = null;

		try {
			const result = await event.locals.supabase.auth.getSession();
			session = result.data?.session;
			sessionError = result.error;
		} catch (err: any) {
			// Handle AuthApiError for invalid/expired refresh tokens
			const errorCode = err?.code;
			if (errorCode === 'refresh_token_not_found' || errorCode === 'refresh_token_already_used' || err?.__isAuthError) {
				console.warn(`Invalid refresh token detected (${errorCode || 'AuthApiError'}), clearing session:`, err.message);
				// Clear the invalid session by signing out
				try {
					await event.locals.supabase.auth.signOut();
				} catch {
					// Ignore signout errors
				}
				return {
					session: null,
					error: err,
					user: null,
					org_id: null,
					permissions: []
				};
			}
			throw err; // Re-throw unexpected errors
		}

		if (sessionError || !session) {
			// Also handle the case where error is returned in the result
			const errorCode = (sessionError as any)?.code;
			if (errorCode === 'refresh_token_not_found' || errorCode === 'refresh_token_already_used') {
				console.warn(`Invalid refresh token (${errorCode}) in session result, clearing session`);
				try {
					await event.locals.supabase.auth.signOut();
				} catch {
					// Ignore signout errors
				}
			}
			return {
				session: null,
				error: sessionError || new Error('Session not found'),
				user: null,
				org_id: null,
				permissions: []
			};
		}

		// Session includes user data - no need for separate getUser() call on every request
		// getUser() makes a network call to Supabase to validate the JWT
		// We only need to validate if the session is expired or about to expire
		let user = session.user;
		let currentSession = session;

		// SECURITY FIX: Strengthen session refresh logic with better validation
		if (currentSession.expires_at) {
			const expiresAt = Math.floor(new Date(currentSession.expires_at).getTime() / 1000);
			const now = Math.floor(Date.now() / 1000);
			// Refresh 5 minutes before expiration for better UX
			const refreshThreshold = 300; // 5 minutes in seconds

			if (now > expiresAt - refreshThreshold) {
				try {
					const {
						data: { session: refreshedSession },
						error
					} = await event.locals.supabase.auth.refreshSession({
						refresh_token: currentSession.refresh_token
					});

					if (error) {
						logger.warn('Session refresh failed, forcing re-authentication', {
							error: error.message,
							userId: user.id
						});
						// Clear invalid session
						await event.locals.supabase.auth.signOut();
						return {
							session: null,
							error: new Error('Session expired'),
							user: null,
							org_id: null,
							permissions: []
						};
					}

					if (refreshedSession) {
						// Validate the refreshed session
						if (!refreshedSession.user || !refreshedSession.access_token) {
							logger.error('Refreshed session is invalid', { userId: user.id });
							await event.locals.supabase.auth.signOut();
							return {
								session: null,
								error: new Error('Invalid session'),
								user: null,
								org_id: null,
								permissions: []
							};
						}

						currentSession = refreshedSession;
						user = refreshedSession.user;
						logger.info('Session refreshed successfully', { userId: user.id });
					}
				} catch (err) {
					logger.error('Session refresh error:', err);
					// Force re-authentication on unexpected errors
					await event.locals.supabase.auth.signOut();
					return {
						session: null,
						error: err instanceof Error ? err : new Error('Session refresh failed'),
						user: null,
						org_id: null,
						permissions: []
					};
				}
			}
		}

		// Decode JWT for basic role extraction (but NOT for emulation)
		const decodedToken = currentSession.access_token
			? jwtDecode<UserJWTPayload>(currentSession.access_token)
			: null;

		// Extract base roles from app_metadata (prefer user.app_metadata over JWT)
		let roles: string[] = [];
		let emulationState: {
			active: boolean;
			emulatedRole: string | null;
			originalRole: string | null;
			expiresAt: string | null;
			startedAt: string | null;
		} | null = null;

		// Get role from user.app_metadata (this is always fresh, unlike JWT)
		const appMetadata = user.app_metadata || {};
		if (appMetadata.role) {
			roles.push(appMetadata.role);
		}
		if (appMetadata.roles) {
			roles.push(...appMetadata.roles);
		}
		
		// Fallback to JWT if no roles in app_metadata
		if (roles.length === 0 && decodedToken) {
			if (decodedToken.app_metadata?.role) {
				roles.push(decodedToken.app_metadata.role);
			}
			if (decodedToken.app_metadata?.roles) {
				roles.push(...decodedToken.app_metadata.roles);
			}
			if (decodedToken.user_roles) {
				roles.push(...decodedToken.user_roles);
			}
		}

		// Handle Role Emulation - ONLY from user.app_metadata (fresh, not stale JWT)
		const emulation = appMetadata.role_emulation;
		
		if (emulation && emulation.active) {
			const now = new Date();
			const expiresAt = emulation.expires_at ? new Date(emulation.expires_at) : null;
			
			// Check if emulation is expired
			if (expiresAt && now > expiresAt) {
				logger.warn('Role emulation expired, ignoring emulated role', {
					userId: user.id,
					emulatedRole: emulation.emulated_role,
					expiresAt: emulation.expires_at
				});
				// User falls back to their original roles (already extracted above)
				emulationState = {
					active: false,
					emulatedRole: null,
					originalRole: emulation.original_role,
					expiresAt: emulation.expires_at,
					startedAt: emulation.started_at
				};
			} else if (emulation.emulated_role) {
				// Emulation is active and valid: OVERRIDE roles with the emulated role
				logger.info('Role emulation active', {
					userId: user.id,
					emulating: emulation.emulated_role,
					originalRole: emulation.original_role
				});
				roles = [emulation.emulated_role];
				
				// Set emulation state for UI
				emulationState = {
					active: true,
					emulatedRole: emulation.emulated_role,
					originalRole: emulation.original_role,
					expiresAt: emulation.expires_at,
					startedAt: emulation.started_at
				};
			}
		}

		// Deduplicate roles
		roles = [...new Set(roles)];

		const permissions = roles.length > 0
			? await getUserPermissions(roles, event.locals.supabase)
			: [];
		
		// Sanitized logging only; never log raw roles or metadata in production
		logger.info('User authenticated', {
			userId: user.id,
			hasRoles: roles.length > 0,
			roleCount: roles.length,
			emulationActive: emulationState?.active ?? false
		});
		
		return {
			session: currentSession,
			error: null,
			user,
			org_id: user.user_metadata.org_id,
			decodedToken: decodedToken || null,
			permissions,
			effectiveRoles: roles,
			roleEmulation: emulationState
		};
	};

	return resolve(event);
};

const authGuard: Handle = async ({ event, resolve }) => {
	// SECURITY: Build Content Security Policy
	// Note: 'unsafe-inline' and 'unsafe-eval' are needed for Svelte/SvelteKit
	const cspDirectives = [
		"default-src 'self'",
		// Scripts: self + inline for Svelte, wasm for background removal
		"script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: https://cdn.jsdelivr.net",
		// Styles: self + inline for Svelte component styles
		"style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
		// Images: self + data URIs + Supabase storage
		"img-src 'self' data: blob: https://*.supabase.co",
		// Fonts: self + Google Fonts
		"font-src 'self' https://fonts.gstatic.com",
		// Connect: self + Supabase APIs + PayMongo + imgly background-removal CDN
		"connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.paymongo.com https://staticimgly.com https://*.staticimgly.com",
		// Workers: allow blob for WASM workers (background removal)
		"worker-src 'self' blob:",
		// Frame ancestors: prevent clickjacking
		"frame-ancestors 'none'",
		// Base URI: prevent base tag hijacking
		"base-uri 'self'",
		// Form action: only allow forms to our origin
		"form-action 'self'"
	].join('; ');

	// Set baseline security headers on all responses
	// COEP/COOP enable cross-origin isolation for WebAssembly multi-threading (background removal AI)
	event.setHeaders({
		'X-Frame-Options': 'DENY',
		'X-Content-Type-Options': 'nosniff',
		'Referrer-Policy': 'strict-origin-when-cross-origin',
		'Permissions-Policy': 'geolocation=(), microphone=(), camera=(self)',
		'Cross-Origin-Embedder-Policy': 'credentialless',
		'Cross-Origin-Opener-Policy': 'same-origin',
		// SECURITY: Content Security Policy
		'Content-Security-Policy': cspDirectives,
		// SECURITY: HTTP Strict Transport Security - prevents HTTP downgrade attacks
		// Note: Only set in production to avoid issues with localhost development
		...(dev ? {} : {
			'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload'
		})
	});

	const sessionInfo = await event.locals.safeGetSession();

	// Set all info in locals - now using the fresh data from safeGetSession
	// SECURITY: Generate and set CSRF token
	const csrfTokens = generateCSRFTokens();
	event.cookies.set('csrf-token', csrfTokens.cookieToken, {
		path: '/',
		sameSite: 'strict',
		secure: !dev,
		httpOnly: true,
		maxAge: 60 * 60 // 1 hour
	});

	event.locals = {
		...event.locals,
		session: sessionInfo.session,
		user: sessionInfo.user,
		permissions: sessionInfo.permissions,
		org_id: sessionInfo.org_id ?? undefined,
		// Use the roles and emulation state computed in safeGetSession (from fresh app_metadata)
		effectiveRoles: sessionInfo.effectiveRoles || [],
		roleEmulation: sessionInfo.roleEmulation || { active: false },
		// SECURITY: Provide CSRF token to client via locals
		csrfToken: csrfTokens.headerToken
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
