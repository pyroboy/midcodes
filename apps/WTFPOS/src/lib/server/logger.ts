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
	/** Boxed banner — always prints at info level */
	banner(...lines: string[]) {
		if (!shouldLog('info')) return;
		console.log('');
		console.log('╔══════════════════════════════════════════════════════════════╗');
		for (const line of lines) {
			console.log(`║  ${line.padEnd(58)}║`);
		}
		console.log('╚══════════════════════════════════════════════════════════════╝');
		console.log('');
	},
};
