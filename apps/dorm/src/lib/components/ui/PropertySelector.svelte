<script lang="ts">
	import { propertyStore } from '$lib/stores/property';
	import * as Select from '$lib/components/ui/select';
	import { Building } from 'lucide-svelte';
	import type { Property } from '$lib/types/database';

	// Derived list of properties formatted for the Select component.
	let derivedProperties = $derived(
		($propertyStore.properties || []).map((p: Property) => ({
			value: p.id.toString(),
			label: p.name
		}))
	);

	/**
	 * Handles the change event from the select dropdown.
	 * It calls the store's action to update the selected property globally.
	 * @param value The new property ID selected by the user, which can be undefined.
	 */
	function handlePropertyChange(value: string | undefined) {
		if (value) {
			propertyStore.setSelectedProperty(value);
		}
	}

	// Derived content for the trigger, showing the name of the selected property.
	let triggerContent = $derived($propertyStore.selectedProperty?.name ?? 'Select Property');

	// Explicitly derive the value for the Select component to ensure correct type (string | undefined).
	let selectedIdForSelect = $derived($propertyStore.selectedPropertyId ?? undefined);
</script>

{#if $propertyStore.isLoading}
	<!-- Show a loading skeleton while properties are being fetched -->
	<div class="w-48 h-9 bg-gray-200 animate-pulse rounded-md dark:bg-gray-700"></div>
{:else if $propertyStore.properties && $propertyStore.properties.length > 0}
	<!-- Render the dropdown once properties are loaded -->
	<div class="flex items-center gap-2">
		<Building class="h-5 w-5 text-muted-foreground" />
		<Select.Root
			type="single"
			value={selectedIdForSelect}
			onValueChange={(value) => {
				if (value) handlePropertyChange(value);
			}}
		>
			<Select.Trigger class="w-[200px] text-base">
				<!-- The content is placed directly inside the trigger, not in a Select.Value component -->
				{triggerContent}
			</Select.Trigger>
			<Select.Content>
				<Select.Group>
					<Select.GroupHeading>Properties</Select.GroupHeading>
					{#each derivedProperties as property (property.value)}
						<Select.Item value={property.value} label={property.label}>
							{property.label}
						</Select.Item>
					{/each}
				</Select.Group>
			</Select.Content>
		</Select.Root>
	</div>
{:else}
	<!-- Display a message if no properties are available -->
	<div class="text-sm text-muted-foreground">No properties available.</div>
{/if}
