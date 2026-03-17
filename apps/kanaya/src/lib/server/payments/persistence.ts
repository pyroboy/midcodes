import { db } from '$lib/server/db';
import * as schema from '$lib/server/schema';
import { eq, and, lt, desc, sql } from 'drizzle-orm';
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
}: RecordCheckoutInitParams) {
	try {
		// First check if a record with this idempotency key already exists
		const existingRecord = await db.query.paymentRecords.findFirst({
			where: eq(schema.paymentRecords.idempotencyKey, idempotencyKey)
		});

		if (existingRecord) {
			return existingRecord;
		}

		// Create new payment record
		const [data] = await db
			.insert(schema.paymentRecords)
			.values({
				userId,
				sessionId,
				providerPaymentId: providerPaymentId || null,
				kind,
				skuId,
				amountPhp: amountPhp.toString(), // Drizzle decimal is string
				currency: 'PHP',
				status: status === 'expired' ? 'failed' : status,
				method: null,
				methodAllowed: methodAllowed,
				idempotencyKey,
				metadata: metadata,
				reason: null
			})
			.returning();

		return data;
	} catch (err) {
		console.error('Error recording checkout init:', err);
		throw new Error('Failed to record checkout init');
	}
}

/**
 * Marks a payment as paid
 */
export async function markPaymentPaid({
	sessionId,
	providerPaymentId,
	method,
	paidAt,
	rawEvent
}: MarkPaymentPaidParams) {
	if (!sessionId && !providerPaymentId) {
		throw new Error('Either sessionId or providerPaymentId must be provided');
	}

	const baseUpdate = {
		status: 'paid',
		method,
		paidAt,
		rawEvent,
		updatedAt: new Date()
	};

	let whereClause;
	if (sessionId) {
		whereClause = eq(schema.paymentRecords.sessionId, sessionId);
	} else {
		whereClause = eq(schema.paymentRecords.providerPaymentId, providerPaymentId!);
	}

	const [data] = await db
		.update(schema.paymentRecords)
		.set(baseUpdate as any)
		.where(whereClause)
		.returning();

	if (!data) {
		throw new Error('Payment record not found');
	}

	return data;
}

/**
 * Marks a payment as failed
 */
export async function markPaymentFailed({
	sessionId,
	providerPaymentId,
	reason,
	rawEvent
}: MarkPaymentFailedParams) {
	if (!sessionId && !providerPaymentId) {
		throw new Error('Either sessionId or providerPaymentId must be provided');
	}

	const baseUpdate = {
		status: 'failed',
		reason,
		rawEvent,
		updatedAt: new Date()
	};

	let whereClause;
	if (sessionId) {
		whereClause = eq(schema.paymentRecords.sessionId, sessionId);
	} else {
		whereClause = eq(schema.paymentRecords.providerPaymentId, providerPaymentId!);
	}

	const [data] = await db
		.update(schema.paymentRecords)
		.set(baseUpdate as any)
		.where(whereClause)
		.returning();

	if (!data) {
		throw new Error('Payment record not found');
	}

	return data;
}

/**
 * Retrieves a payment record by session ID
 */
export async function getPaymentBySessionId(sessionId: string) {
	return (
		(await db.query.paymentRecords.findFirst({
			where: eq(schema.paymentRecords.sessionId, sessionId)
		})) || null
	);
}

/**
 * Retrieves a payment record by provider payment ID
 */
export async function getPaymentByProviderId(providerPaymentId: string) {
	return (
		(await db.query.paymentRecords.findFirst({
			where: eq(schema.paymentRecords.providerPaymentId, providerPaymentId)
		})) || null
	);
}

/**
 * Lists payment records for a user with pagination
 */
export async function listPaymentsByUser({ userId, limit = 50, cursor }: ListPaymentsByUserParams) {
	const results = await db
		.select()
		.from(schema.paymentRecords)
		.where(
			and(
				eq(schema.paymentRecords.userId, userId),
				cursor ? lt(schema.paymentRecords.createdAt, new Date(cursor)) : undefined
			)
		)
		.orderBy(desc(schema.paymentRecords.createdAt))
		.limit(limit + 1);

	const hasMore = results.length > limit;
	const data = hasMore ? results.slice(0, limit) : results;
	const nextCursor = hasMore ? data[data.length - 1].createdAt?.toISOString() : undefined;

	return {
		data: data as any[],
		hasMore,
		nextCursor
	};
}

/**
 * SECURITY: Atomically checks and marks a webhook event as processed
 */
export async function processWebhookEventAtomically(
	eventId: string,
	eventType: string,
	rawPayload: Record<string, any>,
	provider: string = 'paymongo'
) {
	try {
		const [event] = await db
			.insert(schema.webhookEvents)
			.values({
				eventId,
				eventType,
				provider,
				rawPayload
			})
			.onConflictDoNothing({ target: schema.webhookEvents.eventId })
			.returning();

		if (!event) {
			const existing = await db.query.webhookEvents.findFirst({
				where: eq(schema.webhookEvents.eventId, eventId)
			});
			return { alreadyProcessed: true, event: existing || null };
		}

		return { alreadyProcessed: false, event };
	} catch (err) {
		console.error('Error processing webhook event:', err);
		throw new Error('Failed to process webhook event');
	}
}

/**
 * SECURITY: Process payment and add credits atomically using Drizzle transaction
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
}) {
	try {
		return await db.transaction(async (tx) => {
			// 1. Update Payment Record
			const [payment] = await tx
				.update(schema.paymentRecords)
				.set({
					status: 'paid',
					method: params.method,
					paidAt: params.paidAt,
					rawEvent: params.rawEvent,
					providerPaymentId: params.providerPaymentId,
					updatedAt: new Date()
				})
				.where(eq(schema.paymentRecords.sessionId, params.sessionId))
				.returning();

			if (!payment) throw new Error('Payment record not found');
			if (payment.status !== 'paid') throw new Error('Failed to update payment status');

			// 2. Get Profile & Update Credits
			const profile = await tx.query.profiles.findFirst({
				where: and(eq(schema.profiles.id, params.userId), eq(schema.profiles.orgId, params.orgId))
			});

			if (!profile) throw new Error('User profile not found');

			const oldBalance = profile.creditsBalance;
			const newBalance = oldBalance + params.creditsToAdd;

			await tx
				.update(schema.profiles)
				.set({
					creditsBalance: newBalance,
					updatedAt: new Date()
				})
				.where(eq(schema.profiles.id, params.userId));

			// 3. Record Credit Transaction
			await tx.insert(schema.creditTransactions).values({
				userId: params.userId,
				orgId: params.orgId,
				transactionType: 'purchase',
				amount: params.creditsToAdd,
				creditsBefore: oldBalance,
				creditsAfter: newBalance,
				description: `Purchase: ${params.packageName}`,
				metadata: {
					packageId: params.packageId,
					amountPhp: params.amountPhp,
					sessionId: params.sessionId
				}
			});

			return {
				success: true,
				newBalance,
				oldBalance
			};
		});
	} catch (err) {
		console.error('Atomic payment processing failed:', err);
		return { success: false, error: err instanceof Error ? err.message : 'Transaction failed' };
	}
}

/**
 * SECURITY: Mark payment as failed atomically
 */
export async function markPaymentFailedAtomic(params: {
	sessionId?: string;
	providerPaymentId?: string;
	reason: string;
	rawEvent?: Record<string, any>;
}) {
	try {
		const result = await markPaymentFailed(params);
		return {
			success: true,
			paymentId: result.id
		};
	} catch (err) {
		return { success: false, error: err instanceof Error ? err.message : 'Update failed' };
	}
}

/**
 * Updates a payment record with provider payment ID
 */
export async function updatePaymentWithProviderId(sessionId: string, providerPaymentId: string) {
	const [data] = await db
		.update(schema.paymentRecords)
		.set({ providerPaymentId, updatedAt: new Date() })
		.where(eq(schema.paymentRecords.sessionId, sessionId))
		.returning();

	if (!data) {
		throw new Error('Payment record not found');
	}

	return data;
}

/**
 * Gets payment statistics for a user
 */
export async function getPaymentStats(userId: string) {
	const records = await db
		.select()
		.from(schema.paymentRecords)
		.where(eq(schema.paymentRecords.userId, userId));

	return records.reduce(
		(acc, payment) => {
			const amount = parseFloat(payment.amountPhp);
			acc.totalAmount += amount;
			if (payment.status === 'paid') {
				acc.totalPaid += amount;
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
}
