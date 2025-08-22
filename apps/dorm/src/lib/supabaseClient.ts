import { createBrowserClient } from '@supabase/ssr';
import { type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '$lib/database.types';

// Environment variables for Supabase
const PUBLIC_SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'https://wnkqlrfmtiibrqnncgqu.supabase.co'
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3FscmZtdGlpYnJxbm5jZ3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIyMjEzNzMsImV4cCI6MjAzNzc5NzM3M30.lsv6u5'

export const supabase: SupabaseClient<Database> = createBrowserClient(
    PUBLIC_SUPABASE_URL,
    PUBLIC_SUPABASE_ANON_KEY,
	{
		auth: {
			autoRefreshToken: true,
			persistSession: true,
			detectSessionInUrl: true
		}
	}
);
