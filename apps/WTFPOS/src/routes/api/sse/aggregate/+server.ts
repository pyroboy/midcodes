/**
 * Aggregate SSE endpoint — server-side proxy that connects to each branch's
 * /api/sse/kitchen-orders endpoint and merges the streams into one.
 *
 * The owner's browser connects here (same-origin, no CORS issues).
 * This server connects to branch servers over the local network.
 *
 * Configure branch URLs via environment variables:
 *   TAG_SSE_URL=http://192.168.1.10:3000
 *   PGL_SSE_URL=http://192.168.1.11:3000
 */
import { env } from '$env/dynamic/private';
import type { RequestHandler } from './$types';

const encoder = new TextEncoder();

const BRANCHES = [
	{ id: 'tag', name: 'Alta Citta (Tagbilaran)', url: env.TAG_SSE_URL ?? '' },
	{ id: 'pgl', name: 'Alona Beach (Panglao)',   url: env.PGL_SSE_URL ?? '' }
].filter((b) => b.url);

async function connectToBranch(
	branch: { id: string; name: string; url: string },
	enqueue: (chunk: Uint8Array) => void,
	signal: AbortSignal
) {
	try {
		const res = await fetch(`${branch.url}/api/sse/kitchen-orders`, { signal });
		if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

		// Notify client that this branch is live
		enqueue(
			encoder.encode(
				`event: branch-connected\ndata: ${JSON.stringify({ locationId: branch.id })}\n\n`
			)
		);

		// Forward raw SSE bytes — they already contain correctly formatted events
		const reader = res.body.getReader();
		while (!signal.aborted) {
			const { done, value } = await reader.read();
			if (done) break;
			enqueue(value);
		}
	} catch (e: unknown) {
		if (signal.aborted) return;
		enqueue(
			encoder.encode(
				`event: branch-error\ndata: ${JSON.stringify({ locationId: branch.id })}\n\n`
			)
		);
	}
}

export const GET: RequestHandler = ({ request }) => {
	const abort = new AbortController();
	request.signal.addEventListener('abort', () => abort.abort());

	const stream = new ReadableStream<Uint8Array>({
		start(c) {
			const enqueue = (chunk: Uint8Array) => {
				try {
					c.enqueue(chunk);
				} catch {
					// Client disconnected
				}
			};

			if (BRANCHES.length === 0) {
				enqueue(
					encoder.encode(
						`event: config-error\ndata: ${JSON.stringify({
							message: 'Set TAG_SSE_URL and PGL_SSE_URL environment variables to enable cross-branch aggregation.'
						})}\n\n`
					)
				);
			} else {
				// Connect to all branches concurrently — each runs independently
				for (const branch of BRANCHES) {
					connectToBranch(branch, enqueue, abort.signal).catch(() => {});
				}
			}

			// Keepalive so the connection survives through proxies
			const hb = setInterval(() => enqueue(encoder.encode(': ping\n\n')), 30_000);
			abort.signal.addEventListener('abort', () => clearInterval(hb));
		},
		cancel() {
			abort.abort();
		}
	});

	return new Response(stream, {
		headers: {
			'Content-Type': 'text/event-stream',
			'Cache-Control': 'no-cache',
			'Connection': 'keep-alive',
			'X-Accel-Buffering': 'no'
		}
	});
};
