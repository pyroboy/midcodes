import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';
import type { Session } from '@supabase/supabase-js';
import type { ProfileData, EmulatedProfile } from '$lib/types/roleEmulation';
import type { Database } from '$lib/database.types';
import type { NavigationState } from '$lib/types/navigation';

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

export const load: LayoutLoad = async ({ data }) => {
  console.log('[Layout] Initializing with data:', data);

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
    special_url,
    session: (session as ServerSession)?.session ?? null
  };
};

export const ssr = false;
