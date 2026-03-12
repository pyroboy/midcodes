import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Format seconds into MM:SS display */
export function formatCountdown(seconds: number): string {
	const clamped = Math.max(0, seconds);
	const m = Math.floor(clamped / 60);
	const s = clamped % 60;
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Format a past ISO timestamp as "Xm ago" / "2h ago" / "just now" */
export function formatTimeAgo(isoString: string): string {
	const diffMs = Date.now() - new Date(isoString).getTime();
	const diffMin = Math.floor(diffMs / 60000);
	if (diffMin < 1) return '< 1m';
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffH = Math.floor(diffMin / 60);
	return `${diffH}h ago`;
}

/** Format order/ticket ID as #T{tableNumber}-{XXXX} or #TO-{XXXX} */
export function formatDisplayId(id: string, tableNumber: number | null): string {
	const short = id.slice(-4).toUpperCase();
	return tableNumber !== null ? `#T${tableNumber}-${short}` : `#TO-${short}`;
}

/** Format grams as kg or g */
export function formatKg(grams: number): string {
	return grams >= 1000 ? `${(grams / 1000).toFixed(1)}kg` : `${grams}g`;
}

/**
 * Format stock weight with auto-promotion: g → kg at ≥1000g.
 * Returns { display, unit } for flexible rendering.
 * Examples: formatWeight(38191, 'g') → { display: '38.2', unit: 'kg' }
 *           formatWeight(500, 'g')   → { display: '500', unit: 'g' }
 *           formatWeight(36, 'bottles') → { display: '36', unit: 'bottles' }
 */
export function formatWeight(value: number, unit: string): { display: string; unit: string } {
	if (unit === 'g' && value >= 1000) {
		return { display: (value / 1000).toFixed(1), unit: 'kg' };
	}
	return { display: value.toLocaleString(), unit };
}

/** Format stock weight as a single string: "38.2 kg" or "36 bottles" */
export function formatWeightStr(value: number, unit: string): string {
	const w = formatWeight(value, unit);
	return `${w.display} ${w.unit}`;
}

/** Format an ISO timestamp as "6:00 AM" */
export function formatTime(isoTimestamp: string): string {
	return new Date(isoTimestamp).toLocaleTimeString('en-PH', {
		hour: 'numeric', minute: '2-digit', hour12: true
	});
}

/**
 * Format an ISO timestamp with date context:
 * - Today    → "Today, 6:00 AM"
 * - Yesterday → "Yesterday, 6:00 AM"
 * - Older    → "Mar 9, 6:00 AM"
 */
export function formatDate(iso: string): string {
	const d = new Date(iso);
	const now = new Date();
	const isToday = d.toDateString() === now.toDateString();
	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	const isYesterday = d.toDateString() === yesterday.toDateString();
	const timeStr = d.toLocaleTimeString('en-PH', { hour: 'numeric', minute: '2-digit', hour12: true });
	if (isToday) return `Today, ${timeStr}`;
	if (isYesterday) return `Yesterday, ${timeStr}`;
	return d.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }) + ', ' + timeStr;
}

/** Format pesos */
export function formatPeso(amount: number): string {
	return new Intl.NumberFormat('en-PH', {
		style: 'currency',
		currency: 'PHP',
		minimumFractionDigits: 2
	}).format(amount);
}
