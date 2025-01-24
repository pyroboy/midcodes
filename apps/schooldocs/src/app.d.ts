/// <reference types="@sveltejs/kit" />
import type { SupabaseClient, User, Session } from '@supabase/supabase-js'

export interface GetSessionResult {
  session: Session | null;
  error: Error | null;
  user: User | null;
}

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient
      safeGetSession: () => Promise<GetSessionResult>
    }

    interface PageData {
      session: GetSessionResult | null;
      documentType?: any;
    }

    // interface Error {}
    // interface Platform {}
  }
}