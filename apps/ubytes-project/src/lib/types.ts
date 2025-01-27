/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

export interface LayoutData {
  session: Session | null
  supabase: SupabaseClient<any, "public", any>
  user: User | null
  profile: { role: string } | null
}