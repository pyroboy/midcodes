import { writable } from 'svelte/store';
import type { Inventory } from '$lib/types';

export interface InventoryState {
	items: Inventory[];
	selectedItem: Inventory | null;
	searchQuery: string;
	filterCategory: string | null;
	sortBy: 'name' | 'quantity' | 'sku';
	showLowStock: boolean;
	loading: boolean;
	error: string | null;
}

const initialState: InventoryState = {
	items: [],
	selectedItem: null,
	searchQuery: '',
	filterCategory: null,
	sortBy: 'name',
	showLowStock: false,
	loading: false,
	error: null
};

function createInventoryStore() {
	const { subscribe, set, update } = writable<InventoryState>(initialState);

	return {
		subscribe,
		loadItems: (items: Inventory[]) =>
			update((state) => ({
				...state,
				items
			})),
		addItem: (item: Inventory) =>
			update((state) => ({
				...state,
				items: [...state.items, item]
			})),
		updateItem: (item: Inventory) =>
			update((state) => ({
				...state,
				items: state.items.map((i) => (i.id === item.id ? item : i))
			})),
		removeItem: (itemId: string) =>
			update((state) => ({
				...state,
				items: state.items.filter((i) => i.id !== itemId)
			})),
		selectItem: (item: Inventory | null) =>
			update((state) => ({
				...state,
				selectedItem: item
			})),
		setSearchQuery: (query: string) =>
			update((state) => ({
				...state,
				searchQuery: query
			})),
		setFilterCategory: (category: string | null) =>
			update((state) => ({
				...state,
				filterCategory: category
			})),
		setSortBy: (sortBy: InventoryState['sortBy']) =>
			update((state) => ({
				...state,
				sortBy
			})),
		setShowLowStock: (show: boolean) =>
			update((state) => ({
				...state,
				showLowStock: show
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

export const inventory = createInventoryStore();
