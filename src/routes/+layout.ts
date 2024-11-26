import { supabase } from '$lib/supabaseClient';
import type { LayoutLoad } from './$types';

export const load: LayoutLoad = async ({ data }) => {
  return {
    ...data,
    supabase,
  };
};

export const ssr = false;
