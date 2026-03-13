/**
 * Ping Chat API — real-time message bus for network testing.
 *
 * POST: Send a message (from any device)
 * GET:  SSE stream — receives all messages in real-time
 *
 * Used by the test-db Network Diagnostics page to prove
 * bidirectional client↔server communication.
 */
import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { nanoid } from 'nanoid';
import { addPingMessage, getPingHistory, subscribePingChat } from '$lib/server/ping-chat';
import { displayIP, isLoopbackIP, trackClient } from '$lib/server/client-tracker';

export const POST: RequestHandler = async (event) => {
	const clientIp = event.getClientAddress();
	const userAgent = event.request.headers.get('user-agent') || '';
	trackClient(clientIp, userAgent, 'ping-chat/send');

	const body = await event.request.json();
	const text: string = body.text || 'ping';
	const dip = displayIP(clientIp);
	const isServer = isLoopbackIP(clientIp);

	const deviceHint = isServer ? '💻 Server' : `📱 ${dip}`;

	const msg = {
		id: nanoid(),
		from: body.from || deviceHint,
		fromIp: dip,
		isServer,
		text,
		sentAt: new Date().toISOString(),
	};

	addPingMessage(msg);

	return json({ ok: true, message: msg });
};

export const GET: RequestHandler = async (event) => {
	const clientIp = event.getClientAddress();
	const userAgent = event.request.headers.get('user-agent') || '';
	trackClient(clientIp, userAgent, 'ping-chat/stream');

	const stream = new ReadableStream({
		start(controller) {
			const encoder = new TextEncoder();

			function send(eventName: string, data: unknown) {
				controller.enqueue(encoder.encode(`event: ${eventName}\ndata: ${JSON.stringify(data)}\n\n`));
			}

			// Send history on connect
			const history = getPingHistory();
			send('history', history);

			// Subscribe to new messages
			const unsub = subscribePingChat((msg) => {
				try {
					send('message', msg);
				} catch {
					unsub();
				}
			});

			// Clean up on disconnect
			event.request.signal.addEventListener('abort', () => {
				unsub();
				try { controller.close(); } catch { /* already closed */ }
			});
		},
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
		},
	});
};
