<script lang="ts">
	import { onMount } from 'svelte';
	import { propertyStore } from '$lib/stores/property';
	import RentalUnitForm from './Rental_UnitForm.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { rental_unitSchema } from './formSchema';
	import { invalidateAll } from '$app/navigation';
	import { Pencil, Trash2, Users, Tag, List, Plus, Search, Home, Building2 } from 'lucide-svelte';
	import type { RentalUnitResponse } from './+page.server';
	import type { PageData } from './$types';
	import { cache, CACHE_TTL, cacheKeys } from '$lib/services/cache';

	let { data } = $props<{ data: PageData }>();

	let isLoading = $state(data.lazy === true);
	let rentalUnits = $state<RentalUnitResponse[]>(data.rentalUnits || []);
	let properties = $state(data.properties || []);
	let floors = $state(data.floors || []);

	// UI States
	let searchQuery = $state('');
	let showModal = $state(false);
	let editMode = $state(false);

	// Load data lazily on mount
	onMount(async () => {
		if (data.lazy && data.rentalUnitsPromise) {
			try {
				const loadedData = await data.rentalUnitsPromise;
				rentalUnits = loadedData.rentalUnits;
				properties = loadedData.properties;
				floors = loadedData.floors;
				isLoading = false;
				cache.set(cacheKeys.rentalUnits(), loadedData, CACHE_TTL.MEDIUM);
			} catch (error) {
				console.error('Error loading rental units data:', error);
				isLoading = false;
			}
		}
	});

	// Derived states
	let selectedProperty = $derived($propertyStore.selectedProperty);

	let filteredRentalUnits = $derived(
		selectedProperty && rentalUnits
			? rentalUnits.filter(
					(unit: RentalUnitResponse) =>
						unit.property_id === selectedProperty!.id &&
						(searchQuery === '' ||
							unit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
							unit.number.toString().includes(searchQuery))
				)
			: []
	);

	// Form Logic
	const {
		form: formData,
		enhance,
		errors,
		constraints,
		reset
	} = superForm(data.form, {
		id: 'rental-unit-form',
		validators: zodClient(rental_unitSchema),
		validationMethod: 'oninput',
		dataType: 'json',
		resetForm: true,
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				showModal = false;
				await invalidateAll();
			}
		}
	});

	function handleAddClick() {
		editMode = false;
		reset();

		// Pre-select property if available
		if (selectedProperty) {
			$formData.property_id = selectedProperty.id;
		}

		showModal = true;
	}

	function handleEditClick(rentalUnit: RentalUnitResponse) {
		editMode = true;
		reset({
			data: {
				id: rentalUnit.id,
				property_id: rentalUnit.property_id,
				floor_id: rentalUnit.floor_id,
				name: rentalUnit.name,
				number: rentalUnit.number,
				rental_unit_status: rentalUnit.rental_unit_status,
				capacity: rentalUnit.capacity,
				base_rate: rentalUnit.base_rate,
				type: rentalUnit.type,
				amenities: Array.isArray(rentalUnit.amenities) ? rentalUnit.amenities : [],
				// Preserve relation structure for validation if needed
				property: rentalUnit.property
					? { id: rentalUnit.property.id, name: rentalUnit.property.name }
					: undefined,
				floor: rentalUnit.floor
					? {
							id: rentalUnit.floor.id,
							property_id: rentalUnit.property_id,
							floor_number: rentalUnit.floor.floor_number,
							wing: rentalUnit.floor.wing || undefined
						}
					: undefined
			}
		});
		showModal = true;
	}

	async function handleDeleteClick(rentalUnit: RentalUnitResponse) {
		if (
			!confirm(
				`Are you sure you want to delete "${rentalUnit.name}"? This action cannot be undone.`
			)
		) {
			return;
		}

		const deleteData = new FormData();
		deleteData.append('id', String(rentalUnit.id));

		try {
			const result = await fetch('?/delete', {
				method: 'POST',
				body: deleteData
			});

			if (result.ok) {
				await invalidateAll();
			} else {
				const resp = await result.json();
				alert(resp.message || 'Failed to delete rental unit.');
			}
		} catch (error) {
			console.error(error);
			alert('An unexpected error occurred.');
		}
	}

	function getStatusVariant(status: string) {
		switch (status) {
			case 'VACANT':
				return 'secondary';
			case 'OCCUPIED':
				return 'default';
			case 'RESERVED':
				return 'outline';
			default:
				return 'default';
		}
	}

	function handleModalChange(open: boolean) {
		showModal = open;
		if (!open) {
			reset();
			editMode = false;
		}
	}
</script>

<div class="w-full min-h-screen bg-gray-50/50">
	<!-- Modern Header -->
	<div class="bg-white border-b border-gray-200 sticky top-0 z-10">
		<div class="max-w-7xl mx-auto px-4 sm:px-6 py-4">
			<div class="flex flex-col sm:flex-row justify-between items-center gap-4">
				<div class="flex items-center gap-3">
					<div class="p-2 bg-blue-50 rounded-lg">
						<Home class="w-6 h-6 text-blue-600" />
					</div>
					<div>
						<h1 class="text-2xl font-bold text-gray-900">Rental Units</h1>
						<p class="text-sm text-muted-foreground">Manage rooms, beds, and occupancy</p>
					</div>
				</div>

				<Button onclick={handleAddClick} class="shadow-sm">
					<Plus class="w-4 h-4 mr-2" />
					Add Unit
				</Button>
			</div>
		</div>
	</div>

	<div class="max-w-7xl mx-auto px-4 sm:px-6 py-8">
		<!-- Search & Filter Bar -->
		<div class="mb-6">
			<div class="relative max-w-md">
				<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
				<Input
					placeholder="Search units by name or number..."
					class="pl-9 bg-white"
					bind:value={searchQuery}
				/>
			</div>
		</div>

		<!-- Main Content -->
		<Card class="border-none shadow-sm bg-white overflow-hidden">
			<CardContent class="p-0">
				{#if isLoading}
					<div class="p-6 space-y-4">
						{#each Array(5) as _}
							<div class="flex items-center justify-between border-b pb-4 last:border-0">
								<div class="space-y-2">
									<Skeleton class="h-5 w-48" />
									<Skeleton class="h-4 w-32" />
								</div>
								<Skeleton class="h-8 w-24" />
							</div>
						{/each}
					</div>
				{:else if !selectedProperty}
					<div class="flex flex-col items-center justify-center py-16 text-center">
						<div class="bg-gray-100 p-4 rounded-full mb-4">
							<Building2 class="w-8 h-8 text-gray-400" />
						</div>
						<h3 class="text-lg font-semibold text-gray-900">No Property Selected</h3>
						<p class="text-muted-foreground max-w-sm mt-2">
							Please select a property from the top navigation to manage its rental units.
						</p>
					</div>
				{:else if filteredRentalUnits.length === 0}
					<div class="flex flex-col items-center justify-center py-16 text-center">
						<div class="bg-gray-100 p-4 rounded-full mb-4">
							<Home class="w-8 h-8 text-gray-400" />
						</div>
						<h3 class="text-lg font-semibold text-gray-900">No Units Found</h3>
						<p class="text-muted-foreground max-w-sm mt-2">
							{searchQuery
								? 'No rental units match your search criteria.'
								: 'Get started by adding the first rental unit to this property.'}
						</p>
						{#if !searchQuery}
							<Button variant="outline" class="mt-4" onclick={handleAddClick}>Create Unit</Button>
						{/if}
					</div>
				{:else}
					<!-- List Header -->
					<div
						class="grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider"
					>
						<div>Unit Details</div>
						<div>Floor</div>
						<div>Type</div>
						<div>Status</div>
						<div class="text-right">Actions</div>
					</div>

					<!-- Units List -->
					<Accordion.Root type="single" class="divide-y divide-gray-100">
						{#each filteredRentalUnits as unit (unit.id)}
							<Accordion.Item value={unit.id.toString()} class="border-b-0 group">
								<div class="flex items-center w-full hover:bg-gray-50/50 transition-colors">
									<Accordion.Trigger class="flex-grow px-6 py-4 hover:no-underline">
										<div class="grid grid-cols-[2fr_1fr_1fr_1fr] gap-4 items-center w-full text-sm">
											<div class="text-left">
												<div class="font-semibold text-gray-900">{unit.name}</div>
												<div class="text-xs text-muted-foreground mt-0.5">
													Unit #{unit.number}
												</div>
											</div>
											<div class="text-left text-gray-600">
												Floor {unit.floor?.floor_number}
											</div>
											<div class="text-left">
												<span
													class="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700"
												>
													{unit.type}
												</span>
											</div>
											<div class="text-left">
												<Badge
													variant={getStatusVariant(unit.rental_unit_status)}
													class="shadow-none"
												>
													{unit.rental_unit_status}
												</Badge>
											</div>
										</div>
									</Accordion.Trigger>

									<!-- Actions -->
									<div class="flex items-center gap-1 px-6">
										<Button
											variant="ghost"
											size="icon"
											class="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
											onclick={(e) => {
												e.stopPropagation();
												handleEditClick(unit);
											}}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
											onclick={(e) => {
												e.stopPropagation();
												handleDeleteClick(unit);
											}}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</div>

								<Accordion.Content>
									<div class="px-6 pb-6 pt-2 bg-gray-50/30">
										<div
											class="bg-white border rounded-lg p-4 grid grid-cols-1 sm:grid-cols-3 gap-6 shadow-sm"
										>
											<div class="flex items-start gap-3">
												<div class="p-2 bg-blue-50 rounded-md text-blue-600">
													<Users class="h-4 w-4" />
												</div>
												<div>
													<p class="text-sm font-medium text-gray-900">Capacity</p>
													<p class="text-sm text-muted-foreground">{unit.capacity} people</p>
												</div>
											</div>

											<div class="flex items-start gap-3">
												<div class="p-2 bg-green-50 rounded-md text-green-600">
													<Tag class="h-4 w-4" />
												</div>
												<div>
													<p class="text-sm font-medium text-gray-900">Base Rate</p>
													<p class="text-sm text-muted-foreground">
														₱{unit.base_rate.toLocaleString()} / month
													</p>
												</div>
											</div>

											<div class="flex items-start gap-3">
												<div class="p-2 bg-purple-50 rounded-md text-purple-600">
													<List class="h-4 w-4" />
												</div>
												<div>
													<p class="text-sm font-medium text-gray-900">Amenities</p>
													<div class="flex flex-wrap gap-1 mt-1">
														{#if Array.isArray(unit.amenities) && unit.amenities.length > 0}
															{#each unit.amenities as amenity}
																<span
																	class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800"
																>
																	{amenity}
																</span>
															{/each}
														{:else}
															<span class="text-sm text-muted-foreground italic">None listed</span>
														{/if}
													</div>
												</div>
											</div>
										</div>
									</div>
								</Accordion.Content>
							</Accordion.Item>
						{/each}
					</Accordion.Root>
				{/if}
			</CardContent>
		</Card>
	</div>
</div>

<!-- Form Modal -->
<Dialog.Root open={showModal} onOpenChange={handleModalChange}>
	<Dialog.Content class="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title>{editMode ? 'Edit' : 'Create'} Rental Unit</Dialog.Title>
			<Dialog.Description>
				Fill in the details below to {editMode ? 'update the' : 'add a new'} rental unit.
			</Dialog.Description>
		</Dialog.Header>

		<RentalUnitForm
			{data}
			{editMode}
			form={formData}
			{errors}
			{enhance}
			{constraints}
			on:cancel={() => handleModalChange(false)}
		/>
	</Dialog.Content>
</Dialog.Root>
