<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import type { Reading, Meter, Property, MeterData, Filters } from './types';
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
	}>();

	// State
	let filters = $state({
		period: new Date().toISOString().slice(0, 7),
		search: ''
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

	// Handle share button click
	function handleShareClick(event: MouseEvent, reading: Reading) {
		event.stopPropagation();
		if (props.onShareReading && reading.meters) {
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
				history: [reading]
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
	</div>

	<!-- Table -->
	{#if filteredReadings.length === 0}
		<div class="bg-gray-50 rounded-md p-6 text-center">
			<p class="text-gray-500">No readings found with the current filters.</p>
		</div>
	{:else}
		<Table.Root>
			<Table.Header>
				<Table.Row>
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
								<div>{formatNumber(reading.reading)}</div>
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
								onclick={() => handleShareClick(event as any, reading)}
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
