<script lang="ts">
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { formatPeso } from '$lib/utils';

	let isAdmin = $state(false);
	let stats = $state({
		totalUsers: 0,
		totalVenues: 0,
		totalBookings: 0,
		totalRevenue: 0,
		platformCommission: 0,
		pendingPayouts: 0
	});
	let isLoading = $state(true);
	let error = $state('');

	onMount(async () => {
		if (authStore.user?.role !== 'admin') {
			error = 'Unauthorized access';
			isLoading = false;
			return;
		}
		isAdmin = true;
		try {
			const statsRes = await fetch('/api/admin/stats');
			if (statsRes.ok) stats = await statsRes.json();
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to load stats';
		} finally {
			isLoading = false;
		}
	});
</script>

<svelte:head>
	<title>Admin - Court Sniper</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-5xl mx-auto">
	<h1 class="text-2xl font-bold tracking-tight mb-8">Admin Panel</h1>

	{#if !isAdmin}
		<div class="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
	{:else if isLoading}
		<div class="flex items-center justify-center py-16">
			<div class="text-sm text-muted-foreground">Loading admin dashboard...</div>
		</div>
	{:else}
		<div class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
			<div class="rounded-xl border border-border bg-background p-5">
				<p class="text-xs text-muted-foreground mb-1">Total Users</p>
				<p class="text-2xl font-bold">{stats.totalUsers}</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-5">
				<p class="text-xs text-muted-foreground mb-1">Total Venues</p>
				<p class="text-2xl font-bold">{stats.totalVenues}</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-5">
				<p class="text-xs text-muted-foreground mb-1">Total Bookings</p>
				<p class="text-2xl font-bold">{stats.totalBookings}</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-5">
				<p class="text-xs text-muted-foreground mb-1">Total Revenue</p>
				<p class="text-2xl font-bold">{formatPeso(stats.totalRevenue)}</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-5">
				<p class="text-xs text-muted-foreground mb-1">Platform Commission</p>
				<p class="text-2xl font-bold">{formatPeso(stats.platformCommission)}</p>
			</div>
			<div class="rounded-xl border border-border bg-background p-5">
				<p class="text-xs text-muted-foreground mb-1">Pending Payouts</p>
				<p class="text-2xl font-bold">{formatPeso(stats.pendingPayouts)}</p>
			</div>
		</div>

		<div class="space-y-3">
			<a href="/admin/users" class="block rounded-xl border border-border bg-background p-5 hover:border-primary/50 transition-colors">
				<h3 class="text-sm font-semibold mb-0.5">Manage Users</h3>
				<p class="text-xs text-muted-foreground">View and manage user accounts</p>
			</a>
			<a href="/admin/venues" class="block rounded-xl border border-border bg-background p-5 hover:border-primary/50 transition-colors">
				<h3 class="text-sm font-semibold mb-0.5">Manage Venues</h3>
				<p class="text-xs text-muted-foreground">Verify and manage venue listings</p>
			</a>
			<a href="/admin/payouts" class="block rounded-xl border border-border bg-background p-5 hover:border-primary/50 transition-colors">
				<h3 class="text-sm font-semibold mb-0.5">Payouts</h3>
				<p class="text-xs text-muted-foreground">Process venue payouts</p>
			</a>
		</div>
	{/if}
</div>
