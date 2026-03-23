<script lang="ts">
	import { Calendar, TrendingUp, Dumbbell, XCircle, Clock, Plus, BarChart3, Eye } from 'lucide-svelte';

	function formatPeso(amount: number): string {
		return `P${amount.toLocaleString()}`;
	}

	const todayStats = [
		{ label: 'Bookings Today', value: '14', icon: Calendar, color: 'text-primary', bg: 'bg-primary/10' },
		{ label: 'Revenue Today', value: formatPeso(8400), icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-500/10' },
		{ label: 'Courts Active', value: '4/4', icon: Dumbbell, color: 'text-blue-600', bg: 'bg-blue-500/10' },
		{ label: 'Cancellations', value: '1', icon: XCircle, color: 'text-red-600', bg: 'bg-red-500/10' }
	];

	// Today's timeline - hourly booking blocks
	const timelineHours = [
		{ time: '6:00 AM', courts: [{ name: 'Court A', player: 'Marco P.', status: 'confirmed' }, { name: 'Court B', player: 'Rina S.', status: 'confirmed' }, { name: 'Court C', player: null, status: 'available' }, { name: 'Court D', player: null, status: 'available' }] },
		{ time: '7:00 AM', courts: [{ name: 'Court A', player: 'Barkada ni Joy', status: 'confirmed' }, { name: 'Court B', player: 'Carlos M.', status: 'confirmed' }, { name: 'Court C', player: 'Coach Rey', status: 'confirmed' }, { name: 'Court D', player: null, status: 'available' }] },
		{ time: '8:00 AM', courts: [{ name: 'Court A', player: 'Paolo G.', status: 'confirmed' }, { name: 'Court B', player: null, status: 'available' }, { name: 'Court C', player: null, status: 'blocked' }, { name: 'Court D', player: 'Bea T.', status: 'confirmed' }] },
		{ time: '9:00 AM', courts: [{ name: 'Court A', player: null, status: 'available' }, { name: 'Court B', player: 'Manila Picklers', status: 'pending' }, { name: 'Court C', player: null, status: 'blocked' }, { name: 'Court D', player: null, status: 'available' }] },
		{ time: '10:00 AM', courts: [{ name: 'Court A', player: 'JayR', status: 'confirmed' }, { name: 'Court B', player: 'NewPlayer_01', status: 'confirmed' }, { name: 'Court C', player: null, status: 'available' }, { name: 'Court D', player: 'Cebu Crew', status: 'confirmed' }] },
		{ time: '5:00 PM', courts: [{ name: 'Court A', player: 'Evening League', status: 'confirmed' }, { name: 'Court B', player: 'Evening League', status: 'confirmed' }, { name: 'Court C', player: 'Walk-in', status: 'pending' }, { name: 'Court D', player: null, status: 'available' }] },
		{ time: '6:00 PM', courts: [{ name: 'Court A', player: 'Miguel R.', status: 'confirmed' }, { name: 'Court B', player: 'Davao Picklers', status: 'confirmed' }, { name: 'Court C', player: 'Joy M.', status: 'confirmed' }, { name: 'Court D', player: 'Paolo G.', status: 'confirmed' }] },
	];

	function slotColor(status: string): string {
		if (status === 'confirmed') return 'bg-primary/10 border-primary/30 text-primary';
		if (status === 'pending') return 'bg-amber-50 border-amber-200 text-amber-700';
		if (status === 'blocked') return 'bg-gray-100 border-gray-200 text-gray-400';
		return 'bg-background border-border text-muted-foreground';
	}
</script>

<svelte:head>
	<title>Dashboard - Bohol Pickle Hub</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold tracking-tight">Dashboard</h1>
		<p class="mt-1 text-sm text-muted-foreground">Today, March 22, 2026</p>
	</div>

	<!-- Stats grid -->
	<div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
		{#each todayStats as stat}
			<div class="rounded-xl border border-border bg-background p-4 sm:p-5">
				<div class="flex items-center gap-2 mb-2">
					<div class="flex h-8 w-8 items-center justify-center rounded-lg {stat.bg}">
						<stat.icon class="h-4 w-4 {stat.color}" />
					</div>
				</div>
				<p class="text-2xl font-bold">{stat.value}</p>
				<p class="text-xs text-muted-foreground">{stat.label}</p>
			</div>
		{/each}
	</div>

	<!-- Quick actions -->
	<div class="mb-8 flex flex-wrap gap-2">
		<a href="/venue/bookings" class="flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:bg-primary/90 transition-colors">
			<Clock class="h-4 w-4" />
			Block Time
		</a>
		<a href="/venue/courts" class="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
			<Plus class="h-4 w-4" />
			Add Court
		</a>
		<a href="/venue/revenue" class="flex items-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium hover:bg-muted transition-colors">
			<BarChart3 class="h-4 w-4" />
			View Revenue
		</a>
	</div>

	<!-- Today's Timeline -->
	<div class="rounded-xl border border-border bg-background overflow-hidden">
		<div class="border-b border-border px-4 sm:px-6 py-4">
			<h2 class="text-base font-bold">Today's Court Timeline</h2>
			<p class="text-xs text-muted-foreground mt-0.5">Hourly booking overview across all courts</p>
		</div>

		<!-- Court headers -->
		<div class="border-b border-border bg-muted/30">
			<div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr] gap-px">
				<div class="px-3 py-2 text-xs font-bold text-muted-foreground">Time</div>
				<div class="px-3 py-2 text-xs font-bold text-muted-foreground">Court A</div>
				<div class="px-3 py-2 text-xs font-bold text-muted-foreground">Court B</div>
				<div class="px-3 py-2 text-xs font-bold text-muted-foreground hidden sm:block">Court C</div>
				<div class="px-3 py-2 text-xs font-bold text-muted-foreground hidden sm:block">Court D</div>
			</div>
		</div>

		<!-- Timeline rows -->
		<div class="divide-y divide-border">
			{#each timelineHours as hour}
				<div class="grid grid-cols-[80px_1fr_1fr_1fr_1fr] gap-px">
					<div class="px-3 py-3 text-xs font-bold text-muted-foreground flex items-center">
						{hour.time}
					</div>
					{#each hour.courts as court, i}
						<div class="px-2 py-2 {i >= 2 ? 'hidden sm:block' : ''}">
							<div class="rounded-lg border px-2 py-2 text-center {slotColor(court.status)}">
								{#if court.player}
									<p class="text-[11px] font-bold truncate">{court.player}</p>
								{:else if court.status === 'blocked'}
									<p class="text-[11px]">Blocked</p>
								{:else}
									<p class="text-[11px]">Open</p>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/each}
		</div>
	</div>
</div>
