/**
 * In-memory SSE broadcaster for the kitchen orders stream.
 * Module-level state persists across requests (Node.js singleton).
 * Each branch app instance has its own set of clients.
 */
const encoder = new TextEncoder();

const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
let latestSnapshot: unknown = null;

export function addClient(c: ReadableStreamDefaultController<Uint8Array>) {
	clients.add(c);
}

export function removeClient(c: ReadableStreamDefaultController<Uint8Array>) {
	clients.delete(c);
}

/** Returns the last pushed snapshot so new SSE clients get data immediately. */
export function getLatestSnapshot(): unknown {
	return latestSnapshot;
}

/** Stores the snapshot and broadcasts it to all connected SSE clients. */
export function broadcastSnapshot(data: unknown) {
	latestSnapshot = data;
	const msg = encoder.encode(`event: snapshot\ndata: ${JSON.stringify(data)}\n\n`);
	for (const c of clients) {
		try {
			c.enqueue(msg);
		} catch {
			clients.delete(c);
		}
	}
}
