import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'
import { sequence } from '@sveltejs/kit/hooks'
import { redirect, error as throwError } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { ADMIN_URL } from '$env/static/private'
import type { Handle } from '@sveltejs/kit'
import type { RoleEmulationData, RoleEmulationClaim, EmulatedProfile, ProfileData, LocalsSession } from '$lib/types/roleEmulation'
import { RoleConfig, type UserRole, isPublicPath, getRedirectPath, PublicPaths, isValidUserRole, shouldSkipLayout } from '$lib/auth/roleConfig'

// Cache configuration
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
const SESSION_CACHE_TTL = 60 * 1000; // 1 minute in milliseconds

// Module-level caches
let supabaseClientCache: SupabaseClient | null = null;
const sessionCache = new Map<string, { data: GetSessionResult; timestamp: number }>();
const profileCache = new Map<string, { data: ProfileData | null; timestamp: number }>();
const roleEmulationCache = new Map<string, { data: RoleEmulationData | null; timestamp: number }>();

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

// Utility function to check if it's the Dokmutya domain
const isDokmutyaDomain = (host?: string | null): boolean => {
  if (!host) return false;
  const baseHostname = host.split(':')[0].replace(/^www\./, '');
  return baseHostname === 'dokmutyatirol.ph';
};

// Host router that handles domain-specific routing
const hostRouter: Handle = async ({ event, resolve }) => {
  const isDev = process.env.NODE_ENV === 'development';
  const originalHost = event.request.headers.get('host')?.trim().toLowerCase();
  const host = isDev ? 'dokmutyatirol.ph' : originalHost;
  
  console.log(`[Host Router] Initial request:`, {
    path: event.url.pathname,
    host,
    isDev
  });

  if (isDokmutyaDomain(host) && event.url.pathname === '/') {
    return resolve(event, {
      transformPageChunk: ({ html }) => {
        return html.replace(
          '<div id="app">',
          '<div id="app" data-dokmutya="true">'
        );
      }
    });
  }
  
  return resolve(event);
};

// Initialize Supabase client with caching
const initializeSupabase: Handle = async ({ event, resolve }) => {
  // Reuse cached client if available
  if (!supabaseClientCache) {
    supabaseClientCache = createServerClient(
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
  }

  event.locals.supabase = supabaseClientCache

  event.locals.getSession = async () => {
    const { data: { session } } = await event.locals.supabase.auth.getSession()
    return session
  }

  event.locals.safeGetSession = async () => {
    const sessionId = event.locals.session?.access_token || 'anonymous';
    const now = Date.now();

    // Check cache first
    const cachedSession = sessionCache.get(sessionId);
    if (cachedSession && (now - cachedSession.timestamp) < SESSION_CACHE_TTL) {
      return cachedSession.data;
    }

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
      const result = {
        session: null,
        error: sessionError,
        user: null,
        profile: null,
        roleEmulation: null
      };
      sessionCache.set(sessionId, { data: result, timestamp: now });
      return result;
    }

    const user = session.user
    const [profile, activeEmulation] = await Promise.all([
      getUserProfile(user.id, event.locals.supabase),
      getActiveRoleEmulation(user.id, event.locals.supabase)
    ])

    let emulatedProfile: ProfileData | EmulatedProfile | null = profile
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

    const result = {
      session,
      error: null,
      user,
      profile: emulatedProfile,
      roleEmulation
    };

    // Cache the session result
    sessionCache.set(sessionId, { data: result, timestamp: now });

    return result;
  }

  return resolve(event)
}

// Role emulation guard with caching
const roleEmulationGuard: Handle = async ({ event, resolve }) => {
  const isDev = process.env.NODE_ENV === 'development';
  const host = isDev ? 'dokmutyatirol.ph' : event.request.headers.get('host')?.trim().toLowerCase();
  
  if (isDokmutyaDomain(host) || event.url.pathname.startsWith('/dokmutya')) {
    return resolve(event);
  }

  if (event.url.pathname.startsWith('/api')) {
    return resolve(event);
  }

  const sessionInfo = await event.locals.safeGetSession() as GetSessionResult;

  if (sessionInfo.roleEmulation?.active) {
    const now = new Date();
    const expiresAt = new Date(sessionInfo.roleEmulation.expires_at);

    if (now > expiresAt) {
      await event.locals.supabase
        .from('role_emulation_sessions')
        .update({ status: 'expired' })
        .eq('id', sessionInfo.roleEmulation.session_id);

      event.cookies.delete('role_emulation', { path: '/' });
      if (sessionInfo.session) {
        delete (sessionInfo.session as LocalsSession).roleEmulation;
      }

      // Clear role emulation cache for this user
      if (sessionInfo.user) {
        roleEmulationCache.delete(sessionInfo.user.id);
      }

      throw redirect(303, event.url.pathname);
    }
  }

  return resolve(event);
};

// Auth guard with caching
const authGuard: Handle = async ({ event, resolve }) => {
  const isDev = process.env.NODE_ENV === 'development';
  const host = isDev ? 'dokmutyatirol.ph' : event.request.headers.get('host')?.trim().toLowerCase();
  
  if (isDokmutyaDomain(host) || event.url.pathname.startsWith('/dokmutya')) {
    return resolve(event);
  }

  if (shouldSkipLayout(event.url.pathname)) {
    return resolve(event, {
      transformPageChunk: ({ html }) => html
    });
  }

  if (event.url.pathname.startsWith('/api')) {
    const sessionInfo = await event.locals.safeGetSession() as GetSessionResult;
    if (!sessionInfo.user) {
      throw throwError(401, 'Unauthorized');
    }
    event.locals = {
      ...event.locals,
      session: sessionInfo.session,
      user: sessionInfo.user
    };
    return resolve(event);
  }

  const sessionInfo = await event.locals.safeGetSession() as GetSessionResult;

  event.locals = {
    ...event.locals,
    session: sessionInfo.session,
    user: sessionInfo.user,
    profile: sessionInfo.profile,
  };

  if (!sessionInfo.user) {
    throw redirect(303, PublicPaths.auth);
  }

  if (!sessionInfo.profile?.role || !isValidUserRole(sessionInfo.profile.role)) {
    throw throwError(400, 'Invalid user role');
  }

  const originalRole = (sessionInfo.profile as EmulatedProfile)?.originalRole;
  const context = sessionInfo.roleEmulation?.metadata?.context || sessionInfo.profile?.context || {};

  if (sessionInfo.profile.role === 'super_admin' || originalRole === 'super_admin') {
    if (event.url.pathname === `/${ADMIN_URL}`) {
      return resolve(event);
    }
    if (event.url.pathname === '/') {
      throw redirect(303, `/${ADMIN_URL}`);
    }
  }

  const redirectPath = getRedirectPath(
    sessionInfo.profile.role,
    event.url.pathname,
    originalRole,
    context
  );

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
};

// Helper functions with caching
async function getUserProfile(userId: string, supabase: SupabaseClient): Promise<ProfileData | null> {
  const now = Date.now();
  const cachedProfile = profileCache.get(userId);
  
  if (cachedProfile && (now - cachedProfile.timestamp) < CACHE_TTL) {
    return cachedProfile.data;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, organizations(id, name), context')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    profileCache.set(userId, { data: null, timestamp: now });
    return null;
  }

  profileCache.set(userId, { data: profile, timestamp: now });
  return profile;
}

async function getActiveRoleEmulation(userId: string, supabase: SupabaseClient) {
  const now = Date.now();
  const cachedEmulation = roleEmulationCache.get(userId);
  
  if (cachedEmulation && (now - cachedEmulation.timestamp) < CACHE_TTL) {
    return cachedEmulation.data;
  }

  const { data: emulation } = await supabase
    .from('role_emulation_sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .gt('expires_at', new Date().toISOString())
    .single();

  roleEmulationCache.set(userId, { data: emulation || null, timestamp: now });
  return emulation;
}

export const handle = sequence(hostRouter, initializeSupabase, roleEmulationGuard, authGuard);