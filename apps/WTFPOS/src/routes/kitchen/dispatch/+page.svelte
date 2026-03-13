<script lang="ts">
	import { kdsTickets, recallTicket } from '$lib/stores/pos/kds.svelte';
	import { orders, markItemServed } from '$lib/stores/pos.svelte';
	import { log } from '$lib/stores/audit.svelte';
	import type { KdsTicketItem } from '$lib/types';
	import { cn } from '$lib/utils';
	import { mergeTicketsByOrder, urgencyLevel, timerBadgeClass, timerText } from '$lib/stores/pos/kds.utils';
	import { getPkgColors } from '$lib/stores/pos/utils';
	import { untrack } from 'svelte';

	// ── Live timer ──
	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => { now = Date.now(); }, 1000);
		return () => clearInterval(id);
	});

	// ── Per-table dispatch cards ──
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
		const merged = mergeTicketsByOrder(kdsTickets.value);

		// Look up pax from orders store
		const orderMap = new Map(orders.value.map((o) => [o.id, o]));

		return merged
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

	// ── Actions ──
	async function markSideDone(orderId: string, itemId: string) {
		try {
			await markItemServed(orderId, itemId);
		} catch (err) {
			console.error('[Dispatch] markSideDone failed:', err);
			showToast(`Failed to update — ${err instanceof Error ? err.message : 'try again'}`);
		}
	}

	async function completeAllSides(orderId: string, items: KdsTicketItem[]) {
		try {
			for (const item of items) {
				if (item.status !== 'served') {
					await markItemServed(orderId, item.id);
				}
			}
		} catch (err) {
			console.error('[Dispatch] completeAllSides failed:', err);
			showToast(`Failed to update — ${err instanceof Error ? err.message : 'try again'}`);
		}
	}

	// ── Connectivity Test ──
	let pingResult = $state<string>('');
	let pingRunning = $state(false);

	async function runConnectivityTest() {
		pingRunning = true;
		pingResult = '⏳ Testing...';
		const steps: string[] = [];

		try {
			// Step 1: HTTP round-trip
			const token = `ping-${Date.now()}`;
			const res = await fetch('/api/replication/ping', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ token, collection: 'orders', testWrite: true,
					testFields: { locationId: 'test', tableNumber: 0, items: [], total: 0 }
				})
			});
			if (!res.ok) {
				steps.push(`❌ HTTP: ${res.status}`);
			} else {
				const data = await res.json();
				steps.push(`✅ HTTP round-trip OK`);
				steps.push(`✅ Server sees us as: ${data.deviceLabel}`);
				steps.push(`${data.storeCount > 0 ? '✅' : '⚠️'} Orders in store: ${data.storeCount}`);
				if (data.writeOk === true) steps.push('✅ Server write OK');
				else if (data.writeOk === false) steps.push(`❌ Server write FAILED: ${data.writeError}`);
			}

			// Step 2: Test the actual write proxy path (what DONE button uses)
			const testOrder = orders.value[0];
			if (testOrder) {
				try {
					// Read the order via the same path the write proxy uses
					const readRes = await fetch(`/api/collections/orders/read`);
					if (readRes.ok) {
						const readData = await readRes.json();
						const docs = Array.isArray(readData) ? readData : (readData.documents ?? []);
						steps.push(`✅ Collection read: ${docs.length} orders`);
						const found = docs.find((d: any) => d.id === testOrder.id);
						steps.push(found ? `✅ Can find order ${testOrder.id.slice(0,8)}…` : `❌ Order ${testOrder.id.slice(0,8)}… NOT in server store`);
					} else {
						steps.push(`❌ Collection read failed: ${readRes.status}`);
					}
				} catch (e: any) {
					steps.push(`❌ Collection read error: ${e.message}`);
				}
			} else {
				steps.push('⚠️ No orders in local store to test with');
			}

			// Step 3: Check KDS tickets
			steps.push(`📋 Local KDS tickets: ${kdsTickets.value.length}`);
			steps.push(`📋 Local orders: ${orders.value.length}`);

		} catch (err: any) {
			steps.push(`❌ Network error: ${err.message}`);
		}

		pingResult = steps.join('\n');
		pingRunning = false;
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
		try {
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
		} catch (err) {
			console.error('[Dispatch] completeAllForOrder failed:', err);
			showToast(`Failed to clear order — ${err instanceof Error ? err.message : 'try again'}`);
		}
	}

	// Urgency, timer — from shared kds.utils

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

	// ── Audio: distinct sounds per station update ──
	// All sounds play on every interaction — including local dispatch actions

	// Snapshot of previous card state for diffing
	type CardSnapshot = { meatDone: number; dishDone: number; sideDone: number; serviceCount: number; readyToRun: boolean };
	let prevSnapshots = $state<Map<string, CardSnapshot>>(new Map());
	let audioInitialized = false;

	const MASTER_VOLUME = 1.5;

	/** Play a tone sequence. Each note: [frequency, duration, delay-before] */
	function playTones(notes: Array<[number, number, number]>, volume = MASTER_VOLUME) {
		try {
			const ctx = new AudioContext();
			let t = ctx.currentTime;
			for (const [freq, dur, delay] of notes) {
				t += delay;
				const osc = ctx.createOscillator();
				const gain = ctx.createGain();
				osc.connect(gain);
				gain.connect(ctx.destination);
				osc.frequency.value = freq;
				gain.gain.setValueAtTime(volume, t);
				gain.gain.exponentialRampToValueAtTime(0.01, t + dur);
				osc.start(t);
				osc.stop(t + dur);
				t += dur;
			}
			// Clean up after all notes finish
			setTimeout(() => ctx.close(), (t - ctx.currentTime) * 1000 + 200);
		} catch { /* skip if audio unavailable */ }
	}

	// NEW ORDER received — bold descending double-ding (G5 → C5), attention-grabbing
	function playNewOrderSound() {
		playTones([[784, 0.3, 0], [523, 0.4, 0.1]]);
	}

	// Meat updated — punchy mid-range triple-tone (G4 → B4 → D5), loud and clear on tablet speakers
	function playMeatSound() {
		playTones([[392, 0.35, 0], [494, 0.35, 0.05], [587, 0.4, 0.05]], MASTER_VOLUME * 1.3);
	}

	// Dishes updated — loud mid three-tone (E4 → G4 → B4), warm and full
	function playDishesSound() {
		playTones([[330, 0.25, 0], [392, 0.25, 0.05], [494, 0.3, 0.05]]);
	}

	// Sides done — punchy double beep (A5 → A5), clear confirmation
	function playSidesSound() {
		playTones([[880, 0.15, 0], [880, 0.18, 0.08]]);
	}

	// Request incoming — attention triple-tap (F5 → F5 → A5), urgent
	function playRequestSound() {
		playTones([[698, 0.15, 0], [698, 0.15, 0.08], [880, 0.2, 0.08]]);
	}

	// Ready to run — ascending chime (C5 → E5 → G5 → C6), triumphant
	function playReadyChime() {
		playTones([[523, 0.2, 0], [659, 0.2, 0.05], [784, 0.25, 0.05], [1047, 0.35, 0.05]]);
	}

	$effect(() => {
		// Build current snapshots — read dispatchCards to subscribe
		const currentSnapshots = new Map<string, CardSnapshot>();
		for (const card of dispatchCards) {
			currentSnapshots.set(card.orderId, {
				meatDone: card.meats.done,
				dishDone: card.dishes.done,
				sideDone: card.sides.done,
				serviceCount: card.service.items.length,
				readyToRun: card.readyToRun
			});
		}

		// Skip first run — just capture initial state
		if (!audioInitialized) {
			audioInitialized = true;
			prevSnapshots = currentSnapshots;
			return;
		}

		// Diff against previous state and play appropriate sounds
		let playedNewOrder = false, playedMeat = false, playedDish = false, playedSides = false, playedRequest = false, playedReady = false;

		for (const [orderId, curr] of currentSnapshots) {
			const prev = untrack(() => prevSnapshots).get(orderId);
			if (!prev) {
				// New card appeared — play new order sound
				if (!playedNewOrder) { playNewOrderSound(); playedNewOrder = true; }
				if (curr.serviceCount > 0 && !playedRequest) { playRequestSound(); playedRequest = true; }
				continue;
			}

			if (curr.meatDone > prev.meatDone && !playedMeat) { playMeatSound(); playedMeat = true; }
			if (curr.dishDone > prev.dishDone && !playedDish) { playDishesSound(); playedDish = true; }
			if (curr.sideDone > prev.sideDone && !playedSides) { playSidesSound(); playedSides = true; }
			if (curr.serviceCount > prev.serviceCount && !playedRequest) { playRequestSound(); playedRequest = true; }
			if (curr.readyToRun && !prev.readyToRun && !playedReady) { playReadyChime(); playedReady = true; }
		}

		prevSnapshots = currentSnapshots;
	});
</script>

<div class="flex flex-col gap-3 sm:gap-4 pb-6">

	<!-- ── Dispatch Cards ─────────────────────────────────────────── -->
	<div class="flex flex-col gap-3">
		{#if dispatchCards.length === 0}
			<div class="rounded-xl border border-border bg-surface px-6 py-10 text-center text-gray-400">
				<p class="text-3xl mb-2">&#9989;</p>
				<p class="font-semibold">No active orders</p>
				<p class="text-sm mt-1">Orders will appear as tables open and items are sent</p>
			</div>
		{:else}
			<div class="grid gap-3 sm:gap-4" style="grid-template-columns: repeat(auto-fill, minmax(min(100%, 300px), 1fr));">
				{#each dispatchCards as card (card.orderId)}
					{@const urgency = urgencyLevel(card.createdAt, now)}
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
								{timerText(card.createdAt, now)}
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

							<!-- Requests row (service items — extra tongs, scissors, etc.) -->
							{#if card.service.items.length > 0}
								<div class="py-2.5">
									<div class="flex items-center gap-3 text-status-purple">
										<span class="text-lg w-7 text-center" aria-hidden="true">&#128296;</span>
										<span class="flex-1 text-sm font-semibold">Requests</span>
										<span class="font-mono text-sm font-bold">{card.service.items.length}</span>
									</div>
									<div class="mt-2 ml-10 flex flex-wrap gap-2">
										{#each card.service.items as item (item.id)}
											<button
												onclick={() => markSideDone(card.orderId, item.id)}
												class="flex items-center gap-2 rounded-lg border border-status-purple/30 bg-status-purple/5 px-3 text-sm font-semibold text-status-purple hover:bg-status-purple/10 active:scale-95 transition-all no-select"
												style="min-height: 44px"
											>
												{item.menuItemName}
												<span class="rounded bg-status-purple text-white text-[10px] font-bold px-1.5 py-0.5">DONE</span>
											</button>
										{/each}
									</div>
								</div>
							{/if}
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


</div>

<!-- Connectivity Test Panel -->
<div class="fixed bottom-20 right-3 sm:right-4 z-50">
	<button
		onclick={runConnectivityTest}
		disabled={pingRunning}
		class="rounded-full bg-gray-800 text-white shadow-lg w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center text-lg active:scale-95 transition-all"
		title="Test server connection"
	>
		{pingRunning ? '⏳' : '🏓'}
	</button>
	{#if pingResult}
		<div class="absolute bottom-14 right-0 w-[calc(100vw-2rem)] max-w-80 rounded-xl bg-gray-900 text-white p-4 shadow-xl text-xs font-mono">
			<div class="flex justify-between items-center mb-2">
				<span class="font-bold text-sm">Connection Test</span>
				<button onclick={() => { pingResult = ''; }} class="text-white/60 hover:text-white">&times;</button>
			</div>
			<pre class="whitespace-pre-wrap">{pingResult}</pre>
		</div>
	{/if}
</div>

<!-- Undo Toast -->
{#if toast.visible}
	<div class="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-xl bg-gray-900 text-white px-4 sm:px-5 py-3 shadow-lg max-w-[calc(100vw-2rem)]">
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
