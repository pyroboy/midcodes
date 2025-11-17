import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL } from '$env/static/public';
import { PRIVATE_SERVICE_ROLE } from '$env/static/private';
import type { Database } from '$lib/types/database.types';

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
