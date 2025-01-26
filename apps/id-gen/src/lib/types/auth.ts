import type { User } from '@supabase/supabase-js';

export interface UserJWTPayload {
  aud: string;
  exp: number;
  sub: string;
  email: string;
  phone: string;
  app_metadata: {
    provider: string;
    [key: string]: any;
  };
  user_metadata: {
    [key: string]: any;
  };
  role: string;
  aal: string;
  amr: Array<{
    method: string;
    timestamp: number;
  }>;
  session_id: string;
}

export interface GetSessionResult {
  session: Session | null;
  error: Error | null;
  user: User | null;
  decodedToken: UserJWTPayload | null;
  permissions?: string[];
}
