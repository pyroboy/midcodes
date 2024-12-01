import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User } from '@supabase/supabase-js'
import { sequence } from '@sveltejs/kit/hooks'
import { redirect, error } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import type { Handle } from '@sveltejs/kit'
import type { ProfileData, EmulatedProfile, LocalsSession, RoleEmulationClaim, RoleEmulationData } from '$lib/types/roleEmulation'
import type { UserRole } from '$lib/types/database'
import { RoleConfig } from '$lib/auth/roleConfig'

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
    const {
      data: { user },
      error: userError,
    } = await event.locals.supabase.auth.getUser()

    if (userError || !user) {
      return {
        session: null,
        user: null,
        profile: null,
        roleEmulation: null
      }
    }

    const session: LocalsSession = {
      access_token: event.cookies.get('sb-access-token') || '',
      refresh_token: event.cookies.get('sb-refresh-token') || '',
      expires_in: 3600,
      expires_at: Date.now() + 3600000,
      token_type: 'bearer',
      user
    }

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

      session.role_emulation = {
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
  if (path.startsWith(ADMIN_URL) && originalRole === 'super_admin') {
    return true
  }

  const roleConfig = RoleConfig[role]
  if (!roleConfig) return false
  
  if (roleConfig.allowedPaths.some(ap => ap.path === '*' || ap.path === '/**')) return true
  
  return roleConfig.allowedPaths.some((allowedPath) => {
    const pathPattern = allowedPath.path
    if (path === pathPattern) return true
    if (path === `${pathPattern}/` || path === pathPattern.slice(0, -1)) return true
    if (path.startsWith(`${pathPattern}/`)) return true
    return false
  })
}

const getRedirectPath = (role: UserRole, path: string, originalRole?: UserRole): string | null => {
  const roleConfig = RoleConfig[role]
  if (!roleConfig) return '/auth'
  
  if (!hasPathAccess(role, path, originalRole)) {
    return roleConfig.defaultRedirect
  }
  
  return null
}

const authGuard: Handle = async ({ event, resolve }) => {
  const sessionInfo = await event.locals.safeGetSession()
  const { user, profile } = sessionInfo

  if (!user) {
    if (event.url.pathname !== '/auth') {
      throw redirect(303, '/auth')
    }
    return resolve(event)
  }

  const path = event.url.pathname

  if (!path.endsWith('/favicon.ico')) {
    console.log(`[AuthGuard] ${path} | User: ${user.id} | Role: ${profile?.role}${(profile as EmulatedProfile)?.isEmulated ? ' (Emulated)' : ''}`)
  }

  if (isPublicPath(path)) {
    if (user && path === '/auth' && event.request.method === 'GET' && profile?.role) {
      if (isValidUserRole(profile.role)) {
        const config = RoleConfig[profile.role]
        if (config) {
          throw redirect(303, config.defaultRedirect)
        }
      }
    }
    return resolve(event)
  }

  if (!path.startsWith('/api')) {
    if (!profile?.role) {
      throw redirect(303, '/auth')
    }

    event.locals = {
      ...event.locals,
      session: sessionInfo.session,
      user,
      profile
    }

    if (!isValidUserRole(profile.role)) {
      throw error(400, 'Invalid user role')
    }

    const originalRole = (profile as EmulatedProfile).originalRole
    const redirectPath = getRedirectPath(profile.role, path, originalRole)
    if (redirectPath) {
      throw redirect(303, redirectPath)
    }
  } else {
    event.locals = {
      ...event.locals,
      session: sessionInfo.session,
      user
    }
  }

  return resolve(event)
}

const roleEmulationGuard: Handle = async ({ event, resolve }) => {
  const sessionInfo = await event.locals.safeGetSession()
  const { roleEmulation } = sessionInfo

  if (roleEmulation?.active) {
    const now = new Date()
    const expiresAt = new Date(roleEmulation.expires_at)

    if (now > expiresAt) {
      await event.locals.supabase
        .from('auth.role_emulation_sessions')
        .update({ status: 'expired' })
        .eq('id', roleEmulation.session_id)

      event.cookies.delete('role_emulation', { path: '/' })
      throw redirect(303, event.url.pathname)
    }
  }

  return resolve(event)
}

export const handle = sequence(initializeSupabase, roleEmulationGuard, authGuard)