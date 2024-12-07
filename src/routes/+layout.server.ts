import type { LayoutServerLoadEvent } from './$types';
import { ADMIN_URL } from '$env/static/private';
import { RoleConfig } from '../rolePermissions';
import type { UserRole, Profile } from '$lib/types/database';
import type { Database } from '$lib/database.types';

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
};

type EmulatedProfile = ServerProfile & {
  isEmulated: boolean;
  originalRole: UserRole;
  originalOrgId: string | null;
}

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

export const load = async ({ locals: { safeGetSession, profile, supabase }, url }: LayoutServerLoadEvent) => {
  const session = await safeGetSession();
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

  const navigation: NavigationState = {
    homeUrl: '/',
    showHeader: false,
    allowedPaths: [],
    showRoleEmulation: false
  };

  if (session && currentProfile) {
    // Check for active role emulation session for super_admin users
    if (currentProfile.role === 'super_admin') {
      const { data: activeEmulation } = await supabase
        .from('role_emulation_sessions')
        .select('*')
        .eq('user_id', currentProfile.id)
        .eq('status', 'active')
        .gt('expires_at', new Date().toISOString())
        .single();

      // console.log('[Layout Server Debug] Active emulation:', activeEmulation);

      if (activeEmulation) {
        isEmulated = true;
        
        // Fetch organization name
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
        
        // console.log('[Layout Server Debug] Emulation data:', emulationData);
        
        // Update profile with emulated data
        currentProfile = {
          ...currentProfile,
          role: activeEmulation.emulated_role,
          org_id: activeEmulation.emulated_org_id,
          originalRole: currentProfile.role,
          originalOrgId: currentProfile.org_id,
          isEmulated: true
        } as ServerProfile;

        // console.log('[Layout Server Debug] Updated profile:', currentProfile);
      }
      navigation.showRoleEmulation = true;
    }

    // Set home URL based on role and emulation status
    if (isEmulated) {
      navigation.homeUrl = RoleConfig[currentProfile.role as UserRole]?.defaultRedirect ?? '/';
    } else {
      navigation.homeUrl = RoleConfig[currentProfile.role as UserRole]?.defaultRedirect ?? '/';
    }

    // Show nav for all authenticated users
    navigation.showHeader = !url.pathname.startsWith('/auth');
    // navigation.allowedPaths = ['/templates', '/all-ids'];
  }

  // console.log('[Layout Server Debug] Final result:', {
  //   user,
  //   profile: currentProfile,
  //   navigation,
  //   session,
  //   emulation: emulationData
  // });

  return {
    user,
    profile: currentProfile,
    navigation,
    session,
    emulation: {
      ...emulationData,
      organizationName
    }
  };
};