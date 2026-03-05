<script lang="ts">
	import { kdsTickets, kdsTicketHistory, markItemServed, toggleMenuItemAvailability, menuItems, recallLastTicket } from '$lib/stores/pos.svelte';
	import type { KdsTicket } from '$lib/types';
	import { refuseItem } from '$lib/stores/alert.svelte';
	import { formatCountdown, cn } from '$lib/utils';
	import { printKitchenOrder } from '$lib/stores/hardware.svelte';
	import { TriangleAlert } from 'lucide-svelte';
	import KdsHistoryModal from '$lib/components/kitchen/KdsHistoryModal.svelte';

	let showKdsHistory = $state(false);

	// Auto-print incoming tickets
	$effect(() => {
		const toPrint = activeTickets.filter(t => !t.printStatus || t.printStatus === 'pending');
		for (const ticket of toPrint) {
			ticket.printStatus = 'success'; // optimistic to prevent loop
			printKitchenOrder(ticket.orderId).then(res => {
				if (!res.success) ticket.printStatus = 'failed';
			});
		}
	});

	function retryPrint(ticket: KdsTicket) {
		ticket.printStatus = 'success'; // optimistic
		printKitchenOrder(ticket.orderId).then(res => {
			if (!res.success) ticket.printStatus = 'failed';
		});
	}

	const activeTickets = $derived(
		kdsTickets.value.filter((t) => t.items.some((i) => i.status !== 'served' && i.status !== 'cancelled'))
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
		const ticket = kdsTickets.value.find(t => t.orderId === orderId);
		if (!ticket) return;
		for (const item of ticket.items) {
			if (item.status !== 'served' && item.status !== 'cancelled') {
				markItemServed(orderId, item.id);
			}
		}
	}

	// Group items by category for kitchen display
	function groupItems(items: KdsTicket['items']) {
		const meats  = items.filter((i) => i.category === 'meats'   && i.status !== 'served');
		const dishes = items.filter((i) => (i.category === 'dishes' || i.category === 'drinks' || i.category === 'sides') && i.status !== 'served');
		const extras = items.filter((i) => i.category === 'packages' && i.status !== 'served');
		return { meats, dishes, extras };
	}

	// Helper to check if an item is already 86'd
	function isSoldOut(menuItemId: string): boolean {
		const mi = menuItems.value.find(m => m.name === menuItemId);
		return mi ? !mi.available : false;
	}
	
	async function handleSoldOut(menuItemName: string) {
		const mi = menuItems.value.find(m => m.name === menuItemName);
		if (mi) {
			await toggleMenuItemAvailability(mi.id);
		}
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
		<button
			onclick={() => recallLastTicket()}
			disabled={kdsTicketHistory.value.length === 0}
			class="rounded-lg border border-accent bg-accent-light px-3 py-1.5 text-xs font-bold text-accent hover:bg-orange-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
			style="min-height: 32px"
		>
			↩ Recall Last
		</button>
		<button
			onclick={() => showKdsHistory = true}
			class="rounded-lg border border-border bg-surface px-3 py-1.5 text-xs font-bold text-gray-600 hover:bg-gray-50 transition-colors"
			style="min-height: 32px"
		>
			📋 History {#if kdsTicketHistory.value.length > 0}<span class="ml-1 rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold">{kdsTicketHistory.value.length}</span>{/if}
		</button>
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
			<div class={cn('flex w-60 shrink-0 flex-col rounded-xl border-2 overflow-hidden transition-colors', ticket.printStatus === 'failed' ? 'border-red-500 bg-red-50' : ticketBorderClass(ticket.createdAt))}>
				<!-- Ticket header -->
				<div class="flex items-center justify-between px-4 py-3 bg-white/60">
					<div class="flex items-center gap-2">
						{#if ticket.tableNumber !== null}
							<span class="text-lg font-extrabold text-gray-900">T{ticket.tableNumber}</span>
						{:else}
							<span class="flex items-center gap-1">
								<span class="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white">📦</span>
								<span class="text-sm font-extrabold text-gray-900">{ticket.customerName ?? 'Takeout'}</span>
							</span>
						{/if}

						{#if ticket.printStatus === 'failed'}
							<button onclick={() => retryPrint(ticket)} class="flex items-center gap-0.5 text-[10px] font-bold text-red-600 bg-red-100 px-1.5 py-0.5 rounded cursor-pointer hover:bg-red-200 transition-colors" title="Printer Error. Click to Retry.">
								<TriangleAlert class="w-2.5 h-2.5" /> Retry
							</button>
						{/if}
					</div>
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
								🥩 MEATS — {grouped.meats.reduce((s: number, i: any) => s + (i.weight ?? 0), 0)}g total
							</p>
							{#each grouped.meats as item (item.id)}
								<div class="flex items-center justify-between py-0.5 group">
									<div class="flex-1">
										<span class="text-xs font-medium text-gray-900">{item.menuItemName}</span>
										{#if item.weight}<span class="text-[10px] text-gray-400 ml-1">{item.weight}g</span>{/if}
									</div>
									<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
										<button
											onclick={() => {
												const reason = prompt(`Reason for refusing ${item.menuItemName}?`);
												if (reason) refuseItem(ticket.orderId, ticket.tableNumber, item.menuItemName, reason);
											}}
											class="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-red-100 text-red-600 hover:bg-red-200"
											title="Refuse Item"
										>
											Refuse
										</button>
										<button
											onclick={() => handleSoldOut(item.menuItemName)}
											class={cn('rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider', isSoldOut(item.menuItemName) ? 'bg-status-red text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
											title="Toggle availability in POS"
										>
											{isSoldOut(item.menuItemName) ? 'Sold Out' : 'Mark Sold Out'}
										</button>
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
								<div class="flex items-center justify-between py-0.5 group">
									<div class="flex-1">
										<span class="text-xs font-medium text-gray-900">{item.menuItemName}</span>
									</div>
									<div class="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity mr-2">
										<button
											onclick={() => {
												const reason = prompt(`Reason for refusing ${item.menuItemName}?`);
												if (reason) refuseItem(ticket.orderId, ticket.tableNumber, item.menuItemName, reason);
											}}
											class="rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider bg-red-100 text-red-600 hover:bg-red-200"
											title="Refuse Item"
										>
											Refuse
										</button>
										<button
											onclick={() => handleSoldOut(item.menuItemName)}
											class={cn('rounded px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider', isSoldOut(item.menuItemName) ? 'bg-status-red text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200')}
											title="Toggle availability in POS"
										>
											{isSoldOut(item.menuItemName) ? 'Sold Out' : 'Mark Sold Out'}
										</button>
									</div>
									<div class="flex items-center gap-2 shrink-0">
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

<KdsHistoryModal isOpen={showKdsHistory} onClose={() => showKdsHistory = false} />
