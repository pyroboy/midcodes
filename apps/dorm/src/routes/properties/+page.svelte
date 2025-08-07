<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { browser } from '$app/environment';
	import { invalidateAll, invalidate } from '$app/navigation';
	import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';

	import PropertyForm from './PropertyForm.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import * as Card from '$lib/components/ui/card';
	import { propertySchema, type Property } from './formSchema';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();
	let { properties, form } = $derived(data);
	let editMode = $state(false);

	const {
		form: formData,
		enhance,
		errors,
		constraints,
		reset
	} = superForm(data.form, {
		id: 'property-form',
		validators: zodClient(propertySchema),
		validationMethod: 'oninput',
		dataType: 'json',
		taintedMessage: null,
		resetForm: true,
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				editMode = false;
				// Invalidate all data to ensure the global property list is also refreshed.
				await invalidateAll();
				reset();
			}
		}
	});

	// --- REMOVED: The reactive $effect block that listened to the global store. ---
	// This page will now always display all properties fetched by its own load function.

	function handlePropertyClick(property: Property) {
		editMode = true;
		// Use a reactive assignment to update the form data
		$formData = {
			id: property.id,
			name: property.name,
			address: property.address,
			type: property.type ?? 'DORMITORY',
			status: property.status ?? 'ACTIVE'
		};
	}

	function getStatusVariant(status: string): 'default' | 'destructive' | 'outline' | 'secondary' {
		switch (status) {
			case 'ACTIVE':
				return 'secondary';
			case 'INACTIVE':
				return 'destructive';
			case 'MAINTENANCE':
				return 'outline';
			default:
				return 'default';
		}
	}

	async function handleDeleteProperty(property: Property) {
		if (
			!confirm(
				`Are you sure you want to delete property ${property.name}? This action cannot be undone.`
			)
		) {
			return;
		}

		const deleteFormData = new FormData();
		deleteFormData.append('id', String(property.id));

		const response = await fetch('?/delete', {
			method: 'POST',
			body: deleteFormData
		});

		if (response.ok) {
			// Invalidate all data to refresh both the page list and the global selector.
			await invalidateAll();
		} else {
			const result = await response.json();
			alert(`Failed to delete property: ${result.error || 'Unknown error'}`);
		}
	}

	function handleCancel() {
		editMode = false;
		reset();
	}
</script>

<div class="flex flex-col lg:flex-row gap-8">
	<!-- Left column for the properties list -->
	<div class="w-full lg:w-2/3">
		<Card.Root>
			<Card.Header class="px-7">
				<Card.Title>Properties</Card.Title>
				<Card.Description>Manage your properties here.</Card.Description>
			</Card.Header>
			<Card.Content>
				<table class="w-full text-sm text-left">
					<thead class="text-xs text-muted-foreground uppercase bg-muted/50">
						<tr>
							<th class="p-4">Name</th>
							<th class="p-4">Address</th>
							<th class="p-4">Type</th>
							<th class="p-4">Status</th>
							<th class="p-4 text-right">Actions</th>
						</tr>
					</thead>
					<tbody>
						{#if properties?.length > 0}
							{#each properties as property (property.id)}
								<tr class="border-b hover:bg-muted/50">
									<td class="p-4 font-medium">{property.name}</td>
									<td class="p-4">{property.address}</td>
									<td class="p-4">{property.type}</td>
									<td class="p-4">
										<Badge variant={getStatusVariant(property.status)}>
											{property.status}
										</Badge>
									</td>
									<td class="p-4">
										<div class="flex items-center justify-end gap-2">
											<Button
												size="sm"
												variant="outline"
												onclick={() => handlePropertyClick(property)}
											>
												Edit
											</Button>
											<Button
												size="sm"
												variant="destructive"
												onclick={() => handleDeleteProperty(property)}
											>
												Delete
											</Button>
										</div>
									</td>
								</tr>
							{/each}
						{:else}
							<tr>
								<td colspan="5" class="p-4 text-center text-muted-foreground">
									No properties found
								</td>
							</tr>
						{/if}
					</tbody>
				</table>
			</Card.Content>
		</Card.Root>
	</div>

	<!-- Right column for the form -->
	<div class="w-full lg:w-1/3">
		<Card.Root>
			<Card.Header>
				<Card.Title>{editMode ? 'Edit' : 'Add'} Property</Card.Title>
			</Card.Header>
			<Card.Content>
				<PropertyForm
					{data}
					{editMode}
					form={formData}
					{errors}
					{enhance}
					{constraints}
					on:cancel={handleCancel}
					on:propertyAdded={async () => {
						editMode = false;
						await invalidate('app:properties');
					}}
				/>
			</Card.Content>
		</Card.Root>
	</div>
</div>

{#if browser}
	<SuperDebug data={$formData} />
{/if}
