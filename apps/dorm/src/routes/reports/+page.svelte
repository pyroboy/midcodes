<script lang="ts">
	import { onMount } from 'svelte';
	import { propertyStore } from '$lib/stores/property';
	import ReportsDashboard from './ReportsDashboard.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	// Get selected property from global state
	let selectedProperty = $derived($propertyStore.selectedProperty);
	let selectedPropertyId = $derived($propertyStore.selectedPropertyId);

	// Override with URL property if provided (for deep linking)
	let effectivePropertyId = $derived(data.propertyIdOverride || selectedPropertyId);

	// Handle property override from URL
	onMount(() => {
		if (data.propertyIdOverride && data.propertyIdOverride !== selectedPropertyId) {
			// Set the global property state to match the URL override
			propertyStore.setSelectedProperty(data.propertyIdOverride);
		}
	});
</script>

<ReportsDashboard
	year={data.year}
	month={data.month}
	propertyId={effectivePropertyId}
/>
