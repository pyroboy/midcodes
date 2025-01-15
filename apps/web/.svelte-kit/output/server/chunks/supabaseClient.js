import { createBrowserClient } from "@supabase/ssr";
import { P as PUBLIC_SUPABASE_URL, a as PUBLIC_SUPABASE_ANON_KEY } from "./public.js";
const supabase = createBrowserClient(
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
export {
  supabase as s
};
