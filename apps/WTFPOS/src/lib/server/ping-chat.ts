/**
 * Ping Chat — lightweight in-memory message bus for network testing.
 * Clients POST a message, all SSE listeners see it instantly.
 * Used by the test-db Network Diagnostics page to verify
 * client→server→client round-trip in real time.
 *
 * Messages are ephemeral (lost on restart, max 50 kept).
 */

export interface PingMessage {
	id: string;
	from: string;       // device label (e.g. "📱 iPad (192.168.1.5)" or "💻 Server")
	fromIp: string;
	isServer: boolean;
	text: string;
	sentAt: string;      // ISO timestamp
}

type PingChatListener = (msg: PingMessage) => void;

const MAX_HISTORY = 50;
const messages: PingMessage[] = [];
const listeners = new Set<PingChatListener>();

/** Add a message and notify all listeners. */
export function addPingMessage(msg: PingMessage) {
	messages.push(msg);
	if (messages.length > MAX_HISTORY) messages.shift();
	for (const fn of listeners) {
		try { fn(msg); } catch { /* noop */ }
	}
}

/** Get recent message history. */
export function getPingHistory(): PingMessage[] {
	return [...messages];
}

/** Subscribe to new messages. Returns unsubscribe function. */
export function subscribePingChat(fn: PingChatListener): () => void {
	listeners.add(fn);
	return () => listeners.delete(fn);
}
