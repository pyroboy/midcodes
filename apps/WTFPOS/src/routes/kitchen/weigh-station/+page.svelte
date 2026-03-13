<script lang="ts">
	import { kdsTickets, orders, dispatchMeatWeight, getRefillCountForMeat } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { formatDisplayId, cn } from '$lib/utils';
	import { getPkgColors, getItemProteinColors } from '$lib/stores/pos/utils';
	import YieldCalculatorModal from '$lib/components/kitchen/YieldCalculatorModal.svelte';
	import BluetoothWeightInput from '$lib/components/BluetoothWeightInput.svelte';
	import { btScale, startScan } from '$lib/stores/bluetooth-scale.svelte';
	import { stockItems, getCurrentStock } from '$lib/stores/stock.svelte';
	import { printMeatLabel } from '$lib/stores/hardware.svelte';
	import { Bluetooth, Printer } from 'lucide-svelte';
	import { browser } from '$app/environment';

	const SUGGESTED_GRAMS_PER_PAX = 150;

	// ── Pending meat items (unweighed) ────────────────────────────────────────
	interface PendingMeat {
		orderId: string;
		tableNumber: number | null;
		customerName?: string;
		itemId: string;
		menuItemId: string;
		name: string;
		quantity: number;
		refillNumber: number;
	}

	const pendingMeatItems = $derived(
		kdsTickets.value.flatMap((t) => {
			const order = orders.value.find((o) => o.id === t.orderId);
			return t.items
				.filter((i) => i.category === 'meats' && i.status === 'pending' && !i.weight)
				.map((i): PendingMeat => {
					const menuItemId = order?.items.find((oi) => oi.id === i.id)?.menuItemId ?? '';
					return {
						orderId: t.orderId,
						tableNumber: t.tableNumber,
						customerName: t.customerName,
						itemId: i.id,
						menuItemId,
						name: i.menuItemName,
						quantity: i.quantity,
						refillNumber: getRefillCountForMeat(order, menuItemId)
					};
				});
		})
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

	// ── Protein-grouped sections for 2-col chip layout ────────────────────────
	// Groups flat meat items by protein type (beef first, pork second),
	// sorted by table number within each section.
	interface EnrichedPendingMeat extends PendingMeat {
		suggestedGrams: number;
		protein: 'beef' | 'pork' | 'other';
	}

	const proteinSections = $derived.by(() => {
		const groupMap = new Map(tableGroups.map(g => [g.orderId, g.suggestedPerMeat]));
		const beef: EnrichedPendingMeat[] = [];
		const pork: EnrichedPendingMeat[] = [];
		const other: EnrichedPendingMeat[] = [];
		for (const item of pendingMeatItems) {
			const lower = item.name.toLowerCase();
			const suggestedGrams = groupMap.get(item.orderId) ?? SUGGESTED_GRAMS_PER_PAX;
			const protein: 'beef' | 'pork' | 'other' = lower.includes('beef') ? 'beef' : lower.includes('pork') ? 'pork' : 'other';
			const enriched: EnrichedPendingMeat = { ...item, suggestedGrams, protein };
			if (protein === 'beef') beef.push(enriched);
			else if (protein === 'pork') pork.push(enriched);
			else other.push(enriched);
		}
		const byTable = (a: EnrichedPendingMeat, b: EnrichedPendingMeat) =>
			(a.tableNumber ?? 999) - (b.tableNumber ?? 999);
		return [
			...(beef.length ? [{ protein: 'beef' as const, items: beef.sort(byTable) }] : []),
			...(pork.length ? [{ protein: 'pork' as const, items: pork.sort(byTable) }] : []),
			...(other.length ? [{ protein: 'other' as const, items: other.sort(byTable) }] : []),
		];
	});

	// ── State ─────────────────────────────────────────────────────────────────
	let selectedItem = $state<PendingMeat | null>(null);
	let weightInput = $state('');
	let dispatched = $state<
		{ table: number | null; customerName?: string; name: string; weight: number; time: string; printFailed?: boolean }[]
	>([]);
	let showYieldCalc = $state(false);
	let inputMode = $state<'manual' | 'scale'>('manual');
	let manualDispatchCount = $state(0); // track how many manual dispatches done this session
	let dispatchedCollapsed = $state(true);

	const DISPATCH_LOG_MAX = 50;

	function dispatchLogKey(locationId: string) {
		return `wtfpos_dispatched_log_${locationId}`;
	}

	// Restore dispatched log from localStorage; also resets on location change for owners
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

	// [08] Manual mode dismiss — hide BT chip after first successful manual dispatch
	let manualModeDismissed = $state(false);

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

	// Derive protein color from the specific item name being weighed.
	// getItemProteinColors() checks for "beef" / "pork" in the item name so that
	// a combo-order item like "Sliced Beef" shows BEEF (blue), not BEEF+PORK (orange).
	// Falls back to package color only when the item name doesn't contain a protein keyword.
	const selectedPkgColors = $derived.by(() => {
		if (!selectedItem) return null;
		return getItemProteinColors(selectedItem.name) ??
			getPkgColors(orders.value.find((o) => o.id === selectedItem!.orderId)?.packageId);
	});

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

		// Track manual dispatches for [08] dismiss hint
		if (!btConnected) manualDispatchCount += 1;

		// Auto-print meat label (non-blocking — dispatch succeeds even if print fails)
		let printFailed = false;
		const printResult = await printMeatLabel({
			tableNumber: selectedItem.tableNumber,
			customerName: selectedItem.customerName,
			meatName: selectedItem.name,
			weightGrams: grams
		});
		if (!printResult.success) printFailed = true;

		const entry = {
			table: selectedItem.tableNumber,
			customerName: selectedItem.customerName,
			name: selectedItem.name,
			weight: grams,
			time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' }),
			...(printFailed && { printFailed: true })
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

	async function reprintLabel(entry: typeof dispatched[number], index: number) {
		const result = await printMeatLabel({
			tableNumber: entry.table,
			customerName: entry.customerName,
			meatName: entry.name,
			weightGrams: entry.weight
		});
		if (result.success && entry.printFailed) {
			dispatched[index] = { ...entry, printFailed: false };
			dispatched = [...dispatched]; // trigger reactivity
			if (browser) {
				try {
					localStorage.setItem(dispatchLogKey(session.locationId), JSON.stringify(dispatched));
				} catch { /* non-fatal */ }
			}
		}
	}

	const numpadKeys = ['7', '8', '9', '4', '5', '6', '1', '2', '3', 'C', '0', 'DEL'];
</script>

<div class="-m-3 sm:-m-4 md:-m-6 flex flex-col md:flex-row h-[calc(100%+24px)] sm:h-[calc(100%+32px)] md:h-[calc(100%+48px)] bg-surface-secondary">
	<!-- LEFT: Pending meat orders grouped by table -->
	<div class={cn(
		'shrink-0 border-b md:border-b-0 md:border-r border-border flex flex-col bg-surface',
		selectedItem ? 'hidden md:flex md:w-80 lg:w-96' : 'w-full md:w-80 lg:w-96'
	)}>
		<div class="px-4 sm:px-5 py-3 sm:py-4 border-b border-border">
			<h2 class="text-base sm:text-lg font-extrabold tracking-tight text-gray-900">Pending Meat</h2>
			<p class="text-xs text-gray-500 mt-0.5">{totalPendingItems} items waiting</p>
		</div>

		<div class="flex-1 overflow-y-auto p-3 flex flex-col gap-4">
			{#if proteinSections.length === 0}
				<div class="flex flex-1 items-center justify-center text-gray-400">
					<div class="text-center">
						<div class="text-4xl mb-2">✅</div>
						<p class="text-sm font-medium">All clear</p>
					</div>
				</div>
			{:else}
				{#each proteinSections as section}
					<div>
						<!-- Protein section header -->
						<div class="flex items-center gap-2 mb-2 px-0.5">
							<span class={cn(
								'inline-flex items-center gap-1 text-xs font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full',
								section.protein === 'beef' ? 'bg-blue-100 text-blue-700' :
								section.protein === 'pork' ? 'bg-rose-100 text-rose-700' :
								'bg-gray-100 text-gray-600'
							)}>
								{section.protein === 'beef' ? '🐄 BEEF' : section.protein === 'pork' ? '🐷 PORK' : '🍖 OTHER'}
							</span>
							<span class="text-xs text-gray-400 font-medium">{section.items.length}</span>
						</div>

						<!-- 2-column chip grid -->
						<div class="grid grid-cols-2 gap-2">
							{#each section.items as item (item.itemId + item.orderId)}
								{@const isSelected = selectedItem?.itemId === item.itemId && selectedItem?.orderId === item.orderId}
								<button
									onclick={() => selectItem(item)}
									class={cn(
										'rounded-xl border-2 p-2.5 text-left transition-all active:scale-95',
										section.protein === 'beef'
											? isSelected ? 'bg-blue-50 border-blue-500 shadow-sm' : 'bg-white border-blue-200 hover:border-blue-400'
											: section.protein === 'pork'
												? isSelected ? 'bg-rose-50 border-rose-500 shadow-sm' : 'bg-white border-rose-200 hover:border-rose-400'
												: isSelected ? 'bg-gray-50 border-gray-400' : 'bg-white border-gray-200 hover:border-gray-400'
									)}
									style="min-height: 44px"
								>
									<div class="flex items-start justify-between gap-1">
										<span class="text-base font-black text-gray-900 leading-none">
											{item.tableNumber !== null ? `T${item.tableNumber}` : 'TO'}
										</span>
										{#if item.quantity > 1}
											<span class="text-[10px] font-bold text-gray-400 shrink-0 leading-none mt-0.5">{item.quantity}x</span>
										{/if}
									</div>
									<div class="text-[11px] text-gray-500 leading-tight mt-1 truncate">{item.name}</div>
									<div class={cn(
										'text-xs font-black font-mono mt-1 leading-none',
										section.protein === 'beef' ? 'text-blue-600' :
										section.protein === 'pork' ? 'text-rose-600' : 'text-gray-500'
									)}>
										{section.protein === 'beef' ? 'B' : section.protein === 'pork' ? 'P' : '?'} · ~{item.suggestedGrams}g
									</div>
								</button>
							{/each}
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>

	<!-- CENTER: Numpad + Weight Display -->
	<div class={cn(
		'flex-1 flex flex-col min-h-0',
		!selectedItem && 'hidden md:flex'
	)}>
		<!-- [08] Compact BT disconnect chip at top — dismissable after first manual dispatch -->
		{#if !btConnected && !manualModeDismissed}
			<div class="flex items-center gap-2 bg-amber-50 border-b border-amber-200 text-amber-700 text-xs px-4 py-2 justify-between">
				<span class="flex items-center gap-1.5 font-medium">
					<span>⚠</span>
					<span>Manual mode — scale disconnected</span>
				</span>
				<span class="flex items-center gap-3">
					<button onclick={startScan} class="text-accent underline font-semibold hover:text-accent-dark transition-colors">Reconnect →</button>
					{#if manualDispatchCount > 0}
						<button
							onclick={() => (manualModeDismissed = true)}
							class="text-amber-500 hover:text-amber-700 transition-colors font-semibold"
						>Got it ✕</button>
					{/if}
				</span>
			</div>
		{/if}
		<!-- Scrollable content area -->
		<div
			class="flex-1 overflow-y-auto flex flex-col items-center p-3 sm:p-6 md:p-8 transition-colors duration-300"
			style={selectedPkgColors ? `background-color: ${selectedPkgColors.fill}` : ''}
		>
		{#if selectedItem}
			{@const group = tableGroups.find((g) => g.orderId === selectedItem?.orderId)}

			<!-- ── TOP: Context info (compact) ── -->
			<div class="w-full max-w-sm flex flex-col items-center gap-1 pt-1 sm:pt-2">
				<!-- Mobile back button -->
				<button
					onclick={() => { selectedItem = null; weightInput = ''; }}
					class="md:hidden self-start rounded-lg bg-white/80 border border-border px-3 py-1.5 text-sm font-semibold text-gray-700 active:scale-95 transition-all mb-1"
					style="min-height: 40px"
				>
					← Back
				</button>

				<!-- Protein banner -->
				{#if selectedPkgColors}
					<div class="text-3xl sm:text-5xl md:text-7xl font-black leading-none" style="color: {selectedPkgColors.label}">
						{selectedPkgColors.emoji} {selectedPkgColors.name}
					</div>
				{/if}

				<!-- Item info -->
				<div class="text-center">
					<div class="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-widest">
						Weighing for
					</div>
					<div class="text-lg sm:text-xl md:text-2xl font-extrabold text-gray-900 leading-tight">
						{#if selectedItem.tableNumber !== null}
							T{selectedItem.tableNumber}
						{:else}
							{selectedItem.customerName ?? 'Takeout'}
						{/if}
						— {selectedItem.name}
					</div>
					{#if group}
						<div class="flex items-center justify-center gap-2 sm:gap-3 mt-1 text-xs sm:text-sm text-gray-500 flex-wrap">
							<span>{group.pax} pax</span>
							<span class="text-gray-300">|</span>
							<span class="font-mono text-amber-600 font-semibold">
								~{group.suggestedPerMeat}g
							</span>
							{#if selectedItem.refillNumber > 0}
								<span class="text-gray-300">|</span>
								<span class="font-mono font-bold text-status-purple">
									Refill #{selectedItem.refillNumber}
								</span>
							{/if}
						</div>
					{/if}
					{#if selectedCurrentStock !== null && selectedStockItem}
						<div class="mt-1 text-xs sm:text-sm text-gray-500">
							Stock:
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
			</div>

			<!-- ── Spacer: push input controls toward bottom ── -->
			<div class="flex-1 min-h-2 sm:min-h-4"></div>

			<!-- ── BOTTOM: Input controls (tight group) ── -->
			<div class="w-full max-w-sm flex flex-col items-center gap-2 sm:gap-3 pb-2">
				<!-- Mode toggle (only when BT connected) -->
				{#if btConnected}
					<div class="flex rounded-xl bg-gray-100 p-1 w-full border border-border">
						<button
							onclick={() => (inputMode = 'manual')}
							class={cn(
								'flex-1 rounded-lg py-2 text-sm font-bold transition-colors',
								inputMode === 'manual'
									? 'bg-white text-gray-900 shadow-sm'
									: 'text-gray-500 hover:text-gray-700'
							)}
							style="min-height: 48px"
						>
							Manual
						</button>
						<button
							onclick={() => (inputMode = 'scale')}
							class={cn(
								'flex-1 rounded-lg py-2 text-sm font-bold transition-colors flex items-center justify-center gap-1.5',
								inputMode === 'scale'
									? 'bg-white text-blue-600 shadow-sm'
									: 'text-gray-500 hover:text-gray-700'
							)}
							style="min-height: 48px"
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
						class="w-full"
					/>
					<div
						class="w-full rounded-2xl border-2 border-blue-200 bg-blue-50 px-6 py-4 sm:px-8 sm:py-5 text-center"
					>
						<div class="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
							Live Scale Reading
						</div>
						<div
							class={cn(
								'text-5xl sm:text-6xl font-extrabold font-mono tracking-tight min-h-[60px] flex items-center justify-center',
								btScale.stability === 'stable'
									? 'text-status-green'
									: btScale.stability === 'unstable'
										? 'text-status-yellow'
										: 'text-gray-400'
							)}
						>
							{btScale.stability === 'unstable' ? '~' : ''}{btScale.currentWeight}<span
								class="text-xl text-gray-400 ml-1">g</span
							>
						</div>
						{#if btScale.stability !== 'idle'}
							<span
								class={cn(
									'text-xs font-bold uppercase mt-1 inline-block',
									btScale.stability === 'stable'
										? 'text-status-green'
										: 'text-status-yellow'
								)}
							>
								{btScale.stability}
							</span>
						{:else}
							<span class="text-xs text-gray-400 mt-1 inline-block"
								>Place item on scale</span
							>
						{/if}
					</div>
				{:else}
					<!-- Manual mode: weight display + numpad as tight unit -->
					<div
						class="w-full rounded-2xl border-2 border-border bg-white px-6 py-3 sm:px-8 sm:py-4 text-center shadow-sm"
					>
						<div class="text-[10px] sm:text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
							Weight (grams)
						</div>
						<div
							class="text-4xl sm:text-5xl md:text-6xl font-extrabold font-mono tracking-tight min-h-[48px] sm:min-h-[60px] flex items-center justify-center text-gray-900"
						>
							{#if weightInput}
								{weightInput}<span class="text-xl sm:text-2xl text-gray-400 ml-1">g</span>
							{:else}
								<span class="text-gray-300">0</span><span
									class="text-xl sm:text-2xl text-gray-300 ml-1">g</span
								>
							{/if}
						</div>
					</div>

					<!-- Numpad — tight gap, directly under display -->
					<div class="grid grid-cols-3 gap-1.5 sm:gap-2 w-full">
						{#each numpadKeys as key}
							<button
								onclick={() => handleNumpad(key)}
								class={cn(
									'flex items-center justify-center rounded-xl text-xl sm:text-2xl font-bold transition-all active:scale-95 border',
									key === 'C'
										? 'bg-red-50 text-status-red border-red-200 hover:bg-red-100'
										: key === 'DEL'
											? 'bg-gray-100 text-gray-600 border-border hover:bg-gray-200'
											: 'bg-white text-gray-900 border-border hover:bg-gray-50 shadow-sm'
								)}
								style="min-height: 52px"
							>
								{key === 'DEL' ? '⌫' : key}
							</button>
						{/each}
					</div>
				{/if}
			</div>

		{:else}
			<!-- No selection state -->
			<div class="flex-1 flex items-center justify-center">
				<div class="text-center text-gray-400">
					<div class="text-5xl sm:text-6xl mb-3 sm:mb-4">⚖️</div>
					<p class="text-lg sm:text-xl font-semibold text-gray-600">Select a meat order</p>
					<p class="text-sm mt-1">Choose from the pending list on the left</p>
				</div>
			</div>
		{/if}
		</div>

		<!-- DISPATCH button — sticky at bottom, always visible when item is selected -->
		{#if selectedItem}
			<div class="sticky bottom-0 bg-surface border-t border-border px-4 sm:px-8 py-3 sm:py-4 flex justify-center">
				<button
					onclick={dispatch}
					disabled={!weightInput || parseInt(weightInput) <= 0}
					class="w-full max-w-sm rounded-xl bg-status-green py-4 sm:py-5 text-lg sm:text-xl font-extrabold text-white
					       hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none shadow-md"
					style="min-height: 56px"
				>
					DISPATCH
				</button>
			</div>
		{/if}
	</div>

	<!-- RIGHT: Dispatched log — collapsible, hidden on mobile -->
	{#if dispatchedCollapsed}
		<div class="hidden md:flex w-12 shrink-0 border-l border-border flex-col items-center py-3 gap-2 bg-surface">
			<button
				onclick={() => (dispatchedCollapsed = false)}
				class="w-9 h-9 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors"
				title="Show dispatched log"
				style="min-height: 44px; min-width: 44px"
			>
				<Printer class="w-4 h-4 text-gray-500" />
			</button>
			{#if dispatched.length > 0}
				<span class="text-[10px] font-black text-gray-700 bg-gray-100 rounded-full px-1.5 py-0.5 min-w-[20px] text-center leading-none py-1">
					{dispatched.length}
				</span>
			{/if}
		</div>
	{:else}
		<div class="hidden md:flex w-72 shrink-0 border-l border-border flex-col bg-surface">
			<div class="px-4 py-3 border-b border-border flex justify-between items-center">
				<div>
					<h2 class="text-base font-extrabold tracking-tight text-gray-900">Dispatched</h2>
					<p class="text-xs text-gray-500">
						{dispatched.length} · {(totalDispatched / 1000).toFixed(1)}kg
					</p>
				</div>
				<div class="flex items-center gap-1.5">
					<button
						onclick={() => (showYieldCalc = true)}
						class="rounded-lg bg-gray-100 px-3 py-2 text-xs font-bold text-accent border border-border hover:bg-gray-200 transition-colors"
						style="min-height: 36px"
					>Yield %</button>
					<button
						onclick={() => (dispatchedCollapsed = true)}
						class="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 text-sm font-bold"
						title="Collapse"
						style="min-height: 36px; min-width: 32px"
					>✕</button>
				</div>
			</div>

			<div class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
				{#if dispatched.length === 0}
					<div class="flex flex-1 items-center justify-center text-gray-400">
						<p class="text-sm">No items dispatched yet</p>
					</div>
				{:else}
					{#each dispatched as d, i}
						<div
							class={cn(
								'flex items-center justify-between rounded-lg border px-4 py-3',
								d.printFailed
									? 'bg-amber-50 border-status-yellow'
									: 'bg-gray-50 border-border'
							)}
						>
							<div class="flex-1 min-w-0">
								{#if d.table !== null}
									<span class="text-sm font-bold text-gray-900">T{d.table}</span>
								{:else}
									<span class="text-sm font-bold text-purple-600">Takeout</span>
								{/if}
								<span class="text-xs text-gray-500 ml-1.5">{d.name}</span>
								{#if d.printFailed}
									<span class="block text-[10px] font-bold text-status-yellow mt-0.5">⚠ Label failed</span>
								{/if}
							</div>
							<div class="flex items-center gap-2">
								<div class="text-right">
									<span class="text-sm font-bold text-status-green">{d.weight}g</span>
									<span class="block text-[10px] text-gray-400">{d.time}</span>
								</div>
								<button
									onclick={() => reprintLabel(d, i)}
									class={cn(
										'flex items-center justify-center rounded-lg transition-all active:scale-95',
										d.printFailed
											? 'bg-status-yellow text-white hover:bg-amber-500'
											: 'bg-gray-100 text-gray-500 hover:bg-gray-200'
									)}
									style="min-height: 44px; min-width: 44px"
									title={d.printFailed ? 'Retry print' : 'Reprint label'}
								>
									<Printer class="w-4 h-4" />
								</button>
							</div>
						</div>
					{/each}
				{/if}
			</div>
		</div>
	{/if}
</div>

<YieldCalculatorModal isOpen={showYieldCalc} onClose={() => (showYieldCalc = false)} />
