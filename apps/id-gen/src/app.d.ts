// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { Database } from './lib/types/database';
import type { ProfileData } from './lib/types/roleEmulation';
import type { UserJWTPayload, GetSessionResult } from './lib/types/auth';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient<Database>;
      safeGetSession: () => Promise<GetSessionResult>;
      session?: Session | null;
      user?: User | null;
      org_id?: string;
      permissions?: string[];
    }

    interface PageData {
      user?: User | null;
      org_id?: string;
      permissions?: string[];
    }

    interface Error {
      message: string;
    }

    interface Platform {}

    interface PageState {
      [key: string]: unknown;
    }
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production' | 'test';
      PUBLIC_SUPABASE_URL: string;
      PUBLIC_SUPABASE_ANON_KEY: string;
      PUBLIC_RECAPTCHA_SITE_KEY: string;
      PRIVATE_SERVICE_ROLE: string;
      RECAPTCHA_SECRET_KEY: string;
      PRIVATE_ADMIN_URL: string;
    }
  }
}

export {};
