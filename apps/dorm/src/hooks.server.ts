/// file: src/hooks.server.ts
import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'
import { sequence } from '@sveltejs/kit/hooks'
import { redirect, error as throwError } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { PRIVATE_ADMIN_URL } from '$env/static/private'
import type { Handle } from '@sveltejs/kit'
// import { ProfileData } from '../../web/src/lib/types/roleEmulation';
import type { 
  ProfileData, 
  LocalsSession 
} from '$lib/types/roleEmulation'
import { 
  isPublicPath, 
  getRedirectPath, 
  PublicPaths, 
  isValidUserRole, 
  shouldSkipLayout 
} from '$lib/auth/roleConfig'

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes
const SESSION_CACHE_TTL = 60 * 1000 // 1 minute

// Module-level caches using state
const sessionCache = $state(new Map<string, { data: GetSessionResult; timestamp: number }>())
const profileCache = $state(new Map<string, { data: ProfileData | null; timestamp: number }>())

type GetSessionResult = {
  session: Session | null
  error: Error | null
  user: User | null
  profile: ProfileData | null
}

interface AppLocals {
  supabase: SupabaseClient
  getSession: () => Promise<LocalsSession | null>
  safeGetSession: () => Promise<GetSessionResult>
  session?: LocalsSession | null
  user?: User | null
  profile?: ProfileData  | null
  special_url?: string
}

declare global {
  namespace App {
    interface Locals extends AppLocals {}
  }
}

// Cleanup effect for cache management
$effect(() => {
  const cleanup = setInterval(() => {
    const now = Date.now()
    
    // Clean session cache
    for (const [key, value] of sessionCache) {
      if (now - value.timestamp > SESSION_CACHE_TTL) {
        sessionCache.delete(key)
      }
    }
    
    // Clean profile cache
    for (const [key, value] of profileCache) {
      if (now - value.timestamp > CACHE_TTL) {
        profileCache.delete(key)
      }
    }
    

  }, CACHE_TTL)

  return () => clearInterval(cleanup)
})

const isDokmutyaDomain = (host?: string | null): boolean => {
  if (!host) return false
  const baseHostname = host.split(':')[0].replace(/^www\./, '')
  return baseHostname === 'dokmutyatirol.ph'
}

const hostRouter: Handle = async ({ event, resolve }) => {
  const isDev = process.env.NODE_ENV === 'development'
  const originalHost = event.request.headers.get('host')?.trim().toLowerCase()
  const host = isDev ? 'dokmutyatirol.ph' : originalHost
  
  if (isDokmutyaDomain(host) && event.url.pathname === '/') {
    return resolve(event, {
      transformPageChunk: ({ html }) => html.replace(
        '<div id="app">',
        '<div id="app" data-dokmutya="true">'
      )
    })
  }
  
  return resolve(event)
}

async function getUserProfile(userId: string, supabase: SupabaseClient): Promise<ProfileData | null> {
  const now = Date.now()
  const cachedProfile = profileCache.get(userId)
  
  if (cachedProfile && (now - cachedProfile.timestamp) < CACHE_TTL) {
    return cachedProfile.data
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, organizations(id, name), context')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    profileCache.set(userId, { data: null, timestamp: now })
    return null
  }

  profileCache.set(userId, { data: profile, timestamp: now })
  return profile
}


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
            console.debug('Cookie could not be set:', error)
          }
        },
        remove: (key, options) => {
          try {
            event.cookies.delete(key, { path: '/', ...options })
          } catch (error) {
            console.debug('Cookie could not be removed:', error)
          }
        }
      }
    }
  )

  event.locals.getSession = async () => {
    const { data: { user }, error: userError } = await event.locals.supabase.auth.getUser()
    if (userError || !user) return null
    
    const { data: { session }, error: sessionError } = await event.locals.supabase.auth.getSession()
    if (sessionError) return null
    
    return session
  }

  event.locals.safeGetSession = async () => {
    const sessionId = event.locals.session?.access_token || 'anonymous'
    const now = Date.now()

    const cachedSession = sessionCache.get(sessionId)
    if (cachedSession && (now - cachedSession.timestamp) < SESSION_CACHE_TTL) {
      return cachedSession.data
    }

    const { data: { user }, error: userError } = await event.locals.supabase.auth.getUser()
    
    if (userError || !user) {
      const result: GetSessionResult = {
        session: null,
        error: userError || new Error('User not authenticated'),
        user: null,
        profile: null,
      }
      sessionCache.set(sessionId, { data: result, timestamp: now })
      return result
    }

    const { data: { session: initialSession }, error: sessionError } = await event.locals.supabase.auth.getSession()
    
    if (sessionError || !initialSession) {
      const result: GetSessionResult = {
        session: null,
        error: sessionError || new Error('Invalid session'),
        user: null,
        profile: null,
      }
      sessionCache.set(sessionId, { data: result, timestamp: now })
      return result
    }

    let currentSession = initialSession
    if (currentSession.expires_at) {
      const expiresAt = Math.floor(new Date(currentSession.expires_at).getTime() / 1000)
      const now = Math.floor(Date.now() / 1000)

      if (now > expiresAt) {
        try {
          const { data: { session: refreshedSession }, error } = 
            await event.locals.supabase.auth.setSession({
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token
            })

          if (!error && refreshedSession) {
            currentSession = refreshedSession
          }
        } catch (err) {
          const result: GetSessionResult = {
            session: null,
            error: err instanceof Error ? err : new Error('Session refresh failed'),
            user: null,
            profile: null,
          }
          sessionCache.set(sessionId, { data: result, timestamp: now })
          return result
        }
      }
    }

    const [profile] = await Promise.all([
      getUserProfile(user.id, event.locals.supabase),
    ])


    if (profile?.role === 'super_admin') {
      event.locals.special_url = '/' + PRIVATE_ADMIN_URL
    } else {
      event.locals.special_url = '/'
    }

   

    const result: GetSessionResult = {
      session: currentSession,
      error: null,
      user,
      profile
    }
    sessionCache.set(sessionId, { data: result, timestamp: now })
    return result
  }

  return resolve(event)
}


const authGuard: Handle = async ({ event, resolve }) => {
  const isDev = process.env.NODE_ENV === 'development'
  const host = isDev ? 'dokmutyatirol.ph' : event.request.headers.get('host')?.trim().toLowerCase()
  
  if (isDokmutyaDomain(host) || event.url.pathname.startsWith('/dokmutya')) {
    return resolve(event)
  }

  if (shouldSkipLayout(event.url.pathname)) {
    return resolve(event, {
      transformPageChunk: ({ html }) => html
    })
  }

  if (event.url.pathname.startsWith('/api')) {
    const sessionInfo = await event.locals.safeGetSession()
    if (!sessionInfo.user) {
      throw throwError(401, 'Unauthorized')
    }
    event.locals = {
      ...event.locals,
      session: sessionInfo.session,
      user: sessionInfo.user
    }
    return resolve(event)
  }

  const sessionInfo = await event.locals.safeGetSession()

  event.locals = {
    ...event.locals,
    session: sessionInfo.session,
    user: sessionInfo.user,
    profile: sessionInfo.profile,
  }

  if (!sessionInfo.user) {
    throw redirect(303, PublicPaths.auth)
  }

  if (!sessionInfo.profile?.role || !isValidUserRole(sessionInfo.profile.role)) {
    throw throwError(400, 'Invalid user role')
  }

  // const originalRole = (sessionInfo.profile as ProfileData)?.originalRole
  const context = sessionInfo.profile?.context 

  if (sessionInfo.profile.role === 'super_admin') {
    if (event.url.pathname === `/${PRIVATE_ADMIN_URL}`) {
      return resolve(event)
    }
    if (event.url.pathname === '/') {
      throw redirect(303, `/${PRIVATE_ADMIN_URL}`)
    }
  }

  const redirectPath = getRedirectPath(
    sessionInfo.profile.role,
    event.url.pathname,
    context
  )

  if (redirectPath === PublicPaths.error) {
    event.locals = {
      ...event.locals,
      session: null,
      user: null,
      profile: null
    }
    throw throwError(404, { message: 'Not found' })
  }

  if (redirectPath === PublicPaths.auth) {
    throw throwError(403, { message: 'Forbidden' })
  }

  if (redirectPath) {
    throw redirect(303, redirectPath)
  }

  return resolve(event)
}

// Export the sequence of hooks
export const handle = sequence(hostRouter, initializeSupabase, authGuard)