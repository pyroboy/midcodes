import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import { env as publicEnv } from '$env/dynamic/public';
import type { Database } from '$lib/database.types';

export const supabase: SupabaseClient<Database> = createBrowserClient(
    publicEnv.PUBLIC_SUPABASE_URL!,
    publicEnv.PUBLIC_SUPABASE_ANON_KEY!,
	{
		auth: {
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: true
		}
	}
);
