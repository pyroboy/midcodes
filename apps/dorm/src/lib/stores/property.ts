import { writable } from 'svelte/store';
import { browser } from '$app/environment';
import type { Property } from '$lib/types/database'; // Assuming you have a Property type defined

// --- Type Definitions ---

/**
 * Defines the structure for the property store.
 * @property {Property[] | null} properties - List of all available properties.
 * @property {string | null} selectedPropertyId - The ID of the currently selected property.
 * @property {Property | null} selectedProperty - The full object of the selected property.
 * @property {boolean} isLoading - Tracks the loading state for properties.
 */
interface PropertyStore {
	properties: Property[] | null;
	selectedPropertyId: string | null;
	selectedProperty: Property | null;
	isLoading: boolean;
}

// --- Store Creation ---

/**
 * Creates a custom Svelte store for managing property state.
 * This includes the list of all properties and the currently selected one.
 */
function createPropertyStore() {
	// Get the initially selected property ID from localStorage if it exists.
	const initialId = browser ? localStorage.getItem('selectedPropertyId') : null;

	const { subscribe, set, update } = writable<PropertyStore>({
		properties: null,
		selectedPropertyId: initialId,
		selectedProperty: null,
		isLoading: true
	});

	return {
		subscribe,

		/**
		 * Initializes the store by fetching properties and setting the selected one.
		 * @param allProperties - An array of all properties fetched from the database.
		 */
		init: (allProperties: Property[]) => {
			update((state) => {
				const currentSelectedId = state.selectedPropertyId;
				let selectedProperty = null;

				// Find the selected property object from the full list.
				if (currentSelectedId) {
					selectedProperty = allProperties.find((p) => p.id.toString() === currentSelectedId) ?? null;
				}

				// If no valid property is selected, default to the first one in the list.
				if (!selectedProperty && allProperties.length > 0) {
					selectedProperty = allProperties[0];
					if (browser) {
						localStorage.setItem('selectedPropertyId', selectedProperty.id.toString());
					}
				}

				return {
					...state,
					properties: allProperties,
					selectedPropertyId: selectedProperty ? selectedProperty.id.toString() : null,
					selectedProperty,
					isLoading: false
				};
			});
		},

		/**
		 * Sets the currently selected property.
		 * @param propertyId - The ID of the property to select.
		 */
		setSelectedProperty: (propertyId: string) => {
			update((state) => {
				if (!state.properties) return state; // Don't update if properties aren't loaded

				const newSelectedProperty = state.properties.find((p) => p.id.toString() === propertyId) ?? null;

				if (browser && newSelectedProperty) {
					localStorage.setItem('selectedPropertyId', newSelectedProperty.id.toString());
				} else if (browser) {
					localStorage.removeItem('selectedPropertyId');
				}

				return {
					...state,
					selectedPropertyId: newSelectedProperty ? newSelectedProperty.id.toString() : null,
					selectedProperty: newSelectedProperty
				};
			});
		}
	};
}

export const propertyStore = createPropertyStore();
