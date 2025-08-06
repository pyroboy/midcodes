<script lang="ts">
	import * as Dialog from '$lib/components/ui/dialog';
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Badge } from '$lib/components/ui/badge';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import { BarChart, LineChart, TrendingUp, Calendar, Zap, Droplets, Flame, Wifi, Tv } from 'lucide-svelte';
	import type { Reading, Meter, Property } from './types';

	type Props = {
		open: boolean;
		readings: Reading[];
		meters: Meter[];
		properties: Property[];
		close: () => void;
	};

	let { open = $bindable(), readings, meters, properties, close }: Props = $props();

	// State for graph controls
	let selectedProperty = $state<number | null>(null);
	let selectedMeter = $state<number | null>(null);
	let selectedMeters = $state<number[]>([]);
	let selectedUtilityType = $state<string | null>(null);
	let graphType = $state<'consumption' | 'days' | 'cost'>('consumption');
	let viewMode = $state<'single' | 'mixed'>('single');

	// Get unique utility types from meters
	const utilityTypes = $derived.by(() => {
		return [...new Set(meters.map(m => m.type))].sort();
	});

	// Get meters for selected property
	const propertyMeters = $derived.by(() => {
		if (!selectedProperty) return meters;
		return meters.filter(m => m.property_id === selectedProperty);
	});

	// Filter readings based on selections
	const filteredReadings = $derived.by(() => {
		let filtered = readings;

		if (selectedProperty) {
			const propertyMeterIds = propertyMeters.map(m => m.id);
			filtered = filtered.filter(r => propertyMeterIds.includes(r.meter_id));
		}

		if (viewMode === 'single' && selectedMeter) {
			filtered = filtered.filter(r => r.meter_id === selectedMeter);
		} else if (viewMode === 'mixed' && selectedMeters.length > 0) {
			filtered = filtered.filter(r => selectedMeters.includes(r.meter_id));
		}

		if (selectedUtilityType) {
			const meterIds = meters.filter(m => m.type === selectedUtilityType).map(m => m.id);
			filtered = filtered.filter(r => meterIds.includes(r.meter_id));
		}

		return filtered;
	});

	// Group readings by month for the graph
	const monthlyData = $derived.by(() => {
		const grouped = filteredReadings.reduce((acc, reading) => {
			const monthKey = reading.reading_date.slice(0, 7); // "2025-06"
			if (!acc[monthKey]) {
				acc[monthKey] = {
					month: monthKey,
					monthName: new Date(reading.reading_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
					readings: [],
					totalConsumption: 0,
					totalCost: 0,
					averageDays: 0,
					readingCount: 0
				};
			}
			acc[monthKey].readings.push(reading);
			acc[monthKey].totalConsumption += reading.consumption || 0;
			acc[monthKey].totalCost += reading.cost || 0;
			acc[monthKey].readingCount += 1;
			return acc;
		}, {} as Record<string, any>);

		// Calculate average days for each month
		Object.values(grouped).forEach((monthData: any) => {
			const validDays = monthData.readings
				.filter((r: Reading) => r.days_diff !== null && r.days_diff !== undefined)
				.map((r: Reading) => r.days_diff);
			
			monthData.averageDays = validDays.length > 0 
				? Math.round(validDays.reduce((sum: number, days: number) => sum + days, 0) / validDays.length)
				: 0;
		});

		return Object.values(grouped).sort((a, b) => a.month.localeCompare(b.month));
	});

	// Get mixed meter data for line graph
	const mixedMeterData = $derived.by(() => {
		if (viewMode !== 'mixed' || !selectedProperty || selectedMeters.length === 0) return [];
		
		const meterReadings = filteredReadings.filter(r => selectedMeters.includes(r.meter_id));
		
		console.log('Mixed meter data calculation:', {
			viewMode,
			selectedProperty,
			selectedMeters,
			meterReadingsCount: meterReadings.length
		});
		
		// Group by meter and month
		const meterGroups = meterReadings.reduce((acc, reading) => {
			const meterId = reading.meter_id;
			const monthKey = reading.reading_date.slice(0, 7);
			
			if (!acc[meterId]) {
				acc[meterId] = {};
			}
			if (!acc[meterId][monthKey]) {
				acc[meterId][monthKey] = {
					month: monthKey,
					monthName: new Date(reading.reading_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
					value: 0
				};
			}
			
			acc[meterId][monthKey].value += graphType === 'consumption' ? (reading.consumption || 0) :
										   graphType === 'days' ? (reading.days_diff || 0) :
										   (reading.cost || 0);
			return acc;
		}, {} as Record<number, Record<string, any>>);
		
		// Convert to array format for line graph
		const result = Object.entries(meterGroups).map(([meterId, months]) => {
			const meter = meters.find(m => m.id === Number(meterId));
			const sortedData = Object.values(months).sort((a, b) => a.month.localeCompare(b.month));
			
			console.log(`Meter ${meterId} data:`, {
				meterName: meter?.name,
				dataPoints: sortedData.length,
				values: sortedData.map(d => d.value)
			});
			
			return {
				meterId: Number(meterId),
				meterName: meter?.name || `Meter ${meterId}`,
				color: getMeterColor(Number(meterId)),
				data: sortedData
			};
		});
		
		console.log('Final mixed meter data:', result.length, 'meters');
		return result;
	});

	// Get graph data based on selected type
	const graphData = $derived.by(() => {
		return monthlyData.map(month => ({
           
			month: month.monthName,
			value: graphType === 'consumption' ? month.totalConsumption :
				   graphType === 'days' ? month.averageDays :
				   month.totalCost,
			label: graphType === 'consumption' ? 'Total Consumption' :
				   graphType === 'days' ? 'Avg Days Gap' :
				   'Total Cost'
		}));
	});

	// Get dynamic title based on selections
	const graphTitle = $derived.by(() => {
		let title = '';
		
		if (selectedProperty) {
			const property = properties.find(p => p.id === selectedProperty);
			title += property?.name || 'Unknown Property';
		} else {
			title += 'All Properties';
		}
		
		if (selectedMeter) {
			const meter = meters.find(m => m.id === selectedMeter);
			title += ` - ${meter?.name || 'Unknown Meter'}`;
		} else if (viewMode === 'mixed' && selectedProperty) {
			title += ' - All Meters';
		}
		
		title += ` - ${graphType === 'consumption' ? 'Consumption' : graphType === 'days' ? 'Days Gap' : 'Cost'}`;
		
		return title;
	});

	// Get utility icon
	function getUtilityIcon(type: string) {
		switch (type.toUpperCase()) {
			case 'ELECTRICITY':
				return Zap;
			case 'WATER':
				return Droplets;
			case 'GAS':
				return Flame;
			case 'INTERNET':
				return Wifi;
			case 'CABLE':
				return Tv;
			default:
				return TrendingUp;
		}
	}

	// Format currency
	function formatCurrency(amount: number): string {
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 2,
			maximumFractionDigits: 2
		}).format(amount);
	}

	// Format number with appropriate decimal places
	function formatNumber(value: number): string {
		if (value === Math.floor(value)) {
			return value.toString();
		}
		return value.toFixed(2);
	}

	// Get color for graph bars
	function getBarColor(index: number): string {
		const colors = [
			'bg-blue-500',
			'bg-green-500', 
			'bg-yellow-500',
			'bg-red-500',
			'bg-purple-500',
			'bg-indigo-500',
			'bg-pink-500',
			'bg-orange-500',
			'bg-teal-500',
			'bg-cyan-500',
			'bg-lime-500',
			'bg-emerald-500'
		];
		return colors[index % colors.length];
	}

	// Get color for meter lines
	function getMeterColor(meterId: number): string {
		const colors = [
			'#3b82f6', // blue
			'#10b981', // green
			'#f59e0b', // yellow
			'#ef4444', // red
			'#8b5cf6', // purple
			'#6366f1', // indigo
			'#ec4899', // pink
			'#f97316', // orange
			'#14b8a6', // teal
			'#06b6d4', // cyan
			'#84cc16', // lime
			'#059669'  // emerald
		];
		return colors[meterId % colors.length];
	}

	// Get max value for scaling
	const maxValue = $derived.by(() => {
		if (viewMode === 'mixed' && mixedMeterData.length > 0) {
			// For mixed meters, get max value from all meter data
			const allValues = mixedMeterData.flatMap(meter => meter.data.map(point => point.value));
			return allValues.length > 0 ? Math.max(...allValues) : 1;
		} else if (graphData.length === 0) {
			return 1;
		} else {
			return Math.max(...graphData.map(d => d.value));
		}
	});

	// Reset filters
	function resetFilters() {
		selectedProperty = null;
		selectedMeter = null;
		selectedMeters = [];
		selectedUtilityType = null;
		graphType = 'consumption';
		viewMode = 'single';
	}
</script>

<Dialog.Root bind:open onOpenChange={(isOpen) => !isOpen && close()}>
	<Dialog.Content class="sm:max-w-[900px] max-h-[90vh] overflow-y-auto">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<BarChart class="h-5 w-5" />
				Billing Periods Analysis
			</Dialog.Title>
			<Dialog.Description>
				Visualize billing periods, consumption trends, and days gap throughout the year.
			</Dialog.Description>
		</Dialog.Header>

		<div class="space-y-6">
			<!-- Filters -->
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">Filters</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
						<!-- Property Filter -->
						<div class="space-y-2">
							<label for="property-select" class="text-sm font-medium">Property</label>
							<Select type="single" value={selectedProperty?.toString() || undefined} onValueChange={(value) => {
								selectedProperty = value ? Number(value) : null;
								selectedMeter = null; // Reset meter when property changes
								selectedMeters = []; // Reset selected meters when property changes
							}}>
								<SelectTrigger id="property-select">
									<span>{selectedProperty ? properties.find(p => p.id === selectedProperty)?.name : 'All Properties'}</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Properties</SelectItem>
									{#each properties as property}
										<SelectItem value={property.id.toString()}>{property.name}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>

						<!-- Meter Filter -->
						<div class="space-y-2">
							<label for="meter-select" class="text-sm font-medium">
								{viewMode === 'mixed' ? 'Meters (Multi-select)' : 'Meter'}
							</label>
							{#if viewMode === 'mixed'}
								<!-- Multi-select for mixed mode -->
								<Select type="multiple" value={selectedMeters.map(id => id.toString())} onValueChange={(values) => {
									selectedMeters = values.map(v => Number(v));
								}}>
									<SelectTrigger id="meter-select">
										<span>
											{selectedMeters.length === 0 
												? 'Select meters...' 
												: selectedMeters.length === 1
												? propertyMeters.find(m => m.id === selectedMeters[0])?.name
												: `${selectedMeters.length} meters selected`}
										</span>
									</SelectTrigger>
									<SelectContent>
										{#each propertyMeters as meter}
											<SelectItem value={meter.id.toString()}>{meter.name}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							{:else}
								<!-- Single select for single mode -->
								<Select type="single" value={selectedMeter?.toString() || undefined} onValueChange={(value) => {
									selectedMeter = value ? Number(value) : null;
								}}>
									<SelectTrigger id="meter-select">
										<span>{selectedMeter ? propertyMeters.find(m => m.id === selectedMeter)?.name : 'All Meters'}</span>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="">All Meters</SelectItem>
										{#each propertyMeters as meter}
											<SelectItem value={meter.id.toString()}>{meter.name}</SelectItem>
										{/each}
									</SelectContent>
								</Select>
							{/if}
						</div>

						<!-- Utility Type Filter -->
						<div class="space-y-2">
							<label for="utility-type-select" class="text-sm font-medium">Utility Type</label>
							<Select type="single" value={selectedUtilityType || undefined} onValueChange={(value) => {
								selectedUtilityType = value;
							}}>
								<SelectTrigger id="utility-type-select">
									<span>{selectedUtilityType || 'All Types'}</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="">All Types</SelectItem>
									{#each utilityTypes as type}
										<SelectItem value={type}>{type}</SelectItem>
									{/each}
								</SelectContent>
							</Select>
						</div>

						<!-- Graph Type Filter -->
						<div class="space-y-2">
							<label for="graph-type-select" class="text-sm font-medium">Graph Type</label>
							<Select type="single" value={graphType} onValueChange={(value) => {
								graphType = value as 'consumption' | 'days' | 'cost';
							}}>
								<SelectTrigger id="graph-type-select">
									<span>{graphType === 'consumption' ? 'Consumption' : graphType === 'days' ? 'Days Gap' : 'Cost'}</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="consumption">Consumption</SelectItem>
									<SelectItem value="days">Days Gap</SelectItem>
									<SelectItem value="cost">Cost</SelectItem>
								</SelectContent>
							</Select>
						</div>

						<!-- View Mode Filter -->
						<div class="space-y-2">
							<label for="view-mode-select" class="text-sm font-medium">View Mode</label>
							<Select type="single" value={viewMode} onValueChange={(value) => {
								viewMode = value as 'single' | 'mixed';
							}}>
								<SelectTrigger id="view-mode-select">
									<span>{viewMode === 'single' ? 'Single Meter' : 'Mixed Meters'}</span>
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="single">Single Meter</SelectItem>
									<SelectItem value="mixed">Mixed Meters</SelectItem>
								</SelectContent>
							</Select>
						</div>
					</div>

					<div class="flex justify-end mt-4">
						<Button variant="outline" size="sm" onclick={resetFilters}>
							Reset Filters
						</Button>
					</div>
				</CardContent>
			</Card>

			<!-- Graph -->
			<Card>
				<CardHeader>
					<CardTitle class="flex items-center gap-2">
						{graphTitle}
					</CardTitle>
				</CardHeader>
				<CardContent>
					{@const debugInfo = { viewMode, mixedMeterDataLength: mixedMeterData.length, selectedProperty, selectedMeters, propertyMetersLength: propertyMeters.length }}
					{@const showMixedGraph = viewMode === 'mixed' && mixedMeterData.length > 0}
					{console.log('Graph rendering debug:', debugInfo, 'showMixedGraph:', showMixedGraph)}
					{console.log('Mixed meter data for rendering:', mixedMeterData)}
					{console.log('Max value for scaling:', maxValue)}
					{#if showMixedGraph}
						<!-- Mixed Meters Line Chart -->
						<div class="space-y-4">
							<div class="h-64 relative">
								<!-- Y-axis labels -->
								<div class="absolute left-0 top-0 bottom-0 w-16 flex flex-col justify-between text-xs text-muted-foreground">
									{#each Array.from({length: 5}, (_, i) => i) as i}
										<div class="text-right pr-2">
											{graphType === 'cost' ? formatCurrency(maxValue * (4 - i) / 4) : formatNumber(maxValue * (4 - i) / 4)}
										</div>
									{/each}
								</div>
								
								<!-- Chart area -->
								<div class="ml-16 h-full relative">
									<!-- Grid lines -->
									{#each Array.from({length: 5}, (_, i) => i) as i}
										<div 
											class="absolute w-full border-t border-gray-200"
											style="top: {i * 25}%;"
										></div>
									{/each}
									
									<!-- Single SVG for all chart elements -->
									<svg 
										class="absolute inset-0 w-full h-full" 
										style="pointer-events: none;"
										viewBox="0 0 3 1" 
										preserveAspectRatio="none"
									>
										<!-- Line charts for each meter -->
										{#each mixedMeterData as meter}
											{@const pathData = meter.data.length > 1 ? meter.data.map((point, index) => {
												const x = (index / (meter.data.length - 1)) * 2.4 + 0.3; // 10% margin on each side (0.3 to 2.7)
												const y = 0.1 + (point.value / maxValue) * 0.8; // 10% margin top/bottom
												return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
											}).join(' ') : ''}
											
											{#if meter.data.length > 1}
												<path
													d={pathData}
													stroke={meter.color}
													stroke-width="0.015"
													fill="none"
												/>
											{/if}
											<!-- {#each meter.data as point, index}
												<circle
													cx="{(index / (meter.data.length - 1)) * 2.4 + 0.3}"
													cy="{0.1 + (point.value / maxValue) * 0.8}"
													r="0.02"
													fill={meter.color}
													stroke="white"
													stroke-width="0.01"
												/>
											{/each} -->
										{/each}
									</svg>
									
									<!-- X-axis labels -->
									{#if mixedMeterData.length > 0 && mixedMeterData[0].data.length > 0}
										{#each mixedMeterData[0].data as point, index}
											<div 
												class="absolute bottom-0 text-xs text-muted-foreground text-center transform -translate-x-1/2"
												style="left: {((index / (mixedMeterData[0].data.length - 1)) * 2.4 + 0.3) / 3 * 100}%;"
											>
												{point.monthName.split(' ')[0]}
											</div>
										{/each}
									{/if}
								</div>
							</div>
							
							<!-- Legend -->
							<div class="flex flex-wrap gap-4 justify-center">
								{#each mixedMeterData as meter}
									<div class="flex items-center gap-2">
										<div class="w-3 h-3 rounded-full" style="background-color: {meter.color}"></div>
										<span class="text-sm">{meter.meterName}</span>
									</div>
								{/each}
							</div>
						</div>
					{:else if viewMode === 'mixed' && mixedMeterData.length === 0}
						<div class="text-center py-8 text-muted-foreground">
							<LineChart class="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>No meter data available for mixed view. Please select a property and choose meters to compare.</p>
						</div>
					{:else if graphData.length === 0}
						<div class="text-center py-8 text-muted-foreground">
							<BarChart class="h-12 w-12 mx-auto mb-4 opacity-50" />
							<p>No data available for the selected filters</p>
						</div>
					{:else}
						<!-- Bar Chart -->
						<div class="space-y-4">
							<div class="flex items-end justify-between h-64 gap-2">
								{#each graphData as monthData, index}
									<div class="flex-1 flex flex-col items-center">
										<!-- Bar -->
										<div 
											class="w-full min-w-[40px] rounded-t transition-all duration-300 hover:opacity-80 cursor-pointer"
											class:bg-blue-500={graphType === 'consumption'}
											class:bg-green-500={graphType === 'days'}
											class:bg-purple-500={graphType === 'cost'}
											style="height: {maxValue > 0 ? (monthData.value / maxValue) * 200 : 0}px;"
											title="{monthData.month}: {formatNumber(monthData.value)} {graphType === 'consumption' ? 'units' : graphType === 'days' ? 'days' : 'PHP'}"
										></div>
										
										<!-- Value Label -->
										<div class="text-xs text-center mt-2 font-medium">
											{graphType === 'cost' ? formatCurrency(monthData.value) : formatNumber(monthData.value)}
										</div>
										
										<!-- Month Label -->
										<div class="text-xs text-center mt-1 text-muted-foreground">
											{monthData.month.split(' ')[0]}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Summary Statistics -->
			{#if monthlyData.length > 0}
				<Card>
					<CardHeader>
						<CardTitle>Summary Statistics</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
							<div class="text-center p-4 bg-blue-50 rounded-lg">
								<p class="text-sm text-blue-600 font-medium">Total Periods</p>
								<p class="text-2xl font-bold text-blue-700">{monthlyData.length}</p>
							</div>
							
							<div class="text-center p-4 bg-green-50 rounded-lg">
								<p class="text-sm text-green-600 font-medium">Avg Consumption</p>
								<p class="text-2xl font-bold text-green-700">
									{formatNumber(monthlyData.reduce((sum, m) => sum + m.totalConsumption, 0) / monthlyData.length)}
								</p>
							</div>
							
							<div class="text-center p-4 bg-purple-50 rounded-lg">
								<p class="text-sm text-purple-600 font-medium">Avg Days Gap</p>
								<p class="text-2xl font-bold text-purple-700">
									{formatNumber(monthlyData.reduce((sum, m) => sum + m.averageDays, 0) / monthlyData.length)}
								</p>
							</div>
						</div>
					</CardContent>
				</Card>
			{/if}

			<!-- Detailed Data Table -->
			{#if monthlyData.length > 0}
				<Card>
					<CardHeader>
						<CardTitle>Monthly Breakdown</CardTitle>
					</CardHeader>
					<CardContent>
						<div class="overflow-x-auto">
							<table class="w-full text-sm">
								<thead>
									<tr class="border-b">
										<th class="text-left p-2">Month</th>
										<th class="text-right p-2">Total Consumption</th>
										<th class="text-right p-2">Total Cost</th>
										<th class="text-right p-2">Avg Days Gap</th>
									</tr>
								</thead>
								<tbody>
									{#each monthlyData as month}
										<tr class="border-b hover:bg-gray-50">
											<td class="p-2 font-medium">{month.monthName}</td>
											<td class="p-2 text-right">{formatNumber(month.totalConsumption)}</td>
											<td class="p-2 text-right">{formatCurrency(month.totalCost)}</td>
											<td class="p-2 text-right">{month.averageDays} days</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>
			{/if}
		</div>

		<Dialog.Footer>
			<Button variant="outline" onclick={close}>Close</Button>
		</Dialog.Footer>
	</Dialog.Content>
</Dialog.Root> 