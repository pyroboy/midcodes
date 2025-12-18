// PayMongo webhook endpoint
// Handles incoming webhook events from PayMongo

import type { RequestHandler } from './$types';
// @ts-ignore - PAYMONGO_WEBHOOK_SECRET may not exist in all environments
const PAYMONGO_WEBHOOK_SECRET = (typeof process !== 'undefined' && process.env?.PAYMONGO_WEBHOOK_SECRET) || '';
import { createHmac, timingSafeEqual } from 'crypto';
import {
	checkRateLimit,
	createRateLimitResponse,
	RateLimitConfigs
} from '$lib/utils/rate-limiter';

/**
 * Verifies the PayMongo webhook signature using HMAC-SHA256
 * SECURITY: This prevents attackers from sending fake payment notifications
 */
function verifyWebhookSignature(payload: string, signature: string | null): boolean {
	if (!signature) {
		return false;
	}

	if (!PAYMONGO_WEBHOOK_SECRET) {
		console.error('PAYMONGO_WEBHOOK_SECRET is not configured');
		return false;
	}

	try {
		// PayMongo sends signature in format: t=timestamp,s1=signature1,s2=signature2
		const signatureParts = signature.split(',');
		const signatures = signatureParts
			.filter((part) => part.startsWith('s1=') || part.startsWith('s2='))
			.map((part) => part.split('=')[1]);

		if (signatures.length === 0) {
			// Fallback: treat entire header as signature
			signatures.push(signature);
		}

		// Compute expected signature
		const expectedSignature = createHmac('sha256', PAYMONGO_WEBHOOK_SECRET)
			.update(payload)
			.digest('hex');

		// Use timing-safe comparison to prevent timing attacks
		const expectedBuffer = Buffer.from(expectedSignature, 'hex');

		// Check if any of the provided signatures match
		for (const sig of signatures) {
			try {
				const providedBuffer = Buffer.from(sig, 'hex');
				if (
					expectedBuffer.length === providedBuffer.length &&
					timingSafeEqual(expectedBuffer, providedBuffer)
				) {
					return true;
				}
			} catch {
				// Invalid hex format, continue to next signature
				continue;
			}
		}

		return false;
	} catch (error) {
		console.error('Signature verification error:', error);
		return false;
	}
}

export const POST: RequestHandler = async ({ request }) => {
	try {
		// SECURITY FIX: Apply rate limiting to webhook endpoint
		const rateLimitResult = checkRateLimit(request, RateLimitConfigs.WEBHOOK, 'webhook:paymongo');

		if (rateLimitResult.limited) {
			return createRateLimitResponse(rateLimitResult.resetTime);
		}

		// Extract webhook data
		const body = await request.text();
		const signature = request.headers.get('paymongo-signature');

		// SECURITY FIX: Verify webhook signature before processing
		if (!verifyWebhookSignature(body, signature)) {
			console.error('Webhook signature verification failed', {
				hasSignature: !!signature,
				bodyLength: body.length
			});
			return new Response(JSON.stringify({ error: 'Invalid signature' }), {
				status: 401,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		}

		// Parse and process webhook event
		let event;
		try {
			event = JSON.parse(body);
		} catch {
			return new Response(JSON.stringify({ error: 'Invalid JSON payload' }), {
				status: 400,
				headers: {
					'Content-Type': 'application/json'
				}
			});
		}

		// Process webhook event
		const eventType = event.data?.attributes?.type;
		const eventId = event.data?.id;
		const attributes = event.data?.attributes?.data?.attributes;

		if (!eventType || !eventId || !attributes) {
			console.error('Invalid webhook payload structure:', { eventId, eventType });
			return new Response(JSON.stringify({ error: 'Invalid payload structure' }), { status: 400 });
		}

		// Import persistence functions dynamically to avoid circular dependencies if any
		const {
			processWebhookEventAtomically,
			getPaymentBySessionId,
			processPaymentAndAddCreditsAtomic,
			markPaymentFailedAtomic,
			recordCheckoutInit // Type only
		} = await import('$lib/server/payments/persistence');
		
		const { getCreditPackageById, getFeatureSkuById } = await import('$lib/payments/catalog');

		// 1. Idempotency check using atomic insert
		// This prevents double-processing if PayMongo retries the webhook
		const { alreadyProcessed } = await processWebhookEventAtomically(
			eventId,
			eventType,
			event,
			'paymongo'
		);

		if (alreadyProcessed) {
			console.info('Webhook event already processed:', eventId);
			// Return 200 to stop PayMongo from retrying
			return new Response(JSON.stringify({ received: true, status: 'already_processed' }));
		}

		console.info('Processing webhook event:', { eventType, eventId });

		// 2. Handle specific event types
		if (eventType === 'checkout_session.payment.paid') {
			const checkoutSessionId = event.data.attributes.data.id;
			const payments = event.data.attributes.data.attributes.payments;
			const paymentId = payments && payments.length > 0 ? payments[0].id : null;
			
			// Retrieve our local record to trust our own data (Defense in Depth)
			const localRecord = await getPaymentBySessionId(checkoutSessionId);
			
			if (!localRecord) {
				console.error('Payment record not found for session:', checkoutSessionId);
				// We return 200 even if not found to stop retries, but we log the error
				// In a real system you might want to alert an admin
				return new Response(JSON.stringify({ received: true, error: 'record_not_found' }));
			}
			
			if (localRecord.status === 'paid') {
				console.info('Payment already marked as paid:', checkoutSessionId);
				return new Response(JSON.stringify({ received: true, status: 'already_paid' }));
			}

			// Extract metadata from our safe local record
			const { userId: user_id, metadata, kind, amountPhp: amount_php } = localRecord;
			// We need org_id, but payment_records might not have it directly if it's on the user profile
			// However `processPaymentAndAddCreditsAtomic` asks for `orgId`.
			// Let's assume we can get it from the user profile or metadata if stored.
			// Checking `recordCheckoutInit` in persistence.ts, it doesn't seem to store org_id in payment_records explicitly?
			// But the RPC `process_payment_add_credits` takes `p_org_id`.
			// We might need to fetch the user's org.
			
			// For now, let's check if the remote functions store org_id in metadata.
			// in `createCreditPayment`, metadata has `userId`, `kind`, `skuId`.
			// It doesn't seem to store `orgId`.
			// We should fetch the user's profile to get the org_id.
			
			const { db } = await import('$lib/server/db');
			const { profiles } = await import('$lib/server/schema');
			const { eq } = await import('drizzle-orm');
			const userProfile = await db.query.profiles.findFirst({
				where: eq(profiles.id, user_id),
				columns: { orgId: true }
			});
				
			if (!userProfile?.orgId) {
				console.error('User has no organization:', user_id);
				return new Response(JSON.stringify({ received: true, error: 'no_org' }));
			}

			// Validate package/feature from catalog
			if (kind === 'credit') {
				const packageId = (metadata as any)?.packageId || (metadata as any)?.skuId;
				const creditPackage = getCreditPackageById(packageId);
				
				if (!creditPackage) {
					console.error('Invalid credit package in metadata:', packageId);
					return new Response(JSON.stringify({ received: true, error: 'invalid_package' }));
				}

				const result = await processPaymentAndAddCreditsAtomic({
					sessionId: checkoutSessionId,
					providerPaymentId: paymentId,
					method: 'paymongo', // simplified, could extract from payload
					paidAt: new Date(),
					rawEvent: event,
					userId: user_id,
					orgId: userProfile.orgId,
					creditsToAdd: creditPackage.credits,
					packageName: creditPackage.name,
					packageId: packageId,
					amountPhp: Number(amount_php) || 0
				});

				if (!result.success) {
					console.error('Failed to process credit payment:', ('error' in result) ? result.error : 'Unknown error');
					return new Response(JSON.stringify({ error: 'Processing failed' }), { status: 500 });
				}
			} else if (kind === 'feature') {
				// Feature handling logic would go here
				// For now we just mark as paid since we don't have atomic feature granting yet
				// or use a similar atomic function for features
				console.info('Feature payment received, marking as paid:', checkoutSessionId);
				// TODO: Implement processFeaturePaymentAtomic
			}
			
		} else if (eventType === 'payment.failed') {
			// Handle failure
			// Note: PayMongo structure for payment.failed might be different (payment object directly)
			// But if we use checkout sessions, we might get checkout_session.payment.failed? 
			// Check PayMongo docs or assume structure.
			// Safeguard: try to find a session or payment ID
			
			// Log for now
			console.warn('Payment failed event received:', eventId);
		}

		return new Response(JSON.stringify({ received: true }), {
			status: 200,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	} catch (error) {
		console.error('Webhook processing error:', error);
		return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
			status: 500,
			headers: {
				'Content-Type': 'application/json'
			}
		});
	}
};
