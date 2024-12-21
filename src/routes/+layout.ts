import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';
import type { Session } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

type ServerSession = {
  session: Session | null;
  roleEmulation?: {
    active: boolean;
    emulated_org_id: string | null;
  } | null;
};

export const load: LayoutLoad = async ({ data }) => {
  console.log('[Layout] Initializing with data:', data);
  // Initialize config store with layout data

  // Extract the session data we need
  const { user, profile, navigation, emulation, special_url, session } = data;
  
  return {
    user,
    profile,
    navigation,
    emulation,
    special_url,
    supabase,
    session: (session as ServerSession)?.session ?? null
  };
};

export const ssr = false;
