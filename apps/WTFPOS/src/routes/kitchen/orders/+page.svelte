<script lang="ts">
	import { kdsTickets, kdsTicketHistory, markItemServed, toggleMenuItemAvailability, menuItems, recallLastTicket, recallTicket, REFILL_NOTE } from '$lib/stores/pos.svelte';
	import type { KdsTicket, KdsTicketItem } from '$lib/types';
	import { refuseItem } from '$lib/stores/alert.svelte';
	import { formatCountdown, formatTimeAgo, formatDisplayId, cn } from '$lib/utils';
	import { printKitchenOrder } from '$lib/stores/hardware.svelte';
	import { TriangleAlert, Check, ChevronDown, ChevronUp } from 'lucide-svelte';
	import { untrack } from 'svelte';
	import KdsHistoryModal from '$lib/components/kitchen/KdsHistoryModal.svelte';
	import RefuseReasonModal from '$lib/components/kitchen/RefuseReasonModal.svelte';

	// ── UI State ──
	let showKdsHistory = $state(false);
	let expandedItemId = $state<string | null>(null);

	// Refuse modal
	let refuseTarget = $state<{ orderId: string; tableNumber: number | null; itemName: string } | null>(null);

	// ── Toast ──
	interface ToastState {
		message: string;
		visible: boolean;
		undoFn: (() => void) | null;
	}
	let toast = $state<ToastState>({ message: '', visible: false, undoFn: null });
	let toastTimer: ReturnType<typeof setTimeout> | null = null;

	function showToast(message: string, undoFn: (() => void) | null = null) {
		if (toastTimer) clearTimeout(toastTimer);
		toast = { message, visible: true, undoFn };
		toastTimer = setTimeout(() => {
			toast = { message: '', visible: false, undoFn: null };
			toastTimer = null;
		}, 3000);
	}

	function dismissToast() {
		if (toastTimer) clearTimeout(toastTimer);
		toast = { message: '', visible: false, undoFn: null };
		toastTimer = null;
	}

	// ── Live Timer ──
	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => { now = Date.now(); }, 1000);
		return () => clearInterval(id);
	});

	function ageMs(createdAt: string) { return now - new Date(createdAt).getTime(); }

	function timerText(createdAt: string): string {
		return formatCountdown(Math.floor(ageMs(createdAt) / 1000));
	}

	// ── Active Tickets (merged by orderId, sorted oldest-first) ──
	const activeTickets = $derived.by(() => {
		const raw = kdsTickets.value.filter((t) => t.items.some((i) => i.status !== 'served' && i.status !== 'cancelled'));
		// Merge tickets sharing the same orderId into one virtual ticket
		const byOrder = new Map<string, KdsTicket>();
		for (const t of raw) {
			const existing = byOrder.get(t.orderId);
			if (existing) {
				// Merge items into the earliest ticket, keep earliest createdAt
				const merged: KdsTicket = {
					...existing,
					items: [...existing.items, ...t.items],
					createdAt: existing.createdAt < t.createdAt ? existing.createdAt : t.createdAt,
					printStatus: existing.printStatus === 'failed' || t.printStatus === 'failed' ? 'failed' : existing.printStatus,
				};
				byOrder.set(t.orderId, merged);
			} else {
				byOrder.set(t.orderId, { ...t, items: [...t.items] });
			}
		}
		return Array.from(byOrder.values())
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
	});

	// ── Stats ──
	const queueOrders = $derived(activeTickets.length);
	const activeTables = $derived(new Set(activeTickets.map((t) => t.tableNumber)).size);
	const totalItems = $derived(
		activeTickets.reduce((sum, t) => sum + t.items.filter(i => i.status !== 'cancelled').length, 0)
	);

	// ── Menu Item Lookup (O(1) instead of linear scan) ──
	const menuItemsByName = $derived(new Map(menuItems.value.map(m => [m.name, m])));

	// ── New Order Detection + Audio ──
	let seenTicketIds = $state(new Set<string>());
	let newTicketIds = $state(new Set<string>());
	let isFirstRun = true;
	let pulseTimeout: ReturnType<typeof setTimeout> | null = null;

	// Reuse a single Audio instance
	let notificationAudio: HTMLAudioElement | null = null;
	function playNewOrderSound() {
		try {
			if (!notificationAudio) {
				notificationAudio = new Audio('/sounds/new-order.wav');
				notificationAudio.volume = 0.7;
			}
			notificationAudio.currentTime = 0;
			notificationAudio.play().catch(() => {});
		} catch { /* skip if audio unavailable */ }
	}

	$effect(() => {
		const currentIds = activeTickets.map(t => t.orderId);

		// Use untrack to read seenTicketIds without creating a dependency
		const seen = untrack(() => seenTicketIds);
		const fresh = currentIds.filter(id => !seen.has(id));

		if (fresh.length > 0) {
			// On first mount, seed seenTicketIds without playing sound or animating
			if (isFirstRun) {
				isFirstRun = false;
				seenTicketIds = new Set(currentIds);
				return;
			}
			playNewOrderSound();
			seenTicketIds = new Set([...seen, ...fresh]);
			// Set newTicketIds for pulse animation, auto-clear after 3s
			const freshSet = new Set(fresh);
			newTicketIds = new Set([...untrack(() => newTicketIds), ...fresh]);
			if (pulseTimeout) clearTimeout(pulseTimeout);
			pulseTimeout = setTimeout(() => {
				newTicketIds = new Set([...newTicketIds].filter(id => !freshSet.has(id)));
				pulseTimeout = null;
			}, 3000);
		} else if (isFirstRun) {
			isFirstRun = false;
			seenTicketIds = new Set(currentIds);
		}

		return () => {
			if (pulseTimeout) clearTimeout(pulseTimeout);
		};
	});

	// ── Auto-print incoming tickets ──
	$effect(() => {
		const toPrint = activeTickets.filter(t => !t.printStatus || t.printStatus === 'pending');
		for (const ticket of toPrint) {
			ticket.printStatus = 'success';
			printKitchenOrder(ticket.orderId).then(res => {
				if (!res.success) ticket.printStatus = 'failed';
			});
		}
	});

	function retryPrint(ticket: KdsTicket) {
		ticket.printStatus = 'success';
		printKitchenOrder(ticket.orderId).then(res => {
			if (!res.success) ticket.printStatus = 'failed';
		});
	}

	// ── Urgency Styling ──
	const WARN_MS  = 5  * 60_000;
	const CRIT_MS  = 10 * 60_000;

	function urgencyLevel(createdAt: string): 'critical' | 'warning' | 'normal' {
		const ms = ageMs(createdAt);
		if (ms > CRIT_MS) return 'critical';
		if (ms > WARN_MS) return 'warning';
		return 'normal';
	}

	function ticketBorderClass(level: ReturnType<typeof urgencyLevel>) {
		if (level === 'critical') return 'border-status-red animate-border-pulse-red bg-status-red-light';
		if (level === 'warning')  return 'border-status-yellow animate-border-pulse-yellow bg-status-yellow-light';
		return 'border-border bg-surface';
	}

	function timerBadgeClass(level: ReturnType<typeof urgencyLevel>) {
		if (level === 'critical') return 'bg-status-red text-white';
		if (level === 'warning')  return 'bg-status-yellow text-gray-900';
		return 'bg-gray-100 text-gray-600';
	}

	// ── Progress ──
	function ticketProgress(ticket: KdsTicket) {
		const active = ticket.items.filter(i => i.status !== 'cancelled');
		const total = active.length;
		const served = active.filter(i => i.status === 'served').length;
		const pct = total > 0 ? (served / total) * 100 : 0;
		return { served, total, pct };
	}

	// ── Group Items (served items STAY visible, only cancelled + packages filtered out) ──
	function groupItems(items: KdsTicketItem[]) {
		const notCancelled = (i: KdsTicketItem) => i.status !== 'cancelled' && i.category !== 'packages';
		const meats  = items.filter(i => i.category === 'meats' && notCancelled(i));
		const dishes = items.filter(i => (i.category === 'dishes' || i.category === 'drinks' || i.category === 'sides') && notCancelled(i));
		return { meats, dishes, extras: [] as typeof dishes };
	}

	// ── Actions ──
	function completeAll(ticket: KdsTicket) {
		const orderId = ticket.orderId;
		const tableLabel = ticket.tableNumber !== null ? `T${ticket.tableNumber}` : 'Takeout';
		for (const item of ticket.items) {
			if (item.status !== 'served' && item.status !== 'cancelled') {
				markItemServed(orderId, item.id);
			}
		}
		// P0-4: Show undo toast so accidental bumps can be recovered
		showToast(`✓ ${tableLabel} — All items served`, () => recallTicket(orderId));
	}

	function toggleExpand(itemId: string) {
		expandedItemId = expandedItemId === itemId ? null : itemId;
	}

	function openRefuseModal(orderId: string, tableNumber: number | null, itemName: string) {
		refuseTarget = { orderId, tableNumber, itemName };
	}

	function handleRefuseConfirm(reason: string) {
		if (refuseTarget) {
			const tableNum = refuseTarget.tableNumber;
			refuseItem(refuseTarget.orderId, refuseTarget.tableNumber, refuseTarget.itemName, reason);
			const tableLabel = tableNum !== null ? `T${tableNum}` : 'Takeout';
			showToast(`✓ Return flagged — Alert sent to ${tableLabel}`);
		}
		refuseTarget = null;
	}

	function isSoldOut(menuItemName: string): boolean {
		const mi = menuItemsByName.get(menuItemName);
		return mi ? !mi.available : false;
	}

	async function handleSoldOut(menuItemName: string) {
		const mi = menuItemsByName.get(menuItemName);
		if (!mi) return;
		const wasAvailable = mi.available;
		await toggleMenuItemAvailability(mi.id);
		if (wasAvailable) {
			// Item just marked sold out — show undo toast
			showToast(`${menuItemName} marked sold out — Undo`, async () => {
				const miNow = menuItemsByName.get(menuItemName);
				if (miNow) await toggleMenuItemAvailability(miNow.id);
				dismissToast();
			});
		} else {
			dismissToast();
		}
	}
</script>

{#snippet itemActions(orderId: string, tableNumber: number | null, menuItemName: string)}
	<div class="flex gap-2 px-4 py-2 bg-gray-50 border-t border-border/30">
		<button
			onclick={() => openRefuseModal(orderId, tableNumber, menuItemName)}
			class="btn-danger px-4 text-sm"
			style="min-height: 44px"
		>
			RETURN
		</button>
		<button
			onclick={() => handleSoldOut(menuItemName)}
			class={cn(
				'px-4 text-sm font-bold rounded-lg active:scale-95 transition-all',
				isSoldOut(menuItemName) ? 'bg-status-red text-white' : 'bg-gray-200 text-gray-600 border border-border'
			)}
			style="min-height: 44px"
		>
			{isSoldOut(menuItemName) ? 'SOLD OUT &#10005;' : 'SOLD OUT'}
		</button>
	</div>
{/snippet}

<!-- ── Live Indicator (fixed top-right) ── -->
<div class="fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border border-status-green/30 bg-white px-3 py-1.5 shadow-sm">
	<span class="h-2 w-2 rounded-full bg-status-green animate-pulse"></span>
	<span class="text-xs font-semibold text-status-green">Live</span>
</div>

<!-- ── Header ── -->
<div class="mb-4 space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div>
				<h1 class="text-xl font-bold text-gray-900 no-select">Kitchen Queue</h1>
				<p class="text-xs text-gray-400 mt-0.5">Active tickets awaiting kitchen action</p>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<button
				onclick={() => recallLastTicket()}
				disabled={kdsTicketHistory.value.length === 0}
				class="btn-primary px-5 text-sm disabled:opacity-30 disabled:cursor-not-allowed"
				style="min-height: 48px"
			>
				&#8617; UNDO LAST
			</button>
			<button
				onclick={() => showKdsHistory = true}
				class="btn-secondary px-5 text-sm"
				style="min-height: 48px"
			>
				History
				{#if kdsTicketHistory.value.length > 0}
					<span class="ml-1 rounded-full bg-gray-200 px-2 py-0.5 text-xs font-bold">{kdsTicketHistory.value.length}</span>
				{/if}
			</button>
		</div>
	</div>

</div>

<!-- ── Queue ── -->
{#if activeTickets.length === 0}
	{@const todayServed = kdsTicketHistory.value.length}
	{@const avgServiceMs = todayServed > 0 ? kdsTicketHistory.value.reduce((sum, t) => {
		const created = new Date(t.createdAt).getTime();
		const bumped = t.bumpedAt ? new Date(t.bumpedAt).getTime() : now;
		return sum + (bumped - created);
	}, 0) / todayServed : 0}
	{@const lastCompleted = kdsTicketHistory.value.length > 0 ? kdsTicketHistory.value[0]?.bumpedAt ?? kdsTicketHistory.value[0]?.createdAt : null}
	<div class="flex flex-1 flex-col items-center justify-center gap-6" style="min-height: 400px">
		<div class="text-center text-gray-400">
			<div class="mb-4 text-6xl">&#9989;</div>
			<p class="text-xl font-bold">No pending orders</p>
			<p class="text-sm mt-2">New orders will appear here automatically</p>
		</div>
		<div class="grid grid-cols-3 gap-4 w-full max-w-md">
			<div class="pos-card flex flex-col items-center gap-1 px-4 py-3">
				<span class="text-2xl font-black font-mono text-gray-900">{todayServed}</span>
				<span class="text-xs font-semibold text-gray-400">Served Today</span>
			</div>
			<div class="pos-card flex flex-col items-center gap-1 px-4 py-3">
				<span class="text-2xl font-black font-mono text-gray-900">{avgServiceMs > 0 ? `${Math.round(avgServiceMs / 60000)}m` : '—'}</span>
				<span class="text-xs font-semibold text-gray-400">Avg Service</span>
			</div>
			<div class="pos-card flex flex-col items-center gap-1 px-4 py-3">
				<span class="text-2xl font-black font-mono text-gray-900">{lastCompleted ? formatTimeAgo(lastCompleted) : '—'}</span>
				<span class="text-xs font-semibold text-gray-400">Last Completed</span>
			</div>
		</div>
	</div>
{:else}
	<div class="grid gap-4 pb-4" style="grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));">
		{#each activeTickets as ticket (ticket.orderId)}
			{@const grouped = groupItems(ticket.items)}
			{@const progress = ticketProgress(ticket)}
			{@const isNew = newTicketIds.has(ticket.orderId)}
			{@const urgency = urgencyLevel(ticket.createdAt)}

			<div class={cn(
				'flex flex-col rounded-xl border-2 overflow-hidden transition-all',
				ticket.printStatus === 'failed' ? 'border-red-500 bg-red-50' : ticketBorderClass(urgency),
				isNew && 'animate-pulse'
			)}>
				<!-- Card Header -->
				<div class="flex items-center justify-between px-4 py-3 bg-white/60">
					<div class="flex items-center gap-2">
						{#if ticket.tableNumber !== null}
							<span class="text-2xl font-black text-gray-900">T{ticket.tableNumber}</span>
						{:else}
							<span class="flex items-center gap-2">
								<span class="rounded-lg bg-status-purple px-2 py-1 text-xs font-bold text-white">📦 TAKEOUT</span>
								<span class="text-lg font-black text-gray-900">{ticket.customerName ?? 'Walk-in'}</span>
							</span>
						{/if}
						<span class="font-mono text-xs font-bold text-gray-400">{formatDisplayId(ticket.orderId, ticket.tableNumber)}</span>

						{#if ticket.printStatus === 'failed'}
							<button
								onclick={() => retryPrint(ticket)}
								class="flex items-center gap-1 text-xs font-bold text-red-600 bg-red-100 px-2.5 py-1.5 rounded-lg active:scale-95 transition-colors"
								style="min-height: 44px"
							>
								<TriangleAlert class="w-4 h-4" /> Retry
							</button>
						{/if}
					</div>

					<div class="flex items-center gap-2">
						<button
							onclick={() => completeAll(ticket)}
							class="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs font-semibold text-gray-600 active:scale-95 transition-all hover:bg-gray-50"
							style="min-height: 32px"
							title="Quick bump — mark all items served"
						>
							Quick Bump
						</button>
						<span class="text-sm font-bold text-gray-400 font-mono">{progress.served}/{progress.total}</span>
						<span class={cn('rounded-full px-3 py-1 font-mono text-sm font-bold', timerBadgeClass(urgency))}>
							{timerText(ticket.createdAt)}
						</span>
					</div>
				</div>

				<!-- Progress Bar -->
				<div class="h-1 bg-gray-100" role="progressbar" aria-valuenow={progress.served} aria-valuemin={0} aria-valuemax={progress.total} aria-label="Order completion progress">
					<div
						class="h-full bg-status-green transition-all duration-500"
						style="width: {progress.pct}%"
					></div>
				</div>

				<!-- Items -->
				<div class="flex flex-col gap-0 divide-y divide-border flex-1">
					<!-- MEATS -->
					{#if grouped.meats.length > 0}
						<div class="py-2">
							<div class="flex items-center justify-between px-4 py-1.5">
								<span class="text-xs font-bold uppercase tracking-wider text-red-800">
									&#129385; MEATS
								</span>
								<span class="text-xs font-mono font-bold text-red-700">
									{grouped.meats.filter(i => i.status !== 'served').reduce((s: number, i) => s + (i.weight ?? 0), 0)}g
								</span>
							</div>
							{#each grouped.meats as item (item.id)}
								{@const isServed = item.status === 'served'}
								{@const isExpanded = expandedItemId === item.id && !isServed}
								{@const isRefill = item.notes === REFILL_NOTE && !item.weight}
								{@const isWeighed = !!item.weight}
								<div class="border-b border-border/30 last:border-b-0">
									<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
									<div
										class={cn(
											'flex items-center gap-2 px-4 py-2 transition-colors',
											isServed ? 'opacity-50' : 'cursor-pointer active:bg-gray-50'
										)}
										onclick={() => !isServed && toggleExpand(item.id)}
										role={isServed ? undefined : 'button'}
										tabindex={isServed ? -1 : 0}
										aria-expanded={isServed ? undefined : isExpanded}
										aria-label={isServed ? undefined : `${isExpanded ? 'Collapse' : 'Expand'} actions for ${item.menuItemName}`}
									>
										<div class="flex-1 flex items-center gap-2 min-w-0">
											<span class={cn('text-sm font-medium truncate', isServed ? 'line-through text-gray-400' : 'text-gray-900')}>
												{item.menuItemName}
											</span>
											{#if isRefill}
												<span class="shrink-0 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-bold text-amber-800 animate-pulse">
													REFILL
												</span>
											{:else if isWeighed}
												<span class={cn(
													'shrink-0 rounded-full px-2 py-0.5 text-xs font-mono font-bold',
													isServed ? 'bg-gray-100 text-gray-400' : 'bg-pink-100 text-pink-700'
												)}>
													{item.weight}g
												</span>
												{#if !isServed}
													<span class="shrink-0 rounded-full bg-status-green/10 px-2.5 py-0.5 text-xs font-bold text-status-green">
														READY
													</span>
												{/if}
											{:else if !isServed}
												<span class="shrink-0 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-bold text-blue-600 animate-pulse">
													WEIGHING {timerText(ticket.createdAt)}
												</span>
											{/if}
										</div>
										{#if isServed}
											<span class="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-status-green/10 text-status-green">
												<Check class="w-5 h-5" strokeWidth={3} />
											</span>
										{:else}
											<span class="shrink-0 text-gray-400">
												{#if isExpanded}
													<ChevronUp class="w-4 h-4" />
												{:else}
													<ChevronDown class="w-4 h-4" />
												{/if}
											</span>
											<button
												onclick={(e) => { e.stopPropagation(); markItemServed(ticket.orderId, item.id); }}
												class="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-status-green text-white font-bold text-lg active:scale-95 transition-all no-select"
												style="min-height: 48px"
											>
												&#10003;
											</button>
										{/if}
									</div>
									{#if isExpanded}
										{@render itemActions(ticket.orderId, ticket.tableNumber, item.menuItemName)}
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					<!-- DISHES & DRINKS -->
					{#if grouped.dishes.length > 0}
						<div class="py-2">
							<div class="px-4 py-1.5">
								<span class="text-xs font-bold uppercase tracking-wider text-status-cyan">
									&#127836; DISHES & DRINKS
								</span>
							</div>
							{#each grouped.dishes as item (item.id)}
								{@const isServed = item.status === 'served'}
								{@const isExpanded = expandedItemId === item.id && !isServed}
								<div class="border-b border-border/30 last:border-b-0">
									<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
									<div
										class={cn(
											'flex items-center gap-2 px-4 py-2 transition-colors',
											isServed ? 'opacity-50' : 'cursor-pointer active:bg-gray-50'
										)}
										onclick={() => !isServed && toggleExpand(item.id)}
										role={isServed ? undefined : 'button'}
										tabindex={isServed ? -1 : 0}
										aria-expanded={isServed ? undefined : isExpanded}
										aria-label={isServed ? undefined : `${isExpanded ? 'Collapse' : 'Expand'} actions for ${item.menuItemName}`}
									>
										<div class="flex-1 flex items-center gap-2 min-w-0">
											<span class={cn('text-sm font-medium truncate', isServed ? 'line-through text-gray-400' : 'text-gray-900')}>
												{item.menuItemName}
											</span>
											{#if item.quantity > 1}
												<span class={cn(
													'shrink-0 rounded-full px-2 py-0.5 text-xs font-bold',
													isServed ? 'bg-gray-100 text-gray-400' : 'bg-cyan-100 text-cyan-700'
												)}>
													{item.quantity}x
												</span>
											{/if}
											{#if item.status === 'cooking' && item.category === 'dishes'}
												<span class="shrink-0 rounded-full bg-orange-100 px-2.5 py-0.5 text-xs font-bold text-orange-600">
													COOKING
												</span>
											{/if}
										</div>
										{#if isServed}
											<span class="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-status-green/10 text-status-green">
												<Check class="w-5 h-5" strokeWidth={3} />
											</span>
										{:else}
											<span class="shrink-0 text-gray-400">
												{#if isExpanded}
													<ChevronUp class="w-4 h-4" />
												{:else}
													<ChevronDown class="w-4 h-4" />
												{/if}
											</span>
											<button
												onclick={(e) => { e.stopPropagation(); markItemServed(ticket.orderId, item.id); }}
												class="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-status-green text-white font-bold text-lg active:scale-95 transition-all no-select"
												style="min-height: 48px"
											>
												&#10003;
											</button>
										{/if}
									</div>
									{#if isExpanded}
										{@render itemActions(ticket.orderId, ticket.tableNumber, item.menuItemName)}
									{/if}
								</div>
							{/each}
						</div>
					{/if}

					<!-- SIDE REQUESTS -->
					{#if grouped.extras.length > 0}
						<div class="py-2">
							<div class="px-4 py-1.5">
								<span class="text-xs font-bold uppercase tracking-wider text-status-purple">
									&#127915; SIDE REQUESTS
								</span>
							</div>
							{#each grouped.extras as item (item.id)}
								{@const isServed = item.status === 'served'}
								{@const isExpanded = expandedItemId === item.id && !isServed}
								<div class="border-b border-border/30 last:border-b-0">
									<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
									<div
										class={cn(
											'flex items-center gap-2 px-4 py-2 transition-colors',
											isServed ? 'opacity-50' : 'cursor-pointer active:bg-gray-50'
										)}
										onclick={() => !isServed && toggleExpand(item.id)}
										role={isServed ? undefined : 'button'}
										tabindex={isServed ? -1 : 0}
										aria-expanded={isServed ? undefined : isExpanded}
										aria-label={isServed ? undefined : `${isExpanded ? 'Collapse' : 'Expand'} actions for ${item.menuItemName}`}
									>
										<div class="flex-1 flex items-center gap-2 min-w-0">
											<span class={cn('text-sm font-medium truncate', isServed ? 'line-through text-gray-400' : 'text-gray-900')}>
												{item.menuItemName}
											</span>
											{#if item.quantity > 1}
												<span class="shrink-0 text-xs text-gray-400">{item.quantity}x</span>
											{/if}
										</div>
										{#if isServed}
											<span class="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-status-green/10 text-status-green">
												<Check class="w-5 h-5" strokeWidth={3} />
											</span>
										{:else}
											<span class="shrink-0 text-gray-400">
												{#if isExpanded}
													<ChevronUp class="w-4 h-4" />
												{:else}
													<ChevronDown class="w-4 h-4" />
												{/if}
											</span>
											<button
												onclick={(e) => { e.stopPropagation(); markItemServed(ticket.orderId, item.id); }}
												class="shrink-0 flex items-center justify-center w-12 h-12 rounded-lg bg-status-green text-white font-bold text-lg active:scale-95 transition-all no-select"
												style="min-height: 48px"
											>
												&#10003;
											</button>
										{/if}
									</div>
									{#if isExpanded}
										{@render itemActions(ticket.orderId, ticket.tableNumber, item.menuItemName)}
									{/if}
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- ALL DONE -->
				<div class="border-t border-border px-4 py-3">
					<button
						onclick={() => completeAll(ticket)}
						class="w-full rounded-xl bg-status-green text-white font-black text-base uppercase tracking-wide active:scale-95 transition-all hover:bg-emerald-600 no-select"
						style="min-height: 56px"
					>
						ALL DONE &#10003;
					</button>
				</div>
			</div>
		{/each}
	</div>
{/if}

<!-- Modals -->
<KdsHistoryModal isOpen={showKdsHistory} onClose={() => showKdsHistory = false} />
<RefuseReasonModal
	isOpen={refuseTarget !== null}
	itemName={refuseTarget?.itemName ?? ''}
	onConfirm={handleRefuseConfirm}
	onCancel={() => refuseTarget = null}
/>

<!-- Toast -->
{#if toast.visible}
	<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-gray-900 px-5 py-3 shadow-lg text-white text-sm font-medium">
		<span>{toast.message}</span>
		{#if toast.undoFn}
			<button
				onclick={toast.undoFn}
				class="rounded-lg bg-white/20 px-3 py-1 text-xs font-bold hover:bg-white/30 transition-colors"
				style="min-height: 32px"
			>
				Undo
			</button>
		{/if}
		<button
			onclick={dismissToast}
			class="text-white/60 hover:text-white transition-colors"
			style="min-height: 32px"
		>
			✕
		</button>
	</div>
{/if}
