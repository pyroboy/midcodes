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
	import { toast } from 'svelte-sonner';
	import { Plus, Search, Building2, LayoutGrid, Ellipsis } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { propertiesStore } from '$lib/stores/collections.svelte';
	import { optimisticUpsertProperty, optimisticDeleteProperty } from '$lib/db/optimistic-properties';
	import { bufferedMutation, CONFLICT_MESSAGE } from '$lib/db/optimistic-utils';
	import { syncStatus } from '$lib/stores/sync-status.svelte';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';

	// ─── RxDB reactive store ───────────────────────────────────────────
	// propertiesStore singleton is sorted by name asc in collections.svelte.ts
	let properties = $derived(
		[...propertiesStore.value]
			.sort((a: any, b: any) => a.name.localeCompare(b.name))
			.map((p: any) => ({ ...p, id: Number(p.id) }))
	);
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

	// Capture form data before superForm resets it
	let savedFormData: any = null;
	let submitSeq = 0;
	let rollback: (() => Promise<void>) | null = null;

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
		onSubmit: async () => {
			submitSeq++;
			savedFormData = { ...$formData, _seq: submitSeq };
			const isEdit = editMode;
			// Close modal immediately for instant feel
			showModal = false;
			toast.info(isEdit ? 'Saving property...' : 'Creating property...');
			// For updates: optimistic write to RxDB now
			if (isEdit && savedFormData.id) {
				rollback = await optimisticUpsertProperty({
					id: savedFormData.id,
					name: savedFormData.name,
					address: savedFormData.address,
					type: savedFormData.type,
					status: savedFormData.status
				});
			}
		},
		onError: async ({ result }) => {
			toast.error('Error saving property');
			// Instant rollback, then confirm with resync
			if (rollback) { await rollback(); rollback = null; }
			import('$lib/db/replication').then(({ resyncCollection }) => resyncCollection('properties'));
		},
		onResult: async ({ result }) => {
			// Ignore if a newer submission has already overwritten
			if (!savedFormData || savedFormData._seq !== submitSeq) return;

			if (result.type === 'failure' && (result.data as any)?.conflict) {
				toast.error(CONFLICT_MESSAGE, { duration: 6000 });
				if (rollback) { await rollback(); rollback = null; }
				import('$lib/db/replication').then(({ resyncCollection }) => resyncCollection('properties'));
				return;
			}

			if (result.type === 'success') {
				const serverForm = (result as any).data?.form?.data;
				const fd = serverForm ?? savedFormData;
				const action = savedFormData && editMode ? 'updated' : 'created';
				toast.success(editMode ? 'Property updated' : 'Property created');
				syncStatus.addLog(`Server: property "${fd.name}" ${action} on Neon ✓`, 'success');
				editMode = false;
				rollback = null; // Success — discard snapshot
				// For creates: optimistic upsert with server-assigned ID
				if (fd?.id) {
					await optimisticUpsertProperty({
						id: fd.id,
						name: fd.name,
						address: fd.address,
						type: fd.type,
						status: fd.status
					});
				}
				reset();
			} else if (result.type === 'failure') {
				console.error(`[Properties] Server: property form action failed`, result);
				syncStatus.addLog(`Server: property "${$formData.name}" save failed`, 'error');
				toast.error('Failed to save property');
				// Instant rollback, then confirm with resync
				if (rollback) { await rollback(); rollback = null; }
				import('$lib/db/replication').then(({ resyncCollection }) => resyncCollection('properties'));
			}
		}
	});

	function handleAddProperty() {
		editMode = false;
		reset();
		showModal = true;
	}

	let editUpdatedAt = $state<string | null>(null);

	function handlePropertyClick(property: Property) {
		editMode = true;
		editUpdatedAt = property.updated_at ?? null;
		$formData = {
			id: property.id,
			name: property.name,
			address: property.address,
			type: property.type ?? 'DORMITORY',
			status: property.status ?? 'ACTIVE'
		};
		showModal = true;
	}

	function getStatusClasses(status: string): string {
		switch (status) {
			case 'ACTIVE':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'INACTIVE':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'MAINTENANCE':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			default:
				return '';
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

		showDeleteDialog = false;
		propertyToDelete = null;

		const deleteFormData = new FormData();
		deleteFormData.append('id', String(deletingId));

		await bufferedMutation({
			label: `Delete Property: ${deletingName}`,
			collection: 'properties',
			type: 'delete',
			optimisticWrite: async () => {
				await optimisticDeleteProperty(deletingId);
			},
			serverAction: async () => {
				const response = await fetch('?/delete', { method: 'POST', body: deleteFormData });
				if (!response.ok) throw new Error('Server rejected delete');
				return response;
			},
			onSuccess: async () => {
				toast.success('Property deleted');
			}
		});
	}

	function handleCancel() {
		editMode = false;
		showModal = false;
		reset();
	}
</script>

<div class="space-y-6">
	<SyncErrorBanner collections={['properties']} />
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

	<!-- Mobile Card View -->
	<div class="sm:hidden space-y-3">
		{#if isLoading}
			{#each Array(3) as _, i (i)}
				<Card.Root class="p-4">
					<div class="flex items-center justify-between">
						<div class="space-y-2 flex-1">
							<Skeleton class="h-4 w-32" />
							<Skeleton class="h-3 w-48" />
						</div>
						<Skeleton class="h-5 w-16 rounded-full" />
					</div>
				</Card.Root>
			{/each}
		{:else if filteredProperties?.length > 0}
			{#each filteredProperties as property (property.id)}
				<Card.Root
					class="min-h-[72px] cursor-pointer hover:bg-muted/50 transition-colors"
				>
					<button
						type="button"
						class="w-full text-left p-4 pr-2"
						onclick={() => handlePropertyClick(property)}
					>
						<div class="flex items-center justify-between gap-3">
							<div class="flex-1 min-w-0">
								<p class="font-medium truncate">{property.name}</p>
								<p class="text-sm text-muted-foreground truncate">{property.address}</p>
							</div>
							<div class="flex items-center gap-2 shrink-0">
								<Badge class={getStatusClasses(property.status)}>
									{property.status}
								</Badge>
								<DropdownMenu.Root>
									<DropdownMenu.Trigger
										class="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
										onclick={(e: MouseEvent) => e.stopPropagation()}
									>
										<Ellipsis class="w-4 h-4" />
										<span class="sr-only">Actions</span>
									</DropdownMenu.Trigger>
									<DropdownMenu.Content align="end">
										<DropdownMenu.Item onclick={() => handlePropertyClick(property)}>
											Edit
										</DropdownMenu.Item>
										<DropdownMenu.Item>
											<a href="/property/{property.id}/floorplan" class="w-full">
												Floor Plan
											</a>
										</DropdownMenu.Item>
										<DropdownMenu.Separator />
										<DropdownMenu.Item
											class="text-destructive focus:text-destructive"
											onclick={() => handleDeleteProperty(property)}
										>
											Delete
										</DropdownMenu.Item>
									</DropdownMenu.Content>
								</DropdownMenu.Root>
							</div>
						</div>
					</button>
				</Card.Root>
			{/each}
		{:else}
			<div class="py-16 text-center">
				<div class="flex flex-col items-center">
					<div class="bg-muted p-4 rounded-full mb-4">
						<Building2 class="w-8 h-8 text-muted-foreground" />
					</div>
					<h3 class="text-lg font-semibold text-foreground">No Properties Found</h3>
					<p class="text-muted-foreground max-w-sm mt-2">
						{searchQuery
							? 'No properties match your search criteria.'
							: 'Get started by adding your first property.'}
					</p>
					{#if !searchQuery}
						<Button variant="outline" class="mt-4" onclick={handleAddProperty}>Add Property</Button>
					{/if}
				</div>
			</div>
		{/if}
	</div>

	<!-- Desktop Content Table -->
	<Card.Root class="overflow-hidden hidden sm:block">
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
									<Badge class={getStatusClasses(property.status)}>
										{property.status}
									</Badge>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center justify-end gap-2">
										<a
											href="/property/{property.id}/floorplan"
											class="inline-flex items-center justify-center rounded-md text-sm font-medium h-8 px-3 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
											onclick={(e) => e.stopPropagation()}
										>
											<LayoutGrid class="w-4 h-4 mr-1.5" />
											Floor Plan
										</a>
										<Button
											size="sm"
											variant="outline"
											onclick={(e) => { e.stopPropagation(); handlePropertyClick(property); }}
										>
											Edit
										</Button>
										<Button
											size="sm"
											variant="ghost"
											class="text-destructive hover:text-destructive hover:bg-destructive/10"
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
									<div class="bg-muted p-4 rounded-full mb-4">
										<Building2 class="w-8 h-8 text-muted-foreground" />
									</div>
									<h3 class="text-lg font-semibold text-foreground">No Properties Found</h3>
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
			updatedAt={editUpdatedAt}
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
				Are you sure you want to delete property "{propertyToDelete?.name}"? This property will be archived and removed from your active list.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; propertyToDelete = null; }}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDeleteProperty}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
