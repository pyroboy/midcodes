<script lang="ts">
	import { kdsTickets, markItemServed } from '$lib/stores/pos.svelte';
	import { formatCountdown, cn } from '$lib/utils';

	const activeTickets = $derived(
		kdsTickets.filter((t) => t.items.some((i) => i.status !== 'served' && i.status !== 'cancelled'))
	);

	// Stat counts
	const activeTables = $derived(new Set(activeTickets.map((t) => t.tableNumber)).size);
	const menuOrders   = $derived(activeTickets.filter((t) => t.items.some((i) => i.category !== 'meats')).length);
	const queueOrders  = $derived(activeTickets.length);

	function ageMs(createdAt: string) { return Date.now() - new Date(createdAt).getTime(); }

	function ticketBorderClass(createdAt: string) {
		const ms = ageMs(createdAt);
		if (ms > 10 * 60_000) return 'border-status-red bg-status-red-light';
		if (ms > 5 * 60_000)  return 'border-status-yellow bg-status-yellow-light';
		return 'border-border bg-surface';
	}

	function timerText(createdAt: string): string {
		const s = Math.floor(ageMs(createdAt) / 1000);
		return formatCountdown(s);
	}

	// Bump entire ticket
	function bumpAll(orderId: string) {
		const ticket = kdsTickets.find(t => t.orderId === orderId);
		if (!ticket) return;
		for (const item of ticket.items) {
			if (item.status !== 'served' && item.status !== 'cancelled') {
				markItemServed(orderId, item.id);
			}
		}
	}

	// Group items by category for kitchen display
	function groupItems(items: typeof kdsTickets[number]['items']) {
		const meats  = items.filter((i) => i.category === 'meats'   && i.status !== 'served');
		const dishes = items.filter((i) => (i.category === 'dishes' || i.category === 'drinks' || i.category === 'sides') && i.status !== 'served');
		const extras = items.filter((i) => i.category === 'packages' && i.status !== 'served');
		return { meats, dishes, extras };
	}
</script>

<!-- Queue header -->
<div class="flex items-center justify-between mb-6">
	<h1 class="flex items-center gap-2 text-xl font-bold text-gray-900">
		<span class="text-lg">🔍</span> Kitchen Order Queue
	</h1>
	<div class="flex items-center gap-2">
		<span class="badge-orange">{activeTables} Active Tables</span>
		<span class="badge-orange">{menuOrders} Menu Orders</span>
		<span class="badge-orange">{queueOrders} In Queue</span>
	</div>
</div>

{#if activeTickets.length === 0}
	<div class="flex flex-1 items-center justify-center" style="min-height: 400px">
		<div class="text-center text-gray-400">
			<div class="mb-3 text-5xl">✅</div>
			<p class="text-lg font-semibold">No actionable orders</p>
			<p class="text-sm mt-1">New orders will appear here automatically</p>
		</div>
	</div>
{:else}
	<div class="flex gap-4 overflow-x-auto pb-4" style="min-width: max-content">
		{#each activeTickets as ticket (ticket.orderId)}
			{@const grouped = groupItems(ticket.items)}
			<div class={cn('flex w-60 shrink-0 flex-col rounded-xl border-2 overflow-hidden', ticketBorderClass(ticket.createdAt))}>
				<!-- Ticket header -->
				<div class="flex items-center justify-between px-4 py-3 bg-white/60">
					{#if ticket.tableNumber !== null}
											<span class="text-lg font-extrabold text-gray-900">T{ticket.tableNumber}</span>
										{:else}
											<span class="flex items-center gap-1">
												<span class="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">📦</span>
												<span class="text-sm font-extrabold text-gray-900">{ticket.customerName ?? 'Takeout'}</span>
											</span>
										{/if}
					<span class={cn(
						'rounded-full px-2 py-0.5 font-mono text-xs font-bold',
						ageMs(ticket.createdAt) > 10 * 60_000
							? 'bg-status-red text-white'
							: ageMs(ticket.createdAt) > 5 * 60_000
								? 'bg-status-yellow text-white'
								: 'bg-gray-100 text-gray-600'
					)}>
						⏱ {timerText(ticket.createdAt)}
					</span>
				</div>

				<div class="flex flex-col gap-0 divide-y divide-border flex-1 px-4 py-2">
					<!-- MEATS section -->
					{#if grouped.meats.length > 0}
						<div class="py-3">
							<p class="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-status-red">
								🥩 MEATS — {grouped.meats.reduce((s, i) => s + (i.weight ?? 0), 0)}g total
							</p>
							{#each grouped.meats as item (item.id)}
								<div class="flex items-center justify-between py-0.5">
									<div>
										<span class="text-xs font-medium text-gray-900">{item.menuItemName}</span>
										{#if item.weight}<span class="text-[10px] text-gray-400 ml-1">{item.weight}g</span>{/if}
									</div>
									<button
										onclick={() => markItemServed(ticket.orderId, item.id)}
										class="rounded text-[10px] font-semibold text-status-green hover:underline"
										style="min-height: unset"
									>
										✓
									</button>
								</div>
							{/each}
						</div>
					{/if}

					<!-- DISHES & DRINKS section -->
					{#if grouped.dishes.length > 0}
						<div class="py-3">
							<p class="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-status-cyan">
								🍜 DISHES & DRINKS
							</p>
							{#each grouped.dishes as item (item.id)}
								<div class="flex items-center justify-between py-0.5">
									<span class="text-xs font-medium text-gray-900">{item.menuItemName}</span>
									<div class="flex items-center gap-2">
										<span class="text-[10px] text-gray-400">{item.quantity}x</span>
										<button
											onclick={() => markItemServed(ticket.orderId, item.id)}
											class="rounded text-[10px] font-semibold text-status-green hover:underline"
											style="min-height: unset"
										>
											✓
										</button>
									</div>
								</div>
							{/each}
						</div>
					{/if}

					<!-- Package / extras -->
					{#if grouped.extras.length > 0}
						<div class="py-3">
							<p class="mb-1.5 text-[10px] font-bold uppercase tracking-wider text-status-purple">
								🎫 SIDE REQUESTS
							</p>
							{#each grouped.extras as item (item.id)}
								<div class="flex justify-between py-0.5">
									<span class="text-xs font-medium text-gray-900">{item.menuItemName}</span>
									<span class="text-[10px] text-gray-400">{item.quantity}x</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Bump All button -->
				<div class="border-t border-border px-3 py-2">
					<button
						onclick={() => bumpAll(ticket.orderId)}
						class="w-full rounded-lg bg-status-green py-2 text-xs font-bold text-white hover:bg-emerald-600 active:scale-95 transition-all"
						style="min-height: 36px"
					>
						BUMP ALL ✓
					</button>
				</div>
			</div>
		{/each}
	</div>
{/if}
