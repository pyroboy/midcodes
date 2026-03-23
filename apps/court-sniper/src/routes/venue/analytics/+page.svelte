<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { formatPeso } from '$lib/utils';
	import type { Venue } from '$lib/types';

	let venue = $state<Venue | null>(null);
	let analytics = $state({
		bookingsPerDay: [] as number[],
		revenuePerDay: [] as number[],
		topHours: [] as number[],
		playerRetention: 0,
		cancellationRate: 0
	});
	let isLoading = $state(true);
	let error = $state('');
	let period = $state('30d');

	onMount(async () => {
		try {
			if (!authStore.user) throw new Error('Not authenticated');
			const venueRes = await fetch(`/api/venues?ownerId=${authStore.user.id}`);
			if (!venueRes.ok) throw new Error('Failed to load venue');
			const venues = await venueRes.json();
			if (venues.length === 0) throw new Error('No venue found');
			venue = venues[0];
			await loadAnalytics();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load analytics';
		} finally {
			isLoading = false;
		}
	});

	async function loadAnalytics() {
		if (!venue) return;
		try {
			const res = await fetch(`/api/analytics/venue/${venue.id}?period=${period}`);
			if (res.ok) analytics = await res.json();
		} catch (e) {
			console.error('Failed to load analytics:', e);
		}
	}

	let avgBookings = $derived(
		analytics.bookingsPerDay.length > 0
			? (analytics.bookingsPerDay.reduce((a, b) => a + b, 0) / analytics.bookingsPerDay.length).toFixed(1)
			: '0'
	);
	let avgRevenue = $derived(
		analytics.revenuePerDay.length > 0
			? Math.round(analytics.revenuePerDay.reduce((a, b) => a + b, 0) / analytics.revenuePerDay.length)
			: 0
	);
</script>

<svelte:head>
	<title>Analytics - Court Sniper</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-5xl">
	<div class="flex items-center justify-between mb-8">
		<h1 class="text-2xl font-bold tracking-tight">Analytics</h1>
		<select
			bind:value={period}
			onchange={loadAnalytics}
			class="rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
		>
			<option value="7d">Last 7 days</option>
			<option value="30d">Last 30 days</option>
			<option value="90d">Last 90 days</option>
			<option value="1y">Last year</option>
		</select>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-16">
			<div class="text-sm text-muted-foreground">Loading analytics...</div>
		</div>
	{:else if error}
		<div class="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
	{:else if venue}
		<div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
			<div class="rounded-xl border border-border bg-background p-5">
				<p class="text-xs text-muted-foreground mb-1">Player Retention</p>
				<p class="text-2xl font-bold">{analytics.playerRetention.toFixed(1)}%</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-5">
				<p class="text-xs text-muted-foreground mb-1">Cancellation Rate</p>
				<p class="text-2xl font-bold">{analytics.cancellationRate.toFixed(1)}%</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-5">
				<p class="text-xs text-muted-foreground mb-1">Avg Bookings/Day</p>
				<p class="text-2xl font-bold">{avgBookings}</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-5">
				<p class="text-xs text-muted-foreground mb-1">Avg Revenue/Day</p>
				<p class="text-2xl font-bold">{formatPeso(avgRevenue)}</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-6">
			<div class="rounded-xl border border-border bg-background p-6">
				<h3 class="text-sm font-semibold mb-4">Bookings Trend</h3>
				<div class="h-48 flex items-center justify-center rounded-lg bg-muted/50 text-sm text-muted-foreground">
					Chart coming soon
				</div>
			</div>
			<div class="rounded-xl border border-border bg-background p-6">
				<h3 class="text-sm font-semibold mb-4">Revenue Trend</h3>
				<div class="h-48 flex items-center justify-center rounded-lg bg-muted/50 text-sm text-muted-foreground">
					Chart coming soon
				</div>
			</div>
		</div>
	{/if}
</div>
