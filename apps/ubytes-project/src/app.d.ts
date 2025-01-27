/* eslint-disable @typescript-eslint/no-explicit-any */
// src/app.d.ts

import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

declare global {
  namespace App {
    interface Locals {
      supabase: SupabaseClient
      safeGetSession: () => Promise<{ session: Session | null; user: User | null }>
      getSession(): Promise<Session | null>
      session: Session | null
      user: User | null
      profile: { role: string } | null
    }
    interface LayoutData {
      session: Session | null
      supabase: SupabaseClient<any, "public", any>
      user: User | null
      profile: { role: string } | null  // Add this line
    }
    interface PageData {
      session: Session | null
      // supabase: SupabaseClient
    }
  }
}

export {}