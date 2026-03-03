<script lang="ts">
	import { kdsTickets, markItemServed } from '$lib/stores/pos.svelte';
	import TopBar from '$lib/components/TopBar.svelte';
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

	// Group items by category for kitchen display
	function groupItems(items: typeof kdsTickets[number]['items']) {
		const meats  = items.filter((i) => i.category === 'meats'   && i.status !== 'served');
		const dishes = items.filter((i) => (i.category === 'dishes' || i.category === 'drinks' || i.category === 'sides') && i.status !== 'served');
		const extras = items.filter((i) => i.category === 'packages' && i.status !== 'served');
		return { meats, dishes, extras };
	}
</script>

<div class="flex h-screen flex-col overflow-hidden bg-surface-secondary">
	<TopBar />

	<!-- Queue header -->
	<div class="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
		<h1 class="flex items-center gap-2 text-xl font-bold text-gray-900">
			<span class="text-lg">🔍</span> Kitchen Queue
		</h1>
		<div class="flex items-center gap-2">
			<span class="badge-orange">{activeTables} Active Tables</span>
			<span class="badge-orange">{menuOrders} Menu Orders</span>
			<span class="badge-orange">{queueOrders} Queue Orders</span>
		</div>
	</div>

	{#if activeTickets.length === 0}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center text-gray-400">
				<div class="mb-3 text-5xl">✅</div>
				<p class="text-lg font-semibold">No actionable orders yet</p>
			</div>
		</div>
	{:else}
		<div class="flex-1 overflow-x-auto overflow-y-auto p-6">
			<div class="flex gap-4" style="min-width: max-content">
				{#each activeTickets as ticket (ticket.orderId)}
					{@const grouped = groupItems(ticket.items)}
					<div class={cn('flex w-56 shrink-0 flex-col rounded-xl border-2 overflow-hidden', ticketBorderClass(ticket.createdAt))}>
						<!-- Ticket header -->
						<div class="flex items-center justify-between px-4 py-3 bg-white/60">
							<span class="text-lg font-extrabold text-gray-900">T{ticket.tableNumber}</span>
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
					</div>
				{/each}
			</div>
		</div>
	{/if}
</div>
