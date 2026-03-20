<script lang="ts">
	import { propertyStore } from '$lib/stores/property';
	import RentalUnitForm from './Rental_UnitForm.svelte';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import * as Dialog from '$lib/components/ui/dialog';
	import * as AlertDialog from '$lib/components/ui/alert-dialog';
	import * as Accordion from '$lib/components/ui/accordion';
	import { Card, CardContent } from '$lib/components/ui/card';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { superForm } from 'sveltekit-superforms/client';
	import { defaults } from 'sveltekit-superforms';
	import { zodClient, zod } from 'sveltekit-superforms/adapters';
	import { rental_unitSchema } from './formSchema';
	import { Pencil, Trash2, Users, Tag, List, Plus, Search, Home, Building2, ChevronLeft, ChevronRight } from 'lucide-svelte';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import {
		rentalUnitsStore,
		propertiesStore,
		floorsStore
	} from '$lib/stores/collections.svelte';
	import { optimisticUpsertRentalUnit, optimisticDeleteRentalUnit } from '$lib/db/optimistic-rental-units';
	import { bgResync, bufferedMutation, CONFLICT_MESSAGE } from '$lib/db/optimistic-utils';
	import { resyncCollection } from '$lib/db/replication';
	import { toast } from 'svelte-sonner';
	import { formatCurrency } from '$lib/utils/format';

	// Capture form data before superForm resets it
	let savedFormData: any = null;
	let savedEditMode = false;
	let submitSeq = 0;
	let rollback: (() => Promise<void>) | null = null;

	// Enrich rental units with property and floor relationships
	let rentalUnits = $derived(rentalUnitsStore.value.map((unit: any) => {
		const property = propertiesStore.value.find((p: any) => String(p.id) === String(unit.property_id));
		const floor = floorsStore.value.find((f: any) => String(f.id) === String(unit.floor_id));
		return {
			...unit,
			id: Number(unit.id),
			property_id: Number(unit.property_id),
			floor_id: Number(unit.floor_id),
			base_rate: unit.base_rate,
			amenities: Array.isArray(unit.amenities) ? unit.amenities : [],
			property: property ? { id: Number(property.id), name: property.name } : null,
			floor: floor ? {
				id: Number(floor.id),
				property_id: floor.property_id,
				floor_number: floor.floor_number,
				wing: floor.wing
			} : null
		};
	}));

	let properties = $derived(
		[...propertiesStore.value]
			.sort((a: any, b: any) => a.name.localeCompare(b.name))
			.map((p: any) => ({ id: Number(p.id), name: p.name }))
	);
	let floors = $derived(floorsStore.value.map((f: any) => ({
		id: Number(f.id),
		property_id: f.property_id,
		floor_number: f.floor_number,
		wing: f.wing,
		status: f.status
	})));

	let isLoading = $derived(!rentalUnitsStore.initialized);

	// UI States
	let searchQuery = $state('');
	let showModal = $state(false);
	let editMode = $state(false);

	// Filter states [06]
	let filterFloor = $state('');
	let filterType = $state('');
	let filterStatus = $state('');

	// Pagination [11]
	let currentPage = $state(1);
	const PAGE_SIZE = 24;

	// Delete confirmation dialog state
	let showDeleteDialog = $state(false);
	let rentalUnitToDelete = $state<any>(null);

	// Derived states
	let selectedProperty = $derived($propertyStore.selectedProperty);

	// [04] Format type enum to human-readable label
	function formatType(type: string): string {
		const map: Record<string, string> = {
			'PRIVATEROOM': 'Private Room',
			'DORMITORY': 'Dormitory',
			'STUDIO': 'Studio',
			'SHARED': 'Shared',
		};
		return map[type] || type.charAt(0) + type.slice(1).toLowerCase();
	}

	// [04] Format status to title case
	function formatStatus(status: string): string {
		return status.charAt(0) + status.slice(1).toLowerCase();
	}

	// Get unique floor numbers for filter dropdown [06]
	let availableFloors = $derived.by(() => {
		if (!selectedProperty) return [];
		const floorSet = new Set<number>();
		for (const unit of rentalUnits) {
			if (unit.property_id === selectedProperty.id && unit.floor?.floor_number != null) {
				floorSet.add(unit.floor.floor_number);
			}
		}
		return [...floorSet].sort((a, b) => a - b);
	});

	// Get unique types for filter dropdown [06]
	let availableTypes = $derived.by(() => {
		if (!selectedProperty) return [];
		const typeSet = new Set<string>();
		for (const unit of rentalUnits) {
			if (unit.property_id === selectedProperty.id && unit.type) {
				typeSet.add(unit.type);
			}
		}
		return [...typeSet].sort();
	});

	// Single-pass: compute stats + filtered list [03][06]
	let { unitCount, vacantCount, filteredRentalUnits } = $derived.by(() => {
		if (!selectedProperty) return { unitCount: 0, vacantCount: 0, filteredRentalUnits: [] };

		let total = 0;
		let vacant = 0;
		const searchLower = searchQuery.toLowerCase();
		const filtered: any[] = [];

		for (const unit of rentalUnits) {
			if (unit.property_id !== selectedProperty.id) continue;
			total++;
			if (unit.rental_unit_status === 'VACANT') vacant++;

			// Apply search filter
			if (searchLower && !unit.name.toLowerCase().includes(searchLower) && !unit.number.toString().includes(searchQuery)) continue;
			// Apply floor filter [06]
			if (filterFloor && unit.floor?.floor_number !== Number(filterFloor)) continue;
			// Apply type filter [06]
			if (filterType && unit.type !== filterType) continue;
			// Apply status filter [06]
			if (filterStatus && unit.rental_unit_status !== filterStatus) continue;

			filtered.push(unit);
		}

		return { unitCount: total, vacantCount: vacant, filteredRentalUnits: filtered };
	});

	// Reset page when filters change [11]
	$effect(() => {
		void searchQuery;
		void filterFloor;
		void filterType;
		void filterStatus;
		currentPage = 1;
	});

	// Pagination [11]
	let totalPages = $derived(Math.max(1, Math.ceil(filteredRentalUnits.length / PAGE_SIZE)));
	let paginatedUnits = $derived(
		filteredRentalUnits.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE)
	);

	let hasActiveFilters = $derived(filterFloor !== '' || filterType !== '' || filterStatus !== '');

	function clearFilters() {
		filterFloor = '';
		filterType = '';
		filterStatus = '';
		searchQuery = '';
	}

	// Build data object for the form component (it reads data.floors)
	let formData_passthrough = $derived({ floors, properties });

	// Form Logic
	const {
		form: formData,
		enhance,
		errors,
		constraints,
		reset
	} = superForm(defaults(zod(rental_unitSchema)), {
		id: 'rental-unit-form',
		validators: zodClient(rental_unitSchema),
		validationMethod: 'oninput',
		dataType: 'json',
		resetForm: true,
		onSubmit: async ({ formData: fd }) => {
			submitSeq++;
			savedFormData = { ...$formData, _seq: submitSeq };
			savedEditMode = editMode;
			// Close modal immediately for snappy UX
			showModal = false;
			toast.info(editMode ? 'Saving unit...' : 'Creating unit...');
			// For updates with a known ID, run the optimistic write right away
			if (editMode && savedFormData?.id) {
				rollback = await optimisticUpsertRentalUnit({
					id: savedFormData.id,
					name: savedFormData.name,
					number: savedFormData.number,
					capacity: savedFormData.capacity,
					rental_unit_status: savedFormData.rental_unit_status,
					base_rate: String(savedFormData.base_rate),
					property_id: savedFormData.property_id ?? 0,
					floor_id: savedFormData.floor_id ?? 0,
					type: savedFormData.type,
					amenities: savedFormData.amenities
				});
			}
		},
		onError: async ({ result }) => {
			toast.error('Error saving rental unit');
			// Instant rollback, then confirm with resync
			if (rollback) { await rollback(); rollback = null; }
			resyncCollection('rental_units').catch((err) =>
				console.warn('[RentalUnit] Resync after error:', err)
			);
		},
		onResult: async ({ result }) => {
			// Ignore if a newer submission has already overwritten
			if (!savedFormData || savedFormData._seq !== submitSeq) return;

			if (result.type === 'failure' && (result.data as any)?.conflict) {
				toast.error(CONFLICT_MESSAGE, { duration: 6000 });
				if (rollback) { await rollback(); rollback = null; }
				resyncCollection('rental_units').catch(() => {});
				savedFormData = null;
				return;
			}

			if (result.type === 'success') {
				const serverData = (result as any).data?.form?.data;
				const fd = serverData ?? savedFormData;
				rollback = null; // Success — discard snapshot
				// For creates, apply optimistic upsert with server-assigned ID
				if (!savedEditMode && fd?.id) {
					await optimisticUpsertRentalUnit({
						id: fd.id,
						name: fd.name,
						number: fd.number,
						capacity: fd.capacity,
						rental_unit_status: fd.rental_unit_status,
						base_rate: String(fd.base_rate),
						property_id: fd.property_id ?? 0,
						floor_id: fd.floor_id ?? 0,
						type: fd.type,
						amenities: fd.amenities
					});
				} else if (!savedEditMode) {
					bgResync('rental_units');
				}
				toast.success(savedEditMode ? 'Rental unit updated' : 'Rental unit created');
				savedFormData = null;
			} else if (result.type === 'failure' || result.type === 'error') {
				toast.error('Failed to save rental unit');
				// Instant rollback, then confirm with resync
				if (rollback) { await rollback(); rollback = null; }
				resyncCollection('rental_units').catch((err) =>
					console.warn('[RentalUnit] Resync after failure:', err)
				);
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

	let editUpdatedAt = $state<string | null>(null);

	function handleEditClick(rentalUnit: any) {
		editMode = true;
		editUpdatedAt = rentalUnit.updated_at ?? null;
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

	function handleDeleteClick(rentalUnit: any) {
		rentalUnitToDelete = rentalUnit;
		showDeleteDialog = true;
	}

	async function confirmDeleteRentalUnit() {
		if (!rentalUnitToDelete) return;
		const rentalUnit = rentalUnitToDelete;
		showDeleteDialog = false;
		rentalUnitToDelete = null;

		await bufferedMutation({
			label: 'Delete rental unit',
			collection: 'rental_units',
			type: 'delete',
			optimisticWrite: async () => {
				await optimisticDeleteRentalUnit(rentalUnit.id);
			},
			serverAction: async () => {
				const deleteData = new FormData();
				deleteData.append('id', String(rentalUnit.id));
				const result = await fetch('?/delete', { method: 'POST', body: deleteData });
				if (!result.ok) {
					const resp = await result.json().catch(() => ({}));
					throw new Error(resp.message || 'Failed to delete rental unit');
				}
				return result;
			},
			onSuccess: async () => {
				toast.success('Rental unit deleted');
			}
		});
	}

	// [08] Semantic status colors
	function getStatusVariant(status: string): 'default' | 'secondary' | 'outline' | 'destructive' {
		switch (status) {
			case 'VACANT':
				return 'default';
			case 'OCCUPIED':
				return 'secondary';
			case 'RESERVED':
				return 'outline';
			default:
				return 'default';
		}
	}

	// [08] Custom classes for semantic colors
	function getStatusClass(status: string): string {
		switch (status) {
			case 'VACANT':
				return 'bg-green-100 text-green-800 border-green-200 hover:bg-green-100';
			case 'OCCUPIED':
				return 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-100';
			case 'RESERVED':
				return 'bg-amber-100 text-amber-800 border-amber-200 hover:bg-amber-100';
			default:
				return '';
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

<div class="space-y-6">
	<SyncErrorBanner collections={['rental_units', 'properties', 'floors']} />
	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="flex items-center gap-3">
			<div class="p-2 bg-blue-50 rounded-lg">
				<Home class="w-6 h-6 text-blue-600" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Rental Units</h1>
				<!-- [03] Unit count display -->
				<p class="text-sm text-muted-foreground">
					{#if isLoading}
						Manage rooms, beds, and occupancy
					{:else if selectedProperty}
						{unitCount} unit{unitCount !== 1 ? 's' : ''} · {vacantCount} vacant
					{:else}
						Select a property to view units
					{/if}
				</p>
			</div>
		</div>

		<Button onclick={handleAddClick} class="shadow-sm">
			<Plus class="w-4 h-4 mr-2" />
			Add Unit
		</Button>
	</div>

	<div>
		<!-- Search & Filter Bar [06] -->
		<div class="mb-6 space-y-3">
			<div class="flex flex-col sm:flex-row gap-3">
				<div class="relative flex-1 max-w-md">
					<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
					<Input
						placeholder="Search units by name or number..."
						class="pl-9 bg-white"
						bind:value={searchQuery}
					/>
				</div>

				<!-- Filter dropdowns [06] -->
				<div class="flex flex-wrap gap-2">
					{#if availableFloors.length > 0}
						<Select type="single" bind:value={filterFloor}>
							<SelectTrigger class="w-[140px]">
								{filterFloor ? `Floor ${filterFloor}` : 'All Floors'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">All Floors</SelectItem>
								{#each availableFloors as floorNum}
									<SelectItem value={String(floorNum)}>Floor {floorNum}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					{/if}

					{#if availableTypes.length > 0}
						<Select type="single" bind:value={filterType}>
							<SelectTrigger class="w-[160px]">
								{filterType ? formatType(filterType) : 'All Types'}
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="">All Types</SelectItem>
								{#each availableTypes as type}
									<SelectItem value={type}>{formatType(type)}</SelectItem>
								{/each}
							</SelectContent>
						</Select>
					{/if}

					<Select type="single" bind:value={filterStatus}>
						<SelectTrigger class="w-[150px]">
							{filterStatus ? formatStatus(filterStatus) : 'All Statuses'}
						</SelectTrigger>
						<SelectContent>
							<SelectItem value="">All Statuses</SelectItem>
							<SelectItem value="VACANT">Vacant</SelectItem>
							<SelectItem value="OCCUPIED">Occupied</SelectItem>
							<SelectItem value="RESERVED">Reserved</SelectItem>
						</SelectContent>
					</Select>

					{#if hasActiveFilters}
						<Button variant="ghost" size="sm" onclick={clearFilters} class="text-muted-foreground">
							Clear filters
						</Button>
					{/if}
				</div>
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
					<div class="p-6">
						<EmptyState icon={Building2} title="No Property Selected" description="Select a property from the dropdown in the header to view rental units." />
					</div>
				{:else if filteredRentalUnits.length === 0}
					<div class="flex flex-col items-center justify-center py-16 text-center">
						<div class="bg-gray-100 p-4 rounded-full mb-4">
							<Home class="w-8 h-8 text-gray-400" />
						</div>
						<h3 class="text-lg font-semibold text-gray-900">No Units Found</h3>
						<p class="text-muted-foreground max-w-sm mt-2">
							{searchQuery || hasActiveFilters
								? 'No rental units match your search or filter criteria.'
								: 'Get started by adding the first rental unit to this property.'}
						</p>
						{#if searchQuery || hasActiveFilters}
							<Button variant="outline" class="mt-4" onclick={clearFilters}>Clear Filters</Button>
						{:else}
							<Button variant="outline" class="mt-4" onclick={handleAddClick}>Create Unit</Button>
						{/if}
					</div>
				{:else}
					<!-- Desktop List Header [01] - hidden on mobile -->
					<div
						class="hidden lg:grid grid-cols-[2fr_1fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-gray-50/50 border-b text-xs font-medium text-muted-foreground uppercase tracking-wider"
					>
						<div>Unit Details</div>
						<div>Floor</div>
						<div>Type</div>
						<div>Rate</div>
						<div>Status</div>
						<div class="text-right">Actions</div>
					</div>

					<!-- Mobile Card View [01] - visible only on mobile -->
					<div class="lg:hidden divide-y divide-gray-100">
						{#each paginatedUnits as unit (unit.id)}
							<div class="p-4 hover:bg-gray-50/50 transition-colors">
								<div class="flex items-start justify-between gap-3">
									<div class="flex-1 min-w-0">
										<div class="flex items-center gap-2 flex-wrap">
											<h3 class="font-semibold text-gray-900 truncate">{unit.name}</h3>
											<span class="text-xs text-muted-foreground">#{unit.number}</span>
										</div>
										<div class="flex items-center gap-2 mt-1 text-sm text-gray-600">
											<span>Floor {unit.floor?.floor_number ?? '—'}</span>
											<span class="text-gray-300">|</span>
											<span>{formatType(unit.type)}</span>
										</div>
										<div class="flex items-center gap-2 mt-2">
											<Badge
												variant={getStatusVariant(unit.rental_unit_status)}
												class="shadow-none {getStatusClass(unit.rental_unit_status)}"
											>
												{formatStatus(unit.rental_unit_status)}
											</Badge>
											<span class="text-sm font-medium text-gray-700">
												{formatCurrency(Number(unit.base_rate))}/mo
											</span>
										</div>
									</div>
									<!-- [02] Mobile action buttons with 44px touch targets -->
									<div class="flex items-center gap-2">
										<Button
											variant="ghost"
											size="icon"
											class="h-11 w-11 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
											aria-label="Edit {unit.name}"
											onclick={(e: MouseEvent) => {
												e.stopPropagation();
												handleEditClick(unit);
											}}
										>
											<Pencil class="h-4 w-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											class="h-11 w-11 text-gray-500 hover:text-red-600 hover:bg-red-50"
											aria-label="Delete {unit.name}"
											onclick={(e: MouseEvent) => {
												e.stopPropagation();
												handleDeleteClick(unit);
											}}
										>
											<Trash2 class="h-4 w-4" />
										</Button>
									</div>
								</div>
							</div>
						{/each}
					</div>

					<!-- Desktop Units List [01] - hidden on mobile -->
					<div class="hidden lg:block">
						<Accordion.Root type="single" class="divide-y divide-gray-100">
							{#each paginatedUnits as unit (unit.id)}
								<Accordion.Item value={unit.id.toString()} class="border-b-0 group">
									<div class="flex items-center w-full hover:bg-gray-50/50 transition-colors">
										<Accordion.Trigger class="flex-grow px-6 py-4 hover:no-underline">
											<div class="grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-4 items-center w-full text-sm">
												<div class="text-left">
													<div class="font-semibold text-gray-900">{unit.name}</div>
													<div class="text-xs text-muted-foreground mt-0.5">
														Unit #{unit.number}
													</div>
												</div>
												<div class="text-left text-gray-600">
													Floor {unit.floor?.floor_number ?? '—'}
												</div>
												<div class="text-left">
													<span
														class="inline-flex items-center px-2 py-1 rounded-md bg-gray-100 text-xs font-medium text-gray-700"
													>
														{formatType(unit.type)}
													</span>
												</div>
												<!-- [07] Base rate column -->
												<div class="text-left text-gray-700 font-medium">
													{formatCurrency(Number(unit.base_rate))}
												</div>
												<div class="text-left">
													<Badge
														variant={getStatusVariant(unit.rental_unit_status)}
														class="shadow-none {getStatusClass(unit.rental_unit_status)}"
													>
														{formatStatus(unit.rental_unit_status)}
													</Badge>
												</div>
											</div>
										</Accordion.Trigger>

										<!-- Actions [02] with aria-labels -->
										<div class="flex items-center gap-2 px-6">
											<Button
												variant="ghost"
												size="icon"
												class="h-9 w-9 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
												aria-label="Edit {unit.name}"
												onclick={(e: MouseEvent) => {
													e.stopPropagation();
													handleEditClick(unit);
												}}
											>
												<Pencil class="h-4 w-4" />
											</Button>
											<Button
												variant="ghost"
												size="icon"
												class="h-9 w-9 text-gray-500 hover:text-red-600 hover:bg-red-50"
												aria-label="Delete {unit.name}"
												onclick={(e: MouseEvent) => {
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
															{formatCurrency(Number(unit.base_rate))} / month
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
					</div>

					<!-- Pagination Controls [11] -->
					{#if totalPages > 1}
						<div class="flex items-center justify-between px-6 py-4 border-t border-gray-100">
							<p class="text-sm text-muted-foreground">
								Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filteredRentalUnits.length)} of {filteredRentalUnits.length}
							</p>
							<div class="flex items-center gap-2">
								<Button
									variant="outline"
									size="sm"
									disabled={currentPage <= 1}
									onclick={() => currentPage--}
								>
									<ChevronLeft class="w-4 h-4" />
								</Button>
								{#each Array(totalPages) as _, i (i)}
									{#if totalPages <= 7 || i === 0 || i === totalPages - 1 || Math.abs(i + 1 - currentPage) <= 1}
										<Button
											variant={currentPage === i + 1 ? 'default' : 'outline'}
											size="sm"
											onclick={() => currentPage = i + 1}
											class="w-9"
										>
											{i + 1}
										</Button>
									{:else if i === 1 && currentPage > 3}
										<span class="text-muted-foreground px-1">...</span>
									{:else if i === totalPages - 2 && currentPage < totalPages - 2}
										<span class="text-muted-foreground px-1">...</span>
									{/if}
								{/each}
								<Button
									variant="outline"
									size="sm"
									disabled={currentPage >= totalPages}
									onclick={() => currentPage++}
								>
									<ChevronRight class="w-4 h-4" />
								</Button>
							</div>
						</div>
					{/if}
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
			data={formData_passthrough}
			{editMode}
			updatedAt={editUpdatedAt}
			form={formData}
			{errors}
			{enhance}
			{constraints}
			on:cancel={() => handleModalChange(false)}
		/>
	</Dialog.Content>
</Dialog.Root>

<!-- Delete Confirmation Dialog -->
<AlertDialog.Root bind:open={showDeleteDialog}>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<AlertDialog.Title>Delete Rental Unit</AlertDialog.Title>
			<AlertDialog.Description>
				Are you sure you want to delete "{rentalUnitToDelete?.name}"? This action cannot be undone.
			</AlertDialog.Description>
		</AlertDialog.Header>
		<AlertDialog.Footer>
			<AlertDialog.Cancel onclick={() => { showDeleteDialog = false; rentalUnitToDelete = null; }}>Cancel</AlertDialog.Cancel>
			<AlertDialog.Action onclick={confirmDeleteRentalUnit}>Continue</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
