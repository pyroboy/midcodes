import { createClient } from '@supabase/supabase-js';
import type { Database } from '$lib/types/database.types';

// Environment variables for Supabase
const PUBLIC_SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL || 'https://wnkqlrfmtiibrqnncgqu.supabase.co'
const PRIVATE_SERVICE_ROLE = process.env.PRIVATE_SERVICE_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indua3FscmZtdGlpYnJxbm5jZ3F1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMjIyMTM3MywiZXhwIjoyMDM3Nzk3MzczfQ.dummy'

// Create a server-side client with service role key for backend operations
export const supabaseAdmin = createClient<Database>(PUBLIC_SUPABASE_URL, PRIVATE_SERVICE_ROLE, {
	auth: {
		autoRefreshToken: false,
		persistSession: false
	}
});

// Use the generated database types for consistency
export type Json = Database['public']['Tables']['payment_records']['Row']['metadata'];

// Use the generated database types directly to avoid type mismatches
export type PaymentRecord = Database['public']['Tables']['payment_records']['Row'];
export type PaymentRecordInsert = Database['public']['Tables']['payment_records']['Insert'];
export type PaymentRecordUpdate = Database['public']['Tables']['payment_records']['Update'];

// Use generated webhook event types
export type WebhookEvent = Database['public']['Tables']['webhook_events']['Row'];
export type WebhookEventInsert = Database['public']['Tables']['webhook_events']['Insert'];
