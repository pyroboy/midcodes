<script lang="ts">
	import { tables, orders, openTable, tickTimers, MENU_ITEMS, addItemToOrder } from '$lib/stores/pos.svelte';
	import type { Table, MenuItem, MenuCategory, DiscountType } from '$lib/types';
	import TopBar from '$lib/components/TopBar.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { formatCountdown, formatPeso, cn } from '$lib/utils';
	import { log } from '$lib/stores/audit.svelte';
	import { recalcOrder } from '$lib/stores/pos.svelte';

	// ─── Timer ───────────────────────────────────────────────────────────────
	$effect(() => {
		const id = setInterval(tickTimers, 1000);
		return () => clearInterval(id);
	});

	// ─── Floor stats ─────────────────────────────────────────────────────────
	const occupied = $derived(tables.filter((t) => t.status !== 'available').length);
	const free     = $derived(tables.filter((t) => t.status === 'available').length);

	const mainTables = $derived(tables.filter((t) => t.zone === 'main'));
	const vipTables  = $derived(tables.filter((t) => t.zone === 'vip'));
	const barTables  = $derived(tables.filter((t) => t.zone === 'bar'));

	// ─── Running Bill Drawer ─────────────────────────────────────────────────
	let selectedTableId = $state<string | null>(null);
	const selectedTable = $derived(selectedTableId ? tables.find((t) => t.id === selectedTableId) : null);
	const activeOrder   = $derived(
		selectedTable?.currentOrderId
			? orders.find((o) => o.id === selectedTable.currentOrderId)
			: null
	);
	const activePax = $derived(activeOrder?.pax ?? 4);

	let paxModalTable = $state<Table | null>(null);

	function handleTableClick(table: Table) {
		if (table.status === 'available') {
			paxModalTable = table;
		} else {
			selectedTableId = table.id;
			showAddItem = false;
		}
	}

	function confirmPax(pax: number) {
		if (paxModalTable) {
			const orderId = openTable(paxModalTable.id, pax);
			selectedTableId = paxModalTable.id;
			showAddItem = true;
			activeCategory = 'packages';
			paxModalTable = null;
		}
	}

	function closeBill() {
		selectedTableId = null;
		showAddItem = false;
	}

	function applyDiscount(type: DiscountType) {
		if (!activeOrder || !selectedTable) return;
		const prev = activeOrder.discountType;
		activeOrder.discountType = (prev === type) ? 'none' : type;
		recalcOrder(activeOrder);
		if (selectedTable) selectedTable.billTotal = activeOrder.total;
		if (activeOrder.discountType === 'none') {
			log.discountRemoved(selectedTable.label);
		} else {
			log.discountApplied(selectedTable.label, activeOrder.discountType, activeOrder.discountAmount);
		}
	}

	function checkout(method: string = 'Cash') {
		if (!activeOrder || !selectedTable) return;
		log.tableClosed(selectedTable.label, activeOrder.total, method);
		activeOrder.status = 'paid';
		selectedTableId = null;
		showAddItem = false;
	}

	// ─── Add to Order Modal ───────────────────────────────────────────────────
	let showAddItem = $state(false);
	let activeCategory = $state<MenuCategory>('packages');

	const categories: { id: MenuCategory; label: string }[] = [
		{ id: 'packages', label: '🎫 Package' },
		{ id: 'meats',    label: '🥩 Meats' },
		{ id: 'sides',    label: '🥬 Sides' },
		{ id: 'dishes',   label: '🍜 Dishes' },
		{ id: 'drinks',   label: '🥤 Drinks' }
	];

	// Filter out packages if there's already one in the active order
	const visibleCategories = $derived(
		activeOrder?.packageId 
			? categories.filter(c => c.id !== 'packages') 
			: categories
	);

	const filteredItems = $derived(MENU_ITEMS.filter((m) => m.category === activeCategory && m.available));

	// Pending items staged before pushing to bill
	let pendingItems = $state<{ item: MenuItem; qty: number; weight?: number; forceFree?: boolean }[]>([]);
	const pendingTotal = $derived(
		pendingItems.reduce((s, p) => {
			if (p.forceFree) return s;
			if (p.item.category === 'packages') return s + (p.item.price * activePax);
			return s + (p.item.isWeightBased ? Math.round((p.weight ?? 0) * (p.item.pricePerGram ?? 0)) : p.item.price) * p.qty;
		}, 0)
	);

	let weightScreenItem = $state<MenuItem | null>(null);
	let weightInput = $state('');

	function tapItem(item: MenuItem) {
		if (item.category === 'packages') {
			// Wipe pending items, set this as the only package
			pendingItems = [{ item, qty: 1, forceFree: false }];
			
			// Auto generated meats
			if (item.meats) {
				for (const meatId of item.meats) {
					const meat = MENU_ITEMS.find(m => m.id === meatId);
					if (meat) pendingItems.push({ item: meat, qty: 1, weight: 150 * activePax, forceFree: true });
				}
			}
			// Auto generated sides
			if (item.autoSides) {
				for (const sideId of item.autoSides) {
					const side = MENU_ITEMS.find(m => m.id === sideId);
					if (side) pendingItems.push({ item: side, qty: 1, forceFree: true });
				}
			}
			activeCategory = 'meats';
			return;
		}

		if (item.isWeightBased) { 
			weightScreenItem = item; 
			weightInput = ''; 
			return; 
		}
		
		const existing = pendingItems.find((p) => p.item.id === item.id);
		if (existing) existing.qty++;
		else pendingItems.push({ item, qty: 1, forceFree: false });
	}

	function commitMeat(weight: number) {
		if (!weightScreenItem || isNaN(weight) || weight <= 0) return;
		pendingItems.push({ item: weightScreenItem, qty: 1, weight, forceFree: true });
		weightScreenItem = null;
	}

	function changeQty(idx: number, delta: number) {
		const p = pendingItems[idx];
		if (p.item.isWeightBased) {
			p.weight = Math.max(0, (p.weight || 0) + delta * 50); // snap 50g
			if (p.weight === 0) pendingItems.splice(idx, 1);
		} else {
			p.qty += delta;
			if (p.qty <= 0) pendingItems.splice(idx, 1);
		}
	}

	function chargeToTable() {
		if (!activeOrder) return;
		for (const p of pendingItems) {
			addItemToOrder(activeOrder.id, p.item, p.qty, p.weight, p.forceFree);
		}
		pendingItems = [];
		showAddItem = false;
	}

	function undoPending() { pendingItems = []; }

	// ─── Table card style helpers ─────────────────────────────────────────────
	function tableCardClass(t: Table) {
		let base = 'relative overflow-hidden ';
		if (t.status === 'available') return base + 'table-card-available';
		if (t.status === 'critical')  return base + 'table-card-critical';
		if (t.status === 'warning')   return base + 'table-card-warning';
		return base + 'table-card-occupied';
	}

	function timerClass(t: Table) {
		if (t.status === 'critical') return 'text-status-red font-mono font-bold text-sm';
		if (t.status === 'warning')  return 'text-status-yellow font-mono font-bold text-sm';
		return 'text-accent font-mono font-bold text-sm';
	}

	function timerBadgeClass(t: Table) {
		if (t.status === 'critical') return 'bg-status-red-light text-status-red';
		if (t.status === 'warning')  return 'bg-status-yellow-light text-status-yellow';
		return 'bg-accent-light text-accent';
	}
</script>

<div class="flex h-screen flex-col overflow-hidden bg-surface-secondary">
	<TopBar />

	{#if session.branch === 'all'}
		<div class="flex flex-1 flex-col items-center justify-center gap-4 bg-gray-50">
			<span class="text-5xl">🔒</span>
			<h2 class="text-xl font-bold text-gray-700">Select a specific branch to view the Floor Plan</h2>
			<p class="text-sm text-gray-400">Use the branch selector in the top bar to choose a branch.</p>
		</div>
	{:else}
	<!-- Main: floor + optional bill drawer -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Floor content -->
		<div class="flex flex-1 flex-col overflow-y-auto p-6 gap-5">
			<!-- Header row -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h1 class="text-lg font-bold text-gray-900">FLOOR PLAN</h1>
					<span class="badge-orange">{occupied} occ</span>
					<span class="badge-green">{free} free</span>
				</div>
				<!-- Legend -->
				<div class="flex items-center gap-4 text-xs text-gray-500">
					{#each [['bg-status-green','Available'],['bg-accent','Occupied'],['bg-status-yellow','⚠ Low time'],['bg-status-red','🔴 Critical']] as [color, label]}
						<span class="flex items-center gap-1.5">
							<span class="h-2.5 w-2.5 rounded-full {color}"></span>{label}
						</span>
					{/each}
				</div>
			</div>

			<!-- Two-column layout: Main Dining | Right zones -->
			<div class="flex gap-5 h-full">
				<!-- Main Dining -->
				<div class="flex-1 rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
					<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400">Main Dining</h2>
					<div class="flex flex-wrap gap-3">
						{#each mainTables as table (table.id)}
							<button
								onclick={() => handleTableClick(table)}
								class={cn(tableCardClass(table), selectedTableId === table.id && 'ring-2 ring-offset-2 ring-accent')}
								aria-label="Table {table.label}"
							>
								<div class="flex w-full items-start justify-between">
									<span class="text-base font-extrabold text-gray-900 z-10">{table.label}</span>
									{#if table.status !== 'available'}
										<span class={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold z-10', timerBadgeClass(table))}>
											{table.remainingSeconds !== null ? formatCountdown(table.remainingSeconds) : ''}
										</span>
									{/if}
								</div>
								<div class="mt-1 text-xs text-gray-400 z-10">
									{#if table.currentOrderId}
										{@const o = orders.find(ord => ord.id === table.currentOrderId)}
										{o?.pax ?? table.capacity}p
									{:else}
										{table.capacity}p
									{/if}
								</div>
								{#if table.billTotal}
									<div class="mt-1 font-mono text-sm font-bold text-gray-900 z-10">
										{formatPeso(table.billTotal)}
									</div>
								{/if}
								{#if table.currentOrderId}
									{@const order = orders.find(o => o.id === table.currentOrderId)}
									{#if order?.packageId === 'pkg-pork'}
										<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-400"></div>
									{:else if order?.packageId === 'pkg-beef'}
										<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500"></div>
									{:else if order?.packageId === 'pkg-combo'}
										<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-pink-400 to-purple-500"></div>
									{/if}
								{/if}
							</button>
						{/each}
					</div>

					<!-- Kitchen / Entrance labels (decorative) -->
					<div class="mt-auto flex gap-6 text-xs text-gray-400">
						<span>🍳 KITCHEN COUNTER</span>
						<span>🚪 ENTRANCE</span>
					</div>
				</div>

				<!-- Right zones -->
				<div class="flex w-[260px] flex-col gap-4">
					<!-- VIP / Private -->
					<div class="rounded-xl border border-status-purple/30 bg-status-purple-light p-4 flex flex-col gap-3">
						<h2 class="text-xs font-semibold uppercase tracking-wider text-status-purple">VIP / Private</h2>
						<div class="flex flex-wrap gap-3">
							{#each vipTables as table (table.id)}
								<button
									onclick={() => handleTableClick(table)}
									class={cn(tableCardClass(table), selectedTableId === table.id && 'ring-2 ring-offset-2 ring-accent')}
								>
									<div class="flex w-full items-start justify-between">
										<span class="text-base font-extrabold text-gray-900 z-10">{table.label}</span>
										{#if table.remainingSeconds !== null}
											<span class={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold z-10', timerBadgeClass(table))}>
												{formatCountdown(table.remainingSeconds)}
											</span>
										{/if}
									</div>
									<div class="mt-1 text-xs text-gray-400 z-10">
										{#if table.currentOrderId}
											{@const o = orders.find(ord => ord.id === table.currentOrderId)}
											{o?.pax ?? table.capacity}p
										{:else}
											{table.capacity}p
										{/if}
									</div>
									{#if table.billTotal}
										<div class="mt-1 font-mono text-sm font-bold text-gray-900 z-10">
											{formatPeso(table.billTotal)}
										</div>
									{/if}
									{#if table.currentOrderId}
										{@const order = orders.find(o => o.id === table.currentOrderId)}
										{#if order?.packageId === 'pkg-pork'}
											<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-400"></div>
										{:else if order?.packageId === 'pkg-beef'}
											<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500"></div>
										{:else if order?.packageId === 'pkg-combo'}
											<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-pink-400 to-purple-500"></div>
										{/if}
									{/if}
								</button>
							{/each}
						</div>
					</div>

					<!-- Bar -->
					<div class="rounded-xl border border-border bg-surface p-4 flex flex-col gap-3">
						<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400">Bar</h2>
						<div class="flex flex-wrap gap-3">
							{#each barTables as table (table.id)}
								<button
									onclick={() => handleTableClick(table)}
									class={cn(tableCardClass(table), selectedTableId === table.id && 'ring-2 ring-offset-2 ring-accent')}
								>
									<span class="text-sm font-extrabold text-gray-900 z-10">{table.label}</span>
									<div class="text-xs text-gray-400 z-10">
										{#if table.currentOrderId}
											{@const o = orders.find(ord => ord.id === table.currentOrderId)}
											{o?.pax ?? table.capacity}p
										{:else}
											{table.capacity}p
										{/if}
									</div>
									{#if table.currentOrderId}
										{@const order = orders.find(o => o.id === table.currentOrderId)}
										{#if order?.packageId === 'pkg-pork'}
											<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-pink-400"></div>
										{:else if order?.packageId === 'pkg-beef'}
											<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-500"></div>
										{:else if order?.packageId === 'pkg-combo'}
											<div class="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-pink-400 to-purple-500"></div>
										{/if}
									{/if}
								</button>
							{/each}
						</div>
					</div>
				</div>
			</div>
		</div>

		<!-- Running Bill Drawer -->
		{#if selectedTable && activeOrder}
			<div class="flex w-[380px] shrink-0 flex-col border-l border-border bg-surface overflow-y-auto">
				<!-- Bill Header -->
				<div class="flex flex-col gap-3 border-b border-border px-5 py-4">
					<div class="flex items-center justify-between">
						<button
							onclick={() => { showAddItem = true; pendingItems = []; }}
							class="btn-primary gap-1.5 px-3 text-sm"
							style="min-height: 36px"
						>
							+ ADD
						</button>
						<div class="flex items-center gap-2.5">
							<span class="text-xl font-extrabold text-gray-900">{selectedTable.label}</span>
							<span class="flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-gray-600">
								👥 {activeOrder.pax} pax
							</span>
						</div>
						<button onclick={closeBill} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
					</div>
					{#if activeOrder.packageName}
						<div class="flex items-center justify-between">
							<span class="text-sm font-semibold text-gray-900">🔥 {activeOrder.packageName}</span>
							{#if selectedTable.remainingSeconds !== null}
								<span class={cn('rounded-full px-2.5 py-1 text-xs font-semibold', timerBadgeClass(selectedTable))}>
									⏱ {Math.floor(selectedTable.remainingSeconds / 60)}m
								</span>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Order items -->
				<div class="flex-1 divide-y divide-border-light px-5">
					{#each activeOrder.items as item (item.id)}
						<div class={cn('flex items-start justify-between py-3', item.status === 'cancelled' && 'opacity-50')}>
							<div class="flex flex-col gap-0.5">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-gray-900">{item.menuItemName}</span>
									{#if item.weight}
										<span class="text-xs text-gray-400">{item.weight}g</span>
									{/if}
								</div>
								<span class="text-xs text-gray-400">
									{new Date(activeOrder.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
								</span>
								{#if item.status === 'cancelled'}
									<span class="text-xs italic text-status-red">voided by Manager</span>
								{/if}
							</div>
							<div class="flex items-center gap-2 shrink-0 ml-2">
								{#if item.tag === 'PKG'}
									<div class="flex flex-col items-end">
										<span class="font-mono text-sm font-semibold text-gray-900">{formatPeso(item.unitPrice * item.quantity)}</span>
										<span class="rounded px-2 py-0.5 text-[10px] font-bold bg-accent-light text-accent">PKG</span>
									</div>
								{:else if item.tag === 'FREE'}
									<span class="rounded px-2 py-0.5 text-[10px] font-bold bg-status-green-light text-status-green">FREE</span>
								{:else if item.status === 'cancelled'}
									<span class="rounded px-2 py-0.5 text-[10px] font-bold bg-status-red-light text-status-red">VOID</span>
								{:else}
									<span class="font-mono text-sm font-semibold text-gray-900">{formatPeso(item.unitPrice * item.quantity)}</span>
								{/if}
							</div>
						</div>
					{/each}
				</div>

				<!-- Bill Summary -->
				<div class="border-t border-border px-5 py-4 flex flex-col gap-1">
					<div class="flex justify-between text-sm text-gray-500">
						<span>{activeOrder.items.filter(i => i.status !== 'cancelled').length} items</span>
						<span class="font-mono text-xs text-gray-400">
							cost ≈{formatPeso(activeOrder.subtotal * 0.3)}
						</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-base font-bold text-gray-900">BILL</span>
						<span class="font-mono text-2xl font-extrabold text-gray-900">{formatPeso(activeOrder.total)}</span>
					</div>
				</div>

				<!-- Actions -->
				<div class="flex gap-2 px-5 pb-5">
					<button class="btn-danger flex-1 text-sm" style="min-height: 44px">🗑 Void</button>
					<button onclick={() => checkout('Cash')} class="btn-success flex-1 text-sm" style="min-height: 44px">💳 Checkout</button>
					<button class="btn-secondary px-3 text-sm" style="min-height: 44px">🖨 KOT</button>
				</div>
			</div>
		{/if}
	</div>
	{/if}<!-- end branch lock -->
</div>

<!-- ─── Add to Order Modal ────────────────────────────────────────────────────── -->
{#if showAddItem && activeOrder}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
		<div class="flex h-[700px] w-full max-w-[1100px] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
			<!-- Left panel -->
			<div class="flex flex-1 flex-col overflow-hidden">
				<!-- Header -->
				<div class="flex flex-col gap-1.5 border-b border-border px-6 py-4">
					<h2 class="text-xl font-bold text-gray-900">➕ Add to Order</h2>
					<p class="text-sm text-gray-500">🔥 {activeOrder.packageName ?? selectedTable?.label} · 4 pax</p>
				</div>

				<!-- Category tabs -->
				<div class="flex gap-1 border-b border-border px-6">
					{#each visibleCategories as cat}
						<button
							onclick={() => (activeCategory = cat.id)}
							class={cn(
								'flex h-11 items-center px-3.5 text-sm font-medium transition-colors',
								activeCategory === cat.id
									? 'border-b-2 border-accent text-accent'
									: 'text-gray-500 hover:text-gray-900'
							)}
							style="min-height: unset"
						>
							{cat.label}
						</button>
					{/each}
				</div>

				<!-- FREE banner for sides/packages -->
				{#if activeCategory === 'sides' || activeCategory === 'packages'}
					<div class="flex items-center gap-2 bg-status-green-light px-6 py-2.5">
						<span class="text-xs font-semibold text-status-green">FREE — inventory tracked</span>
					</div>
				{/if}

				<!-- Items grid -->
				<div class="flex-1 overflow-y-auto p-6">
					{#if weightScreenItem}
						<div class="flex h-full flex-col items-center justify-center gap-6">
							<h3 class="text-3xl font-bold text-gray-900">{weightScreenItem.name}</h3>
							<p class="text-sm text-gray-500">Enter weight from scale (grams)</p>
							
							<div class="flex flex-wrap items-center justify-center gap-3 w-[400px]">
								{#each [100, 150, 200, 250, 300, 400] as preset}
									<button onclick={() => commitMeat(preset)} class="btn-secondary font-mono w-[30%]">
										{preset}g
									</button>
								{/each}
							</div>
							
							<div class="mt-4 flex flex-col items-center gap-3">
								<span class="text-xs font-semibold uppercase text-gray-400">Custom Amount</span>
								<div class="flex items-center gap-3">
									<input
										type="number"
										bind:value={weightInput}
										placeholder="e.g. 235"
										class="pos-input text-center font-mono text-xl w-32"
										onkeydown={(e) => e.key === 'Enter' && commitMeat(parseFloat(weightInput))}
									/>
									<button onclick={() => commitMeat(parseFloat(weightInput))} class="btn-primary">Add</button>
								</div>
							</div>
							
							<div class="mt-8">
								<button onclick={() => weightScreenItem = null} class="btn-ghost flex items-center gap-2">
									← Back to Meats
								</button>
							</div>
						</div>
					{:else}
						<div class="grid grid-cols-3 gap-4">
							{#each filteredItems as item (item.id)}
								<button
									onclick={() => tapItem(item)}
									class={cn(
										'flex flex-col gap-2.5 rounded-xl border p-5 text-left transition-all active:scale-[0.98]',
										pendingItems.some(p => p.item.id === item.id)
											? 'border-accent bg-accent-light'
											: 'border-border bg-surface-secondary hover:border-gray-300'
									)}
								>
									{#if item.category === 'packages'}
										<div class="flex items-center justify-between">
											<span class="text-base font-bold text-gray-900">{item.name}</span>
											{#if pendingItems.some(p => p.item.id === item.id)}
												<span class="rounded bg-accent px-2 py-0.5 text-[10px] font-bold text-white">ACTIVE</span>
											{/if}
										</div>
										{#if item.desc}<p class="text-sm text-gray-500">{item.desc}</p>{/if}
										<p class="font-mono text-sm font-bold text-gray-900">₱{item.price}/pax</p>
										{#if item.perks}<p class="text-xs text-status-green">✓ {item.perks}</p>{/if}
									{:else if item.isWeightBased}
										<span class="text-sm font-semibold text-gray-900">{item.name}</span>
										<span class="text-xs text-gray-400">tap to enter weight</span>
										<span class="font-mono text-xs font-bold text-gray-700">₱{((item.pricePerGram ?? 0) * 100).toFixed(0)}/100g</span>
									{:else}
										<span class="text-sm font-semibold text-gray-900">{item.name}</span>
										{#if item.isFree}
											<span class="text-xs font-semibold text-status-green">FREE</span>
										{:else}
											<span class="font-mono text-sm font-bold text-gray-900">{formatPeso(item.price)}</span>
										{/if}
									{/if}
								</button>
							{/each}
						</div>
					{/if}
				</div>
			</div>

			<!-- Pending Sidebar -->
			<div class="flex w-[320px] shrink-0 flex-col border-l border-border bg-surface-secondary">
				<div class="flex flex-col gap-1.5 border-b border-border px-5 py-4">
					<h3 class="text-base font-bold text-gray-900">Pending Items</h3>
					<p class="text-xs text-gray-500">Review items before pushing to the main bill.</p>
					<div class="mt-1 flex items-center gap-2 rounded-md bg-white border border-border px-3 py-1.5 w-fit">
						<span class="text-xs font-semibold text-gray-700">👥 {activePax} Pax</span>
					</div>
				</div>

				<div class="flex-1 overflow-y-auto divide-y divide-border px-5">
					{#if pendingItems.length === 0}
						<div class="flex h-full items-center justify-center text-sm text-gray-400 py-12">
							No items yet
						</div>
					{:else}
						{#each pendingItems as p, idx (p.item.id + idx)}
							<div class="flex items-center justify-between py-3">
								<div class="flex flex-col gap-0.5">
									<div class="flex items-center gap-2">
										<span class="text-sm font-medium text-gray-900">{p.item.name}</span>
										{#if p.item.category === 'packages'}
											<span class="rounded bg-accent-light px-1.5 py-0.5 text-[10px] font-bold text-accent">PKG</span>
										{:else if p.forceFree}
											<span class="rounded bg-status-green-light px-1.5 py-0.5 text-[10px] font-bold text-status-green">FREE</span>
										{/if}
									</div>
									{#if p.weight}<span class="text-xs text-gray-400">{p.weight}g</span>{/if}
								</div>
								<div class="flex items-center gap-1.5">
									<button onclick={() => changeQty(idx, -1)} class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-sm font-bold hover:bg-gray-200" style="min-height: unset">−</button>
									<span class="min-w-[1.5rem] text-center text-sm font-semibold">{p.item.isWeightBased && p.weight ? p.weight / 100 : p.qty}</span>
									<button onclick={() => changeQty(idx, +1)} class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-sm font-bold hover:bg-gray-200" style="min-height: unset">+</button>
								</div>
							</div>
						{/each}
					{/if}
				</div>

				<div class="border-t border-border px-5 py-4 flex flex-col gap-3">
					<div class="flex items-center justify-between">
						<span class="text-sm font-semibold text-gray-500">PENDING TOTAL</span>
						<span class="font-mono text-lg font-extrabold text-gray-900">{formatPeso(pendingTotal)}</span>
					</div>
					<div class="flex gap-2">
						<button onclick={undoPending} class="btn-secondary flex-1 text-sm" style="min-height: 44px">Undo</button>
						<button
							onclick={chargeToTable}
							disabled={pendingItems.length === 0}
							class="flex flex-1 items-center justify-center gap-2 rounded-md bg-accent px-4 text-sm font-semibold text-white hover:bg-accent-dark active:scale-95 disabled:opacity-40"
							style="min-height: 44px"
						>
							⚡ CHARGE ({pendingItems.length})
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>
{/if}

<!-- Pax counter modal before opening table -->
{#if paxModalTable}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[320px] flex flex-col gap-4">
			<h3 class="font-bold text-gray-900">How many guests for {paxModalTable.label}?</h3>
			<div class="grid grid-cols-4 gap-2">
				{#each Array.from({length: 12}, (_, i) => i + 1) as num}
					<button onclick={() => confirmPax(num)} class="btn-secondary h-12 text-lg">
						{num}
					</button>
				{/each}
			</div>
			<div class="flex gap-2 mt-2">
				<button class="btn-ghost flex-1" onclick={() => paxModalTable = null}>Cancel</button>
			</div>
		</div>
	</div>
{/if}
