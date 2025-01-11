import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'
import { sequence } from '@sveltejs/kit/hooks'
import { redirect, error as throwError } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { ADMIN_URL } from '$env/static/private'
import type { Handle } from '@sveltejs/kit'
import type { RoleEmulationData, RoleEmulationClaim, EmulatedProfile, ProfileData, LocalsSession } from '$lib/types/roleEmulation'
import { RoleConfig, type UserRole, isPublicPath, getRedirectPath, PublicPaths, isValidUserRole, shouldSkipLayout } from '$lib/auth/roleConfig'

interface SessionInfo {
  session: LocalsSession | null
  user: User | null
  profile: ProfileData | EmulatedProfile | null
  roleEmulation: RoleEmulationClaim | null
}

type GetSessionResult = {
  session: Session | null;
  error: Error | null;
  user: User | null;
  profile: ProfileData | EmulatedProfile | null;
  roleEmulation: RoleEmulationClaim | null;
}

interface AppLocals {
  supabase: SupabaseClient
  getSession: () => Promise<LocalsSession | null>
  safeGetSession: () => Promise<GetSessionResult>
  session?: LocalsSession | null
  user?: User | null
  profile?: ProfileData | EmulatedProfile | null
  special_url?: string
}

declare global {
  namespace App {
    interface Locals extends AppLocals {}
  }
}

const hostRouter: Handle = async ({ event, resolve }) => {
  const hostname = event.request.headers.get('host')?.trim();
  
  // Safety check for empty or missing hostname
  if (!hostname) {
    return resolve(event);
  }
  
  // Extract base hostname without port
  const baseHostname = hostname.split(':')[0].toLowerCase();
  
  if (baseHostname === 'dokmutyatirol.ph') {
    event.url.pathname = '/dokmutya';
    
    // Log the routing for debugging (optional)
    console.log(`[Host Router] Routing ${hostname} to ${event.url.pathname}`);
  }
  
  return resolve(event);
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

  event.locals.getSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession()
    return session
  }

  event.locals.safeGetSession = async () => {
    let session = event.locals.session
    let sessionError: Error | null = null

    if (!session) {
      try {
        const { data: { session: initialSession }, error: initialError } = 
          await event.locals.supabase.auth.getSession()
        session = initialSession
        sessionError = initialError
      } catch (err) {
        console.error('Error getting session:', err)
        sessionError = err instanceof Error ? err : new Error('Unknown error occurred')
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
        error: sessionError,
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

    if (profile?.role === 'super_admin') {
      event.locals.special_url = '/' + ADMIN_URL;
    } else {
      event.locals.special_url = '/';
    }

    if (activeEmulation && profile) {
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
      error: null,
      user,
      profile: emulatedProfile,
      roleEmulation
    }
  }

  return resolve(event)
}

async function getUserProfile(userId: string, supabase: SupabaseClient): Promise<ProfileData | null> {
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, organizations(id, name), context')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }
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

  return emulation
}

const roleEmulationGuard: Handle = async ({ event, resolve }) => {
  // const host = event.request.headers.get('host');
  // if (host === 'dokmutyatirol.ph') {
  //   return resolve(event);
  // }

  if (event.url.pathname.startsWith('/api')) {
    return resolve(event)
  }

  const sessionInfo = await event.locals.safeGetSession() as GetSessionResult

  if (sessionInfo.roleEmulation?.active) {
    const now = new Date()
    const expiresAt = new Date(sessionInfo.roleEmulation.expires_at)

    if (now > expiresAt) {
      await event.locals.supabase
        .from('role_emulation_sessions')
        .update({ status: 'expired' })
        .eq('id', sessionInfo.roleEmulation.session_id)

      event.cookies.delete('role_emulation', { path: '/' })
      if (sessionInfo.session) {
        delete (sessionInfo.session as LocalsSession).roleEmulation
      }

      throw redirect(303, event.url.pathname)
    }
  }

  return resolve(event)
}

const authGuard: Handle = async ({ event, resolve }) => {
  const path = event.url.pathname;

  // Check for public path and skip layout
  if (shouldSkipLayout(path)) {
    return resolve(event, {
      transformPageChunk: ({ html }) => html
    });
  }

  // Handle API routes
  if (path.startsWith('/api')) {
    const sessionInfo = await event.locals.safeGetSession() as GetSessionResult
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

  const sessionInfo = await event.locals.safeGetSession() as GetSessionResult

  event.locals = {
    ...event.locals,
    session: sessionInfo.session,
    user: sessionInfo.user,
    profile: sessionInfo.profile,
  }

  // Redirect to auth if no user
  if (!sessionInfo.user) {
    throw redirect(303, PublicPaths.auth);
  }

  // Validate user role
  if (!sessionInfo.profile?.role || !isValidUserRole(sessionInfo.profile.role)) {
    throw throwError(400, 'Invalid user role')
  }

  const originalRole = (sessionInfo.profile as EmulatedProfile)?.originalRole
  const context = sessionInfo.roleEmulation?.metadata?.context || sessionInfo.profile?.context || {}

  // Special handling for admin path
  if (path === `/${ADMIN_URL}` && 
      ((!originalRole && sessionInfo.profile.role === 'super_admin') || originalRole === 'super_admin')) {
    return resolve(event);
  }

  // Get redirect path based on role access
  const redirectPath = getRedirectPath(
    sessionInfo.profile.role,
    path,
    originalRole,
    context
  );

  // Handle different redirect scenarios
  if (redirectPath === PublicPaths.error) {
    event.locals = {
      ...event.locals,
      session: null,
      user: null,
      profile: null
    };
    throw throwError(404, { message: 'Not found' });
  }

  if (redirectPath === PublicPaths.auth) {
    throw throwError(403, { message: 'Forbidden' });
  }

  if (redirectPath) {
    throw redirect(303, redirectPath);
  }

  return resolve(event);
}

export const handle = sequence(hostRouter, initializeSupabase, roleEmulationGuard, authGuard)