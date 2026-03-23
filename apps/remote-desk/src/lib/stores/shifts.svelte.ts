import { writable } from 'svelte/store';
import type { Shift } from '$lib/types';

export interface ShiftState {
	currentShift: Shift | null;
	isClocked: boolean;
	locationName: string | null;
	startTime: Date | null;
	endTime: Date | null;
	loading: boolean;
	error: string | null;
}

const initialState: ShiftState = {
	currentShift: null,
	isClocked: false,
	locationName: null,
	startTime: null,
	endTime: null,
	loading: false,
	error: null
};

function createShiftStore() {
	const { subscribe, set, update } = writable<ShiftState>(initialState);

	return {
		subscribe,
		clockIn: (shift: Shift, locationName: string) =>
			update((state) => ({
				...state,
				currentShift: shift,
				isClocked: true,
				locationName,
				startTime: shift.clock_in || new Date()
			})),
		clockOut: (endTime: Date) =>
			update((state) => ({
				...state,
				isClocked: false,
				endTime
			})),
		setLoading: (loading: boolean) =>
			update((state) => ({
				...state,
				loading
			})),
		setError: (error: string | null) =>
			update((state) => ({
				...state,
				error
			})),
		reset: () => set(initialState)
	};
}

export const shifts = createShiftStore();
