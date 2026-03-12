<script lang="ts">
	import { kdsTickets, recallTicket } from '$lib/stores/pos/kds.svelte';
	import { orders, markItemServed } from '$lib/stores/pos.svelte';
	import { log } from '$lib/stores/audit.svelte';
	import type { KdsTicketItem } from '$lib/types';
	import { formatCountdown, formatTimeAgo, cn } from '$lib/utils';
	import { getPkgColors } from '$lib/stores/pos/utils';
	import { untrack } from 'svelte';

	// ── Live timer ──
	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => { now = Date.now(); }, 1000);
		return () => clearInterval(id);
	});

	// ── Section A: New tables (opened in last 15min, no items yet) ──
	const newTables = $derived.by(() => {
		const fifteenMinAgo = now - 15 * 60_000;
		return orders.value
			.filter(
				(o) =>
					o.status === 'open' &&
					o.tableNumber !== null &&
					new Date(o.createdAt).getTime() > fifteenMinAgo &&
					(!o.items || o.items.length === 0)
			)
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
	});

	let acknowledgedTableIds = $state<Set<string>>(new Set());
	const unacknowledgedNewTables = $derived(
		newTables.filter((o) => !acknowledgedTableIds.has(o.id))
	);

	function acknowledgeTable(orderId: string) {
		acknowledgedTableIds = new Set([...acknowledgedTableIds, orderId]);
	}

	// ── Section B: Per-table dispatch cards ──
	interface DispatchTableCard {
		orderId: string;
		tableNumber: number | null;
		customerName?: string;
		pax: number;
		scCount: number;
		pwdCount: number;
		packageId?: string | null;
		packageName?: string | null;
		createdAt: string;
		meats: { total: number; done: number; allDone: boolean };
		dishes: { total: number; done: number; allDone: boolean };
		sides: { items: KdsTicketItem[]; total: number; done: number; allDone: boolean };
		service: { items: KdsTicketItem[] };
		readyToRun: boolean;
	}

	const dispatchCards = $derived.by((): DispatchTableCard[] => {
		// Merge all tickets by orderId
		const byOrder = new Map<string, {
			orderId: string;
			tableNumber: number | null;
			customerName?: string;
			createdAt: string;
			items: KdsTicketItem[];
		}>();

		for (const t of kdsTickets.value) {
			const existing = byOrder.get(t.orderId);
			if (existing) {
				existing.items = [...existing.items, ...t.items];
				if (t.createdAt < existing.createdAt) existing.createdAt = t.createdAt;
			} else {
				byOrder.set(t.orderId, {
					orderId: t.orderId,
					tableNumber: t.tableNumber,
					customerName: t.customerName,
					createdAt: t.createdAt,
					items: [...t.items]
				});
			}
		}

		// Look up pax from orders store
		const orderMap = new Map(orders.value.map((o) => [o.id, o]));

		return Array.from(byOrder.values())
			.map((ticket) => {
				const active = ticket.items.filter((i) => i.status !== 'cancelled' && i.category !== 'packages');

				const meatItems = active.filter((i) => i.category === 'meats');
				const dishItems = active.filter((i) => i.category === 'dishes' || i.category === 'drinks');
				const sideItems = active.filter((i) => i.category === 'sides');
				const serviceItems = active.filter((i) => i.category === 'service' && i.status !== 'served');

				const meatDone = meatItems.filter((i) => i.weight && i.weight > 0 || i.status === 'served').length;
				const dishDone = dishItems.filter((i) => i.status === 'served').length;
				const sideDone = sideItems.filter((i) => i.status === 'served').length;

				const meats = { total: meatItems.length, done: meatDone, allDone: meatItems.length === 0 || meatDone >= meatItems.length };
				const dishes = { total: dishItems.length, done: dishDone, allDone: dishItems.length === 0 || dishDone >= dishItems.length };
				const sides = { items: sideItems, total: sideItems.length, done: sideDone, allDone: sideItems.length === 0 || sideDone >= sideItems.length };

				const order = orderMap.get(ticket.orderId);
				const pax = order?.pax ?? 0;
				const scCount = order?.scCount ?? 0;
				const pwdCount = order?.pwdCount ?? 0;

				return {
					orderId: ticket.orderId,
					tableNumber: ticket.tableNumber,
					customerName: ticket.customerName,
					pax,
					scCount,
					pwdCount,
					packageId: order?.packageId,
					packageName: order?.packageName ?? null,
					createdAt: ticket.createdAt,
					meats,
					dishes,
					sides,
					service: { items: serviceItems },
					readyToRun: meats.allDone && dishes.allDone && sides.allDone
				};
			})
			// Only show cards with pending work (not fully served across all categories)
			.filter((c) => !c.readyToRun || c.service.items.length > 0 ||
				// Show readyToRun cards briefly for the green signal
				c.meats.total + c.dishes.total + c.sides.total > 0)
			// readyToRun floats to top, then oldest-first
			.sort((a, b) => {
				if (a.readyToRun !== b.readyToRun) return a.readyToRun ? -1 : 1;
				return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			});
	});

	// ── Section C: Service alerts ──
	type ServiceAlert = {
		orderId: string;
		itemId: string;
		tableLabel: string;
		text: string;
		waitingSince: string;
	};

	const serviceAlerts = $derived.by((): ServiceAlert[] => {
		const alerts: ServiceAlert[] = [];
		for (const ticket of kdsTickets.value) {
			for (const item of ticket.items) {
				if (item.category === 'service' && item.status !== 'served' && item.status !== 'cancelled') {
					alerts.push({
						orderId: ticket.orderId,
						itemId: item.id,
						tableLabel: ticket.tableNumber
							? `T${ticket.tableNumber}`
							: (ticket.customerName ?? 'Takeout'),
						text: item.menuItemName,
						waitingSince: ticket.createdAt
					});
				}
			}
		}
		return alerts.sort(
			(a, b) => new Date(a.waitingSince).getTime() - new Date(b.waitingSince).getTime()
		);
	});

	// ── Actions ──
	async function markSideDone(orderId: string, itemId: string) {
		await markItemServed(orderId, itemId);
	}

	async function completeAllSides(orderId: string, items: KdsTicketItem[]) {
		for (const item of items) {
			if (item.status !== 'served') {
				await markItemServed(orderId, item.id);
			}
		}
	}

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
		}, 8000);
	}

	function dismissToast() {
		if (toastTimer) clearTimeout(toastTimer);
		toast = { message: '', visible: false, undoFn: null };
		toastTimer = null;
	}

	// ── ALL DONE: Complete entire order from dispatch ──
	async function completeAllForOrder(card: DispatchTableCard) {
		// Get ALL KDS tickets for this order (may be multiple due to refills)
		const tickets = kdsTickets.value.filter(t => t.orderId === card.orderId);
		for (const ticket of tickets) {
			for (const item of ticket.items) {
				if (item.status !== 'served' && item.status !== 'cancelled') {
					await markItemServed(card.orderId, item.id);
				}
			}
		}
		log.dispatchOrderCleared(card.tableNumber);

		const label = card.tableNumber !== null ? `T${card.tableNumber}` : (card.customerName ?? 'Takeout');
		showToast(`✓ ${label} — Order cleared`, () => {
			recallTicket(card.orderId);
		});
	}

	// ── Urgency ──
	const WARN_MS = 5 * 60_000;
	const CRIT_MS = 10 * 60_000;

	function urgencyLevel(createdAt: string): 'critical' | 'warning' | 'normal' {
		const ms = now - new Date(createdAt).getTime();
		if (ms > CRIT_MS) return 'critical';
		if (ms > WARN_MS) return 'warning';
		return 'normal';
	}

	function timerText(createdAt: string): string {
		return formatCountdown(Math.floor((now - new Date(createdAt).getTime()) / 1000));
	}

	function timerBadgeClass(level: ReturnType<typeof urgencyLevel>) {
		if (level === 'critical') return 'bg-status-red text-white';
		if (level === 'warning') return 'bg-status-yellow text-gray-900';
		return 'bg-gray-100 text-gray-600';
	}

	function timeAgo(isoStr: string): string {
		const mins = Math.floor((now - new Date(isoStr).getTime()) / 60_000);
		if (mins < 1) return 'just now';
		if (mins === 1) return '1m ago';
		return `${mins}m ago`;
	}

	function alertUrgency(waitingSince: string): 'normal' | 'warning' | 'critical' {
		const mins = Math.floor((now - new Date(waitingSince).getTime()) / 60_000);
		if (mins >= 5) return 'critical';
		if (mins >= 3) return 'warning';
		return 'normal';
	}

	// ── Station status helpers ──
	function stationStatusIcon(allDone: boolean, total: number): string {
		if (total === 0) return '&#9898;'; // empty circle — N/A
		return allDone ? '&#9989;' : '&#9203;'; // ✅ or ⏳
	}

	function stationStatusCls(allDone: boolean, total: number): string {
		if (total === 0) return 'text-gray-300';
		return allDone ? 'text-status-green' : 'text-gray-600';
	}

	// ── Live indicator ──
	let lastUpdated = $state(Date.now());
	let isStale = $state(false);

	$effect(() => {
		dispatchCards.length;
		lastUpdated = Date.now();
	});

	$effect(() => {
		const id = setInterval(() => {
			isStale = Date.now() - untrack(() => lastUpdated) > 60_000;
		}, 10_000);
		return () => clearInterval(id);
	});

	// ── Audio: chime when a table transitions to readyToRun ──
	let lastReadyCount = $state(0);
	let isFirstRun = true;

	function playReadyChime() {
		try {
			const ctx = new AudioContext();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			// Two-tone ascending chime (C5 → E5)
			osc.frequency.value = 523;
			gain.gain.value = 0.3;
			osc.start();
			osc.stop(ctx.currentTime + 0.3);
			osc.onended = () => {
				const ctx2 = new AudioContext();
				const osc2 = ctx2.createOscillator();
				const gain2 = ctx2.createGain();
				osc2.connect(gain2);
				gain2.connect(ctx2.destination);
				osc2.frequency.value = 659;
				gain2.gain.value = 0.3;
				osc2.start();
				osc2.stop(ctx2.currentTime + 0.3);
				osc2.onended = () => ctx2.close();
				ctx.close();
			};
		} catch { /* skip if audio unavailable */ }
	}

	$effect(() => {
		const readyCount = dispatchCards.filter((c) => c.readyToRun).length;
		if (isFirstRun) {
			isFirstRun = false;
			lastReadyCount = readyCount;
			return;
		}
		if (readyCount > lastReadyCount) playReadyChime();
		lastReadyCount = readyCount;
	});
</script>

<!-- Live indicator -->
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
</div>

<div class="flex flex-col gap-4 pb-6">

	<!-- ── Section A: New Tables — compact chip row ([CR-03]) ───────────────── -->
	{#if unacknowledgedNewTables.length > 0}
		<div>
			<p class="text-xs text-gray-400 mb-1">Setup</p>
			<div class="flex gap-2 flex-wrap">
				{#each unacknowledgedNewTables as order (order.id)}
					<div class="bg-accent-light border border-accent/20 text-accent text-xs px-3 py-1.5 rounded-full flex items-center gap-1.5">
						<span class="font-bold">T{order.tableNumber}</span>
						<span class="opacity-70">— Stage Utensils</span>
						<span class="opacity-60">&middot; {timeAgo(order.createdAt)}</span>
						<button
							onclick={() => acknowledgeTable(order.id)}
							class="ml-1 rounded-full bg-accent text-white font-bold px-2 py-0.5 text-[10px] hover:bg-accent-dark active:scale-95 transition-all"
							style="min-height: 22px"
						>&#10003; Staged</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- ── Section B: Dispatch Cards ─────────────────────────────────────────── -->
	<div class="flex flex-col gap-3">
		<h2 class="flex items-center gap-2 text-base font-bold text-gray-700 uppercase tracking-wide">
			<span>&#128203; Dispatch Board</span>
			{#if dispatchCards.length > 0}
				<span class="rounded-full bg-accent px-2.5 py-0.5 text-sm font-black text-white">
					{dispatchCards.length}
				</span>
			{/if}
		</h2>

		{#if dispatchCards.length === 0}
			<div class="rounded-xl border border-border bg-surface px-6 py-10 text-center text-gray-400">
				<p class="text-3xl mb-2">&#9989;</p>
				<p class="font-semibold">No active orders</p>
				<p class="text-sm mt-1">Orders will appear as tables open and items are sent</p>
			</div>
		{:else}
			<div class="grid gap-4" style="grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));">
				{#each dispatchCards as card (card.orderId)}
					{@const urgency = urgencyLevel(card.createdAt)}
					{@const elapsedMin = Math.floor((now - new Date(card.createdAt).getTime()) / 60_000)}
					{@const cardPkg = getPkgColors(card.packageId)}

					<div class={cn(
						'flex flex-col rounded-xl border-2 overflow-hidden shadow-sm',
						card.readyToRun
							? 'border-status-green bg-emerald-50'
							: urgency === 'critical'
								? 'border-status-red animate-border-pulse-red bg-surface'
								: urgency === 'warning'
									? 'border-status-yellow bg-surface'
									: 'border-border bg-surface',
						cardPkg?.accent ?? ''
					)}>
						<!-- Card Header -->
						<div class="flex items-center justify-between px-4 py-3">
							<div class="flex items-center gap-2">
								{#if card.tableNumber !== null}
									<span class="text-2xl font-black text-gray-900">T{card.tableNumber}</span>
								{:else}
									<span class="flex items-center gap-2">
										<span class="rounded-lg bg-status-purple px-2 py-1 text-xs font-bold text-white">&#128230; TAKEOUT</span>
										<span class="text-lg font-black text-gray-900">{card.customerName ?? 'Walk-in'}</span>
									</span>
								{/if}
								{#if card.pax > 0}
									<span class="text-sm text-gray-400">{card.pax} pax</span>
								{/if}
								{#if card.scCount > 0 || card.pwdCount > 0}
									<span class="bg-accent-light text-accent text-xs px-1.5 py-0.5 rounded font-semibold">{[card.scCount > 0 ? `${card.scCount} SC` : '', card.pwdCount > 0 ? `${card.pwdCount} PWD` : ''].filter(Boolean).join(' · ')}</span>
								{/if}
							</div>
							<span class={cn('rounded-full px-3 py-1 font-mono text-sm font-bold', timerBadgeClass(urgency))}>
								{timerText(card.createdAt)}
							</span>
						</div>

						<!-- Package Row -->
						<div class={cn(
							'flex items-center justify-between px-4 py-2 border-b text-xs',
							cardPkg ? `${cardPkg.bg} ${cardPkg.border}` : 'bg-amber-50 border-amber-100'
						)}>
							<span class={cn('font-semibold', cardPkg?.text ?? 'text-amber-700')}>
								{card.packageName ?? 'Ala-carte'}
							</span>
						</div>

						<!-- Station Progress Rows -->
						<div class="flex flex-col divide-y divide-border/40 border-t border-border/40 px-4">
							<!-- Meat row — deep link to Weigh Station when pending ([09]+[SP-01]) -->
							<div class={cn('flex items-center gap-3 py-2.5', stationStatusCls(card.meats.allDone, card.meats.total))}>
								<span class="text-lg w-7 text-center" aria-hidden="true">&#129385;</span>
								<span class="flex-1 text-sm font-semibold">Meat</span>
								{#if card.meats.total === 0}
									<span class="text-xs text-gray-300">N/A</span>
								{:else}
									{#if !card.meats.allDone}
										<a href="/kitchen/weigh-station" class="text-xs text-accent underline font-semibold hover:text-accent-dark transition-colors px-1">&#8594; Weigh Station</a>
									{/if}
									<span class="font-mono text-sm font-bold">{card.meats.done}/{card.meats.total}</span>
									<span class="text-base">{@html stationStatusIcon(card.meats.allDone, card.meats.total)}</span>
								{/if}
							</div>

							<!-- Dishes row — deep link to Stove when pending ([09]+[SP-01]) -->
							<div class={cn('flex items-center gap-3 py-2.5', stationStatusCls(card.dishes.allDone, card.dishes.total))}>
								<span class="text-lg w-7 text-center" aria-hidden="true">&#127859;</span>
								<span class="flex-1 text-sm font-semibold">Dishes</span>
								{#if card.dishes.total === 0}
									<span class="text-xs text-gray-300">N/A</span>
								{:else}
									{#if !card.dishes.allDone}
										<a href="/kitchen/stove" class="text-xs text-accent underline font-semibold hover:text-accent-dark transition-colors px-1">&#8594; Stove</a>
									{/if}
									<span class="font-mono text-sm font-bold">{card.dishes.done}/{card.dishes.total}</span>
									<span class="text-base">{@html stationStatusIcon(card.dishes.allDone, card.dishes.total)}</span>
								{/if}
							</div>

							<!-- Sides row (actionable) -->
							<div class="py-2.5">
								<div class={cn('flex items-center gap-3', stationStatusCls(card.sides.allDone, card.sides.total))}>
									<span class="text-lg w-7 text-center" aria-hidden="true">&#129388;</span>
									<span class="flex-1 text-sm font-semibold">Sides</span>
									{#if card.sides.total === 0}
										<span class="text-xs text-gray-300">N/A</span>
									{:else}
										<span class="font-mono text-sm font-bold">{card.sides.done}/{card.sides.total}</span>
										<span class="text-base">{@html stationStatusIcon(card.sides.allDone, card.sides.total)}</span>
									{/if}
								</div>

								<!-- Sides item list (actionable DONE buttons) -->
								{#if card.sides.total > 0 && !card.sides.allDone}
									<div class="mt-2 ml-10 flex flex-col gap-1">
										{#each card.sides.items as item (item.id)}
											{@const isServed = item.status === 'served'}
											<div class={cn('flex items-center gap-2', isServed && 'opacity-50')}>
												<span class={cn('flex-1 text-sm', isServed && 'line-through text-gray-400')}>
													{item.menuItemName}
													{#if item.quantity > 1}
														<span class="text-xs font-bold text-gray-400">&times;{item.quantity}</span>
													{/if}
												</span>
												{#if isServed}
													<span class="text-status-green text-sm">&#10003;</span>
												{:else}
													<button
														onclick={() => markSideDone(card.orderId, item.id)}
														class="rounded-lg bg-status-green text-white font-bold text-sm active:scale-95 transition-all no-select min-h-[44px] px-3"
													>
														DONE
													</button>
												{/if}
											</div>
										{/each}
										{#if card.sides.items.filter((i) => i.status !== 'served').length > 1}
											<button
												onclick={() => completeAllSides(card.orderId, card.sides.items)}
												class="mt-1 rounded-lg bg-status-green/20 text-status-green font-bold text-sm active:scale-95 transition-all no-select min-h-[44px] px-3"
											>
												ALL SIDES DONE
											</button>
										{/if}
									</div>
								{/if}
							</div>
						</div>

						<!-- ALL DONE — Clear Order -->
						{#if card.readyToRun && (card.meats.total + card.dishes.total + card.sides.total > 0)}
							<div class="border-t-2 border-status-green px-4 py-3">
								<button
									onclick={() => completeAllForOrder(card)}
									class="w-full rounded-xl bg-status-green text-white font-black text-base uppercase tracking-wide active:scale-95 transition-all hover:bg-emerald-600 no-select"
									style="min-height: 56px"
								>
									&#9989; ALL DONE — CLEAR ORDER
								</button>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- ── Section C: Service Alerts ─────────────────────────────────────────── -->
	{#if serviceAlerts.length > 0}
		<div class="flex flex-col gap-2">
			<h2 class="flex items-center gap-2 text-base font-bold text-gray-700 uppercase tracking-wide">
				<span>&#9888;&#65039; Service Alerts</span>
				<span class="rounded-full bg-status-yellow px-2.5 py-0.5 text-sm font-black text-gray-900">
					{serviceAlerts.length}
				</span>
			</h2>
			<div class="flex flex-col gap-2">
				{#each serviceAlerts as alert (alert.itemId)}
					{@const urgency = alertUrgency(alert.waitingSince)}
					<div class={cn(
						'flex items-center gap-3 px-4 rounded-xl border overflow-hidden',
						urgency === 'critical' ? 'bg-red-50 border-red-200' :
						urgency === 'warning'  ? 'bg-amber-100 border-amber-300' :
						                        'border-status-yellow bg-status-yellow/10'
					)}>
						<span class="w-14 flex-shrink-0 text-sm font-black text-gray-900">{alert.tableLabel}</span>
						<span class="flex-1 font-medium text-gray-800">{alert.text}</span>
						<span class={cn(
							'text-xs flex-shrink-0',
							urgency === 'critical' ? 'text-status-red font-bold' : 'text-gray-500'
						)}>{timeAgo(alert.waitingSince)}</span>
						<button
							onclick={() => markSideDone(alert.orderId, alert.itemId)}
							class={cn(
								'flex-shrink-0 rounded-xl bg-status-yellow px-4 font-bold text-gray-900 hover:opacity-80 active:scale-95 transition-all',
								'min-h-[56px]'
							)}
						>
							Done &#10003;
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

</div>

<!-- Undo Toast -->
{#if toast.visible}
	<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-gray-900 text-white px-5 py-3 shadow-lg">
		<span class="text-sm font-semibold">{toast.message}</span>
		{#if toast.undoFn}
			<button
				onclick={() => { toast.undoFn?.(); dismissToast(); }}
				class="rounded-lg bg-white/20 px-3 py-1.5 text-sm font-bold hover:bg-white/30 active:scale-95 transition-all"
				style="min-height: 44px"
			>
				Undo
			</button>
		{/if}
		<button
			onclick={dismissToast}
			class="ml-1 text-white/60 hover:text-white text-lg leading-none"
			style="min-height: 44px; min-width: 44px"
		>
			&times;
		</button>
	</div>
{/if}
