import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

export function formatPeso(amount: number | undefined | null): string {
	if (amount == null) return '--';
	return new Intl.NumberFormat('en-PH', {
		style: 'currency',
		currency: 'PHP',
		minimumFractionDigits: 0,
		maximumFractionDigits: 0
	}).format(amount);
}
