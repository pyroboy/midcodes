/**
 * In-memory SSE broadcaster for the kitchen orders stream.
 * Module-level state persists across requests (Node.js singleton).
 * Each branch app instance has its own set of clients.
 *
 * Supports Last-Event-ID for resumable SSE: maintains a ring buffer
 * of recent events so reconnecting clients can replay missed snapshots
 * instead of waiting for the next push.
 */
const encoder = new TextEncoder();

const clients = new Set<ReadableStreamDefaultController<Uint8Array>>();
let latestSnapshot: unknown = null;

// ─── Ring buffer for event replay ────────────────────────────────────────────
const RING_BUFFER_SIZE = 50;
let eventIdCounter = 0;

interface BufferedEvent {
	id: number;
	data: string;
}

const eventRingBuffer: BufferedEvent[] = [];

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

/** Returns events after the given ID from the ring buffer. */
export function getEventsSince(lastEventId: number): BufferedEvent[] {
	const idx = eventRingBuffer.findIndex((e) => e.id > lastEventId);
	if (idx === -1) return [];
	return eventRingBuffer.slice(idx);
}

/** Returns the current monotonic event ID. */
export function getLatestEventId(): number {
	return eventIdCounter;
}

/** Stores the snapshot and broadcasts it to all connected SSE clients with event IDs. */
export function broadcastSnapshot(data: unknown) {
	latestSnapshot = data;
	eventIdCounter++;
	const jsonData = JSON.stringify(data);

	// Store in ring buffer
	eventRingBuffer.push({ id: eventIdCounter, data: jsonData });
	if (eventRingBuffer.length > RING_BUFFER_SIZE) {
		eventRingBuffer.shift();
	}

	const msg = encoder.encode(`id: ${eventIdCounter}\nevent: snapshot\ndata: ${jsonData}\n\n`);
	for (const c of clients) {
		try {
			c.enqueue(msg);
		} catch {
			clients.delete(c);
		}
	}
}
