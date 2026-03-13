/**
 * Shifts — Cash float / drawer opening tracking per cashier per location.
 * A shift must be opened before the POS can be used.
 * Shift data feeds into the EOD Z-Read cash reconciliation.
 */
import { nanoid } from 'nanoid';
import { browser } from '$app/environment';
import { createStore } from '$lib/stores/create-store.svelte';
import { getWritableCollection } from '$lib/db/write-proxy';
import { session } from '$lib/stores/session.svelte';

export interface ShiftDoc {
	id: string;
	locationId: string;
	cashierName: string;
	openingFloat: number;
	startedAt: string;
	endedAt: string | null;
	closingCash: number | null;
	status: 'active' | 'closed';
	updatedAt: string;
}

const _shifts = createStore<ShiftDoc>('shifts', db => db.shifts.find());

export const shifts = {
	get value() { return _shifts.value; },
	get initialized() { return _shifts.initialized; }
};

/** Returns the active shift for the current location, or null if none. */
export function getActiveShift(): ShiftDoc | null {
	const locId = session.locationId === 'all' ? null : session.locationId;
	return _shifts.value.find(
		s => s.status === 'active' && (!locId || s.locationId === locId)
	) ?? null;
}

/** Opens a new shift with the given opening cash float. */
export async function openShift(openingFloat: number): Promise<void> {
	if (!browser) return;
	const col = getWritableCollection('shifts');
	const locationId = (session.locationId === 'all' || session.locationId === 'wh-tag')
		? 'tag'
		: session.locationId;

	await col.insert({
		id: nanoid(),
		locationId,
		cashierName: session.userName || 'Staff',
		openingFloat,
		startedAt: new Date().toISOString(),
		endedAt: null,
		closingCash: null,
		status: 'active',
		updatedAt: new Date().toISOString()
	});
}

/** Closes the active shift with the actual closing cash count. */
export async function closeShift(closingCash: number): Promise<void> {
	if (!browser) return;
	const activeShift = getActiveShift();
	if (!activeShift) return;

	const col = getWritableCollection('shifts');
	await col.incrementalPatch(activeShift.id, {
		status: 'closed',
		endedAt: new Date().toISOString(),
		closingCash,
		updatedAt: new Date().toISOString()
	});
}
