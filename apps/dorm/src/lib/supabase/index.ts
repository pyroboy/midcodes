import { createBrowserClient, createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from '$lib/database.types';
import { env as publicEnv } from '$env/dynamic/public';
import type { Cookies } from '@sveltejs/kit';

export const createSupabaseBrowserClient = () => {
    return createBrowserClient<Database>(
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
};

export const createSupabaseServerClient = ({ cookies }: { cookies: Cookies }) => {
    return createServerClient<Database>(
        publicEnv.PUBLIC_SUPABASE_URL!,
        publicEnv.PUBLIC_SUPABASE_ANON_KEY!,
        {
		cookies: {
			get: (key: string) => {
				const cookie = cookies.get(key);
				return cookie ?? null;
			},
			set: (key: string, value: string, options: CookieOptions) => {
				cookies.set(key, value, { ...options, path: '/' });
			},
			remove: (key: string, options: CookieOptions) => {
				cookies.delete(key, { ...options, path: '/' });
			}
		}
        }
    );
};
