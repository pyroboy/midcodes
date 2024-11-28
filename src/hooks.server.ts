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

  // Get user profile if authenticated
  let profile = null
  if (user) {
    const { data: profileData } = await event.locals.supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    profile = profileData
  }
  event.locals.profile = profile

  const path = event.url.pathname
  const eventUrlMatch = path.match(/^\/([^/]+)/)
  const eventUrl = eventUrlMatch ? eventUrlMatch[1] : null
  
  // Allow access to auth routes for public
  if (path.startsWith('/auth')) {
    // If user is already authenticated, redirect them away from auth pages
    if (session && path === '/auth') {
      throw redirect(303, '/')
    }
    return resolve(event)
  }

  const isPublicEventPath = eventUrl && (
    path.endsWith('/register') || 
    path.match(/\/EVNT-\d{4}-[A-Z0-9]{5}$/) // matches /EVNT-YYMM-XXXXX at the end
  )

  // Allow public access to registration and reference number pages
  if (isPublicEventPath) {
    return resolve(event)
  }

  // Require authentication for all other routes
  if (!session) {
    throw redirect(303, '/auth')
  }

  // For QR checker role, only allow access to /qr-checker route
  if (profile?.role === 'event_qr_checker') {
    if (!path.endsWith('/qr-checker')) {
      throw redirect(303, `/${eventUrl}/qr-checker`)
    }
    return resolve(event)
  }

  // Allow admins to access all routes
  const adminRoles = ['super_admin', 'org_admin', 'event_admin']
  if (profile?.role && adminRoles.includes(profile.role)) {
    return resolve(event)
  }

  // For regular users, restrict access as needed
  // Add any additional role-based restrictions here

  return resolve(event)
}

export const handle: Handle = sequence(supabase, authGuard)
