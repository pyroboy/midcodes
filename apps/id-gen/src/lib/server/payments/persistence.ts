/**
 * Server-only payment persistence layer
 * Handles database operations for payment records with idempotency guards
 */

import {
	supabaseAdmin,
	type PaymentRecord,
	type PaymentRecordInsert,
	type PaymentRecordUpdate,
	type WebhookEvent,
	type WebhookEventInsert,
	type Json
} from '$lib/server/supabase';
import type { PurchaseKind, PaymentStatus, PaymentMethod } from '$lib/payments/types';

// Interface definitions for better type safety
interface RecordCheckoutInitParams {
	userId: string;
	sessionId: string;
	providerPaymentId?: string;
	kind: PurchaseKind;
	skuId: string;
	amountPhp: number;
	methodAllowed: PaymentMethod[];
	status?: PaymentStatus;
	idempotencyKey: string;
	metadata?: Record<string, any>;
}

interface MarkPaymentPaidParams {
	sessionId?: string;
	providerPaymentId?: string;
	method: PaymentMethod;
	paidAt: Date;
	rawEvent?: Record<string, any>;
}

interface MarkPaymentFailedParams {
	sessionId?: string;
	providerPaymentId?: string;
	reason: string;
	rawEvent?: Record<string, any>;
}

interface ListPaymentsByUserParams {
	userId: string;
	limit?: number;
	cursor?: string;
}

/**
 * Records a new checkout initialization with idempotency
 * This is the first step when a user initiates a payment
 */
export async function recordCheckoutInit({
	userId,
	sessionId,
	providerPaymentId,
	kind,
	skuId,
	amountPhp,
	methodAllowed,
	status = 'pending',
	idempotencyKey,
	metadata = {}
}: RecordCheckoutInitParams): Promise<PaymentRecord> {
	// First check if a record with this idempotency key already exists
	const { data: existingRecord } = await supabaseAdmin
		.from('payment_records')
		.select('*')
		.eq('idempotency_key', idempotencyKey)
		.single();

	if (existingRecord) {
		return existingRecord;
	}

	// Create new payment record
	const insertData: PaymentRecordInsert = {
		user_id: userId,
		session_id: sessionId,
		provider_payment_id: providerPaymentId || null,
		kind,
		sku_id: skuId,
		amount_php: amountPhp,
		currency: 'PHP',
		status: status === 'expired' ? 'failed' : status, // Map expired to failed for database
		method: null, // Will be set when payment is completed
		method_allowed: methodAllowed,
		idempotency_key: idempotencyKey,
		metadata: metadata as Json,
		reason: null // Will be set if payment fails
	};

	const { data, error } = await supabaseAdmin
		.from('payment_records')
		.insert(insertData)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to record checkout init: ${error.message}`);
	}

	return data;
}

/**
 * Marks a payment as paid using either sessionId or providerPaymentId
 * Used when webhook confirms successful payment
 */
export async function markPaymentPaid({
	sessionId,
	providerPaymentId,
	method,
	paidAt,
	rawEvent
}: MarkPaymentPaidParams): Promise<PaymentRecord> {
	if (!sessionId && !providerPaymentId) {
		throw new Error('Either sessionId or providerPaymentId must be provided');
	}

	// Build the update query with the appropriate filter
	const baseUpdate = {
		status: 'paid' as const,
		method,
		paid_at: paidAt.toISOString(),
		raw_event: rawEvent as Json
	};

	let updateQuery;
	if (sessionId) {
		updateQuery = supabaseAdmin
			.from('payment_records')
			.update(baseUpdate)
			.eq('session_id', sessionId);
	} else if (providerPaymentId) {
		updateQuery = supabaseAdmin
			.from('payment_records')
			.update(baseUpdate)
			.eq('provider_payment_id', providerPaymentId);
	} else {
		throw new Error('Either sessionId or providerPaymentId must be provided');
	}

	const { data, error } = await updateQuery.select().single();

	if (error) {
		throw new Error(`Failed to mark payment as paid: ${error.message}`);
	}

	if (!data) {
		throw new Error('Payment record not found');
	}

	return data;
}

/**
 * Marks a payment as failed using either sessionId or providerPaymentId
 * Used when webhook indicates payment failure
 */
export async function markPaymentFailed({
	sessionId,
	providerPaymentId,
	reason,
	rawEvent
}: MarkPaymentFailedParams): Promise<PaymentRecord> {
	if (!sessionId && !providerPaymentId) {
		throw new Error('Either sessionId or providerPaymentId must be provided');
	}

	// Build the where clause based on what identifier we have
	const baseUpdate = {
		status: 'failed' as const,
		reason,
		raw_event: rawEvent as Json
	};

	let failedQuery;
	if (sessionId) {
		failedQuery = supabaseAdmin
			.from('payment_records')
			.update(baseUpdate)
			.eq('session_id', sessionId);
	} else if (providerPaymentId) {
		failedQuery = supabaseAdmin
			.from('payment_records')
			.update(baseUpdate)
			.eq('provider_payment_id', providerPaymentId);
	} else {
		throw new Error('Either sessionId or providerPaymentId must be provided');
	}

	const { data, error } = await failedQuery.select().single();

	if (error) {
		throw new Error(`Failed to mark payment as failed: ${error.message}`);
	}

	if (!data) {
		throw new Error('Payment record not found');
	}

	return data;
}

/**
 * Retrieves a payment record by session ID
 */
export async function getPaymentBySessionId(sessionId: string): Promise<PaymentRecord | null> {
	const { data, error } = await supabaseAdmin
		.from('payment_records')
		.select('*')
		.eq('session_id', sessionId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			// No rows returned
			return null;
		}
		throw new Error(`Failed to get payment by session ID: ${error.message}`);
	}

	return data;
}

/**
 * Retrieves a payment record by provider payment ID
 */
export async function getPaymentByProviderId(
	providerPaymentId: string
): Promise<PaymentRecord | null> {
	const { data, error } = await supabaseAdmin
		.from('payment_records')
		.select('*')
		.eq('provider_payment_id', providerPaymentId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			// No rows returned
			return null;
		}
		throw new Error(`Failed to get payment by provider ID: ${error.message}`);
	}

	return data;
}

/**
 * Lists payment records for a user with pagination
 */
export async function listPaymentsByUser({
	userId,
	limit = 50,
	cursor
}: ListPaymentsByUserParams): Promise<{
	data: PaymentRecord[];
	hasMore: boolean;
	nextCursor?: string;
}> {
	let query = supabaseAdmin
		.from('payment_records')
		.select('*')
		.eq('user_id', userId)
		.order('created_at', { ascending: false })
		.limit(limit + 1); // Get one extra to check if there are more

	if (cursor) {
		query = query.lt('created_at', cursor);
	}

	const { data, error } = await query;

	if (error) {
		throw new Error(`Failed to list payments by user: ${error.message}`);
	}

	const hasMore = data.length > limit;
	const results = hasMore ? data.slice(0, limit) : data;
	const nextCursor = hasMore ? results[results.length - 1].created_at : undefined;

	return {
		data: results,
		hasMore,
		nextCursor
	};
}

/**
 * Checks if a webhook event has already been processed (idempotency check)
 */
export async function hasProcessedWebhookEvent(eventId: string): Promise<boolean> {
	const { data, error } = await supabaseAdmin
		.from('webhook_events')
		.select('id')
		.eq('event_id', eventId)
		.single();

	if (error) {
		if (error.code === 'PGRST116') {
			// No rows returned - event hasn't been processed
			return false;
		}
		throw new Error(`Failed to check webhook event: ${error.message}`);
	}

	return !!data;
}

/**
 * Marks a webhook event as processed for idempotency
 */
export async function markWebhookEventProcessed(
	eventId: string,
	eventType: string,
	rawPayload: Record<string, any>,
	provider: string = 'paymongo'
): Promise<WebhookEvent> {
	const insertData: WebhookEventInsert = {
		event_id: eventId,
		event_type: eventType,
		provider,
		raw_payload: rawPayload as Json
	};

	const { data, error } = await supabaseAdmin
		.from('webhook_events')
		.insert(insertData)
		.select()
		.single();

	if (error) {
		// If it's a unique constraint violation, the event was already processed
		if (error.code === '23505') {
			// Get the existing record
			const { data: existing } = await supabaseAdmin
				.from('webhook_events')
				.select('*')
				.eq('event_id', eventId)
				.single();

			if (existing) {
				return existing;
			}
		}
		throw new Error(`Failed to mark webhook event as processed: ${error.message}`);
	}

	return data;
}

/**
 * SECURITY: Transaction helper for database operations
 * 
 * NOTE: Supabase JS client doesn't support native PostgreSQL transactions.
 * For critical operations like payment processing, use the SQL functions:
 * - process_payment_add_credits() for atomic payment + credit operations
 * - mark_payment_failed_atomic() for atomic payment failure marking
 * 
 * This function provides best-effort sequential execution with error handling.
 * For true ACID transactions, use the SQL RPC functions instead.
 */
export async function executeInTransaction<T>(operation: () => Promise<T>): Promise<T> {
	// Note: This is NOT a true database transaction.
	// For critical operations, use the SQL RPC functions directly.
	console.warn('[Persistence] executeInTransaction does not provide true ACID guarantees. Use SQL RPC functions for critical operations.');
	
	try {
		return await operation();
	} catch (error) {
		// Log the error for debugging
		console.error('[Persistence] Transaction-like operation failed:', error);
		throw error;
	}
}

/**
 * SECURITY: Process payment and add credits atomically using SQL transaction
 * This ensures both operations succeed or both fail, preventing:
 * - Money lost (payment marked paid but credits not added)
 * - Double-crediting (credits added but payment not marked)
 */
export async function processPaymentAndAddCreditsAtomic(params: {
	sessionId: string;
	providerPaymentId: string | null;
	method: string;
	paidAt: Date;
	rawEvent: Record<string, any>;
	userId: string;
	orgId: string;
	creditsToAdd: number;
	packageName: string;
	packageId: string;
	amountPhp: number;
}): Promise<{
	success: boolean;
	newBalance?: number;
	oldBalance?: number;
	error?: string;
}> {
	const { data, error } = await supabaseAdmin.rpc('process_payment_add_credits' as any, {
		p_session_id: params.sessionId,
		p_provider_payment_id: params.providerPaymentId,
		p_method: params.method,
		p_paid_at: params.paidAt.toISOString(),
		p_raw_event: params.rawEvent,
		p_user_id: params.userId,
		p_org_id: params.orgId,
		p_credits_to_add: params.creditsToAdd,
		p_package_name: params.packageName,
		p_package_id: params.packageId,
		p_amount_php: params.amountPhp
	});

	if (error) {
		console.error('[Persistence] processPaymentAndAddCreditsAtomic failed:', error);
		return { success: false, error: error.message };
	}

	const result = Array.isArray(data) ? data[0] : data;
	
	if (!result?.payment_updated || !result?.credits_added) {
		return { 
			success: false, 
			error: result?.error_message || 'Transaction failed' 
		};
	}

	return {
		success: true,
		newBalance: result.new_balance,
		oldBalance: result.old_balance
	};
}

/**
 * SECURITY: Mark payment as failed atomically using SQL transaction
 */
export async function markPaymentFailedAtomic(params: {
	sessionId?: string;
	providerPaymentId?: string;
	reason: string;
	rawEvent?: Record<string, any>;
}): Promise<{
	success: boolean;
	paymentId?: string;
	error?: string;
}> {
	if (!params.sessionId && !params.providerPaymentId) {
		return { success: false, error: 'Either sessionId or providerPaymentId must be provided' };
	}

	const { data, error } = await supabaseAdmin.rpc('mark_payment_failed_atomic' as any, {
		p_session_id: params.sessionId || null,
		p_provider_payment_id: params.providerPaymentId || null,
		p_reason: params.reason,
		p_raw_event: params.rawEvent || {}
	});

	if (error) {
		console.error('[Persistence] markPaymentFailedAtomic failed:', error);
		return { success: false, error: error.message };
	}

	const result = Array.isArray(data) ? data[0] : data;
	
	if (!result?.success) {
		return { 
			success: false, 
			error: result?.error_message || 'Transaction failed' 
		};
	}

	return {
		success: true,
		paymentId: result.payment_id
	};
}

/**
 * Updates a payment record with provider payment ID
 * Used when we get the provider payment ID after initial checkout creation
 */
export async function updatePaymentWithProviderId(
	sessionId: string,
	providerPaymentId: string
): Promise<PaymentRecord> {
	const { data, error } = await supabaseAdmin
		.from('payment_records')
		.update({ provider_payment_id: providerPaymentId })
		.eq('session_id', sessionId)
		.select()
		.single();

	if (error) {
		throw new Error(`Failed to update payment with provider ID: ${error.message}`);
	}

	if (!data) {
		throw new Error('Payment record not found');
	}

	return data;
}

/**
 * Gets payment statistics for a user
 */
export async function getPaymentStats(userId: string): Promise<{
	totalPaid: number;
	totalAmount: number;
	successfulPayments: number;
	failedPayments: number;
}> {
	const { data, error } = await supabaseAdmin
		.from('payment_records')
		.select('status, amount_php')
		.eq('user_id', userId);

	if (error) {
		throw new Error(`Failed to get payment stats: ${error.message}`);
	}

	const stats = data.reduce(
		(acc, payment) => {
			acc.totalAmount += payment.amount_php;
			if (payment.status === 'paid') {
				acc.totalPaid += payment.amount_php;
				acc.successfulPayments++;
			} else if (payment.status === 'failed') {
				acc.failedPayments++;
			}
			return acc;
		},
		{
			totalPaid: 0,
			totalAmount: 0,
			successfulPayments: 0,
			failedPayments: 0
		}
	);

	return stats;
}
