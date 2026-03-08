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
	if (diffMin < 1) return 'just now';
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

/** Format an ISO timestamp as "6:00 AM" */
export function formatTime(isoTimestamp: string): string {
	return new Date(isoTimestamp).toLocaleTimeString('en-PH', {
		hour: 'numeric', minute: '2-digit', hour12: true
	});
}

/** Format pesos */
export function formatPeso(amount: number): string {
	return new Intl.NumberFormat('en-PH', {
		style: 'currency',
		currency: 'PHP',
		minimumFractionDigits: 2
	}).format(amount);
}
