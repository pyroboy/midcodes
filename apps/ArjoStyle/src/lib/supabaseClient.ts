// src/lib/supabaseClient.ts - CORRECT VERSION FOR VITE
import { createClient } from '@supabase/supabase-js';

// Use import.meta.env and VITE_ prefix for Vite projects
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;       // Check this line
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY; // Check this line

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    "ERROR: Supabase URL or Anon Key is missing.\n" +
    "Ensure you have a .env file in the project root (tattoo-tide/.env)\n" +
    "and that it contains VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.\n" +
    "You might need to restart your development server (npm run dev) after creating/editing the .env file."
  );
  throw new Error("Supabase configuration error in supabaseClient.ts. Check environment variables.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);