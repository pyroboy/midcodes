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
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { propertySchema, type Property } from './formSchema';
	import type { PageData } from './$types';
	import { Plus } from 'lucide-svelte';

	let { data } = $props<{ data: PageData }>();
	let { properties, form } = $derived(data);
	let editMode = $state(false);
	let showModal = $state(false);

	// Delete confirmation dialog state
	let showDeleteDialog = $state(false);
	let propertyToDelete = $state<Property | null>(null);

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
				showModal = false;
				await invalidateAll();
				reset();
			}
		}
	});

	function handleAddProperty() {
		editMode = false;
		reset();
		showModal = true;
	}

	function handlePropertyClick(property: Property) {
		editMode = true;
		$formData = {
			id: property.id,
			name: property.name,
			address: property.address,
			type: property.type ?? 'DORMITORY',
			status: property.status ?? 'ACTIVE'
		};
		showModal = true;
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

	function handleDeleteProperty(property: Property) {
		propertyToDelete = property;
		showDeleteDialog = true;
	}

	async function confirmDeleteProperty() {
		if (!propertyToDelete) return;

		const deleteFormData = new FormData();
		deleteFormData.append('id', String(propertyToDelete.id));

		const response = await fetch('?/delete', {
			method: 'POST',
			body: deleteFormData
		});

		if (response.ok) {
			await invalidateAll();
		} else {
			const result = await response.json();
			alert(`Failed to delete property: ${result.error || 'Unknown error'}`);
		}

		showDeleteDialog = false;
		propertyToDelete = null;
	}

	function handleCancel() {
		editMode = false;
		showModal = false;
		reset();
	}
</script>

<div class="w-full">
	<Card.Root>
		<Card.Header class="px-7">
			<div class="flex items-center justify-between">
				<div>
					<Card.Title>Properties</Card.Title>
					<Card.Description>Manage your properties here.</Card.Description>
				</div>
				<Button onclick={handleAddProperty} class="flex items-center gap-2">
					<Plus class="w-4 h-4" />
					Add Property
				</Button>
			</div>
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

<!-- Property Form Modal -->
<Dialog bind:open={showModal}>
	<DialogContent class="sm:max-w-[500px]">
		<DialogHeader>
			<DialogTitle>{editMode ? 'Edit' : 'Add'} Property</DialogTitle>
			<DialogDescription>
				{editMode ? 'Update the property details below.' : 'Fill in the details to add a new property.'}
			</DialogDescription>
		</DialogHeader>
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
				showModal = false;
				await invalidate('app:properties');
			}}
		/>
	</DialogContent>
</Dialog>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Property</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete property "{propertyToDelete?.name}"? This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; propertyToDelete = null; }}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDeleteProperty}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>

{#if browser}
	<SuperDebug data={$formData} />
{/if}
