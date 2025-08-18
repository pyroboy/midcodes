// Crypto utilities for PayMongo client
import { randomBytes, createHmac, timingSafeEqual } from 'crypto';

/**
 * Generate a unique idempotency key for PayMongo API calls
 * PayMongo uses idempotency keys to prevent duplicate requests
 */
export function generateIdempotencyKey(): string {
	// Generate a random 32-byte (256-bit) key and convert to hex
	return randomBytes(32).toString('hex');
}

/**
 * Verify PayMongo webhook signature
 * @param signatureHeader The value of the 'Paymongo-Signature' header
 * @param rawBody The raw request body
 * @param webhookSecret The webhook secret from your PayMongo dashboard
 * @returns True if the signature is valid, false otherwise
 */
export function verifyPayMongoWebhook(
	signatureHeader: string,
	rawBody: string,
	webhookSecret: string
): boolean {
	if (!signatureHeader) {
		return false;
	}

	const parts = signatureHeader.split(',');
	const timestamp = parts.find((part) => part.startsWith('t='))?.split('=')[1];
	const testSignature = parts.find((part) => part.startsWith('te='))?.split('=')[1];
	const liveSignature = parts.find((part) => part.startsWith('li='))?.split('=')[1];

	if (!timestamp || (!testSignature && !liveSignature)) {
		return false;
	}

	const payload = `${timestamp}.${rawBody}`;
	const expectedSignature = createHmac('sha256', webhookSecret).update(payload).digest('hex');

	const signatureToVerify = liveSignature || testSignature;

	if (!signatureToVerify) {
		return false;
	}

	return timingSafeEqual(
		Buffer.from(signatureToVerify, 'hex'),
		Buffer.from(expectedSignature, 'hex')
	);
}
