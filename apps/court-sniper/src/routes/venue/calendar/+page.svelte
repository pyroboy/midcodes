<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { format } from 'date-fns';
	import { formatPeso } from '$lib/utils';
	import type { Venue, Slot } from '$lib/types';

	let venue = $state<Venue | null>(null);
	let slots = $state<Slot[]>([]);
	let selectedDate = $state(format(new Date(), 'yyyy-MM-dd'));
	let isLoading = $state(true);
	let error = $state('');
	let showAddSlot = $state(false);
	let newSlotTime = $state('');
	let newSlotPrice = $state('');

	onMount(async () => {
		try {
			if (!authStore.user) throw new Error('Not authenticated');
			const venueRes = await fetch(`/api/venues?ownerId=${authStore.user.id}`);
			if (!venueRes.ok) throw new Error('Failed to load venue');
			const venues = await venueRes.json();
			if (venues.length === 0) throw new Error('No venue found');
			venue = venues[0];
			await loadSlots();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load calendar';
		} finally {
			isLoading = false;
		}
	});

	async function loadSlots() {
		if (!venue) return;
		try {
			const slotsRes = await fetch(`/api/slots?venueId=${venue.id}&date=${selectedDate}`);
			if (slotsRes.ok) slots = await slotsRes.json();
		} catch (e) {
			console.error('Failed to load slots:', e);
		}
	}

	function statusColor(status: string): string {
		switch (status) {
			case 'available': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
			case 'booked': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
			case 'blocked': return 'bg-gray-50 text-gray-600 ring-gray-500/20';
			default: return 'bg-gray-50 text-gray-700 ring-gray-600/20';
		}
	}
</script>

<svelte:head>
	<title>Calendar - Court Sniper</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-5xl">
	<h1 class="text-2xl font-bold tracking-tight mb-8">Availability Calendar</h1>

	{#if isLoading}
		<div class="flex items-center justify-center py-16">
			<div class="text-sm text-muted-foreground">Loading calendar...</div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
	{:else if venue}
		<div class="mb-6 flex items-end gap-3">
			<div>
				<label for="selectedDate" class="block text-sm font-medium mb-1.5">Date</label>
				<input
					id="selectedDate"
					type="date"
					bind:value={selectedDate}
					onchange={loadSlots}
					class="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
				/>
			</div>
			<button
				onclick={() => (showAddSlot = !showAddSlot)}
				class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
			>
				{showAddSlot ? 'Cancel' : 'Add Slot'}
			</button>
		</div>

		{#if showAddSlot}
			<div class="rounded-xl border border-border bg-background p-6 mb-6 space-y-4">
				<h3 class="text-sm font-semibold">Add New Slot</h3>
				<div class="grid grid-cols-2 gap-4">
					<div>
						<label for="newSlotTime" class="block text-sm font-medium mb-1.5">Time</label>
						<input
							id="newSlotTime"
							type="time"
							bind:value={newSlotTime}
							class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
					<div>
						<label for="newSlotPrice" class="block text-sm font-medium mb-1.5">Price (PHP)</label>
						<input
							id="newSlotPrice"
							type="number"
							bind:value={newSlotPrice}
							step="50"
							min="0"
							class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
						/>
					</div>
				</div>
				<button class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
					Save Slot
				</button>
			</div>
		{/if}

		<h2 class="text-lg font-semibold mb-4">Slots for {selectedDate}</h2>
		{#if slots.length === 0}
			<div class="rounded-xl border border-dashed border-border bg-background p-8 text-center">
				<p class="text-sm text-muted-foreground">No slots for this date.</p>
			</div>
		{:else}
			<div class="space-y-2">
				{#each slots as slot (slot.id)}
					<div class="rounded-xl border border-border bg-background p-4 flex items-center justify-between">
						<div>
							<p class="text-sm font-semibold">{slot.startTime} - {slot.endTime}</p>
							<p class="text-xs text-muted-foreground">{formatPeso(slot.pricePhp)}</p>
						</div>
						<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset {statusColor(slot.status)}">
							{slot.status}
						</span>
					</div>
				{/each}
			</div>
		{/if}
	{/if}
</div>
