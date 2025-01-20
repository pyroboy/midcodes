import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public'

if (!PUBLIC_SUPABASE_URL) throw new Error('Missing PUBLIC_SUPABASE_URL')
if (!PUBLIC_SUPABASE_ANON_KEY) throw new Error('Missing PUBLIC_SUPABASE_ANON_KEY')

export const supabaseConfig = {
    supabaseUrl: PUBLIC_SUPABASE_URL,
    supabaseKey: PUBLIC_SUPABASE_ANON_KEY
}
