<script lang="ts">
	import { page } from '$app/stores';
	import { onMount } from 'svelte';
	import { format } from 'date-fns';
	import { bookingsStore } from '$lib/stores/bookings.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { formatPeso } from '$lib/utils';
	import type { Venue, Slot } from '$lib/types';

	let venue = $state<Venue | null>(null);
	let slots = $state<Slot[]>([]);
	let selectedDate = $state(format(new Date(), 'yyyy-MM-dd'));
	let isLoading = $state(true);
	let error = $state('');

	onMount(async () => {
		try {
			const venueRes = await fetch(`/api/venues/${$page.params.id}`);
			if (!venueRes.ok) throw new Error('Venue not found');
			venue = await venueRes.json();
			await loadSlots();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load venue';
		} finally {
			isLoading = false;
		}
	});

	async function loadSlots() {
		try {
			const slotsRes = await fetch(`/api/slots?venueId=${$page.params.id}&date=${selectedDate}`);
			if (slotsRes.ok) {
				slots = await slotsRes.json();
			}
		} catch (e) {
			console.error('Failed to load slots:', e);
		}
	}

	async function bookSlot(slotId: string, price: number) {
		if (!authStore.user) return;
		try {
			await bookingsStore.createBooking({
				playerId: authStore.user.id,
				slotId,
				venueId: $page.params.id,
				status: 'confirmed',
				totalPhp: price,
				bookedVia: 'direct'
			});
		} catch (e) {
			alert(e instanceof Error ? e.message : 'Failed to create booking');
		}
	}
</script>

<svelte:head>
	<title>{venue?.name ?? 'Venue'} - Court Sniper</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-5xl">
	{#if isLoading}
		<div class="flex items-center justify-center py-16">
			<div class="text-sm text-muted-foreground">Loading venue...</div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
	{:else if venue}
		<div class="mb-8">
			<a href="/" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
				<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
				Back
			</a>
			<h1 class="text-2xl font-bold tracking-tight">{venue.name}</h1>
			<p class="mt-1 text-sm text-muted-foreground">{venue.address}</p>
		</div>

		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			<div class="rounded-xl border border-border bg-background p-4">
				<p class="text-xs text-muted-foreground mb-1">Courts</p>
				<p class="text-lg font-semibold">{venue.courtCount}</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-4">
				<p class="text-xs text-muted-foreground mb-1">Type</p>
				<p class="text-lg font-semibold capitalize">{venue.courtType}</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-4">
				<p class="text-xs text-muted-foreground mb-1">Surface</p>
				<p class="text-lg font-semibold capitalize">{venue.surfaceType}</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-4">
				<p class="text-xs text-muted-foreground mb-1">Rating</p>
				<p class="text-lg font-semibold">{venue.ratingAvg?.toFixed(1) ?? 'N/A'}</p>
			</div>
		</div>

		{#if venue.description}
			<p class="text-sm text-muted-foreground mb-8">{venue.description}</p>
		{/if}

		<div class="mb-6 flex items-end gap-4">
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
		</div>

		<div>
			<h2 class="text-lg font-semibold mb-4">Available Slots</h2>
			{#if slots.length === 0}
				<div class="rounded-xl border border-dashed border-border bg-background p-8 text-center">
					<p class="text-sm text-muted-foreground">No available slots for this date.</p>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
					{#each slots as slot (slot.id)}
						<div class="rounded-xl border border-border bg-background p-4 {slot.status !== 'available' ? 'opacity-50' : ''}">
							<p class="text-sm font-semibold mb-1">{slot.startTime} - {slot.endTime}</p>
							<p class="text-xs text-muted-foreground mb-3">Court: {slot.courtId.slice(0, 8)}</p>
							{#if slot.status === 'available'}
								<div class="flex items-center justify-between">
									<span class="text-sm font-bold">{formatPeso(slot.pricePhp)}</span>
									<button
										onclick={() => bookSlot(slot.id, slot.pricePhp ?? 0)}
										class="rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
									>
										Book
									</button>
								</div>
							{:else}
								<span class="text-xs font-medium capitalize text-muted-foreground">{slot.status}</span>
							{/if}
						</div>
					{/each}
				</div>
			{/if}
		</div>
	{/if}
</div>
