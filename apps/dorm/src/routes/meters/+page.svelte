<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import * as Alert from '$lib/components/ui/alert';
	import { Badge } from '$lib/components/ui/badge';
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import * as Select from '$lib/components/ui/select';
	import {
		Dialog,
		DialogContent,
		DialogHeader,
		DialogTitle,
		DialogDescription
	} from '$lib/components/ui/dialog';
	import {
		utilityTypeEnum,
		meterStatusEnum,
		type MeterFormData,
		meterFormSchema
	} from './formSchema';
	import { Loader2, Plus, Gauge } from 'lucide-svelte';
	import type { PageData } from './$types';
	import MeterForm from './MeterForm.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { zodClient } from 'sveltekit-superforms/adapters';
	import { createRxStore } from '$lib/stores/rx.svelte';
	import { optimisticUpsertMeter } from '$lib/db/optimistic-meters';

	// Type definitions
	interface Property {
		id: number;
		name: string;
		address: string;
		type: string;
		status: string;
		created_at: string;
		updated_at: string | null;
	}
	interface Floor {
		id: number;
		property_id: number;
		propertyId?: number;
		floor_number: number;
		floorNumber?: number;
		wing: string | null;
		status: string;
		created_at: string;
		updated_at: string | null;
		property: Property | null;
	}
	interface Rental_unit {
		id: number;
		name: string;
		number: number;
		capacity: number;
		rental_unit_status: string;
		rentalUnitStatus?: string;
		base_rate: number;
		created_at: string;
		updated_at: string | null;
		property_id: number;
		propertyId?: number;
		floor_id: number;
		floorId?: number;
		type: string;
		amenities: Record<string, any> | null;
		floor: Floor | null;
	}

	interface LatestReading {
		value: number;
		date: string;
	}

	interface Reading {
		id: number;
		reading: number;
		reading_date: string;
	}

	type ExtendedMeterFormData = MeterFormData & {
		latest_reading?: LatestReading;
		property?: { name: string };
		floor?: { floor_number: number; wing?: string; property?: { name: string } };
		rental_unit?: {
			number: number;
			floor?: { floor_number: number; wing?: string; property?: { name: string } };
		};
		readings?: Reading[];
	};

	// Group interface for proper typing
	interface MeterGroup {
		id: number | null;
		name: string;
		meters: ExtendedMeterFormData[];
	}

	// Component state with Svelte 5 reactive primitives
	let { data } = $props<{ data: PageData }>();

	// ─── RxDB reactive stores ───────────────────────────────────────────
	const metersStore = createRxStore<any>('meters',
		(db) => db.meters.find({ sort: [{ name: 'asc' }] })
	);
	const propertiesStore = createRxStore<any>('properties',
		(db) => db.properties.find({ sort: [{ name: 'asc' }] })
	);
	const floorsStore = createRxStore<any>('floors',
		(db) => db.floors.find()
	);
	const rentalUnitsStore = createRxStore<any>('rental_units',
		(db) => db.rental_units.find()
	);
	const readingsStore = createRxStore<any>('readings',
		(db) => db.readings.find()
	);

	// ─── Derived data from RxDB stores ──────────────────────────────────

	// Meters enriched with latest reading (replaces server-side computation)
	let metersData = $derived.by(() => {
		return metersStore.value.map((meter: any) => {
			// Find latest reading for this meter
			const meterReadings = readingsStore.value.filter(
				(r: any) => String(r.meter_id) === String(meter.id)
			);
			let latest_reading: { value: number; date: string } | undefined;
			if (meterReadings.length > 0) {
				const sorted = [...meterReadings].sort(
					(a: any, b: any) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime()
				);
				latest_reading = {
					value: parseFloat(sorted[0].reading),
					date: sorted[0].reading_date
				};
			}
			return {
				...meter,
				id: Number(meter.id),
				property_id: meter.property_id ? Number(meter.property_id) : null,
				floor_id: meter.floor_id ? Number(meter.floor_id) : null,
				rental_unit_id: meter.rental_unit_id ? Number(meter.rental_unit_id) : null,
				initial_reading: meter.initial_reading ? parseFloat(meter.initial_reading) : null,
				latest_reading
			};
		});
	});

	let propertiesData = $derived(propertiesStore.value.map((p: any) => ({
		...p, id: Number(p.id)
	})));

	let floorsData = $derived(floorsStore.value.map((f: any) => {
		const property = propertiesStore.value.find((p: any) => String(p.id) === String(f.property_id));
		return {
			...f,
			id: Number(f.id),
			propertyId: f.property_id,
			floorNumber: f.floor_number,
			property: property ? { id: Number(property.id), name: property.name } : null
		};
	}));

	let rentalUnitData = $derived(rentalUnitsStore.value.map((u: any) => {
		const floor = floorsStore.value.find((f: any) => String(f.id) === String(u.floor_id));
		const floorProperty = floor ? propertiesStore.value.find((p: any) => String(p.id) === String(floor.property_id)) : null;
		return {
			...u,
			id: Number(u.id),
			floorId: u.floor_id ? Number(u.floor_id) : null,
			propertyId: u.property_id ? Number(u.property_id) : null,
			rentalUnitStatus: u.rental_unit_status,
			floor: floor ? {
				id: Number(floor.id),
				floor_number: floor.floor_number,
				wing: floor.wing,
				property: floorProperty ? { id: Number(floorProperty.id), name: floorProperty.name } : null
			} : null
		};
	}));

	let isLoading = $derived(!metersStore.initialized);

	let selectedMeter = $state<ExtendedMeterFormData | undefined>(undefined);
	let loading = $state(false);
	let error = $state<string | null>(null);
	let selectedType = $state('');
	let selectedStatus = $state('');
	let searchQuery = $state('');
	let sortBy = $state<'name' | 'type' | 'status' | 'reading'>('name');
	let sortOrder = $state<'asc' | 'desc'>('asc');
	let editMode = $state(false);
	let showModal = $state(false);

	// Filtered and sorted meters
	const filterMeters = () => {
		if (!metersData || !Array.isArray(metersData)) {
			return [];
		}

		try {
			const filtered = metersData.filter((meter: ExtendedMeterFormData) => {
				if (!meter) {
					return false;
				}

				try {
					// Get location details with error handling
					let locationDetails = '';
					try {
						locationDetails = getLocationDetails(meter).toLowerCase();
					} catch (locErr) {
						locationDetails = 'location error';
					}

					const matchesType = !selectedType || meter.type === selectedType;
					const matchesStatus = !selectedStatus || meter.status === selectedStatus;
					const matchesSearch =
						!searchQuery ||
						meter.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
						locationDetails.includes(searchQuery.toLowerCase());

					return matchesType && matchesStatus && matchesSearch;
				} catch (err) {
					return false;
				}
			});

			const result = filtered.sort((a: ExtendedMeterFormData, b: ExtendedMeterFormData) => {
				const order = sortOrder === 'asc' ? 1 : -1;
				switch (sortBy) {
					case 'name':
						return order * a.name.localeCompare(b.name);
					case 'type':
						return order * a.type.localeCompare(b.type);
					case 'status':
						return order * a.status.localeCompare(b.status);
					case 'reading':
						const aReading = a.latest_reading?.value || 0;
						const bReading = b.latest_reading?.value || 0;
						return order * (aReading - bReading);
					default:
						return 0;
				}
			});

			return result;
		} catch (err) {
			error = 'Error filtering meter data';
			return [];
		}
	};

	let filteredMeters = $derived(filterMeters());

	// Group filtered meters by property
	const groupMeters = (): MeterGroup[] => {
		const grouped: Record<string, MeterGroup> = {};

		filteredMeters.forEach((meter) => {
			let propertyId: number | null = null;
			let propertyName = 'Unknown Property';

			if (meter.location_type === 'PROPERTY' && meter.property_id) {
				propertyId = meter.property_id;
				const property = propertiesData?.find((p) => p.id === propertyId);
				propertyName = property?.name || 'Unknown Property';
			} else if (meter.location_type === 'FLOOR' && meter.floor_id) {
				const floor = floorsData?.find((f) => f.id === meter.floor_id);
				if (floor?.property) {
					propertyId = floor.property.id;
					propertyName = floor.property.name;
				}
			} else if (meter.location_type === 'RENTAL_UNIT' && meter.rental_unit_id) {
				const unit = rentalUnitData?.find((r) => r.id === meter.rental_unit_id);
				if (unit?.floor?.property) {
					propertyId = unit.floor.property.id;
					propertyName = unit.floor.property.name;
				}
			}

			const propId = propertyId ? propertyId.toString() : 'unknown';

			if (!grouped[propId]) {
				grouped[propId] = {
					id: propertyId,
					name: propertyName,
					meters: []
				};
			}

			grouped[propId].meters.push(meter);
		});

		return Object.values(grouped);
	};

	let groupedMeters = $derived(groupMeters());

	// Form handling
	const { form, enhance, errors, constraints, submitting, reset, message } = superForm(data.form, {
		id: 'meter-form',
		validators: zodClient(meterFormSchema),
		validationMethod: 'oninput',
		dataType: 'json',
		taintedMessage: null,
		resetForm: true,
		onSubmit: () => {
			console.log('Form submission started with data:', $form);
			loading = true;
		},
		onError: ({ result }) => {
			console.error('Form submission error:', result);
			error = result.error?.message || 'An error occurred during submission';
			loading = false;
		},
		onResult: async ({ result }) => {
			console.log('Form submission result:', result);
			loading = false;

			if (result.type === 'success') {
				console.log('Operation successful!', result.data);
				error = null;

				// Optimistic upsert into RxDB
				if ($form.id) {
					await optimisticUpsertMeter({
						id: $form.id,
						name: $form.name,
						location_type: $form.location_type,
						property_id: $form.property_id,
						floor_id: $form.floor_id,
						rental_unit_id: $form.rental_unit_id,
						type: $form.type,
						is_active: $form.status === 'ACTIVE',
						status: $form.status,
						notes: $form.notes,
						initial_reading: $form.initial_reading
					});
				}

				// Reset the form state and close modal
				editMode = false;
				selectedMeter = undefined;
				showModal = false;
				reset();
			} else {
				console.error('Operation failed:', result);
			}
		}
	});

	// Event handlers
	function handleAddMeter() {
		editMode = false;
		selectedMeter = undefined;
		reset();
		showModal = true;
	}

	function handleCancel() {
		editMode = false;
		selectedMeter = undefined;
		showModal = false;
		reset();
	}

	function handleTypeChange(value: string) {
		selectedType = value;
	}

	function handleStatusChange(value: string) {
		selectedStatus = value;
	}

	function handleEdit(meter: ExtendedMeterFormData) {
		editMode = true;
		selectedMeter = meter;

		// Make sure to copy all properties to the form
		$form = {
			...meter,
			// Ensure ID is properly set
			id: meter.id
		};

		showModal = true;
	}

	function clearFilters() {
		searchQuery = '';
		selectedType = '';
		selectedStatus = '';
	}

	// Utility functions
	function getLocationDetails(meter: ExtendedMeterFormData): string {
		if (!meter || !meter.location_type) return 'Unknown Location';

		try {
			switch (meter.location_type) {
				case 'PROPERTY':
					const property = propertiesData?.find((p: Property) => p.id === meter.property_id);
					return property ? `Property: ${property.name}` : 'Unknown Property';
				case 'FLOOR':
					const floor = floorsData?.find((f: Floor) => f.id === meter.floor_id);
					return floor
						? `Floor ${floor.floor_number}${floor.property ? ` - ${floor.property.name}` : ''}`
						: 'Unknown Floor';
				case 'RENTAL_UNIT':
					const unit = rentalUnitData?.find((r: Rental_unit) => r.id === meter.rental_unit_id);
					return unit
						? `Rental_unit ${unit.number}${unit.floor?.property ? ` - ${unit.floor.property.name}` : ''}`
						: 'Unknown Rental_unit';
				default:
					return 'Unknown Location';
			}
		} catch (err) {
			return 'Location Error';
		}
	}

	function getDetailedLocationInfo(meter: ExtendedMeterFormData): string {
		if (!meter || !meter.location_type) return '';

		try {
			switch (meter.location_type) {
				case 'PROPERTY':
					return '';
				case 'FLOOR':
					const floor = floorsData?.find((f: Floor) => f.id === meter.floor_id);
					return floor
						? `Floor ${floor.floor_number}${floor.wing ? `, Wing ${floor.wing}` : ''}`
						: '';
				case 'RENTAL_UNIT':
					const unit = rentalUnitData?.find((r: Rental_unit) => r.id === meter.rental_unit_id);
					return unit ? `Rental_unit ${unit.number}` : '';
				default:
					return '';
			}
		} catch (err) {
			return '';
		}
	}

	function getTypeVariant(type: string): 'default' | 'outline' | 'secondary' | 'destructive' {
		switch (type) {
			case 'ELECTRICITY':
				return 'default';
			case 'WATER':
				return 'secondary';
			case 'INTERNET':
				return 'outline';
			default:
				return 'default';
		}
	}

	function getStatusColor(status: string): string {
		switch (status) {
			case 'ACTIVE':
				return 'bg-green-100 text-green-800';
			case 'INACTIVE':
				return 'bg-gray-100 text-gray-800';
			case 'MAINTENANCE':
				return 'bg-yellow-100 text-yellow-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	function formatReading(value: number): string {
		return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
	}

	function handleSort(field: typeof sortBy) {
		if (sortBy === field) {
			sortOrder = sortOrder === 'asc' ? 'desc' : 'asc';
		} else {
			sortBy = field;
			sortOrder = 'asc';
		}
	}
</script>

<div class="space-y-6">
	<!-- Error / Success Alerts -->
	{#if error}
		<Alert.Root variant="destructive" class="fixed top-4 right-4 z-50 max-w-md">
			<Alert.Title>Error</Alert.Title>
			<Alert.Description>{error}</Alert.Description>
		</Alert.Root>
	{/if}

	{#if $message && !error}
		<Alert.Root
			variant="default"
			class="fixed top-4 right-4 z-50 max-w-md bg-green-50 border-green-200"
		>
			<Alert.Title class="text-green-800">Success</Alert.Title>
			<Alert.Description class="text-green-700">{$message}</Alert.Description>
		</Alert.Root>
	{/if}

	<!-- Header -->
	<div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
		<div class="flex items-center gap-3">
			<div class="p-2 bg-amber-50 rounded-lg">
				<Gauge class="w-6 h-6 text-amber-600" />
			</div>
			<div>
				<h1 class="text-2xl font-bold tracking-tight">Meters</h1>
				<p class="text-sm text-muted-foreground">Manage utility meters and readings</p>
			</div>
		</div>
		<Button onclick={handleAddMeter} class="shadow-sm">
			<Plus class="w-4 h-4 mr-2" />
			Add Meter
		</Button>
	</div>

	<!-- Filters -->
	<Card.Root>
		<Card.Content class="p-4">
			<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
				<div class="relative">
					<span class="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							width="16"
							height="16"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<circle cx="11" cy="11" r="8"></circle>
							<line x1="21" y1="21" x2="16.65" y2="16.65"></line>
						</svg>
					</span>
					<Input
						type="text"
						placeholder="Search by name or location"
						bind:value={searchQuery}
						class="pl-10"
					/>
				</div>
				<div>
					<Select.Root type="single" value={selectedType} onValueChange={handleTypeChange}>
						<Select.Trigger>
							<span>{selectedType || 'All Types'}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Types</Select.Item>
							{#each Object.values(utilityTypeEnum.enum) as type}
								<Select.Item value={type}>
									<div class="flex items-center">
										<span
											class={`w-3 h-3 rounded-full mr-2 ${type === 'ELECTRICITY' ? 'bg-blue-500' : type === 'WATER' ? 'bg-cyan-500' : 'bg-purple-500'}`}
										></span>
										{type}
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div>
					<Select.Root type="single" value={selectedStatus} onValueChange={handleStatusChange}>
						<Select.Trigger>
							<span>{selectedStatus || 'All Statuses'}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Statuses</Select.Item>
							{#each Object.values(meterStatusEnum.enum) as status}
								<Select.Item value={status}>
									<div class="flex items-center">
										<span
											class={`w-3 h-3 rounded-full mr-2 ${
												status === 'ACTIVE'
													? 'bg-green-500'
													: status === 'INACTIVE'
														? 'bg-gray-500'
														: 'bg-yellow-500'
											}`}
										></span>
										{status}
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
			</div>
		</Card.Content>
		{#if searchQuery || selectedType || selectedStatus}
			<Card.Footer class="py-2 px-4">
				<div class="flex justify-between items-center">
					<span class="text-sm text-gray-500"
						>{filteredMeters.length} result{filteredMeters.length !== 1 ? 's' : ''}</span
					>
					<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
				</div>
			</Card.Footer>
		{/if}
	</Card.Root>

	<!-- Sort Buttons -->
	<div class="flex items-center justify-between text-sm text-gray-500 px-2">
		<div class="flex space-x-4">
			<button
				class={`${sortBy === 'name' ? 'text-black font-medium' : ''}`}
				onclick={() => handleSort('name')}
			>
				Name {sortBy === 'name' && (sortOrder === 'asc' ? '↑' : '↓')}
			</button>
			<button
				class={`${sortBy === 'type' ? 'text-black font-medium' : ''}`}
				onclick={() => handleSort('type')}
			>
				Type {sortBy === 'type' && (sortOrder === 'asc' ? '↑' : '↓')}
			</button>
			<button
				class={`${sortBy === 'status' ? 'text-black font-medium' : ''}`}
				onclick={() => handleSort('status')}
			>
				Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
			</button>
			<button
				class={`${sortBy === 'reading' ? 'text-black font-medium' : ''}`}
				onclick={() => handleSort('reading')}
			>
				Reading {sortBy === 'reading' && (sortOrder === 'asc' ? '↑' : '↓')}
			</button>
		</div>
	</div>

	<!-- Content -->
	{#if isLoading}
		<div class="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-lg">
			<Loader2 class="w-8 h-8 animate-spin text-gray-400 mb-3" />
			<p class="text-center text-gray-500">Loading meters...</p>
		</div>
	{:else if groupedMeters.length === 0}
		<div class="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-lg">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="40"
				height="40"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="1"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="text-gray-400 mb-3"
			>
				<path d="M10.3 8.2c.7-.3 1.5-.4 2.3-.4h1.2c2.2 0 4 1.8 4 4 0 .5-.1 1-.3 1.5" />
				<path d="M2.5 10a2.5 2.5 0 0 1 5 0c0 .5-.1 1-.3 1.5" />
				<path
					d="M7.8 15.2a5 5 0 0 0-2.3.4 2.5 2.5 0 0 0 3.4 1c.7-.3 1.5-.4 2.3-.4h1.2c.8 0 1.6.1 2.3.4a2.5 2.5 0 0 0 3.4-1 2.5 2.5 0 0 0-1-3.4 5 5 0 0 0-2.3-.4h-5.6z"
				/>
				<path d="M21.7 16.2a2.5 2.5 0 0 0-3.2-3.4" />
			</svg>
			<p class="text-center text-gray-500">No meters found</p>
		</div>
	{:else}
		<div class="space-y-6">
			{#each groupedMeters as group}
				<div>
					<h2 class="text-lg font-semibold mb-2 px-1">{group.name}</h2>
					<div class="space-y-2">
						{#each group.meters as meter}
							<Card.Root
								class="hover:bg-gray-50 transition-colors"
							>
								<button
									type="button"
									class="w-full text-left cursor-pointer"
									onclick={() => handleEdit(meter)}
								>
									<Card.Content class="p-3">
										<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
											<div class="flex flex-col">
												<div class="flex items-center gap-2 mb-1">
													<span class="font-medium">{meter.name}</span>
													<Badge variant={getTypeVariant(meter.type)} class="text-xs px-2 py-0.5">
														{meter.type}
													</Badge>
													<Badge class={`text-xs px-2 py-0.5 ${getStatusColor(meter.status)}`}>
														{meter.status}
													</Badge>
												</div>
												{#if getDetailedLocationInfo(meter)}
													<span class="text-sm text-gray-500"
														>{getDetailedLocationInfo(meter)}</span
													>
												{/if}
											</div>

											<div class="text-right">
												{#if meter.latest_reading}
													<div class="flex flex-col items-end">
														<span class="font-medium"
															>{formatReading(meter.latest_reading.value)}</span
														>
														<span class="text-xs text-gray-500">
															{new Date(meter.latest_reading.date).toLocaleDateString()}
														</span>
													</div>
												{:else}
													<span class="text-sm text-gray-400">No readings yet</span>
												{/if}
											</div>
										</div>

										{#if meter.notes}
											<div class="mt-2 pt-2 border-t border-gray-100">
												<p class="text-sm text-gray-500">{meter.notes}</p>
											</div>
										{/if}
									</Card.Content>
								</button>
							</Card.Root>
						{/each}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>

<!-- Meter Form Modal -->
<Dialog bind:open={showModal}>
	<DialogContent class="sm:max-w-[600px]">
		<DialogHeader>
			<DialogTitle>{editMode ? 'Edit' : 'Add'} Meter</DialogTitle>
			<DialogDescription>
				{editMode ? 'Update the meter details below.' : 'Fill in the details to add a new meter.'}
			</DialogDescription>
		</DialogHeader>

		<MeterForm
			{editMode}
			data={{
				properties: propertiesData,
				floors: floorsData,
				rental_unit: rentalUnitData,
				meter: selectedMeter
			}}
			{form}
			{errors}
			{enhance}
			{constraints}
			{submitting}
			on:cancel={handleCancel}
		/>
	</DialogContent>
</Dialog>
