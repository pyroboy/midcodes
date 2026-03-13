<script lang="ts">
	import { kdsTickets } from '$lib/stores/pos/kds.svelte';
	import { markItemServed } from '$lib/stores/pos.svelte';
	import { printKitchenOrder } from '$lib/stores/hardware.svelte';
	import type { KdsTicketItem } from '$lib/types';
	import { formatCountdown, cn } from '$lib/utils';
	import { Printer } from 'lucide-svelte';
	import { untrack } from 'svelte';

	// ── Live timer ──
	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => { now = Date.now(); }, 1000);
		return () => clearInterval(id);
	});

	// ── Merge tickets by orderId, filter to dishes & drinks only ──
	type StoveTicket = {
		orderId: string;
		tableNumber: number | null;
		customerName?: string;
		createdAt: string;
		items: KdsTicketItem[];
	};

	const stoveTickets = $derived.by((): StoveTicket[] => {
		const byOrder = new Map<string, StoveTicket>();
		for (const t of kdsTickets.value) {
			const existing = byOrder.get(t.orderId);
			if (existing) {
				existing.items = [...existing.items, ...t.items];
				if (t.createdAt < existing.createdAt) existing.createdAt = t.createdAt;
			} else {
				byOrder.set(t.orderId, {
					orderId: t.orderId,
					tableNumber: t.tableNumber,
					customerName: t.customerName,
					createdAt: t.createdAt,
					items: [...t.items]
				});
			}
		}
		return Array.from(byOrder.values())
			.map((ticket) => ({
				...ticket,
				items: ticket.items.filter(
					(i) => (i.category === 'dishes' || i.category === 'drinks') && i.status !== 'cancelled'
				)
			}))
			.filter((t) => t.items.some((i) => i.status !== 'served'))
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
	});

	// ── Separate dine-in and takeout ──
	const dineInTickets = $derived(stoveTickets.filter((t) => t.tableNumber !== null));
	const takeoutTickets = $derived(stoveTickets.filter((t) => t.tableNumber === null));

	// ── Stats ──
	const totalPending = $derived(
		stoveTickets.reduce((sum, t) => sum + t.items.filter((i) => i.status !== 'served').length, 0)
	);

	// ── Actions ──
	async function markDone(orderId: string, itemId: string) {
		await markItemServed(orderId, itemId);
	}

	async function completeAll(ticket: StoveTicket) {
		for (const item of ticket.items) {
			if (item.status !== 'served') {
				await markItemServed(ticket.orderId, item.id);
			}
		}
	}

	// ── Print Chit ──
	let printingChitFor = $state<string | null>(null);
	let chitFeedback = $state<{ orderId: string; success: boolean } | null>(null);

	async function printChit(orderId: string) {
		printingChitFor = orderId;
		// Find any KDS ticket for this order to pass its ID
		const ticket = kdsTickets.value.find(t => t.orderId === orderId);
		const result = await printKitchenOrder(ticket?.id ?? orderId);
		chitFeedback = { orderId, success: result.success };
		printingChitFor = null;
		setTimeout(() => { chitFeedback = null; }, 2000);
	}

	// ── Urgency ──
	const WARN_MS = 5 * 60_000;
	const CRIT_MS = 10 * 60_000;

	function urgencyLevel(createdAt: string): 'critical' | 'warning' | 'normal' {
		const ms = now - new Date(createdAt).getTime();
		if (ms > CRIT_MS) return 'critical';
		if (ms > WARN_MS) return 'warning';
		return 'normal';
	}

	function ticketBorderClass(level: ReturnType<typeof urgencyLevel>) {
		if (level === 'critical') return 'border-status-red animate-border-pulse-red';
		if (level === 'warning') return 'border-status-yellow';
		return 'border-border';
	}

	function timerBadgeClass(level: ReturnType<typeof urgencyLevel>) {
		if (level === 'critical') return 'bg-status-red text-white';
		if (level === 'warning') return 'bg-status-yellow text-gray-900';
		return 'bg-gray-100 text-gray-600';
	}

	function timerText(createdAt: string): string {
		return formatCountdown(Math.floor((now - new Date(createdAt).getTime()) / 1000));
	}

	// ── Progress ──
	function ticketProgress(items: KdsTicketItem[]) {
		const total = items.length;
		const served = items.filter((i) => i.status === 'served').length;
		const pct = total > 0 ? (served / total) * 100 : 0;
		return { served, total, pct };
	}

	// ── Live indicator staleness ──
	let lastUpdated = $state(Date.now());
	let isStale = $state(false);

	$effect(() => {
		stoveTickets.length;
		lastUpdated = Date.now();
	});

	$effect(() => {
		const id = setInterval(() => {
			isStale = Date.now() - untrack(() => lastUpdated) > 60_000;
		}, 10_000);
		return () => clearInterval(id);
	});

	// ── Audio: distinct tone for new dish arrival (lower pitch than sides) ──
	let lastTotal = $state(0);
	let isFirstRun = true;

	function playStoveTone() {
		try {
			const ctx = new AudioContext();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.value = 440; // A4 — distinct from sides (660Hz)
			gain.gain.value = 1.5;
			osc.start();
			osc.stop(ctx.currentTime + 0.3);
			osc.onended = () => ctx.close();
		} catch { /* skip if audio unavailable */ }
	}

	$effect(() => {
		const total = stoveTickets.reduce(
			(s, t) => s + t.items.filter((i) => i.status !== 'served').length, 0
		);
		if (isFirstRun) {
			isFirstRun = false;
			lastTotal = total;
			return;
		}
		if (total > lastTotal) playStoveTone();
		lastTotal = total;
	});
</script>

<!-- Header -->
<div class="mb-3 sm:mb-4 flex items-center justify-between">
	<div>
		<h1 class="text-xl font-bold text-gray-900">Stove Queue</h1>
		<p class="text-sm text-gray-500 mt-0.5">
			<span class="font-bold">{totalPending}</span> pending dish{totalPending !== 1 ? 'es' : ''}
		</p>
	</div>
	{#if totalPending > 0}
		<span class="rounded-full bg-accent px-3 py-1 text-sm font-black text-white">
			{totalPending}
		</span>
	{/if}
</div>

<!-- Queue -->
{#if stoveTickets.length === 0}
	<div class="flex flex-1 flex-col items-center justify-center gap-4" style="min-height: 400px">
		<div class="text-center text-gray-400">
			<div class="mb-4 text-6xl">&#9989;</div>
			<p class="text-xl font-bold">No pending dishes</p>
			<p class="text-sm mt-2">New dish/drink orders will appear here automatically</p>
		</div>
	</div>
{:else}
	<!-- Dine-in -->
	{#if dineInTickets.length > 0}
		<div class="grid gap-4 pb-4" style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));">
			{#each dineInTickets as ticket (ticket.orderId)}
				{@const urgency = urgencyLevel(ticket.createdAt)}
				{@const progress = ticketProgress(ticket.items)}

				<div class={cn(
					'flex flex-col rounded-xl border-2 overflow-hidden bg-surface shadow-sm',
					ticketBorderClass(urgency)
				)}>
					<!-- Header -->
					<div class="flex items-center justify-between px-4 py-3 bg-white/60">
						<span class="text-2xl font-black text-gray-900">T{ticket.tableNumber}</span>
						<div class="flex items-center gap-2">
							<span class="text-sm font-bold text-gray-400 font-mono">{progress.served}/{progress.total}</span>
							<span class={cn('rounded-full px-3 py-1 font-mono text-sm font-bold', timerBadgeClass(urgency))}>
								{timerText(ticket.createdAt)}
							</span>
						</div>
					</div>

					<!-- Progress bar -->
					<div class="h-1 bg-gray-100" role="progressbar" aria-valuenow={progress.served} aria-valuemin={0} aria-valuemax={progress.total} aria-label="Dish completion progress">
						<div class="h-full bg-status-green transition-all duration-500" style="width: {progress.pct}%"></div>
					</div>

					<!-- Items -->
					<div class="flex flex-col divide-y divide-border/30">
						{#each ticket.items as item (item.id)}
							{@const isServed = item.status === 'served'}
							<div class={cn('flex items-center gap-3 px-4 py-2', isServed && 'opacity-50')}>
								<div class="flex-1 flex items-center gap-2 min-w-0">
									<span class={cn('text-lg font-medium truncate', isServed && 'line-through text-gray-400')}>
										{item.menuItemName}
									</span>
									{#if item.quantity > 1}
										<span class={cn(
											'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
											isServed ? 'bg-gray-100 text-gray-400' : 'bg-cyan-100 text-cyan-700'
										)}>
											{item.quantity}x
										</span>
									{/if}
								</div>
								{#if isServed}
									<span class="shrink-0 flex items-center justify-center rounded-lg bg-status-green/10 text-status-green text-lg min-h-[56px] w-14 h-14">
										&#10003;
									</span>
								{:else}
									<button
										onclick={() => markDone(ticket.orderId, item.id)}
										class="shrink-0 flex items-center justify-center rounded-lg bg-status-green text-white font-bold text-lg active:scale-95 transition-all no-select min-h-[56px] w-14 h-14"
									>
										&#10003;
									</button>
								{/if}
							</div>
						{/each}
					</div>

					<!-- ALL DONE — dine-in: no chit needed, table service handles delivery -->
					<div class="border-t border-border px-4 py-3">
						<button
							onclick={() => completeAll(ticket)}
							class="w-full rounded-xl bg-status-green text-white font-black text-base uppercase tracking-wide active:scale-95 transition-all hover:bg-emerald-600 no-select"
							style="min-height: 56px"
						>
							ALL DONE &#10003;
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Takeout -->
	{#if takeoutTickets.length > 0}
		<div class="mt-2 mb-2">
			<h2 class="flex items-center gap-2 text-base font-bold text-gray-700 uppercase tracking-wide">
				<span>&#128230; Takeout Orders</span>
				<span class="rounded-full bg-status-purple px-2.5 py-0.5 text-sm font-black text-white">
					{takeoutTickets.length}
				</span>
			</h2>
		</div>
		<div class="grid gap-4 pb-4" style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));">
			{#each takeoutTickets as ticket (ticket.orderId)}
				{@const urgency = urgencyLevel(ticket.createdAt)}
				{@const progress = ticketProgress(ticket.items)}

				<div class={cn(
					'flex flex-col rounded-xl border-2 overflow-hidden bg-surface shadow-sm',
					ticketBorderClass(urgency)
				)}>
					<!-- Header -->
					<div class="flex items-center justify-between px-4 py-3 bg-white/60">
						<span class="flex items-center gap-2">
							<span class="rounded-lg bg-status-purple px-2 py-1 text-xs font-bold text-white">&#128230; TAKEOUT</span>
							<span class="text-lg font-black text-gray-900">{ticket.customerName ?? 'Walk-in'}</span>
						</span>
						<div class="flex items-center gap-2">
							<span class="text-sm font-bold text-gray-400 font-mono">{progress.served}/{progress.total}</span>
							<span class={cn('rounded-full px-3 py-1 font-mono text-sm font-bold', timerBadgeClass(urgency))}>
								{timerText(ticket.createdAt)}
							</span>
						</div>
					</div>

					<div class="h-1 bg-gray-100" role="progressbar" aria-valuenow={progress.served} aria-valuemin={0} aria-valuemax={progress.total} aria-label="Takeout dish progress">
						<div class="h-full bg-status-green transition-all duration-500" style="width: {progress.pct}%"></div>
					</div>

					<div class="flex flex-col divide-y divide-border/30">
						{#each ticket.items as item (item.id)}
							{@const isServed = item.status === 'served'}
							<div class={cn('flex items-center gap-3 px-4 py-2', isServed && 'opacity-50')}>
								<div class="flex-1 flex items-center gap-2 min-w-0">
									<span class={cn('text-lg font-medium truncate', isServed && 'line-through text-gray-400')}>
										{item.menuItemName}
									</span>
									{#if item.quantity > 1}
										<span class={cn(
											'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
											isServed ? 'bg-gray-100 text-gray-400' : 'bg-cyan-100 text-cyan-700'
										)}>
											{item.quantity}x
										</span>
									{/if}
								</div>
								{#if isServed}
									<span class="shrink-0 flex items-center justify-center rounded-lg bg-status-green/10 text-status-green text-lg min-h-[56px] w-14 h-14">
										&#10003;
									</span>
								{:else}
									<button
										onclick={() => markDone(ticket.orderId, item.id)}
										class="shrink-0 flex items-center justify-center rounded-lg bg-status-green text-white font-bold text-lg active:scale-95 transition-all no-select min-h-[56px] w-14 h-14"
									>
										&#10003;
									</button>
								{/if}
							</div>
						{/each}
					</div>

					<div class="border-t border-border px-4 py-3 flex gap-2">
						<button
							onclick={() => completeAll(ticket)}
							class="flex-1 rounded-xl bg-status-green text-white font-black text-base uppercase tracking-wide active:scale-95 transition-all hover:bg-emerald-600 no-select"
							style="min-height: 56px"
						>
							ALL DONE &#10003;
						</button>
						<button
							onclick={() => printChit(ticket.orderId)}
							disabled={printingChitFor === ticket.orderId}
							class={cn(
								'flex items-center justify-center rounded-xl border transition-all active:scale-95',
								chitFeedback?.orderId === ticket.orderId
									? chitFeedback.success
										? 'bg-status-green/10 border-status-green text-status-green'
										: 'bg-red-50 border-status-red text-status-red'
									: 'bg-gray-50 border-border text-gray-500 hover:bg-gray-100'
							)}
							style="min-height: 56px; min-width: 56px"
							title="Print chit"
						>
							<Printer class="w-5 h-5" />
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
{/if}
