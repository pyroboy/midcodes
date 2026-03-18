<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';

	import PropertyForm from '../properties/PropertyForm.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Card from '$lib/components/ui/card';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import { propertySchema, type Property } from '../properties/formSchema';
	import { Search, Building2 } from 'lucide-svelte';
	import { createRxStore } from '$lib/stores/rx.svelte';
	import { optimisticUpsertProperty, optimisticDeleteProperty } from '$lib/db/optimistic-properties';

	interface Props {
		propertyForm: any;
		triggerAdd?: boolean;
	}

	let { propertyForm, triggerAdd = $bindable(false) }: Props = $props();

	// ─── RxDB reactive store ───────────────────────────────────────────
	const propertiesStore = createRxStore<any>('properties',
		(db) => db.properties.find({ sort: [{ name: 'asc' }] })
	);
	let properties = $derived(propertiesStore.value.map((p: any) => ({ ...p, id: Number(p.id) })));
	let isLoading = $derived(!propertiesStore.initialized);

	// ─── Search ────────────────────────────────────────────────────────
	let searchQuery = $state('');
	let filteredProperties = $derived(
		searchQuery === ''
			? properties
			: properties.filter((p: Property) =>
					p.name.toLowerCase().includes(searchQuery.toLowerCase())
				)
	);

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
	} = superForm((() => propertyForm)(), {
		id: 'locations-property-form',
		validators: zodClient(propertySchema),
		validationMethod: 'oninput',
		dataType: 'json',
		taintedMessage: null,
		resetForm: true,
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				editMode = false;
				showModal = false;
				await optimisticUpsertProperty({
					id: $formData.id,
					name: $formData.name,
					address: $formData.address,
					type: $formData.type,
					status: $formData.status
				});
				reset();
			}
		}
	});

	// Handle triggerAdd from parent
	$effect(() => {
		if (triggerAdd) {
			handleAddProperty();
			triggerAdd = false;
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

		const deletingId = propertyToDelete.id;
		await optimisticDeleteProperty(deletingId);

		showDeleteDialog = false;
		propertyToDelete = null;

		const deleteFormData = new FormData();
		deleteFormData.append('id', String(deletingId));

		const response = await fetch('?/propertyDelete', {
			method: 'POST',
			body: deleteFormData
		});

		if (!response.ok) {
			const result = await response.json();
			alert(`Failed to delete property: ${result.error || 'Unknown error'}`);
			const { resyncCollection } = await import('$lib/db/replication');
			resyncCollection('properties');
		}
	}

	function handleCancel() {
		editMode = false;
		showModal = false;
		reset();
	}
</script>

<div class="space-y-6">
	<!-- Search Bar -->
	<div class="relative max-w-md">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
		<Input
			placeholder="Search properties by name..."
			class="pl-9"
			bind:value={searchQuery}
		/>
	</div>

	<!-- Content Table -->
	<Card.Root class="overflow-hidden">
		<Card.Content class="p-0">
			<table class="w-full text-sm text-left">
				<thead>
					<tr>
						<th class="px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">Name</th>
						<th class="px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden sm:table-cell">Address</th>
						<th class="px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider hidden md:table-cell">Type</th>
						<th class="px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
						<th class="px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if isLoading}
						{#each Array(3) as _, i (i)}
							<tr class="border-b">
								<td class="px-6 py-4"><Skeleton class="h-4 w-32" /></td>
								<td class="px-6 py-4 hidden sm:table-cell"><Skeleton class="h-4 w-48" /></td>
								<td class="px-6 py-4 hidden md:table-cell"><Skeleton class="h-4 w-20" /></td>
								<td class="px-6 py-4"><Skeleton class="h-5 w-16 rounded-full" /></td>
								<td class="px-6 py-4">
									<div class="flex items-center justify-end gap-2">
										<Skeleton class="h-8 w-14" />
										<Skeleton class="h-8 w-16" />
									</div>
								</td>
							</tr>
						{/each}
					{:else if filteredProperties?.length > 0}
						{#each filteredProperties as property (property.id)}
							<tr class="border-b hover:bg-muted/50 transition-colors cursor-pointer" onclick={() => handlePropertyClick(property)}>
								<td class="px-6 py-4 font-medium">{property.name}</td>
								<td class="px-6 py-4 hidden sm:table-cell">{property.address}</td>
								<td class="px-6 py-4 hidden md:table-cell">{property.type}</td>
								<td class="px-6 py-4">
									<Badge variant={getStatusVariant(property.status)}>
										{property.status}
									</Badge>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center justify-end gap-2">
										<Button
											size="sm"
											variant="outline"
											onclick={(e) => { e.stopPropagation(); handlePropertyClick(property); }}
										>
											Edit
										</Button>
										<Button
											size="sm"
											variant="destructive"
											onclick={(e) => { e.stopPropagation(); handleDeleteProperty(property); }}
										>
											Delete
										</Button>
									</div>
								</td>
							</tr>
						{/each}
					{:else}
						<tr>
							<td colspan="5" class="px-6 py-16 text-center">
								<div class="flex flex-col items-center">
									<div class="bg-gray-100 p-4 rounded-full mb-4">
										<Building2 class="w-8 h-8 text-gray-400" />
									</div>
									<h3 class="text-lg font-semibold text-gray-900">No Properties Found</h3>
									<p class="text-muted-foreground max-w-sm mt-2">
										{searchQuery
											? 'No properties match your search criteria.'
											: 'Get started by adding your first property.'}
									</p>
									{#if !searchQuery}
										<Button variant="outline" class="mt-4" onclick={handleAddProperty}>Add Property</Button>
									{/if}
								</div>
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
			{editMode}
			form={formData}
			{errors}
			{enhance}
			{constraints}
			actionCreate="?/propertyCreate"
			actionUpdate="?/propertyUpdate"
			on:cancel={handleCancel}
			on:propertyAdded={async () => {
				editMode = false;
				showModal = false;
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
