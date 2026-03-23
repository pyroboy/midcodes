<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import type { Reading, Meter } from './types';

	interface Props {
		readings?: Reading[];
		meters?: Meter[];
		readingDates?: string[];
	}
	let { readings = [], meters = [], readingDates = [] }: Props = $props();

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-PH', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	// Helper functions to calculate stats
	function getUniquePropertyCount(): number {
		// Map lookup for O(1) access
		const meterMap = new Map<string, Meter>();
		for (const m of meters) meterMap.set(String(m.id), m);

		return new Set(
			readings
				.map((r: Reading) => {
					// Try direct property from joined meter data first
					if ((r as any).meters?.property_id) return (r as any).meters.property_id;
					// Fallback to meters prop lookup with Map
					const meter = meterMap.get(String(r.meter_id));
					return meter?.property_id;
				})
				.filter(Boolean)
		).size;
	}

	function getUniqueMeterCount(): number {
		return new Set(readings.map((r: Reading) => r.meter_id)).size;
	}

	function getLatestReadingDate(): string | null {
		if (readingDates.length === 0) return null;
		return readingDates[0]; // Assuming readingDates is already sorted newest first
	}
</script>

<Card.Root class="mt-8">
	<Card.Header>
		<Card.Title>Summary Statistics</Card.Title>
		<Card.Description>Overview of utility consumption and costs</Card.Description>
	</Card.Header>
	<Card.Content>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			{#if readings.length > 0}
				<div class="bg-blue-50 rounded-lg p-4 border border-blue-100">
					<p class="text-sm text-blue-500 font-medium">Total Readings</p>
					<p class="text-2xl font-bold tabular-nums">{readings.length}</p>
				</div>

				<div class="bg-green-50 rounded-lg p-4 border border-green-100">
					<p class="text-sm text-green-500 font-medium">Properties</p>
					<p class="text-2xl font-bold tabular-nums">{getUniquePropertyCount()}</p>
				</div>

				<div class="bg-amber-50 rounded-lg p-4 border border-amber-100">
					<p class="text-sm text-amber-500 font-medium">Meters</p>
					<p class="text-2xl font-bold tabular-nums">{getUniqueMeterCount()}</p>
				</div>

				<div class="bg-purple-50 rounded-lg p-4 border border-purple-100">
					<p class="text-sm text-purple-500 font-medium">Latest Reading</p>
					<p class="text-2xl font-bold">
						{getLatestReadingDate() ? formatDate(getLatestReadingDate() as string) : 'N/A'}
					</p>
				</div>
			{:else}
				<div class="col-span-4 text-center p-4 bg-muted rounded-lg">
					<p class="text-muted-foreground">No data available for the selected filters</p>
				</div>
			{/if}
		</div>
	</Card.Content>
</Card.Root>
