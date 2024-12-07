import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'
import { sequence } from '@sveltejs/kit/hooks'
import { redirect, error } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Handle } from '@sveltejs/kit'
import type { RoleEmulationData, RoleEmulationClaim, EmulatedProfile, ProfileData, LocalsSession } from '$lib/types/roleEmulation'
import { RoleConfig, isPublicPath, hasPathAccess, getRedirectPath } from '$lib/auth/roleConfig'
import type { UserRole } from '$lib/auth/roleConfig'

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
    .select('*, organizations(id, name)')
    .eq('id', userId)
    .single()
    
  return profile
}

async function getActiveRoleEmulation(userId: string, supabase: SupabaseClient) {
  const { data: emulation } = await supabase
    .from('role_emulation_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .single()

  if (emulation) {
    console.log('[Session] Emulated Role:', 
     emulation.emulated_role
    )
  }
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
      // Fetch organization name
      const { data: org } = await event.locals.supabase
        .from('organizations')
        .select('name')
        .eq('id', activeEmulation.emulated_org_id)
        .single();

      roleEmulation = {
        active: true,
        original_role: activeEmulation.original_role,
        emulated_role: activeEmulation.emulated_role,
        original_org_id: profile.organization_id || null,
        emulated_org_id: activeEmulation.emulated_org_id,
        expires_at: activeEmulation.expires_at,
        session_id: activeEmulation.id,
        metadata: activeEmulation.metadata,
        organizationName: org?.name ?? null
      }

      emulatedProfile = {
        ...profile,
        role: activeEmulation.emulated_role,
        originalRole: profile.role,
        isEmulated: true
      } as EmulatedProfile

      ;(session as LocalsSession).roleEmulation = roleEmulation
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

const authGuard: Handle = async ({ event, resolve }) => {
  console.log('\n[Auth Guard] ----------------');
  console.log('1. Request:', {
    url: event.url.pathname,
    method: event.request.method,
    headers: Object.fromEntries(event.request.headers)
  });

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
  const { user, profile, session, roleEmulation } = sessionInfo

  console.log('2. Session:', {
    userId: user?.id,
    role: profile?.role,
    emulation: roleEmulation
  });

  // Update locals with session info
  event.locals = {
    ...event.locals,
    session,
    user,
    profile,
  }

  // Handle authentication
  if (!user) {
    // Check if path is public first
    if (isPublicPath(path)) {
      return resolve(event);
    }
    
    // Unauthenticated users can only access /auth
    if (!isAuthPath) {
      const returnTo = event.url.pathname;
      throw redirect(303, `/auth`);
    }
    return resolve(event);
  }

  // Authenticated users shouldn't stay on /auth
  if (isAuthPath && profile?.role && isValidUserRole(profile.role)) {
    const config = RoleConfig[profile.role];
    if (config) {
      throw redirect(303, config.defaultPath(profile.context));
    }
  }

  // Public paths are accessible to all users
  if (isPublicPath(path)) {
    return resolve(event);
  }

  // Check if user has a valid role
  if (!profile?.role || !isValidUserRole(profile.role)) {
    throw error(400, 'Invalid user role')
  }

  // Log access (except favicon)
  if (!path.endsWith('/favicon.ico')) {
    // console.log(`[AuthGuard] ${path} | User: ${user.id} | Role: ${profile.role}${(profile as EmulatedProfile)?.isEmulated ? ' (Emulated)' : ''}`)
  }

  // Check path access and redirect if necessary
  const originalRole = (profile as EmulatedProfile)?.originalRole
  const context = roleEmulation?.metadata?.context || profile?.context || {}
  const redirectPath = originalRole 
    ? getRedirectPath(profile.role, path, originalRole, context) 
    : getRedirectPath(profile.role, path, undefined, context)
  
  console.log('3. Access Check:', {
    path,
    hasAccess: !redirectPath,
    redirectPath: redirectPath || 'none',
    role: profile?.role,
    originalRole
  });

  if (redirectPath) {
    console.log('4. Redirecting to:', redirectPath);
    throw redirect(303, redirectPath)
  }

  console.log('[Auth Guard End] ----------------\n');

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
        .from('role_emulation_sessions')
        .update({ status: 'expired' })
        .eq('id', roleEmulation.session_id)

      // Clear role emulation cookie and session data
      event.cookies.delete('role_emulation', { path: '/' })
      if (session) {
        delete (session as LocalsSession).roleEmulation
      }

      // Redirect to refresh the page state
      throw redirect(303, event.url.pathname)
    }
  }

  return resolve(event)
}

export const handle = sequence(initializeSupabase, roleEmulationGuard, authGuard)