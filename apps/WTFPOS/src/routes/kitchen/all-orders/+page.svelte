<script lang="ts">
	import { orders as rxOrders, menuItems, addItemToOrder } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { formatPeso, formatTimeAgo, formatDisplayId, cn } from '$lib/utils';
	import type { Order, MenuItem } from '$lib/types';

	// ── Live timer (60s interval — time filters and "opened X ago" don't need per-second precision) ──
	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => (now = Date.now()), 60_000);
		return () => clearInterval(id);
	});

	// ── Aggregate SSE (locationId === 'all') ──────────────────────────────────
	const isAggregateMode = $derived(session.locationId === 'all');

	const BRANCH_META: Record<string, { name: string; badge: string; dot: string }> = {
		tag: { name: 'Alta Citta TAG', badge: 'bg-orange-100 text-orange-700', dot: 'bg-orange-400' },
		pgl: { name: 'Alona Beach PGL', badge: 'bg-blue-100 text-blue-700',    dot: 'bg-blue-400'   }
	};

	let branchOrders = $state<Record<string, Order[]>>({});
	let branchStatus = $state<Record<string, 'connecting' | 'connected' | 'error'>>({
		tag: 'connecting',
		pgl: 'connecting'
	});

	$effect(() => {
		if (!isAggregateMode) return;
		const es = new EventSource('/api/sse/aggregate');

		es.addEventListener('snapshot', (e: MessageEvent) => {
			const data = JSON.parse(e.data) as { locationId: string; orders: Order[] };
			branchOrders = { ...branchOrders, [data.locationId]: data.orders };
			branchStatus = { ...branchStatus, [data.locationId]: 'connected' };
		});
		es.addEventListener('branch-connected', (e: MessageEvent) => {
			const { locationId } = JSON.parse(e.data) as { locationId: string };
			branchStatus = { ...branchStatus, [locationId]: 'connected' };
		});
		es.addEventListener('branch-error', (e: MessageEvent) => {
			const { locationId } = JSON.parse(e.data) as { locationId: string };
			branchStatus = { ...branchStatus, [locationId]: 'error' };
		});
		es.addEventListener('config-error', () => {
			branchStatus = { tag: 'error', pgl: 'error' };
		});

		return () => es.close();
	});

	// Unified order source — SSE aggregate or local RxDB (always location-scoped)
	const sourceOrders = $derived(
		isAggregateMode
			? (Object.values(branchOrders).flat() as Order[])
			: rxOrders.value.filter((o) => o.locationId === session.locationId)
	);

	// ── Filters ───────────────────────────────────────────────────────────────
	type StatusFilter = 'all' | Order['status'];
	type TimeFilter = 'today' | '1h' | '3h' | 'all';
	let statusFilter = $state<StatusFilter>(session.role === 'kitchen' ? 'open' : 'all');
	let timeFilter = $state<TimeFilter>('today');

	// Computed once at page load — only changes at midnight, no need to recompute every second
	const startOfToday = (() => {
		const d = new Date();
		d.setHours(0, 0, 0, 0);
		return d.getTime();
	})();

	function matchesTimeFilter(createdAt: string): boolean {
		if (timeFilter === 'all') return true;
		const age = now - new Date(createdAt).getTime();
		if (timeFilter === '1h') return age <= 3_600_000;
		if (timeFilter === '3h') return age <= 10_800_000;
		return new Date(createdAt).getTime() >= startOfToday;
	}

	const timeFilteredOrders = $derived(
		sourceOrders.filter((o) => matchesTimeFilter(o.createdAt))
	);

	const filteredOrders = $derived(
		timeFilteredOrders
			.filter((o) => statusFilter === 'all' || o.status === statusFilter)
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
	);

	const statusCounts = $derived.by(() => {
		const counts = { all: 0, open: 0, pending_payment: 0, paid: 0, cancelled: 0 };
		for (const o of timeFilteredOrders) {
			counts.all++;
			counts[o.status]++;
		}
		return counts;
	});

	// ── Helpers ────────────────────────────────────────────────────────────────
	function closedTimeDisplay(isoTimestamp: string | null): string {
		if (!isoTimestamp) return '';
		const d = new Date(isoTimestamp);
		return `Closed ${d.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}`;
	}

	function isActiveOrder(order: Order): boolean {
		return order.status === 'open' || order.status === 'pending_payment';
	}

	function servedProgress(order: Order): { served: number; total: number } {
		const countable = order.items.filter((i) => i.status !== 'cancelled');
		const served = countable.filter((i) => i.status === 'served').length;
		return { served, total: countable.length };
	}

	function statusBadgeClasses(status: Order['status']): string {
		switch (status) {
			case 'open':            return 'bg-accent-light text-accent';
			case 'pending_payment': return 'bg-amber-100 text-amber-700';
			case 'paid':            return 'bg-emerald-100 text-emerald-700';
			case 'cancelled':       return 'bg-red-100 text-red-700';
		}
	}

	function statusLabel(status: Order['status']): string {
		switch (status) {
			case 'open':            return 'OPEN';
			case 'pending_payment': return 'PENDING';
			case 'paid':            return 'PAID';
			case 'cancelled':       return 'CANCELLED';
		}
	}

	function waitTimeUrgency(createdAt: string): 'normal' | 'warning' | 'urgent' {
		const ageMs = now - new Date(createdAt).getTime();
		if (ageMs > 10 * 60_000) return 'urgent';
		if (ageMs > 5 * 60_000) return 'warning';
		return 'normal';
	}

	function waitTimeClasses(order: Order): string {
		if (!isActiveOrder(order)) return '';
		const urgency = waitTimeUrgency(order.createdAt);
		if (urgency === 'urgent') return 'bg-red-50 border-red-300';
		if (urgency === 'warning') return 'bg-amber-50 border-amber-300';
		return '';
	}

	function cardBorderColor(order: Order): string {
		if (order.orderType === 'takeout') return 'border-l-4 border-l-purple-400';
		switch (order.status) {
			case 'open':            return 'border-l-4 border-l-accent';
			case 'pending_payment': return 'border-l-4 border-l-amber-400';
			case 'paid':            return 'border-l-4 border-l-emerald-400';
			case 'cancelled':       return 'border-l-4 border-l-red-400';
		}
	}

	const statusTabs: { key: StatusFilter; label: string }[] = [
		{ key: 'all',             label: 'All' },
		{ key: 'open',            label: 'Open' },
		{ key: 'pending_payment', label: 'Pending' },
		{ key: 'paid',            label: 'Paid' },
		{ key: 'cancelled',       label: 'Cancelled' }
	];

	const timeTabs: { key: TimeFilter; label: string }[] = [
		{ key: 'today', label: 'Today' },
		{ key: '1h',    label: 'Last Hour' },
		{ key: '3h',    label: 'Last 3 Hours' },
		{ key: 'all',   label: 'All Time' }
	];

	// ── Modal State (local mode only) ─────────────────────────────────────────
	let selectedOrder = $state<Order | null>(null);
	let showItemPicker = $state(false);
	let editingOrderNotes = $state(false);
	let tempOrderNotes = $state('');
	let activeCategory = $state<'meats' | 'dishes' | 'drinks'>('meats');
	const allowedCategories = ['meats', 'dishes', 'drinks'] as const;

	const filteredItems = $derived(
		menuItems.value.filter((m) => m.category === activeCategory && m.available)
	);

	let selectedMenuItem = $state<MenuItem | null>(null);
	let itemNote = $state('');

	function openOrderModal(order: Order) {
		selectedOrder = order;
		tempOrderNotes = order.notes ?? '';
		editingOrderNotes = false;
	}

	function saveOrderNotes() {
		if (selectedOrder) selectedOrder.notes = tempOrderNotes;
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

<div class="flex h-full flex-col gap-4">
	<!-- Header -->
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-xl font-bold text-gray-900">All Orders</h1>
			<p class="text-xs text-gray-400 mt-0.5">Complete order history — use Queue for active cooking</p>
		</div>
		<span class="rounded-full bg-gray-100 px-3 py-1 text-sm font-semibold text-gray-600">
			{filteredOrders.length} orders
		</span>
	</div>

	<!-- Branch status bar (aggregate mode only) -->
	{#if isAggregateMode}
		<div class="flex items-center gap-4 rounded-lg border border-border bg-surface px-4 py-2.5">
			<span class="text-xs font-bold uppercase tracking-wider text-gray-400">Live Branches</span>
			{#each Object.entries(BRANCH_META) as [locId, meta]}
				{@const status = branchStatus[locId]}
				<div class="flex items-center gap-1.5">
					<div
						class={cn(
							'h-2 w-2 rounded-full',
							status === 'connected'
								? meta.dot
								: status === 'error'
									? 'bg-red-400'
									: 'animate-pulse bg-gray-300'
						)}
					></div>
					<span class="text-xs font-medium text-gray-600">{meta.name}</span>
					{#if status === 'error'}
						<span class="text-xs text-red-500">(unreachable)</span>
					{:else if status === 'connecting'}
						<span class="text-xs text-gray-400">(connecting…)</span>
					{/if}
				</div>
			{/each}
			<span class="ml-auto text-xs italic text-gray-400">Read-only view</span>
		</div>
	{/if}

	<!-- Status Filter Tabs -->
	<div class="flex gap-2 overflow-x-auto pb-1">
		{#each statusTabs as tab}
			{@const count = statusCounts[tab.key]}
			<button
				onclick={() => (statusFilter = tab.key)}
				class={cn(
					'flex items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors',
					statusFilter === tab.key
						? 'bg-accent text-white'
						: 'bg-gray-100 text-gray-600 hover:bg-gray-200'
				)}
				style="min-height: 44px"
			>
				{tab.label}
				<span
					class={cn(
						'rounded-full px-1.5 py-0.5 text-xs font-bold',
						statusFilter === tab.key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
					)}
				>
					{count}
				</span>
			</button>
		{/each}
	</div>

	<!-- Time Filter -->
	<div class="flex gap-1.5">
		{#each timeTabs as tab}
			<button
				onclick={() => (timeFilter = tab.key)}
				class={cn(
					'rounded-full px-3 py-1.5 text-xs font-semibold transition-colors',
					timeFilter === tab.key
						? 'bg-gray-800 text-white'
						: 'bg-gray-100 text-gray-500 hover:bg-gray-200'
				)}
				style="min-height: 44px"
			>
				{tab.label}
			</button>
		{/each}
	</div>

	<!-- Order Grid -->
	{#if filteredOrders.length === 0}
		<div class="flex flex-1 items-center justify-center">
			<div class="text-center text-gray-400">
				{#if isAggregateMode && Object.values(branchStatus).every((s) => s === 'connecting')}
					<p class="text-lg font-semibold">Connecting to branches…</p>
					<p class="mt-1 text-sm">Waiting for live order data</p>
				{:else}
					<p class="text-lg font-semibold">No orders found</p>
					<p class="mt-1 text-sm">Try adjusting your filters</p>
				{/if}
			</div>
		</div>
	{:else}
		<div
			class="grid gap-3 sm:gap-4 pb-4"
			style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 280px), 1fr));"
		>
			{#each filteredOrders as order (order.id)}
				{@const progress = servedProgress(order)}
				{@const active = isActiveOrder(order)}
				<button
					onclick={() => openOrderModal(order)}
					class={cn(
						'flex flex-col text-left rounded-xl border bg-surface overflow-hidden hover:shadow-md transition-all active:scale-[0.98]',
						cardBorderColor(order),
						order.status === 'cancelled' && 'opacity-60',
						active && 'ring-2 ring-accent/20 shadow-md',
						waitTimeClasses(order)
					)}
				>
					<!-- Card Header -->
					<div class="flex items-center justify-between px-4 py-3 border-b border-border bg-gray-50">
						<span class="font-mono text-sm font-bold text-gray-900">
							{formatDisplayId(order.id, order.tableNumber)}
						</span>
						<div class="flex items-center gap-1.5">
							{#if isAggregateMode && BRANCH_META[order.locationId]}
								<span class={cn('rounded-full px-2 py-0.5 text-xs font-semibold', BRANCH_META[order.locationId].badge)}>
									{BRANCH_META[order.locationId].name}
								</span>
							{/if}
							<span
								class={cn(
									'rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider',
									statusBadgeClasses(order.status)
								)}
							>
								{statusLabel(order.status)}
							</span>
						</div>
					</div>

					<!-- Card Body -->
					<div class="flex flex-col gap-2.5 p-4">
						<div class="flex items-center justify-between text-sm">
							<span class="font-medium text-gray-700">
								{#if order.orderType === 'dine-in'}
									Table {order.tableNumber}
								{:else}
									{order.customerName ?? 'Walk-in'}
								{/if}
							</span>
							<span class="text-xs text-gray-500">
								{#if active}
									Opened {formatTimeAgo(order.createdAt)}
								{:else}
									{closedTimeDisplay(order.closedAt)}
								{/if}
							</span>
						</div>

						<div class="flex items-center gap-3 text-xs text-gray-500">
							<span>{order.items.length} items</span>
							<span>{order.pax} pax</span>
							{#if order.packageName}
								<span class="truncate">{order.packageName}</span>
							{/if}
						</div>

						{#if order.total > 0}
							<span class="text-sm font-bold text-gray-900">{formatPeso(order.total)}</span>
						{/if}

						{#if active && progress.total > 0}
							<div class="flex items-center gap-2">
								<div class="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
									<div
										class="h-full rounded-full bg-emerald-500 transition-all"
										style="width: {(progress.served / progress.total) * 100}%"
									></div>
								</div>
								<span class="text-xs font-semibold text-gray-500">
									{progress.served}/{progress.total} served
								</span>
							</div>
						{/if}

						{#if order.notes}
							<div class="rounded bg-yellow-50 px-2.5 py-1.5 text-xs text-yellow-800 border border-yellow-200">
								<span class="font-bold">Note:</span>
								{order.notes}
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
	{@const modalProgress = servedProgress(selectedOrder)}
	{@const modalActive = isActiveOrder(selectedOrder)}
	<div
		class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 sm:p-6 lg:p-8"
	>
		<div class="pos-card flex h-full max-h-[90vh] sm:max-h-[800px] w-full max-w-4xl flex-col overflow-hidden shadow-2xl">
			<!-- Modal Header -->
			<div class="flex shrink-0 items-center justify-between border-b border-border bg-gray-50 px-4 sm:px-6 py-3 sm:py-4">
				<div class="flex items-center gap-2 sm:gap-3 flex-wrap min-w-0">
					<span class="font-mono text-sm sm:text-base font-bold text-gray-900">
						{formatDisplayId(selectedOrder.id, selectedOrder.tableNumber)}
					</span>
					<h2 class="text-lg sm:text-xl font-bold text-gray-900">
						{#if selectedOrder.orderType === 'dine-in'}
							Table {selectedOrder.tableNumber}
						{:else}
							Takeout — {selectedOrder.customerName}
						{/if}
					</h2>
					<span
						class={cn(
							'rounded-full px-2.5 py-1 text-xs font-bold uppercase tracking-wider',
							statusBadgeClasses(selectedOrder.status)
						)}
					>
						{statusLabel(selectedOrder.status)}
					</span>
					{#if isAggregateMode && BRANCH_META[selectedOrder.locationId]}
						<span class={cn('rounded-full px-2.5 py-1 text-xs font-semibold', BRANCH_META[selectedOrder.locationId].badge)}>
							{BRANCH_META[selectedOrder.locationId].name}
						</span>
					{/if}
				</div>
				<button
					onclick={() => (selectedOrder = null)}
					class="rounded text-gray-400 hover:text-gray-600 p-1"
					style="min-height: unset">✕</button
				>
			</div>

			<!-- Modal Body -->
			<div class="flex flex-col md:flex-row flex-1 overflow-hidden">
				<!-- Left: Order Info -->
				<div class="md:w-1/3 shrink-0 border-b md:border-b-0 md:border-r border-border bg-surface p-4 sm:p-6 flex flex-col gap-4 sm:gap-5 overflow-y-auto max-h-[40vh] md:max-h-none">
					<!-- Timing -->
					<div class="flex flex-col gap-1">
						<h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">Timing</h3>
						<p class="text-sm text-gray-700">
							Opened {formatTimeAgo(selectedOrder.createdAt)}
						</p>
						{#if selectedOrder.closedAt}
							<p class="text-sm text-gray-500">
								{closedTimeDisplay(selectedOrder.closedAt)}
							</p>
						{/if}
					</div>

					<!-- Payment Info -->
					{#if selectedOrder.status === 'paid' && selectedOrder.payments.length > 0}
						<div class="flex flex-col gap-1">
							<h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">Payment</h3>
							{#each selectedOrder.payments as p}
								<p class="text-sm text-gray-700 capitalize">
									{p.method} — {formatPeso(p.amount)}
								</p>
							{/each}
						</div>
					{/if}

					<!-- Order Notes -->
					<div class="flex flex-col gap-2">
						<h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">Order Notes</h3>
						{#if isAggregateMode}
							<!-- Read-only in aggregate mode — no editing across branches -->
							<div class="min-h-[80px] rounded-lg border border-dashed border-gray-200 bg-gray-50 p-3 text-sm text-gray-600">
								{#if selectedOrder.notes}
									{selectedOrder.notes}
								{:else}
									<span class="text-gray-400 italic">No notes</span>
								{/if}
							</div>
						{:else if editingOrderNotes}
							<textarea
								bind:value={tempOrderNotes}
								class="pos-input min-h-[100px] resize-none text-sm"
								placeholder="E.g. Customer allergic to peanuts..."
							></textarea>
							<div class="flex gap-2 mt-1">
								<button onclick={saveOrderNotes} class="btn-primary flex-1 py-1.5 text-xs">Save</button>
								<button onclick={() => (editingOrderNotes = false)} class="btn-secondary flex-1 py-1.5 text-xs">Cancel</button>
							</div>
						{:else}
							<div
								role="button"
								tabindex="0"
								onclick={() => (editingOrderNotes = true)}
								onkeydown={(e) => e.key === 'Enter' && (editingOrderNotes = true)}
								class="min-h-[80px] rounded-lg border border-dashed border-gray-300 bg-gray-50 p-3 text-sm text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer"
							>
								{#if selectedOrder.notes}
									{selectedOrder.notes}
								{:else}
									<span class="text-gray-400 italic">Click to add order notes...</span>
								{/if}
							</div>
						{/if}
					</div>

					<!-- Add Item button — hidden in aggregate (read-only) mode -->
					{#if modalActive && !isAggregateMode}
						<div class="mt-auto">
							<button
								onclick={() => (showItemPicker = true)}
								class="w-full btn-primary py-3 shadow-md border-2 border-accent-dark hover:bg-accent-light hover:text-accent hover:border-accent transition-all"
							>
								+ Add Ala-Carte Item
							</button>
						</div>
					{/if}
				</div>

				<!-- Right: Items List -->
				<div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50">
					<div class="flex items-center justify-between mb-4">
						<h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">
							Order Items ({selectedOrder.items.length})
						</h3>
						{#if modalActive && modalProgress.total > 0}
							<span class="text-xs font-semibold text-gray-500">
								{modalProgress.served}/{modalProgress.total} served
							</span>
						{/if}
					</div>

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
									<span
										class={cn(
											'rounded px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
											item.status === 'served'
												? 'bg-emerald-100 text-emerald-700'
												: item.status === 'cancelled'
													? 'bg-red-100 text-red-700'
													: item.status === 'cooking'
														? 'bg-orange-100 text-orange-600'
														: 'bg-amber-100 text-amber-700'
										)}
									>
										{item.status}
									</span>
								</div>
								{#if item.notes}
									<div class="mt-2 ml-9 text-xs text-blue-600 bg-blue-50/50 p-1.5 rounded inline-block">
										<span class="font-medium">Note:</span>
										{item.notes}
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

<!-- ITEM PICKER MODAL (local mode only) -->
{#if showItemPicker && selectedOrder && !isAggregateMode}
	<div
		class="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-6 pb-20 pt-10"
	>
		<div class="pos-card flex h-full w-full max-w-5xl flex-col overflow-hidden shadow-2xl">
			<div class="flex flex-col shrink-0 border-b border-border bg-surface">
				<div class="flex items-center justify-between px-6 py-4">
					<h2 class="text-lg font-bold text-gray-900">Add Ala-Carte Item</h2>
					<button
						onclick={() => {
							showItemPicker = false;
							selectedMenuItem = null;
							itemNote = '';
						}}
						class="text-gray-400 hover:text-gray-600 font-bold px-2 py-1"
						style="min-height: unset">✕</button
					>
				</div>
				<div class="flex gap-1 overflow-x-auto px-4 pb-0 items-end border-t border-border bg-gray-50/50">
					{#each allowedCategories as cat}
						<button
							onclick={() => (activeCategory = cat)}
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
					<div class="flex-1 border-b border-border min-h-[48px]"></div>
				</div>
			</div>

			<div class="flex flex-col md:flex-row flex-1 overflow-hidden bg-white">
				<div class="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/30">
					<div class="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-3">
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
								<span class="text-xs font-semibold text-gray-500">{formatPeso(item.price)}</span>
							</button>
						{/each}
					</div>
				</div>

				<div class="md:w-80 shrink-0 border-t md:border-t-0 md:border-l border-border bg-surface p-4 sm:p-6 flex flex-col gap-4 sm:gap-6 max-h-[40vh] md:max-h-none overflow-y-auto">
					{#if selectedMenuItem}
						<div class="flex flex-col gap-1 items-center pb-4 border-b border-dashed border-border text-center">
							<span class="text-xl font-extrabold text-gray-900">{selectedMenuItem.name}</span>
							<span class="text-sm font-semibold text-accent">{formatPeso(selectedMenuItem.price)}</span>
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
