// src/app.d.ts
import type { Session, SupabaseClient, User } from '@supabase/supabase-js';
import type { UserJWTPayload } from '$lib/types/auth';
import type { AppPermission } from '$lib/types/permissions';

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      safeGetSession: () => Promise<GetSessionResult>;
    }

    interface PageData {
      session?: Session | null;
      user?: User | null;
      navigation?: NavigationState;
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