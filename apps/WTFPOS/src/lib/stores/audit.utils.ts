/**
 * Pure audit log formatting helpers — no side effects, safe to unit test.
 */

/**
 * Formats a session duration for audit log entries.
 * @param seconds  Elapsed seconds, or null/undefined when duration is unknown.
 * @param seated   When true, prefixes with "seated " (used for void/cancellation events).
 * @returns        A string like " [1m 30s]" or " [seated 2m 5s]", or "" when seconds is nullish.
 */
export function formatAuditDuration(seconds: number | null | undefined, seated = false): string {
	if (seconds == null) return '';
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return seated ? ` [seated ${m}m ${s}s]` : ` [${m}m ${s}s]`;
}
