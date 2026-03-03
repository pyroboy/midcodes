<script lang="ts">
	import { tables, orders, openTable, closeTable, tickTimers, MENU_ITEMS, addItemToOrder } from '$lib/stores/pos.svelte';
	import type { Table, MenuItem, MenuCategory } from '$lib/types';
	import TopBar from '$lib/components/TopBar.svelte';
	import { formatCountdown, formatPeso, cn } from '$lib/utils';

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

	function handleTableClick(table: Table) {
		if (table.status === 'available') {
			// Opens Add to Order immediately — need to open a new session
			openTable(table.id);
		}
		selectedTableId = table.id;
		showAddItem = false;
	}

	function closeBill() {
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

	const filteredItems = $derived(MENU_ITEMS.filter((m) => m.category === activeCategory && m.available));

	// Pending items staged before pushing to bill
	let pendingItems = $state<{ item: MenuItem; qty: number; weight?: number }[]>([]);
	const pendingTotal = $derived(
		pendingItems.reduce((s, p) => s + (p.item.isWeightBased ? Math.round((p.weight ?? 0) * (p.item.pricePerGram ?? 0)) : p.item.price) * p.qty, 0)
	);

	let weightModal = $state<{ item: MenuItem } | null>(null);
	let weightInput = $state('');

	function tapItem(item: MenuItem) {
		if (item.isWeightBased) { weightModal = { item }; weightInput = ''; return; }
		const existing = pendingItems.find((p) => p.item.id === item.id);
		if (existing) existing.qty++;
		else pendingItems.push({ item, qty: 1 });
	}

	function confirmWeight() {
		if (!weightModal) return;
		const g = parseFloat(weightInput);
		if (isNaN(g) || g <= 0) return;
		pendingItems.push({ item: weightModal.item, qty: 1, weight: g });
		weightModal = null;
	}

	function changeQty(idx: number, delta: number) {
		pendingItems[idx].qty += delta;
		if (pendingItems[idx].qty <= 0) pendingItems.splice(idx, 1);
	}

	function chargeToTable() {
		if (!activeOrder) return;
		for (const p of pendingItems) {
			addItemToOrder(activeOrder.id, p.item, p.qty, p.weight);
		}
		pendingItems = [];
		showAddItem = false;
	}

	function undoPending() { pendingItems = []; }

	// ─── Table card style helpers ─────────────────────────────────────────────
	function tableCardClass(t: Table) {
		if (t.status === 'available') return 'table-card-available';
		if (t.status === 'critical')  return 'table-card-critical';
		if (t.status === 'warning')   return 'table-card-warning';
		return 'table-card-occupied';
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
	<!-- TopBar -->
	<TopBar userName="Maria Staff">
		{#snippet rightSlot()}
			<span class="badge-orange">{occupied} occ</span>
			<span class="badge-green">{free} free</span>
			<div class="h-5 w-px bg-border"></div>
		{/snippet}
	</TopBar>

	<!-- Main: floor + optional bill drawer -->
	<div class="flex flex-1 overflow-hidden">
		<!-- Floor content -->
		<div class="flex flex-1 flex-col overflow-y-auto p-6 gap-5">
			<!-- Header row -->
			<div class="flex items-center justify-between">
				<h1 class="text-lg font-bold text-gray-900">FLOOR PLAN</h1>
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
									<span class="text-base font-extrabold text-gray-900">{table.label}</span>
									{#if table.status !== 'available'}
										<span class={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', timerBadgeClass(table))}>
											{table.remainingSeconds !== null ? formatCountdown(table.remainingSeconds) : ''}
										</span>
									{/if}
								</div>
								<div class="mt-1 text-xs text-gray-400">{table.capacity}p</div>
								{#if table.billTotal}
									<div class="mt-1 font-mono text-sm font-bold text-gray-900">
										{formatPeso(table.billTotal)}
									</div>
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
										<span class="text-base font-extrabold text-gray-900">{table.label}</span>
										{#if table.remainingSeconds !== null}
											<span class={cn('rounded-full px-2 py-0.5 text-[10px] font-semibold', timerBadgeClass(table))}>
												{formatCountdown(table.remainingSeconds)}
											</span>
										{/if}
									</div>
									<div class="mt-1 text-xs text-gray-400">{table.capacity}p</div>
									{#if table.billTotal}
										<div class="mt-1 font-mono text-sm font-bold text-gray-900">
											{formatPeso(table.billTotal)}
										</div>
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
									<span class="text-sm font-extrabold text-gray-900">{table.label}</span>
									<div class="text-xs text-gray-400">{table.capacity}p</div>
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
								👥 {activeOrder.items.length > 0 ? '4 pax' : '–'}
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
									<span class="rounded px-2 py-0.5 text-[10px] font-bold bg-accent-light text-accent">PKG</span>
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
					<button class="btn-success flex-1 text-sm" style="min-height: 44px">💳 Checkout</button>
					<button class="btn-secondary px-3 text-sm" style="min-height: 44px">🖨 KOT</button>
				</div>
			</div>
		{/if}
	</div>
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
					{#each categories as cat}
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
								{#if activeCategory === 'packages'}
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
				</div>
			</div>

			<!-- Pending Sidebar -->
			<div class="flex w-[320px] shrink-0 flex-col border-l border-border bg-surface-secondary">
				<div class="flex flex-col gap-1.5 border-b border-border px-5 py-4">
					<h3 class="text-base font-bold text-gray-900">Pending Items</h3>
					<p class="text-xs text-gray-500">Review items before pushing to the main bill.</p>
					<button class="btn-secondary mt-1 w-fit text-xs" style="min-height: 36px; padding: 0 12px">
						👥 4 Pax ✎
					</button>
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
									<span class="text-sm font-medium text-gray-900">{p.item.name}</span>
									{#if p.weight}<span class="text-xs text-gray-400">{p.weight}g</span>{/if}
								</div>
								<div class="flex items-center gap-1.5">
									<button onclick={() => changeQty(idx, -1)} class="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-sm font-bold hover:bg-gray-200" style="min-height: unset">−</button>
									<span class="w-6 text-center text-sm font-semibold">{p.qty}</span>
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

<!-- Weight entry modal -->
{#if weightModal}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[320px] flex flex-col gap-4">
			<h3 class="font-bold text-gray-900">{weightModal.item.name}</h3>
			<p class="text-sm text-gray-500">Enter weight from scale (grams):</p>
			<input
				type="number"
				bind:value={weightInput}
				placeholder="e.g. 250"
				class="pos-input text-center font-mono text-xl"
				onkeydown={(e) => e.key === 'Enter' && confirmWeight()}
			/>
			<div class="flex gap-2">
				<button class="btn-secondary flex-1" onclick={() => (weightModal = null)}>Cancel</button>
				<button class="btn-primary flex-1" onclick={confirmWeight}>Add</button>
			</div>
		</div>
	</div>
{/if}
