import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';
import type { Session } from '@supabase/supabase-js';

export const load: LayoutLoad = async ({ data }) => {
  console.log('[Layout] Initializing with data:', data);
  // Initialize config store with layout data

  // Extract the session data we need
  const { user, profile, navigation, emulation, special_url } = data;
  
  return {
    user,
    profile,
    navigation,
    emulation,
    special_url,
    supabase,
    // Return only the session object from data.session
    session: data.session?.session ?? null
  };
};

export const ssr = false;
