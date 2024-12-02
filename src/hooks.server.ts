import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'
import { sequence } from '@sveltejs/kit/hooks'
import { redirect, error } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Handle } from '@sveltejs/kit'
import type { RoleEmulationData, RoleEmulationClaim, EmulatedProfile, ProfileData, LocalsSession } from '$lib/types/roleEmulation'
import { RoleConfig } from '$lib/auth/roleConfig'
import type { UserRole } from '$lib/types/database'

const ADMIN_URL = '/admin'

interface SessionInfo {
  session: LocalsSession | null
  user: User | null
  profile: ProfileData | EmulatedProfile | null
  roleEmulation: RoleEmulationClaim | null
}

interface Locals {
  supabase: SupabaseClient
  getSession: () => Promise<LocalsSession | null>
  safeGetSession: () => Promise<SessionInfo>
  session?: LocalsSession | null
  user?: User | null
  profile?: ProfileData | EmulatedProfile | null
}

function isValidUserRole(role: string): role is UserRole {
  const validRoles: UserRole[] = ['super_admin', 'org_admin', 'event_admin', 'user', 'event_qr_checker']
  return validRoles.includes(role as UserRole)
}

async function getUserProfile(userId: string, supabase: SupabaseClient): Promise<ProfileData | null> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return profile
}

async function getActiveRoleEmulation(userId: string, supabase: SupabaseClient) {
  const { data: emulation } = await supabase
    .from('auth.role_emulation_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  return emulation
}

const initializeSupabase: Handle = async ({ event, resolve }) => {
  event.locals.supabase = createServerClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get: (key) => event.cookies.get(key),
        set: (key, value, options) => {
          event.cookies.set(key, value, { 
            ...options,
            path: '/',
            sameSite: 'lax',
            secure: true
          })
        },
        remove: (key, options) => event.cookies.delete(key, { path: '/', ...options })
      }
    }
  )

  event.locals.safeGetSession = async (): Promise<SessionInfo> => {
    let session = event.locals.session
    let sessionError = null

    if (!session) {
      try {
        const { data: { session: initialSession }, error: initialError } = 
          await event.locals.supabase.auth.getSession()
        session = initialSession
        sessionError = initialError
      } catch (err) {
        console.error('Error getting session:', err)
        sessionError = err
      }
    }

    // Refresh session if access token is expired
    if (session?.expires_at) {
      const expiresAt = Math.floor(new Date(session.expires_at).getTime() / 1000)
      const now = Math.floor(Date.now() / 1000)

      if (now > expiresAt) {
        try {
          const { access_token, refresh_token } = session

          const { data: { session: refreshedSession }, error } = 
            await event.locals.supabase.auth.setSession({
              access_token,
              refresh_token
            })

          if (!error && refreshedSession) {
            session = refreshedSession
          }
        } catch (err) {
          console.error('Error refreshing session:', err)
        }
      }
    }

    if (sessionError || !session?.user) {
      return {
        session: null,
        user: null,
        profile: null,
        roleEmulation: null
      }
    }

    const user = session.user
    const [profile, activeEmulation] = await Promise.all([
      getUserProfile(user.id, event.locals.supabase),
      getActiveRoleEmulation(user.id, event.locals.supabase)
    ])

    let emulatedProfile = profile
    let roleEmulation: RoleEmulationClaim | null = null

    if (activeEmulation && profile) {
      roleEmulation = {
        active: true,
        original_role: activeEmulation.original_role,
        emulated_role: activeEmulation.emulated_role,
        expires_at: activeEmulation.expires_at,
        session_id: activeEmulation.id
      }

      emulatedProfile = {
        ...profile,
        role: activeEmulation.emulated_role,
        originalRole: profile.role,
        isEmulated: true
      } as EmulatedProfile

      ;(session as LocalsSession).role_emulation = {
        targetRole: activeEmulation.emulated_role,
        durationHours: 4
      } as RoleEmulationData
    }

    return {
      session,
      user,
      profile: emulatedProfile,
      roleEmulation
    }
  }

  return resolve(event)
}

const isPublicPath = (path: string): boolean => {
  if (path.startsWith('/auth')) return true
  
  const eventUrlMatch = path.match(/^\/([^/]+)/)
  const eventUrl = eventUrlMatch ? eventUrlMatch[1] : null
  
  return !!(eventUrl && (
    path.endsWith('/register') || 
    path.match(/\/EVNT-\d{4}-[A-Z0-9]{5}$/)
  ))
}

function hasPathAccess(role: UserRole, path: string, originalRole?: UserRole): boolean {
  console.log(`[hasPathAccess] Checking if ${role} can access ${path}${originalRole ? ` (original role: ${originalRole})` : ''}`)

  // Special case for super_admin role emulation
  if (path.startsWith(ADMIN_URL) && originalRole === 'super_admin') {
    console.log(`[hasPathAccess] Allowing ${path} due to super_admin original role`)
    return true
  }

  const roleConfig = RoleConfig[role]
  if (!roleConfig) {
    console.log(`[hasPathAccess] No config found for role ${role}`)
    return false
  }
  
  // Full access patterns
  if (roleConfig.allowedPaths.some(ap => ap.path === '*' || ap.path === '/**')) {
    console.log(`[hasPathAccess] Full access granted to ${role}`)
    return true
  }
  
  // Clean up path for matching
  const cleanPath = path.replace(/\/$/, '')  // Remove trailing slash
  
  // Check each allowed path pattern
  for (const allowedPath of roleConfig.allowedPaths) {
    const pattern = allowedPath.path
      .replace(/\/$/, '')  // Remove trailing slash
    
    // Exact match
    if (cleanPath === pattern) {
      console.log(`[hasPathAccess] Exact match: ${cleanPath} = ${pattern}`)
      return true
    }
    
    // Direct child match (for single *)
    if (pattern.endsWith('/*')) {
      const prefix = pattern.slice(0, -1)  // Remove /*
      if (cleanPath === prefix || cleanPath.startsWith(prefix + '/')) {
        console.log(`[hasPathAccess] Direct child match: ${cleanPath} matches ${pattern}`)
        return true
      }
    }
    
    // Deep match (for **)
    if (pattern.includes('**')) {
      const regex = new RegExp(
        '^' + pattern
          .replace(/\*\*/g, '.*')
          .replace(/\*/g, '[^/]*')
          + '(/.*)?$'
      )
      if (regex.test(cleanPath)) {
        console.log(`[hasPathAccess] Deep match: ${cleanPath} matches ${pattern}`)
        return true
      }
    }
  }

  console.log(`[hasPathAccess] No matching pattern found for ${cleanPath}`)
  return false
}

const getRedirectPath = (role: UserRole, path: string, originalRole?: UserRole): string | null => {
  const roleConfig = RoleConfig[role]
  if (!roleConfig) {
    console.log(`[getRedirectPath] No config for role ${role}, redirecting to /auth`)
    return '/auth'
  }
  
  // Don't redirect if user has access to the path
  if (hasPathAccess(role, path, originalRole)) {
    console.log(`[getRedirectPath] User ${role} has access to ${path}, no redirect needed`)
    return null
  }

  // Make sure the default redirect is accessible
  const defaultRedirect = roleConfig.defaultRedirect
  if (!hasPathAccess(role, defaultRedirect, originalRole)) {
    console.error(`[getRedirectPath] Default redirect ${defaultRedirect} for role ${role} is not accessible! Redirecting to /auth`)
    return '/auth'
  }
  
  // Don't redirect to the same path (avoid loops)
  if (path === defaultRedirect) {
    console.error(`[getRedirectPath] Cannot redirect to ${defaultRedirect} because user ${role} doesn't have access to it! Redirecting to /auth`)
    return '/auth'
  }

  console.log(`[getRedirectPath] User ${role} does not have access to ${path}, redirecting to ${defaultRedirect}`)
  return defaultRedirect
}

const authGuard: Handle = async ({ event, resolve }) => {
  // For API routes, only check basic authentication
  if (event.url.pathname.startsWith('/api')) {
    const sessionInfo = await event.locals.safeGetSession()
    const { user, session } = sessionInfo
    
    if (!user) {
      throw error(401, 'Unauthorized')
    }
    
    event.locals = {
      ...event.locals,
      session,
      user
    }
    
    return resolve(event)
  }

  const path = event.url.pathname
  const isAuthPath = path === '/auth'

  // Get session info
  const sessionInfo = await event.locals.safeGetSession()
  const { user, profile, session } = sessionInfo

  // Update locals with session info
  event.locals = {
    ...event.locals,
    session,
    user,
    profile
  }

  // Handle authentication
  if (!user) {
    // Unauthenticated users can only access /auth
    if (!isAuthPath) {
      throw redirect(303, '/auth')
    }
    return resolve(event)
  }

  // Authenticated users shouldn't stay on /auth
  if (isAuthPath && profile?.role && isValidUserRole(profile.role)) {
    const config = RoleConfig[profile.role]
    if (config) {
      throw redirect(303, config.defaultRedirect)
    }
  }

  // Public paths are accessible to all authenticated users
  if (isPublicPath(path)) {
    return resolve(event)
  }

  // Check if user has a valid role
  if (!profile?.role || !isValidUserRole(profile.role)) {
    throw error(400, 'Invalid user role')
  }

  // Log access (except favicon)
  if (!path.endsWith('/favicon.ico')) {
    console.log(`[AuthGuard] ${path} | User: ${user.id} | Role: ${profile.role}${(profile as EmulatedProfile)?.isEmulated ? ' (Emulated)' : ''}`)
  }

  // Check path access and redirect if necessary
  const originalRole = (profile as EmulatedProfile).originalRole
  const redirectPath = getRedirectPath(profile.role, path, originalRole)
  if (redirectPath) {
    throw redirect(303, redirectPath)
  }

  return resolve(event)
}

const roleEmulationGuard: Handle = async ({ event, resolve }) => {
  // Skip check for API routes
  if (event.url.pathname.startsWith('/api')) {
    return resolve(event)
  }

  const sessionInfo = await event.locals.safeGetSession()
  const { roleEmulation, session } = sessionInfo

  if (roleEmulation?.active) {
    const now = new Date()
    const expiresAt = new Date(roleEmulation.expires_at)

    if (now > expiresAt) {
      // Mark session as expired in database
      await event.locals.supabase
        .from('auth.role_emulation_sessions')
        .update({ status: 'expired' })
        .eq('id', roleEmulation.session_id)

      // Clear role emulation cookie and session data
      event.cookies.delete('role_emulation', { path: '/' })
      if (session) {
        delete (session as LocalsSession).role_emulation
      }

      // Redirect to refresh the page state
      throw redirect(303, event.url.pathname)
    }
  }

  return resolve(event)
}

export const handle = sequence(initializeSupabase, roleEmulationGuard, authGuard)