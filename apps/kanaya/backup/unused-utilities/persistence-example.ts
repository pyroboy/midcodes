/**
 * Example usage of the payment persistence layer
 * Demonstrates proper usage patterns and transaction handling
 */

import {
	recordCheckoutInit,
	markPaymentPaid,
	markPaymentFailed,
	getPaymentBySessionId,
	getPaymentByProviderId,
	listPaymentsByUser,
	hasProcessedWebhookEvent,
	markWebhookEventProcessed,
	executeInTransaction,
	updatePaymentWithProviderId,
	getPaymentStats
} from './persistence';

/**
 * Example: Initialize a credit purchase checkout
 */
export async function exampleInitializeCreditCheckout() {
	const userId = 'user-123';
	const sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
	const idempotencyKey = `credit-purchase-${userId}-${Date.now()}`;

	try {
		const paymentRecord = await recordCheckoutInit({
			userId,
			sessionId,
			kind: 'credit',
			skuId: 'credits-100',
			amountPhp: 500,
			methodAllowed: ['gcash', 'paymaya', 'card'],
			idempotencyKey,
			metadata: {
				source: 'web-app',
				userAgent: 'Mozilla/5.0...',
				ipAddress: '192.168.1.1'
			}
		});

		console.log('Checkout initialized:', paymentRecord);
		return paymentRecord;
	} catch (error) {
		console.error('Failed to initialize checkout:', error);
		throw error;
	}
}

/**
 * Example: Update payment record with provider payment ID (after PayMongo response)
 */
export async function exampleUpdateWithProviderPaymentId(
	sessionId: string,
	providerPaymentId: string
) {
	try {
		const updatedPayment = await updatePaymentWithProviderId(sessionId, providerPaymentId);
		console.log('Payment updated with provider ID:', updatedPayment);
		return updatedPayment;
	} catch (error) {
		console.error('Failed to update with provider ID:', error);
		throw error;
	}
}

/**
 * Example: Process a successful payment webhook with transaction handling
 */
export async function exampleProcessSuccessfulPaymentWebhook(webhookPayload: any) {
	const eventId = webhookPayload.data.id;
	const providerPaymentId = webhookPayload.data.attributes.payment_intent_id;

	try {
		// Check if we've already processed this webhook event
		const alreadyProcessed = await hasProcessedWebhookEvent(eventId);
		if (alreadyProcessed) {
			console.log('Webhook event already processed, skipping');
			return { status: 'already_processed' };
		}

		// Execute credit granting in a transaction
		const result = await executeInTransaction(async () => {
			// 1. Mark the payment as paid
			const paidPayment = await markPaymentPaid({
				providerPaymentId,
				method: 'gcash',
				paidAt: new Date(),
				rawEvent: webhookPayload
			});

			// 2. Grant credits to user (example - would call credit service)
			await grantCreditsToUser(paidPayment.user_id, getCreditsForSku(paidPayment.sku_id));

			// 3. Mark webhook as processed
			await markWebhookEventProcessed(eventId, webhookPayload.data.type, webhookPayload);

			return { payment: paidPayment, status: 'success' };
		});

		console.log('Successfully processed payment webhook:', result);
		return result;
	} catch (error) {
		console.error('Failed to process payment webhook:', error);
		throw error;
	}
}

/**
 * Example: Process a failed payment webhook
 */
export async function exampleProcessFailedPaymentWebhook(webhookPayload: any) {
	const eventId = webhookPayload.data.id;
	const providerPaymentId = webhookPayload.data.attributes.payment_intent_id;
	const failureReason =
		webhookPayload.data.attributes.last_payment_error?.message || 'Payment failed';

	try {
		// Check if we've already processed this webhook event
		const alreadyProcessed = await hasProcessedWebhookEvent(eventId);
		if (alreadyProcessed) {
			console.log('Webhook event already processed, skipping');
			return { status: 'already_processed' };
		}

		// Mark the payment as failed
		const failedPayment = await markPaymentFailed({
			providerPaymentId,
			reason: failureReason,
			rawEvent: webhookPayload
		});

		// Mark webhook as processed
		await markWebhookEventProcessed(eventId, webhookPayload.data.type, webhookPayload);

		console.log('Marked payment as failed:', failedPayment);
		return { payment: failedPayment, status: 'failed' };
	} catch (error) {
		console.error('Failed to process failed payment webhook:', error);
		throw error;
	}
}

/**
 * Example: Get user payment history with pagination
 */
export async function exampleGetUserPaymentHistory(userId: string, cursor?: string) {
	try {
		const result = await listPaymentsByUser({
			userId,
			limit: 25,
			cursor
		});

		console.log(`Found ${result.data.length} payments for user ${userId}`);
		console.log(`Has more: ${result.hasMore}`);
		if (result.nextCursor) {
			console.log(`Next cursor: ${result.nextCursor}`);
		}

		return result;
	} catch (error) {
		console.error('Failed to get payment history:', error);
		throw error;
	}
}

/**
 * Example: Get payment statistics for a user
 */
export async function exampleGetUserPaymentStats(userId: string) {
	try {
		const stats = await getPaymentStats(userId);
		console.log('Payment statistics:', {
			totalPaid: `₱${stats.totalPaid.toFixed(2)}`,
			totalAmount: `₱${stats.totalAmount.toFixed(2)}`,
			successRate: `${((stats.successfulPayments / (stats.successfulPayments + stats.failedPayments)) * 100).toFixed(1)}%`,
			successfulPayments: stats.successfulPayments,
			failedPayments: stats.failedPayments
		});

		return stats;
	} catch (error) {
		console.error('Failed to get payment stats:', error);
		throw error;
	}
}

/**
 * Example: Lookup payment by various identifiers
 */
export async function exampleLookupPayment(identifier: string, type: 'session' | 'provider') {
	try {
		let payment;
		if (type === 'session') {
			payment = await getPaymentBySessionId(identifier);
		} else {
			payment = await getPaymentByProviderId(identifier);
		}

		if (payment) {
			console.log('Found payment:', payment);
		} else {
			console.log('Payment not found');
		}

		return payment;
	} catch (error) {
		console.error('Failed to lookup payment:', error);
		throw error;
	}
}

// Helper functions (these would be implemented elsewhere in your app)
async function grantCreditsToUser(userId: string, credits: number) {
	// This would interact with your credit system
	console.log(`Granting ${credits} credits to user ${userId}`);
	// Implementation would update user's credit balance
}

function getCreditsForSku(skuId: string): number {
	// Map SKU IDs to credit amounts
	const creditMap: Record<string, number> = {
		'credits-50': 50,
		'credits-100': 100,
		'credits-250': 250,
		'credits-500': 500
	};
	return creditMap[skuId] || 0;
}

/**
 * Example of comprehensive webhook handler that could be used in an API route
 */
export async function exampleWebhookHandler(request: Request) {
	try {
		const payload = await request.json();
		const eventType = payload.data?.type;

		if (!eventType) {
			throw new Error('Invalid webhook payload');
		}

		let result;
		switch (eventType) {
			case 'payment_intent.succeeded':
				result = await exampleProcessSuccessfulPaymentWebhook(payload);
				break;
			case 'payment_intent.payment_failed':
				result = await exampleProcessFailedPaymentWebhook(payload);
				break;
			default:
				console.log(`Unhandled webhook event type: ${eventType}`);
				result = { status: 'unhandled', eventType };
		}

		return new Response(JSON.stringify(result), {
			status: 200,
			headers: { 'Content-Type': 'application/json' }
		});
	} catch (error) {
		console.error('Webhook handler error:', error);
		return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' }
		});
	}
}
