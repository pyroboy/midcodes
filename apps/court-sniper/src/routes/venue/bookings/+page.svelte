<script lang="ts">
	import { Check, X, ChevronLeft, ChevronRight, Clock, User } from 'lucide-svelte';

	type BookingFilter = 'all' | 'pending' | 'confirmed' | 'cancelled';
	let filter = $state<BookingFilter>('all');

	function formatPeso(amount: number): string {
		return `P${amount.toLocaleString()}`;
	}

	type VenueBooking = {
		id: string;
		playerName: string;
		court: string;
		date: string;
		time: string;
		players: number;
		amount: number;
		payment: 'gcash' | 'at_venue';
		status: 'pending' | 'confirmed' | 'cancelled';
	};

	const mockBookings: VenueBooking[] = [
		{ id: 'VB-001', playerName: 'Marco P.', court: 'Court A', date: 'Mar 22', time: '6:00 AM', players: 4, amount: 500, payment: 'gcash', status: 'confirmed' },
		{ id: 'VB-002', playerName: 'Rina S.', court: 'Court B', date: 'Mar 22', time: '6:00 AM', players: 2, amount: 500, payment: 'gcash', status: 'confirmed' },
		{ id: 'VB-003', playerName: 'Manila Picklers', court: 'Court B', date: 'Mar 22', time: '9:00 AM', players: 4, amount: 500, payment: 'at_venue', status: 'pending' },
		{ id: 'VB-004', playerName: 'Walk-in Guest', court: 'Court C', date: 'Mar 22', time: '5:00 PM', players: 2, amount: 500, payment: 'at_venue', status: 'pending' },
		{ id: 'VB-005', playerName: 'Barkada ni Joy', court: 'Court A', date: 'Mar 22', time: '7:00 AM', players: 4, amount: 500, payment: 'gcash', status: 'confirmed' },
		{ id: 'VB-006', playerName: 'Carlos M.', court: 'Court B', date: 'Mar 22', time: '7:00 AM', players: 2, amount: 500, payment: 'gcash', status: 'confirmed' },
		{ id: 'VB-007', playerName: 'Coach Rey', court: 'Court C', date: 'Mar 22', time: '7:00 AM', players: 4, amount: 500, payment: 'gcash', status: 'confirmed' },
		{ id: 'VB-008', playerName: 'Paolo G.', court: 'Court A', date: 'Mar 22', time: '8:00 AM', players: 4, amount: 500, payment: 'gcash', status: 'confirmed' },
		{ id: 'VB-009', playerName: 'Bea T.', court: 'Court D', date: 'Mar 22', time: '8:00 AM', players: 2, amount: 500, payment: 'at_venue', status: 'confirmed' },
		{ id: 'VB-010', playerName: 'JayR', court: 'Court A', date: 'Mar 22', time: '10:00 AM', players: 4, amount: 500, payment: 'gcash', status: 'confirmed' },
		{ id: 'VB-011', playerName: 'NewPlayer_01', court: 'Court B', date: 'Mar 22', time: '10:00 AM', players: 2, amount: 500, payment: 'gcash', status: 'cancelled' },
		{ id: 'VB-012', playerName: 'Evening League', court: 'Court A-B', date: 'Mar 22', time: '5:00 PM', players: 8, amount: 1000, payment: 'gcash', status: 'confirmed' },
	];

	let filteredBookings = $derived(
		filter === 'all' ? mockBookings : mockBookings.filter(b => b.status === filter)
	);

	let filterCounts = $derived({
		all: mockBookings.length,
		pending: mockBookings.filter(b => b.status === 'pending').length,
		confirmed: mockBookings.filter(b => b.status === 'confirmed').length,
		cancelled: mockBookings.filter(b => b.status === 'cancelled').length
	});

	function statusColor(status: string): string {
		if (status === 'confirmed') return 'bg-emerald-50 text-emerald-700';
		if (status === 'pending') return 'bg-amber-50 text-amber-700';
		return 'bg-red-50 text-red-700';
	}

	function paymentLabel(p: string): string {
		return p === 'gcash' ? 'GCash' : 'At venue';
	}

	// Week calendar
	const weekDays = [
		{ day: 'Mon', date: '16', bookings: 8 },
		{ day: 'Tue', date: '17', bookings: 11 },
		{ day: 'Wed', date: '18', bookings: 6 },
		{ day: 'Thu', date: '19', bookings: 13 },
		{ day: 'Fri', date: '20', bookings: 15 },
		{ day: 'Sat', date: '21', bookings: 18 },
		{ day: 'Sun', date: '22', bookings: 14, isToday: true },
	];
</script>

<svelte:head>
	<title>Bookings - Bohol Pickle Hub</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 max-w-6xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold tracking-tight">Bookings</h1>
		<p class="mt-1 text-sm text-muted-foreground">Manage court reservations and confirmations.</p>
	</div>

	<!-- Week calendar strip -->
	<div class="mb-6 rounded-xl border border-border bg-background p-4">
		<div class="flex items-center justify-between mb-3">
			<button class="rounded-lg p-1.5 hover:bg-muted transition-colors">
				<ChevronLeft class="h-4 w-4" />
			</button>
			<h3 class="text-sm font-bold">March 16 - 22, 2026</h3>
			<button class="rounded-lg p-1.5 hover:bg-muted transition-colors">
				<ChevronRight class="h-4 w-4" />
			</button>
		</div>
		<div class="grid grid-cols-7 gap-1.5">
			{#each weekDays as wd}
				<button class="rounded-xl py-2 text-center transition-all {wd.isToday ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25' : 'hover:bg-muted'}">
					<p class="text-[10px] font-medium {wd.isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}">{wd.day}</p>
					<p class="text-sm font-bold">{wd.date}</p>
					<p class="text-[10px] font-medium {wd.isToday ? 'text-primary-foreground/70' : 'text-muted-foreground'}">{wd.bookings} bk</p>
				</button>
			{/each}
		</div>
	</div>

	<!-- Filter tabs -->
	<div class="mb-4 flex flex-wrap gap-2">
		{#each (['all', 'pending', 'confirmed', 'cancelled'] as const) as f}
			<button
				onclick={() => { filter = f; }}
				class="rounded-lg px-3 py-1.5 text-sm font-medium transition-all capitalize {filter === f ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:text-foreground hover:bg-muted'}"
			>
				{f}
				<span class="ml-1 text-xs opacity-70">{filterCounts[f]}</span>
			</button>
		{/each}
	</div>

	<!-- Bookings list -->
	<div class="rounded-xl border border-border bg-background overflow-hidden">
		<!-- Table header (desktop) -->
		<div class="hidden sm:grid grid-cols-[1fr_100px_80px_80px_80px_80px_100px] gap-4 border-b border-border bg-muted/30 px-4 py-3">
			<span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Player</span>
			<span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Court</span>
			<span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Time</span>
			<span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Players</span>
			<span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Amount</span>
			<span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Payment</span>
			<span class="text-xs font-bold text-muted-foreground uppercase tracking-wider">Actions</span>
		</div>

		<!-- Booking rows -->
		<div class="divide-y divide-border">
			{#each filteredBookings as booking (booking.id)}
				<!-- Desktop row -->
				<div class="hidden sm:grid grid-cols-[1fr_100px_80px_80px_80px_80px_100px] gap-4 items-center px-4 py-3 hover:bg-muted/20 transition-colors">
					<div>
						<p class="text-sm font-bold">{booking.playerName}</p>
						<span class="inline-flex items-center rounded-md px-1.5 py-0.5 text-[10px] font-medium capitalize {statusColor(booking.status)}">{booking.status}</span>
					</div>
					<p class="text-sm">{booking.court}</p>
					<p class="text-sm">{booking.time}</p>
					<p class="text-sm">{booking.players}</p>
					<p class="text-sm font-medium">{formatPeso(booking.amount)}</p>
					<p class="text-xs text-muted-foreground">{paymentLabel(booking.payment)}</p>
					<div class="flex gap-1">
						{#if booking.status === 'pending'}
							<button class="rounded-md bg-emerald-500/10 p-1.5 text-emerald-600 hover:bg-emerald-500/20 transition-colors" title="Confirm">
								<Check class="h-3.5 w-3.5" />
							</button>
							<button class="rounded-md bg-red-500/10 p-1.5 text-red-600 hover:bg-red-500/20 transition-colors" title="Cancel">
								<X class="h-3.5 w-3.5" />
							</button>
						{:else}
							<span class="text-xs text-muted-foreground">--</span>
						{/if}
					</div>
				</div>

				<!-- Mobile card -->
				<div class="sm:hidden p-4 space-y-2">
					<div class="flex items-center justify-between">
						<div class="flex items-center gap-2">
							<div class="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
								{booking.playerName.charAt(0)}
							</div>
							<div>
								<p class="text-sm font-bold">{booking.playerName}</p>
								<p class="text-xs text-muted-foreground">{booking.court} at {booking.time}</p>
							</div>
						</div>
						<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium capitalize {statusColor(booking.status)}">{booking.status}</span>
					</div>
					<div class="flex items-center justify-between text-sm">
						<span class="text-muted-foreground">{booking.players} players -- {paymentLabel(booking.payment)}</span>
						<span class="font-bold">{formatPeso(booking.amount)}</span>
					</div>
					{#if booking.status === 'pending'}
						<div class="flex gap-2 pt-1">
							<button class="flex-1 rounded-lg bg-emerald-500/10 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-500/20">Confirm</button>
							<button class="flex-1 rounded-lg bg-red-500/10 py-1.5 text-xs font-bold text-red-700 hover:bg-red-500/20">Cancel</button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>
