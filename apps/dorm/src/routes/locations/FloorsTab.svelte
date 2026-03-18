<script lang="ts">
	import FloorForm from '../floors/FloorForm.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { floorSchema } from '../floors/formSchema';
	import type { FloorWithProperty } from '../floors/formSchema';
	import * as Accordion from '$lib/components/ui/accordion';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import { propertyStore } from '$lib/stores/property';
	import { createRxStore } from '$lib/stores/rx.svelte';
	import { optimisticUpsertFloor, optimisticDeleteFloor } from '$lib/db/optimistic-floors';
	import { Search, Pencil, Trash2 } from 'lucide-svelte';

	interface Props {
		floorForm: any;
		triggerAdd?: boolean;
	}

	let { floorForm, triggerAdd = $bindable(false) }: Props = $props();

	let editMode = $state(false);
	let showModal = $state(false);
	let isDeleteDialogOpen = $state(false);
	let floorToDelete = $state<FloorWithProperty | null>(null);
	let searchQuery = $state('');

	// ─── RxDB reactive stores ───────────────────────────────────────────
	const floorsStore = createRxStore<any>('floors',
		(db) => db.floors.find({ sort: [{ floor_number: 'asc' }] })
	);
	const propertiesStore = createRxStore<any>('properties',
		(db) => db.properties.find()
	);
	const rentalUnitsStore = createRxStore<any>('rental_units',
		(db) => db.rental_units.find()
	);
	const leasesStore = createRxStore<any>('leases',
		(db) => db.leases.find()
	);
	const leaseTenantsStore = createRxStore<any>('lease_tenants',
		(db) => db.lease_tenants.find()
	);

	let allFloors = $derived.by(() => {
		return floorsStore.value.map((floor: any) => {
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
	} = superForm((() => floorForm)(), {
		id: 'locations-floor-form',
		validators: zodClient(floorSchema),
		validationMethod: 'oninput',
		dataType: 'json',
		taintedMessage: null,
		resetForm: true,
		onError: ({ result }) => {
			console.error('Form submission error:', result);
		},
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				showModal = false;
				editMode = false;
				const d = $formData;
				if (d.id) {
					await optimisticUpsertFloor({
						id: d.id,
						property_id: d.property_id,
						floor_number: d.floor_number,
						wing: d.wing,
						status: d.status || 'ACTIVE'
					});
				} else {
					const { resyncCollection } = await import('$lib/db/replication');
					resyncCollection('floors');
				}
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

	// Handle triggerAdd from parent
	$effect(() => {
		if (triggerAdd) {
			openAddModal();
			triggerAdd = false;
		}
	});

	function openAddModal() {
		editMode = false;
		reset();
		showModal = true;
	}

	function handleFloorClick(floor: FloorWithProperty) {
		editMode = true;
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

		await optimisticDeleteFloor(floorToDelete.id);

		const formData = new FormData();
		formData.append('id', floorToDelete.id.toString());
		const response = await fetch('?/floorDelete', {
			method: 'POST',
			body: formData
		});

		if (!response.ok) {
			console.error('Failed to delete floor.', response);
			alert('Failed to delete floor.');
			const { resyncCollection } = await import('$lib/db/replication');
			resyncCollection('floors');
		}

		isDeleteDialogOpen = false;
		floorToDelete = null;
	}
</script>

<div class="space-y-6">
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
	{#if !selectedProperty}
		<div class="text-center py-8">
			<p class="text-gray-500">Please select a property to view floors.</p>
		</div>
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
			form={formData}
			{errors}
			{enhance}
			{constraints}
			actionCreate="?/floorCreate"
			actionUpdate="?/floorUpdate"
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
