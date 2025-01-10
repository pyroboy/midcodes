import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'
import { sequence } from '@sveltejs/kit/hooks'
import { redirect } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { ADMIN_URL } from '$env/static/private'
import type { Handle } from '@sveltejs/kit'
import type { RoleEmulationData, RoleEmulationClaim, EmulatedProfile, ProfileData, LocalsSession } from '$lib/types/roleEmulation'
import { RoleConfig, type UserRole, isPublicPath, getRedirectPath, PublicPaths } from '$lib/auth/roleConfig'

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

const domainHandler: Handle = async ({ event, resolve }) => {
  const host = event.request.headers.get('host');
  const path = event.url.pathname;

  if (host === 'dokmutyatirol.ph') {
    // If not already on /dokmutya, redirect there
    if (path !== '/dokmutya') {
      throw redirect(303, '/dokmutya');
    }
  } else if (path === '/dokmutya') {
    // If trying to access /dokmutya from a different domain, block access
    if (host !== 'dokmutyatirol.ph') {
      throw redirect(303, '/');
    }
  }

  return resolve(event);
}

function isValidUserRole(role: string): role is UserRole {
  return Object.keys(RoleConfig).includes(role as UserRole)
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

  if (emulation) {
    // console.log('[Session] Emulated Role:', emulation.emulated_role)
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

const { error: throwError } = await import('@sveltejs/kit');

const authGuard: Handle = async ({ event, resolve }) => {
  // Skip auth check for dokmutyatirol.ph domain
  const host = event.request.headers.get('host');
  if (host === 'dokmutyatirol.ph') {
    return resolve(event);
  }

  if (event.url.pathname.startsWith('/api')) {
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

  const path = event.url.pathname
  const isAuthPath = path === '/auth'

  const sessionInfo = await event.locals.safeGetSession() as GetSessionResult

  event.locals = {
    ...event.locals,
    session: sessionInfo.session,
    user: sessionInfo.user,
    profile: sessionInfo.profile,
  }

  if (!sessionInfo.user) {
    if (isPublicPath(path)) {
      return resolve(event);
    }
    
    if (!isAuthPath) {
      throw redirect(303, `/auth`);
    }
    return resolve(event);
  }

  if (isAuthPath && sessionInfo.profile?.role && isValidUserRole(sessionInfo.profile.role)) {
    if (sessionInfo.profile.role === 'super_admin') {
      throw redirect(303, `/${ADMIN_URL}`);
    }
    const config = RoleConfig[sessionInfo.profile.role as UserRole];
    if (config) {
      throw redirect(303, config.defaultPath(sessionInfo.profile.context));
    }
  }

  if (isPublicPath(path)) {
    return resolve(event);
  }

  if (!sessionInfo.profile?.role || !isValidUserRole(sessionInfo.profile.role)) {
    throw throwError(400, 'Invalid user role')
  }

  const originalRole = (sessionInfo.profile as EmulatedProfile)?.originalRole
  const context = sessionInfo.roleEmulation?.metadata?.context || sessionInfo.profile?.context || {}

  if (path === `/${ADMIN_URL}` && 
      ((!originalRole && sessionInfo.profile.role === 'super_admin') || originalRole === 'super_admin')) {
    return resolve(event);
  }

  const redirectPath = getRedirectPath(
    sessionInfo.profile.role,
    path,
    originalRole,
    context
  );

  if (redirectPath === PublicPaths.auth) {
    throw throwError(404, { message: 'Not found' });
  }

  if (redirectPath) {
    throw redirect(303, redirectPath)
  }

  return resolve(event)
}

const roleEmulationGuard: Handle = async ({ event, resolve }) => {
  // Skip role emulation check for dokmutyatirol.ph domain
  const host = event.request.headers.get('host');
  if (host === 'dokmutyatirol.ph') {
    return resolve(event);
  }

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

export const handle = sequence(domainHandler, initializeSupabase, roleEmulationGuard, authGuard)
