<script lang="ts">
	import { page } from '$app/state';
	import { cn } from '$lib/utils';
	import TopBar from '$lib/components/TopBar.svelte';
	import { session } from '$lib/stores/session.svelte';

	let { children }: { children: import('svelte').Snippet } = $props();

	let currentRoute = $derived(page.url.pathname);

	const tabGroups = [
		{
			label: 'Operations',
			tabs: [
				{ href: '/reports/meat-variance', label: 'Meat Variance' },
				{ href: '/reports/table-sales',   label: 'Table Sales' },
				{ href: '/reports/eod',           label: 'End of Day' }
			]
		},
		{
			label: 'Expenses',
			tabs: [
				{ href: '/reports/expenses-daily',   label: 'Daily' },
				{ href: '/reports/expenses-monthly', label: 'Monthly' }
			]
		},
		{
			label: 'Revenue & Sales',
			tabs: [
				{ href: '/reports/sales-summary', label: 'Sales Summary' },
				{ href: '/reports/best-sellers',  label: 'Best Sellers' },
				{ href: '/reports/peak-hours',    label: 'Peak Hours' }
			]
		},
		{
			label: 'Profitability',
			tabs: [
				{ href: '/reports/profit-gross', label: 'Gross Profit' },
				{ href: '/reports/profit-net',   label: 'Net Profit' }
			]
		},
		{
			label: 'Branch',
			tabs: [
				{ href: '/reports/branch-comparison', label: 'Compare' }
			]
		}
	];
</script>

<div class="flex h-screen flex-col overflow-hidden bg-surface-secondary">
	<TopBar />

	<div class="shrink-0 bg-white border-b border-border px-6 pt-3 pb-0 flex flex-col gap-2">
		<div class="flex items-center gap-3">
			<h1 class="text-xl font-bold text-gray-900 tracking-tight shrink-0">Consolidated Reports</h1>
			{#if session.locationId === 'all'}
				<span class="rounded-full border border-purple-200 bg-purple-50 px-2.5 py-0.5 text-xs font-semibold text-purple-700">
					🌐 All Branches
				</span>
			{/if}
		</div>
		<nav class="flex items-center gap-0 overflow-x-auto">
			{#each tabGroups as group, gi}
				{#if gi > 0}
					<div class="mx-3 h-5 w-px shrink-0 bg-border"></div>
				{/if}
				<div class="flex flex-col">
					<span class="mb-1 px-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">{group.label}</span>
					<div class="flex items-center gap-0.5">
						{#each group.tabs as tab}
							<a
								href={tab.href}
								class={cn(
									"px-3 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors",
									currentRoute === tab.href
										? "border-accent text-accent font-semibold"
										: "border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300"
								)}
							>
								{tab.label}
							</a>
						{/each}
					</div>
				</div>
			{/each}
		</nav>
	</div>

	<div class="flex-1 overflow-auto p-6">
		{@render children()}
	</div>
</div>
