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
	import { toast } from 'svelte-sonner';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';
	import { Search, Building2, Pencil, Trash2, LayoutGrid, Ellipsis } from 'lucide-svelte';
	import { propertiesStore } from '$lib/stores/collections.svelte';
	import { optimisticUpsertProperty, optimisticDeleteProperty } from '$lib/db/optimistic-properties';
	import { bufferedMutation } from '$lib/db/optimistic-utils';
	import { humanizeType } from '$lib/utils/format';

	function getStatusColor(status: string): string {
		switch (status?.toUpperCase()) {
			case 'ACTIVE':
				return 'bg-green-100 text-green-800 border-green-200';
			case 'INACTIVE':
				return 'bg-red-100 text-red-800 border-red-200';
			case 'MAINTENANCE':
				return 'bg-yellow-100 text-yellow-800 border-yellow-200';
			default:
				return 'bg-gray-100 text-gray-800 border-gray-200';
		}
	}

	interface Props {
		propertyForm: any;
		triggerAdd?: boolean;
	}

	let { propertyForm, triggerAdd = $bindable(false) }: Props = $props();

	// ─── RxDB reactive store (singleton from collections.svelte.ts) ────
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
	let editUpdatedAt = $state<string | null>(null);

	// Delete confirmation dialog state
	let showDeleteDialog = $state(false);
	let propertyToDelete = $state<Property | null>(null);

	// Capture form data before superForm resets it
	let savedFormData: any = null;

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
		onSubmit: () => {
			savedFormData = { ...$formData };
		},
		onError: ({ result }) => {
			toast.error('Error saving property');
		},
		onResult: async ({ result }) => {
			if (result.type === 'failure' && (result.data as any)?.conflict) {
				toast.error('This property was modified by someone else. Please refresh and try again.', { duration: 6000 });
				import('$lib/db/replication').then(({ resyncCollection }) => resyncCollection('properties'));
				return;
			}
			if (result.type === 'success') {
				const serverForm = (result as any).data?.form?.data;
				const fd = serverForm ?? savedFormData;
				toast.success(editMode ? 'Property updated' : 'Property created');
				editMode = false;
				showModal = false;
				await optimisticUpsertProperty({
					id: fd.id,
					name: fd.name,
					address: fd.address,
					type: fd.type,
					status: fd.status
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

	function handleDeleteProperty(property: Property) {
		propertyToDelete = property;
		showDeleteDialog = true;
	}

	async function confirmDeleteProperty() {
		if (!propertyToDelete) return;

		const deletingId = propertyToDelete.id;
		showDeleteDialog = false;
		propertyToDelete = null;

		const deleteFormData = new FormData();
		deleteFormData.append('id', String(deletingId));

		await bufferedMutation({
			label: `Delete Property #${deletingId}`,
			collection: 'properties',
			type: 'delete',
			optimisticWrite: async () => {
				await optimisticDeleteProperty(deletingId);
			},
			serverAction: async () => {
				const response = await fetch('?/propertyDelete', {
					method: 'POST',
					body: deleteFormData
				});
				if (!response.ok) throw new Error('Server rejected delete');
				return response;
			},
			onSuccess: async () => {
				toast.success('Property deleted');
			},
			onFailure: async () => {
				toast.error('Failed to delete property');
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
				<Card.Root>
					<Card.Content class="p-4">
						<div class="flex items-start justify-between">
							<div class="space-y-1.5 flex-1">
								<Skeleton class="h-4 w-32" />
								<Skeleton class="h-3 w-48" />
								<Skeleton class="h-5 w-16 rounded-full" />
							</div>
							<Skeleton class="h-8 w-8 rounded-md" />
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		{:else if filteredProperties?.length > 0}
			{#each filteredProperties as property (property.id)}
				<Card.Root
					class="cursor-pointer hover:bg-muted/50 transition-colors"
					onclick={() => handlePropertyClick(property)}
				>
					<Card.Content class="p-4">
						<div class="flex items-start justify-between">
							<div class="space-y-1.5 flex-1 min-w-0">
								<p class="font-medium truncate">{property.name}</p>
								<p class="text-sm text-muted-foreground truncate">{property.address}</p>
								<Badge class={getStatusColor(property.status)}>
									{property.status}
								</Badge>
							</div>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									{#snippet child({ props })}
										<button
											{...props}
											class="inline-flex items-center justify-center rounded-md h-8 w-8 shrink-0 ml-2 hover:bg-accent hover:text-accent-foreground transition-colors"
											onclick={(e: MouseEvent) => e.stopPropagation()}
										>
											<span class="sr-only">Actions</span>
											<Ellipsis class="h-4 w-4" />
										</button>
									{/snippet}
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Item onclick={() => handlePropertyClick(property)}>
										<Pencil class="mr-2 h-4 w-4" />
										Edit
									</DropdownMenu.Item>
									<DropdownMenu.Item>
										<a href="/property/{property.id}/floorplan" class="flex items-center w-full" onclick={(e: MouseEvent) => e.stopPropagation()}>
											<LayoutGrid class="mr-2 h-4 w-4" />
											Floor Plan
										</a>
									</DropdownMenu.Item>
									<DropdownMenu.Separator />
									<DropdownMenu.Item
										class="text-destructive focus:text-destructive"
										onclick={() => handleDeleteProperty(property)}
									>
										<Trash2 class="mr-2 h-4 w-4" />
										Delete
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
						</div>
					</Card.Content>
				</Card.Root>
			{/each}
		{:else}
			<div class="flex flex-col items-center py-16">
				<div class="bg-muted p-4 rounded-full mb-4">
					<Building2 class="w-8 h-8 text-muted-foreground" />
				</div>
				<h3 class="text-lg font-semibold text-foreground">No Properties Found</h3>
				<p class="text-muted-foreground max-w-sm mt-2 text-center">
					{searchQuery
						? 'No properties match your search criteria.'
						: 'Get started by adding your first property.'}
				</p>
				{#if !searchQuery}
					<Button variant="outline" class="mt-4" onclick={handleAddProperty}>Add Property</Button>
				{/if}
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
								<td class="px-6 py-4"><Skeleton class="h-4 w-48" /></td>
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
								<td class="px-6 py-4">{property.address}</td>
								<td class="px-6 py-4 hidden md:table-cell">{humanizeType(property.type)}</td>
								<td class="px-6 py-4">
									<Badge class={getStatusColor(property.status)}>
										{property.status}
									</Badge>
								</td>
								<td class="px-6 py-4">
									<div class="flex items-center justify-end gap-2">
										<a
											href="/property/{property.id}/floorplan"
											class="inline-flex items-center justify-center rounded-md h-8 w-8 hover:bg-accent hover:text-accent-foreground transition-colors"
											onclick={(e) => e.stopPropagation()}
											title="Floor Plan"
										>
											<span class="sr-only">Floor Plan</span>
											<LayoutGrid class="h-4 w-4" />
										</a>
										<Button
											size="icon"
											variant="ghost"
											onclick={(e) => { e.stopPropagation(); handlePropertyClick(property); }}
										>
											<span class="sr-only">Edit</span>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											size="icon"
											variant="ghost"
											class="text-destructive hover:text-destructive"
											onclick={(e) => { e.stopPropagation(); handleDeleteProperty(property); }}
										>
											<span class="sr-only">Delete</span>
											<Trash2 class="h-4 w-4" />
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
				Are you sure you want to delete property "{propertyToDelete?.name}"? This property will be archived and removed from your active list.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; propertyToDelete = null; }}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDeleteProperty}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
