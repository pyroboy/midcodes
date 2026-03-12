/**
 * Utility Readings Store — Svelte 5 Runes
 * Tracks meter readings (water, gas, electricity) per branch
 * and auto-creates expenses on insert.
 *
 * Uses localStorage (not RxDB) to stay within the 16-collection limit.
 * Same pattern as ExpenseTemplate in expenses.svelte.ts.
 */
import { nanoid } from 'nanoid';
import { session } from '$lib/stores/session.svelte';
import { browser } from '$app/environment';
import { addExpense } from '$lib/stores/expenses.svelte';
import type { ComponentType } from 'svelte';
import { Droplets, Flame, Zap } from 'lucide-svelte';

// ─── Types ───────────────────────────────────────────────────────────────────
export type UtilityCategory = 'water' | 'gas' | 'electricity';

export interface UtilityReading {
	id: string;
	category: UtilityCategory;
	previousReading: number;
	currentReading: number;
	consumption: number;
	rate: number;
	totalCost: number;
	readingDate: string;
	billingPeriod: string;
	locationId: string;
	createdBy: string;
	createdAt: string;
	expenseId: string | null;
	updatedAt: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────
export const UTILITY_CATEGORIES: UtilityCategory[] = ['water', 'gas', 'electricity'];

export const UTILITY_LABELS: Record<UtilityCategory, string> = {
	water: 'Water',
	gas: 'Gas / LPG',
	electricity: 'Electricity',
};

export const UTILITY_UNITS: Record<UtilityCategory, string> = {
	water: 'm³',
	gas: 'kg',
	electricity: 'kWh',
};

export const UTILITY_COLORS: Record<UtilityCategory, string> = {
	water: '#3B82F6',
	gas: '#F59E0B',
	electricity: '#8B5CF6',
};

export const UTILITY_ICONS: Record<UtilityCategory, ComponentType> = {
	water: Droplets,
	gas: Flame,
	electricity: Zap,
};

export const UTILITY_EMOJI: Record<UtilityCategory, string> = {
	water: '💧',
	gas: '🔥',
	electricity: '⚡',
};

/** Maps utility category to expense category name */
const EXPENSE_CATEGORY_MAP: Record<UtilityCategory, string> = {
	water: 'Water',
	gas: 'Gas / LPG',
	electricity: 'Electricity',
};

// ─── localStorage-backed reactive store ──────────────────────────────────────
const STORAGE_KEY = 'wtfpos_utility_readings';

function loadReadings(): UtilityReading[] {
	if (!browser) return [];
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		return raw ? JSON.parse(raw) : [];
	} catch { return []; }
}

function saveReadings(readings: UtilityReading[]) {
	if (!browser) return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(readings));
}

let _readings = $state<UtilityReading[]>(loadReadings());

export const allUtilityReadings = {
	get value(): UtilityReading[] {
		return _readings;
	},
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Get the last reading for a category+location to pre-fill previous reading */
export function getLastReading(
	category: UtilityCategory,
	locationId: string
): UtilityReading | undefined {
	// Readings are stored newest-first, so find() returns the most recent
	return _readings.find(
		(r) => r.category === category && r.locationId === locationId
	);
}

// ─── CRUD ────────────────────────────────────────────────────────────────────
export async function addUtilityReading(data: {
	category: UtilityCategory;
	previousReading: number;
	currentReading: number;
	rate: number;
	billingPeriod: string;
}): Promise<{ success: boolean; error?: string; id?: string; totalCost?: number }> {
	if (!browser) return { success: false, error: 'Not in browser environment' };

	const consumption = data.currentReading - data.previousReading;
	if (consumption < 0) return { success: false, error: 'Current reading must be greater than previous reading' };

	const totalCost = consumption * data.rate;
	const locationId = session.locationId === 'all' ? 'tag' : session.locationId;
	const now = new Date().toISOString();
	const unit = UTILITY_UNITS[data.category];
	const label = UTILITY_LABELS[data.category];

	const reading: UtilityReading = {
		id: nanoid(),
		category: data.category,
		previousReading: data.previousReading,
		currentReading: data.currentReading,
		consumption,
		rate: data.rate,
		totalCost,
		readingDate: now,
		billingPeriod: data.billingPeriod,
		locationId,
		createdBy: session.userName || 'Staff',
		createdAt: now,
		expenseId: null,
		updatedAt: now,
	};

	try {
		// Auto-create expense
		const description = `${label} bill \u2014 ${data.billingPeriod} (${consumption} ${unit} @ \u20B1${data.rate}/${unit})`;
		const expenseResult = await addExpense(
			EXPENSE_CATEGORY_MAP[data.category],
			totalCost,
			description,
			'Company Card'
		);

		// Link expense ID back to the reading
		if (expenseResult.success && expenseResult.id) {
			reading.expenseId = expenseResult.id;
		}

		// Prepend (newest first) and persist
		_readings = [reading, ..._readings];
		saveReadings(_readings);

		return { success: true, id: reading.id, totalCost };
	} catch (err) {
		console.error('[UTILITY] Failed to add reading:', err);
		return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
	}
}
