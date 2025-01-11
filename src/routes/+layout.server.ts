import type { LayoutServerLoad } from './$types';
import type { Database } from '$lib/database.types';
import type { User } from '@supabase/supabase-js';
import { RoleConfig, type UserRole } from '$lib/auth/roleConfig';

type NavigationState = {
  homeUrl: string;
  showHeader: boolean;
  allowedPaths: string[];
  showRoleEmulation: boolean;
}

type ServerProfile = Database['public']['Tables']['profiles']['Row'] & {
  isEmulated?: boolean;
  originalRole?: UserRole;
  originalOrgId?: string | null;
  context?: Record<string, any>;
};

type EmulationData = {
  isEmulated: boolean;
  originalRole: UserRole;
  emulatedRole: UserRole;
  originalOrgId: string | null;
  emulatedOrgId: string | null;
  expiresAt: string;
  sessionId: string;
  createdAt: string;
  metadata: Record<string, unknown>;
  organizationName: string | null;
}

type Profile = Database['public']['Tables']['profiles']['Row'];
type SessionWithAuth = {
  session: {
    roleEmulation?: {
      active: boolean;
      emulated_org_id: string | null;
    } | null;
  } | null;
  user: User | null;
  profile: Profile | null;
  error: Error | null;
};

const isDokmutyaDomain = (host?: string | null): boolean => {
  if (!host) return false;
  const baseHostname = host.split(':')[0].replace(/^www\./, '');
  return baseHostname === 'dokmutyatirol.ph';
};

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, profile, supabase, special_url }, url, request }) => {
  // Check for Dokmutya domain first
  // const isDev = process.env.NODE_ENV === 'development';
  const isDev = false
  const actualHost = request.headers.get('host')?.trim().toLowerCase() || '';
  const forcedHost = isDev ? 'dokmutyatirol.ph' : '';
  
  console.log('[Layout Server] Domain Check:', {
    isDev,
    actualHost,
    forcedHost,
    pathname: url.pathname,
    currentHost: isDev ? forcedHost : actualHost,
    headers: Object.fromEntries(request.headers.entries())
  });

  // In dev mode, we'll consider either the actual host being dokmutyatirol.ph
  // or when we're forcing it via isDev
  const isDokmutya = isDev ? 
    (actualHost === 'dokmutyatirol.ph' || actualHost === 'www.dokmutyatirol.ph' || forcedHost === 'dokmutyatirol.ph') :
    (actualHost === 'dokmutyatirol.ph' || actualHost === 'www.dokmutyatirol.ph');

  const shouldShowDokmutya = isDokmutya && url.pathname === '/';

  console.log('[Layout Server] Result:', {
    isDokmutya,
    shouldShowDokmutya,
    pathname: url.pathname
  });
  
  // If it's the Dokmutya domain at root path, return early with just that data
  if (shouldShowDokmutya) {
    return {
      shouldShowDokmutya,
      user: null,
      profile: null,
      navigation: {
        homeUrl: '/',
        showHeader: false,
        allowedPaths: [],
        showRoleEmulation: false
      },
      session: null,
      emulation: null,
      special_url: null
    };
  }

  const session = await safeGetSession() as SessionWithAuth;
  const user = session?.user ?? null;

  // Set security headers
  const response = new Response();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set('Permissions-Policy', 'geolocation=(), microphone=()');

  let currentProfile = profile ? { ...profile } as ServerProfile : null;
  let isEmulated = false;
  let emulationData: EmulationData | null = null;
  let organizationName: string | null = null;

  // Navigation state
  const navigation: NavigationState = {
    homeUrl: (() => {
      const context = currentProfile?.context || {};
      if (!currentProfile?.role) return '/';
      const path = RoleConfig[currentProfile.role].defaultPath(context);
      return path;
    })(),
    showHeader: false,
    allowedPaths: [],
    showRoleEmulation: currentProfile?.role === 'super_admin'
  };

  if (session && currentProfile) {
    navigation.showHeader = true;

    if (currentProfile.role === 'super_admin') {
      const { data: activeEmulation } = await supabase
        .from('role_emulation_sessions')
        .select('*')
        .eq('user_id', currentProfile.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();

      if (activeEmulation) {
        isEmulated = true;
        
        const { data: org } = await supabase
          .from('organizations')
          .select('name')
          .eq('id', activeEmulation.emulated_org_id)
          .single();
        
        organizationName = org?.name ?? null;
        
        emulationData = {
          ...activeEmulation,
          isEmulated: true,
          originalRole: currentProfile.role,
          originalOrgId: currentProfile.org_id,
          organizationName
        };
        
        currentProfile = {
          ...currentProfile,
          role: activeEmulation.emulated_role,
          org_id: activeEmulation.emulated_org_id,
          originalRole: currentProfile.role,
          originalOrgId: currentProfile.org_id,
          isEmulated: true
        } as ServerProfile;

        navigation.showRoleEmulation = true;
      }
    }
  }

  return {
    shouldShowDokmutya,
    user,
    profile: currentProfile,
    navigation,
    session,
    emulation: {
      ...emulationData,
      organizationName
    },
    special_url
  };
};