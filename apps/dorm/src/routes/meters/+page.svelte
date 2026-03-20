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
	import { Loader2, Plus, Gauge, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-svelte';
	import MeterForm from './MeterForm.svelte';
	import { superForm } from 'sveltekit-superforms/client';
	import { defaults } from 'sveltekit-superforms';
	import { zodClient, zod } from 'sveltekit-superforms/adapters';
	import { toast } from 'svelte-sonner';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';
	import {
		metersStore,
		propertiesStore,
		floorsStore,
		rentalUnitsStore,
		readingsStore
	} from '$lib/stores/collections.svelte';
	import { optimisticUpsertMeter } from '$lib/db/optimistic-meters';
	import { bgResync, bufferedMutation, CONFLICT_MESSAGE } from '$lib/db/optimistic-utils';
	import { getStatusClasses, formatEnumLabel } from '$lib/utils/format';

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

	// ─── RxDB reactive stores (singletons from collections.svelte.ts) ──

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

	// Capture form data before superForm resets it
	let savedFormData: any = null;
	let savedEditMode = false;
	let submitSeq = 0;
	let rollback: (() => Promise<void>) | null = null;

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
	const { form, enhance, errors, constraints, submitting, reset, message } = superForm(defaults(zod(meterFormSchema)), {
		id: 'meter-form',
		validators: zodClient(meterFormSchema),
		validationMethod: 'oninput',
		dataType: 'json',
		taintedMessage: null,
		resetForm: true,
		onSubmit: async () => {
			loading = true;
			submitSeq++;
			savedFormData = { ...$form, _seq: submitSeq };
			savedEditMode = editMode;

			// Close modal immediately for snappy UX
			editMode = false;
			selectedMeter = undefined;
			showModal = false;

			toast.info(savedEditMode ? 'Saving meter...' : 'Creating meter...');

			// For updates where we already know the ID, run the optimistic write immediately
			if (savedEditMode && savedFormData?.id) {
				const fd = savedFormData;
				rollback = await optimisticUpsertMeter({
					id: fd.id,
					name: fd.name,
					location_type: fd.location_type,
					property_id: fd.property_id,
					floor_id: fd.floor_id,
					rental_unit_id: fd.rental_unit_id,
					type: fd.type,
					is_active: fd.status === 'ACTIVE',
					status: fd.status,
					notes: fd.notes,
					initial_reading: String(fd.initial_reading)
				});
			}
		},
		onError: async ({ result }) => {
			toast.error('Error saving meter');
			error = result.error?.message || 'An error occurred during submission';
			loading = false;
			// Instant rollback, then confirm with resync
			if (rollback) { await rollback(); rollback = null; }
			bgResync('meters');
		},
		onResult: async ({ result }) => {
			loading = false;

			// Ignore if a newer submission has already overwritten
			if (!savedFormData || savedFormData._seq !== submitSeq) return;

			if (result.type === 'failure' && (result.data as any)?.conflict) {
				toast.error(CONFLICT_MESSAGE, { duration: 6000 });
				if (rollback) { await rollback(); rollback = null; }
				bgResync('meters');
				savedFormData = null;
				return;
			}

			if (result.type === 'success') {
				const serverData = (result as any).data?.form?.data;
				error = null;
				rollback = null; // Success — discard snapshot

				if (!savedEditMode) {
					// Create: server assigned a new ID — upsert with the real ID
					const fd = serverData ?? savedFormData;
					if (fd?.id) {
						await optimisticUpsertMeter({
							id: fd.id,
							name: fd.name,
							location_type: fd.location_type,
							property_id: fd.property_id,
							floor_id: fd.floor_id,
							rental_unit_id: fd.rental_unit_id,
							type: fd.type,
							is_active: fd.status === 'ACTIVE',
							status: fd.status,
							notes: fd.notes,
							initial_reading: String(fd.initial_reading)
						});
					} else {
						bgResync('meters');
					}
					toast.success('Meter created');
				} else {
					// Update: optimistic write already ran in onSubmit; confirm with success toast
					toast.success('Meter updated');
				}

				savedFormData = null;
				reset();
			} else if (result.type === 'failure' || result.type === 'error') {
				toast.error('Failed to save meter');
				// Instant rollback, then confirm with resync
				if (rollback) { await rollback(); rollback = null; }
				bgResync('meters');
				savedFormData = null;
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

	let editUpdatedAt = $state<string | null>(null);

	function handleEdit(meter: ExtendedMeterFormData) {
		editMode = true;
		selectedMeter = meter;
		editUpdatedAt = (meter as any).updated_at ?? null;

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

	// Utility functions — [Fix 01] use "Unit" instead of "Rental_unit"
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
						? `Unit ${unit.name || unit.number}${unit.floor?.property ? ` - ${unit.floor.property.name}` : ''}`
						: 'Unknown Unit';
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
					return unit ? `Unit ${unit.name || unit.number}` : '';
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

	// [Fix 09] Build structured aria-label for screen readers
	function getMeterAriaLabel(meter: ExtendedMeterFormData): string {
		const parts = [
			meter.name,
			`${formatEnumLabel(meter.type)} meter`,
			formatEnumLabel(meter.status)
		];
		const location = getDetailedLocationInfo(meter);
		if (location) parts.push(location);
		if (meter.latest_reading) {
			parts.push(`reading ${formatReading(meter.latest_reading.value)} on ${new Date(meter.latest_reading.date).toLocaleDateString()}`);
		} else {
			parts.push('no readings yet');
		}
		return parts.join(', ');
	}
</script>

<div class="space-y-6">
	<SyncErrorBanner collections={['meters', 'readings', 'properties', 'floors', 'rental_units']} />
	<!-- Error Alert (removed duplicate $message alert — [Fix 05/C5] toasts handle success) -->
	{#if error}
		<Alert.Root variant="destructive" class="fixed top-4 right-4 z-50 max-w-md">
			<Alert.Title>Error</Alert.Title>
			<Alert.Description>{error}</Alert.Description>
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
		<!-- Desktop Add Meter button (hidden on mobile — FAB below) -->
		<Button onclick={handleAddMeter} class="shadow-sm hidden sm:inline-flex">
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
							<span>{selectedType ? formatEnumLabel(selectedType) : 'All Types'}</span>
						</Select.Trigger>
						<Select.Content>
							<Select.Item value="">All Types</Select.Item>
							{#each Object.values(utilityTypeEnum.enum) as type}
								<Select.Item value={type}>
									<div class="flex items-center">
										<span
											class={`w-3 h-3 rounded-full mr-2 ${type === 'ELECTRICITY' ? 'bg-blue-500' : type === 'WATER' ? 'bg-cyan-500' : 'bg-purple-500'}`}
										></span>
										{formatEnumLabel(type)}
									</div>
								</Select.Item>
							{/each}
						</Select.Content>
					</Select.Root>
				</div>
				<div>
					<Select.Root type="single" value={selectedStatus} onValueChange={handleStatusChange}>
						<Select.Trigger>
							<span>{selectedStatus ? formatEnumLabel(selectedStatus) : 'All Statuses'}</span>
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
										{formatEnumLabel(status)}
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

	<!-- Sort Buttons — [Fix 03] increased min-height for mobile touch targets -->
	<div class="flex items-center justify-between text-sm text-gray-500 px-2">
		<div class="flex space-x-1">
			<Button variant="ghost" size="sm" class="min-h-[44px] sm:min-h-0 {sortBy === 'name' ? 'text-black font-medium' : ''}" onclick={() => handleSort('name')}>
				Name
				{#if sortBy === 'name'}
					{#if sortOrder === 'asc'}<ChevronUp class="h-4 w-4 ml-1" />{:else}<ChevronDown class="h-4 w-4 ml-1" />{/if}
				{/if}
			</Button>
			<Button variant="ghost" size="sm" class="min-h-[44px] sm:min-h-0 {sortBy === 'type' ? 'text-black font-medium' : ''}" onclick={() => handleSort('type')}>
				Type
				{#if sortBy === 'type'}
					{#if sortOrder === 'asc'}<ChevronUp class="h-4 w-4 ml-1" />{:else}<ChevronDown class="h-4 w-4 ml-1" />{/if}
				{/if}
			</Button>
			<Button variant="ghost" size="sm" class="min-h-[44px] sm:min-h-0 {sortBy === 'status' ? 'text-black font-medium' : ''}" onclick={() => handleSort('status')}>
				Status
				{#if sortBy === 'status'}
					{#if sortOrder === 'asc'}<ChevronUp class="h-4 w-4 ml-1" />{:else}<ChevronDown class="h-4 w-4 ml-1" />{/if}
				{/if}
			</Button>
			<Button variant="ghost" size="sm" class="min-h-[44px] sm:min-h-0 {sortBy === 'reading' ? 'text-black font-medium' : ''}" onclick={() => handleSort('reading')}>
				Reading
				{#if sortBy === 'reading'}
					{#if sortOrder === 'asc'}<ChevronUp class="h-4 w-4 ml-1" />{:else}<ChevronDown class="h-4 w-4 ml-1" />{/if}
				{/if}
			</Button>
		</div>
	</div>

	<!-- Content -->
	{#if isLoading}
		<div class="flex flex-col items-center justify-center py-8 px-4 bg-gray-50 rounded-lg">
			<Loader2 class="w-8 h-8 animate-spin text-gray-400 mb-3" />
			<p class="text-center text-gray-500">Loading meters...</p>
		</div>
	{:else if groupedMeters.length === 0}
		<!-- [Fix 06] Empty state with guidance CTA -->
		<div class="flex flex-col items-center justify-center py-12 px-4 bg-gray-50 rounded-lg">
			<Gauge class="w-10 h-10 text-gray-300 mb-4" />
			{#if searchQuery || selectedType || selectedStatus}
				<p class="text-center text-gray-500 mb-1">No meters match your filters</p>
				<p class="text-center text-sm text-gray-400 mb-4">Try adjusting your search or clearing filters</p>
				<Button variant="outline" size="sm" onclick={clearFilters}>Clear Filters</Button>
			{:else}
				<p class="text-center text-gray-500 mb-1">No meters found</p>
				<p class="text-center text-sm text-gray-400 mb-4">Add your first meter to start tracking utility readings</p>
				<Button onclick={handleAddMeter} size="sm">
					<Plus class="w-4 h-4 mr-2" />
					Add Meter
				</Button>
			{/if}
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
								<!-- [Fix 09] Structured aria-label for screen readers -->
								<button
									type="button"
									class="w-full text-left cursor-pointer"
									aria-label={getMeterAriaLabel(meter)}
									onclick={() => handleEdit(meter)}
								>
									<Card.Content class="p-3">
										<div class="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
											<div class="flex flex-col">
												<div class="flex items-center gap-2 mb-1">
													<span class="font-medium">{meter.name}</span>
													<!-- [Fix 02] Title case enum labels -->
													<Badge variant={getTypeVariant(meter.type)} class="text-xs px-2 py-0.5">
														{formatEnumLabel(meter.type)}
													</Badge>
													<Badge class={`text-xs px-2 py-0.5 ${getStatusClasses(meter.status)}`}>
														{formatEnumLabel(meter.status)}
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

<!-- [Fix 04] Mobile FAB — floating "Add Meter" button in thumb zone -->
<button
	type="button"
	class="fixed bottom-6 right-6 z-40 sm:hidden flex items-center justify-center w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-transform"
	aria-label="Add Meter"
	onclick={handleAddMeter}
>
	<Plus class="w-6 h-6" />
</button>

<!-- Meter Form Modal -->
<Dialog bind:open={showModal}>
	<DialogContent class="sm:max-w-[600px]">
		<DialogHeader>
			<DialogTitle>{editMode ? 'Edit' : 'Add'} Meter</DialogTitle>
			<DialogDescription>
				{editMode ? 'Update the meter details below.' : 'Fill in the details to add a new meter.'}
			</DialogDescription>
		</DialogHeader>

		<!-- [Fix 10] callback prop instead of on:cancel -->
		<MeterForm
			{editMode}
			updatedAt={editUpdatedAt}
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
			oncancel={handleCancel}
		/>
	</DialogContent>
</Dialog>
