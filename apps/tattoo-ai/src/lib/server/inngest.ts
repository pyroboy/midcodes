import { Inngest } from 'inngest';
import { env } from '$env/dynamic/private';
import { db } from './db';
import { chatHistory, inquiries, users } from './schema';
import { eq } from 'drizzle-orm';
import { generateText } from 'ai';
import { model, systemPrompt } from './ai';
import { sendMessage } from './messenger';

export const inngest = new Inngest({
	id: 'tattoo-ai',
	eventKey: env.INNGEST_EVENT_KEY,
	signingKey: env.INNGEST_SIGNING_KEY
});

export const processMessengerWebhook = inngest.createFunction(
	{ id: 'process-messenger-webhook' },
	{ event: 'messenger/webhook' },
	async ({ event }) => {
		const { senderId, text } = event.data;

		if (!text) return;

		// Get or create user
		let user = await db.query.users.findFirst({
			where: eq(users.fb_id, senderId)
		});

		if (!user) {
			const [newUser] = await db
				.insert(users)
				.values({
					fb_id: senderId,
					name: `User ${senderId.substring(0, 6)}`
				})
				.returning();

			user = newUser;
		}

		// Save user message to chat history
		await db.insert(chatHistory).values({
			fb_id: senderId,
			role: 'user',
			content: text
		});

		// Get conversation history for context
		const history = await db.query.chatHistory.findMany({
			where: eq(chatHistory.fb_id, senderId),
			orderBy: (ch) => ch.timestamp
		});

		// Generate AI response
		const { text: aiResponse } = await generateText({
			model,
			system: systemPrompt,
			messages: history.map((h) => ({
				role: h.role as 'user' | 'assistant',
				content: h.content
			}))
		});

		// Save AI response to chat history
		await db.insert(chatHistory).values({
			fb_id: senderId,
			role: 'assistant',
			content: aiResponse
		});

		// Send response via Messenger
		await sendMessage(senderId, aiResponse);
	}
);

export const sendBookingConfirmation = inngest.createFunction(
	{ id: 'send-booking-confirmation' },
	{ event: 'booking/confirmed' },
	async ({ event }) => {
		const { fbId, inquiryId } = event.data;

		const inquiry = await db.query.inquiries.findFirst({
			where: eq(inquiries.id, inquiryId)
		});

		if (!inquiry) return;

		const confirmationMessage = `Thank you! Your tattoo booking has been confirmed.

📅 Scheduled: ${inquiry.scheduled_at ? new Date(inquiry.scheduled_at).toLocaleString() : 'TBD'}
💰 Price: ₱${inquiry.quoted_price}

We look forward to seeing you!`;

		await sendMessage(fbId, confirmationMessage);
	}
);
