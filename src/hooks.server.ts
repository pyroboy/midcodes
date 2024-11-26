import { createServerClient } from '@supabase/ssr'
import type { AuthSession } from '@supabase/supabase-js'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

const supabase: Handle = async ({ event, resolve }) => {
  // Maintenance mode check
  // Set up Supabase client
  event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => event.cookies.getAll(),
      setAll: (cookiesToSet) => {
        cookiesToSet.forEach(({ name, value, options }) => {
          event.cookies.set(name, value, { ...options, path: '/' })
        })
      },
    },
  })

  // Helper function to get the session safely
  event.locals.safeGetSession = async () => {
    const {
      data: { user },
      error: userError,
    } = await event.locals.supabase.auth.getUser()

    if (userError || !user) {
      return { session: null, user: null }
    }

    const session: AuthSession = {
      access_token: event.cookies.get('sb-access-token') || '',
      refresh_token: event.cookies.get('sb-refresh-token') || '',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user,
    }

    return { session, user }
  }

  return resolve(event, {
    filterSerializedResponseHeaders(name) {
      return name === 'content-range'
    }
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user

  // Protect routes that require authentication
  if (!session && (
    event.url.pathname.startsWith('/protected') || 
    event.url.pathname.startsWith('/use-template') ||
    event.url.pathname.startsWith('/templates')
  )) {
    throw redirect(303, '/auth');
  }

  if (session && event.url.pathname === '/auth') {
    throw redirect(303, '/');
  }

  return resolve(event)
}

export const handle: Handle = sequence(supabase, authGuard)
