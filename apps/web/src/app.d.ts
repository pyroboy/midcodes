/* eslint-disable @typescript-eslint/no-explicit-any */
// See https://kit.svelte.dev/docs/types#app
import type { Session as SupabaseSession, SupabaseClient, User } from '@supabase/supabase-js';
import type { ProfileData, EmulatedProfile, RoleEmulationClaim } from '$lib/types/roleEmulation';

// Remove this interface since we're using PUBLIC_ prefix
// interface ImportMetaEnv {
//   VITE_PUBLIC_SUPABASE_URL: string
//   VITE_PUBLIC_SUPABASE_ANON_KEY: string
//   ADMIN_URL: string
// }

// interface ImportMeta {
//   readonly env: ImportMetaEnv
// }

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient;
      safeGetSession: () => Promise<{
        session: SupabaseSession | null;
        error: Error | null;
        user: User | null;
        profile: ProfileData | EmulatedProfile | null;
        roleEmulation: RoleEmulationClaim | null;
        navigation?: NavigationState;
      }>;
      session: SupabaseSession | null;
      user: User | null;
      profile?: ProfileData | EmulatedProfile | null;
    }
    interface PageData {
      session: Session | null;
      user: User | null;
      profile: ProfileData | EmulatedProfile | null;
      navigation: NavigationState;
      special_url: string | undefined;
      emulation: { active: boolean; emulated_org_id: string | null; } | null;
    }
    interface Error {
      message: string
    }
    interface Platform {}
  }

  namespace NodeJS {
    interface ProcessEnv {
      PUBLIC_SUPABASE_URL: string;
      PUBLIC_SUPABASE_ANON_KEY: string;
      PUBLIC_RECAPTCHA_SITE_KEY: string;
      PRIVATE_SERVICE_ROLE: string;
      RECAPTCHA_SECRET_KEY: string;
      ADMIN_URL: string;
    }
  }
}

// Extend the Supabase Session type to include roleEmulation
interface Session extends SupabaseSession {
  roleEmulation?: RoleEmulationClaim;
}

export { Session };