import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

/** Format seconds into MM:SS display */
export function formatCountdown(seconds: number): string {
	const m = Math.floor(seconds / 60);
	const s = seconds % 60;
	return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** Format a past ISO timestamp as "Xm ago" / "2h 15m ago" / "just now" */
export function formatTimeAgo(isoTimestamp: string, now?: number): string {
	const diff = (now ?? Date.now()) - new Date(isoTimestamp).getTime();
	const minutes = Math.floor(diff / 60000);
	if (minutes < 1) return 'just now';
	if (minutes < 60) return `${minutes}m ago`;
	const hrs = Math.floor(minutes / 60);
	const rem = minutes % 60;
	return rem > 0 ? `${hrs}h ${rem}m ago` : `${hrs}h ago`;
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
