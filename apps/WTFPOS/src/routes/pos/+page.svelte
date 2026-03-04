<script lang="ts">
	import { tables as allTables, orders as allOrders, openTable, closeTable, cleanTable, printBill, voidOrder, tickTimers, MENU_ITEMS, addItemToOrder, createTakeoutOrder } from '$lib/stores/pos.svelte';
	import type { Table, MenuItem, MenuCategory, DiscountType, Order } from '$lib/types';
	import TopBar from '$lib/components/TopBar.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { formatCountdown, formatPeso, cn } from '$lib/utils';
	import { log } from '$lib/stores/audit.svelte';
	import { recalcOrder } from '$lib/stores/pos.svelte';



	// ─── Branch-filtered tables/orders ───────────────────────────────────────────
	const tables = $derived(session.locationId === 'all' ? allTables : allTables.filter(t => t.locationId === session.locationId));
	const orders = $derived(session.locationId === 'all' ? allOrders : allOrders.filter(o => o.locationId === session.locationId));

	// Takeout orders for current branch (open only)
	const takeoutOrders = $derived(orders.filter(o => o.orderType === 'takeout' && o.status === 'open'));

	// ─── Timer ───────────────────────────────────────────────────────────────
	$effect(() => {
		const id = setInterval(tickTimers, 1000);
		return () => clearInterval(id);
	});

	// ─── Floor stats ──────────────────────────────────────────────────────────
	const occupied = $derived(tables.filter((t) => t.status !== 'available').length);
	const free     = $derived(tables.filter((t) => t.status === 'available').length);

	const mainTables = $derived(tables.filter((t) => t.zone === 'main'));

	// ─── Selected Order (dine-in or takeout) ──────────────────────────────────
	let selectedTableId    = $state<string | null>(null);
	let selectedTakeoutId  = $state<string | null>(null);

	const selectedTable = $derived(selectedTableId ? tables.find((t) => t.id === selectedTableId) : null);

	// Active order: either from a table or from a takeout selection
	const activeOrder = $derived((): Order | undefined => {
		if (selectedTakeoutId) return orders.find(o => o.id === selectedTakeoutId);
		if (selectedTable?.currentOrderId) return orders.find(o => o.id === selectedTable.currentOrderId);
		return undefined;
	});

	// Helper to get the active order regardless of type
	const currentActiveOrder = $derived(activeOrder());

	const activePax = $derived(currentActiveOrder?.pax ?? 1);

	let paxModalTable = $state<Table | null>(null);

	function handleTableClick(table: Table) {
		selectedTakeoutId = null;
		if (table.status === 'available') {
			paxModalTable = table;
		} else if (table.status === 'dirty') {
			cleanTable(table.id);
		} else {
			selectedTableId = table.id;
			showAddItem = false;
		}
	}

	function handleTakeoutClick(order: Order) {
		selectedTableId = null;
		selectedTakeoutId = order.id;
		showAddItem = false;
	}

	function confirmPax(pax: number) {
		if (paxModalTable) {
			openTable(paxModalTable.id, pax);
			selectedTableId = paxModalTable.id;
			showAddItem = true;
			activeCategory = 'packages';
			paxModalTable = null;
		}
	}

	function closeBill() {
		selectedTableId   = null;
		selectedTakeoutId = null;
		showAddItem = false;
	}

	function applyDiscount(type: DiscountType) {
		const order = currentActiveOrder;
		if (!order) return;
		const prev = order.discountType;
		order.discountType = (prev === type) ? 'none' : type;
		recalcOrder(order);
		if (selectedTable) selectedTable.billTotal = order.total;
		if (order.discountType === 'none') {
			log.discountRemoved(selectedTable?.label ?? `Takeout`);
		} else {
			log.discountApplied(selectedTable?.label ?? `Takeout`, order.discountType, order.discountAmount);
		}
	}

	// ─── Checkout Modal ──────────────────────────────────────────────────────
	let showCheckout = $state(false);
	let checkoutMethod = $state<'cash' | 'gcash' | 'maya'>('cash');
	let cashTendered = $state<number>(0);

	const checkoutOrder = $derived(showCheckout ? currentActiveOrder : null);
	const cashChange = $derived(checkoutOrder ? Math.max(0, cashTendered - checkoutOrder.total) : 0);
	const canConfirmCheckout = $derived(
		checkoutOrder
			? (checkoutMethod !== 'cash' || cashTendered >= checkoutOrder.total)
			: false
	);

	function openCheckout() {
		if (!currentActiveOrder || currentActiveOrder.items.filter(i => i.status !== 'cancelled').length === 0) return;
		checkoutMethod = 'cash';
		cashTendered = 0;
		showCheckout = true;
	}

	function confirmCheckout() {
		const order = checkoutOrder;
		if (!order || !canConfirmCheckout) return;

		const methodLabel = checkoutMethod === 'cash' ? 'Cash' : checkoutMethod === 'gcash' ? 'GCash' : 'Maya';
		const label = order.orderType === 'takeout'
			? `Takeout (${order.customerName ?? 'Walk-in'})`
			: (selectedTable?.label ?? '');

		// Record payment
		order.payments.push({
			method: checkoutMethod === 'maya' ? 'gcash' : checkoutMethod,
			amount: checkoutMethod === 'cash' ? cashTendered : order.total
		});
		order.status = 'paid';
		order.closedAt = new Date().toISOString();

		// Snapshot receipt data before closing
		receiptOrder = order;
		receiptChange = checkoutMethod === 'cash' ? cashTendered - order.total : 0;
		receiptMethod = methodLabel;

		// Free the table for dine-in
		if (order.tableId) {
			closeTable(order.tableId);
		}

		log.tableClosed(label, order.total, methodLabel);
		showCheckout = false;
		showReceipt = true;
		closeBill();
	}

	function selectCashPreset(amount: number) {
		cashTendered = amount;
	}

	function exactCash() {
		if (checkoutOrder) cashTendered = checkoutOrder.total;
	}

	// ─── Receipt Modal ───────────────────────────────────────────────────────
	let showReceipt = $state(false);
	let receiptOrder = $state<Order | null>(null);
	let receiptChange = $state(0);
	let receiptMethod = $state('');

	// ─── Void Flow ───────────────────────────────────────────────────────────
	let showVoidConfirm = $state(false);
	let voidPin = $state('');
	let voidPinError = $state(false);
	const MANAGER_PIN = '1234';

	function openVoidConfirm() {
		if (!currentActiveOrder) return;
		voidPin = '';
		voidPinError = false;
		showVoidConfirm = true;
	}

	function confirmVoid() {
		if (voidPin !== MANAGER_PIN) {
			voidPinError = true;
			return;
		}
		const order = currentActiveOrder;
		if (!order) return;
		voidOrder(order.id);
		showVoidConfirm = false;
		closeBill();
	}

	// ─── Order History ───────────────────────────────────────────────────────
	let showHistory = $state(false);
	const closedOrders = $derived(
		orders.filter(o => o.status === 'paid' || o.status === 'cancelled')
			.sort((a, b) => (b.closedAt ?? '').localeCompare(a.closedAt ?? ''))
	);

	// ─── New Takeout Modal ────────────────────────────────────────────────────
	let showTakeoutModal = $state(false);
	let takeoutName = $state('');

	function openTakeoutModal() {
		takeoutName = '';
		showTakeoutModal = true;
	}

	function confirmTakeout() {
		const name = takeoutName.trim() || 'Walk-in';
		const orderId = createTakeoutOrder(name);
		selectedTakeoutId = orderId;
		selectedTableId = null;
		showAddItem = true;
		activeCategory = 'dishes';
		showTakeoutModal = false;
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

	// Takeout hides "packages" + "meats"; dine-in hides packages if already set
	const visibleCategories = $derived(
		currentActiveOrder?.orderType === 'takeout'
			? categories.filter(c => c.id !== 'packages' && c.id !== 'meats')
			: (currentActiveOrder?.packageId
				? categories.filter(c => c.id !== 'packages')
				: categories)
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
			pendingItems = [{ item, qty: 1, forceFree: false }];
			if (item.meats) {
				for (const meatId of item.meats) {
					const meat = MENU_ITEMS.find(m => m.id === meatId);
					if (meat) pendingItems.push({ item: meat, qty: 1, weight: 150 * activePax, forceFree: true });
				}
			}
			if (item.autoSides) {
				for (const sideId of item.autoSides) {
					const side = MENU_ITEMS.find(m => m.id === sideId);
					if (side) pendingItems.push({ item: side, qty: 1, forceFree: true });
				}
			}
			activeCategory = 'meats';
			return;
		}
		if (item.isWeightBased) { weightScreenItem = item; weightInput = ''; return; }
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
			p.weight = Math.max(0, (p.weight || 0) + delta * 50);
			if (p.weight === 0) pendingItems.splice(idx, 1);
		} else {
			p.qty += delta;
			if (p.qty <= 0) pendingItems.splice(idx, 1);
		}
	}

	function chargeToOrder() {
		const order = currentActiveOrder;
		if (!order) return;
		for (const p of pendingItems) {
			addItemToOrder(order.id, p.item, p.qty, p.weight, p.forceFree);
		}
		pendingItems = [];
		showAddItem = false;
	}

	function undoPending() { pendingItems = []; }

	// ─── Table card style helpers ─────────────────────────────────────────────
	function tableCardClass(t: Table) {
		let base = 'relative overflow-hidden transition-all ';
		
		// Status colors
		if (t.status === 'available') return base + 'border border-gray-300 bg-white hover:border-accent shadow-sm';
		if (t.status === 'dirty') return base + 'border border-gray-600 bg-gray-700 text-gray-200';
		if (t.status === 'billing') return base + 'border border-orange-500 bg-orange-100 shadow-md';
		
		// Unli-time critical blinking (if it's not billing/dirty)
		if (t.status === 'critical') return base + 'border-2 border-red-500 bg-status-green-light animate-border-pulse-red ring-2 ring-red-500 ring-offset-2';
		if (t.status === 'warning') return base + 'border-2 border-yellow-400 bg-status-green-light shadow-md animate-border-pulse-yellow';
		
		return base + 'border-2 border-emerald-500 bg-emerald-50 shadow-md'; 
	}

	function timerBadgeClass(t: Table) {
		if (t.status === 'critical') return 'bg-red-500 text-white font-bold animate-pulse';
		if (t.status === 'warning')  return 'bg-yellow-400 text-gray-900 font-bold';
		if (t.status === 'billing') return 'bg-orange-500 text-white font-bold';
		if (t.status === 'dirty') return 'bg-gray-800 text-white font-bold';
		return 'bg-emerald-500 text-white';
	}

	// ─── Takeout ticket number label ──────────────────────────────────────────
	function takeoutLabel(order: Order) {
		const idx = takeoutOrders.indexOf(order);
		return `#TO${String(idx + 1).padStart(2, '0')}`;
	}
</script>

<div class="flex h-screen flex-col overflow-hidden bg-surface-secondary">
	<TopBar />

	{#if session.locationId === 'all'}
		<!-- ─── All Branches Overview ─────────────────────────────────────────── -->
		<div class="flex flex-1 flex-col overflow-hidden bg-surface-secondary">

			<!-- Top bar -->
			<div class="flex items-center justify-between border-b border-border px-5 py-2.5">
				<div class="flex items-center gap-2.5">
					<span class="relative flex h-2.5 w-2.5">
						<span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-status-green opacity-60"></span>
						<span class="relative inline-flex h-2.5 w-2.5 rounded-full bg-status-green"></span>
					</span>
					<span class="text-xs font-mono font-bold uppercase tracking-widest text-gray-900">ALL BRANCHES — LIVE</span>
				</div>
				<span class="text-[11px] font-mono uppercase tracking-wider text-gray-600">read only · order taking disabled</span>
			</div>

			<!-- Two-panel split -->
			<div class="flex flex-1 divide-x divide-border overflow-hidden">
				{#each [
					{ id: 'qc',   name: 'Alta Cita' },
					{ id: 'mkti', name: 'Alona'     }
				] as branch (branch.id)}
					{@const bTables = allTables.filter(t => t.locationId === branch.id)}
					{@const bOrders = allOrders.filter(o => o.locationId === branch.id && o.status === 'open')}
					{@const bOcc    = bTables.filter(t => t.status !== 'available').length}
					{@const bFree   = bTables.filter(t => t.status === 'available').length}
					{@const bSales  = bOrders.reduce((s, o) => s + o.total, 0)}

					<div class="flex flex-1 flex-col overflow-hidden">

						<!-- Branch header -->
						<div class="flex items-center justify-between border-b border-border bg-surface px-4 py-2.5">
							<span class="text-sm font-bold uppercase tracking-wide text-gray-900">{branch.name}</span>
							<div class="flex items-center gap-3 text-[11px] font-mono font-bold">
								<span class="text-status-red">{bOcc} OCC</span>
								<span class="text-status-green">{bFree} FREE</span>
								<span class="text-accent font-bold">{formatPeso(bSales)}</span>
							</div>
						</div>

						<!-- Floor snapshot -->
						<div class="relative overflow-hidden" style="min-height: 340px;">
							{#each bTables as t, idx (t.id)}
								{@const tOrder = bOrders.find(o => o.id === t.currentOrderId)}
								<div
									class={cn(
										'absolute flex flex-col rounded-lg px-2.5 py-2',
										t.status === 'available' ? 'border border-status-green bg-status-green-light' :
										t.status === 'critical'  ? 'border border-status-red bg-status-red-light' :
										t.status === 'warning'   ? 'border border-status-yellow bg-status-yellow-light' :
										                           'border border-accent bg-accent-light'
									)}
									style="left: {t.x}px; top: {t.y}px; width: {t.width ?? 82}px;"
								>
									<span class="text-xs font-bold text-gray-900">{t.label}</span>
									{#if t.status !== 'available'}
										<span class={cn('text-[10px] font-mono',
											t.status === 'critical' ? 'text-status-red' :
											t.status === 'warning'  ? 'text-status-yellow' : 'text-accent'
										)}>
											{t.remainingSeconds !== null ? formatCountdown(t.remainingSeconds) : '–'}
										</span>
										{#if tOrder}<span class="text-[10px] font-mono text-gray-400">{tOrder.pax}p</span>{/if}
										{#if t.billTotal}<span class="text-[10px] font-mono text-accent font-bold">{formatPeso(t.billTotal)}</span>{/if}
									{:else}
										<span class="text-[10px] font-mono text-status-green">free</span>
									{/if}
								</div>
							{/each}
						</div>

						<!-- Active orders strip -->
						<div class="flex flex-col gap-1.5 border-t border-border bg-surface px-4 py-3">
							<span class="text-[9px] font-mono font-bold uppercase tracking-widest text-gray-400">Active Orders</span>
							{#if bOrders.length === 0}
								<span class="text-[11px] font-mono text-gray-400">No active orders</span>
							{:else}
								{#each bOrders.slice(0, 4) as order}
									{@const oTable = allTables.find(t => t.id === order.tableId)}
									<div class="flex items-center justify-between text-[11px] font-mono">
										<span class="truncate text-gray-700">
											{#if order.orderType === 'takeout'}
												📦 {order.customerName ?? 'Walk-in'}
											{:else}
												🪑 {oTable?.label ?? '?'} · {order.packageName ?? '–'} · {order.pax}p
											{/if}
										</span>
										<span class="ml-3 shrink-0 font-bold text-accent">{formatPeso(order.total)}</span>
									</div>
								{/each}
								{#if bOrders.length > 4}
									<span class="text-[10px] font-mono text-gray-400">+{bOrders.length - 4} more orders</span>
								{/if}
							{/if}
						</div>

					</div>
				{/each}
			</div>

		</div>
	{:else}
	<!-- Main: floor + optional bill drawer -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Floor content -->
		<div class="flex flex-1 flex-col overflow-y-auto p-6 gap-5">
			<!-- Header row -->
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-3">
					<h1 class="text-lg font-bold text-gray-900">POS</h1>
					<span class="badge-orange">{occupied} occ</span>
					<span class="badge-green">{free} free</span>
				</div>
				<div class="flex items-center gap-4">
					<!-- Legend -->
					<div class="flex items-center gap-3 text-xs font-semibold text-gray-600">
						<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-white border border-gray-300"></span>Available</span>
						<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-emerald-500"></span>Dining (Green)</span>
						<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-orange-500"></span>Ready / Bill (Orange)</span>
						<span class="flex items-center gap-1.5"><span class="h-3 w-3 rounded-full bg-gray-700"></span>Dirty (Dark Gray)</span>
					</div>
					<!-- New Takeout button -->
					<button
						onclick={openTakeoutModal}
						class="flex items-center gap-2 rounded-lg border-2 border-dashed border-orange-300 bg-orange-50 px-4 py-2 text-sm font-semibold text-accent hover:bg-orange-100 transition-colors"
						style="min-height: 40px"
					>
						📦 New Takeout
					</button>
					<!-- Order History button -->
					<button
						onclick={() => showHistory = true}
						class="flex items-center gap-2 rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
						style="min-height: 40px"
					>
						🧾 History {#if closedOrders.length > 0}<span class="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-bold text-gray-600">{closedOrders.length}</span>{/if}
					</button>
				</div>
			</div>

			<!-- Floor map canvas -->
			<div class="flex-1 rounded-xl border border-border bg-surface p-5 flex flex-col gap-4">
				<h2 class="text-xs font-semibold uppercase tracking-wider text-gray-400">Main Dining</h2>
				<div class="relative" style="min-height: 340px;">
					{#each mainTables as table (table.id)}
						<button
							onclick={() => handleTableClick(table)}
							class={cn(tableCardClass(table), selectedTableId === table.id && 'ring-2 ring-offset-2 ring-accent')}
							style="position: absolute; left: {table.x}px; top: {table.y}px; width: {table.width ?? 92}px; height: {table.height ?? 92}px;"
							aria-label="Table {table.label}"
						>
							<div class="flex w-full items-start justify-between">
								<span class="text-base font-extrabold text-gray-900 z-10">{table.label}</span>
								{#if table.status !== 'available'}
									<span class={cn('rounded-full px-1.5 py-0.5 text-[9px] font-semibold z-10', timerBadgeClass(table))}>
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
								<div class="mt-1 font-mono text-xs font-bold text-gray-900 z-10">
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

					<!-- Decorative labels -->
					<div class="absolute bottom-2 left-2 flex gap-6 text-xs text-gray-300">
						<span>🍳 KITCHEN</span>
						<span>🚪 ENTRANCE</span>
					</div>
				</div>

				<!-- Takeout Lane -->
				{#if takeoutOrders.length > 0}
					<div class="border-t border-dashed border-orange-200 pt-4 flex flex-col gap-3">
						<h2 class="text-xs font-semibold uppercase tracking-wider text-accent flex items-center gap-2">
							📦 Takeout Orders
							<span class="rounded-full bg-accent px-2 py-0.5 text-[10px] text-white font-bold">{takeoutOrders.length}</span>
						</h2>
						<div class="flex flex-wrap gap-2">
							{#each takeoutOrders as order (order.id)}
								<button
									onclick={() => handleTakeoutClick(order)}
									class={cn(
										'relative flex flex-col gap-1 rounded-xl border-2 border-dashed px-4 py-3 text-left transition-all active:scale-[0.98]',
										selectedTakeoutId === order.id
											? 'border-accent bg-accent-light'
											: order.items.length === 0
												? 'border-blue-400 bg-blue-50 hover:bg-blue-100 shadow-sm'
												: 'border-orange-200 bg-orange-50 hover:border-orange-300'
									)}
									style="min-width: 120px"
								>
									<span class="font-mono text-[11px] font-bold text-accent">{takeoutLabel(order)}</span>
									<span class="text-sm font-semibold text-gray-900">{order.customerName ?? 'Walk-in'}</span>
									<span class="font-mono text-xs font-bold text-gray-700">{formatPeso(order.total)}</span>
									<span class="text-[10px] text-gray-400">{order.items.filter(i => i.status !== 'cancelled').length} items</span>
									{#if selectedTakeoutId === order.id}
										<span class="absolute top-1.5 right-1.5 rounded bg-accent px-1.5 py-0.5 text-[9px] font-bold text-white">OPEN</span>
									{:else if order.items.length === 0}
										<span class="absolute top-1.5 right-1.5 rounded bg-blue-500 px-1.5 py-0.5 text-[9px] font-bold text-white">NEW</span>
									{/if}
								</button>
							{/each}
						</div>
					</div>
				{/if}
			</div>
		</div>

		<!-- Running Bill Drawer (dine-in or takeout) -->
		<div class="flex w-[380px] shrink-0 flex-col border-l border-border bg-surface overflow-y-auto">
		{#if !currentActiveOrder}
			<!-- Empty state: no table or takeout selected -->
			<div class="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center select-none">
				<div class="flex h-16 w-16 items-center justify-center rounded-full bg-surface-secondary text-3xl">
					🧾
				</div>
				<div class="flex flex-col gap-1.5">
					<span class="text-sm font-semibold text-gray-700">No Table Selected</span>
					<span class="text-xs text-gray-400 leading-relaxed">Tap an occupied table on the floor plan to view its running bill here.</span>
				</div>
				<div class="mt-2 flex flex-col items-center gap-2 text-xs text-gray-400">
					<span class="flex items-center gap-1.5">
						<span class="h-2 w-2 rounded-full bg-status-green inline-block"></span>
						Green = available — tap to open
					</span>
					<span class="flex items-center gap-1.5">
						<span class="h-2 w-2 rounded-full bg-accent inline-block"></span>
						Orange = occupied — tap to view bill
					</span>
				</div>
			</div>
		{:else}
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
							{#if currentActiveOrder.orderType === 'takeout'}
								<span class="flex items-center gap-1.5">
									<span class="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-white">📦 TAKEOUT</span>
									<span class="text-xl font-extrabold text-gray-900">{currentActiveOrder.customerName ?? 'Walk-in'}</span>
								</span>
							{:else}
								<span class="text-xl font-extrabold text-gray-900">{selectedTable?.label}</span>
								<span class="flex items-center gap-1 rounded-full bg-surface-secondary px-2.5 py-1 text-xs font-medium text-gray-600">
									👥 {currentActiveOrder.pax} pax
								</span>
							{/if}
						</div>
						<button onclick={closeBill} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
					</div>
					{#if currentActiveOrder.orderType === 'takeout'}
						<div class="flex items-center gap-2 rounded-lg bg-orange-50 border border-dashed border-orange-200 px-3 py-1.5">
							<span class="font-mono text-xs font-bold text-accent">{takeoutLabel(currentActiveOrder)}</span>
							<span class="text-xs text-gray-500">· Takeout · no timer</span>
						</div>
					{:else if currentActiveOrder.packageName}
						<div class="flex items-center justify-between">
							<span class="text-sm font-semibold text-gray-900">🔥 {currentActiveOrder.packageName}</span>
							{#if selectedTable?.remainingSeconds !== null}
								<span class={cn('rounded-full px-2.5 py-1 text-xs font-semibold', timerBadgeClass(selectedTable!))}>
									⏱ {Math.floor((selectedTable?.remainingSeconds ?? 0) / 60)}m
								</span>
							{/if}
						</div>
					{/if}
				</div>

				<!-- Order items -->
				<div class="flex-1 divide-y divide-border-light px-5">
					{#each currentActiveOrder.items as item (item.id)}
						<div class={cn('flex items-start justify-between py-3', item.status === 'cancelled' && 'opacity-50')}>
							<div class="flex flex-col gap-0.5">
								<div class="flex items-center gap-2">
									<span class="text-sm font-medium text-gray-900">{item.menuItemName}</span>
									{#if item.weight}
										<span class="text-xs text-gray-400">{item.weight}g</span>
									{/if}
								</div>
								<span class="text-xs text-gray-400">
									{new Date(currentActiveOrder.createdAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
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
						<span>{currentActiveOrder.items.filter(i => i.status !== 'cancelled').length} items</span>
					</div>
					<div class="flex items-center justify-between">
						<span class="text-base font-bold text-gray-900">BILL</span>
						<span class="font-mono text-2xl font-extrabold text-gray-900">{formatPeso(currentActiveOrder.total)}</span>
					</div>
				</div>

				<!-- Actions -->
				{#if selectedTable?.status === 'dirty'}
					<div class="flex flex-col gap-2 px-5 pb-5">
						<div class="rounded-lg bg-gray-100 p-4 text-center border border-gray-300">
							<p class="text-xs font-bold text-gray-600 uppercase tracking-widest mb-3">Table Needs Cleaning</p>
							<button onclick={() => { cleanTable(selectedTable.id); closeBill(); }} class="btn-primary w-full shadow-md">
								✨ Mark as Clean
							</button>
						</div>
					</div>
				{:else}
					<div class="flex gap-2 px-5 pb-5">
						<button onclick={openVoidConfirm} class="btn-danger flex-1 text-sm" style="min-height: 44px">🗑 Void</button>
						<button onclick={openCheckout} class="btn-success flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white" style="min-height: 44px">💳 Checkout</button>
						<button onclick={() => printBill(currentActiveOrder.id)} class="btn-secondary px-3 text-sm bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800" style="min-height: 44px">🖨 Print Bill</button>
					</div>
				{/if}
		{/if}
		</div>
	</div>
	{/if}
</div>

<!-- ─── Add to Order Modal ────────────────────────────────────────────────────── -->
{#if showAddItem && currentActiveOrder}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
		<div class="flex h-[700px] w-full max-w-[1100px] overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
			<!-- Left panel -->
			<div class="flex flex-1 flex-col overflow-hidden">
				<!-- Header -->
				<div class="flex flex-col gap-1.5 border-b border-border px-6 py-4">
					{#if currentActiveOrder.orderType === 'takeout'}
						<div class="flex items-center gap-2">
							<span class="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-white">📦 TAKEOUT</span>
							<h2 class="text-xl font-bold text-gray-900">Add to Takeout</h2>
						</div>
						<p class="text-sm text-gray-500">{currentActiveOrder.customerName ?? 'Walk-in'} · {takeoutLabel(currentActiveOrder)}</p>
					{:else}
						<h2 class="text-xl font-bold text-gray-900">➕ Add to Order</h2>
						<p class="text-sm text-gray-500">🔥 {currentActiveOrder.packageName ?? selectedTable?.label} · {currentActiveOrder.pax} pax</p>
					{/if}
				</div>

				<!-- Category tabs (POS-style big buttons) -->
				<div class="flex gap-2 border-b border-border bg-surface-secondary px-6 py-3">
					{#each visibleCategories as cat}
						<button
							onclick={() => (activeCategory = cat.id)}
							class={cn(
								'flex flex-1 flex-col items-center justify-center gap-1 rounded-xl transition-all active:scale-95',
								activeCategory === cat.id
									? 'bg-accent text-white shadow-md'
									: 'border border-border bg-surface text-gray-600 hover:border-gray-300 hover:bg-gray-50'
							)}
							style="min-height: 72px"
						>
							<span class="text-2xl leading-none">{cat.label.split(' ')[0]}</span>
							<span class="text-[11px] font-bold uppercase tracking-wide">{cat.label.split(' ').slice(1).join(' ')}</span>
						</button>
					{/each}
				</div>

				<!-- FREE banner -->
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
					<p class="text-xs text-gray-500">Review items before pushing to the bill.</p>
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
							onclick={chargeToOrder}
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

<!-- ─── Checkout Modal ──────────────────────────────────────────────────────── -->
{#if showCheckout && checkoutOrder}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[460px] flex flex-col gap-0 overflow-hidden p-0">

			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<div class="flex items-center gap-3">
					<span class="text-lg font-bold text-gray-900">Checkout</span>
					{#if checkoutOrder.orderType === 'takeout'}
						<span class="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-white">TAKEOUT</span>
					{:else}
						<span class="text-sm font-semibold text-gray-500">{selectedTable?.label}</span>
					{/if}
				</div>
				<button onclick={() => showCheckout = false} class="text-gray-400 hover:text-gray-600 text-lg" style="min-height: unset">✕</button>
			</div>

			<!-- Bill Breakdown -->
			<div class="flex flex-col gap-2 border-b border-border px-6 py-4 bg-surface-secondary">
				<div class="flex justify-between text-sm text-gray-600">
					<span>Subtotal ({checkoutOrder.items.filter(i => i.status !== 'cancelled').length} items)</span>
					<span class="font-mono font-semibold">{formatPeso(checkoutOrder.subtotal)}</span>
				</div>
				{#if checkoutOrder.discountType !== 'none'}
					<div class="flex justify-between text-sm text-status-green">
						<span>Discount ({checkoutOrder.discountType === 'senior' ? 'Senior 20%' : 'PWD 20%'})</span>
						<span class="font-mono font-semibold">-{formatPeso(checkoutOrder.discountAmount)}</span>
					</div>
				{/if}
				<div class="flex justify-between text-sm text-gray-500">
					<span>VAT {checkoutOrder.discountType === 'senior' || checkoutOrder.discountType === 'pwd' ? '(exempt)' : '(inclusive)'}</span>
					<span class="font-mono">{formatPeso(checkoutOrder.vatAmount)}</span>
				</div>
				<div class="flex justify-between border-t border-border pt-2 mt-1">
					<span class="text-base font-bold text-gray-900">TOTAL</span>
					<span class="font-mono text-2xl font-extrabold text-gray-900">{formatPeso(checkoutOrder.total)}</span>
				</div>
			</div>

			<!-- Discount Toggles -->
			<div class="flex items-center gap-2 border-b border-border px-6 py-3">
				<span class="text-xs font-semibold text-gray-500 mr-auto">Discount:</span>
				<button
					onclick={() => applyDiscount('senior')}
					class={cn(
						'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
						checkoutOrder.discountType === 'senior'
							? 'bg-status-green text-white'
							: 'border border-border bg-surface text-gray-600 hover:bg-gray-50'
					)}
					style="min-height: 32px"
				>
					👴 Senior
				</button>
				<button
					onclick={() => applyDiscount('pwd')}
					class={cn(
						'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
						checkoutOrder.discountType === 'pwd'
							? 'bg-status-green text-white'
							: 'border border-border bg-surface text-gray-600 hover:bg-gray-50'
					)}
					style="min-height: 32px"
				>
					♿ PWD
				</button>
			</div>

			<!-- Payment Method -->
			<div class="flex flex-col gap-3 border-b border-border px-6 py-4">
				<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Payment Method</span>
				<div class="grid grid-cols-3 gap-2">
					{#each [
						{ id: 'cash' as const, label: '💵 Cash' },
						{ id: 'gcash' as const, label: '📱 GCash' },
						{ id: 'maya' as const, label: '📱 Maya' }
					] as method}
						<button
							onclick={() => { checkoutMethod = method.id; if (method.id !== 'cash') cashTendered = 0; }}
							class={cn(
								'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95',
								checkoutMethod === method.id
									? 'bg-accent text-white shadow-md'
									: 'border border-border bg-surface text-gray-700 hover:border-gray-300 hover:bg-gray-50'
							)}
							style="min-height: 48px"
						>
							{method.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Cash Tendered (only for cash) -->
			{#if checkoutMethod === 'cash'}
				<div class="flex flex-col gap-3 border-b border-border px-6 py-4">
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Cash Tendered</span>
						<button onclick={exactCash} class="text-xs font-semibold text-accent hover:underline" style="min-height: unset">Exact</button>
					</div>

					<!-- Amount display -->
					<div class="flex items-center justify-center rounded-xl bg-surface-secondary border border-border py-3">
						<span class={cn(
							'font-mono text-3xl font-extrabold',
							cashTendered > 0 ? 'text-gray-900' : 'text-gray-300'
						)}>
							{cashTendered > 0 ? formatPeso(cashTendered) : '₱0.00'}
						</span>
					</div>

					<!-- Quick denominations -->
					<div class="grid grid-cols-4 gap-2">
						{#each [20, 50, 100, 200, 500, 1000, 1500, 2000] as amount}
							<button
								onclick={() => selectCashPreset(amount)}
								class={cn(
									'rounded-lg py-2 font-mono text-sm font-bold transition-all active:scale-95',
									cashTendered === amount
										? 'bg-accent text-white'
										: 'border border-border bg-surface text-gray-700 hover:bg-gray-50'
								)}
								style="min-height: 40px"
							>
								₱{amount.toLocaleString()}
							</button>
						{/each}
					</div>

					<!-- Custom input -->
					<input
						type="number"
						bind:value={cashTendered}
						placeholder="Enter custom amount"
						class="pos-input text-center font-mono text-lg"
						min="0"
					/>

					<!-- Change -->
					{#if cashTendered >= checkoutOrder.total}
						<div class="flex items-center justify-between rounded-xl bg-status-green-light border border-status-green/20 px-4 py-3">
							<span class="text-sm font-semibold text-status-green">Change</span>
							<span class="font-mono text-2xl font-extrabold text-status-green">{formatPeso(cashChange)}</span>
						</div>
					{:else if cashTendered > 0}
						<div class="flex items-center justify-between rounded-xl bg-status-red-light border border-status-red/20 px-4 py-2">
							<span class="text-xs font-semibold text-status-red">Short by {formatPeso(checkoutOrder.total - cashTendered)}</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Confirm / Cancel -->
			<div class="flex gap-3 px-6 py-4">
				<button
					onclick={() => showCheckout = false}
					class="btn-ghost flex-1"
					style="min-height: 48px"
				>
					Cancel
				</button>
				<button
					onclick={confirmCheckout}
					disabled={!canConfirmCheckout}
					class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-status-green text-white text-base font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
					style="min-height: 48px"
				>
					✓ Confirm Payment
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- New Takeout Modal -->
{#if showTakeoutModal}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[340px] flex flex-col gap-5">
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold text-gray-900">📦 New Takeout Order</h3>
				<p class="text-sm text-gray-500">Enter customer name or alias (optional)</p>
			</div>
			<input
				type="text"
				bind:value={takeoutName}
				placeholder="e.g. Maria, Table 5 pickup, etc."
				class="pos-input"
				onkeydown={(e) => e.key === 'Enter' && confirmTakeout()}
			/>
			<div class="flex gap-2">
				<button class="btn-ghost flex-1" onclick={() => showTakeoutModal = false}>Cancel</button>
				<button class="btn-primary flex-1" onclick={confirmTakeout}>
					✓ Create Order
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ─── Receipt Modal ──────────────────────────────────────────────────────── -->
{#if showReceipt && receiptOrder}
	<div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[380px] flex flex-col gap-0 overflow-hidden p-0">
			<!-- Receipt Header -->
			<div class="flex flex-col items-center gap-1 border-b border-dashed border-gray-300 px-6 py-5 bg-surface">
				<span class="text-2xl">✓</span>
				<span class="text-lg font-bold text-gray-900">Payment Successful</span>
				<span class="text-xs text-gray-500">
					{receiptOrder.orderType === 'takeout'
						? `Takeout — ${receiptOrder.customerName ?? 'Walk-in'}`
						: `Table ${receiptOrder.tableNumber}`}
				</span>
			</div>

			<!-- Receipt Body -->
			<div class="flex flex-col gap-2 border-b border-dashed border-gray-300 px-6 py-4 font-mono text-sm">
				{#each receiptOrder.items.filter(i => i.status !== 'cancelled') as item}
					<div class="flex justify-between">
						<span class="text-gray-700 truncate max-w-[200px]">
							{item.quantity > 1 ? `${item.quantity}× ` : ''}{item.menuItemName}
							{#if item.weight}<span class="text-gray-400"> {item.weight}g</span>{/if}
						</span>
						{#if item.tag === 'FREE'}
							<span class="text-status-green text-xs font-bold">FREE</span>
						{:else}
							<span class="text-gray-900">{formatPeso(item.unitPrice * item.quantity)}</span>
						{/if}
					</div>
				{/each}

				<div class="border-t border-dashed border-gray-200 my-1"></div>

				<div class="flex justify-between text-gray-600">
					<span>Subtotal</span>
					<span>{formatPeso(receiptOrder.subtotal)}</span>
				</div>
				{#if receiptOrder.discountType !== 'none'}
					<div class="flex justify-between text-status-green">
						<span>Discount ({receiptOrder.discountType === 'senior' ? 'SC' : 'PWD'} 20%)</span>
						<span>-{formatPeso(receiptOrder.discountAmount)}</span>
					</div>
				{/if}
				<div class="flex justify-between text-gray-500 text-xs">
					<span>VAT {receiptOrder.discountType !== 'none' ? '(exempt)' : '(inclusive)'}</span>
					<span>{formatPeso(receiptOrder.vatAmount)}</span>
				</div>
				<div class="flex justify-between font-bold text-gray-900 text-base border-t border-gray-200 pt-1">
					<span>TOTAL</span>
					<span>{formatPeso(receiptOrder.total)}</span>
				</div>

				<div class="border-t border-dashed border-gray-200 mt-1 pt-2">
					<div class="flex justify-between">
						<span class="text-gray-600">Paid via</span>
						<span class="font-bold text-gray-900">{receiptMethod}</span>
					</div>
					{#if receiptMethod === 'Cash'}
						<div class="flex justify-between">
							<span class="text-gray-600">Tendered</span>
							<span>{formatPeso(receiptOrder.total + receiptChange)}</span>
						</div>
						<div class="flex justify-between text-status-green font-bold">
							<span>Change</span>
							<span>{formatPeso(receiptChange)}</span>
						</div>
					{/if}
				</div>
			</div>

			<!-- Receipt Footer -->
			<div class="flex flex-col items-center gap-1 border-b border-dashed border-gray-300 px-6 py-3 text-center">
				<span class="text-[10px] text-gray-400 font-mono">
					{new Date(receiptOrder.closedAt ?? '').toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' })}
				</span>
				<span class="text-[10px] text-gray-400 font-mono">WTF! Samgyupsal — Thank you!</span>
			</div>

			<div class="flex gap-3 px-6 py-4">
				<button
					onclick={() => { showReceipt = false; receiptOrder = null; }}
					class="btn-primary flex-1"
					style="min-height: 44px"
				>
					Done
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ─── Void Confirmation Modal (Manager PIN) ─────────────────────────────── -->
{#if showVoidConfirm}
	<div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[340px] flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold text-status-red">Void Order</h3>
				<p class="text-sm text-gray-500">This will cancel the entire order and free the table. Enter Manager PIN to confirm.</p>
			</div>

			<!-- PIN dots -->
			<div class="flex flex-col gap-2">
				<div class="flex justify-center gap-3">
					{#each [0, 1, 2, 3] as idx}
						<div class={cn(
							'h-4 w-4 rounded-full border-2 transition-all',
							idx < voidPin.length
								? (voidPinError ? 'bg-status-red border-status-red' : 'bg-accent border-accent')
								: 'border-gray-300'
						)}></div>
					{/each}
				</div>
				{#if voidPinError}
					<p class="text-center text-xs font-semibold text-status-red">Incorrect PIN. Try again.</p>
				{/if}
			</div>

			<!-- Numpad -->
			<div class="grid grid-cols-3 gap-2">
				{#each [1,2,3,4,5,6,7,8,9] as num}
					<button
						onclick={() => { voidPinError = false; if (voidPin.length < 4) voidPin += String(num); }}
						class="btn-secondary h-12 text-lg font-bold"
						style="min-height: 48px"
					>{num}</button>
				{/each}
				<button
					onclick={() => { voidPin = ''; voidPinError = false; }}
					class="btn-ghost h-12 text-sm"
					style="min-height: 48px"
				>Clear</button>
				<button
					onclick={() => { voidPinError = false; if (voidPin.length < 4) voidPin += '0'; }}
					class="btn-secondary h-12 text-lg font-bold"
					style="min-height: 48px"
				>0</button>
				<button
					onclick={() => { voidPin = voidPin.slice(0, -1); voidPinError = false; }}
					class="btn-ghost h-12 text-sm"
					style="min-height: 48px"
				>⌫</button>
			</div>

			<div class="flex gap-2 mt-1">
				<button class="btn-ghost flex-1" onclick={() => showVoidConfirm = false} style="min-height: 44px">Cancel</button>
				<button
					onclick={confirmVoid}
					disabled={voidPin.length !== 4}
					class="btn-danger flex-1 disabled:opacity-40"
					style="min-height: 44px"
				>Confirm Void</button>
			</div>
		</div>
	</div>
{/if}

<!-- ─── Order History Modal ────────────────────────────────────────────────── -->
{#if showHistory}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-sm p-6">
		<div class="flex h-[600px] w-full max-w-[700px] flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-2xl">
			<!-- Header -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<div class="flex items-center gap-3">
					<h2 class="text-lg font-bold text-gray-900">Order History</h2>
					<span class="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-bold text-gray-600">{closedOrders.length} orders</span>
				</div>
				<button onclick={() => showHistory = false} class="text-gray-400 hover:text-gray-600 text-lg" style="min-height: unset">✕</button>
			</div>

			<!-- Orders list -->
			<div class="flex-1 overflow-y-auto divide-y divide-border">
				{#if closedOrders.length === 0}
					<div class="flex h-full items-center justify-center text-sm text-gray-400">
						No completed orders yet
					</div>
				{:else}
					{#each closedOrders as order (order.id)}
						{@const orderTable = order.tableId ? allTables.find(t => t.id === order.tableId) : null}
						<div class="flex items-center justify-between px-6 py-3 hover:bg-gray-50">
							<div class="flex flex-col gap-0.5">
								<div class="flex items-center gap-2">
									<span class="text-sm font-semibold text-gray-900">
										{#if order.orderType === 'takeout'}
											📦 {order.customerName ?? 'Walk-in'}
										{:else}
											🪑 {orderTable?.label ?? `T${order.tableNumber}`}
										{/if}
									</span>
									{#if order.packageName}
										<span class="text-xs text-gray-400">{order.packageName}</span>
									{/if}
									{#if order.status === 'cancelled'}
										<span class="rounded px-1.5 py-0.5 text-[10px] font-bold bg-status-red-light text-status-red">VOID</span>
									{:else}
										<span class="rounded px-1.5 py-0.5 text-[10px] font-bold bg-status-green-light text-status-green">PAID</span>
									{/if}
								</div>
								<div class="flex items-center gap-2 text-xs text-gray-400">
									<span>{order.pax} pax</span>
									<span>·</span>
									<span>{order.items.filter(i => i.status !== 'cancelled').length} items</span>
									<span>·</span>
									<span>{order.closedAt ? new Date(order.closedAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }) : ''}</span>
									{#if order.payments.length > 0}
										<span>·</span>
										<span class="capitalize">{order.payments[0].method}</span>
									{/if}
								</div>
							</div>
							<div class="flex items-center gap-3">
								<span class={cn(
									'font-mono text-sm font-bold',
									order.status === 'cancelled' ? 'text-gray-400 line-through' : 'text-gray-900'
								)}>
									{formatPeso(order.total)}
								</span>
								{#if order.status === 'paid'}
									<button
										onclick={() => {
											receiptOrder = order;
											const cashPayment = order.payments.find(p => p.method === 'cash');
											receiptChange = cashPayment ? cashPayment.amount - order.total : 0;
											receiptMethod = order.payments[0]?.method === 'cash' ? 'Cash' : order.payments[0]?.method === 'gcash' ? 'GCash' : 'Card';
											showReceipt = true;
										}}
										class="text-xs font-semibold text-accent hover:underline"
										style="min-height: unset"
									>
										View
									</button>
								{/if}
							</div>
						</div>
					{/each}
				{/if}
			</div>

			<!-- Summary footer -->
			{#if closedOrders.length > 0}
				{@const paidOrders = closedOrders.filter(o => o.status === 'paid')}
				{@const totalSales = paidOrders.reduce((s, o) => s + o.total, 0)}
				<div class="flex items-center justify-between border-t border-border px-6 py-3 bg-surface-secondary">
					<span class="text-sm font-semibold text-gray-600">{paidOrders.length} paid · {closedOrders.length - paidOrders.length} voided</span>
					<div class="flex items-center gap-2">
						<span class="text-xs text-gray-500">Total Sales</span>
						<span class="font-mono text-lg font-extrabold text-gray-900">{formatPeso(totalSales)}</span>
					</div>
				</div>
			{/if}
		</div>
	</div>
{/if}
