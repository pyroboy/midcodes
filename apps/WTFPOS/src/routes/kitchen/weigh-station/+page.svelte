<script lang="ts">
	import { kdsTickets } from '$lib/stores/pos.svelte';
	import { cn } from '$lib/utils';
	import YieldCalculatorModal from '$lib/components/kitchen/YieldCalculatorModal.svelte';

	// Pending meat orders across all tickets
	const pendingMeatOrders = $derived(
		kdsTickets.flatMap(t =>
			t.items
				.filter(i => i.category === 'meats' && i.status !== 'served' && i.status !== 'cancelled')
				.map(i => ({
					orderId: t.orderId,
					tableNumber: t.tableNumber,
					itemId: i.id,
					name: i.menuItemName,
					quantity: i.quantity,
					requestedWeight: i.weight ?? 0,
				}))
		)
	);

	// State
	let selectedOrder = $state<typeof pendingMeatOrders[number] | null>(null);
	let weightInput = $state('');
	let dispatched = $state<{ table: number | null; name: string; weight: number; time: string }[]>([]);
	let showYieldCalc = $state(false);

	// Shift totals
	const totalDispatched = $derived(dispatched.reduce((s, d) => s + d.weight, 0));

	function handleNumpad(key: string) {
		if (key === 'C') { weightInput = ''; return; }
		if (key === '⌫') { weightInput = weightInput.slice(0, -1); return; }
		if (weightInput.length < 5) weightInput += key;
	}

	function dispatch() {
		if (!selectedOrder || !weightInput) return;
		const grams = parseInt(weightInput);
		if (isNaN(grams) || grams <= 0) return;

		dispatched = [
			{
				table: selectedOrder.tableNumber,
				name: selectedOrder.name,
				weight: grams,
				time: new Date().toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })
			},
			...dispatched
		];

		// Reset
		selectedOrder = null;
		weightInput = '';
	}

	const numpadKeys = ['7','8','9','4','5','6','1','2','3','C','0','⌫'];
</script>

<!-- Dark high-contrast butcher interface -->
<div class="-m-6 flex h-[calc(100%+48px)] bg-gray-900 text-white">

	<!-- LEFT: Pending meat orders -->
	<div class="w-80 shrink-0 border-r border-gray-700 flex flex-col">
		<div class="px-5 py-4 border-b border-gray-700">
			<h2 class="text-lg font-extrabold tracking-tight">🥩 PENDING MEAT</h2>
			<p class="text-xs text-gray-400 mt-0.5">{pendingMeatOrders.length} items waiting</p>
		</div>

		<div class="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
			{#if pendingMeatOrders.length === 0}
				<div class="flex flex-1 items-center justify-center text-gray-500">
					<div class="text-center">
						<div class="text-4xl mb-2">✅</div>
						<p class="text-sm font-medium">All clear</p>
					</div>
				</div>
			{:else}
				{#each pendingMeatOrders as order (order.orderId + order.itemId)}
					<button
						onclick={() => { selectedOrder = order; weightInput = ''; }}
						class={cn(
							'flex items-center justify-between rounded-xl px-4 py-4 text-left transition-all',
							selectedOrder?.itemId === order.itemId && selectedOrder?.orderId === order.orderId
								? 'bg-accent ring-2 ring-accent-dark text-white'
								: 'bg-gray-800 hover:bg-gray-700 text-gray-100'
						)}
						style="min-height: 64px"
					>
						<div>
							<span class="text-base font-bold">T{order.tableNumber}</span>
							<span class="text-sm font-medium ml-2">{order.name}</span>
						</div>
						<div class="text-right">
							<span class="text-xs text-gray-400">{order.quantity}x</span>
							{#if order.requestedWeight > 0}
								<span class="block text-xs text-gray-400">{order.requestedWeight}g req</span>
							{/if}
						</div>
					</button>
				{/each}
			{/if}
		</div>
	</div>

	<!-- CENTER: Numpad + Weight Display -->
	<div class="flex-1 flex flex-col items-center justify-center gap-6 p-8">
		{#if selectedOrder}
			<!-- Selected item info -->
			<div class="text-center">
				<div class="text-sm font-semibold text-gray-400 uppercase tracking-widest">Weighing for</div>
				<div class="text-3xl font-extrabold mt-1">
					T{selectedOrder.tableNumber} — {selectedOrder.name}
				</div>
			</div>

			<!-- Weight display -->
			<div class="w-full max-w-sm rounded-2xl border-2 border-gray-600 bg-gray-800 px-8 py-6 text-center">
				<div class="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Weight (grams)</div>
				<div class="text-6xl font-extrabold font-mono tracking-tight min-h-[72px] flex items-center justify-center">
					{#if weightInput}
						{weightInput}<span class="text-2xl text-gray-500 ml-1">g</span>
					{:else}
						<span class="text-gray-600">0</span><span class="text-2xl text-gray-700 ml-1">g</span>
					{/if}
				</div>
			</div>

			<!-- Numpad — massive touch targets -->
			<div class="grid grid-cols-3 gap-3 w-full max-w-sm">
				{#each numpadKeys as key}
					<button
						onclick={() => handleNumpad(key)}
						class={cn(
							'flex items-center justify-center rounded-xl text-2xl font-bold transition-all active:scale-95',
							key === 'C'
								? 'bg-status-red/20 text-status-red hover:bg-status-red/30'
								: key === '⌫'
									? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
									: 'bg-gray-800 text-white hover:bg-gray-700'
						)}
						style="min-height: 72px"
					>
						{key}
					</button>
				{/each}
			</div>

			<!-- DISPATCH button -->
			<button
				onclick={dispatch}
				disabled={!weightInput || parseInt(weightInput) <= 0}
				class="w-full max-w-sm rounded-xl bg-status-green py-5 text-xl font-extrabold text-white
				       hover:bg-emerald-600 active:scale-95 transition-all disabled:opacity-30 disabled:pointer-events-none"
				style="min-height: 64px"
			>
				DISPATCH ✓
			</button>
		{:else}
			<!-- No selection state -->
			<div class="text-center text-gray-500">
				<div class="text-6xl mb-4">⚖️</div>
				<p class="text-xl font-semibold">Select a meat order</p>
				<p class="text-sm mt-1">Choose from the pending list on the left to begin weighing</p>
			</div>
		{/if}
	</div>

	<!-- RIGHT: Dispatched log -->
	<div class="w-72 shrink-0 border-l border-gray-700 flex flex-col">
		<div class="px-5 py-4 border-b border-gray-700 flex justify-between items-center">
			<div>
				<h2 class="text-lg font-extrabold tracking-tight">📦 DISPATCHED</h2>
				<p class="text-xs text-gray-400 mt-0.5">
					{dispatched.length} items · {(totalDispatched / 1000).toFixed(1)}kg total
				</p>
			</div>
			<button onclick={() => showYieldCalc = true} class="rounded-lg bg-gray-800 px-3 py-2 text-xs font-bold text-accent border border-gray-600 hover:bg-gray-700 hover:text-orange-400 transition-colors">Yield %</button>
		</div>

		<div class="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5">
			{#if dispatched.length === 0}
				<div class="flex flex-1 items-center justify-center text-gray-600">
					<p class="text-sm">No items dispatched yet</p>
				</div>
			{:else}
				{#each dispatched as d, i}
					<div class="flex items-center justify-between rounded-lg bg-gray-800 px-4 py-3">
						<div>
							{#if d.table !== null}
								<span class="text-sm font-bold">T{d.table}</span>
							{:else}
								<span class="text-sm font-bold text-purple-400">Takeout</span>
							{/if}
							<span class="text-xs text-gray-400 ml-1.5">{d.name}</span>
						</div>
						<div class="text-right">
							<span class="text-sm font-bold text-status-green">{d.weight}g</span>
							<span class="block text-[10px] text-gray-500">{d.time}</span>
						</div>
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>

<YieldCalculatorModal isOpen={showYieldCalc} onClose={() => showYieldCalc = false} />
