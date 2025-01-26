import { createServerClient } from '@supabase/ssr'
import type { User, Session } from '@supabase/supabase-js'
import { sequence } from '@sveltejs/kit/hooks'
import { redirect, error as throwError } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Handle } from '@sveltejs/kit'
import { jwtDecode } from 'jwt-decode'
import type { UserJWTPayload } from '$lib/types/auth'

const initializeSupabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) => {
          try {
            event.cookies.set(key, value, {
              ...options,
              path: '/',
              sameSite: 'lax',
              secure: process.env.NODE_ENV === 'production'
            })
          } catch (error) {
            console.error('Cookie could not be set:', error)
          }
        },
        remove: (key, options) => {
          try {
            event.cookies.delete(key, { path: '/', ...options })
          } catch (error) {
            console.error('Cookie could not be removed:', error)
          }
        }
      }
    }
  )

  event.locals.safeGetSession = async () => {
    // Parallel fetch of user and session data
    const [userResponse, sessionResponse] = await Promise.all([
      event.locals.supabase.auth.getUser(),
      event.locals.supabase.auth.getSession()
    ]);

    const { data: { user }, error: userError } = userResponse;
    const { data: { session: initialSession }, error: sessionError } = sessionResponse;

    if (userError || !user) {
      return {
        session: null,
        error: userError || new Error('User not authenticated'),
        user: null,
        decodedToken: null,
        permissions: []
      };
    }

    if (sessionError || !initialSession) {
      return {
        session: null,
        error: sessionError || new Error('Invalid session'),
        user: null,
        decodedToken: null,
        permissions: []
      };
    }

    let currentSession = initialSession;
    if (currentSession.expires_at) {
      const expiresAt = Math.floor(new Date(currentSession.expires_at).getTime() / 1000);
      const now = Math.floor(Date.now() / 1000);

      if (now > expiresAt) {
        try {
          const { data: { session: refreshedSession }, error } = 
            await event.locals.supabase.auth.setSession({
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

    let decodedToken: UserJWTPayload | null = null;
    try {
      decodedToken = jwtDecode(currentSession.access_token) as UserJWTPayload;
    } catch (err) {
      console.error('Failed to decode JWT:', err);
    }

    return {
      session: currentSession,
      error: null,
      user,
      decodedToken,
      permissions: []
    };
  };

  return resolve(event);
};

const authGuard: Handle = async ({ event, resolve }) => {
  const { pathname } = event.url;
  const { session } = await event.locals.safeGetSession();

  const publicRoutes = ['/auth', '/auth/forgot-password', '/auth/reset-password'];
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

  if (!session && !isPublicRoute) {
    throw redirect(303, `/auth?returnTo=${pathname}`);
  }

  if (session && pathname === '/auth') {
    throw redirect(303, '/');
  }

  return resolve(event);
};

export const handle = sequence(initializeSupabase, authGuard);
