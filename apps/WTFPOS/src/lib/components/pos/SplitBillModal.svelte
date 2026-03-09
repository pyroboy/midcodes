<script lang="ts">
	import { untrack } from 'svelte';
	import { initEqualSplit, initItemSplit, assignItemToSubBill, paySubBill, cancelSplit } from '$lib/stores/pos.svelte';
	import { formatPeso, cn } from '$lib/utils';
	import type { Order, PaymentMethod, SubBill } from '$lib/types';

	let {
		order,
		onclose,
		oncomplete
	}: {
		order: Order;
		onclose: () => void;
		oncomplete: (paidOrder: Order) => void;
	} = $props();

	let step = $state<'choose' | 'split' | 'pay'>('choose');
	let splitType = $state<'equal' | 'by-item'>('equal');
	let splitCount = $state(2);

	// Payment state for active sub-bill
	let activeSubBillId = $state<string | null>(null);
	let payMethod = $state<PaymentMethod>('cash');
	let cashTendered = $state(0);

	// P0-02: Local payment tracking — avoids race with RxDB propagation
	// untrack: intentionally captures only the initial set of already-paid sub-bills
	let paidSubBillIds = $state(new Set(untrack(() => order.subBills?.filter(sb => sb.payment !== null).map(sb => sb.id) ?? [])));

	// P1-03: Per-guest receipt state
	let showSubReceipt = $state(false);
	let paidSubBill = $state<SubBill | null>(null);
	let lastPayMethodLabel = $state('');
	let subChange = $state(0);

	// Item assignment state (by-item mode)
	let selectedItemId = $state<string | null>(null);

	const billableItems = $derived(
		order.items.filter(i => i.status !== 'cancelled' && i.tag !== 'FREE')
	);

	const activeSubBill = $derived(
		order.subBills?.find(sb => sb.id === activeSubBillId) ?? null
	);

	const allPaid = $derived(
		order.subBills?.every(sb => sb.payment !== null) ?? false
	);

	function startSplit() {
		if (splitType === 'equal') {
			initEqualSplit(order.id, splitCount);
		} else {
			initItemSplit(order.id, splitCount);
		}
		step = 'split';
	}

	function goToPayment() {
		step = 'pay';
		activeSubBillId = order.subBills?.find(sb => !sb.payment)?.id ?? null;
		payMethod = 'cash';
		cashTendered = 0;
	}

	function handleItemClick(itemId: string) {
		selectedItemId = itemId;
	}

	function handleGuestClick(subBillId: string) {
		if (selectedItemId) {
			assignItemToSubBill(order.id, selectedItemId, subBillId);
			selectedItemId = null;
		}
	}

	function confirmPayment() {
		if (!activeSubBillId || !activeSubBill) return;
		const amount = payMethod === 'cash' ? cashTendered : activeSubBill.total;
		if (payMethod === 'cash' && cashTendered < activeSubBill.total) return;

		// P0-02: Capture receipt data before async DB write
		paidSubBill = { ...activeSubBill };
		lastPayMethodLabel = payMethod === 'gcash' ? 'GCash' : payMethod === 'maya' ? 'Maya' : 'Cash';
		subChange = payMethod === 'cash' ? Math.max(0, cashTendered - activeSubBill.total) : 0;
		paidSubBillIds = new Set([...paidSubBillIds, activeSubBillId]);

		paySubBill(order.id, activeSubBillId, payMethod, amount);
		showSubReceipt = true;
	}

	function proceedFromSubReceipt() {
		showSubReceipt = false;
		if (!order.subBills) return;
		const next = order.subBills.find(sb => !paidSubBillIds.has(sb.id));
		if (next) {
			activeSubBillId = next.id;
			payMethod = 'cash';
			cashTendered = 0;
		} else {
			activeSubBillId = null; // All paid → show "All paid!" UI
		}
	}

	function handleCancel() {
		cancelSplit(order.id);
		onclose();
	}

	function selectCashPreset(amount: number) {
		cashTendered = amount;
	}

	const cashChange = $derived(activeSubBill ? Math.max(0, cashTendered - activeSubBill.total) : 0);
	const canConfirmPay = $derived(
		activeSubBill
			? (payMethod !== 'cash' || cashTendered >= activeSubBill.total)
			: false
	);

	// P1-03: Number of guests still to pay after the current payment
	const remainingAfterCurrent = $derived(
		order.subBills?.filter(sb => !paidSubBillIds.has(sb.id)).length ?? 0
	);

	// Check if all items are assigned (by-item mode)
	const unassignedItems = $derived(() => {
		if (!order.subBills || splitType !== 'by-item') return [];
		const assignedIds = new Set(order.subBills.flatMap(sb => sb.itemIds));
		return billableItems.filter(i => !assignedIds.has(i.id));
	});
</script>

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-6">
	<div class="pos-card w-full max-w-[700px] max-h-[85vh] overflow-y-auto flex flex-col gap-0 p-0">

		{#if step === 'choose'}
			<!-- Step 1: Choose split type -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<h3 class="text-lg font-bold text-gray-900">✂️ Split Bill</h3>
				<button onclick={onclose} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
			</div>

			<div class="flex flex-col gap-5 px-6 py-5">
				<div class="flex items-center justify-between rounded-xl bg-surface-secondary border border-border p-4">
					<span class="text-sm font-semibold text-gray-600">Bill Total</span>
					<span class="font-mono text-2xl font-extrabold text-gray-900">{formatPeso(order.total)}</span>
				</div>

				<!-- Split type selection -->
				<div class="flex flex-col gap-2">
					<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Split Method</span>
					<div class="grid grid-cols-2 gap-3">
						<button
							onclick={() => splitType = 'equal'}
							class={cn(
								'flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all active:scale-[0.98]',
								splitType === 'equal'
									? 'border-accent bg-accent-light'
									: 'border-border bg-surface hover:border-gray-300'
							)}
							style="min-height: 80px"
						>
							<span class="text-2xl">⚖️</span>
							<span class="text-sm font-bold text-gray-900">Equal Split</span>
							<span class="text-[10px] text-gray-500">Divide total evenly</span>
						</button>
						<button
							onclick={() => splitType = 'by-item'}
							class={cn(
								'flex flex-col items-center gap-2 rounded-xl border-2 p-5 transition-all active:scale-[0.98]',
								splitType === 'by-item'
									? 'border-accent bg-accent-light'
									: 'border-border bg-surface hover:border-gray-300'
							)}
							style="min-height: 80px"
						>
							<span class="text-2xl">📋</span>
							<span class="text-sm font-bold text-gray-900">By Item</span>
							<span class="text-[10px] text-gray-500">Assign items to guests</span>
						</button>
					</div>
				</div>

				<!-- Guest count -->
				<div class="flex flex-col gap-2">
					<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">How many ways?</span>
					<div class="grid grid-cols-6 gap-2">
						{#each [2, 3, 4, 5, 6, 8] as num}
							<button
								onclick={() => splitCount = num}
								class={cn(
									'rounded-xl py-3 text-lg font-bold transition-all active:scale-95',
									splitCount === num
										? 'bg-accent text-white shadow-md'
										: 'border border-border bg-surface text-gray-700 hover:bg-gray-50'
								)}
								style="min-height: 48px"
							>{num}</button>
						{/each}
					</div>
					<p class="text-center text-xs text-gray-400">
						{splitType === 'equal'
							? `Each guest pays ${formatPeso(Math.ceil(order.total / splitCount))}`
							: `${splitCount} separate sub-bills`}
					</p>
				</div>
			</div>

			<div class="flex gap-3 border-t border-border px-6 py-4">
				<button class="btn-ghost flex-1" onclick={onclose} style="min-height: 48px">Cancel</button>
				<button class="btn-primary flex-1" onclick={startSplit} style="min-height: 48px">
					Continue →
				</button>
			</div>

		{:else if step === 'split'}
			<!-- Step 2: Configure split -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<h3 class="text-lg font-bold text-gray-900">
					{splitType === 'equal' ? '⚖️ Equal Split' : '📋 Assign Items'}
				</h3>
				<button onclick={handleCancel} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
			</div>

			{#if splitType === 'equal' && order.subBills}
				<!-- Equal split: show sub-bills with amounts -->
				<div class="flex flex-col gap-3 px-6 py-5">
					{#each order.subBills as sb (sb.id)}
						<div class="flex items-center justify-between rounded-xl border border-border bg-surface-secondary p-4">
							<span class="text-sm font-semibold text-gray-900">{sb.label}</span>
							<span class="font-mono text-lg font-bold text-gray-900">{formatPeso(sb.total)}</span>
						</div>
					{/each}
					<div class="flex items-center justify-between border-t border-border pt-3">
						<span class="text-sm font-semibold text-gray-500">Total</span>
						<span class="font-mono text-lg font-extrabold text-gray-900">{formatPeso(order.total)}</span>
					</div>
				</div>

			{:else if splitType === 'by-item' && order.subBills}
				<!-- By-item: drag/assign items to guests -->
				<div class="flex flex-1 divide-x divide-border overflow-hidden" style="max-height: 420px">
					<!-- Left: Unassigned items -->
					<div class="flex w-[280px] shrink-0 flex-col overflow-y-auto">
						<div class="px-4 py-2 bg-surface-secondary border-b border-border">
							<span class="text-xs font-bold uppercase tracking-wider text-gray-400">
								Items ({unassignedItems().length} unassigned)
							</span>
						</div>
						<div class="flex flex-col gap-1 p-3">
							{#each billableItems as item (item.id)}
								{@const isAssigned = order.subBills?.some(sb => sb.itemIds.includes(item.id))}
								{@const assignedTo = order.subBills?.find(sb => sb.itemIds.includes(item.id))}
								<button
									onclick={() => handleItemClick(item.id)}
									class={cn(
										'flex items-center justify-between rounded-lg px-3 py-2 text-left transition-all text-sm',
										selectedItemId === item.id
											? 'bg-accent text-white'
											: isAssigned
												? 'bg-status-green-light text-gray-700 border border-status-green/20'
												: 'bg-surface border border-border hover:bg-gray-50'
									)}
									style="min-height: 40px"
								>
									<span class="truncate font-medium">{item.menuItemName}</span>
									<div class="flex items-center gap-2 shrink-0 ml-2">
										{#if isAssigned && assignedTo}
											<span class="text-[10px] font-bold text-status-green">{assignedTo.label}</span>
										{/if}
										<span class={cn('font-mono text-xs font-bold', selectedItemId === item.id ? 'text-white' : 'text-gray-900')}>
											{formatPeso(item.unitPrice * item.quantity)}
										</span>
									</div>
								</button>
							{/each}
						</div>
					</div>

					<!-- Right: Guest columns -->
					<div class="flex flex-1 flex-col overflow-y-auto">
						<div class="px-4 py-2 bg-surface-secondary border-b border-border">
							<span class="text-xs font-bold uppercase tracking-wider text-gray-400">
								Tap a guest to assign selected item
							</span>
						</div>
						<div class="grid grid-cols-2 gap-2 p-3">
							{#each order.subBills as sb (sb.id)}
								<button
									onclick={() => handleGuestClick(sb.id)}
									class={cn(
										'flex flex-col gap-1 rounded-xl border-2 p-3 transition-all active:scale-[0.98]',
										selectedItemId
											? 'border-accent bg-accent-light cursor-pointer hover:shadow-md'
											: 'border-border bg-surface cursor-default'
									)}
									style="min-height: 80px"
								>
									<span class="text-sm font-bold text-gray-900">{sb.label}</span>
									<span class="font-mono text-lg font-extrabold text-gray-900">{formatPeso(sb.total)}</span>
									<span class="text-[10px] text-gray-400">{sb.itemIds.length} items</span>
								</button>
							{/each}
						</div>
					</div>
				</div>
			{/if}

			<div class="flex gap-3 border-t border-border px-6 py-4">
				<button class="btn-ghost flex-1" onclick={handleCancel} style="min-height: 48px">Cancel Split</button>
				<button
					class="btn-primary flex-1"
					onclick={goToPayment}
					disabled={splitType === 'by-item' && unassignedItems().length > 0}
					style="min-height: 48px"
				>
					Proceed to Payment →
				</button>
			</div>

		{:else if step === 'pay' && order.subBills}
			<!-- Step 3: Pay each sub-bill -->
			<div class="flex items-center justify-between border-b border-border px-6 py-4">
				<h3 class="text-lg font-bold text-gray-900">💳 Split Payment</h3>
				<div class="flex items-center gap-2">
					<span class="text-xs text-gray-400">
						{paidSubBillIds.size}/{order.subBills.length} paid
					</span>
					<button onclick={handleCancel} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
				</div>
			</div>

			<!-- Sub-bill tabs — use local paidSubBillIds for immediate feedback -->
			<div class="flex gap-2 border-b border-border bg-surface-secondary px-6 py-3 overflow-x-auto">
				{#each order.subBills as sb (sb.id)}
					<button
						onclick={() => { if (!paidSubBillIds.has(sb.id) && !showSubReceipt) { activeSubBillId = sb.id; payMethod = 'cash'; cashTendered = 0; } }}
						class={cn(
							'shrink-0 rounded-lg px-4 py-2 text-sm font-semibold transition-all',
							paidSubBillIds.has(sb.id)
								? 'bg-status-green-light text-status-green cursor-default'
								: sb.id === activeSubBillId
									? 'bg-accent text-white shadow-md'
									: 'border border-border bg-surface text-gray-600 hover:bg-gray-50'
						)}
						style="min-height: 40px"
					>
						{paidSubBillIds.has(sb.id) ? '✓ ' : ''}{sb.label} · {formatPeso(sb.total)}
					</button>
				{/each}
			</div>

			{#if showSubReceipt && paidSubBill}
				<!-- P1-03: Per-guest receipt after each payment -->
				<div class="flex flex-col items-center gap-4 px-6 py-6">
					<div class="flex items-center gap-2">
						<span class="text-2xl text-status-green">✓</span>
						<span class="text-base font-bold text-gray-900">{paidSubBill.label} Paid</span>
					</div>
					<div class="w-full rounded-xl bg-surface-secondary border border-border p-4 font-mono text-sm">
						<div class="flex justify-between">
							<span class="font-sans text-gray-600">{paidSubBill.label}</span>
							<span class="font-bold text-gray-900">{formatPeso(paidSubBill.total)}</span>
						</div>
						<div class="flex justify-between text-xs text-gray-400 mt-1">
							<span>via</span>
							<span>{lastPayMethodLabel}</span>
						</div>
						{#if lastPayMethodLabel === 'Cash' && subChange > 0}
							<div class="flex justify-between font-bold text-status-green mt-1 border-t border-border pt-1">
								<span>Change</span>
								<span>{formatPeso(subChange)}</span>
							</div>
						{/if}
					</div>
					<button
						class="btn-primary w-full"
						onclick={proceedFromSubReceipt}
						style="min-height: 48px"
					>
						{remainingAfterCurrent > 0 ? `Next Guest → (${remainingAfterCurrent} left)` : 'All Done ✓'}
					</button>
				</div>

			{:else if activeSubBillId !== null && !paidSubBillIds.has(activeSubBillId) && activeSubBill}
				<!-- Active sub-bill payment -->
				<div class="flex flex-col gap-4 px-6 py-5">
					<div class="flex items-center justify-between rounded-xl bg-surface-secondary border border-border p-4">
						<span class="text-sm font-semibold text-gray-600">{activeSubBill.label}</span>
						<span class="font-mono text-2xl font-extrabold text-gray-900">{formatPeso(activeSubBill.total)}</span>
					</div>

					<!-- Payment method -->
					<div class="grid grid-cols-3 gap-2">
						{#each [
							{ id: 'cash' as PaymentMethod, label: '💵 Cash' },
							{ id: 'gcash' as PaymentMethod, label: '📱 GCash' },
							{ id: 'maya' as PaymentMethod, label: '📱 Maya' }
						] as method}
							<button
								onclick={() => { payMethod = method.id; if (method.id !== 'cash') cashTendered = 0; }}
								class={cn(
									'flex items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold transition-all active:scale-95',
									payMethod === method.id
										? 'bg-accent text-white shadow-md'
										: 'border border-border bg-surface text-gray-700 hover:bg-gray-50'
								)}
								style="min-height: 48px"
							>
								{method.label}
							</button>
						{/each}
					</div>

					<!-- Cash tendered -->
					{#if payMethod === 'cash'}
						<div class="flex flex-col gap-3">
							<div class="grid grid-cols-4 gap-2">
								{#each [50, 100, 200, 500, 1000, 1500, 2000] as amount}
									<button
										onclick={() => selectCashPreset(amount)}
										class={cn(
											'rounded-lg py-2 font-mono text-sm font-bold transition-all active:scale-95',
											cashTendered === amount
												? 'bg-accent text-white'
												: 'border border-border bg-surface text-gray-700 hover:bg-gray-50'
										)}
										style="min-height: 40px"
									>₱{amount.toLocaleString()}</button>
								{/each}
								<button
									onclick={() => { cashTendered = activeSubBill!.total; }}
									class="rounded-lg py-2 text-xs font-bold text-accent border border-accent bg-accent-light hover:bg-orange-100 transition-all"
									style="min-height: 40px"
								>Exact</button>
							</div>
							<input
								type="number"
								bind:value={cashTendered}
								placeholder="Custom amount"
								class="pos-input text-center font-mono text-lg"
								min="0"
							/>
							{#if cashTendered >= activeSubBill.total}
								<div class="flex items-center justify-between rounded-xl bg-status-green-light border border-status-green/20 px-4 py-2">
									<span class="text-sm font-semibold text-status-green">Change</span>
									<span class="font-mono text-lg font-extrabold text-status-green">{formatPeso(cashChange)}</span>
								</div>
							{/if}
						</div>
					{/if}
				</div>

				<div class="flex gap-3 border-t border-border px-6 py-4">
					<button class="btn-ghost flex-1" onclick={handleCancel} style="min-height: 48px">Cancel Split</button>
					<button
						onclick={confirmPayment}
						disabled={!canConfirmPay}
						class="flex flex-1 items-center justify-center gap-2 rounded-xl bg-status-green text-white text-base font-bold hover:bg-emerald-600 active:scale-[0.98] transition-all disabled:opacity-40 disabled:cursor-not-allowed"
						style="min-height: 48px"
					>
						✓ Pay {activeSubBill.label}
					</button>
				</div>
			{:else}
				<!-- All paid -->
				<div class="flex flex-col items-center gap-4 px-6 py-12">
					<span class="text-4xl">✅</span>
					<span class="text-lg font-bold text-gray-900">All sub-bills paid!</span>
					<p class="text-sm text-gray-400 text-center">Total: {formatPeso(order.total)}</p>
				</div>
				<div class="flex gap-3 border-t border-border px-6 py-4">
					<button class="btn-primary flex-1" onclick={() => oncomplete(order)} style="min-height: 48px">
						Done
					</button>
				</div>
			{/if}
		{/if}
	</div>
</div>
