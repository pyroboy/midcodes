<script lang="ts">
	import FloorForm from './FloorForm.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { superForm } from 'sveltekit-superforms/client';
	import { defaults } from 'sveltekit-superforms';
	import { zodClient, zod } from 'sveltekit-superforms/adapters';
	import { floorSchema } from './formSchema';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import type { FloorWithProperty } from './formSchema';
	import { propertyStore } from '$lib/stores/property';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';
	import {
		floorsStore,
		propertiesStore,
		rentalUnitsStore,
		leasesStore,
		leaseTenantsStore
	} from '$lib/stores/collections.svelte';
	import { optimisticUpsertFloor, optimisticDeleteFloor } from '$lib/db/optimistic-floors';
	import { bgResync, bufferedMutation, CONFLICT_MESSAGE } from '$lib/db/optimistic-utils';
	import { Layers, Plus, Search, Pencil, Trash2, Building2 } from 'lucide-svelte';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { toast } from 'svelte-sonner';

	// Capture form data before superForm resets it (resetForm: true clears $formData before onResult)
	let savedFormData: { id?: number; property_id: number; floor_number: number; wing?: string | null; status: string; _seq?: number } | null = null;
	let savedEditMode = false;
	let submitSeq = 0;
	let rollback: (() => Promise<void>) | null = null;

	let editMode = $state(false);
	let showModal = $state(false);
	let isDeleteDialogOpen = $state(false);
	let floorToDelete = $state<FloorWithProperty | null>(null);
	let searchQuery = $state('');

	// Build nested floor → units → leases structure (replaces server-side join)
	let allFloors = $derived.by(() => {
		return [...floorsStore.value].sort((a: any, b: any) => a.floor_number - b.floor_number).map((floor: any) => {
			const property = propertiesStore.value.find((p: any) => String(p.id) === String(floor.property_id));
			const floorUnits = rentalUnitsStore.value
				.filter((u: any) => String(u.floor_id) === String(floor.id))
				.map((unit: any) => {
					const unitLeases = leasesStore.value
						.filter((l: any) => String(l.rental_unit_id) === String(unit.id))
						.map((lease: any) => ({
							id: Number(lease.id),
							status: lease.status,
							lease_tenants: leaseTenantsStore.value
								.filter((lt: any) => String(lt.lease_id) === String(lease.id))
								.map((lt: any) => ({ tenant_id: lt.tenant_id }))
						}));
					return {
						id: Number(unit.id),
						number: unit.number,
						leases: unitLeases
					};
				});
			return {
				id: Number(floor.id),
				property_id: floor.property_id,
				floor_number: floor.floor_number,
				wing: floor.wing,
				status: floor.status,
				created_at: floor.created_at ?? '',
				updated_at: floor.updated_at ?? null,
				property: property ? { id: Number(property.id), name: property.name, address: '', type: '', status: property.status ?? '', created_at: '', updated_at: null } : null,
				rental_unit: floorUnits
			} as FloorWithProperty;
		});
	});

	const {
		form: formData,
		enhance,
		errors,
		constraints,
		reset
	} = superForm(defaults(zod(floorSchema)), {
		id: 'floor-form',
		validators: zodClient(floorSchema),
		validationMethod: 'oninput',
		dataType: 'json',
		taintedMessage: null,
		resetForm: true,
		onSubmit: async () => {
			// Capture form data BEFORE superForm resets it — resetForm: true
			// clears $formData before onResult runs, making $formData.id always undefined
			submitSeq++;
			savedFormData = { ...$formData, _seq: submitSeq };
			savedEditMode = editMode;

			// Close modal immediately for snappy UX
			showModal = false;
			toast.info(savedEditMode ? 'Saving floor...' : 'Creating floor...');

			// For updates where ID is known, write to RxDB immediately
			if (savedEditMode && savedFormData.id) {
				rollback = await optimisticUpsertFloor({
					id: savedFormData.id,
					property_id: savedFormData.property_id,
					floor_number: savedFormData.floor_number,
					wing: savedFormData.wing,
					status: savedFormData.status || 'ACTIVE'
				});
			}
		},
		onError: async ({ result }) => {
			console.error('Form submission error:', {
				error: result.error,
				status: result.status
			});
			toast.error('Error saving floor');
			// Instant rollback, then confirm with resync
			if (rollback) { await rollback(); rollback = null; }
			bgResync('floors');
		},
		onResult: async ({ result }) => {
			// Ignore if a newer submission has already overwritten
			if (!savedFormData || savedFormData._seq !== submitSeq) return;

			if (result.type === 'failure' && (result.data as any)?.conflict) {
				toast.error(CONFLICT_MESSAGE, { duration: 6000 });
				if (rollback) { await rollback(); rollback = null; }
				bgResync('floors');
				savedFormData = null;
				return;
			}

			if (result.type === 'success') {
				// Server response has the form data WITH the new ID (for creates)
				// This is reliable — not affected by resetForm: true
				const serverData = (result as any).data?.form?.data;
				const fd = serverData ?? savedFormData;

				editMode = false;
				rollback = null; // Success — discard snapshot
				toast.success(savedEditMode ? 'Floor updated' : 'Floor created');

				if (fd?.id) {
					// For creates: apply optimistic write with the real server ID
					if (!savedEditMode) {
						await optimisticUpsertFloor({
							id: fd.id,
							property_id: fd.property_id,
							floor_number: fd.floor_number,
							wing: fd.wing,
							status: fd.status || 'ACTIVE'
						});
					}
					// Confirm in background either way
					bgResync('floors');
				} else {
					// Fallback: no ID available — pull from server
					bgResync('floors');
				}
				savedFormData = null;
			} else {
				// Non-success result (validation error, etc.) — instant rollback
				toast.error('Failed to save floor');
				if (rollback) { await rollback(); rollback = null; }
				bgResync('floors');
				savedFormData = null;
			}
		}
	});

	let selectedProperty = $derived($propertyStore.selectedProperty);
	let filteredFloors = $derived.by(() => {
		let floors = selectedProperty && allFloors
			? allFloors.filter((floor) => floor.property_id == selectedProperty?.id)
			: [];

		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			floors = floors.filter((floor) =>
				String(floor.floor_number).includes(q) ||
				(floor.wing && floor.wing.toLowerCase().includes(q)) ||
				floor.status.toLowerCase().includes(q)
			);
		}

		return floors;
	});

	let isLoading = $derived(!floorsStore.initialized);
	let selectedFloor = $state<FloorWithProperty | null>(null);

	function openAddModal() {
		editMode = false;
		reset();
		showModal = true;
	}

	let editUpdatedAt = $state<string | null>(null);

	function handleFloorClick(floor: FloorWithProperty) {
		editMode = true;
		selectedFloor = floor;
		editUpdatedAt = floor.updated_at ?? null;
		reset({
			data: {
				id: floor.id,
				property_id: floor.property_id,
				floor_number: floor.floor_number,
				wing: floor.wing,
				status: floor.status as 'ACTIVE' | 'INACTIVE' | 'MAINTENANCE'
			}
		});
		showModal = true;
	}

	function handleCancelModal() {
		showModal = false;
		editMode = false;
		reset();
	}

	function confirmDelete(floor: FloorWithProperty) {
		floorToDelete = floor;
		isDeleteDialogOpen = true;
	}

	async function proceedWithDelete() {
		if (!floorToDelete) return;

		const targetFloor = floorToDelete;
		isDeleteDialogOpen = false;
		floorToDelete = null;

		await bufferedMutation({
			label: 'Delete floor',
			collection: 'floors',
			type: 'delete',
			optimisticWrite: async () => {
				await optimisticDeleteFloor(targetFloor.id);
			},
			serverAction: async () => {
				const body = new FormData();
				body.append('id', targetFloor.id.toString());
				const response = await fetch('?/delete', { method: 'POST', body });
				if (!response.ok) throw new Error(`Server returned ${response.status}`);
				return response;
			},
			onSuccess: async () => {
				toast.success('Floor deleted');
			}
		});
	}
</script>

<div class="container mx-auto p-4 space-y-6">
	<SyncErrorBanner collections={['floors', 'properties', 'rental_units', 'leases', 'lease_tenants']} />
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div class="rounded-lg bg-indigo-50 p-2">
				<Layers class="h-6 w-6 text-indigo-600" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Floors</h1>
				<p class="text-sm text-muted-foreground">Manage building floors and wings</p>
			</div>
		</div>
		<Button onclick={openAddModal}>
			<Plus class="mr-2 h-4 w-4" />
			Add Floor
		</Button>
	</div>

	<!-- Search -->
	<div class="relative max-w-md">
		<Search class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
		<Input
			type="text"
			placeholder="Search floors..."
			class="pl-9"
			bind:value={searchQuery}
		/>
	</div>

	<!-- Content -->
	{#if isLoading}
		<div class="space-y-2">
			{#each Array(4) as _, i (i)}
				<div class="border rounded-lg p-4">
					<div class="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4">
						<Skeleton class="h-5 w-20" />
						<Skeleton class="h-5 w-12" />
						<Skeleton class="h-6 w-16 rounded-full" />
						<div class="flex gap-2">
							<Skeleton class="h-8 w-8" />
							<Skeleton class="h-8 w-8" />
						</div>
					</div>
				</div>
			{/each}
		</div>
	{:else if !selectedProperty}
		<EmptyState icon={Building2} title="No Property Selected" description="Select a property from the dropdown in the header to view floors." />
	{:else if !filteredFloors.length}
		<div class="text-center py-8">
			<p class="text-gray-500">No floors found for this property.</p>
		</div>
	{:else}
		<div class="rounded-lg border bg-card">
			<div
				class="hidden md:grid md:grid-cols-[1fr_1fr_1fr_auto] gap-4 px-4 py-2 font-medium border-b bg-muted/50 rounded-t-lg"
			>
				<div>Floor Number</div>
				<div>Rental Units</div>
				<div>Status</div>
				<div class="text-right">Actions</div>
			</div>
			<div class="divide-y">
				{#each filteredFloors as floor (floor.id)}
					<Accordion.Root type="single" class="w-full">
						<Accordion.Item value={floor.id.toString()} class="border-b-0">
							<div class="grid grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 px-4 py-2">
								<div>{floor.floor_number}</div>
								<div>{floor.rental_unit.length}</div>
								<div><Badge>{floor.status}</Badge></div>
								<div class="flex items-center justify-end gap-2">
									<Button
										size="icon"
										variant="ghost"
										onclick={(e) => {
											e.stopPropagation();
											handleFloorClick(floor);
										}}
									>
										<span class="sr-only">Edit</span>
										<Pencil class="h-4 w-4" />
									</Button>
									<Button
										size="icon"
										variant="ghost"
										onclick={(e) => {
											e.stopPropagation();
											confirmDelete(floor);
										}}
									>
										<span class="sr-only">Delete</span>
										<Trash2 class="h-4 w-4" />
									</Button>
									<Accordion.Trigger class="p-1 rounded-md hover:bg-muted" />
								</div>
							</div>
							<Accordion.Content>
								<div class="p-4 bg-muted/50">
									<div class="font-medium mb-2">Wing: {floor.wing || 'N/A'}</div>
									<h4 class="font-medium mb-2">Rental Units:</h4>
									{#if floor.rental_unit.length > 0}
										<ul class="list-disc pl-5 space-y-1">
											{#each floor.rental_unit as unit}
												{@const activeLeases = unit.leases.filter(
													(lease) => lease.status === 'ACTIVE'
												)}
												{@const tenantCount = activeLeases.reduce(
													(acc, lease) => acc + lease.lease_tenants.length,
													0
												)}
												<li>Unit {unit.number} - {tenantCount} Tenants</li>
											{/each}
										</ul>
									{:else}
										<p>No rental units on this floor.</p>
									{/if}
								</div>
							</Accordion.Content>
						</Accordion.Item>
					</Accordion.Root>
				{/each}
			</div>
		</div>
	{/if}
</div>

<!-- Floor Form Modal -->
<Dialog.Root bind:open={showModal}>
	<Dialog.Content class="sm:max-w-[500px]">
		<Dialog.Header>
			<Dialog.Title>{editMode ? 'Edit' : 'Add'} Floor</Dialog.Title>
			<Dialog.Description>
				{editMode ? 'Update the details of this floor.' : 'Add a new floor to this property.'}
			</Dialog.Description>
		</Dialog.Header>
		<FloorForm
			{editMode}
			updatedAt={editUpdatedAt}
			form={formData}
			{errors}
			{enhance}
			{constraints}
			oncancel={handleCancelModal}
		/>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation -->
<AlertDialog.Root bind:open={isDeleteDialogOpen}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Are you sure?</AlertDialog.Title>
			<AlertDialog.Description>
				This action cannot be undone. This will permanently delete the floor and all associated
				rental units.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={proceedWithDelete}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
