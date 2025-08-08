import { env as publicEnv } from '$env/dynamic/public';

export const supabaseConfig = {
    supabaseUrl: publicEnv.PUBLIC_SUPABASE_URL,
    supabaseKey: publicEnv.PUBLIC_SUPABASE_ANON_KEY
};
