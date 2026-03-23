import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// PayMongo webhook handler - processes payment events
export const POST: RequestHandler = async ({ request }) => {
	try {
		const event = await request.json();

		// Verify webhook signature
		const signature = request.headers.get('x-paymongo-signature');
		if (!signature) {
			return json({ error: 'Unauthorized' }, { status: 401 });
		}

		// TODO: Verify HMAC signature against PayMongo secret

		// Handle different event types
		switch (event.type) {
			case 'payment.paid': {
				// Payment completed successfully
				// Update booking status to confirmed
				// Create revenue record
				break;
			}
			case 'payment.failed': {
				// Payment failed
				// Update booking status to cancelled
				break;
			}
			case 'payment.refunded': {
				// Payment refunded
				// Update booking and create refund record
				break;
			}
			default:
				console.log('Unhandled event type:', event.type);
		}

		return json({ ok: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return json({ error: 'Webhook processing failed' }, { status: 500 });
	}
};
