import type { Session as SupabaseSession } from '@supabase/supabase-js';

export interface Session extends SupabaseSession {
  roleEmulation?: {
    role: string;
    org_id?: string;
  };
}
