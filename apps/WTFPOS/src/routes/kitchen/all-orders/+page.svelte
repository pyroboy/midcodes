<script lang="ts">
	import { orders as allOrders, menuItems, addItemToOrder } from '$lib/stores/pos.svelte';
	import { formatCountdown, cn } from '$lib/utils';
	import type { Order, MenuItem } from '$lib/types';

	const activeOrders = $derived(
		allOrders.filter((o) => o.status === 'open' || o.status === 'pending_payment')
	);

	function ageMs(createdAt: string) { return Date.now() - new Date(createdAt).getTime(); }
	function timerText(createdAt: string): string {
		const s = Math.floor(ageMs(createdAt) / 1000);
		return formatCountdown(s);
	}

	function getPendingItemCount(order: Order) {
		return order.items.filter(i => i.status === 'pending' || i.status === 'cooking').length;
	}

	// ==== Modals State ====
	let selectedOrder = $state<Order | null>(null);
	let showItemPicker = $state(false);

	// Notes editing in order modal
	let editingOrderNotes = $state(false);
	let tempOrderNotes = $state('');

	// Item picker state
	let activeCategory = $state<'meats' | 'dishes' | 'drinks'>('meats');
	const allowedCategories = ['meats', 'dishes', 'drinks'] as const;
	
	const filteredItems = $derived(
		menuItems.value.filter((m) => m.category === activeCategory && m.available)
	);

	// Quick add item state
	let selectedMenuItem = $state<MenuItem | null>(null);
	let itemNote = $state('');

	function openOrderModal(order: Order) {
		selectedOrder = order;
		tempOrderNotes = order.notes ?? '';
		editingOrderNotes = false;
	}

	function saveOrderNotes() {
		if (selectedOrder) {
			selectedOrder.notes = tempOrderNotes;
		}
		editingOrderNotes = false;
	}

	function confirmAddItem() {
		if (selectedOrder && selectedMenuItem) {
			addItemToOrder(selectedOrder.id, selectedMenuItem, 1, undefined, false, itemNote);
			selectedMenuItem = null;
			itemNote = '';
			showItemPicker = false;
		}
	}
</script>

<div class="flex h-full flex-col">
	<div class="flex items-center justify-between mb-6">
		<h1 class="flex items-center gap-2 text-xl font-bold text-gray-900">
			<span class="text-lg">🧾</span> All Active Orders
		</h1>
		<div class="flex items-center gap-2">
			<span class="badge-orange">{activeOrders.length} Orders</span>
		</div>
	</div>

	{#if activeOrders.length === 0}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center text-gray-400">
				<div class="mb-3 text-5xl">✅</div>
				<p class="text-lg font-semibold">No active orders</p>
			</div>
		</div>
	{:else}
		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-8">
			{#each activeOrders as order (order.id)}
				{@const pendingCount = getPendingItemCount(order)}
				<button
					onclick={() => openOrderModal(order)}
					class="flex flex-col text-left rounded-xl border-2 border-border bg-surface overflow-hidden hover:border-accent hover:shadow-md transition-all active:scale-[0.98]"
				>
					<div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-border">
						<div class="flex items-center gap-2">
							{#if order.orderType === 'dine-in'}
								<span class="rounded bg-accent px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">Dine-In</span>
								<span class="font-extrabold text-gray-900">T{order.tableNumber}</span>
							{:else}
								<span class="rounded bg-purple-500 px-1.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">Takeout</span>
								<span class="font-extrabold text-gray-900 truncate max-w[100px]">{order.customerName}</span>
							{/if}
						</div>
						<span class={cn(
							'rounded-full px-2 py-0.5 font-mono text-xs font-bold',
							ageMs(order.createdAt) > 30 * 60_000 ? 'bg-status-red text-white' : 'bg-gray-200 text-gray-700'
						)}>
							⏱ {timerText(order.createdAt)}
						</span>
					</div>

					<div class="flex flex-col flex-1 p-4 gap-3">
						<div class="flex items-center justify-between">
							<span class="text-xs font-semibold text-gray-500 uppercase tracking-widest">Kitchen Status</span>
							{#if pendingCount > 0}
								<span class="badge-red">{pendingCount} Pending</span>
							{:else}
								<span class="badge-green">All Served</span>
							{/if}
						</div>

						<div class="text-sm font-medium text-gray-700 flex-1">
							{order.items.length} total items
						</div>

						{#if order.notes}
							<div class="mt-2 rounded bg-yellow-50 p-2 text-xs text-yellow-800 border border-yellow-200">
								<span class="font-bold">📝 Note:</span> {order.notes}
							</div>
						{/if}
					</div>
				</button>
			{/each}
		</div>
	{/if}
</div>

<!-- ORDER DETAIL MODAL -->
{#if selectedOrder}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6 lg:p-8">
		<div class="pos-card flex h-full max-h-[800px] w-full max-w-4xl flex-col overflow-hidden shadow-2xl">
			
			<!-- Modal Header -->
			<div class="flex shrink-0 items-center justify-between border-b border-border bg-gray-50 px-6 py-4">
				<div class="flex items-center gap-3">
					<h2 class="text-xl font-bold text-gray-900">
						{#if selectedOrder.orderType === 'dine-in'}
							Table {selectedOrder.tableNumber}
						{:else}
							Takeout — {selectedOrder.customerName}
						{/if}
					</h2>
					<span class="rounded-full bg-accent-light px-2.5 py-0.5 text-xs font-bold text-accent">
						⏱ {timerText(selectedOrder.createdAt)}
					</span>
				</div>
				<button onclick={() => selectedOrder = null} class="rounded text-gray-400 hover:text-gray-600 p-1" style="min-height: unset">✕</button>
			</div>

			<!-- Modal Body -->
			<div class="flex flex-1 overflow-hidden">
				
				<!-- Left: Order Notes & Info -->
				<div class="w-1/3 shrink-0 border-r border-border bg-surface p-6 flex flex-col gap-6 overflow-y-auto">
					
					<div class="flex flex-col gap-2">
						<h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">Order Notes</h3>
						{#if editingOrderNotes}
							<textarea 
								bind:value={tempOrderNotes}
								class="pos-input min-h-[100px] resize-none text-sm"
								placeholder="E.g. Customer allergic to peanuts..."
							></textarea>
							<div class="flex gap-2 mt-1">
								<button onclick={saveOrderNotes} class="btn-primary flex-1 py-1.5 text-xs">Save</button>
								<button onclick={() => editingOrderNotes = false} class="btn-secondary flex-1 py-1.5 text-xs">Cancel</button>
							</div>
						{:else}
							<div 
								role="button"
								tabindex="0"
								onclick={() => editingOrderNotes = true}
								onkeydown={(e) => e.key === 'Enter' && (editingOrderNotes = true)}
								class="min-h-[100px] rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
							>
								{#if selectedOrder.notes}
									{selectedOrder.notes}
								{:else}
									<span class="text-gray-400 italic">Click to add order notes...</span>
								{/if}
							</div>
						{/if}
					</div>

					<div class="mt-auto">
						<button 
							onclick={() => showItemPicker = true}
							class="w-full btn-primary py-3 shadow-md border-2 border-accent-dark hover:bg-accent-light hover:text-accent hover:border-accent transition-all"
						>
							+ Add Ala-Carte Item
						</button>
					</div>
				</div>

				<!-- Right: Items List -->
				<div class="flex-1 overflow-y-auto p-6 bg-gray-50">
					<h3 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-4">Order Items ({selectedOrder.items.length})</h3>
					
					<div class="flex flex-col gap-2">
						{#each selectedOrder.items as item (item.id)}
							<div class="flex flex-col rounded-lg border border-border bg-white p-3 shadow-sm">
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-3">
										<span class="flex h-6 w-6 items-center justify-center rounded bg-gray-100 text-xs font-bold text-gray-600">
											{item.quantity}x
										</span>
										<span class="font-medium text-gray-900">{item.menuItemName}</span>
									</div>
									
									<span class={cn(
										'rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
										item.status === 'served' ? 'bg-status-green/10 text-status-green' :
										item.status === 'cancelled' ? 'bg-status-red/10 text-status-red' :
										'bg-status-yellow/20 text-yellow-800'
									)}>
										{item.status}
									</span>
								</div>
								
								{#if item.notes}
									<div class="mt-2 ml-9 text-xs text-blue-600 bg-blue-50/50 p-1.5 rounded inline-block">
										↳ <span class="font-medium">Note:</span> {item.notes}
									</div>
								{/if}
							</div>
						{/each}
					</div>
				</div>

			</div>
		</div>
	</div>
{/if}

<!-- ITEM PICKER MODAL (Ala-Carte Only) -->
{#if showItemPicker && selectedOrder}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 pb-20 pt-10">
		<div class="pos-card flex h-full w-full max-w-5xl flex-col overflow-hidden shadow-2xl">
			
			<div class="flex flex-col shrink-0 border-b border-border bg-surface">
				<div class="flex items-center justify-between px-6 py-4">
					<h2 class="text-lg font-bold text-gray-900">Add Ala-Carte Item</h2>
					<button onclick={() => { showItemPicker = false; selectedMenuItem = null; itemNote = ''; }} class="text-gray-400 hover:text-gray-600 font-bold px-2 py-1" style="min-height: unset">✕</button>
				</div>

				<!-- Categories Tab Bar -->
				<div class="flex gap-1 overflow-x-auto px-4 pb-0 items-end border-t border-border bg-gray-50/50">
					{#each allowedCategories as cat}
						<button
							onclick={() => activeCategory = cat}
							class={cn(
								'rounded-t-lg px-6 py-3 text-sm font-bold capitalize transition-colors',
								activeCategory === cat
									? 'bg-white text-accent border-x border-t border-border'
									: 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 border-x border-t border-transparent border-b border-border'
							)}
							style="min-height: 48px; min-width: unset"
						>
							{cat}
						</button>
					{/each}
					<!-- Spacer to complete the bottom border line -->
					<div class="flex-1 border-b border-border min-h-[48px]"></div>
				</div>
			</div>

			<div class="flex flex-1 overflow-hidden bg-white">
				<!-- Item Grid -->
				<div class="flex-1 overflow-y-auto p-6 bg-gray-50/30">
					<div class="grid grid-cols-3 xl:grid-cols-4 gap-3">
						{#each filteredItems as item (item.id)}
							<button
								onclick={() => { selectedMenuItem = item; itemNote = ''; }}
								class={cn(
									'flex flex-col items-center justify-center gap-2 rounded-xl border-2 p-4 text-center transition-all bg-white shadow-sm',
									selectedMenuItem?.id === item.id
										? 'border-accent bg-accent-light/30 shadow-md scale-[1.02]'
										: 'border-border hover:border-gray-300 hover:bg-gray-50'
								)}
								style="min-height: 120px"
							>
								<span class="text-sm font-bold leading-tight text-gray-900">{item.name}</span>
								<span class="text-xs font-semibold text-gray-500">₱{item.price.toFixed(2)}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Right Panel: Selected Item Details & Notes -->
				<div class="w-80 shrink-0 border-l border-border bg-surface p-6 flex flex-col gap-6">
					{#if selectedMenuItem}
						<div class="flex flex-col gap-1 items-center pb-4 border-b border-dashed border-border text-center">
							<span class="text-xl font-extrabold text-gray-900">{selectedMenuItem.name}</span>
							<span class="text-sm font-semibold text-accent">₱{selectedMenuItem.price.toFixed(2)}</span>
						</div>

						<div class="flex flex-col gap-2 flex-1">
							<label for="itemNote" class="text-xs font-bold uppercase tracking-wider text-gray-500">Item Notes (Optional)</label>
							<textarea 
								id="itemNote"
								bind:value={itemNote}
								placeholder="E.g. extra spicy, well done, no ice..."
								class="pos-input flex-1 resize-none text-sm p-3"
							></textarea>
						</div>

						<div class="shrink-0 pt-4">
							<button
								disabled={!selectedMenuItem}
								onclick={confirmAddItem}
								class="w-full btn-primary py-4 text-sm font-bold tracking-wide shadow-md"
							>
								Add to Order
							</button>
						</div>
					{:else}
						<div class="flex flex-1 items-center justify-center text-center text-gray-400">
							<div>
								<div class="text-4xl mb-3">👈</div>
								<p class="text-sm font-medium">Select an item from the grid</p>
							</div>
						</div>
					{/if}
				</div>
			</div>

		</div>
	</div>
{/if}
