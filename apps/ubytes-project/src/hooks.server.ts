import { createServerClient } from '@supabase/ssr'
import type { AuthSession } from '@supabase/supabase-js'
import { type Handle, redirect } from '@sveltejs/kit'
import { sequence } from '@sveltejs/kit/hooks'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

// Cache configuration
const CACHE_ROUTES = ['/departments', '/tabulation','/events','/results','/log'];
const DEFAULT_CACHE_TIME = 120; // 2 minutes
const CACHE_CONTROL_VALUE = 'public, max-age=120, must-revalidate'; // 2 minutes with revalidation

const handleCache: Handle = async ({ event, resolve }) => {
  // Skip caching for non-GET requests
  if (event.request.method !== 'GET') {
    return resolve(event);
  }

  // Check if the route should be cached
  const shouldCache = CACHE_ROUTES.some(route => event.url.pathname.startsWith(route));
  
  if (shouldCache) {
    // Set cache headers
    event.setHeaders({
      'Cache-Control': CACHE_CONTROL_VALUE,
      'CDN-Cache-Control': CACHE_CONTROL_VALUE,
      'Surrogate-Control': 'public, max-age=180', // CDN cache for 3 minutes
      'Vary': 'Accept, Authorization', // Vary cache based on these headers
      'stale-while-revalidate': '60' // Allow serving stale content while fetching new data
    });
  }

  const response = await resolve(event);
  return response;
};

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
      return name === 'content-range' || name === 'x-supabase-api-version'
    },
  })
}

const authGuard: Handle = async ({ event, resolve }) => {
  const { session, user } = await event.locals.safeGetSession()
  event.locals.session = session
  event.locals.user = user

  if (session && user) {
    try {
      const { data: profile, error: profileError } = await event.locals.supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

      if (profileError) {
        console.error('Error fetching profile:', profileError)
        event.locals.profile = null
      } else {
        event.locals.profile = profile
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error)
      event.locals.profile = null
    }
  } else {
    event.locals.profile = null
  }

  // Redirect logic
  if (!session && event.url.pathname !== '/auth/signin' && event.url.pathname !== '/results') {
    throw redirect(303, '/auth/signin')
  }

  if (session && event.url.pathname === '/auth/signin') {
    throw redirect(303, '/')
  }

  return resolve(event)
}

export const handle: Handle = sequence(handleCache, supabase, authGuard)
