export function createSelector<T extends Record<string, any>>(
	items: T[], // Array of objects from the database
	form: Record<string, any>, // Form object (e.g., $form)
	formKey: string, // Key of the form field to update (e.g., "property_id")
	valueKey: keyof T, // Key to use for the value (e.g., "id")
	labelKey: keyof T, // Key to use for the label (e.g., "name")
	fallbackText: string = 'Select an option' // Fallback text for the trigger
) {
	// Derived items for the select component
	const derivedItems = items.map((item) => ({
		value: item[valueKey].toString(),
		label: item[labelKey]
	}));

	// Function to get the trigger content
	const getTriggerContent = (selectedValue: string | undefined) => {
		return selectedValue
			? (items.find((item) => item[valueKey].toString() === selectedValue)?.[labelKey] ??
					fallbackText)
			: fallbackText;
	};

	return {
		derivedItems,
		getTriggerContent
	};
}
