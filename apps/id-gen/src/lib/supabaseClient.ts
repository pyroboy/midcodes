import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import { browser } from '$app/environment';

const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const supabaseAnonKey = env.PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error(
		'Missing PUBLIC_SUPABASE_URL / PUBLIC_SUPABASE_ANON_KEY. Set them as environment variables in your Cloudflare Pages project (and locally via .env)'
	);
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
	auth: {
		persistSession: false,
		storage: browser ? sessionStorage : undefined
	}
});
