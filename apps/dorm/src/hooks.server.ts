import { createServerClient } from '@supabase/ssr'
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'
import { sequence } from '@sveltejs/kit/hooks'
import { redirect, error as throwError } from '@sveltejs/kit'
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'
import { PRIVATE_ADMIN_URL } from '$env/static/private'
import type { Handle } from '@sveltejs/kit'
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

// Cache interfaces and implementation
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

class Cache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private ttl: number;

  constructor(ttl: number) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);
    const now = Date.now();

    if (entry && now - entry.timestamp < this.ttl) {
      return entry.data;
    }

    if (entry) {
      this.cache.delete(key);
    }

    return null;
  }

  set(key: string, data: T): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.ttl) {
        this.cache.delete(key);
      }
    }
  }
}

// Initialize caches with their respective TTLs
const sessionCache = new Cache<GetSessionResult>(60 * 1000); // 1 minute
const profileCache = new Cache<ProfileData | null>(5 * 60 * 1000); // 5 minutes

// Set up cache cleanup interval
const cleanupInterval = setInterval(() => {
  sessionCache.cleanup();
  profileCache.cleanup();
}, 5 * 60 * 1000); // Run cleanup every 5 minutes

// Clean up interval on hot module reload
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clearInterval(cleanupInterval);
  });
}

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
  profile?: ProfileData | null
  special_url?: string
}

declare global {
  namespace App {
    interface Locals extends AppLocals {}
  }
}



async function getUserProfile(userId: string, supabase: SupabaseClient): Promise<ProfileData | null> {
  const cachedProfile = profileCache.get(userId);
  if (cachedProfile !== null) {
    return cachedProfile;
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*, organizations(id, name), context')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile:', error);
    profileCache.set(userId, null);
    return null;
  }

  profileCache.set(userId, profile);
  return profile;
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
    const sessionId = event.locals.session?.access_token || 'anonymous';
    const cachedSession = sessionCache.get(sessionId);
    
    if (cachedSession !== null) {
      return cachedSession;
    }

    const { data: { user }, error: userError } = await event.locals.supabase.auth.getUser();
    
    if (userError || !user) {
      const result: GetSessionResult = {
        session: null,
        error: userError || new Error('User not authenticated'),
        user: null,
        profile: null,
      };
      sessionCache.set(sessionId, result);
      return result;
    }

    const { data: { session: initialSession }, error: sessionError } = await event.locals.supabase.auth.getSession();
    
    if (sessionError || !initialSession) {
      const result: GetSessionResult = {
        session: null,
        error: sessionError || new Error('Invalid session'),
        user: null,
        profile: null,
      };
      sessionCache.set(sessionId, result);
      return result;
    }

    let currentSession = initialSession;
    if (currentSession.expires_at) {
      const expiresAt = Math.floor(new Date(currentSession.expires_at).getTime() / 1000);
      const now = Math.floor(Date.now() / 1000);

      if (now > expiresAt) {
        try {
          const { data: { session: refreshedSession }, error } = 
            await event.locals.supabase.auth.setSession({
              access_token: currentSession.access_token,
              refresh_token: currentSession.refresh_token
            });

          if (!error && refreshedSession) {
            currentSession = refreshedSession;
          }
        } catch (err) {
          const result: GetSessionResult = {
            session: null,
            error: err instanceof Error ? err : new Error('Session refresh failed'),
            user: null,
            profile: null,
          };
          sessionCache.set(sessionId, result);
          return result;
        }
      }
    }

    const profile = await getUserProfile(user.id, event.locals.supabase);

    if (profile?.role === 'super_admin') {
      event.locals.special_url = '/' + PRIVATE_ADMIN_URL;
    } else {
      event.locals.special_url = '/';
    }

    const result: GetSessionResult = {
      session: currentSession,
      error: null,
      user,
      profile
    };
    sessionCache.set(sessionId, result);
    return result;
  }

  return resolve(event)
}

const authGuard: Handle = async ({ event, resolve }) => {
  const isDev = process.env.NODE_ENV === 'development'
  const host = isDev ? 'dokmutyatirol.ph' : event.request.headers.get('host')?.trim().toLowerCase()


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
export const handle = sequence( initializeSupabase, authGuard)