import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';
import type { Session, User } from '@supabase/supabase-js';
import type { ProfileData, EmulatedProfile } from '$lib/types/roleEmulation';
import type { Database } from '$lib/database.types';
import type { NavigationState } from '$lib/types/navigation';

type PageData = {
  user: User | null;
  profile: ProfileData | EmulatedProfile | null;
  navigation: NavigationState;
  emulation: { active: boolean; emulated_org_id: string | null } | null;
  special_url: string | undefined;
  session: Session | null;
  shouldShowDokmutya: boolean;
};

type ServerSession = {
  session: Session | null;
  roleEmulation?: {
    active: boolean;
    emulated_org_id: string | null;
  } | null;
};

type ServerProfile = Database['public']['Tables']['profiles']['Row'] & {
  isEmulated?: boolean;
  originalRole?: string;
  originalOrgId?: string | null;
  context?: Record<string, any>;
};

export const load: LayoutLoad<PageData> = async ({ data }) => {
  // console.log('[Layout] Initializing with data:', data);

  // Handle case when data is null (like in error pages)
  if (!data) {
    return {
      user: null,
      profile: null,
      navigation: {
        homeUrl: '/',
        showHeader: false,
        allowedPaths: [],
        showRoleEmulation: false
      } as NavigationState,
      emulation: null,
      special_url: undefined,
      session: null,
      shouldShowDokmutya: false
    } satisfies PageData;
  }

  // Extract the session data we need
  const { user, profile: serverProfile, navigation, emulation, special_url, session } = data;
  
  // Transform the profile to match expected types
  let profile: ProfileData | EmulatedProfile | null = null;
  if (serverProfile) {
    const baseProfile = {
      id: serverProfile.id,
      role: serverProfile.role,
      email: serverProfile.email || '',
      context: serverProfile.context,
      org_id: serverProfile.org_id
    };

    if (serverProfile.isEmulated) {
      profile = {
        ...baseProfile,
        isEmulated: true,
        originalRole: serverProfile.originalRole!,
        email: serverProfile.email || ''
      } as EmulatedProfile;
    } else {
      profile = baseProfile as ProfileData;
    }
  }

  // Transform emulation data to match PageData interface
  const transformedEmulation = emulation ? {
    active: emulation.isEmulated ?? false,
    emulated_org_id: emulation.emulatedOrgId ?? null
  } : null;

  return {
    user: user ?? null,
    profile,
    navigation,
    emulation: transformedEmulation,
    special_url: special_url ?? undefined,
    session: (session as ServerSession)?.session ?? null,
    shouldShowDokmutya: data.shouldShowDokmutya ?? false
  } satisfies PageData;
};
