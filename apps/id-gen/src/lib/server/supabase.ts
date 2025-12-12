import { createClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { Database } from '$lib/types/database.types';

// Create a server-side client with service role key for backend operations

const supabaseUrl = env.PUBLIC_SUPABASE_URL;
const serviceRole = privateEnv.PRIVATE_SERVICE_ROLE;

if (!supabaseUrl || !serviceRole) {
	throw new Error(
		'Missing PUBLIC_SUPABASE_URL and/or PRIVATE_SERVICE_ROLE. Configure them as Cloudflare Pages environment variables (and locally via .env)'
	);
}

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRole, {
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
