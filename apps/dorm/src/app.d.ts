/// file: src/app.d.ts
import type { Session as SupabaseSession, SupabaseClient, User } from '@supabase/supabase-js';
import type { ProfileData, EmulatedProfile, RoleEmulationClaim } from '$lib/types/roleEmulation';

declare global {
  namespace App {
    // Locals contains the types available in server-side code
    interface Locals {
      supabase: SupabaseClient;
      getSession: () => Promise<Session | null>;
      safeGetSession: () => Promise<{
        session: Session | null;
        error: Error | null;
        user: User | null;
        profile: ProfileData | EmulatedProfile | null;
        // roleEmulation: RoleEmulationClaim | null;
      }>;
      session?: Session | null;
      user?: User | null;
      profile?: ProfileData | EmulatedProfile | null;
      special_url?: string;
    }

    // PageData defines the data that's available to pages through $page.data
    interface PageData {
      session?: Session | null;
      user?: User | null;
      profile?: ProfileData | EmulatedProfile | null;
      navigation?: NavigationState;
      special_url?: string | undefined;
      // emulation?: { active: boolean; emulated_org_id: string | null; } | null;
    }

    // Error type for consistent error handling
    interface Error {
      message: string;
    }

    // Platform-specific context (empty for now)
    interface Platform {}

    // Define the shape of page state data
    interface PageState {
      [key: string]: unknown;
    }
  }

  // Environment variable types
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

// Extend the Supabase Session type to include roleEmulation
interface Session extends SupabaseSession {
  roleEmulation?: RoleEmulationClaim;
}

// Export types that will be used in other files
export { Session };

// Make sure this is a module
export {};