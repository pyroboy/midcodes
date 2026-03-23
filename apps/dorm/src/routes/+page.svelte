<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Skeleton } from '$lib/components/ui/skeleton';
	import {
		Building,
		Users,
		FileText,
		CreditCard,
		AlertTriangle,
		Clock,
		TrendingUp,
		Home,
		CircleDollarSign,
		Activity
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import {
		propertiesStore,
		tenantsStore,
		leasesStore,
		paymentsStore,
		billingsStore,
		rentalUnitsStore
	} from '$lib/stores/collections.svelte';
	import SyncErrorBanner from '$lib/components/sync/SyncErrorBanner.svelte';
	import { propertyStore } from '$lib/stores/property';
	import { formatCurrency } from '$lib/utils/format';

	let { data } = $props<{ data: PageData }>();

	let activeLeases = $derived(leasesStore.value.filter((l: any) => l.status === 'ACTIVE'));

	let isLoading = $derived(!propertiesStore.initialized);

	// [06] Time-based greeting
	let greeting = $derived.by(() => {
		const hour = new Date().getHours();
		if (hour < 12) return 'Good morning';
		if (hour < 18) return 'Good afternoon';
		return 'Good evening';
	});

	let userName = $derived(data.user?.name || data.user?.email || '');

	// [01] Financial KPIs
	let financialKpis = $derived.by(() => {
		const collected = paymentsStore.value.reduce(
			(sum: number, p: any) => sum + parseFloat(p.amount || '0'),
			0
		);
		const outstandingBillings = billingsStore.value.filter((b: any) =>
			['PENDING', 'PARTIAL', 'OVERDUE'].includes(b.status)
		);
		const outstanding = outstandingBillings.reduce(
			(sum: number, b: any) => sum + parseFloat(b.balance || '0'),
			0
		);
		const overdueCount = billingsStore.value.filter((b: any) => b.status === 'OVERDUE').length;
		const total = collected + outstanding;
		const collectionRate = total > 0 ? Math.round((collected / total) * 100) : 0;

		return { collected, outstanding, overdueCount, collectionRate };
	});

	// [02] Attention needed
	let attentionItems = $derived.by(() => {
		const now = new Date();
		const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

		const expiringLeases = activeLeases.filter((l: any) => {
			if (!l.end_date) return false;
			const endDate = new Date(l.end_date);
			return endDate >= now && endDate <= thirtyDaysFromNow;
		});

		const overdueBillings = billingsStore.value.filter((b: any) => b.status === 'OVERDUE');

		return { expiringLeases, overdueBillings };
	});

	let hasAttentionItems = $derived(
		attentionItems.expiringLeases.length > 0 || attentionItems.overdueBillings.length > 0
	);

	// [05] Occupancy rate
	let occupancy = $derived.by(() => {
		const totalUnits = rentalUnitsStore.value.length;
		const occupiedUnits = activeLeases.length;
		const rate = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;
		return { totalUnits, occupiedUnits, rate };
	});

	// [08] Recent activity feed
	let recentActivity = $derived.by(() => {
		const items: Array<{
			type: string;
			description: string;
			timestamp: string;
			icon: 'payment' | 'lease' | 'tenant';
		}> = [];

		for (const p of paymentsStore.value) {
			items.push({
				type: 'payment',
				description: `Payment of ${formatCurrency(parseFloat(p.amount || '0'))} recorded`,
				timestamp: p.updated_at || p.created_at || '',
				icon: 'payment'
			});
		}

		for (const l of leasesStore.value) {
			items.push({
				type: 'lease',
				description: `Lease ${l.status === 'ACTIVE' ? 'activated' : l.status?.toLowerCase() || 'updated'}`,
				timestamp: l.updated_at || l.created_at || '',
				icon: 'lease'
			});
		}

		for (const t of tenantsStore.value) {
			items.push({
				type: 'tenant',
				description: `Tenant "${t.name || 'Unknown'}" ${t.created_at === t.updated_at ? 'added' : 'updated'}`,
				timestamp: t.updated_at || t.created_at || '',
				icon: 'tenant'
			});
		}

		return items
			.filter((i) => i.timestamp)
			.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
			.slice(0, 8);
	});

	function relativeTime(timestamp: string): string {
		if (!timestamp) return '';
		const now = Date.now();
		const then = new Date(timestamp).getTime();
		const diffMs = now - then;
		const diffMin = Math.floor(diffMs / 60000);
		if (diffMin < 1) return 'just now';
		if (diffMin < 60) return `${diffMin}m ago`;
		const diffHrs = Math.floor(diffMin / 60);
		if (diffHrs < 24) return `${diffHrs}h ago`;
		const diffDays = Math.floor(diffHrs / 24);
		if (diffDays < 30) return `${diffDays}d ago`;
		return `${Math.floor(diffDays / 30)}mo ago`;
	}
</script>

<div class="space-y-6 p-6">
	<SyncErrorBanner
		collections={['properties', 'tenants', 'leases', 'payments', 'billings', 'rental_units']}
	/>

	<!-- [06] Greeting + Date -->
	<div>
		<h1 class="text-2xl sm:text-3xl font-bold">
			{#if data.user}
				{greeting}{userName ? `, ${userName}` : ''}
			{:else}
				Welcome to Dorm Management
			{/if}
		</h1>
		<p class="text-muted-foreground mt-1">
			{#if $propertyStore.selectedProperty}
				Managing <span class="font-medium text-foreground"
					>{$propertyStore.selectedProperty.name}</span
				>
				&middot;
			{/if}
			{new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
		</p>
	</div>

	{#if data.user}
		<!-- [01] Financial KPIs Row -->
		<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Total Collected</CardTitle>
					<CircleDollarSign class="h-4 w-4 text-emerald-500" />
				</CardHeader>
				<CardContent>
					{#if isLoading}
						<Skeleton class="h-8 w-24 mb-1" />
					{:else}
						<div class="text-2xl font-bold text-emerald-600">
							{formatCurrency(financialKpis.collected)}
						</div>
					{/if}
					<p class="text-xs text-muted-foreground mt-1">All time payments</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Outstanding Balance</CardTitle>
					<CreditCard class="h-4 w-4 text-amber-500" />
				</CardHeader>
				<CardContent>
					{#if isLoading}
						<Skeleton class="h-8 w-24 mb-1" />
					{:else}
						<div class="text-2xl font-bold text-amber-600">
							{formatCurrency(financialKpis.outstanding)}
						</div>
					{/if}
					<p class="text-xs text-muted-foreground mt-1">Pending + partial + overdue</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Overdue</CardTitle>
					<AlertTriangle class="h-4 w-4 text-red-500" />
				</CardHeader>
				<CardContent>
					{#if isLoading}
						<Skeleton class="h-8 w-24 mb-1" />
					{:else}
						<div class="text-2xl font-bold text-red-600">
							{financialKpis.overdueCount}
						</div>
					{/if}
					<p class="text-xs text-muted-foreground mt-1">Overdue billings</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
					<CardTitle class="text-sm font-medium">Collection Rate</CardTitle>
					<TrendingUp class="h-4 w-4 text-blue-500" />
				</CardHeader>
				<CardContent>
					{#if isLoading}
						<Skeleton class="h-8 w-24 mb-1" />
					{:else}
						<div class="text-2xl font-bold text-blue-600">
							{financialKpis.collectionRate}%
						</div>
					{/if}
					<p class="text-xs text-muted-foreground mt-1">Collected vs total billed</p>
				</CardContent>
			</Card>
		</div>

		<!-- [02] Attention Needed -->
		{#if !isLoading && hasAttentionItems}
			<div class="space-y-3">
				<h2 class="text-lg font-semibold">Attention Needed</h2>
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					{#if attentionItems.expiringLeases.length > 0}
						<Card class="border-amber-200 bg-amber-50/50 dark:border-amber-900 dark:bg-amber-950/20">
							<CardContent class="pt-4">
								<div class="flex items-start gap-3">
									<Clock class="h-5 w-5 text-amber-600 mt-0.5 shrink-0" />
									<div>
										<p class="font-medium text-amber-800 dark:text-amber-200">
											{attentionItems.expiringLeases.length} lease{attentionItems.expiringLeases.length === 1 ? '' : 's'} expiring soon
										</p>
										<p class="text-sm text-amber-600 dark:text-amber-400 mt-0.5">
											Within the next 30 days
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					{/if}

					{#if attentionItems.overdueBillings.length > 0}
						<Card class="border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-950/20">
							<CardContent class="pt-4">
								<div class="flex items-start gap-3">
									<AlertTriangle class="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
									<div>
										<p class="font-medium text-red-800 dark:text-red-200">
											{attentionItems.overdueBillings.length} overdue billing{attentionItems.overdueBillings.length === 1 ? '' : 's'}
										</p>
										<p class="text-sm text-red-600 dark:text-red-400 mt-0.5">
											Requires immediate attention
										</p>
									</div>
								</div>
							</CardContent>
						</Card>
					{/if}
				</div>
			</div>
		{/if}

		<!-- [05] Occupancy Rate + [08] Recent Activity -->
		<div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
			<!-- Occupancy Widget -->
			<Card>
				<CardHeader class="pb-2">
					<div class="flex items-center justify-between">
						<CardTitle class="text-sm font-medium">Occupancy Rate</CardTitle>
						<Home class="h-4 w-4 text-muted-foreground" />
					</div>
				</CardHeader>
				<CardContent>
					{#if isLoading}
						<Skeleton class="h-6 w-32 mb-2" />
						<Skeleton class="h-3 w-full" />
					{:else}
						<div class="flex items-baseline gap-2">
							<span class="text-3xl font-bold">{occupancy.rate}%</span>
							<span class="text-sm text-muted-foreground">Occupied</span>
						</div>
						<p class="text-sm text-muted-foreground mt-1">
							{occupancy.occupiedUnits} of {occupancy.totalUnits} units
						</p>
						<!-- Progress bar -->
						<div class="mt-3 h-2.5 w-full rounded-full bg-muted">
							<div
								class="h-2.5 rounded-full transition-all duration-500 {occupancy.rate >= 90
									? 'bg-emerald-500'
									: occupancy.rate >= 60
										? 'bg-blue-500'
										: 'bg-amber-500'}"
								style="width: {occupancy.rate}%"
							></div>
						</div>
					{/if}
				</CardContent>
			</Card>

			<!-- Quick Actions -->
			<Card>
				<CardHeader class="pb-2">
					<CardTitle class="text-sm font-medium">Quick Actions</CardTitle>
				</CardHeader>
				<CardContent>
					<div class="flex flex-wrap gap-2">
						<a
							href="/properties?create=true"
							class="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 min-h-[44px] px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
						>
							<Building class="mr-2 h-4 w-4" />
							Add Property
						</a>
						<a
							href="/tenants?create=true"
							class="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 min-h-[44px] px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							<Users class="mr-2 h-4 w-4" />
							Add Tenant
						</a>
						<a
							href="/leases?create=true"
							class="inline-flex items-center justify-center rounded-md text-sm font-medium h-10 min-h-[44px] px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground transition-colors"
						>
							<FileText class="mr-2 h-4 w-4" />
							Create Lease
						</a>
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- [08] Recent Activity Feed -->
		<Card>
			<CardHeader class="pb-2">
				<div class="flex items-center justify-between">
					<CardTitle class="text-sm font-medium">Recent Activity</CardTitle>
					<Activity class="h-4 w-4 text-muted-foreground" />
				</div>
			</CardHeader>
			<CardContent>
				{#if isLoading}
					<div class="space-y-3">
						{#each Array(4) as _}
							<div class="flex items-center gap-3">
								<Skeleton class="h-8 w-8 rounded-full" />
								<div class="flex-1">
									<Skeleton class="h-4 w-3/4 mb-1" />
									<Skeleton class="h-3 w-1/4" />
								</div>
							</div>
						{/each}
					</div>
				{:else if recentActivity.length === 0}
					<p class="text-sm text-muted-foreground py-4 text-center">
						No recent activity yet
					</p>
				{:else}
					<div class="space-y-3">
						{#each recentActivity as item}
							<div class="flex items-start gap-3">
								<div
									class="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full {item.icon === 'payment'
										? 'bg-emerald-100 dark:bg-emerald-950'
										: item.icon === 'lease'
											? 'bg-blue-100 dark:bg-blue-950'
											: 'bg-purple-100 dark:bg-purple-950'}"
								>
									{#if item.icon === 'payment'}
										<CreditCard class="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
									{:else if item.icon === 'lease'}
										<FileText class="h-4 w-4 text-blue-600 dark:text-blue-400" />
									{:else}
										<Users class="h-4 w-4 text-purple-600 dark:text-purple-400" />
									{/if}
								</div>
								<div class="flex-1 min-w-0">
									<p class="text-sm truncate">{item.description}</p>
									<p class="text-xs text-muted-foreground">
										{relativeTime(item.timestamp)}
									</p>
								</div>
							</div>
						{/each}
					</div>
				{/if}
			</CardContent>
		</Card>
	{:else}
		<div class="text-center space-y-6">
			<p class="text-lg text-muted-foreground">
				Please sign in to access the dorm management system.
			</p>
			<Button>
				<a href="/auth">Sign In</a>
			</Button>
		</div>
	{/if}
</div>
