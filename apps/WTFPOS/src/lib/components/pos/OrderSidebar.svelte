<script lang="ts">
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import type { Table, Order } from '$lib/types';
	import { formatPeso, formatTimeAgo, cn } from '$lib/utils';
	import { menuItems, printBill, confirmHeldPayment, cancelHeldPayment, advanceTakeoutStatus, getRefillCount } from '$lib/stores/pos.svelte';
	import { isWithinGracePeriod, removeOrderItem } from '$lib/stores/pos/orders.svelte';
	import ManagerPinModal from './ManagerPinModal.svelte';
	import { session } from '$lib/stores/session.svelte';
	import type { KitchenAlert } from '$lib/stores/alert.svelte';
	import { TriangleAlert } from 'lucide-svelte';
	import { playSound } from '$lib/utils/audio';

	interface Props {
		order: Order | undefined;
		table: Table | null;
		hasTakeoutOrders?: boolean;
		newItemIds?: Set<string>;
		onclose: () => void;
		onadditem: () => void;
		onrefill: () => void;
		oncheckout: () => void;
		onvoid: () => void;
		ontransfer: () => void;
		onchangepackage: () => void;
		onsplit: () => void;
		onchangepax: () => void;
		onmerge?: () => void;
		onattachtakeout?: () => void;
		oncanceltable?: () => void;
		pendingRejections?: KitchenAlert[];
		onacknowledgeRejection?: (alertId: string) => void;
		takeoutSeq?: number;
	}

	let {
		order,
		table,
		onclose,
		onadditem,
		onrefill,
		oncheckout,
		onvoid,
		ontransfer,
		onchangepackage,
		onsplit,
		onchangepax,
		onmerge,
		onattachtakeout,
		hasTakeoutOrders = false,
		newItemIds = new Set(),
		oncanceltable,
		pendingRejections = [],
		onacknowledgeRejection,
		takeoutSeq
	}: Props = $props();

	let showMoreActions = $state(false);
	let sidesExpanded = $state(false);
	let confirmCancel = $state(false);

	// Auto-expand sides during charge animation, collapse after delay
	let _sidesCollapseTimer: ReturnType<typeof setTimeout> | null = null;
	$effect(() => {
		if (newItemIds.size > 0) {
			sidesExpanded = true;
			if (_sidesCollapseTimer) clearTimeout(_sidesCollapseTimer);
			_sidesCollapseTimer = setTimeout(() => { sidesExpanded = false; }, 3000);
		}
	});

	// Grace period item removal state
	let removePinItemId = $state<string | null>(null);
	let showRemovePin = $state(false);

	// Void item reason selection (shown after PIN confirmed)
	let showVoidReasonSelector = $state(false);
	let voidItemReason = $state<'Mistake' | 'Kitchen Error' | 'Guest Changed Mind' | 'Other' | ''>('');
	const VOID_REASONS = ['Mistake', 'Kitchen Error', 'Guest Changed Mind', 'Other'] as const;

	// Ticker: increments every second so grace period state re-evaluates reactively
	let _tick = $state(0);
	$effect(() => {
		const interval = setInterval(() => { _tick++; }, 1000);
		return () => clearInterval(interval);
	});

	/** Returns true if the item is still within the grace period — re-evaluates each tick */
	function inGrace(addedAt: string | undefined): boolean {
		void _tick; // depend on tick so Svelte re-evaluates each second
		return isWithinGracePeriod(addedAt);
	}

	/** Returns seconds remaining in grace period (0 if expired) — re-evaluates each tick */
	function graceSecondsLeft(addedAt: string | undefined): number {
		void _tick;
		if (!addedAt) return 0;
		return Math.max(0, Math.ceil((30_000 - (Date.now() - new Date(addedAt).getTime())) / 1000));
	}


	function handleRemoveItem(item: Order['items'][number]) {
		if (!order) return;
		if (item.status !== 'pending') return;
		if (isWithinGracePeriod(item.addedAt)) {
			removeOrderItem(order.id, item.id);
		} else {
			removePinItemId = item.id;
			showRemovePin = true;
		}
	}

	function takeoutLabel(o: Order) {
		if (takeoutSeq !== undefined && takeoutSeq > 0) {
			return `#TO-${String(takeoutSeq).padStart(3, '0')}`;
		}
		const timeCode = new Date(o.createdAt).getTime() % 1000;
		return `#TO${String(timeCode).padStart(3, '0')}`;
	}

	// O(1) menu item lookup — avoids repeated O(n) scans in the items list
	const menuItemsById = $derived(new Map(menuItems.value.map(m => [m.id, m])));

	// Returns weight/status badge type for an order item
	function itemBadge(item: Order['items'][number]): 'pending' | 'weighing' | 'cooking' | 'served' | null {
		if (item.status === 'cancelled') return null;
		const mi = menuItemsById.get(item.menuItemId);
		// Meats: pending+no weight = awaiting scale; cooking = refill being prepped (still "weighing" phase visually)
		if (mi?.category === 'meats' && (item.status === 'cooking' || (item.status === 'pending' && item.weight === null))) return 'weighing';
		if (item.status === 'cooking') return 'cooking'; // dishes/drinks only
		if (item.status === 'served') return 'served';
		if (item.status === 'pending') return 'pending';
		return null;
	}

	// P1-2: Compute aggregated badge counts for a meat group
	function groupBadgeCounts(instances: Order['items']) {
		const badges = instances.map(i => itemBadge(i)).filter(Boolean);
		return {
			weighing: badges.filter(b => b === 'weighing').length,
			cooking: badges.filter(b => b === 'cooking').length,
			served: badges.filter(b => b === 'served').length,
			pending: badges.filter(b => b === 'pending').length,
			totalWeight: instances.filter(i => i.weight != null).reduce((s, i) => s + (i.weight ?? 0), 0)
		};
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
		order?.items.filter(i => i.status !== 'cancelled' && i.tag !== 'PKG').length ?? 0
	);

	// P1-2: Refill count badge for at-a-glance confirmation
	const refillCount = $derived(getRefillCount(order));

	function isMeatItem(item: Order['items'][number]): boolean {
		return menuItemsById.get(item.menuItemId)?.category === 'meats';
	}

	// AYCE grouped view — null for non-AYCE orders (falls back to flat list)
	const groupedItems = $derived.by(() => {
		if (!order?.packageId) return null;

		// Meats: merge by menuItemId so each cut shows one row with a mini instance log
		const meatMap = new Map<string, Order['items']>();
		const liveSides: Order['items'] = [];
		const pkgItems: Order['items'] = [];
		const otherItems: Order['items'] = [];

		for (const item of order.items) {
			if (item.status === 'cancelled') continue;
			if (item.tag === 'PKG') {
				pkgItems.push(item);
			} else if (isMeatItem(item)) {
				const group = meatMap.get(item.menuItemId) ?? [];
				group.push(item);
				meatMap.set(item.menuItemId, group);
			} else if (item.tag === 'FREE') {
				liveSides.push(item);
			} else {
				otherItems.push(item);
			}
		}

		// Preserve first-occurrence order; flag groups with any non-served instance
		const meatGroups = Array.from(meatMap.values()).map(instances => ({
			menuItemId: instances[0].menuItemId,
			menuItemName: instances[0].menuItemName,
			tag: instances[0].tag as 'FREE' | 'PKG' | null,
			instances,
			hasLive: instances.some(i => i.status !== 'served'),
		}));

		return { meatGroups, liveSides, pkgItems, otherItems };
	});

	// Fix 4: Flash BILL total when order total changes after pax update
	let billFlash = $state(false);
	let prevTotal: number | undefined;
	let billFlashTimer: ReturnType<typeof setTimeout> | null = null;

	$effect(() => {
		const total = order?.total;
		if (prevTotal !== undefined && total !== undefined && total !== prevTotal) {
			billFlash = true;
			if (billFlashTimer) clearTimeout(billFlashTimer);
			billFlashTimer = setTimeout(() => { billFlash = false; billFlashTimer = null; }, 500);
		}
		prevTotal = total;
		return () => { if (billFlashTimer) clearTimeout(billFlashTimer); };
	});

</script>

<!-- Status badge snippet — used in itemRow for flat list and AYCE side rows -->
{#snippet statusBadge(badge: ReturnType<typeof itemBadge>, isRefill = false)}
	{#if badge === 'pending'}
		{#if isRefill}
			<span class="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold bg-violet-100 text-violet-800 animate-pulse">REQUESTING</span>
		{:else}
			<span class="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold bg-blue-100 text-blue-800">SENT</span>
		{/if}
	{:else if badge === 'weighing'}
		{#if session.role === 'manager' || session.role === 'owner'}
			<span class="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">WEIGHING {order?.createdAt ? formatTimeAgo(order.createdAt) : ''}</span>
		{/if}
	{:else if badge === 'cooking'}
		<span class="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold bg-orange-100 text-orange-800">COOKING</span>
	{:else if badge === 'served'}
		<span class="shrink-0 rounded px-1.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-600">✓ SERVED</span>
	{/if}
{/snippet}

<!-- P1-2: Aggregated badge counts for AYCE meat groups -->
{#snippet badgesBlock(counts: ReturnType<typeof groupBadgeCounts>)}
	<div class="flex items-center gap-1 flex-wrap justify-end">
		{#if counts.totalWeight > 0}
			<span class="text-[10px] text-gray-400">{counts.totalWeight}g</span>
		{/if}
		{#if counts.served > 0}
			<span class="rounded px-1.5 py-0.5 text-xs font-bold bg-emerald-100 text-emerald-600">{counts.served > 1 ? `${counts.served}× ` : ''}✓ SERVED</span>
		{/if}
		{#if counts.cooking > 0}
			<span class="rounded px-1.5 py-0.5 text-xs font-bold bg-orange-100 text-orange-800">{counts.cooking > 1 ? `${counts.cooking}× ` : ''}COOKING</span>
		{/if}
		{#if counts.weighing > 0}
			{#if session.role === 'manager' || session.role === 'owner'}
				<span class="rounded px-1.5 py-0.5 text-xs font-bold bg-amber-100 text-amber-800 animate-pulse">{counts.weighing > 1 ? `${counts.weighing}× ` : ''}WEIGHING</span>
			{/if}
		{/if}
		{#if counts.pending > 0}
			<span class="rounded px-1.5 py-0.5 text-xs font-bold bg-violet-100 text-violet-800 animate-pulse">{counts.pending > 1 ? `${counts.pending}× ` : ''}REQUESTING</span>
		{/if}
	</div>
{/snippet}

<!-- Shared item row snippet — used in AYCE grouped sections and non-AYCE flat list -->
{#snippet itemRow(item: Order['items'][number], dimmed = false)}
	{@const badge = itemBadge(item)}
	{@const isNew = newItemIds.has(item.id)}
	<div class={cn(
		'flex items-start justify-between py-2.5 transition-all',
		item.status === 'cancelled' && 'opacity-40',
		dimmed && 'opacity-40',
		isNew && 'charge-item-flash'
	)}>
		<div class="flex flex-col gap-0.5 flex-1 min-w-0 pr-2">
			<div class="flex items-center gap-1.5 flex-wrap">
				<span class="text-sm font-medium text-gray-900 truncate">{item.menuItemName}</span>
				{@render statusBadge(badge, item.tag === 'FREE')}
				{#if item.weight != null && badge !== 'weighing'}
					<span class="text-xs text-gray-400">{item.weight}g</span>
				{/if}
			</div>
			{#if item.notes && item.notes !== 'refill'}
				<p class="text-xs text-gray-400 pl-1 italic">"{item.notes}"</p>
			{/if}
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
			{#if item.status === 'pending' && order}
				{@const grace = inGrace(item.addedAt)}
				{@const secsLeft = grace ? graceSecondsLeft(item.addedAt) : 0}
				<button
					onclick={() => handleRemoveItem(item)}
					class={cn(
						'flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full transition-colors shrink-0 relative',
						grace
							? 'text-emerald-600 hover:bg-emerald-50 ring-1 ring-emerald-300'
							: 'text-gray-400 hover:bg-red-50 hover:text-red-500'
					)}
					title={grace ? `Within grace period — ${secsLeft}s remaining, tap to remove instantly` : 'Manager PIN required to remove'}
				>
					{#if grace}
						<span class="flex flex-col items-center leading-none gap-0.5">
							<span class="text-sm">✕</span>
							<span class="text-[10px] font-mono text-gray-400">{Math.floor(secsLeft / 60)}:{String(secsLeft % 60).padStart(2, '0')}</span>
						</span>
					{:else}
						<span class="flex flex-col items-center leading-none gap-0.5">
							<span class="text-sm">🔒</span>
						</span>
					{/if}
				</button>
			{/if}
		</div>
	</div>
{/snippet}

<div class="pos-order-sidebar flex w-full lg:w-[380px] shrink-0 flex-col lg:border-l border-border bg-surface overflow-hidden min-h-0">
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
		<div class="flex flex-col gap-1.5 sm:gap-2 border-b border-border px-3 sm:px-4 py-2.5 sm:py-3">
			<div class="flex items-center justify-between">
				<div class="flex items-center gap-1.5 sm:gap-2 flex-wrap">
					{#if order.orderType === 'takeout'}
						<span class="rounded-md bg-accent px-1.5 sm:px-2 py-0.5 text-[9px] sm:text-[10px] font-bold text-white">TAKEOUT</span>
						<span class="text-base sm:text-lg font-extrabold text-gray-900">{order.customerName ?? 'Walk-in'}</span>
					{:else}
						<span class="text-base sm:text-lg font-extrabold text-gray-900">{table?.label}</span>
						<button
							onclick={onchangepax}
							class="flex items-center gap-1 rounded-full bg-surface-secondary px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-gray-600 hover:bg-orange-50 hover:text-accent transition-colors cursor-pointer"
							style="min-height: unset"
							title="Change guest count"
						>
							{order.pax}p ✎
						</button>
						{#if table?.elapsedSeconds !== null}
							<span class="rounded-full bg-gray-100 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-medium text-gray-500">
								{Math.floor((table?.elapsedSeconds ?? 0) / 60)}m
							</span>
						{/if}
					{/if}
				</div>
				<button onclick={onclose} class="flex min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] items-center justify-center rounded-full bg-gray-100 lg:bg-transparent text-gray-500 lg:text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors text-base sm:text-lg font-bold">✕</button>
			</div>

			{#if order.orderType === 'takeout'}
				{@const tStatus = order.takeoutStatus ?? 'new'}
				<div class="flex items-center justify-between rounded-lg bg-orange-50 border border-dashed border-orange-200 px-2.5 sm:px-3 py-1">
					<div class="flex items-center gap-1.5 sm:gap-2">
						<span class="font-mono text-[10px] sm:text-xs font-bold text-accent">{takeoutLabel(order)}</span>
						<span class="text-[10px] sm:text-xs text-gray-400">{formatTimeAgo(order.createdAt)}</span>
						<span class={cn(
							'rounded px-1 sm:px-1.5 py-0.5 text-[9px] sm:text-[10px] font-bold text-white',
							tStatus === 'new' ? 'bg-blue-500' :
							tStatus === 'preparing' ? 'bg-yellow-500' :
							tStatus === 'ready' ? 'bg-status-green' :
							'bg-gray-400'
						)}>
							{tStatus.toUpperCase()}
						</span>
					</div>
					{#if tStatus === 'ready' && session.role !== 'staff'}
						<button
							onclick={() => advanceTakeoutStatus(order.id)}
							class="text-[10px] font-semibold text-accent hover:underline"
							style="min-height: unset"
						>
							Picked Up
						</button>
					{/if}
				</div>
			{:else if order.packageName}
				<div class="flex items-center gap-2">
					<span class="text-xs sm:text-sm font-semibold text-gray-700">{order.packageName}</span>
					{#if refillCount > 0}
						<span class="inline-flex items-center gap-0.5 rounded-full bg-status-green/10 px-1.5 py-0.5 text-[10px] sm:text-[11px] font-semibold text-status-green">
							{refillCount}× refill
						</span>
					{/if}
				</div>
			{/if}

			<!-- Action buttons: REFILL + ADD ITEM for AYCE, or plain ADD for others -->
			{#if order.orderType === 'dine-in' && order.packageId && order.status === 'open'}
				<div class="flex gap-1.5 sm:gap-2">
					<button
						onclick={() => { playSound('click'); onrefill(); }}
						class="flex-[2] rounded-lg sm:rounded-xl bg-accent text-sm sm:text-lg font-bold text-white hover:bg-accent-dark active:scale-95 transition-all"
						style="min-height: 40px"
					>
						Refill
					</button>
					<button
						onclick={() => { playSound('click'); onadditem(); }}
						class="flex-1 rounded-lg sm:rounded-xl border-2 border-accent bg-accent-light px-3 sm:px-4 text-sm sm:text-lg font-bold text-accent hover:bg-accent/10 active:scale-95 transition-all"
						style="min-height: 40px"
					>
						+ Add
					</button>
				</div>
			{:else if order.status === 'open'}
				<button onclick={() => { playSound('click'); onadditem(); }} class="btn-primary w-full text-sm sm:text-lg rounded-lg sm:rounded-xl" style="min-height: 40px">+ Add Item</button>
			{/if}
		</div>

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
		<div class="flex-1 overflow-y-auto divide-y divide-border-light px-4 pt-1">
			{#if groupedItems}
				<!-- AYCE grouped view -->

				<!-- A: Package line — always first -->
				{#each groupedItems.pkgItems as item (item.id)}
					{@render itemRow(item, false)}
				{/each}

				<!-- B+C: Meats & Sides — indented under package -->
				{#if groupedItems.meatGroups.length > 0 || groupedItems.liveSides.length > 0}
					<div class="ml-3 border-l-2 border-orange-200 pl-3">

						<!-- Meats — one row per cut, mini instance log below name -->
						{#if groupedItems.meatGroups.length > 0}
							<div class="-mx-3 px-3 py-1.5 bg-orange-50">
								<span class="text-xs font-bold uppercase tracking-widest text-orange-400">Meats</span>
							</div>
							{#each groupedItems.meatGroups as group, i (group.menuItemId)}
								<div class={cn('flex items-center justify-between py-2.5 gap-2 -mx-3 px-3', i % 2 === 1 && 'bg-gray-50')}>
									<span class={cn('text-sm font-medium text-gray-900 truncate shrink-0', !group.hasLive && 'opacity-50')}>
									{group.menuItemName}
									{#if group.instances.length > 1}
										<span class="text-xs text-gray-400 font-normal">× {group.instances.length}</span>
									{/if}
								</span>
									<!-- P1-2: Aggregated status badges instead of stacking per instance -->
									{@render badgesBlock(groupBadgeCounts(group.instances))}
								</div>
							{/each}
						{/if}

						<!-- Sides — collapsed by default -->
						{#if groupedItems.liveSides.length > 0}
							<div class="-mx-3 px-3 py-1.5 bg-emerald-50">
								<span class="text-xs font-bold uppercase tracking-widest text-status-green">Sides</span>
							</div>
							{@const sidesRequesting = groupedItems.liveSides.filter(i => i.status === 'pending' || i.status === 'cooking').length}
							{@const sidesServed = groupedItems.liveSides.filter(i => i.status === 'served').length}
							<button
								onclick={() => { sidesExpanded = !sidesExpanded; }}
								class="flex w-full items-center justify-between py-2 text-left"
								style="min-height: 36px"
							>
								<span class="flex items-center gap-2 text-xs">
									{#if sidesRequesting > 0}
										<span class="text-gray-500 font-semibold">{sidesRequesting} pending</span>
									{/if}
									{#if sidesServed > 0}
										<span class="text-status-green font-semibold">{sidesServed} served</span>
									{/if}
									{#if sidesRequesting === 0 && sidesServed === 0}
										<span class="text-gray-400">{groupedItems.liveSides.length} sides</span>
									{/if}
								</span>
								<span class="text-[10px] text-gray-400">{sidesExpanded ? '▲ hide' : '▼ show'}</span>
							</button>
							{#if sidesExpanded}
								<div transition:slide={{ duration: 300, easing: cubicOut }}>
									{#each groupedItems.liveSides as item (item.id)}
										{@render itemRow(item, true)}
									{/each}
								</div>
							{/if}
						{/if}

					</div>
				{/if}

				<!-- C: Other charged add-ons (non-AYCE items on this order) -->
				{#each groupedItems.otherItems as item (item.id)}
					{@render itemRow(item, false)}
				{/each}

			{:else}
				<!-- Non-AYCE flat list — unchanged behaviour, includes cancelled items -->
				{#each order.items as item (item.id)}
					{@render itemRow(item, false)}
				{/each}
			{/if}
		</div>

		<!-- ── Meat Stats Bar ── -->
		{#if totalMeatGrams > 0}
			<div class="mx-4 mb-2 flex items-center justify-between rounded-lg bg-surface-secondary px-3 py-2 shrink-0">
				<span class="text-xs font-semibold text-gray-500">Meat dispatched</span>
				<span class="font-mono text-xs font-bold text-gray-700">{(totalMeatGrams / 1000).toFixed(2)}kg ({totalMeatGrams}g)</span>
			</div>
		{/if}

		<!-- ── Bill Total ── -->
		<div class="border-t border-border px-4 py-3 flex items-center justify-between shrink-0">
			<div class="flex flex-col gap-0.5">
				<span class="text-base font-bold text-gray-900">BILL</span>
				<span class="text-xs text-gray-400">{activeItemCount} items</span>
				{#if order.discountType !== 'none' && order.discountAmount > 0}
					<span class="text-xs font-semibold text-status-green">
						{order.discountType === 'senior' ? 'SC' : order.discountType === 'pwd' ? 'PWD' : order.discountType.toUpperCase()} −{formatPeso(order.discountAmount)}
					</span>
				{/if}
			</div>
			<span class={cn('font-mono text-2xl font-extrabold transition-colors duration-300', billFlash ? 'text-accent' : 'text-gray-900')}>{formatPeso(order.total)}</span>
		</div>

		<!-- ── Primary Actions ── -->
		<div class="flex flex-col gap-2 px-4 pb-4 shrink-0">
			{#if order.status === 'pending_payment'}
				<div class="flex items-center justify-center gap-2 rounded-lg bg-cyan-50 border border-cyan-200 px-3 py-2 mb-1">
					<span class="text-xs font-bold text-cyan-700 uppercase tracking-wider">Awaiting {order.pendingPaymentMethod === 'maya' ? 'Maya' : 'GCash'} Confirmation</span>
				</div>
				<div class="flex gap-2">
					<button onclick={() => cancelHeldPayment(order.id)} class="btn-ghost flex-1 text-sm border border-gray-300" style="min-height: 44px">Cancel Hold</button>
					<button onclick={() => confirmHeldPayment(order.id)} class="btn-success flex-1 text-sm bg-cyan-600 hover:bg-cyan-700 text-white" style="min-height: 44px">Confirm Payment</button>
				</div>
			{:else}
				{#if activeItemCount === 0 && oncanceltable}
				<!-- P0-3: Cancel table button when no items have been added -->
				{#if confirmCancel}
					<div class="flex flex-col gap-2 rounded-lg border border-status-red bg-red-50 p-3">
						<p class="text-xs font-semibold text-status-red">Cancel this table? Pax entry will be removed.</p>
						<div class="flex gap-2">
							<button onclick={() => confirmCancel = false} class="btn-ghost flex-1 text-xs border border-gray-300" style="min-height: 40px">Keep</button>
							<button onclick={() => { playSound('warning'); confirmCancel = false; oncanceltable?.(); }} class="btn-danger flex-1 text-xs" style="min-height: 40px">Yes, Cancel</button>
						</div>
					</div>
				{:else}
					<button onclick={() => confirmCancel = true} class="btn-ghost w-full border border-status-red text-status-red hover:bg-red-50 text-sm font-semibold flex items-center justify-center gap-1.5" style="min-height: 44px">
						<TriangleAlert class="h-4 w-4" /> Cancel Table
					</button>
				{/if}
			{:else}
				<!-- Secondary actions row: Print + Void (smaller, less prominent) -->
				<div class="flex gap-2">
					<button onclick={() => { playSound('click'); printBill(order.id); }} disabled={activeItemCount === 0} class={cn('btn-secondary flex-1 px-3 text-sm bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-800', activeItemCount === 0 && 'opacity-40 pointer-events-none')} style="min-height: 40px">Print</button>
					<button onclick={() => { playSound('warning'); onvoid(); }} disabled={activeItemCount === 0} class={cn('btn-ghost flex-1 px-3 text-sm border border-status-red text-status-red hover:bg-red-50', activeItemCount === 0 && 'opacity-40 pointer-events-none')} style="min-height: 40px">Void</button>
				</div>
				<!-- Primary CTA: Checkout — full width, visually dominant -->
				<button onclick={() => { playSound('click'); oncheckout(); }} disabled={activeItemCount === 0} class={cn('w-full rounded-xl text-base font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all shadow-md', activeItemCount === 0 && 'opacity-40 pointer-events-none')} style="min-height: 56px">✓ Checkout</button>
			{/if}
			{/if}

			<!-- Table Actions (overflow) -->
			<button
				onclick={() => { showMoreActions = !showMoreActions; }}
				class="w-full rounded-lg border border-border bg-surface py-2 text-xs font-semibold text-gray-500 hover:bg-gray-50 transition-all flex flex-col items-center gap-0.5"
				style="min-height: 44px"
			>
				<span>{showMoreActions ? '▲ Hide' : 'More ▼'}</span>
				{#if !showMoreActions}
					<span class="text-[10px] font-normal text-gray-400">Transfer · Merge · Split · Pax</span>
				{/if}
			</button>

			{#if showMoreActions}
				<div class="flex gap-2 flex-wrap">
					{#if order.orderType === 'dine-in' && table}
						<button onclick={ontransfer} class="btn-secondary flex-1 text-xs" style="min-height: 44px">Transfer</button>
						<button onclick={onchangepax} class="btn-secondary flex-1 text-xs" style="min-height: 44px">Pax</button>
					{/if}
					{#if order.packageId && order.orderType === 'dine-in'}
						<button onclick={onchangepackage} class="btn-secondary flex-1 text-xs" style="min-height: 44px">Change Pkg</button>
					{/if}
					{#if activeItemCount > 0}
						<button onclick={onsplit} class="btn-secondary flex-1 text-xs" style="min-height: 44px">Split Bill</button>
					{/if}
					{#if order.orderType === 'dine-in' && table && onmerge}
						<button onclick={onmerge} class="btn-secondary flex-1 text-xs" style="min-height: 44px">Merge</button>
					{/if}
					{#if order.orderType === 'dine-in' && table && onattachtakeout && hasTakeoutOrders}
						<button onclick={onattachtakeout} class="btn-secondary flex-1 text-xs" style="min-height: 44px">Attach Takeout</button>
					{/if}
				</div>
			{/if}
		</div>
	{/if}
</div>

<ManagerPinModal
	isOpen={showRemovePin}
	title="Void Item"
	description="Grace period has expired. Enter Manager PIN to void this item."
	confirmLabel="Void"
	confirmClass="btn-danger"
	onClose={() => { showRemovePin = false; removePinItemId = null; }}
	onConfirm={() => {
		showRemovePin = false;
		voidItemReason = '';
		showVoidReasonSelector = true;
	}}
/>

<!-- Void Item Reason Selector (shown after PIN confirmed) -->
{#if showVoidReasonSelector}
	<div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
		<div class="pos-card w-full max-w-[340px] flex flex-col gap-4">
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold text-gray-900">Void Reason</h3>
				<p class="text-sm text-gray-500">Select the reason for voiding this item.</p>
			</div>
			<div class="flex flex-col gap-2">
				{#each VOID_REASONS as reason}
					<button
						onclick={() => { voidItemReason = reason; }}
						class={cn(
							'rounded-xl border-2 px-4 py-3 text-sm font-semibold text-left transition-colors',
							voidItemReason === reason
								? 'border-status-red bg-red-50 text-status-red'
								: 'border-border bg-surface text-gray-700 hover:border-red-300 hover:bg-red-50'
						)}
					>{reason}</button>
				{/each}
			</div>
			<div class="flex gap-2 mt-1">
				<button
					class="btn-ghost flex-1"
					style="min-height: 44px"
					onclick={() => { showVoidReasonSelector = false; removePinItemId = null; voidItemReason = ''; }}
				>Cancel</button>
				<button
					class="btn-danger flex-1 disabled:opacity-40"
					style="min-height: 44px"
					disabled={!voidItemReason}
					onclick={() => {
						playSound('warning');
						if (order && removePinItemId) removeOrderItem(order.id, removePinItemId, voidItemReason || undefined);
						showVoidReasonSelector = false;
						removePinItemId = null;
						voidItemReason = '';
					}}
				>Void Item</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.charge-item-flash {
		animation: itemSlideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1) both,
		           itemHighlight 1.5s ease-out 0.15s both;
	}

	@keyframes itemSlideIn {
		from {
			opacity: 0;
			transform: translateX(-12px);
		}
		to {
			opacity: 1;
			transform: translateX(0);
		}
	}

	@keyframes itemHighlight {
		0% {
			background-color: rgba(234, 88, 12, 0.15);
		}
		100% {
			background-color: transparent;
		}
	}
</style>

