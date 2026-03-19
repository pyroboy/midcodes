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
	import { Search, Building2, Pencil, Trash2, LayoutGrid } from 'lucide-svelte';
	import { getStatusClasses } from '$lib/utils/format';
	import { propertiesStore } from '$lib/stores/collections.svelte';
	import { optimisticUpsertProperty, optimisticDeleteProperty } from '$lib/db/optimistic-properties';
	import { bufferedMutation } from '$lib/db/optimistic-utils';

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
									<Badge class={getStatusClasses(property.status)}>
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
