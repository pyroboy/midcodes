/// <reference types="@sveltejs/kit" />
import type { SupabaseClient } from '@supabase/supabase-js'
import type { GetSessionResult } from './hooks.server'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient
      safeGetSession: () => Promise<GetSessionResult>
    }

    interface PageData {
      session: GetSessionResult | null
    }

    // interface Error {}
    // interface Platform {}
  }
}