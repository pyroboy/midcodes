import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDateTime(date: string | Date) {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
}

export function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-PH', {
        style: 'currency',
        currency: 'PHP'
    }).format(amount);
}

export function calculateTimeLeft(deadline: string): string {
    const now = new Date();
    const end = new Date(deadline);
    const diff = end.getTime() - now.getTime();

    if (diff <= 0) {
        return 'Expired';
    }

    const minutes = Math.floor(diff / 1000 / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours} hour${hours > 1 ? 's' : ''} ${minutes % 60} minute${minutes % 60 !== 1 ? 's' : ''}`;
    }

    return `${minutes} minute${minutes !== 1 ? 's' : ''}`;
}
