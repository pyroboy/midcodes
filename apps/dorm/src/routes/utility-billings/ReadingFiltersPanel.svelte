<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import { Label } from '$lib/components/ui/label';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { Select, SelectContent, SelectItem, SelectTrigger } from '$lib/components/ui/select';
	import * as Card from '$lib/components/ui/card';
	import type { Property, FilterChangeEvent } from './types';

	type Props = {
		availableReadingDates: string[];
		utilityTypes: Record<string, string>;
		selectedProperty: Property | null;
		addReadings: () => void;
		filters: {
			type: string | null;
			date: string;
			searchQuery: string;
		};
	};

	let {
		availableReadingDates,
		utilityTypes,
		selectedProperty,
		addReadings,
		filters = $bindable()
	}: Props = $props();

	// Format date for display
	function formatDate(dateString: string): string {
		return new Date(dateString).toLocaleDateString('en-PH', {
			year: 'numeric',
			month: 'short',
			day: 'numeric'
		});
	}

	function resetFilters(): void {
		filters.type = null;
		filters.date = '';
		filters.searchQuery = '';
	}
</script>

<Card.Root class="mb-6">
	<Card.Header class="pb-2">
		<div class="flex items-center justify-between">
			<div>
				<Card.Title class="text-lg">Filter Readings</Card.Title>
				<Card.Description>Select criteria to filter the readings table</Card.Description>
			</div>
			<div class="flex items-center gap-2">
				<Button
					class="flex items-center gap-2"
					size="sm"
					disabled={!selectedProperty || !filters.type}
					onclick={() => addReadings()}
				>
					{#if !selectedProperty}
						Select a property to continue
					{:else if !filters.type}
						Select a utility type
					{:else}
						Add Meter Readings
					{/if}
				</Button>
				<Button variant="ghost" onclick={resetFilters}>Reset</Button>
			</div>
		</div>
	</Card.Header>
	<Card.Content>
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
			<!-- Property filter -->
			<div class="space-y-2">
				<Label for="property-filter" class="text-sm font-medium">Property</Label>
				<Input
					id="property-filter"
					type="text"
					readonly
					value={selectedProperty ? selectedProperty.name : 'No property selected'}
					class="w-full bg-gray-100 cursor-not-allowed"
				/>
			</div>

			<!-- Utility Type filter -->
			<div class="space-y-2">
				<Label for="type-filter" class="text-sm font-medium">Utility Type</Label>
				<Select
					type="single"
					onValueChange={(v) => (filters.type = v === '' ? null : v)}
					value={filters.type || ''}
				>
					<SelectTrigger class="w-full">
						<span>{filters.type || 'All Types'}</span>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">All Types</SelectItem>
						{#each Object.entries(utilityTypes) as [key, value]}
							<SelectItem {value}>{value}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>

			<!-- Reading Date filter -->
			<div class="space-y-2">
				<Label for="date-filter" class="text-sm font-medium">Reading Date</Label>
				<Select type="single" onValueChange={(v) => (filters.date = v)} value={filters.date || ''}>
					<SelectTrigger class="w-full">
						<span>{filters.date ? formatDate(filters.date) : 'All Dates'}</span>
					</SelectTrigger>
					<SelectContent>
						<SelectItem value="">All Dates</SelectItem>
						{#each availableReadingDates as date}
							<SelectItem value={date}>{formatDate(date)}</SelectItem>
						{/each}
					</SelectContent>
				</Select>
			</div>

			<!-- Search filter -->
			<div class="space-y-2">
				<Label for="search" class="text-sm font-medium">Search Meters</Label>
				<Input
					id="search"
					type="search"
					placeholder="Search by meter ID or unit..."
					bind:value={filters.searchQuery}
				/>
			</div>
		</div>
	</Card.Content>
</Card.Root>
