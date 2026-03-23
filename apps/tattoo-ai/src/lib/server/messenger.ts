import { env } from '$env/dynamic/private';
import type { MessengerMessage } from '$lib/types';

export async function sendMessage(recipientId: string, messageText: string): Promise<void> {
	const response = await fetch('https://graph.facebook.com/v18.0/me/messages', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json'
		},
		body: JSON.stringify({
			recipient: { id: recipientId },
			message: { text: messageText },
			access_token: env.FB_PAGE_ACCESS_TOKEN
		})
	});

	if (!response.ok) {
		throw new Error(`Failed to send message: ${response.statusText}`);
	}
}

export function verifyWebhookToken(token: string): boolean {
	return token === env.FB_VERIFY_TOKEN;
}

export async function downloadImage(imageUrl: string): Promise<Buffer> {
	const response = await fetch(imageUrl);
	if (!response.ok) {
		throw new Error(`Failed to download image: ${response.statusText}`);
	}
	return Buffer.from(await response.arrayBuffer());
}

export function extractMessageData(message: MessengerMessage): {
	senderId: string;
	text?: string;
	imageUrl?: string;
} {
	const senderId = message.sender.id;
	let text: string | undefined;
	let imageUrl: string | undefined;

	if (message.message?.text) {
		text = message.message.text;
	}

	if (message.message?.attachments) {
		const imageAttachment = message.message.attachments.find((a) => a.type === 'image');
		if (imageAttachment?.payload?.url) {
			imageUrl = imageAttachment.payload.url;
		}
	}

	return { senderId, text, imageUrl };
}
