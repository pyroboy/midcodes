<script lang="ts">
	import { ChevronDown, CheckSquare, Square } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import { Checkbox } from '$lib/components/ui/checkbox';
	import ConsolidatedPrintModal from './ConsolidatedPrintModal.svelte';
	import type { Reading, Meter, Property, MeterData, Filters, ShareData, Lease, Tenant } from './types';
	import { slide } from 'svelte/transition';

	// Props (Svelte 5 style)
	let props = $props<{
		readings: Reading[];
		meters: Meter[];
		properties: Property[];
		filters: Filters;
		onShareReading: (meter: MeterData) => void;
		meterLastBilledDates?: Record<string, string>;
		actualBilledDates?: Record<string, string[]>;
		leaseMeterBilledDates?: Record<string, string>;
		leases?: any[];
	}>();

	// State
	let filters = $state({
		period: new Date().toISOString().slice(0, 7),
		search: ''
	});

	// Selection state
	let selectedReadings = $state(new Set<number>());

	// Ensure reactive rendering by deriving a plain array from the Set
	const selectedIds = $derived.by(() => Array.from(selectedReadings));

	// Print modal state
	let consolidatedOpen = $state(false);

	// Types aligned with ConsolidatedPrintModal expectations
	type Group = { reading: MeterData; data: ShareData[] };
	function isGroup(value: Group | null): value is Group {
		return value !== null;
	}

	// Calculate tenant shares for a meter based on location and ONLY billed leases for this period
	function calculateTenantShares(meterData: MeterData, meter: Meter | undefined, reading: Reading): ShareData[] {
		if (!meterData.totalCost || meterData.totalCost <= 0) return [];
		if (!props.leases || !Array.isArray(props.leases) || props.leases.length === 0) return [];

		// Filter leases based on meter location AND billing status for this specific period
		const relevantLeases = props.leases.filter((lease: any) => {
			if (!lease || !lease.rental_unit) return false;

			// First check location filtering (same logic as TenantShareModal)
			let locationMatch = false;
			switch (meterData.location_type) {
				case 'RENTAL_UNIT':
					locationMatch = lease.rental_unit_id === meterData.rental_unit_id;
					break;
				case 'FLOOR':
					locationMatch = meterData.floor_id && lease.rental_unit && lease.rental_unit.floor_id === meterData.floor_id;
					break;
				case 'PROPERTY':
					locationMatch = meterData.property_id && lease.rental_unit && lease.rental_unit.property_id === meterData.property_id;
					break;
				default:
					// Fallback hierarchical logic
					locationMatch = (meterData.rental_unit_id && lease.rental_unit_id === meterData.rental_unit_id) ||
						(meterData.floor_id && lease.rental_unit && lease.rental_unit.floor_id === meterData.floor_id) ||
						(meterData.property_id && lease.rental_unit && lease.rental_unit.property_id === meterData.property_id) ||
						true; // Show all if no location info
			}

			if (!locationMatch) return false;

			// Now check if this lease has been billed for this meter and period
			if (!props.leaseMeterBilledDates || !props.actualBilledDates) return false;

			const leaseMeterKey = `${meterData.meterId}-${lease.id}`;
			const leaseBilledDate = props.leaseMeterBilledDates[leaseMeterKey];

			// Check if lease was billed for this meter
			if (!leaseBilledDate) return false;

			// Check if the meter was billed on this reading date
			const meterKey = String(meterData.meterId);
			const meterBilledDates = props.actualBilledDates[meterKey];
			if (!meterBilledDates || !meterBilledDates.includes(reading.reading_date)) return false;

			return true;
		});

		// Get active tenants from relevant (and billed) leases
		const activeTenants = relevantLeases.flatMap((lease: any) =>
			(lease.tenants || [])
				.filter((tenant: any) =>
					tenant.tenant_status !== 'INACTIVE' &&
					tenant.tenant_status !== 'TERMINATED' &&
					tenant.tenant_status !== 'ARCHIVED'
				)
				.map((tenant: any) => ({
					lease,
					tenant
				}))
		);

		if (activeTenants.length === 0) return [];

		// Calculate share per tenant
		const sharePerTenant = meterData.totalCost / activeTenants.length;

		// Create ShareData array
		return activeTenants.map(({ lease, tenant }: any) => ({
			tenant,
			lease: { id: lease.id, name: lease.name },
			share: sharePerTenant
		}));
	}

	// Build print groups only when modal is open to avoid unnecessary recomputation
	const printGroups = $derived.by((): Group[] => {
		if (!consolidatedOpen) return [];
		return selectedIds
			.map((id): Group | null => {
				const reading = filteredReadings.find((r: Reading) => r.id === id);
				if (!reading || !reading.meters) return null;
				const meter = props.meters.find((m: Meter) => m.id === reading.meter_id);
				const meterData: MeterData = {
					meterId: reading.meter_id,
					meterName: reading.meters.name,
					meterType: reading.meters.type,
					unit: '',
					currentReading: reading.reading,
					currentReadingDate: reading.reading_date,
					lastReading: (reading as any).previous_reading || null,
					lastReadingDate: reading.previous_reading_date || null,
					consumption: reading.consumption || null,
					costPerUnit: reading.rate_at_reading || null,
					totalCost: reading.cost || null,
					daysDiff: reading.days_diff || null,
					history: [], // minimize payload to print modal
					property_id: meter?.property_id || null,
					floor_id: (meter as any)?.floor_id || null,
					rental_unit_id: (meter as any)?.rental_unit_id || null,
					location_type: (meter as any)?.location_type || null
				};

				// Calculate tenant shares for this meter
				const shareData = calculateTenantShares(meterData, meter, reading);
				return { reading: meterData, data: shareData } as Group;
			})
			.filter(isGroup);
	});

	// Derived: filtered and grouped readings
	const filteredReadings = $derived.by(() => {
		return props.readings.filter((r: Reading) => {
			const matchesPeriod = !filters.period || r.period === filters.period;
			const matchesSearch =
				!filters.search ||
				r.meters?.name.toLowerCase().includes(filters.search.toLowerCase()) ||
				r.meters?.type.toLowerCase().includes(filters.search.toLowerCase());
			return matchesPeriod && matchesSearch;
		});
	});

	// Derived: all billed readings (same logic as "✓ Billed" indicator)
	const billedReadings = $derived.by(() => {
		return filteredReadings.filter((r: Reading) => isBilledForPeriod(r));
	});

	// Derived: check if all billed readings are selected
	const allBilledSelected = $derived.by(() => {
		if (billedReadings.length === 0) return false;
		return billedReadings.every((r: Reading) => selectedIds.includes(r.id));
	});


	// Selection handling functions
	function toggleReadingSelection(readingId: number) {
		const newSelection = new Set(selectedReadings);
		if (newSelection.has(readingId)) {
			newSelection.delete(readingId);
		} else {
			newSelection.add(readingId);
		}
		selectedReadings = newSelection;
	}

	function selectAllBilledReadings() {
		const newSelection = new Set(selectedReadings);
		// @ts-ignore - $derived value access
		const billed = billedReadings;
		
		// @ts-ignore - $derived value access
		if (allBilledSelected) {
			// Deselect all billed readings
			billed.forEach((r: Reading) => newSelection.delete(r.id));
		} else {
			// Select all billed readings
			billed.forEach((r: Reading) => newSelection.add(r.id));
		}
		
		selectedReadings = newSelection;
		// If we now have selections, show print button/modal trigger
		if (selectedIds.length > 0) {
			// open a small CTA area by toggling state; we'll use a button below
		}
	}

	function clearAllSelections() {
		selectedReadings = new Set();
	}

	// Handle share button click
	function handleShareClick(event: MouseEvent, reading: Reading) {
		event.stopPropagation();
		if (props.onShareReading && reading.meters) {
			// Find the full meter data to get location information
			const fullMeter = props.meters.find((m: Meter) => m.id === reading.meter_id);
			
			const meterData: MeterData = {
				meterId: reading.meter_id,
				meterName: reading.meters.name,
				meterType: reading.meters.type,
				unit: '', // No unit field in database
				currentReading: reading.reading,
				currentReadingDate: reading.reading_date,
				lastReading: null, // previous_reading not available in Reading type
				lastReadingDate: reading.previous_reading_date || null, // Add previous reading date
				consumption: reading.consumption || null,
				costPerUnit: reading.rate_at_reading || null,
				totalCost: reading.cost || null,
				daysDiff: reading.days_diff || null, // Add days gap
				history: [reading],
				// Add location information for filtering
				property_id: fullMeter?.property_id || null,
				floor_id: fullMeter?.floor_id || null,
				rental_unit_id: fullMeter?.rental_unit_id || null,
				location_type: fullMeter?.location_type || null
			};
			props.onShareReading(meterData);
		}
	}

	// Check if this reading period has been billed
	function isBilledForPeriod(reading: Reading): boolean {
		if (!props.actualBilledDates) return false;
		const meterKey = String(reading.meter_id);
		const billedDates = props.actualBilledDates[meterKey];
		return billedDates ? billedDates.includes(reading.reading_date) : false;
	}

	function handleRowKeyDown(event: KeyboardEvent, reading: Reading) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			handleShareClick(event as any, reading);
		}
	}

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-PH', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Format number with appropriate decimal places
	function formatNumber(value: number | null | undefined): string {
		if (value === null || value === undefined) return '-';

		if (value === Math.floor(value)) {
			return value.toString();
		}
		return value.toFixed(2);
	}

	// Format currency with peso sign
	function formatCurrency(amount: number | null | undefined): string {
		if (amount === null || amount === undefined) return '-';

		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	// Get utility color class
	function getUtilityColorClass(type: string): string {
		switch (type.toUpperCase()) {
			case 'ELECTRICITY':
				return 'bg-amber-100 text-amber-800';
			case 'WATER':
				return 'bg-blue-100 text-blue-800';
			case 'GAS':
				return 'bg-red-100 text-red-800';
			case 'INTERNET':
				return 'bg-purple-100 text-purple-800';
			case 'CABLE':
				return 'bg-green-100 text-green-800';
			default:
				return 'bg-gray-100 text-gray-800';
		}
	}

	// Get unit label based on utility type
	function getUnitLabel(type: string): string {
		if (!type) return ''; // Guard against undefined type
		switch (type.toUpperCase()) {
			case 'ELECTRICITY':
				return 'kWh';
			case 'WATER':
				return 'm³';
			case 'GAS':
				return 'm³';
			case 'INTERNET':
				return 'GB';
			case 'CABLE':
				return 'month';
			default:
				return 'unit';
		}
	}

	// Get color class based on days difference
	function getDaysDiffColorClass(daysDiff: number): string {
		if (daysDiff <= 15) {
			return 'text-red-600'; // Very short period (red)
		} else if (daysDiff <= 25) {
			return 'text-orange-600'; // Short period (orange)
		} else if (daysDiff <= 35) {
			return 'text-green-600'; // Normal period (green)
		} else if (daysDiff <= 45) {
			return 'text-yellow-600'; // Long period (yellow)
		} else {
			return 'text-red-600'; // Very long period (red)
		}
	}
</script>

<div class="space-y-4">
	<!-- Filters -->
	<div class="flex flex-wrap gap-4 items-end">
		<div>
			<label for="period-filter" class="block text-sm font-medium mb-1">Period</label>
			<input
				id="period-filter"
				type="month"
				class="border rounded px-3 py-2"
				bind:value={filters.period}
			/>
		</div>
		<div class="flex-1">
			<label for="search-filter" class="block text-sm font-medium mb-1">Search</label>
			<input
				id="search-filter"
				type="text"
				placeholder="Search meters..."
				class="w-full border rounded px-3 py-2"
				bind:value={filters.search}
			/>
		</div>
		
		<!-- PROMINENT SELECT ALL BILLED BUTTON -->
		<div class="flex gap-2 items-center">
			<Button
				variant="default"
				size="default"
				onclick={() => selectAllBilledReadings()}
				class="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-2"
				disabled={billedReadings.length === 0}
			>
				<!-- @ts-ignore - allBilledSelected is a Svelte 5 derived value -->
				{#if allBilledSelected && billedReadings.length > 0}
					DESELECT ALL BILLED ({billedReadings.length})
				{:else}
					SELECT ALL BILLED ({billedReadings.length})
				{/if}
			</Button>

			{#if selectedIds.length > 0}
				<Button
					variant="outline"
					size="default"
					onclick={() => (consolidatedOpen = true)}
					class="border-blue-600 text-blue-700 hover:bg-blue-50"
				>
					Print Selected ({selectedIds.length})
				</Button>
			{/if}

		</div>
	</div>

	<!-- Consolidated print modal. Build input groups from selected readings -->
	{#if consolidatedOpen}
		<ConsolidatedPrintModal
			bind:open={consolidatedOpen}
			groups={printGroups}
			close={() => (consolidatedOpen = false)}
		/>
	{/if}

	<!-- Debug info removed by request -->

	<!-- Selection Controls panel removed (keeping only the bright blue button) -->

	<!-- Table -->
	{#if filteredReadings.length === 0}
		<div class="bg-gray-50 rounded-md p-6 text-center">
			<p class="text-gray-500">No readings found with the current filters.</p>
		</div>
	{:else}
		<Table.Root>
			<Table.Header>
				<Table.Row>
					<!-- Removed top header checkbox as requested -->
					<Table.Head>Meter</Table.Head>
					<Table.Head>Type</Table.Head>
					<Table.Head>Last Billed</Table.Head>
					<Table.Head>Previous</Table.Head>
					<Table.Head>Current</Table.Head>
					<Table.Head>Days Gap</Table.Head>
					<Table.Head>Consumption</Table.Head>
					<Table.Head>Rate</Table.Head>
					<Table.Head>Cost</Table.Head>
					<Table.Head>Actions</Table.Head>
				</Table.Row>
			</Table.Header>
			<Table.Body>
				{#each filteredReadings as reading (reading.id)}
					<Table.Row class="cursor-pointer hover:bg-gray-50" role="button" tabindex={0}>
						<Table.Cell class="w-12">
							<Checkbox 
								checked={selectedIds.includes(reading.id)}
								disabled={!isBilledForPeriod(reading)}
								onCheckedChange={() => toggleReadingSelection(reading.id)}
								onclick={(e) => e.stopPropagation()}
								aria-label="Select reading for {reading.meters?.name || 'Unknown Meter'}"
								class="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 data-[state=checked]:text-white"
							/>
						</Table.Cell>
						<Table.Cell class="font-medium">
							<div class="flex items-center gap-2">
								<span>{reading.meters?.name || 'Unknown Meter'}</span>
								{#if reading.meters?.type}
									<span
										class="px-2 py-1 text-xs rounded-full {getUtilityColorClass(
											reading.meters.type
										)}"
									>
										{reading.meters.type}
									</span>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell>
							{reading.meters?.type || '-'}
						</Table.Cell>
						<Table.Cell>
							{#if props.meterLastBilledDates && props.meterLastBilledDates[String(reading.meter_id)]}
								{formatDate(props.meterLastBilledDates[String(reading.meter_id)])}
								{#if isBilledForPeriod(reading)}
									<span class="ml-2 text-xs text-green-600">✓ Billed</span>
								{/if}
							{:else}
								-
							{/if}
						</Table.Cell>
						<Table.Cell>
							<div class="text-right">
								<div>{formatNumber(reading.previous_reading)}</div>
								{#if reading.previous_reading_date}
									<div class="text-xs text-muted-foreground">
										{formatDate(reading.previous_reading_date)}
									</div>
								{/if}
							</div>
						</Table.Cell>
						<Table.Cell class="font-medium">
							<div class="text-right">
								<div class="flex items-center justify-end gap-1">
									<span>{formatNumber(reading.reading)}</span>
									{#if reading.isMonthEnd}
										<span class="text-green-600" title="Reading near end of month">✅</span>
									{:else}
										<span class="text-gray-400" title="Month in progress">⏳</span>
									{/if}
								</div>
								<div class="text-xs text-muted-foreground">{formatDate(reading.reading_date)}</div>
							</div>
						</Table.Cell>
						<Table.Cell>
							{#if reading.days_diff !== null && reading.days_diff !== undefined}
								<div class="text-center">
									<span class="font-medium {getDaysDiffColorClass(reading.days_diff)}"
										>{reading.days_diff}</span
									>
									<div class="text-xs text-muted-foreground">days</div>
								</div>
							{:else}
								<span class="text-muted-foreground">-</span>
							{/if}
						</Table.Cell>
						<Table.Cell>
							{formatNumber(reading.consumption)}
							{#if reading.meters?.type}
								<span class="text-xs text-muted-foreground ml-1">
									{getUnitLabel(reading.meters.type)}
								</span>
							{/if}
						</Table.Cell>
						<Table.Cell>{formatCurrency(reading.rate_at_reading)}</Table.Cell>
						<Table.Cell class="font-medium">{formatCurrency(reading.cost)}</Table.Cell>
						<Table.Cell>
							<Button
								variant="ghost"
								size="sm"
								onclick={(e) => handleShareClick(e as MouseEvent, reading)}
							>
								Bill
							</Button>
						</Table.Cell>
					</Table.Row>
				{/each}
			</Table.Body>
		</Table.Root>
	{/if}
</div>
