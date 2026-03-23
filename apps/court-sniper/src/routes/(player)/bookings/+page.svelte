<script lang="ts">
	import { Calendar, MapPin, Users, Clock, CreditCard, Share2, RotateCcw, X, Copy, CheckCircle2 } from 'lucide-svelte';

	type BookingTab = 'upcoming' | 'past' | 'cancelled';
	let activeTab = $state<BookingTab>('upcoming');

	type PaymentStatus = 'paid_gcash' | 'pay_at_venue' | 'refunded';
	type MockBooking = {
		id: string;
		ref: string;
		venue: string;
		court: string;
		address: string;
		date: string;
		time: string;
		players: number;
		maxPlayers: number;
		price: number;
		paymentStatus: PaymentStatus;
		status: 'upcoming' | 'completed' | 'cancelled';
	};

	const mockBookings: MockBooking[] = [
		{
			id: '1', ref: 'CS-A7B3K2', venue: 'Bohol Pickle Hub', court: 'Court A',
			address: 'Island City Mall, Tagbilaran City', date: 'Mar 24, 2026', time: '6:00 AM - 7:00 AM',
			players: 3, maxPlayers: 4, price: 500, paymentStatus: 'paid_gcash', status: 'upcoming'
		},
		{
			id: '2', ref: 'CS-M9X1P4', venue: 'Tagbilaran Sports Center', court: 'Court 2',
			address: 'CPG Ave, Tagbilaran City', date: 'Mar 25, 2026', time: '5:00 PM - 6:00 PM',
			players: 4, maxPlayers: 4, price: 400, paymentStatus: 'pay_at_venue', status: 'upcoming'
		},
		{
			id: '3', ref: 'CS-R2V8N5', venue: 'Cebu Pickle Arena', court: 'Premium Court 1',
			address: 'IT Park, Cebu City', date: 'Mar 29, 2026', time: '7:00 AM - 8:00 AM',
			players: 2, maxPlayers: 4, price: 750, paymentStatus: 'paid_gcash', status: 'upcoming'
		},
		{
			id: '4', ref: 'CS-H4T6W1', venue: 'Bohol Pickle Hub', court: 'Court B',
			address: 'Island City Mall, Tagbilaran City', date: 'Mar 20, 2026', time: '6:00 AM - 7:00 AM',
			players: 4, maxPlayers: 4, price: 500, paymentStatus: 'paid_gcash', status: 'completed'
		},
		{
			id: '5', ref: 'CS-J8K2L9', venue: 'Panglao Beach Courts', court: 'Open Court 1',
			address: 'Alona Beach Rd, Panglao', date: 'Mar 18, 2026', time: '7:00 AM - 8:00 AM',
			players: 4, maxPlayers: 4, price: 350, paymentStatus: 'paid_gcash', status: 'completed'
		},
		{
			id: '6', ref: 'CS-N3P7Q2', venue: 'Davao Pickle Station', court: 'Court 3',
			address: 'J.P. Laurel Ave, Davao City', date: 'Mar 15, 2026', time: '5:00 PM - 6:00 PM',
			players: 2, maxPlayers: 4, price: 600, paymentStatus: 'paid_gcash', status: 'completed'
		},
		{
			id: '7', ref: 'CS-W5Y1Z8', venue: 'Tagbilaran Sports Center', court: 'Court 1',
			address: 'CPG Ave, Tagbilaran City', date: 'Mar 22, 2026', time: '6:00 AM - 7:00 AM',
			players: 4, maxPlayers: 4, price: 400, paymentStatus: 'refunded', status: 'cancelled'
		},
		{
			id: '8', ref: 'CS-F6G0H3', venue: 'Cebu Pickle Arena', court: 'Court 4',
			address: 'IT Park, Cebu City', date: 'Mar 19, 2026', time: '8:00 AM - 9:00 AM',
			players: 1, maxPlayers: 4, price: 750, paymentStatus: 'refunded', status: 'cancelled'
		}
	];

	let filteredBookings = $derived(
		mockBookings.filter(b => {
			if (activeTab === 'upcoming') return b.status === 'upcoming';
			if (activeTab === 'past') return b.status === 'completed';
			return b.status === 'cancelled';
		})
	);

	let tabCounts = $derived({
		upcoming: mockBookings.filter(b => b.status === 'upcoming').length,
		past: mockBookings.filter(b => b.status === 'completed').length,
		cancelled: mockBookings.filter(b => b.status === 'cancelled').length
	});

	function formatPrice(price: number): string {
		return `P${price.toLocaleString()}`;
	}

	function paymentLabel(status: PaymentStatus): string {
		if (status === 'paid_gcash') return 'Paid via GCash';
		if (status === 'pay_at_venue') return 'Pay at venue';
		return 'Refunded';
	}

	function paymentColor(status: PaymentStatus): string {
		if (status === 'paid_gcash') return 'bg-emerald-50 text-emerald-700';
		if (status === 'pay_at_venue') return 'bg-amber-50 text-amber-700';
		return 'bg-red-50 text-red-700';
	}

	let copiedRef = $state<string | null>(null);
	function copyRef(ref: string) {
		copiedRef = ref;
		setTimeout(() => { copiedRef = null; }, 2000);
	}
</script>

<svelte:head>
	<title>My Bookings - Court Sniper</title>
</svelte:head>

<div class="p-4 sm:p-6 lg:p-8 max-w-3xl">
	<div class="mb-6">
		<h1 class="text-2xl font-bold tracking-tight">My Bookings</h1>
		<p class="mt-1 text-sm text-muted-foreground">View and manage your court reservations.</p>
	</div>

	<!-- Tabs -->
	<div class="mb-6 flex gap-1 rounded-xl border border-border bg-muted/50 p-1">
		{#each (['upcoming', 'past', 'cancelled'] as const) as tab}
			<button
				onclick={() => { activeTab = tab; }}
				class="flex-1 rounded-lg py-2.5 text-sm font-medium transition-all {activeTab === tab ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}"
			>
				<span class="capitalize">{tab}</span>
				<span class="ml-1 text-xs {activeTab === tab ? 'text-primary' : 'text-muted-foreground'}">
					{tabCounts[tab]}
				</span>
			</button>
		{/each}
	</div>

	<!-- Booking list -->
	{#if filteredBookings.length === 0}
		<div class="rounded-xl border border-dashed border-border bg-background p-12 text-center">
			<Calendar class="mx-auto h-10 w-10 text-muted-foreground/50 mb-4" />
			<h3 class="text-sm font-medium mb-1">
				{#if activeTab === 'upcoming'}No upcoming bookings
				{:else if activeTab === 'past'}No past bookings
				{:else}No cancelled bookings
				{/if}
			</h3>
			<p class="text-sm text-muted-foreground mb-4">
				{#if activeTab === 'upcoming'}Find a court and book your next session.
				{:else if activeTab === 'past'}Your completed sessions will appear here.
				{:else}Cancelled bookings will show up here.
				{/if}
			</p>
			{#if activeTab === 'upcoming'}
				<a href="/" class="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
					Find a Court
				</a>
			{/if}
		</div>
	{:else}
		<div class="space-y-3">
			{#each filteredBookings as booking (booking.id)}
				<div class="rounded-xl border border-border bg-background overflow-hidden">
					<!-- Booking card header -->
					<div class="p-4 sm:p-5">
						<div class="flex items-start justify-between gap-3">
							<div class="min-w-0">
								<h3 class="text-base font-bold truncate">{booking.venue}</h3>
								<p class="text-sm text-muted-foreground">{booking.court}</p>
							</div>
							<div class="text-right shrink-0">
								<p class="text-lg font-bold text-primary">{formatPrice(booking.price)}</p>
								<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium {paymentColor(booking.paymentStatus)}">
									{paymentLabel(booking.paymentStatus)}
								</span>
							</div>
						</div>

						<!-- Details row -->
						<div class="mt-4 grid grid-cols-2 gap-3 text-sm">
							<div class="flex items-center gap-2 text-muted-foreground">
								<Calendar class="h-3.5 w-3.5 shrink-0" />
								<span>{booking.date}</span>
							</div>
							<div class="flex items-center gap-2 text-muted-foreground">
								<Clock class="h-3.5 w-3.5 shrink-0" />
								<span>{booking.time}</span>
							</div>
							<div class="flex items-center gap-2 text-muted-foreground">
								<MapPin class="h-3.5 w-3.5 shrink-0" />
								<span class="truncate">{booking.address}</span>
							</div>
							<div class="flex items-center gap-2 text-muted-foreground">
								<Users class="h-3.5 w-3.5 shrink-0" />
								<span>{booking.players}/{booking.maxPlayers} players</span>
							</div>
						</div>

						<!-- Booking ref -->
						<div class="mt-3 flex items-center gap-2">
							<span class="font-mono text-xs text-muted-foreground">Ref: {booking.ref}</span>
							<button
								onclick={() => copyRef(booking.ref)}
								class="rounded p-0.5 text-muted-foreground hover:text-foreground transition-colors"
							>
								{#if copiedRef === booking.ref}
									<CheckCircle2 class="h-3.5 w-3.5 text-primary" />
								{:else}
									<Copy class="h-3.5 w-3.5" />
								{/if}
							</button>
						</div>
					</div>

					<!-- Action buttons -->
					<div class="border-t border-border bg-muted/20 px-4 py-3 sm:px-5">
						{#if activeTab === 'upcoming'}
							<div class="flex gap-2">
								<button class="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary/10 px-3 py-2 text-xs font-bold text-primary hover:bg-primary/20 transition-colors">
									<Share2 class="h-3.5 w-3.5" />
									Share with Barkada
								</button>
								<button class="flex items-center justify-center gap-1.5 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors">
									<X class="h-3.5 w-3.5" />
									Cancel
								</button>
							</div>
						{:else if activeTab === 'past'}
							<button class="flex w-full items-center justify-center gap-1.5 rounded-lg border border-border px-3 py-2 text-xs font-medium hover:bg-muted transition-colors">
								<RotateCcw class="h-3.5 w-3.5" />
								Book Again
							</button>
						{:else}
							<p class="text-xs text-muted-foreground text-center">
								This booking was cancelled.
								{#if booking.paymentStatus === 'refunded'}
									Refund has been processed.
								{/if}
							</p>
						{/if}
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
