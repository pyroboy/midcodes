import type { LayoutServerLoadEvent } from './$types';
import { RoleConfig, type UserRole } from '$lib/auth/roleConfig';
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

export const load = async ({ locals: { safeGetSession, profile, supabase,special_url }, url }: LayoutServerLoadEvent) => {
  console.log('[Layout Server] Starting load for:', url.pathname);
  const session = await safeGetSession();
  const user = session?.user ?? null;

  // console.log('[Layout Server] User profile:', profile);

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


  // console.log the context
  console.log('[Layout Server] Context:', currentProfile?.context);
  // console.log('[Layout Server] Full Profile:', JSON.stringify(currentProfile, null, 2));
  
  // Navigation state
  const navigation: NavigationState = {
    homeUrl: (() => {
      const context = currentProfile?.context || {};  // Ensure we always pass an object
      console.log('[Layout Server] Role:', currentProfile?.role);
      // console.log('[Layout Server] Context being passed:', context);
      if (!currentProfile?.role) return '/';
      const path = RoleConfig[currentProfile.role].defaultPath(context);
      // console.log('[Layout Server] Generated path:', path);
      return path;
    })(),
    showHeader: false, // Default to false
    allowedPaths: [],
    showRoleEmulation: currentProfile?.role === 'super_admin'
  };
// 
  // console.log('[Layout Server] Navigation and Session:', {
  //   hasSession: !!session,
  //   session,
  //   navigation,
  //   url: url.pathname
  // });

  if (session && currentProfile) {
    navigation.showHeader = true; // Only show header if authenticated

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

    // Show nav for all authenticated users
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
    },
    special_url
  };
};