<script lang="ts">
	import { kdsTickets, orders, dispatchMeatWeight } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { formatDisplayId, cn } from '$lib/utils';
	import YieldCalculatorModal from '$lib/components/kitchen/YieldCalculatorModal.svelte';
	import BluetoothWeightInput from '$lib/components/BluetoothWeightInput.svelte';
	import { btScale } from '$lib/stores/bluetooth-scale.svelte';
	import { stockItems, getCurrentStock } from '$lib/stores/stock.svelte';
	import { Bluetooth } from 'lucide-svelte';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';

	const SUGGESTED_GRAMS_PER_PAX = 150;

	// ── Pending meat items (unweighed) ────────────────────────────────────────
	interface PendingMeat {
		orderId: string;
		tableNumber: number | null;
		customerName?: string;
		itemId: string;
		name: string;
		quantity: number;
	}

	const pendingMeatItems = $derived(
		kdsTickets.value.flatMap((t) =>
			t.items
				.filter((i) => i.category === 'meats' && i.status === 'pending' && !i.weight)
				.map(
					(i): PendingMeat => ({
						orderId: t.orderId,
						tableNumber: t.tableNumber,
						customerName: t.customerName,
						itemId: i.id,
						name: i.menuItemName,
						quantity: i.quantity
					})
				)
		)
	);

	// ── Group by table/order ──────────────────────────────────────────────────
	interface TableGroup {
		orderId: string;
		tableNumber: number | null;
		customerName?: string;
		pax: number;
		packageName: string | null;
		suggestedPerMeat: number;
		items: PendingMeat[];
	}

	const tableGroups = $derived.by(() => {
		const groups = new Map<string, TableGroup>();
		for (const item of pendingMeatItems) {
			let group = groups.get(item.orderId);
			if (!group) {
				const order = orders.value.find((o) => o.id === item.orderId);
				const pax = order?.pax ?? 1;
				group = {
					orderId: item.orderId,
					tableNumber: item.tableNumber,
					customerName: item.customerName,
					pax,
					packageName: order?.packageName ?? null,
					suggestedPerMeat: SUGGESTED_GRAMS_PER_PAX * pax,
					items: []
				};
				groups.set(item.orderId, group);
			}
			group.items.push(item);
		}
		return [...groups.values()];
	});

	const totalPendingItems = $derived(pendingMeatItems.length);

	// ── State ─────────────────────────────────────────────────────────────────
	let selectedItem = $state<PendingMeat | null>(null);
	let weightInput = $state('');
	let dispatched = $state<
		{ table: number | null; name: string; weight: number; time: string }[]
	>([]);
	let showYieldCalc = $state(false);
	let inputMode = $state<'manual' | 'scale'>('manual');

	const DISPATCH_LOG_MAX = 50;

	function dispatchLogKey(locationId: string) {
		return `wtfpos_dispatched_log_${locationId}`;
	}

	// P2-11: Restore dispatched log from localStorage on mount
	onMount(() => {
		if (!browser) return;
		try {
			const raw = localStorage.getItem(dispatchLogKey(session.locationId));
			if (raw) dispatched = JSON.parse(raw);
		} catch {
			dispatched = [];
		}
	});

	// Reset dispatched log and selection when location changes (e.g. owner switching branch)
	$effect(() => {
		const locId = session.locationId;
		selectedItem = null;
		weightInput = '';
		// Load log for the new location
		if (browser) {
			try {
				const raw = localStorage.getItem(dispatchLogKey(locId));
				dispatched = raw ? JSON.parse(raw) : [];
			} catch {
				dispatched = [];
			}
		} else {
			dispatched = [];
		}
	});

	const btConnected = $derived(btScale.connectionStatus === 'connected');
	const totalDispatched = $derived(dispatched.reduce((s, d) => s + d.weight, 0));

	// P1-17: Derive current stock for the selected item so kitchen can sanity-check
	const selectedStockItem = $derived.by(() => {
		const item = selectedItem;
		if (!item) return null;
		return stockItems.value.find(
			(s) =>
				s.name.toLowerCase() === item.name.toLowerCase() &&
				(s.locationId === session.locationId || session.locationId === 'all')
		) ?? null;
	});
	const selectedCurrentStock = $derived(
		selectedStockItem ? getCurrentStock(selectedStockItem.id) : null
	);

	function selectItem(item: PendingMeat) {
		selectedItem = item;
		weightInput = '';
	}

	function handleNumpad(key: string) {
		if (key === 'C') {
			weightInput = '';
			return;
		}
		if (key === 'DEL') {
			weightInput = weightInput.slice(0, -1);
			return;
		}
		if (weightInput.length < 5) weightInput += key;
	}

	async function dispatch() {
		if (!selectedItem || !weightInput) return;
		const grams = parseInt(weightInput);
		if (isNaN(grams) || grams <= 0) return;

		await dispatchMeatWeight(selectedItem.orderId, selectedItem.itemId, grams);

		const entry = {
			table: selectedItem.tableNumber,
			name: selectedItem.name,
			weight: grams,
			time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
		};
		// P2-11: Keep only the last DISPATCH_LOG_MAX entries; persist to localStorage
		dispatched = [entry, ...dispatched].slice(0, DISPATCH_LOG_MAX);
		if (browser) {
			try {
				localStorage.setItem(dispatchLogKey(session.locationId), JSON.stringify(dispatched));
			} catch {
				// localStorage write failure — non-fatal
			}
		}

		selectedItem = null;
		weightInput = '';
	}

	const numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', 'DEL'];
</script>

<div class="-m-6 flex h-[calc(100%+48px)] bg-surface-secondary">
	<!-- LEFT: Pending meat orders grouped by table -->
	<div class="w-96 shrink-0 border-r border-border flex flex-col bg-surface">
		<div class="px-5 py-4 border-b border-border">
			<h2 class="text-lg font-extrabold tracking-tight text-gray-900">Pending Meat</h2>
			<p class="text-xs text-gray-500 mt-0.5">{totalPendingItems} items waiting</p>
		</div>

		<div class="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
			{#if tableGroups.length === 0}
				<div class="flex flex-1 items-center justify-center text-gray-400">
					<div class="text-center">
						<div class="text-4xl mb-2">✅</div>
						<p class="text-sm font-medium">All clear</p>
					</div>
				</div>
			{:else}
				{#each tableGroups as group (group.orderId)}
					<div class="rounded-xl border border-border bg-white overflow-hidden">
						<!-- Table header -->
						<div class="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-border">
							<div class="flex items-center gap-2">
								{#if group.tableNumber !== null}
									<span class="text-lg font-black text-gray-900">T{group.tableNumber}</span>
								{:else}
									<span class="rounded bg-purple-100 px-1.5 py-0.5 text-xs font-bold text-purple-700">TO</span>
									<span class="text-sm font-bold text-gray-900">{group.customerName ?? 'Walk-in'}</span>
								{/if}
								<span class="font-mono text-xs text-gray-400">
									{formatDisplayId(group.orderId, group.tableNumber)}
								</span>
							</div>
							<div class="flex items-center gap-2">
								<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-bold text-gray-600">
									{group.pax} pax
								</span>
							</div>
						</div>

						<!-- Package + suggested weight -->
						<div class="flex items-center justify-between px-4 py-2 bg-amber-50 border-b border-amber-100 text-xs">
							<span class="font-semibold text-amber-700">
								{group.packageName ?? 'Ala-carte'}
							</span>
							<span class="font-mono font-bold text-amber-600">
								~{group.suggestedPerMeat}g / meat
							</span>
						</div>

						<!-- Meat items -->
						<div class="flex flex-col divide-y divide-border">
							{#each group.items as item (item.itemId)}
								{@const isSelected =
									selectedItem?.itemId === item.itemId &&
									selectedItem?.orderId === item.orderId}
								<button
									onclick={() => selectItem(item)}
									class={cn(
										'flex items-center justify-between px-4 py-3 text-left transition-all',
										isSelected
											? 'bg-accent-light ring-2 ring-inset ring-accent'
											: 'hover:bg-gray-50'
									)}
									style="min-height: 52px"
								>
									<span
										class={cn(
											'text-sm font-semibold',
											isSelected ? 'text-accent' : 'text-gray-900'
										)}
									>
										{item.name}
									</span>
									<span class="text-xs text-gray-400">{item.quantity}x</span>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- CENTER: Numpad + Weight Display -->
	<div class="flex-1 flex flex-col min-h-0">
		<!-- Scrollable content area -->
		<div class="flex-1 overflow-y-auto flex flex-col items-center justify-center gap-6 p-8">
		{#if selectedItem}
			{@const group = tableGroups.find((g) => g.orderId === selectedItem?.orderId)}
			<!-- Selected item info -->
			<div class="text-center">
				<div class="text-sm font-semibold text-gray-500 uppercase tracking-widest">
					Weighing for
				</div>
				<div class="text-3xl font-extrabold text-gray-900 mt-1">
					{#if selectedItem.tableNumber !== null}
						T{selectedItem.tableNumber}
					{:else}
						{selectedItem.customerName ?? 'Takeout'}
					{/if}
					— {selectedItem.name}
				</div>
				{#if group}
					<div class="flex items-center justify-center gap-3 mt-2 text-sm text-gray-500">
						<span>{group.pax} pax</span>
						<span class="text-gray-300">|</span>
						<span class="font-mono text-amber-600 font-semibold">
							Suggested: ~{group.suggestedPerMeat}g
						</span>
					</div>
				{/if}
				{#if selectedCurrentStock !== null && selectedStockItem}
					<div class="mt-2 text-sm text-gray-500">
						Current stock:
						<span class={cn(
							'font-mono font-semibold',
							selectedCurrentStock <= 0
								? 'text-status-red'
								: selectedCurrentStock < (selectedStockItem.minLevel ?? 500)
									? 'text-status-yellow'
									: 'text-status-green'
						)}>
							{selectedCurrentStock}{selectedStockItem.unit}
						</span>
					</div>
				{/if}
			</div>

			<!-- Mode toggle (only when BT connected) -->
			{#if btConnected}
				<div class="flex rounded-xl bg-gray-100 p-1 w-full max-w-sm border border-border">
					<button
						onclick={() => (inputMode = 'manual')}
						class={cn(
							'flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors',
							inputMode === 'manual'
								? 'bg-white text-gray-900 shadow-sm'
								: 'text-gray-500 hover:text-gray-700'
						)}
						style="min-height: unset"
					>
						Manual
					</button>
					<button
						onclick={() => (inputMode = 'scale')}
						class={cn(
							'flex-1 rounded-lg py-2.5 text-sm font-bold transition-colors flex items-center justify-center gap-1.5',
							inputMode === 'scale'
								? 'bg-white text-blue-600 shadow-sm'
								: 'text-gray-500 hover:text-gray-700'
						)}
						style="min-height: unset"
					>
						<Bluetooth class="w-4 h-4" />
						Scale
					</button>
				</div>
			{/if}

			{#if btConnected && inputMode === 'scale'}
				<!-- BT Scale mode -->
				<BluetoothWeightInput
					id="weigh-station"
					value={weightInput}
					onValueChange={(v) => {
						weightInput = v;
					}}
					theme="light"
					class="w-full max-w-sm"
				/>
				<div
					class="w-full max-w-sm rounded-2xl border-2 border-blue-200 bg-blue-50 px-8 py-6 text-center"
				>
					<div class="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
						Live Scale Reading
					</div>
					<div
						class={cn(
							'text-6xl font-extrabold font-mono tracking-tight min-h-[72px] flex items-center justify-center',
							btScale.stability === 'stable'
								? 'text-status-green'
								: btScale.stability === 'unstable'
									? 'text-status-yellow'
									: 'text-gray-400'
						)}
					>
						{btScale.stability === 'unstable' ? '~' : ''}{btScale.currentWeight}<span
							class="text-2xl text-gray-400 ml-1">g</span
						>
					</div>
					{#if btScale.stability !== 'idle'}
						<span
							class={cn(
								'text-xs font-bold uppercase mt-2 inline-block',
								btScale.stability === 'stable'
									? 'text-status-green'
									: 'text-status-yellow'
							)}
						>
							{btScale.stability}
						</span>
					{:else}
						<span class="text-xs text-gray-400 mt-2 inline-block"
							>Place item on scale</span
						>
					{/if}
				</div>
			{:else}
				<!-- Manual mode -->
				<div
					class="w-full max-w-sm rounded-2xl border-2 border-border bg-white px-8 py-6 text-center shadow-sm"
				>
					<div class="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
						Weight (grams)
					</div>
					<div
						class="text-6xl font-extrabold font-mono tracking-tight min-h-[72px] flex items-center justify-center text-gray-900"
					>
						{#if weightInput}
							{weightInput}<span class="text-2xl text-gray-400 ml-1">g</span>
						{:else}
							<span class="text-gray-300">0</span><span
								class="text-2xl text-gray-300 ml-1">g</span
							>
						{/if}
					</div>
				</div>

				<!-- Numpad -->
				<div class="grid grid-cols-3 gap-3 w-full max-w-sm">
					{#each numpadKeys as key}
						<button
							onclick={() => handleNumpad(key)}
							class={cn(
								'flex items-center justify-center rounded-xl text-2xl font-bold transition-all active:scale-95 border',
								key === 'C'
									? 'bg-red-50 text-status-red border-red-200 hover:bg-red-100'
									: key === 'DEL'
										? 'bg-gray-100 text-gray-600 border-border hover:bg-gray-200'
										: 'bg-white text-gray-900 border-border hover:bg-gray-50 shadow-sm'
							)}
							style="min-height: 72px"
						>
							{key === 'DEL' ? '⌫' : key}
						</button>
					{/each}
				</div>
			{/if}

		{:else}
			<!-- No selection state -->
			<div class="text-center text-gray-400">
				<div class="text-6xl mb-4">⚖️</div>
				<p class="text-xl font-semibold text-gray-600">Select a meat order</p>
				<p class="text-sm mt-1">Choose from the pending list on the left</p>
			</div>
		{/if}
		</div>

		<!-- DISPATCH button — sticky at bottom, always visible when item is selected -->
		{#if selectedItem}
			<div class="sticky bottom-0 bg-surface border-t border-border px-8 py-4 flex justify-center">
				<button
					onclick={dispatch}
					disabled={!weightInput || parseInt(weightInput) <= 0}
					class="w-full max-w-sm rounded-xl bg-status-green py-5 text-xl font-extrabold text-white
					       hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-md"
					style="min-height: 64px"
				>
					DISPATCH
				</button>
			</div>
		{/if}
	</div>

	<!-- RIGHT: Dispatched log -->
	<div class="w-72 shrink-0 border-l border-border flex flex-col bg-surface">
		<div class="px-5 py-4 border-b border-border flex justify-between items-center">
			<div>
				<h2 class="text-lg font-extrabold tracking-tight text-gray-900">Dispatched</h2>
				<p class="text-xs text-gray-500 mt-0.5">
					{dispatched.length} items · {(totalDispatched / 1000).toFixed(1)}kg total
				</p>
			</div>
			<button
				onclick={() => (showYieldCalc = true)}
				class="rounded-lg bg-gray-100 px-4 py-2.5 text-xs font-bold text-accent border border-border hover:bg-gray-200 transition-colors"
				style="min-height: 44px"
				>Yield %</button
			>
		</div>

		<div class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
			{#if dispatched.length === 0}
				<div class="flex flex-1 items-center justify-center text-gray-400">
					<p class="text-sm">No items dispatched yet</p>
				</div>
			{:else}
				{#each dispatched as d}
					<div
						class="flex items-center justify-between rounded-lg bg-gray-50 border border-border px-4 py-3"
					>
						<div>
							{#if d.table !== null}
								<span class="text-sm font-bold text-gray-900">T{d.table}</span>
							{:else}
								<span class="text-sm font-bold text-purple-600">Takeout</span>
							{/if}
							<span class="text-xs text-gray-500 ml-1.5">{d.name}</span>
						</div>
						<div class="text-right">
							<span class="text-sm font-bold text-status-green">{d.weight}g</span>
							<span class="block text-[10px] text-gray-400">{d.time}</span>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<YieldCalculatorModal isOpen={showYieldCalc} onClose={() => (showYieldCalc = false)} />
