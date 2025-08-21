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

// Local fallbacks for table types (avoid depending on generated Database table names that may not exist)
export type Json = null | boolean | number | string | Json[] | { [key: string]: Json };

export interface PaymentRecord {
	id: string;
	user_id: string;
	session_id: string | null;
	provider_payment_id: string | null;
	kind: string;
	sku_id: string;
	amount_php: number;
	currency: string;
	status: 'pending' | 'paid' | 'failed' | 'refunded';
	method: string | null;
	method_allowed: string[];
	idempotency_key: string;
	metadata: Json | null;
	paid_at?: string | null;
	raw_event?: Json | null;
	reason: string | null;
	created_at: string;
	updated_at: string;
}

export type PaymentRecordInsert = Omit<PaymentRecord, 'id' | 'created_at' | 'updated_at'>;
export type PaymentRecordUpdate = Partial<PaymentRecord>;

// Minimal webhook event types so importing modules can type-check
export interface WebhookEvent {
	id: string;
	event_id: string;
	event_type: string;
	provider: string;
	raw_payload: Json | null;
	created_at: string;
}
export type WebhookEventInsert = Omit<WebhookEvent, 'id' | 'created_at'>;
