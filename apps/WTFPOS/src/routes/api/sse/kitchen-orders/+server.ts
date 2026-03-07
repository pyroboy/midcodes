/**
 * Branch SSE endpoint — streams kitchen order snapshots for this location.
 * The browser push store (kitchen-push.ts) sends POST /api/events/kitchen-push
 * which calls broadcastSnapshot(), which fans out to all clients here.
 */
import type { RequestHandler } from './$types';
import { addClient, removeClient, getLatestSnapshot } from '$lib/server/kitchen-sse';

const encoder = new TextEncoder();

export const GET: RequestHandler = ({ request }) => {
	let controller!: ReadableStreamDefaultController<Uint8Array>;

	const stream = new ReadableStream<Uint8Array>({
		start(c) {
			controller = c;
			addClient(c);

			// Immediately replay the latest snapshot so new subscribers don't wait
			const snapshot = getLatestSnapshot();
			if (snapshot) {
				c.enqueue(encoder.encode(`event: snapshot\ndata: ${JSON.stringify(snapshot)}\n\n`));
			}

			// Keepalive heartbeat — prevents proxies/nginx from closing idle connections
			const hb = setInterval(() => {
				try {
					c.enqueue(encoder.encode(': ping\n\n'));
				} catch {
					clearInterval(hb);
				}
			}, 30_000);

			request.signal.addEventListener('abort', () => {
				clearInterval(hb);
				removeClient(c);
			});
		},
		cancel() {
			removeClient(controller);
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no' // Disables nginx response buffering
		}
	});
};
