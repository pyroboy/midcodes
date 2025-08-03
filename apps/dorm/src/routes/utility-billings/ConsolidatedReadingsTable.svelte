<script lang="ts">
	import { ChevronDown } from 'lucide-svelte';
	import { Button } from '$lib/components/ui/button';
	import * as Table from '$lib/components/ui/table';
	import * as Card from '$lib/components/ui/card';
	import type { Reading, Meter, Property, MeterData, Filters } from './types';
	import { slide } from 'svelte/transition';

	// Props using Svelte 5 runes with defaults
	type Props = {
		readings: Reading[];
		meters: Meter[];
		properties: Property[];
		filters: Filters;
		onShareReading: (meter: MeterData) => void;
		meterLastBilledDates?: Record<string, string>;
	};

	let { readings, meters, properties, filters, onShareReading, meterLastBilledDates = {} }: Props = $props();



	// Computed values using Svelte 5 derived.by
	const groupedReadings = $derived.by(() => {
		// First group by date
		const byDate: Record<string, Reading[]> = {};

		const filteredReadings = readings.filter((reading) => {
			const meter = meters.find((m) => m.id === reading.meter_id);
			if (!meter) return false;

			const propertyMatch = filters.property ? meter.property_id === filters.property.id : true;
			const typeMatch = filters.type
				? meter.type && meter.type.toUpperCase() === filters.type.toUpperCase()
				: true;
			const dateMatch = filters.date ? reading.reading_date === filters.date : true;
			const searchMatch = filters.search
				? meter.name.toLowerCase().includes(filters.search.toLowerCase())
				: true;

			return propertyMatch && typeMatch && dateMatch && searchMatch;
		});

		filteredReadings.forEach((reading) => {
			if (!byDate[reading.reading_date]) {
				byDate[reading.reading_date] = [];
			}
			byDate[reading.reading_date].push(reading);
		});

		// Then for each date, group by property
		const result: {
			date: string;
			properties: {
				propertyId: number;
				propertyName: string;
				uniqueMeters: MeterData[];
				totalConsumption: number;
				totalCost: number;
			}[];
			totalConsumption: number;
			totalCost: number;
		}[] = [];

		// Sort dates in descending order (newest first)
		const sortedDates = Object.keys(byDate).sort(
			(a, b) => new Date(b).getTime() - new Date(a).getTime()
		);

		sortedDates.forEach((date) => {
			const readingsForDate = byDate[date];

			// Group by property
			const propertiesMap: Record<
				number,
				{
					propertyId: number;
					propertyName: string;
					meterMap: Record<number, MeterData>;
					totalConsumption: number;
					totalCost: number;
				}
			> = {};

			readingsForDate.forEach((reading) => {
				const meter = meters.find((m) => m.id === reading.meter_id);
				if (!meter || !meter.property_id) return;

				const property = properties.find((p) => p.id === meter.property_id);
				if (!property) return;

				if (!propertiesMap[property.id]) {
					propertiesMap[property.id] = {
						propertyId: property.id,
						propertyName: property.name,
						meterMap: {},
						totalConsumption: 0,
						totalCost: 0
					};
				}

				// Get reading history for this meter
				const meterHistory = readings
					.filter((r) => r.meter_id === meter.id)
					.sort((a, b) => new Date(b.reading_date).getTime() - new Date(a.reading_date).getTime());

				const latestReading = meterHistory[0];
				const secondLatestReading = meterHistory[1];

				// Store in map by meter ID to ensure uniqueness
				propertiesMap[property.id].meterMap[meter.id] = {
					meterId: meter.id,
					meterName: meter.name,
					meterType: meter.type || 'UNKNOWN',
					unit: meter.unit?.name || '',
					currentReading: latestReading?.reading || 0,
					currentReadingDate: latestReading?.reading_date || null,
					lastReading: secondLatestReading?.reading || null,
					lastReadingDate: secondLatestReading?.reading_date || null,
					consumption: latestReading?.consumption || null,
					costPerUnit: latestReading?.cost_per_unit || null,
					totalCost: latestReading?.cost || null,
					history: meterHistory
				};

				// Add to property totals
				propertiesMap[property.id].totalConsumption += reading.consumption || 0;
				propertiesMap[property.id].totalCost += reading.cost || 0;
			});

			// Calculate date totals
			let dateTotalConsumption = 0;
			let dateTotalCost = 0;

			// Convert meterMap to array for each property
			const propertiesWithUniqueMeters = Object.values(propertiesMap).map((prop) => {
				dateTotalConsumption += prop.totalConsumption;
				dateTotalCost += prop.totalCost;

				return {
					propertyId: prop.propertyId,
					propertyName: prop.propertyName,
					uniqueMeters: Object.values(prop.meterMap),
					totalConsumption: prop.totalConsumption,
					totalCost: prop.totalCost
				};
			});

			// Add to result
			result.push({
				date,
				properties: propertiesWithUniqueMeters,
				totalConsumption: dateTotalConsumption,
				totalCost: dateTotalCost
			});
		});

		return result;
	});

	// Handle share button click
	function handleShareClick(event: MouseEvent, meter: MeterData) {
		event.stopPropagation();
		if (onShareReading) {
			onShareReading(meter);
		}
	}


	function handleRowKeyDown(event: KeyboardEvent, meter: MeterData) {
		if (event.key === 'Enter' || event.key === ' ') {
			event.preventDefault();
			onShareReading(meter);
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
</script>
{#if groupedReadings.length === 0}
	<div class="bg-gray-50 rounded-md p-6 text-center">
		<p class="text-gray-500">No readings found with the current filters.</p>
	</div>
{:else}
	{#each groupedReadings as dateGroup, i}
		{@const previousDate = groupedReadings[i + 1]?.date}
		<div class="mb-8">
			<h3 class="text-lg font-semibold mb-2">
				Readings for {previousDate ? `${formatDate(previousDate)} to ` : ''}{formatDate(dateGroup.date)}
			</h3>

			{#each dateGroup.properties as propertyGroup}
				<Card.Root class="mb-4">
				
						<div class="rounded-md border">
							<!-- Header Row -->
							<div class="flex p-2 bg-gray-50 font-medium text-sm border-b">
								<div class="flex-1 pl-10">Meter</div>
								<div class="w-24 text-right">Previous</div>
								<div class="w-24 text-right">Current</div>
								<div class="w-32 text-right">Consumption</div>
								<div class="w-24 text-right">Total Cost</div>
								<div class="w-20 text-right pr-2"></div>
							</div>

							{#each propertyGroup.uniqueMeters as meter (meter.meterId)}
								<div class="border-b last:border-b-0">
									<div
										class="flex items-center p-2 hover:bg-muted/50 transition-colors duration-200"
										role="button"
										tabindex="0"
										onclick={(e) => handleShareClick(e, meter)}
										onkeydown={(e) => handleRowKeyDown(e, meter)}
									>
										<div class="flex flex-1 items-center pl-6">
											<div class="flex-1 font-medium">
													<div class="flex items-center gap-2">
														<span>{meter.meterName}</span>

													</div>
													<div class="text-xs text-muted-foreground">
														{#if meter.unit}
															<span>{meter.unit}</span>
														{/if}
														{#if meterLastBilledDates && meterLastBilledDates[meter.meterId]}
															<span class="ml-2 pl-2 border-l border-border">
																Last Billed: {formatDate(meterLastBilledDates[meter.meterId])}
															</span>
														{/if}
													</div>
												</div>
											<div class="w-24 text-right">{formatNumber(meter.lastReading)}</div>
											<div class="w-24 text-right font-medium">{formatNumber(meter.currentReading)}</div>
											<div class="w-32 text-right">
												{formatNumber(meter.consumption)}
												<span class="text-xs text-muted-foreground ml-1">{getUnitLabel(meter.meterType)}</span>
											</div>
											<div class="w-24 text-right font-medium">{formatCurrency(meter.totalCost)}</div>
										</div>
										<div class="w-20 flex items-center justify-center">
											<Button size="sm" variant="outline" onclick={(e) => {e.stopPropagation(); onShareReading(meter);}}>
												Bill
											</Button>
										</div>
									</div>
								</div>
							{/each}

		
						</div>
				</Card.Root>
			{/each}
		</div>
	{/each}
{/if}