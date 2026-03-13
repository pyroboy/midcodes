/**
 * Lightweight level-gated server logger.
 * Reads LOG_LEVEL from environment at import time.
 *
 * Levels: error(0) > warn(1) > info(2) > debug(3) > trace(4)
 * Default: info — shows errors, warnings, connections, and milestones.
 * Usage: LOG_LEVEL=debug pnpm dev
 */

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3, trace: 4 } as const;
type Level = keyof typeof LEVELS;

const envLevel = (process.env.LOG_LEVEL ?? 'info').toLowerCase() as Level;
const threshold = LEVELS[envLevel] ?? LEVELS.info;

function shouldLog(level: Level): boolean {
	return LEVELS[level] <= threshold;
}

function fmt(tag: string, msg: string): string {
	return `[${tag}] ${msg}`;
}

// ── Sync pull batcher ─────────────────────────────────────
// Collects pulls from the same device over a 400ms window, then logs one line:
//   [Sync] ❤️  📱 Maria Santos ⬇ 334 docs — tables:16 orders:154 menu:33 kds:130 devices:1
let _heartTick = 0;
function heartbeat() {
	_heartTick++;
	return _heartTick % 2 === 0 ? '❤️ ' : '🤍';
}

interface PullBatch {
	label: string;
	collections: Map<string, { pulled: number; store: number }>;
	total: number;
	timer: ReturnType<typeof setTimeout>;
}

const _pullBatches = new Map<string, PullBatch>();

function flushPullBatch(key: string) {
	const batch = _pullBatches.get(key);
	if (!batch) return;
	_pullBatches.delete(key);

	const parts = Array.from(batch.collections.entries())
		.sort((a, b) => b[1].pulled - a[1].pulled)
		.map(([col, v]) => `${col}:${v.pulled}`)
		.join('  ');

	const heart = heartbeat();
	const msg = `${heart} ${batch.label} ⬇ ${batch.total} docs — ${parts}`;

	// Suppress tiny pulls (1-2 docs) to debug — these are incremental updates, not interesting
	if (batch.total <= 2) {
		if (shouldLog('debug')) console.log(fmt('Sync', msg));
	} else {
		if (shouldLog('info')) console.log(fmt('Sync', msg));
	}
}

export function logPullBatch(label: string, collection: string, docCount: number, storeCount: number) {
	const key = label; // group by device label
	let batch = _pullBatches.get(key);

	if (!batch) {
		batch = {
			label,
			collections: new Map(),
			total: 0,
			timer: setTimeout(() => flushPullBatch(key), 800),
		};
		_pullBatches.set(key, batch);
	} else {
		// Reset the debounce timer on each new pull
		clearTimeout(batch.timer);
		batch.timer = setTimeout(() => flushPullBatch(key), 800);
	}

	const existing = batch.collections.get(collection);
	if (existing) {
		existing.pulled += docCount;
		existing.store = storeCount;
	} else {
		batch.collections.set(collection, { pulled: docCount, store: storeCount });
	}
	batch.total += docCount;
}

// ── SSE connect/disconnect batcher ───────────────────────
// Collects SSE events over a 500ms window, then logs one consolidated line:
//   [SSE] ✦ Server + Android Phone connected (2 active)
//   [SSE] ✧ Server + Android Phone disconnected (0 active)
interface SseEvent {
	label: string;
	type: 'connect' | 'disconnect';
	activeCount: number;
	extra?: string; // data status for connects
}

let _sseBatch: SseEvent[] = [];
let _sseTimer: ReturnType<typeof setTimeout> | null = null;

function flushSseBatch() {
	_sseTimer = null;
	if (_sseBatch.length === 0) return;
	if (!shouldLog('info')) { _sseBatch = []; return; }

	const connects = _sseBatch.filter(e => e.type === 'connect');
	const disconnects = _sseBatch.filter(e => e.type === 'disconnect');

	if (disconnects.length > 0) {
		const names = disconnects.map(e => e.label).join(' + ');
		const last = disconnects[disconnects.length - 1];
		console.log(fmt('SSE', `✧ ${names} disconnected (${last.activeCount} active)`));
	}
	if (connects.length > 0) {
		const names = connects.map(e => e.label).join(' + ');
		const last = connects[connects.length - 1];
		const extra = last.extra ? ` | ${last.extra}` : '';
		console.log(fmt('SSE', `✦ ${names} connected (${last.activeCount} active)${extra}`));
	}
	_sseBatch = [];
}

export function logSseEvent(label: string, type: 'connect' | 'disconnect', activeCount: number, extra?: string) {
	_sseBatch.push({ label, type, activeCount, extra });
	if (_sseTimer) clearTimeout(_sseTimer);
	_sseTimer = setTimeout(flushSseBatch, 500);
}

// ── Visual width helpers ──────────────────────────────────
// Emojis take 2 terminal columns but padEnd counts code units.
// This calculates the actual display width so box edges align.
function visualWidth(str: string): number {
	let w = 0;
	for (const ch of str) {
		const cp = ch.codePointAt(0)!;
		if (
			cp >= 0x10000 ||                         // Supplementary planes (most emoji)
			(cp >= 0x2600 && cp <= 0x27BF) ||        // Misc symbols & dingbats
			(cp >= 0x2B50 && cp <= 0x2B55) ||        // Stars, circles
			(cp >= 0x2300 && cp <= 0x23FF) ||        // Misc technical
			cp === 0x2705 || cp === 0x274C ||        // ✅ ❌
			cp === 0x26A0 || cp === 0x2714 ||        // ⚠ ✔
			cp === 0x2139                            // ℹ
		) {
			w += 2;
		} else {
			w += 1;
		}
	}
	return w;
}

function visualPadEnd(str: string, targetWidth: number): string {
	const vw = visualWidth(str);
	const padding = Math.max(0, targetWidth - vw);
	return str + ' '.repeat(padding);
}

// ── Logger ────────────────────────────────────────────────
export const log = {
	error(tag: string, msg: string, ...args: any[]) {
		console.error(fmt(tag, `❌ ${msg}`), ...args);
	},
	warn(tag: string, msg: string, ...args: any[]) {
		if (shouldLog('warn')) console.warn(fmt(tag, `⚠️ ${msg}`), ...args);
	},
	info(tag: string, msg: string, ...args: any[]) {
		if (shouldLog('info')) console.log(fmt(tag, msg), ...args);
	},
	debug(tag: string, msg: string, ...args: any[]) {
		if (shouldLog('debug')) console.log(fmt(tag, msg), ...args);
	},
	trace(tag: string, msg: string, ...args: any[]) {
		if (shouldLog('trace')) console.log(fmt(tag, msg), ...args);
	},
	/** Boxed banner — auto-sizes to content, handles emoji widths */
	banner(...lines: string[]) {
		if (!shouldLog('info')) return;

		// Pre-compute visual widths to avoid double iteration
		const widths = lines.map(visualWidth);
		let maxVw = 58;
		for (const w of widths) {
			if (w > maxVw) maxVw = w;
		}
		const innerWidth = maxVw + 2; // +2 for leading indent

		console.log('');
		console.log('╔' + '═'.repeat(innerWidth) + '╗');
		for (let i = 0; i < lines.length; i++) {
			const padding = Math.max(0, maxVw - widths[i]);
			console.log(`║  ${lines[i]}${' '.repeat(padding)}║`);
		}
		console.log('╚' + '═'.repeat(innerWidth) + '╝');
		console.log('');
	},
};
