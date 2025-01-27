import type { Session, User } from '@supabase/supabase-js';

export interface  UserJWTPayload {
  user_roles: string[];
  // add other JWT payload fields as needed
}

export interface GetSessionResult {
  session: Session | null;
  error: Error | null;
  user: User | null;
  org_id: string | null;
  permissions?: string[];
}
