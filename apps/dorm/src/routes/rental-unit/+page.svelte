<script lang="ts">
	import { propertyStore } from '$lib/stores/property';
	import RentalUnitForm from './Rental_UnitForm.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { rental_unitSchema } from './formSchema';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { invalidate, invalidateAll } from '$app/navigation';
	import SuperDebug from 'sveltekit-superforms/client/SuperDebug.svelte';
	import { browser } from '$app/environment';
	import type { RentalUnitResponse } from './+page.server';
	import type { PageData } from './$types';
	import { Pencil, Trash2, Users, Tag, List } from 'lucide-svelte';
	import * as AccordionPrimitive from '$lib/components/ui/accordion';

	let { data } = $props<{ data: PageData }>();

	let expandedUnits = $state(new Set<number>());

	function toggleAccordion(unitId: number) {
		if (expandedUnits.has(unitId)) {
			expandedUnits.delete(unitId);
		} else {
			expandedUnits.add(unitId);
		}
		expandedUnits = expandedUnits; // Trigger reactivity for the Set
	}

	// --- FIX START ---

	// Reactively get the selected property from the global store using $derived.
	let selectedProperty = $derived($propertyStore.selectedProperty);

	// Reactively filter the rental units. Explicitly type the 'unit' parameter.
	let filteredRentalUnits = $derived(
		selectedProperty && data.rentalUnits
			? data.rentalUnits.filter(
					(unit: RentalUnitResponse) => unit.property_id === selectedProperty!.id
				)
			: []
	);
	// --- FIX END ---

	let editMode = $state(false);
	let formError = $state('');
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
		taintedMessage: null,
		resetForm: true,
		onError: ({ result }) => {
			console.error('Form submission error:', {
				error: result.error,
				status: result.status
			});
			if (result.error) {
				console.error('Server error:', result.error.message);
			}
		},
		onResult: async ({ result }) => {
			if (result.type === 'success') {
				editMode = false;
				await invalidate('app:rentalUnits');
			} else if (result.type === 'failure') {
				formError = result.data?.message || 'An unknown error occurred';
			}
		}
	});

	// Use the imported type for the function parameter
	function handleRentalUnitClick(rentalUnit: RentalUnitResponse) {
		console.log('--- Edit Rental Unit Clicked ---');
		console.log('Rental Unit data:', rentalUnit);
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
					: undefined,
				created_at: rentalUnit.created_at,
				updated_at: rentalUnit.updated_at ?? undefined
			}
		});
		console.log('Form reset with new data for editing.');
	}

	// Use the imported type for the function parameter
	async function handleDeleteRentalUnit(rentalUnit: RentalUnitResponse) {
		console.log('--- Delete Rental Unit Clicked ---');
		console.log('Rental Unit to delete:', rentalUnit);
		if (!confirm(`Are you sure you want to delete rental unit ${rentalUnit.name}?`)) {
			console.log('Deletion cancelled by user.');
			return;
		}
		console.log('Deletion confirmed by user.');

		const formData = new FormData();
		formData.append('id', String(rentalUnit.id));

		try {
			const result = await fetch('?/delete', {
				method: 'POST',
				body: formData
			});

			const response = await result.json();

			if (result.ok) {
				console.log('Rental Unit deleted successfully, invalidating data.');
				editMode = false;
				await invalidateAll();
			} else {
				console.error('Delete failed:', {
					status: result.status,
					response: response
				});
				alert(response.message || 'Failed to delete rental unit.');
			}
		} catch (error) {
			console.error('Error deleting rental unit:', error);
			alert(`Error deleting rental unit: ${error instanceof Error ? error.message : 'Unknown error'}`);
		}
	}

	function getStatusVariant(
		status: RentalUnitResponse['rental_unit_status']
	): 'default' | 'destructive' | 'outline' | 'secondary' {
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
</script>

<div class="container mx-auto p-4 flex flex-col lg:flex-row gap-4">
	<div class="w-full lg:w-2/3">
		<div class="flex justify-between items-center mb-4">
			<h1 class="text-2xl font-bold">Rental Units</h1>
		</div>

		<Card>
			<CardContent class="p-0">
				<div class="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-4 py-2 font-medium border-b bg-muted/50">
					<div>Unit</div>
					<div>Floor</div>
					<div>Type</div>
					<div>Status</div>
					<div class="text-right">Actions</div>
				</div>

				<div class="border rounded-md">
					{#if !filteredRentalUnits.length}
						<div class="text-center py-8">
							<p class="text-gray-500">No rental units found for this property.</p>
						</div>
					{:else}
						<AccordionPrimitive.Root type="single" class="w-full">
							{#each filteredRentalUnits as unit (unit.id)}
								<AccordionPrimitive.Item value={unit.id} class="border-b last:border-b-0">
									<div class="flex items-center w-full">
										<AccordionPrimitive.Trigger class="flex-grow p-0 hover:no-underline">
											<!-- Main Row (Desktop) -->
											<div class="hidden md:grid md:grid-cols-[2fr_1fr_1fr_1fr] gap-4 px-4 py-2 items-center w-full">
												<div class="font-medium text-left">{unit.name}</div>
												<div class="text-left">Floor {unit.floor?.floor_number}</div>
												<div class="text-left">{unit.type}</div>
												<div><Badge variant={getStatusVariant(unit.rental_unit_status)}>{unit.rental_unit_status}</Badge></div>
											</div>

											<!-- Card (Mobile) -->
											<div class="md:hidden p-4 w-full text-left">
												<div class="font-medium">{unit.name}</div>
												<div class="text-sm text-muted-foreground">Floor {unit.floor?.floor_number}</div>
												<Badge variant={getStatusVariant(unit.rental_unit_status)}>{unit.rental_unit_status}</Badge>
											</div>
										</AccordionPrimitive.Trigger>
										<!-- Actions -->
										<div class="flex items-center justify-end gap-2 px-4">
											<Button size="icon" variant="ghost" onclick={() => handleRentalUnitClick(unit)}><Pencil class="h-4 w-4" /></Button>
											<Button size="icon" variant="ghost" onclick={() => handleDeleteRentalUnit(unit)}><Trash2 class="h-4 w-4" /></Button>
										</div>
									</div>
									<AccordionPrimitive.Content class="overflow-hidden text-sm transition-all data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
										<div class="p-4 bg-muted/50">
											<div class="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
												<div class="flex items-start gap-3">
													<Users class="h-5 w-5 text-muted-foreground mt-0.5" />
													<div>
														<p class="font-semibold">Capacity</p>
														<p class="text-muted-foreground">{unit.capacity} people</p>
													</div>
												</div>
												<div class="flex items-start gap-3">
													<Tag class="h-5 w-5 text-muted-foreground mt-0.5" />
													<div>
														<p class="font-semibold">Base Rate</p>
														<p class="text-muted-foreground">${unit.base_rate} / month</p>
													</div>
												</div>
												<div class="flex items-start gap-3">
													<List class="h-5 w-5 text-muted-foreground mt-0.5" />
													<div>
														<p class="font-semibold">Amenities</p>
														<p class="text-muted-foreground">{unit.amenities || 'N/A'}</p>
													</div>
												</div>
											</div>
										</div>
									</AccordionPrimitive.Content>
								</AccordionPrimitive.Item>
							{/each}
						</AccordionPrimitive.Root>
					{/if}
				</div>
			</CardContent>
		</Card>
	</div>

	<div class="w-full lg:w-1/3">
		<Card>
			<CardHeader>
				<CardTitle>{editMode ? 'Edit' : 'Add'} Rental Unit</CardTitle>
			</CardHeader>
			<CardContent>
				<RentalUnitForm
					{data}
					{editMode}
					form={formData}
					{errors}
					{enhance}
					{constraints}
					on:cancel={() => {
						editMode = false;
						reset();
					}}
					on:rentalUnitSaved={async () => {
						editMode = false;
						await invalidate('app:rentalUnits');
					}}
				/>
			</CardContent>
		</Card>
	</div>
</div>

{#if browser}
	<SuperDebug data={$formData} />
{/if}