<script lang="ts">
	import { superForm } from 'sveltekit-superforms/client';
	import { defaults } from 'sveltekit-superforms';
	import { zodClient, zod } from 'sveltekit-superforms/adapters';

	import PropertyForm from './PropertyForm.svelte';
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
	import { propertySchema, type Property } from './formSchema';
	import { Plus, Search, Building2 } from 'lucide-svelte';
	import { createRxStore } from '$lib/stores/rx.svelte';
	import { optimisticUpsertProperty, optimisticDeleteProperty } from '$lib/db/optimistic-properties';
	import { syncStatus } from '$lib/stores/sync-status.svelte';

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
	} = superForm(defaults(zod(propertySchema)), {
		id: 'property-form',
		validators: zodClient(propertySchema),
		validationMethod: 'oninput',
		dataType: 'json',
		taintedMessage: null,
		resetForm: true,
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				const action = editMode ? 'updated' : 'created';
				console.log(`[Properties] Server: property "${$formData.name}" ${action} on Neon ✓`);
				syncStatus.addLog(`Server: property "${$formData.name}" ${action} on Neon ✓`, 'success');
				editMode = false;
				showModal = false;
				// Optimistic upsert into RxDB — UI updates instantly
				await optimisticUpsertProperty({
					id: $formData.id!,
					name: $formData.name,
					address: $formData.address,
					type: $formData.type,
					status: $formData.status
				});
				reset();
			} else if (result.type === 'failure') {
				console.error(`[Properties] Server: property form action failed`, result);
				syncStatus.addLog(`Server: property "${$formData.name}" save failed`, 'error');
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

		const deletingId = propertyToDelete.id;
		const deletingName = propertyToDelete.name;

		// Optimistic delete — UI updates instantly
		await optimisticDeleteProperty(deletingId);

		showDeleteDialog = false;
		propertyToDelete = null;

		// POST to server for actual deletion
		console.log(`[Properties] Server: deleting property #${deletingId} "${deletingName}" → sending to Neon...`);
		syncStatus.addLog(`Server: deleting property "${deletingName}" → sending to Neon...`, 'info');
		const deleteFormData = new FormData();
		deleteFormData.append('id', String(deletingId));

		try {
			const response = await fetch('?/delete', {
				method: 'POST',
				body: deleteFormData
			});

			if (response.ok) {
				console.log(`[Properties] Server: property #${deletingId} deleted on Neon ✓`);
				syncStatus.addLog(`Server: property "${deletingName}" deleted on Neon ✓`, 'success');
			} else {
				const result = await response.json();
				console.error(`[Properties] Server: delete rejected:`, result);
				syncStatus.addLog(`Server: property delete rejected — ${result.error || 'Unknown'}`, 'error');
				alert(`Failed to delete property: ${result.error || 'Unknown error'}`);
				// Resync will restore the property if server delete failed
				const { resyncCollection } = await import('$lib/db/replication');
				resyncCollection('properties');
			}
		} catch (error) {
			console.error(`[Properties] Server: delete network error:`, error);
			syncStatus.addLog(`Server: property delete failed — ${error instanceof Error ? error.message : 'Network error'}`, 'error');
			alert(`Failed to delete property: ${error instanceof Error ? error.message : 'Network error'}`);
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
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="flex items-center gap-3">
			<div class="p-2 bg-orange-50 rounded-lg">
				<Building2 class="w-6 h-6 text-orange-600" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Properties</h1>
				<p class="text-sm text-muted-foreground">Manage your properties here.</p>
			</div>
		</div>
		<Button onclick={handleAddProperty} class="shadow-sm">
			<Plus class="w-4 h-4 mr-2" />
			Add Property
		</Button>
	</div>

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
						<th class="px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</th>
						<th class="px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">Type</th>
						<th class="px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider">Status</th>
						<th class="px-6 py-3 bg-muted/50 text-xs font-medium text-muted-foreground uppercase tracking-wider text-right">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#if isLoading}
						{#each Array(3) as _, i (i)}
							<tr class="border-b">
								<td class="px-6 py-4"><Skeleton class="h-4 w-32" /></td>
								<td class="px-6 py-4"><Skeleton class="h-4 w-48" /></td>
								<td class="px-6 py-4"><Skeleton class="h-4 w-20" /></td>
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
								<td class="px-6 py-4">{property.address}</td>
								<td class="px-6 py-4">{property.type}</td>
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
