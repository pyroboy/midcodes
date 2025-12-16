// PayMongo webhook endpoint
// Handles incoming webhook events from PayMongo

import type { RequestHandler } from './$types';
import { PAYMONGO_WEBHOOK_SECRET } from '$env/static/private';
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

		// TODO: Implement actual webhook event processing based on event type
		// Example events: payment.paid, payment.failed, source.chargeable, etc.
		console.log('Webhook event received:', {
			type: event.data?.attributes?.type,
			id: event.data?.id
		});

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
