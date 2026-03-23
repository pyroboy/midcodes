import type { Booking, Slot } from '$lib/types';

let bookings = $state<Booking[]>([]);
let selectedSlot = $state<Slot | null>(null);
let isLoading = $state(false);
let error = $state<string | null>(null);

export const bookingsStore = {
	get bookings() { return bookings; },
	get selectedSlot() { return selectedSlot; },
	get isLoading() { return isLoading; },
	get error() { return error; },

	async loadBookings(playerId: string) {
		isLoading = true;
		try {
			const response = await fetch(`/api/bookings?playerId=${playerId}`);
			if (!response.ok) throw new Error('Failed to load bookings');
			const data = await response.json();
			bookings = data.bookings ?? [];
		} catch (e) {
			error = e instanceof Error ? e.message : 'Error loading bookings';
		} finally {
			isLoading = false;
		}
	},

	async createBooking(booking: Omit<Booking, 'id' | 'createdAt'>) {
		const response = await fetch('/api/bookings', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(booking)
		});
		if (!response.ok) throw new Error('Failed to create booking');
		const newBooking = await response.json();
		bookings = [...bookings, newBooking];
		return newBooking;
	},

	async cancelBooking(bookingId: string) {
		const response = await fetch(`/api/bookings/${bookingId}`, { method: 'DELETE' });
		if (!response.ok) throw new Error('Failed to cancel booking');
		bookings = bookings.filter((b) => b.id !== bookingId);
	},

	selectSlot(slot: Slot | null) {
		selectedSlot = slot;
	}
};
