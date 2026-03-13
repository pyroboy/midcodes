<script lang="ts">
	import { kdsTickets, kdsTicketHistory, markItemServed, toggleMenuItemAvailability, menuItems, recallLastTicket, recallTicket, REFILL_NOTE, orders } from '$lib/stores/pos.svelte';
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

	// ── Section visibility ──
	let showDishes = $state(true);

	// ── P1-14: Un-86 confirmation state ──
	let confirmingUnEighty6 = $state<string | null>(null);

	// ── P2-06: KDS notification volume ──
	let notificationVolume = $state(1.0);

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
			}
			notificationAudio.volume = Math.min(notificationVolume, 1.0);
			notificationAudio.currentTime = 0;
			notificationAudio.play().catch(() => {});
		} catch { /* skip if audio unavailable */ }
	}

	// ── P1-11: Void beep (Web Audio API — distinct from new-order chime) ──
	function playVoidBeep() {
		try {
			const ctx = new AudioContext();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.value = 880; // 880Hz — distinct from 440Hz new-order chime
			gain.gain.value = notificationVolume * 1.5;
			osc.start();
			osc.stop(ctx.currentTime + 0.2);
			osc.onended = () => ctx.close();
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

	// ── P1-11 / P1-12: Void detection — cancelled items that just appeared ──
	// voidOverlays: map of orderId → { itemName, acknowledged }
	interface VoidOverlay { itemName: string; acknowledged: boolean; timerId: ReturnType<typeof setTimeout> | null; }
	let voidOverlays = $state(new Map<string, VoidOverlay>());
	// Track which (orderId+itemId) pairs we've already notified about
	let seenCancelledKeys = $state(new Set<string>());
	let isFirstVoidRun = true;

	$effect(() => {
		// Collect all current cancelled item keys
		const currentCancelledKeys = new Set<string>();
		for (const ticket of activeTickets) {
			for (const item of ticket.items) {
				if (item.status === 'cancelled') {
					currentCancelledKeys.add(`${ticket.orderId}:${item.id}`);
				}
			}
		}

		const seen = untrack(() => seenCancelledKeys);

		if (isFirstVoidRun) {
			isFirstVoidRun = false;
			seenCancelledKeys = new Set(currentCancelledKeys);
			return;
		}

		const freshCancelled: Array<{ orderId: string; itemId: string; itemName: string }> = [];
		for (const ticket of activeTickets) {
			for (const item of ticket.items) {
				const key = `${ticket.orderId}:${item.id}`;
				if (item.status === 'cancelled' && !seen.has(key)) {
					freshCancelled.push({ orderId: ticket.orderId, itemId: item.id, itemName: item.menuItemName });
				}
			}
		}

		if (freshCancelled.length > 0) {
			playVoidBeep();
			const newSeen = new Set([...seen, ...currentCancelledKeys]);
			seenCancelledKeys = newSeen;

			// Show void overlay per orderId (last cancelled item name wins if multiple)
			const newOverlays = new Map(untrack(() => voidOverlays));
			for (const { orderId, itemName } of freshCancelled) {
				const existing = newOverlays.get(orderId);
				if (existing?.timerId) clearTimeout(existing.timerId);
				// Auto-dismiss fallback after 30s
				const timerId = setTimeout(() => {
					voidOverlays = new Map(
						[...voidOverlays].filter(([k]) => k !== orderId)
					);
				}, 30_000);
				newOverlays.set(orderId, { itemName, acknowledged: false, timerId });
			}
			voidOverlays = newOverlays;
		} else {
			seenCancelledKeys = new Set(currentCancelledKeys);
		}
	});

	function acknowledgeVoid(orderId: string) {
		const overlay = voidOverlays.get(orderId);
		if (overlay?.timerId) clearTimeout(overlay.timerId);
		voidOverlays = new Map([...voidOverlays].filter(([k]) => k !== orderId));
	}

	// ── P2-08: Live indicator staleness tracking ──
	let lastUpdated = $state(Date.now());
	let isStale = $state(false);

	$effect(() => {
		// Touch activeTickets to create dependency — update timestamp on every change
		activeTickets.length;
		lastUpdated = Date.now();
	});

	$effect(() => {
		const id = setInterval(() => {
			isStale = Date.now() - untrack(() => lastUpdated) > 60_000;
		}, 10_000);
		return () => clearInterval(id);
	});

	// ── Auto-print incoming tickets ──
	// Use local state to track print results — activeTickets are plain JS objects
	// derived from RxDB and cannot be mutated directly.
	let localPrintStatus = $state(new Map<string, 'success' | 'failed'>());

	$effect(() => {
		const toPrint = activeTickets.filter(
			(t) => !localPrintStatus.has(t.orderId) && (!t.printStatus || t.printStatus === 'pending')
		);
		if (!toPrint.length) return;
		for (const ticket of toPrint) {
			// Optimistically mark as success to prevent re-triggering on the next activeTickets update
			localPrintStatus = new Map(localPrintStatus).set(ticket.orderId, 'success');
			printKitchenOrder(ticket.orderId).then((res) => {
				if (!res.success) {
					localPrintStatus = new Map(localPrintStatus).set(ticket.orderId, 'failed');
				}
			});
		}
	});

	function retryPrint(orderId: string) {
		localPrintStatus = new Map([...localPrintStatus].filter(([k]) => k !== orderId));
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
		const meats   = items.filter(i => i.category === 'meats' && notCancelled(i));
		const dishes  = items.filter(i => (i.category === 'dishes' || i.category === 'drinks') && notCancelled(i));
		const service = items.filter(i => i.category === 'service' && i.status !== 'cancelled');
		return { meats, dishes, extras: [] as typeof dishes, service };
	}

	// ── Actions ──
	function completeAll(ticket: KdsTicket) {
		const tableLabel = ticket.tableNumber !== null ? `T${ticket.tableNumber}` : 'Takeout';
		for (const item of ticket.items) {
			if (item.status === 'served' || item.status === 'cancelled') continue;
			markItemServed(ticket.orderId, item.id);
		}
		// P0-4: Show undo toast so accidental bumps can be recovered
		showToast(`✓ ${tableLabel} — All items served`, () => recallTicket(ticket.orderId));
	}

	// [07]: New tables opened in last 10 minutes with no items sent to kitchen yet
	const newTableCount = $derived.by(() => {
		const tenMinAgo = Date.now() - 10 * 60_000;
		return orders.value.filter(o =>
			o.status === 'open' &&
			new Date(o.createdAt).getTime() > tenMinAgo &&
			(!o.items || o.items.length === 0)
		).length;
	});

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

		if (!wasAvailable) {
			// ── P1-14: Un-86 confirmation — show inline confirm instead of firing immediately ──
			confirmingUnEighty6 = menuItemName;
			return;
		}

		await toggleMenuItemAvailability(mi.id);
		// Item just marked sold out — show undo toast
		showToast(`${menuItemName} marked sold out — Undo`, async () => {
			const miNow = menuItemsByName.get(menuItemName);
			if (miNow) await toggleMenuItemAvailability(miNow.id);
			dismissToast();
		});
	}

	async function confirmUnEighty6(menuItemName: string) {
		const mi = menuItemsByName.get(menuItemName);
		if (!mi) { confirmingUnEighty6 = null; return; }
		await toggleMenuItemAvailability(mi.id);
		confirmingUnEighty6 = null;
		dismissToast();
	}
</script>

{#snippet itemActions(orderId: string, tableNumber: number | null, menuItemName: string)}
	<div class="flex flex-col gap-0 bg-gray-50 border-t border-border/30">
		<div class="flex gap-2 px-4 py-2">
			<button
				onclick={() => openRefuseModal(orderId, tableNumber, menuItemName)}
				class="btn-danger px-4 text-sm"
				style="min-height: 44px"
			>
				RETURN
			</button>
			<!-- P1-13: 86 button — always visible, clear warning color when sold out ── -->
			<button
				onclick={() => handleSoldOut(menuItemName)}
				class={cn(
					'px-4 text-sm font-bold rounded-lg active:scale-95 transition-all',
					isSoldOut(menuItemName)
						? 'bg-status-red text-white hover:bg-red-700'
						: 'bg-gray-100 text-gray-700 border border-border hover:text-red-600 hover:border-red-400 hover:bg-red-50'
				)}
				style="min-height: 44px"
			>
				{isSoldOut(menuItemName) ? '86 ✕ SOLD OUT' : '86 ITEM'}
			</button>
		</div>
		<!-- P1-14: Un-86 inline confirmation ── -->
		{#if confirmingUnEighty6 === menuItemName}
			<div class="flex items-center gap-2 px-4 py-2 bg-amber-50 border-t border-amber-200">
				<span class="flex-1 text-sm font-semibold text-amber-800">Restore {menuItemName} to menu?</span>
				<button
					onclick={() => { confirmingUnEighty6 = null; }}
					class="px-3 text-sm font-bold rounded-lg bg-white border border-border text-gray-600 hover:bg-gray-50 active:scale-95 transition-all"
					style="min-height: 44px"
				>
					Cancel
				</button>
				<button
					onclick={() => confirmUnEighty6(menuItemName)}
					class="px-3 text-sm font-bold rounded-lg bg-status-green text-white hover:bg-emerald-600 active:scale-95 transition-all"
					style="min-height: 44px"
				>
					Restore
				</button>
			</div>
		{/if}
	</div>
{/snippet}

<!-- ── Live Indicator (fixed top-right) — P2-08: dims when stale >60s ── -->
<div class={cn(
	'fixed top-4 right-4 z-50 flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm bg-white',
	isStale ? 'border-status-yellow/40' : 'border-status-green/30'
)}>
	<span class={cn(
		'h-2 w-2 rounded-full',
		isStale ? 'bg-status-yellow' : 'bg-status-green animate-pulse'
	)}></span>
	<span class={cn(
		'text-xs font-semibold',
		isStale ? 'text-status-yellow' : 'text-status-green'
	)}>{isStale ? '~ Stale' : 'Live'}</span>
	<!-- [07]: New tables badge -->
	{#if newTableCount > 0}
		<span class="bg-accent text-white text-sm font-bold px-3 py-1.5 rounded-lg">
			🆕 {newTableCount} new table{newTableCount > 1 ? 's' : ''}
		</span>
	{/if}
</div>

<!-- ── Header ── -->
<div class="mb-4 space-y-4">
	<div class="flex items-center justify-between">
		<div class="flex items-center gap-3">
			<div>
				<h1 class="text-xl font-bold text-gray-900 no-select">Kitchen Queue</h1>
				<p class="text-sm text-gray-500 mt-0.5"><span class="font-bold">{queueOrders}</span> active · <span class="font-bold">{totalItems}</span> items</p>
			</div>
		</div>
		<div class="flex items-center gap-3">
			<!-- P2-06: Volume slider — 44px touch wrapper ── -->
			<div class="flex items-center gap-2 min-h-[44px] px-3 py-1 rounded-lg border border-border bg-white">
				<span class="text-xs font-semibold text-gray-500 shrink-0">&#128266;</span>
				<div class="min-h-[44px] flex items-center w-20">
					<input
						type="range"
						min="0"
						max="1"
						step="0.1"
						bind:value={notificationVolume}
						class="w-full cursor-pointer accent-accent"
						aria-label="KDS notification volume"
					/>
				</div>
			</div>
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
			{@const printFailed = localPrintStatus.get(ticket.orderId) === 'failed'}

			<div class={cn(
				'flex flex-col rounded-xl border-2 overflow-hidden transition-all',
				printFailed ? 'border-red-500 bg-red-50' : ticketBorderClass(urgency),
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

						{#if printFailed}
							<button
								onclick={() => retryPrint(ticket.orderId)}
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
							class="rounded-lg border border-gray-300 bg-white px-6 text-sm font-semibold text-gray-600 active:scale-95 transition-all hover:bg-gray-50 min-h-[56px]"
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

				<!-- P1-12: Void overlay — shown when a voided item arrives on this ticket ── -->
				{#if voidOverlays.has(ticket.orderId)}
					{@const overlay = voidOverlays.get(ticket.orderId)!}
					<div class="flex items-center gap-3 px-4 py-3 bg-status-red text-white">
						<span class="text-lg font-black shrink-0">&#9888;</span>
						<span class="flex-1 text-sm font-bold">VOIDED: {overlay.itemName}</span>
						<button
							onclick={() => acknowledgeVoid(ticket.orderId)}
							class="shrink-0 rounded-lg bg-white text-status-red font-black text-sm px-4 active:scale-95 transition-all"
							style="min-height: 44px"
						>
							&#10003; Got it
						</button>
					</div>
				{/if}

				<!-- Items -->
				<div class="flex flex-col gap-0 divide-y divide-border flex-1">
					<!-- DISHES & DRINKS -->
					{#if grouped.dishes.length > 0}
						{@const pendingDishRefillCount = grouped.dishes.filter(i => i.notes === REFILL_NOTE).length}
						{@const maxDishRefillRound = (() => {
							const refills = grouped.dishes.filter(i => i.notes === REFILL_NOTE);
							if (refills.length === 0) return 0;
							let maxRound = 0;
							const byMenuItem: Record<string, number> = {};
							for (const ri of refills) {
								byMenuItem[ri.menuItemName] = (byMenuItem[ri.menuItemName] ?? 0) + 1;
								if (byMenuItem[ri.menuItemName] + 1 > maxRound) maxRound = byMenuItem[ri.menuItemName] + 1;
							}
							return maxRound;
						})()}
						<div class="py-2">
						<button
								onclick={() => (showDishes = !showDishes)}
								class="flex w-full items-center justify-between px-4 py-3 hover:bg-gray-50 active:bg-gray-100 transition-colors min-h-[44px]"
							>
								<div class="flex items-center gap-2">
									<span class="text-xs font-bold uppercase tracking-wider text-status-cyan">
										&#127836; DISHES & DRINKS
									</span>
									{#if pendingDishRefillCount > 0}
										<span class="rounded-full bg-accent text-white text-xs font-black px-2 py-0.5">
											&#8635; {pendingDishRefillCount} refill{pendingDishRefillCount > 1 ? 's' : ''}{maxDishRefillRound > 0 ? ' · Rnd ' + maxDishRefillRound : ''}
										</span>
									{/if}
									{#if !showDishes}
										<span class="rounded-full bg-gray-200 text-gray-600 text-xs font-bold px-2 py-0.5">
											{grouped.dishes.filter(i => i.status !== 'served').length} hidden
										</span>
									{/if}
								</div>
								<span class="text-gray-400">
									{#if showDishes}<ChevronUp class="w-3.5 h-3.5" />{:else}<ChevronDown class="w-3.5 h-3.5" />{/if}
								</span>
							</button>
							{#if showDishes}
							{#each grouped.dishes as item (item.id)}
								{@const isServed = item.status === 'served'}
								{@const isExpanded = expandedItemId === item.id && !isServed}
								{@const isDishRefill = item.notes === REFILL_NOTE}
								{@const dishRefillRound = (() => {
									const refillsForItem = grouped.dishes.filter(i => i.menuItemName === item.menuItemName && i.notes === REFILL_NOTE);
									const idx = refillsForItem.indexOf(item);
									return idx >= 0 ? idx + 2 : 0;
								})()}
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
											<span class={cn('text-base font-medium truncate', isServed ? 'line-through text-gray-400' : 'text-gray-900')}>
												{item.menuItemName}
											</span>
											{#if isDishRefill}
												<span class="shrink-0 bg-amber-500 text-white text-sm font-bold animate-pulse px-2 py-0.5 rounded">
													Rnd {dishRefillRound} · REFILL
												</span>
											{/if}
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
							{/if}
						</div>
					{/if}

					<!-- NEEDS (service requests: extra tong, scissors, etc.) -->
					{#if grouped.service.length > 0}
						<div class="py-2 bg-status-purple/5">
							<div class="px-4 py-1.5">
								<span class="text-xs font-bold uppercase tracking-wider text-status-purple">
									🔧 NEEDS
								</span>
							</div>
							{#each grouped.service as item (item.id)}
								{@const isAcked = item.status === 'served'}
								<div class="border-b border-status-purple/10 last:border-b-0">
									<div class={cn('flex items-center gap-2 px-4 py-2', isAcked && 'opacity-40')}>
										<div class="flex-1 flex items-center gap-2 min-w-0">
											<span class={cn('text-sm font-semibold truncate', isAcked ? 'line-through text-gray-400' : 'text-status-purple')}>
												{item.menuItemName}
											</span>
										</div>
										{#if isAcked}
											<span class="shrink-0 flex items-center justify-center w-10 h-10 rounded-lg bg-status-green/10 text-status-green">
												<Check class="w-5 h-5" strokeWidth={3} />
											</span>
										{:else}
											<button
												onclick={() => markItemServed(ticket.orderId, item.id)}
												class="shrink-0 rounded-lg border-2 border-status-purple px-4 py-2 text-xs font-black text-status-purple hover:bg-status-purple hover:text-white active:scale-95 transition-all no-select"
												style="min-height: 44px"
											>
												Done
											</button>
										{/if}
								</div>
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
						ALL DONE ✓
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
