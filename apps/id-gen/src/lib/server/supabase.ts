import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { env } from '$env/dynamic/public';
import { env as privateEnv } from '$env/dynamic/private';
import type { Database } from '$lib/types/database.types';

// Lazy-initialized Supabase admin client
// This prevents the client from being created at build time when env vars aren't available
let _supabaseAdmin: SupabaseClient<Database> | null = null;

/**
 * Get the Supabase admin client with service role key.
 * Lazily initialized on first call to avoid build-time errors.
 */
export function getSupabaseAdmin(): SupabaseClient<Database> {
	if (_supabaseAdmin) {
		return _supabaseAdmin;
	}

	const supabaseUrl = env.PUBLIC_SUPABASE_URL;
	const serviceRole = privateEnv.PRIVATE_SERVICE_ROLE;

	if (!supabaseUrl || !serviceRole) {
		throw new Error(
			'Missing PUBLIC_SUPABASE_URL and/or PRIVATE_SERVICE_ROLE. Configure them as Cloudflare Pages environment variables (and locally via .env)'
		);
	}

	_supabaseAdmin = createClient<Database>(supabaseUrl, serviceRole, {
		auth: {
			autoRefreshToken: false,
			persistSession: false
		}
	});

	return _supabaseAdmin;
}

// Legacy export for backwards compatibility - use getSupabaseAdmin() instead
// This getter allows the module to be imported without immediately throwing
export const supabaseAdmin = {
	get storage() { return getSupabaseAdmin().storage; },
	get auth() { return getSupabaseAdmin().auth; },
	get from() { return getSupabaseAdmin().from.bind(getSupabaseAdmin()); },
	get rpc() { return getSupabaseAdmin().rpc.bind(getSupabaseAdmin()); },
	get channel() { return getSupabaseAdmin().channel.bind(getSupabaseAdmin()); },
	get removeChannel() { return getSupabaseAdmin().removeChannel.bind(getSupabaseAdmin()); },
	get removeAllChannels() { return getSupabaseAdmin().removeAllChannels.bind(getSupabaseAdmin()); },
	get getChannels() { return getSupabaseAdmin().getChannels.bind(getSupabaseAdmin()); },
	get functions() { return getSupabaseAdmin().functions; },
	get realtime() { return getSupabaseAdmin().realtime; }
};

// Use the generated database types for consistency
export type Json = Database['public']['Tables']['payment_records']['Row']['metadata'];

// Use the generated database types directly to avoid type mismatches
export type PaymentRecord = Database['public']['Tables']['payment_records']['Row'];
export type PaymentRecordInsert = Database['public']['Tables']['payment_records']['Insert'];
export type PaymentRecordUpdate = Database['public']['Tables']['payment_records']['Update'];

// Use generated webhook event types
export type WebhookEvent = Database['public']['Tables']['webhook_events']['Row'];
export type WebhookEventInsert = Database['public']['Tables']['webhook_events']['Insert'];
