<script lang="ts">
	import { TrendingUp, ArrowUpRight, ArrowDownRight } from 'lucide-svelte';

	function formatPeso(amount: number): string {
		return `P${amount.toLocaleString()}`;
	}

	const revenueStats = {
		thisWeek: 42000,
		thisMonth: 156000,
		total: 892000,
		commission: 89200,
		weekChange: 12,
		monthChange: 8
	};

	// Daily revenue for CSS bar chart
	const dailyRevenue = [
		{ day: 'Mon', amount: 4800 },
		{ day: 'Tue', amount: 6200 },
		{ day: 'Wed', amount: 3500 },
		{ day: 'Thu', amount: 7100 },
		{ day: 'Fri', amount: 8400 },
		{ day: 'Sat', amount: 9500 },
		{ day: 'Sun', amount: 8400 }
	];

	let maxRevenue = $derived(Math.max(...dailyRevenue.map(d => d.amount)));

	type Transaction = {
		id: string;
		date: string;
		player: string;
		court: string;
		amount: number;
		commission: number;
		net: number;
	};

	const transactions: Transaction[] = [
		{ id: 'T001', date: 'Mar 22', player: 'Marco P.', court: 'Court A', amount: 500, commission: 50, net: 450 },
		{ id: 'T002', date: 'Mar 22', player: 'Rina S.', court: 'Court B', amount: 500, commission: 50, net: 450 },
		{ id: 'T003', date: 'Mar 22', player: 'Barkada ni Joy', court: 'Court A', amount: 500, commission: 50, net: 450 },
		{ id: 'T004', date: 'Mar 22', player: 'Carlos M.', court: 'Court B', amount: 500, commission: 50, net: 450 },
		{ id: 'T005', date: 'Mar 22', player: 'Coach Rey', court: 'Court C', amount: 400, commission: 40, net: 360 },
		{ id: 'T006', date: 'Mar 22', player: 'Paolo G.', court: 'Court A', amount: 500, commission: 50, net: 450 },
		{ id: 'T007', date: 'Mar 22', player: 'Bea T.', court: 'Court D', amount: 350, commission: 35, net: 315 },
		{ id: 'T008', date: 'Mar 22', player: 'JayR', court: 'Court A', amount: 500, commission: 50, net: 450 },
		{ id: 'T009', date: 'Mar 22', player: 'Evening League', court: 'Court A-B', amount: 1000, commission: 100, net: 900 },
		{ id: 'T010', date: 'Mar 21', player: 'Miguel R.', court: 'Court A', amount: 500, commission: 50, net: 450 },
		{ id: 'T011', date: 'Mar 21', player: 'Davao Picklers', court: 'Court B', amount: 500, commission: 50, net: 450 },
		{ id: 'T012', date: 'Mar 21', player: 'Joy M.', court: 'Court C', amount: 400, commission: 40, net: 360 },
	];
</script>

<svelte:head>
	<title>Revenue - Bohol Pickle Hub</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold tracking-tight">Revenue</h1>
		<p class="mt-1 text-sm text-muted-foreground">Track your earnings and transactions.</p>
	</div>

	<!-- Revenue stats -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
		<div class="rounded-xl border border-border bg-background p-4 sm:p-5">
			<p class="text-xs text-muted-foreground mb-1">This Week</p>
			<p class="text-xl sm:text-2xl font-bold">{formatPeso(revenueStats.thisWeek)}</p>
			<div class="mt-1 flex items-center gap-1 text-xs text-emerald-600">
				<ArrowUpRight class="h-3 w-3" />
				<span>+{revenueStats.weekChange}%</span>
			</div>
		</div>
		<div class="rounded-xl border border-border bg-background p-4 sm:p-5">
			<p class="text-xs text-muted-foreground mb-1">This Month</p>
			<p class="text-xl sm:text-2xl font-bold">{formatPeso(revenueStats.thisMonth)}</p>
			<div class="mt-1 flex items-center gap-1 text-xs text-emerald-600">
				<ArrowUpRight class="h-3 w-3" />
				<span>+{revenueStats.monthChange}%</span>
			</div>
		</div>
		<div class="rounded-xl border border-border bg-background p-4 sm:p-5">
			<p class="text-xs text-muted-foreground mb-1">Total Revenue</p>
			<p class="text-xl sm:text-2xl font-bold">{formatPeso(revenueStats.total)}</p>
		</div>
		<div class="rounded-xl border border-border bg-background p-4 sm:p-5">
			<p class="text-xs text-muted-foreground mb-1">Commission (10%)</p>
			<p class="text-xl sm:text-2xl font-bold text-red-600">{formatPeso(revenueStats.commission)}</p>
		</div>
	</div>

	<!-- CSS Bar Chart -->
	<div class="mb-8 rounded-xl border border-border bg-background p-5 sm:p-6">
		<h3 class="text-base font-bold mb-1">Daily Revenue</h3>
		<p class="text-xs text-muted-foreground mb-6">This week</p>

		<div class="flex items-end justify-between gap-2 sm:gap-4 h-48">
			{#each dailyRevenue as day}
				<div class="flex flex-1 flex-col items-center gap-2">
					<p class="text-[10px] sm:text-xs font-bold text-muted-foreground">{formatPeso(day.amount)}</p>
					<div class="w-full flex justify-center">
						<div
							class="w-full max-w-[40px] rounded-t-lg bg-primary transition-all hover:bg-primary/80"
							style="height: {(day.amount / maxRevenue) * 140}px"
						></div>
					</div>
					<p class="text-xs font-medium text-muted-foreground">{day.day}</p>
				</div>
			{/each}
		</div>
	</div>

	<!-- Transactions list -->
	<div class="rounded-xl border border-border bg-background overflow-hidden">
		<div class="border-b border-border px-4 sm:px-6 py-4">
			<h3 class="text-base font-bold">Recent Transactions</h3>
		</div>

		<!-- Desktop table -->
		<div class="hidden sm:block">
			<table class="w-full">
				<thead class="bg-muted/30 border-b border-border">
					<tr>
						<th class="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Date</th>
						<th class="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Player</th>
						<th class="px-4 py-3 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Court</th>
						<th class="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</th>
						<th class="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Commission</th>
						<th class="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase tracking-wider">Net</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each transactions as tx (tx.id)}
						<tr class="hover:bg-muted/20 transition-colors">
							<td class="px-4 py-3 text-sm text-muted-foreground">{tx.date}</td>
							<td class="px-4 py-3 text-sm font-medium">{tx.player}</td>
							<td class="px-4 py-3 text-sm">{tx.court}</td>
							<td class="px-4 py-3 text-sm text-right font-medium">{formatPeso(tx.amount)}</td>
							<td class="px-4 py-3 text-sm text-right text-red-600">-{formatPeso(tx.commission)}</td>
							<td class="px-4 py-3 text-sm text-right font-bold text-emerald-600">{formatPeso(tx.net)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<!-- Mobile list -->
		<div class="sm:hidden divide-y divide-border">
			{#each transactions as tx (tx.id)}
				<div class="p-4">
					<div class="flex items-center justify-between mb-1">
						<p class="text-sm font-bold">{tx.player}</p>
						<p class="text-sm font-bold text-emerald-600">{formatPeso(tx.net)}</p>
					</div>
					<div class="flex items-center justify-between text-xs text-muted-foreground">
						<span>{tx.date} -- {tx.court}</span>
						<span>{formatPeso(tx.amount)} - {formatPeso(tx.commission)} fee</span>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>
