<script lang="ts">
	import type { PageData } from './$types';
	import { formatCurrency } from '$lib/utils/format';
	import { toast } from 'svelte-sonner';
	import {
		AlertTriangle,
		AlertCircle,
		Clock,
		Copy,
		Check,
		TrendingDown,
		Users,
		Home,
		ShieldAlert,
		FileWarning,
		Building2,
		ChevronDown,
		ChevronUp,
		RefreshCw,
		Play,
		Loader2,
		CheckCircle,
		XCircle,
		Activity,
		CreditCard,
		Wrench,
		DollarSign
	} from 'lucide-svelte';
	import { cn } from '$lib/utils';
	import { invalidateAll } from '$app/navigation';

	let { data }: { data: PageData } = $props();
	let copied = $state(false);
	let runningJobs = $state(false);
	let jobResult = $state<any>(null);
	let showJobResult = $state(false);
	let expandedLogId = $state<number | null>(null);
	let expandedSections = $state<Record<string, boolean>>({
		overdue: true,
		missing: true,
		penalties: true,
		occupancy: true,
		automation: true
	});

	const insights = $derived(data.insights);
	const logs = $derived(data.automationLogs ?? []);

	async function copySummary() {
		if (!data.summary) return;
		try {
			await navigator.clipboard.writeText(data.summary);
			copied = true;
			toast.success('Summary copied to clipboard! Paste into ChatGPT or Claude.ai for analysis.');
			setTimeout(() => (copied = false), 3000);
		} catch {
			toast.error('Failed to copy — try selecting and copying manually.');
		}
	}

	async function runAutomationJobs() {
		runningJobs = true;
		jobResult = null;
		showJobResult = false;
		try {
			const res = await fetch('/api/cron', {
				method: 'POST',
				headers: { 'Authorization': `Bearer ${cronSecret}` }
			});
			jobResult = await res.json();
			showJobResult = true;

			if (res.ok && jobResult.ok) {
				toast.success('Automation jobs completed successfully!');
			} else if (res.ok) {
				toast.warning('Automation jobs completed with some errors.');
			} else {
				toast.error(jobResult.error || 'Failed to run automation jobs.');
			}

			// Reload page data to show new logs
			await invalidateAll();
		} catch (e) {
			toast.error('Failed to connect to cron endpoint.');
			jobResult = { error: e instanceof Error ? e.message : String(e) };
			showJobResult = true;
		}
		runningJobs = false;
	}

	// Prompt for CRON_SECRET — stored in memory only (never persisted client-side)
	let cronSecret = $state('');
	let showSecretInput = $state(false);

	function handleRunClick() {
		if (!cronSecret) {
			showSecretInput = true;
			return;
		}
		runAutomationJobs();
	}

	function toggleSection(key: string) {
		expandedSections[key] = !expandedSections[key];
	}

	function formatLogTime(dateStr: string | Date): string {
		const d = typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
		return d.toLocaleString('en-PH', {
			timeZone: 'Asia/Manila',
			month: 'short',
			day: 'numeric',
			hour: '2-digit',
			minute: '2-digit'
		});
	}

	function jobTypeLabel(type: string): string {
		const map: Record<string, string> = {
			OVERDUE_CHECK: 'Overdue Detection',
			PENALTY_CALC: 'Penalty Calculation',
			REMINDER: 'Payment Reminders',
			UTILITY_BILLING: 'Utility Billing'
		};
		return map[type] ?? type;
	}

	function severityColor(days: number): string {
		if (days > 30) return 'text-red-600 bg-red-50 border-red-200';
		if (days >= 8) return 'text-orange-600 bg-orange-50 border-orange-200';
		return 'text-yellow-600 bg-yellow-50 border-yellow-200';
	}
</script>

<svelte:head>
	<title>Insights — Dorm Management</title>
</svelte:head>

<div class="space-y-6">
	<!-- Header -->
	<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">Insights</h1>
			<p class="text-sm text-muted-foreground mt-1">
				{#if insights}
					Generated {insights.generatedAt}
				{:else}
					No data available
				{/if}
			</p>
		</div>

		<div class="flex items-center gap-2">
			<a
				href="/insights"
				data-sveltekit-reload
				class="inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm hover:bg-muted transition-colors"
			>
				<RefreshCw class="h-4 w-4" />
				Refresh
			</a>
			<button
				onclick={copySummary}
				disabled={!data.summary}
				class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 disabled:opacity-50 transition-colors"
			>
				{#if copied}
					<Check class="h-4 w-4" />
					Copied!
				{:else}
					<Copy class="h-4 w-4" />
					Copy Summary
				{/if}
			</button>
		</div>
	</div>

	{#if !insights}
		<div class="rounded-lg border p-8 text-center text-muted-foreground">
			<FileWarning class="h-12 w-12 mx-auto mb-3 opacity-50" />
			<p>Log in to see insights.</p>
		</div>
	{:else}
		<!-- KPI Cards Row -->
		<div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
			<!-- Total Overdue -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<TrendingDown class="h-4 w-4 text-red-500" />
					Total Overdue
				</div>
				<p class="text-2xl font-bold text-red-600">
					{formatCurrency(insights.overdue.totalOverdueBalance)}
				</p>
				<p class="text-xs text-muted-foreground">
					{insights.overdue.totalTenants} tenant{insights.overdue.totalTenants !== 1 ? 's' : ''}
				</p>
			</div>

			<!-- Collection Rate -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Activity class="h-4 w-4 text-green-500" />
					Collection Rate
				</div>
				<p class="text-2xl font-bold text-green-600">
					{insights.financial.collectionRate.toFixed(1)}%
				</p>
				<p class="text-xs text-muted-foreground">
					{formatCurrency(insights.financial.totalCollected)} of {formatCurrency(insights.financial.totalBilled)}
				</p>
			</div>

			<!-- Occupancy Rate -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Home class="h-4 w-4 text-blue-500" />
					Occupancy
				</div>
				<p class="text-2xl font-bold">
					{insights.occupancy.occupancyRate.toFixed(1)}%
				</p>
				<p class="text-xs text-muted-foreground">
					{insights.occupancy.occupiedUnits}/{insights.occupancy.totalUnits} units
				</p>
			</div>

			<!-- This Month Collections -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<CreditCard class="h-4 w-4 text-emerald-500" />
					This Month
				</div>
				<p class="text-2xl font-bold text-emerald-600">
					{formatCurrency(insights.paymentActivity.amountCollectedThisMonth)}
				</p>
				<p class="text-xs text-muted-foreground">
					{insights.paymentActivity.totalPaymentsThisMonth} payment{insights.paymentActivity.totalPaymentsThisMonth !== 1 ? 's' : ''}
				</p>
			</div>

			<!-- Penalties Pending -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<ShieldAlert class="h-4 w-4 text-orange-500" />
					Penalties Eligible
				</div>
				<p class="text-2xl font-bold text-orange-600">
					{insights.penalties.eligible.length}
				</p>
				<p class="text-xs text-muted-foreground">
					{insights.penalties.applied.length} already applied
				</p>
			</div>

			<!-- Security Deposits -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<DollarSign class="h-4 w-4 text-violet-500" />
					Security Deposits
				</div>
				<p class="text-2xl font-bold text-violet-600">
					{formatCurrency(insights.financial.securityDeposits.totalPaid)}
				</p>
				<p class="text-xs text-muted-foreground">
					{insights.financial.securityDeposits.fullyPaidLeases} paid, {insights.financial.securityDeposits.outstandingLeases} outstanding
				</p>
			</div>

			<!-- Active Tenants -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<Users class="h-4 w-4 text-cyan-500" />
					Tenants
				</div>
				<p class="text-2xl font-bold">
					{insights.tenantOverview.active}
				</p>
				<p class="text-xs text-muted-foreground">
					active of {insights.tenantOverview.total} total{insights.tenantOverview.newThisMonth > 0 ? `, +${insights.tenantOverview.newThisMonth} new` : ''}
				</p>
			</div>

			<!-- Maintenance -->
			{#if insights.maintenanceSummary.total > 0}
				<div class="rounded-lg border p-4 space-y-1">
					<div class="flex items-center gap-2 text-sm text-muted-foreground">
						<Wrench class="h-4 w-4 text-amber-500" />
						Maintenance
					</div>
					<p class="text-2xl font-bold text-amber-600">
						{insights.maintenanceSummary.pending}
					</p>
					<p class="text-xs text-muted-foreground">
						pending, {insights.maintenanceSummary.inProgress} in progress
					</p>
				</div>
			{/if}

			<!-- Data Issues -->
			<div class="rounded-lg border p-4 space-y-1">
				<div class="flex items-center gap-2 text-sm text-muted-foreground">
					<FileWarning class="h-4 w-4 text-yellow-500" />
					Data Issues
				</div>
				<p class="text-2xl font-bold text-yellow-600">
					{insights.missingData.reduce((s, c) => s + c.items.length, 0)}
				</p>
				<p class="text-xs text-muted-foreground">
					across {insights.missingData.length} categor{insights.missingData.length !== 1 ? 'ies' : 'y'}
				</p>
			</div>
		</div>

		<!-- Section: Overdue Payments -->
		<section class="rounded-lg border overflow-hidden">
			<button
				onclick={() => toggleSection('overdue')}
				class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100">
						<AlertTriangle class="h-4 w-4 text-red-600" />
					</div>
					<div>
						<h2 class="font-semibold">Overdue Payments & Balances</h2>
						<p class="text-sm text-muted-foreground">
							{insights.overdue.critical.length + insights.overdue.warning.length + insights.overdue.mild.length} overdue billing{insights.overdue.critical.length + insights.overdue.warning.length + insights.overdue.mild.length !== 1 ? 's' : ''}
						</p>
					</div>
				</div>
				{#if expandedSections.overdue}
					<ChevronUp class="h-5 w-5 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-5 w-5 text-muted-foreground" />
				{/if}
			</button>

			{#if expandedSections.overdue}
				<div class="border-t p-4 space-y-4">
					{#if insights.overdue.critical.length === 0 && insights.overdue.warning.length === 0 && insights.overdue.mild.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">No overdue payments. Great job!</p>
					{:else}
						{#each [
							{ label: 'Critical (30+ days)', items: insights.overdue.critical, dot: 'bg-red-500' },
							{ label: 'Warning (8-30 days)', items: insights.overdue.warning, dot: 'bg-orange-500' },
							{ label: 'Mild (1-7 days)', items: insights.overdue.mild, dot: 'bg-yellow-500' }
						] as group}
							{#if group.items.length > 0}
								<div>
									<h3 class="text-sm font-medium mb-2 flex items-center gap-2">
										<span class="inline-block w-2 h-2 rounded-full {group.dot}"></span>
										{group.label}
										<span class="text-xs text-muted-foreground">({group.items.length})</span>
									</h3>
									<div class="space-y-2">
										{#each group.items as billing}
											<div class="flex items-center justify-between rounded-md border p-3 text-sm {severityColor(billing.daysOverdue)}">
												<div class="flex-1 min-w-0">
													<span class="font-medium">{billing.tenantName}</span>
													<span class="text-xs opacity-75 ml-2">{billing.unitName}</span>
													<div class="text-xs opacity-75 mt-0.5">
														{billing.type} — Due: {billing.dueDate} ({billing.daysOverdue}d overdue)
													</div>
												</div>
												<div class="text-right shrink-0 ml-4">
													<div class="font-semibold">{formatCurrency(Number(billing.balance))}</div>
													{#if Number(billing.penaltyAmount) > 0}
														<div class="text-xs">+{formatCurrency(Number(billing.penaltyAmount))} penalty</div>
													{/if}
												</div>
											</div>
										{/each}
									</div>
								</div>
							{/if}
						{/each}
					{/if}
				</div>
			{/if}
		</section>

		<!-- Section: Missing Data -->
		<section class="rounded-lg border overflow-hidden">
			<button
				onclick={() => toggleSection('missing')}
				class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-yellow-100">
						<FileWarning class="h-4 w-4 text-yellow-600" />
					</div>
					<div>
						<h2 class="font-semibold">Missing / Incomplete Data</h2>
						<p class="text-sm text-muted-foreground">
							{insights.missingData.reduce((s, c) => s + c.items.length, 0)} issue{insights.missingData.reduce((s, c) => s + c.items.length, 0) !== 1 ? 's' : ''} found
						</p>
					</div>
				</div>
				{#if expandedSections.missing}
					<ChevronUp class="h-5 w-5 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-5 w-5 text-muted-foreground" />
				{/if}
			</button>

			{#if expandedSections.missing}
				<div class="border-t p-4 space-y-4">
					{#if insights.missingData.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">All data looks complete!</p>
					{:else}
						{#each insights.missingData as category}
							<div>
								<h3 class="text-sm font-medium mb-1">{category.category}</h3>
								<p class="text-xs text-muted-foreground mb-2">{category.description}</p>
								<div class="space-y-1">
									{#each category.items as item}
										<div class="flex items-center justify-between rounded-md border border-yellow-200 bg-yellow-50 p-2 text-sm">
											<span class="font-medium text-yellow-800">{item.name}</span>
											<span class="text-xs text-yellow-600">{item.detail}</span>
										</div>
									{/each}
								</div>
							</div>
						{/each}
					{/if}
				</div>
			{/if}
		</section>

		<!-- Section: Penalty Status -->
		<section class="rounded-lg border overflow-hidden">
			<button
				onclick={() => toggleSection('penalties')}
				class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-100">
						<ShieldAlert class="h-4 w-4 text-orange-600" />
					</div>
					<div>
						<h2 class="font-semibold">Penalty Status</h2>
						<p class="text-sm text-muted-foreground">
							{insights.penalties.eligible.length} eligible, {insights.penalties.applied.length} applied
						</p>
					</div>
				</div>
				{#if expandedSections.penalties}
					<ChevronUp class="h-5 w-5 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-5 w-5 text-muted-foreground" />
				{/if}
			</button>

			{#if expandedSections.penalties}
				<div class="border-t p-4 space-y-4">
					{#if insights.penalties.eligible.length === 0 && insights.penalties.applied.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">No penalty activity.</p>
					{:else}
						{#if insights.penalties.eligible.length > 0}
							<div>
								<h3 class="text-sm font-medium mb-2 text-orange-700">Eligible for Penalty (not yet applied)</h3>
								<div class="space-y-2">
									{#each insights.penalties.eligible as p}
										<div class="flex items-center justify-between rounded-md border border-orange-200 bg-orange-50 p-3 text-sm">
											<div class="flex-1 min-w-0">
												<span class="font-medium text-orange-800">{p.tenantName}</span>
												<div class="text-xs text-orange-600 mt-0.5">
													{p.type} — {p.daysOverdue}d overdue (grace: {p.gracePeriod}d, rate: {p.configPercentage}%)
												</div>
											</div>
											<div class="text-right shrink-0 ml-4">
												<div class="font-semibold text-orange-800">{formatCurrency(Number(p.balance))}</div>
												<div class="text-xs text-orange-600">of {formatCurrency(Number(p.amount))}</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}

						{#if insights.penalties.applied.length > 0}
							<div>
								<h3 class="text-sm font-medium mb-2 text-red-700">Penalties Applied</h3>
								<p class="text-xs text-muted-foreground mb-2">
									Total: {formatCurrency(insights.penalties.totalPenaltyApplied)}
								</p>
								<div class="space-y-2">
									{#each insights.penalties.applied as p}
										<div class="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 text-sm">
											<div class="flex-1 min-w-0">
												<span class="font-medium text-red-800">{p.tenantName}</span>
												<div class="text-xs text-red-600 mt-0.5">{p.type} — Due: {p.dueDate}</div>
											</div>
											<div class="text-right shrink-0 ml-4">
												<div class="font-semibold text-red-800">+{formatCurrency(Number(p.penaltyAmount))}</div>
												<div class="text-xs text-red-600">on {formatCurrency(Number(p.originalAmount))}</div>
											</div>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/if}
				</div>
			{/if}
		</section>

		<!-- Section: Occupancy & Lease Expiry -->
		<section class="rounded-lg border overflow-hidden">
			<button
				onclick={() => toggleSection('occupancy')}
				class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
						<Building2 class="h-4 w-4 text-blue-600" />
					</div>
					<div>
						<h2 class="font-semibold">Occupancy & Lease Expiry</h2>
						<p class="text-sm text-muted-foreground">
							{insights.occupancy.occupiedUnits} occupied, {insights.occupancy.vacantUnits} vacant
						</p>
					</div>
				</div>
				{#if expandedSections.occupancy}
					<ChevronUp class="h-5 w-5 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-5 w-5 text-muted-foreground" />
				{/if}
			</button>

			{#if expandedSections.occupancy}
				<div class="border-t p-4 space-y-4">
					<!-- Occupancy bar -->
					<div>
						<div class="flex justify-between text-sm mb-1">
							<span class="text-muted-foreground">Occupancy Rate</span>
							<span class="font-medium">{insights.occupancy.occupancyRate.toFixed(1)}%</span>
						</div>
						<div class="h-3 rounded-full bg-muted overflow-hidden">
							<div
								class="h-full rounded-full transition-all duration-500"
								class:bg-green-500={insights.occupancy.occupancyRate >= 80}
								class:bg-yellow-500={insights.occupancy.occupancyRate >= 50 && insights.occupancy.occupancyRate < 80}
								class:bg-red-500={insights.occupancy.occupancyRate < 50}
								style="width: {insights.occupancy.occupancyRate}%"
							></div>
						</div>
						<div class="flex justify-between text-xs text-muted-foreground mt-1">
							<span>{insights.occupancy.occupiedUnits} occupied</span>
							<span>{insights.occupancy.vacantUnits} vacant</span>
						</div>
					</div>

					<div class="text-sm">
						<span class="text-muted-foreground">Est. monthly revenue: </span>
						<span class="font-medium">{formatCurrency(insights.occupancy.totalMonthlyRevenue)}</span>
					</div>

					{#if insights.occupancy.expiredWithTenant.length > 0}
						<div>
							<h3 class="text-sm font-medium mb-2 text-red-700 flex items-center gap-1">
								<AlertCircle class="h-3.5 w-3.5" />
								Expired Leases (tenant still in unit)
							</h3>
							<div class="space-y-1">
								{#each insights.occupancy.expiredWithTenant as u}
									<div class="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-2 text-sm">
										<div>
											<span class="font-medium text-red-800">{u.unitName}</span>
											<span class="text-xs text-red-600 ml-2">{u.propertyName}, Floor {u.floorNumber}</span>
										</div>
										<div class="text-xs text-red-600">
											{u.tenantName} — ended {u.leaseEnd}
										</div>
									</div>
								{/each}
							</div>
						</div>
					{/if}

					{#each [
						{ label: 'Expiring within 30 days', items: insights.occupancy.expiringIn30, borderColor: 'border-orange-200', bgColor: 'bg-orange-50', textColor: 'text-orange-800', subColor: 'text-orange-600' },
						{ label: 'Expiring in 31-60 days', items: insights.occupancy.expiringIn60, borderColor: 'border-yellow-200', bgColor: 'bg-yellow-50', textColor: 'text-yellow-800', subColor: 'text-yellow-600' },
						{ label: 'Expiring in 61-90 days', items: insights.occupancy.expiringIn90, borderColor: 'border-blue-200', bgColor: 'bg-blue-50', textColor: 'text-blue-800', subColor: 'text-blue-600' }
					] as group}
						{#if group.items.length > 0}
							<div>
								<h3 class="text-sm font-medium mb-2">{group.label} ({group.items.length})</h3>
								<div class="space-y-1">
									{#each group.items as u}
										<div class="flex items-center justify-between rounded-md border {group.borderColor} {group.bgColor} p-2 text-sm">
											<span class="font-medium {group.textColor}">{u.unitName}</span>
											<span class="text-xs {group.subColor}">{u.tenantName} — ends {u.leaseEnd}</span>
										</div>
									{/each}
								</div>
							</div>
						{/if}
					{/each}

					{#if insights.occupancy.vacantList.length > 0}
						<div>
							<h3 class="text-sm font-medium mb-2">Vacant Units ({insights.occupancy.vacantList.length})</h3>
							<div class="space-y-1">
								{#each insights.occupancy.vacantList as u}
									<div class="flex items-center justify-between rounded-md border p-2 text-sm">
										<div>
											<span class="font-medium">{u.unitName}</span>
											<span class="text-xs text-muted-foreground ml-2">{u.propertyName}, Floor {u.floorNumber}</span>
										</div>
										<span class="text-sm font-medium">{formatCurrency(Number(u.baseRate))}/mo</span>
									</div>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			{/if}
		</section>

		<!-- Section: Automation Logs -->
		<section class="rounded-lg border overflow-hidden">
			<button
				onclick={() => toggleSection('automation')}
				class="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
			>
				<div class="flex items-center gap-3">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-100">
						<Activity class="h-4 w-4 text-purple-600" />
					</div>
					<div>
						<h2 class="font-semibold">Automation Logs</h2>
						<p class="text-sm text-muted-foreground">
							{logs.length} recent run{logs.length !== 1 ? 's' : ''}
						</p>
					</div>
				</div>
				{#if expandedSections.automation}
					<ChevronUp class="h-5 w-5 text-muted-foreground" />
				{:else}
					<ChevronDown class="h-5 w-5 text-muted-foreground" />
				{/if}
			</button>

			{#if expandedSections.automation}
				<div class="border-t p-4 space-y-4">
					<!-- Run Jobs Button -->
					<div class="flex items-center gap-3">
						{#if showSecretInput}
							<div class="flex items-center gap-2 flex-1">
								<input
									type="password"
									bind:value={cronSecret}
									placeholder="Enter CRON_SECRET"
									class="flex-1 rounded-md border px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
									onkeydown={(e) => { if (e.key === 'Enter' && cronSecret) { showSecretInput = false; runAutomationJobs(); } }}
								/>
								<button
									onclick={() => { if (cronSecret) { showSecretInput = false; runAutomationJobs(); } }}
									disabled={!cronSecret}
									class="inline-flex items-center gap-1 rounded-md bg-purple-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
								>
									<Play class="h-3.5 w-3.5" />
									Run
								</button>
								<button
									onclick={() => showSecretInput = false}
									class="text-sm text-muted-foreground hover:text-foreground"
								>
									Cancel
								</button>
							</div>
						{:else}
							<button
								onclick={handleRunClick}
								disabled={runningJobs}
								class="inline-flex items-center gap-2 rounded-md bg-purple-600 px-4 py-2 text-sm font-medium text-white hover:bg-purple-700 disabled:opacity-50 transition-colors"
							>
								{#if runningJobs}
									<Loader2 class="h-4 w-4 animate-spin" />
									Running...
								{:else}
									<Play class="h-4 w-4" />
									Run Jobs Now
								{/if}
							</button>
							<span class="text-xs text-muted-foreground">
								Runs overdue detection, penalty calculation & reminders
							</span>
						{/if}
					</div>

					<!-- Last Run Result -->
					{#if showJobResult && jobResult}
						<div class={cn(
							"rounded-md border p-3 text-sm",
							jobResult.ok ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"
						)}>
							<div class="flex items-center gap-2 font-medium mb-2">
								{#if jobResult.ok}
									<CheckCircle class="h-4 w-4 text-green-600" />
									<span class="text-green-800">Jobs completed successfully</span>
								{:else}
									<XCircle class="h-4 w-4 text-red-600" />
									<span class="text-red-800">{jobResult.error || 'Jobs completed with errors'}</span>
								{/if}
							</div>
							{#if jobResult.results}
								<div class="space-y-1 text-xs">
									{#if jobResult.results.overdue}
										<div class="flex justify-between">
											<span>Overdue Detection</span>
											<span>
												{jobResult.results.overdue.updated ?? 0} updated, {jobResult.results.overdue.notified ?? 0} notified
											</span>
										</div>
									{/if}
									{#if jobResult.results.penalties}
										<div class="flex justify-between">
											<span>Penalty Calculation</span>
											<span>
												{jobResult.results.penalties.applied ?? 0} applied, ₱{(jobResult.results.penalties.totalPenaltyAmount ?? 0).toLocaleString('en-PH', { minimumFractionDigits: 2 })}
											</span>
										</div>
									{/if}
									{#if jobResult.results.reminders}
										<div class="flex justify-between">
											<span>Payment Reminders</span>
											<span>
												{jobResult.results.reminders.sent ?? 0} sent, {jobResult.results.reminders.skipped ?? 0} skipped
											</span>
										</div>
									{/if}
								</div>
							{/if}
						</div>
					{/if}

					<!-- Log History -->
					{#if logs.length === 0}
						<p class="text-sm text-muted-foreground text-center py-4">No automation runs yet. Click "Run Jobs Now" to test.</p>
					{:else}
						<div class="space-y-2">
							{#each logs as log (log.id)}
								<div class="rounded-md border overflow-hidden">
									<button
										onclick={() => expandedLogId = expandedLogId === log.id ? null : log.id}
										class="w-full flex items-center justify-between p-3 text-sm hover:bg-muted/50 transition-colors text-left"
									>
										<div class="flex items-center gap-3">
											{#if log.status === 'SUCCESS'}
												<CheckCircle class="h-4 w-4 text-green-500 shrink-0" />
											{:else if log.status === 'PARTIAL'}
												<AlertTriangle class="h-4 w-4 text-yellow-500 shrink-0" />
											{:else}
												<XCircle class="h-4 w-4 text-red-500 shrink-0" />
											{/if}
											<div>
												<span class="font-medium">{jobTypeLabel(log.jobType)}</span>
												<span class={cn(
													"ml-2 text-xs px-1.5 py-0.5 rounded-full",
													log.status === 'SUCCESS' && "bg-green-100 text-green-700",
													log.status === 'PARTIAL' && "bg-yellow-100 text-yellow-700",
													log.status === 'FAILED' && "bg-red-100 text-red-700"
												)}>
													{log.status}
												</span>
											</div>
										</div>
										<div class="flex items-center gap-3 text-xs text-muted-foreground">
											<span>{log.itemsProcessed} processed</span>
											{#if (log.itemsFailed ?? 0) > 0}
												<span class="text-red-500">{log.itemsFailed} failed</span>
											{/if}
											<span>{formatLogTime(log.startedAt)}</span>
											{#if expandedLogId === log.id}
												<ChevronUp class="h-3.5 w-3.5" />
											{:else}
												<ChevronDown class="h-3.5 w-3.5" />
											{/if}
										</div>
									</button>

									{#if expandedLogId === log.id}
										<div class="border-t bg-muted/30 p-3">
											<pre class="text-xs whitespace-pre-wrap font-mono overflow-x-auto max-h-64 overflow-y-auto">{JSON.stringify(log.details, null, 2)}</pre>
											{#if log.error}
												<div class="mt-2 text-xs text-red-600 font-medium">
													Error: {log.error}
												</div>
											{/if}
											{#if log.completedAt}
												<div class="mt-2 text-[10px] text-muted-foreground">
													Duration: {Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)}s
												</div>
											{/if}
										</div>
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>
			{/if}
		</section>

		<!-- Copy Summary Preview -->
		<section class="rounded-lg border p-4">
			<div class="flex items-center justify-between mb-3">
				<h2 class="text-sm font-medium text-muted-foreground">Summary Preview (for AI chatbot)</h2>
				<button
					onclick={copySummary}
					class="inline-flex items-center gap-1 text-xs text-primary hover:underline"
				>
					{#if copied}
						<Check class="h-3 w-3" />
						Copied
					{:else}
						<Copy class="h-3 w-3" />
						Copy
					{/if}
				</button>
			</div>
			<pre class="text-xs bg-muted rounded-md p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">{data.summary}</pre>
		</section>
	{/if}
</div>
