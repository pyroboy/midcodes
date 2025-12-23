<script lang="ts">
	import { untrack } from 'svelte';
	import { browser } from '$app/environment';
	import {
		Card,
		CardContent,
		CardDescription,
		CardHeader,
		CardTitle
	} from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import * as Tabs from '$lib/components/ui/tabs';
	import {
		Table,
		TableBody,
		TableCell,
		TableHead,
		TableHeader,
		TableRow
	} from '$lib/components/ui/table';
	import {
		getOverviewAnalytics,
		getRevenueAnalytics,
		getCreditAnalytics,
		getCardAnalytics,
		getUserAnalytics
	} from '$lib/remote/analytics.remote';
	import SuperAdminAccessPrompt from '$lib/components/SuperAdminAccessPrompt.svelte';
	import BypassWarningBanner from '$lib/components/BypassWarningBanner.svelte';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	// Check for access denied or bypassed access states
	const accessDenied = $derived((data as any).accessDenied as boolean | undefined);
	const bypassedAccess = $derived((data as any).bypassedAccess as boolean | undefined);
	const requiredRole = $derived((data as any).requiredRole as string | undefined);
	const currentRole = $derived((data as any).currentRole as string | undefined);
	const emulatedRole = $derived((data as any).emulatedRole as string | undefined);
	const originalRole = $derived((data as any).originalRole as string | undefined);

	// State
	let activeTab = $state('overview');
	let selectedDays = $state(30);
	let isLoading = $state(true);

	// Remote data - use untrack for initial days value
	const overview = getOverviewAnalytics();
	const revenue = getRevenueAnalytics({ days: untrack(() => selectedDays) });
	const credits = getCreditAnalytics({ days: untrack(() => selectedDays) });
	const cards = getCardAnalytics({ days: untrack(() => selectedDays) });
	const users = getUserAnalytics({ days: untrack(() => selectedDays) });

	// ApexCharts instance (dynamically loaded on client)
	let ApexCharts = $state<any>(null);
	let revenueChartEl = $state<HTMLDivElement | null>(null);
	let cardsChartEl = $state<HTMLDivElement | null>(null);
	let invoiceStatusChartEl = $state<HTMLDivElement | null>(null);
	let creditsChartEl = $state<HTMLDivElement | null>(null);
	let rolesChartEl = $state<HTMLDivElement | null>(null);

	let revenueChart: any = null;
	let cardsChart: any = null;
	let invoiceStatusChart: any = null;
	let creditsChart: any = null;
	let rolesChart: any = null;

	// Load ApexCharts on mount
	$effect(() => {
		if (browser) {
			import('apexcharts').then((module) => {
				ApexCharts = module.default;
				isLoading = false;
			});
		}
	});

	// Refresh data when days change
	async function refreshData() {
		isLoading = true;
		try {
			await Promise.all([
				getRevenueAnalytics({ days: selectedDays }).refresh(),
				getCreditAnalytics({ days: selectedDays }).refresh(),
				getCardAnalytics({ days: selectedDays }).refresh(),
				getUserAnalytics({ days: selectedDays }).refresh()
			]);
		} finally {
			isLoading = false;
		}
	}

	function formatCurrency(amount: number): string {
		return `₱${amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
	}

	function formatNumber(num: number): string {
		return num.toLocaleString('en-PH');
	}

	function formatRole(role: string): string {
		return role
			.split('_')
			.map((w) => w.charAt(0).toUpperCase() + w.slice(1))
			.join(' ');
	}

	// Chart theme based on dark mode
	function getChartTheme() {
		if (!browser) return 'light';
		return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
	}

	// Common chart options
	function getBaseOptions(): ApexCharts.ApexOptions {
		const isDark = getChartTheme() === 'dark';
		return {
			chart: {
				background: 'transparent',
				toolbar: { show: false },
				animations: { enabled: true, speed: 300 }
			},
			theme: { mode: isDark ? 'dark' : 'light' },
			grid: { borderColor: isDark ? '#374151' : '#e5e7eb', strokeDashArray: 4 },
			tooltip: { theme: isDark ? 'dark' : 'light' }
		};
	}

	// Render revenue area chart
	function renderRevenueChart(data: { date: string; value: number }[]) {
		if (!ApexCharts || !revenueChartEl) return;

		if (revenueChart) revenueChart.destroy();

		const options: ApexCharts.ApexOptions = {
			...getBaseOptions(),
			series: [
				{
					name: 'Revenue',
					data: data.map((d) => d.value)
				}
			],
			chart: { ...getBaseOptions().chart, type: 'area', height: 200 },
			xaxis: {
				categories: data.map((d) =>
					new Date(d.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
				),
				labels: { show: false }
			},
			yaxis: {
				labels: { formatter: (val: number) => `₱${val.toFixed(0)}` }
			},
			stroke: { curve: 'smooth', width: 2 },
			fill: {
				type: 'gradient',
				gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 }
			},
			colors: ['#3b82f6'],
			dataLabels: { enabled: false }
		};

		revenueChart = new ApexCharts(revenueChartEl, options);
		revenueChart.render();
	}

	// Render cards bar chart
	function renderCardsChart(data: { date: string; value: number }[]) {
		if (!ApexCharts || !cardsChartEl) return;

		if (cardsChart) cardsChart.destroy();

		const options: ApexCharts.ApexOptions = {
			...getBaseOptions(),
			series: [
				{
					name: 'Cards',
					data: data.map((d) => d.value)
				}
			],
			chart: { ...getBaseOptions().chart, type: 'bar', height: 200 },
			xaxis: {
				categories: data.map((d) =>
					new Date(d.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
				),
				labels: { show: false }
			},
			plotOptions: {
				bar: { borderRadius: 4, columnWidth: '60%' }
			},
			colors: ['#22c55e'],
			dataLabels: { enabled: false }
		};

		cardsChart = new ApexCharts(cardsChartEl, options);
		cardsChart.render();
	}

	// Render invoice status donut chart
	function renderInvoiceStatusChart(data: { status: string; count: number }[]) {
		if (!ApexCharts || !invoiceStatusChartEl) return;

		if (invoiceStatusChart) invoiceStatusChart.destroy();

		const colors: Record<string, string> = {
			paid: '#22c55e',
			sent: '#3b82f6',
			draft: '#9ca3af',
			void: '#ef4444',
			overdue: '#f59e0b'
		};

		const options: ApexCharts.ApexOptions = {
			...getBaseOptions(),
			series: data.map((d) => d.count),
			chart: { ...getBaseOptions().chart, type: 'donut', height: 200 },
			labels: data.map((d) => d.status.charAt(0).toUpperCase() + d.status.slice(1)),
			colors: data.map((d) => colors[d.status] || '#6b7280'),
			legend: { position: 'bottom', fontSize: '12px' },
			plotOptions: {
				pie: { donut: { size: '65%' } }
			}
		};

		invoiceStatusChart = new ApexCharts(invoiceStatusChartEl, options);
		invoiceStatusChart.render();
	}

	// Render credits area chart (purchased vs used)
	function renderCreditsChart(data: { date: string; purchased: number; used: number }[]) {
		if (!ApexCharts || !creditsChartEl) return;

		if (creditsChart) creditsChart.destroy();

		const options: ApexCharts.ApexOptions = {
			...getBaseOptions(),
			series: [
				{ name: 'Purchased', data: data.map((d) => d.purchased) },
				{ name: 'Used', data: data.map((d) => d.used) }
			],
			chart: { ...getBaseOptions().chart, type: 'area', height: 200, stacked: false },
			xaxis: {
				categories: data.map((d) =>
					new Date(d.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
				),
				labels: { show: false }
			},
			stroke: { curve: 'smooth', width: 2 },
			fill: {
				type: 'gradient',
				gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1 }
			},
			colors: ['#22c55e', '#ef4444'],
			dataLabels: { enabled: false },
			legend: { position: 'top', horizontalAlign: 'right' }
		};

		creditsChart = new ApexCharts(creditsChartEl, options);
		creditsChart.render();
	}

	// Render roles pie chart
	function renderRolesChart(data: { role: string; count: number }[]) {
		if (!ApexCharts || !rolesChartEl) return;

		if (rolesChart) rolesChart.destroy();

		const options: ApexCharts.ApexOptions = {
			...getBaseOptions(),
			series: data.map((d) => d.count),
			chart: { ...getBaseOptions().chart, type: 'pie', height: 200 },
			labels: data.map((d) => formatRole(d.role)),
			colors: ['#3b82f6', '#22c55e', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4'],
			legend: { position: 'bottom', fontSize: '11px' }
		};

		rolesChart = new ApexCharts(rolesChartEl, options);
		rolesChart.render();
	}
</script>

<svelte:head>
	<title>Analytics | Admin Dashboard</title>
</svelte:head>

<!-- Show access denied prompt for super admins who need to bypass -->
{#if accessDenied}
	<SuperAdminAccessPrompt requiredRole={requiredRole || 'admin'} {currentRole} {emulatedRole} />
{:else}
	<!-- Show bypass warning banner when accessing via bypass -->
	{#if bypassedAccess}
		<BypassWarningBanner requiredRole={requiredRole || 'admin'} {originalRole} />
	{/if}

	<div class="space-y-6">
		<!-- Header -->
		<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
			<div>
				<h1 class="text-3xl font-bold tracking-tight">Analytics</h1>
				<p class="text-muted-foreground mt-1">Monitor your organization's performance</p>
			</div>
			<div class="flex items-center gap-2">
				<span class="text-sm text-muted-foreground">Time range:</span>
				{#each [7, 30, 90] as days}
					<Button
						variant={selectedDays === days ? 'default' : 'outline'}
						size="sm"
						onclick={() => {
							selectedDays = days;
							refreshData();
						}}
					>
						{days}d
					</Button>
				{/each}
			</div>
		</div>

		<!-- Overview Stats -->
		{#await overview}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				{#each Array(4) as _}
					<Card>
						<CardHeader class="pb-2">
							<div class="h-4 w-24 bg-muted animate-pulse rounded"></div>
							<div class="h-8 w-16 bg-muted animate-pulse rounded mt-2"></div>
						</CardHeader>
					</Card>
				{/each}
			</div>
		{:then overviewData}
			<div class="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
				<Card>
					<CardHeader class="pb-2">
						<CardDescription>Total Revenue</CardDescription>
						<CardTitle class="text-3xl">{formatCurrency(overviewData.totalRevenue)}</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground">
							{formatCurrency(overviewData.revenueThisMonth)} this month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader class="pb-2">
						<CardDescription>ID Cards Generated</CardDescription>
						<CardTitle class="text-3xl">{formatNumber(overviewData.totalCards)}</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground">
							{formatNumber(overviewData.cardsThisMonth)} this month
						</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader class="pb-2">
						<CardDescription>Total Credits Balance</CardDescription>
						<CardTitle class="text-3xl">{formatNumber(overviewData.totalCreditsBalance)}</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground">Across all users</p>
					</CardContent>
				</Card>
				<Card>
					<CardHeader class="pb-2">
						<CardDescription>Total Users</CardDescription>
						<CardTitle class="text-3xl">{formatNumber(overviewData.totalUsers)}</CardTitle>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground">Active accounts</p>
					</CardContent>
				</Card>
			</div>
		{/await}

		<!-- Tabs -->
		<Tabs.Root bind:value={activeTab}>
			<Tabs.List>
				<Tabs.Trigger value="overview">Overview</Tabs.Trigger>
				<Tabs.Trigger value="revenue">Revenue</Tabs.Trigger>
				<Tabs.Trigger value="credits">Credits</Tabs.Trigger>
				<Tabs.Trigger value="cards">Cards</Tabs.Trigger>
				<Tabs.Trigger value="users">Users</Tabs.Trigger>
			</Tabs.List>

			<!-- Overview Tab -->
			<Tabs.Content value="overview" class="mt-6">
				<div class="grid gap-6 md:grid-cols-2">
					<!-- Revenue Trend -->
					{#await revenue}
						<Card
							><CardContent class="pt-6"
								><p class="text-muted-foreground">Loading...</p></CardContent
							></Card
						>
					{:then revenueData}
						<Card>
							<CardHeader>
								<CardTitle>Revenue Trend</CardTitle>
								<CardDescription>Last {selectedDays} days</CardDescription>
							</CardHeader>
							<CardContent>
								<div bind:this={revenueChartEl} class="h-[200px]">
									{#if ApexCharts}
										{@const _ = renderRevenueChart(revenueData.revenueByDay.slice(-14))}
									{/if}
								</div>
								<p class="text-sm text-muted-foreground mt-2">
									Total: {formatCurrency(revenueData.totalRevenue)} from {revenueData.paidInvoicesCount}
									invoices
								</p>
							</CardContent>
						</Card>
					{/await}

					<!-- Card Generation Trend -->
					{#await cards}
						<Card
							><CardContent class="pt-6"
								><p class="text-muted-foreground">Loading...</p></CardContent
							></Card
						>
					{:then cardsData}
						<Card>
							<CardHeader>
								<CardTitle>Cards Generated</CardTitle>
								<CardDescription>Last {selectedDays} days</CardDescription>
							</CardHeader>
							<CardContent>
								<div bind:this={cardsChartEl} class="h-[200px]">
									{#if ApexCharts}
										{@const _ = renderCardsChart(cardsData.cardsByDay.slice(-14))}
									{/if}
								</div>
								<p class="text-sm text-muted-foreground mt-2">
									{formatNumber(cardsData.cardsThisMonth)} cards this month
								</p>
							</CardContent>
						</Card>
					{/await}
				</div>
			</Tabs.Content>

			<!-- Revenue Tab -->
			<Tabs.Content value="revenue" class="mt-6">
				{#await revenue}
					<Card
						><CardContent class="pt-6"
							><p class="text-muted-foreground">Loading revenue data...</p></CardContent
						></Card
					>
				{:then revenueData}
					<div class="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Revenue Summary</CardTitle>
							</CardHeader>
							<CardContent class="space-y-4">
								<div class="flex justify-between">
									<span class="text-muted-foreground">Total Revenue</span>
									<span class="font-semibold">{formatCurrency(revenueData.totalRevenue)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Pending Revenue</span>
									<span class="font-semibold text-amber-600"
										>{formatCurrency(revenueData.pendingRevenue)}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Paid Invoices</span>
									<span class="font-semibold">{revenueData.paidInvoicesCount}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Average Invoice</span>
									<span class="font-semibold"
										>{formatCurrency(revenueData.averageInvoiceValue)}</span
									>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Invoice Status</CardTitle>
							</CardHeader>
							<CardContent>
								<div bind:this={invoiceStatusChartEl} class="h-[200px]">
									{#if ApexCharts && revenueData.invoiceStatusBreakdown.length > 0}
										{@const _ = renderInvoiceStatusChart(revenueData.invoiceStatusBreakdown)}
									{:else if revenueData.invoiceStatusBreakdown.length === 0}
										<p class="text-sm text-muted-foreground text-center py-8">No invoice data</p>
									{/if}
								</div>
							</CardContent>
						</Card>
					</div>
				{/await}
			</Tabs.Content>

			<!-- Credits Tab -->
			<Tabs.Content value="credits" class="mt-6">
				{#await credits}
					<Card
						><CardContent class="pt-6"
							><p class="text-muted-foreground">Loading credits data...</p></CardContent
						></Card
					>
				{:then creditsData}
					<div class="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Credits Summary</CardTitle>
							</CardHeader>
							<CardContent class="space-y-4">
								<div class="flex justify-between">
									<span class="text-muted-foreground">Purchased</span>
									<span class="font-semibold text-green-600"
										>+{formatNumber(creditsData.totalPurchased)}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Bonus</span>
									<span class="font-semibold text-blue-600"
										>+{formatNumber(creditsData.totalBonus)}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Used</span>
									<span class="font-semibold text-red-600"
										>-{formatNumber(creditsData.totalUsed)}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Refunded</span>
									<span class="font-semibold text-amber-600"
										>-{formatNumber(creditsData.totalRefunded)}</span
									>
								</div>
								<div class="border-t pt-4 flex justify-between">
									<span class="font-medium">Net Credits Issued</span>
									<span class="font-bold">{formatNumber(creditsData.netCredits)}</span>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Credits Flow</CardTitle>
								<CardDescription>Purchased vs Used</CardDescription>
							</CardHeader>
							<CardContent>
								<div bind:this={creditsChartEl} class="h-[200px]">
									{#if ApexCharts}
										{@const _ = renderCreditsChart(creditsData.transactionsByDay.slice(-14))}
									{/if}
								</div>
							</CardContent>
						</Card>
					</div>

					<Card class="mt-6">
						<CardHeader>
							<CardTitle>Top Credit Consumers</CardTitle>
						</CardHeader>
						<CardContent>
							{#if creditsData.topConsumers.length > 0}
								<Table>
									<TableHeader>
										<TableRow>
											<TableHead>User</TableHead>
											<TableHead class="text-right">Cards Generated</TableHead>
											<TableHead class="text-right">Balance</TableHead>
										</TableRow>
									</TableHeader>
									<TableBody>
										{#each creditsData.topConsumers as consumer}
											<TableRow>
												<TableCell class="truncate max-w-[200px]">{consumer.email}</TableCell>
												<TableCell class="text-right">{formatNumber(consumer.used)}</TableCell>
												<TableCell class="text-right font-medium"
													>{formatNumber(consumer.balance)}</TableCell
												>
											</TableRow>
										{/each}
									</TableBody>
								</Table>
							{:else}
								<p class="text-sm text-muted-foreground">No data available</p>
							{/if}
						</CardContent>
					</Card>
				{/await}
			</Tabs.Content>

			<!-- Cards Tab -->
			<Tabs.Content value="cards" class="mt-6">
				{#await cards}
					<Card
						><CardContent class="pt-6"
							><p class="text-muted-foreground">Loading cards data...</p></CardContent
						></Card
					>
				{:then cardsData}
					<div class="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>Cards by Template</CardTitle>
								<CardDescription>Top templates by usage</CardDescription>
							</CardHeader>
							<CardContent>
								{#if cardsData.cardsByTemplate.length > 0}
									<div class="space-y-3">
										{#each cardsData.cardsByTemplate as template}
											{@const maxCount = cardsData.cardsByTemplate[0]?.count || 1}
											<div>
												<div class="flex justify-between text-sm mb-1">
													<span class="truncate">{template.templateName}</span>
													<span class="font-medium">{formatNumber(template.count)}</span>
												</div>
												<div class="h-2 bg-muted rounded-full overflow-hidden">
													<div
														class="h-full bg-primary"
														style="width: {(template.count / maxCount) * 100}%"
													></div>
												</div>
											</div>
										{/each}
									</div>
								{:else}
									<p class="text-sm text-muted-foreground">No templates found</p>
								{/if}
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Top Card Generators</CardTitle>
								<CardDescription>Users who generate the most cards</CardDescription>
							</CardHeader>
							<CardContent>
								{#if cardsData.topGenerators.length > 0}
									<Table>
										<TableHeader>
											<TableRow>
												<TableHead>User</TableHead>
												<TableHead class="text-right">Cards</TableHead>
											</TableRow>
										</TableHeader>
										<TableBody>
											{#each cardsData.topGenerators.slice(0, 5) as generator}
												<TableRow>
													<TableCell class="truncate max-w-[200px]">{generator.email}</TableCell>
													<TableCell class="text-right font-medium"
														>{formatNumber(generator.count)}</TableCell
													>
												</TableRow>
											{/each}
										</TableBody>
									</Table>
								{:else}
									<p class="text-sm text-muted-foreground">No data available</p>
								{/if}
							</CardContent>
						</Card>
					</div>
				{/await}
			</Tabs.Content>

			<!-- Users Tab -->
			<Tabs.Content value="users" class="mt-6">
				{#await users}
					<Card
						><CardContent class="pt-6"
							><p class="text-muted-foreground">Loading users data...</p></CardContent
						></Card
					>
				{:then usersData}
					<div class="grid gap-6 md:grid-cols-2">
						<Card>
							<CardHeader>
								<CardTitle>User Summary</CardTitle>
							</CardHeader>
							<CardContent class="space-y-4">
								<div class="flex justify-between">
									<span class="text-muted-foreground">Total Users</span>
									<span class="font-semibold">{formatNumber(usersData.totalUsers)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">Active (last 30d)</span>
									<span class="font-semibold text-green-600"
										>{formatNumber(usersData.activeUsers)}</span
									>
								</div>
								<div class="flex justify-between">
									<span class="text-muted-foreground">New this month</span>
									<span class="font-semibold text-blue-600"
										>+{formatNumber(usersData.newUsersThisMonth)}</span
									>
								</div>
							</CardContent>
						</Card>

						<Card>
							<CardHeader>
								<CardTitle>Users by Role</CardTitle>
							</CardHeader>
							<CardContent>
								<div bind:this={rolesChartEl} class="h-[200px]">
									{#if ApexCharts && usersData.usersByRole.length > 0}
										{@const _ = renderRolesChart(usersData.usersByRole)}
									{:else if usersData.usersByRole.length === 0}
										<p class="text-sm text-muted-foreground text-center py-8">No users found</p>
									{/if}
								</div>
							</CardContent>
						</Card>
					</div>
				{/await}
			</Tabs.Content>
		</Tabs.Root>
	</div>
{/if}
