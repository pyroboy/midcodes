import type { SupabaseClient } from '@supabase/supabase-js'
import type { GetSessionResult } from '../hooks.server'

export interface Locals {
  supabase: SupabaseClient
  safeGetSession: () => Promise<GetSessionResult>
}