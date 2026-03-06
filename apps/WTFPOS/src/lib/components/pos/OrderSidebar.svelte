<script lang="ts">
	import type { Table, Order } from '$lib/types';
	import { formatPeso, formatTimeAgo, cn } from '$lib/utils';
	import { menuItems, printBill, confirmHeldPayment, cancelHeldPayment, advanceTakeoutStatus } from '$lib/stores/pos.svelte';
	import type { KitchenAlert } from '$lib/stores/alert.svelte';
	import RefillPanel from '$lib/components/pos/RefillPanel.svelte';

	interface Props {
		order: Order | undefined;
		table: Table | null;
		onclose: () => void;
		onadditem: () => void;
		oncheckout: () => void;
		onvoid: () => void;
		ontransfer: () => void;
		onchangepackage: () => void;
		onsplit: () => void;
		onchangepax: () => void;
		onmerge?: () => void;
		pendingRejections?: KitchenAlert[];
		onacknowledgeRejection?: (alertId: string) => void;
	}

	let {
		order,
		table,
		onclose,
		onadditem,
		oncheckout,
		onvoid,
		ontransfer,
		onchangepackage,
		onsplit,
		onchangepax,
		onmerge,
		pendingRejections = [],
		onacknowledgeRejection
	}: Props = $props();

	let showRefillPanel = $state(false);
	let showMoreActions = $state(false);

	function takeoutLabel(o: Order) {
		const timeCode = new Date(o.createdAt).getTime() % 1000;
		return `#TO${String(timeCode).padStart(3, '0')}`;
	}

	// O(1) menu item lookup — avoids repeated O(n) scans in the items list
	const menuItemsById = $derived(new Map(menuItems.value.map(m => [m.id, m])));

	// Returns weight/status badge type for an order item
	function itemBadge(item: Order['items'][number]): 'pending' | 'weighing' | 'cooking' | 'served' | null {
		if (item.status === 'cancelled') return null;
		const mi = menuItemsById.get(item.menuItemId);
		if (mi?.category === 'meats' && item.status === 'pending' && item.weight === null) return 'weighing';
		if (item.status === 'cooking') return 'cooking';
		if (item.status === 'served') return 'served';
		if (item.status === 'pending') return 'pending';
		return null;
	}

	const totalMeatGrams = $derived(
		order?.items
			.filter(i => {
				const mi = menuItemsById.get(i.menuItemId);
				return mi?.category === 'meats' && i.weight !== null && i.status !== 'cancelled';
			})
			.reduce((s, i) => s + (i.weight ?? 0), 0) ?? 0
	);

	const activeItemCount = $derived(
		order?.items.filter(i => i.status !== 'cancelled').length ?? 0
	);
</script>

<div class="flex w-[380px] shrink-0 flex-col border-l border-border bg-surface overflow-y-auto">
	{#if !order}
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
		<!-- ── Header ── -->
		<div class="flex flex-col gap-2 border-b border-border px-4 py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-2 flex-wrap">
					{#if order.orderType === 'takeout'}
						<span class="rounded-md bg-accent px-2 py-0.5 text-[10px] font-bold text-white">TAKEOUT</span>
						<span class="text-lg font-extrabold text-gray-900">{order.customerName ?? 'Walk-in'}</span>
					{:else}
						<span class="text-lg font-extrabold text-gray-900">{table?.label}</span>
						<span class="flex items-center gap-1 rounded-full bg-surface-secondary px-2 py-0.5 text-xs font-medium text-gray-600">
							{order.pax} pax
						</span>
						{#if table?.elapsedSeconds !== null}
							<span class="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-500">
								{Math.floor((table?.elapsedSeconds ?? 0) / 60)}m
							</span>
						{/if}
					{/if}
				</div>
				<button onclick={onclose} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
			</div>

			{#if order.orderType === 'takeout'}
				{@const tStatus = order.takeoutStatus ?? 'new'}
				<div class="flex items-center justify-between rounded-lg bg-orange-50 border border-dashed border-orange-200 px-3 py-1.5">
					<div class="flex items-center gap-2">
						<span class="font-mono text-xs font-bold text-accent">{takeoutLabel(order)}</span>
						<span class={cn(
							'rounded px-1.5 py-0.5 text-[10px] font-bold text-white',
							tStatus === 'new' ? 'bg-blue-500' :
							tStatus === 'preparing' ? 'bg-yellow-500' :
							tStatus === 'ready' ? 'bg-status-green' :
							'bg-gray-400'
						)}>
							{tStatus.toUpperCase()}
						</span>
					</div>
					{#if tStatus === 'ready'}
						<button
							onclick={() => advanceTakeoutStatus(order.id)}
							class="text-[10px] font-semibold text-accent hover:underline"
							style="min-height: unset"
						>
							Mark Picked Up
						</button>
					{/if}
				</div>
			{:else if order.packageName}
				<div class="text-sm font-semibold text-gray-700">{order.packageName}</div>
			{/if}

			<!-- Action buttons: REFILL (primary) + MORE (secondary) for AYCE, or plain ADD for others -->
			{#if order.orderType === 'dine-in' && order.packageId && order.status === 'open'}
				<div class="flex gap-2">
					<button
						onclick={() => { showRefillPanel = !showRefillPanel; showMoreActions = false; }}
						class={cn(
							'flex-1 rounded-xl text-sm font-bold transition-all active:scale-95',
							showRefillPanel
								? 'bg-accent-dark text-white'
								: 'bg-accent text-white hover:bg-accent-dark'
						)}
						style="min-height: 56px"
					>
						Refill
					</button>
					<button
						onclick={() => { onadditem(); showRefillPanel = false; }}
						class="rounded-xl border border-border bg-surface px-4 text-sm font-semibold text-gray-700 hover:bg-gray-50 active:scale-95 transition-all"
						style="min-height: 56px"
					>
						+ More
					</button>
				</div>
			{:else if order.status === 'open'}
				<button onclick={onadditem} class="btn-primary w-full text-sm" style="min-height: 44px">+ Add Item</button>
			{/if}
		</div>

		<!-- ── Inline Refill Panel ── -->
		{#if showRefillPanel && order.status === 'open'}
			<RefillPanel {order} onclose={() => showRefillPanel = false} />
		{/if}

		<!-- ── Kitchen Rejection Alerts ── -->
		{#if pendingRejections.length > 0}
			<div class="mx-4 mt-3 rounded-lg border-2 border-status-red bg-status-red-light p-3">
				<div class="flex items-center justify-between mb-2">
					<span class="flex items-center gap-1.5 text-xs font-bold text-status-red uppercase tracking-wider">
						<span class="animate-pulse">!</span> Kitchen Rejections ({pendingRejections.length})
					</span>
					{#if onacknowledgeRejection}
						<button
							onclick={() => { for (const a of pendingRejections) onacknowledgeRejection?.(a.id); }}
							class="text-[10px] font-semibold text-status-red hover:underline"
						>
							Acknowledge All
						</button>
					{/if}
				</div>
				<div class="flex flex-col gap-2">
					{#each pendingRejections as alert (alert.id)}
						<div class="flex items-start justify-between rounded bg-white p-2 shadow-sm">
							<div class="flex flex-col gap-0.5">
								<span class="text-xs font-semibold text-gray-900">{alert.itemName}</span>
								<span class="text-[10px] text-gray-500">{alert.reason}</span>
								<span class="text-[9px] text-gray-400">{formatTimeAgo(alert.createdAt)}</span>
							</div>
							{#if onacknowledgeRejection}
								<button
									onclick={() => onacknowledgeRejection?.(alert.id)}
									class="rounded bg-status-red px-2 py-1 text-[10px] font-bold text-white hover:bg-red-600 transition-colors"
								>
									✓
								</button>
							{/if}
						</div>
					{/each}
				</div>
			</div>
		{/if}

		<!-- ── Items List ── -->
		<div class="flex-1 divide-y divide-border-light px-4 pt-1">
			{#each order.items as item (item.id)}
				{@const badge = itemBadge(item)}
				<div class={cn('flex items-start justify-between py-2.5', item.status === 'cancelled' && 'opacity-40')}>
					<div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
						<div class="flex items-center gap-1.5 flex-wrap">
							<span class="text-sm font-medium text-gray-900 truncate">{item.menuItemName}</span>
							{#if badge === 'pending'}
								<span class="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold bg-blue-100 text-blue-600">SENT</span>
							{:else if badge === 'weighing'}
								<span class="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold bg-amber-100 text-amber-700 animate-pulse">WEIGHING</span>
							{:else if badge === 'cooking'}
								<span class="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold bg-orange-100 text-orange-600">COOKING</span>
							{:else if badge === 'served'}
								<span class="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold bg-emerald-100 text-emerald-600">✓ SERVED</span>
							{/if}
							{#if item.weight != null && badge !== 'weighing'}
								<span class="text-xs text-gray-400">{item.weight}g</span>
							{/if}
						</div>
						{#if item.status === 'cancelled'}
							<span class="text-xs italic text-status-red">voided</span>
						{/if}
					</div>
					<div class="flex items-center gap-2 shrink-0">
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

		<!-- ── Meat Stats Bar ── -->
		{#if totalMeatGrams > 0}
			<div class="mx-4 mb-2 flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2">
				<span class="text-xs font-semibold text-gray-500">Meat dispatched</span>
				<span class="font-mono text-xs font-bold text-gray-700">{(totalMeatGrams / 1000).toFixed(2)}kg ({totalMeatGrams}g)</span>
			</div>
		{/if}

		<!-- ── Bill Total ── -->
		<div class="border-t border-border px-4 py-3 flex items-center justify-between">
			<div class="flex flex-col gap-0.5">
				<span class="text-base font-bold text-gray-900">BILL</span>
				<span class="text-xs text-gray-400">{activeItemCount} items</span>
			</div>
			<span class="font-mono text-2xl font-extrabold text-gray-900">{formatPeso(order.total)}</span>
		</div>

		<!-- ── Primary Actions ── -->
		<div class="flex flex-col gap-2 px-4 pb-4">
			{#if order.status === 'pending_payment'}
				<div class="flex items-center justify-center gap-2 rounded-lg bg-cyan-50 border border-cyan-200 px-3 py-2 mb-1">
					<span class="text-xs font-bold text-cyan-700 uppercase tracking-wider">Awaiting {order.pendingPaymentMethod === 'maya' ? 'Maya' : 'GCash'} Confirmation</span>
				</div>
				<div class="flex gap-2">
					<button onclick={() => cancelHeldPayment(order.id)} class="btn-ghost flex-1 text-sm border border-gray-300" style="min-height: 44px">Cancel Hold</button>
					<button onclick={() => confirmHeldPayment(order.id)} class="btn-success flex-1 text-sm bg-cyan-600 hover:bg-cyan-700 text-white" style="min-height: 44px">Confirm Payment</button>
				</div>
			{:else}
				<div class="flex gap-2">
					<button onclick={onvoid} class="btn-danger px-3 text-sm" style="min-height: 44px">Void</button>
					<button onclick={oncheckout} class="btn-success flex-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white" style="min-height: 44px">Checkout</button>
					<button onclick={() => printBill(order.id)} class="btn-secondary px-3 text-sm bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800" style="min-height: 44px">Print</button>
				</div>
			{/if}

			<!-- More Options (overflow) -->
			<button
				onclick={() => { showMoreActions = !showMoreActions; showRefillPanel = false; }}
				class="w-full rounded-lg border border-border bg-surface py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all"
				style="min-height: 36px"
			>
				{showMoreActions ? 'Hide Options' : 'More Options'}
			</button>

			{#if showMoreActions}
				<div class="flex gap-2 flex-wrap">
					{#if order.orderType === 'dine-in' && table}
						<button onclick={ontransfer} class="btn-secondary flex-1 text-xs" style="min-height: 36px">Transfer</button>
						<button onclick={onchangepax} class="btn-secondary flex-1 text-xs" style="min-height: 36px">Pax</button>
					{/if}
					{#if order.packageId && order.orderType === 'dine-in'}
						<button onclick={onchangepackage} class="btn-secondary flex-1 text-xs" style="min-height: 36px">Change Pkg</button>
					{/if}
					{#if order.items.filter(i => i.status !== 'cancelled').length > 0}
						<button onclick={onsplit} class="btn-secondary flex-1 text-xs" style="min-height: 36px">Split Bill</button>
					{/if}
					{#if order.orderType === 'dine-in' && table && onmerge}
						<button onclick={onmerge} class="btn-secondary flex-1 text-xs" style="min-height: 36px">Merge</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>
