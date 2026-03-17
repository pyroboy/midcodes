/**
 * Store for the encode section card data.
 * The 3D card reads from this to display live text.
 */
import { writable } from 'svelte/store';

export interface CardData {
	name: string;
	title: string;
}

// Fixed company name (not editable)
export const COMPANY_NAME = 'Kanaya';

// Available job titles for selection
export const JOB_TITLES = [
	'CEO',
	'CTO',
	'Designer',
	'Developer',
	'Manager',
	'Director',
	'Engineer',
	'Analyst'
] as const;

export type JobTitle = (typeof JOB_TITLES)[number];

// Default card data
export const defaultCardData: CardData = {
	name: 'Arjo Magno',
	title: 'CEO'
};

export const cardDataStore = writable<CardData>({ ...defaultCardData });

// Flag to bypass scroll animation when user is actively editing
// When true, card shows full text immediately instead of typing animation
export const isUserEditingStore = writable<boolean>(false);
