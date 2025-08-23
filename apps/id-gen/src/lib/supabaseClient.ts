import { createClient } from '@supabase/supabase-js';
import { browser } from '$app/environment';

// Environment variables for Supabase
const PUBLIC_SUPABASE_URL = import.meta.env.VITE_PUBLIC_SUPABASE_URL || 'https://wnkqlrfmtiibrqnncgqu.supabase.co'
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3FscmZtdGlpYnJxbm5jZ3F1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjIyMjEzNzMsImV4cCI6MjAzNzc5NzM3M30.lsv6u5gwVMHDIqJ2bjUy0elxoYn-q62j6ZbKQ4a_Ru0'

export const supabase = createClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
	auth: {
		persistSession: false,
		storage: browser ? sessionStorage : undefined
	}
});
