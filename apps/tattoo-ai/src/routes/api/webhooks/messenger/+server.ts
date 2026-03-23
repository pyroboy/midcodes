import { verifyWebhookToken, extractMessageData } from '$lib/server/messenger';
import { inngest } from '$lib/server/inngest';
import type { WebhookEvent } from '$lib/types';
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ url }) => {
	const mode = url.searchParams.get('hub.mode');
	const token = url.searchParams.get('hub.verify_token');
	const challenge = url.searchParams.get('hub.challenge');

	if (mode === 'subscribe' && token && challenge) {
		if (!verifyWebhookToken(token)) {
			return new Response(null, { status: 403 });
		}

		return new Response(challenge, { status: 200 });
	}

	return new Response(null, { status: 403 });
};

export const POST: RequestHandler = async ({ request }) => {
	try {
		const body = (await request.json()) as WebhookEvent;

		if (body.object !== 'page') {
			return json({ ok: true });
		}

		// Process each messaging event
		for (const entry of body.entry) {
			for (const message of entry.messaging || []) {
				const { senderId, text, imageUrl } = extractMessageData(message);

				if (text) {
					// Send to Inngest for async processing
					await inngest.send({
						name: 'messenger/webhook',
						data: {
							senderId,
							text,
							imageUrl: imageUrl || null
						}
					});
				}
			}
		}

		// Return 200 immediately to acknowledge receipt
		return json({ ok: true });
	} catch (error) {
		console.error('Webhook error:', error);
		return json({ ok: true }, { status: 200 });
	}
};
