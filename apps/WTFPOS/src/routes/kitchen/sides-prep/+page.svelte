<script lang="ts">
	import { kdsTickets } from '$lib/stores/pos/kds.svelte';
	import { orders, markItemServed } from '$lib/stores/pos.svelte';
	import type { KdsTicketItem } from '$lib/types';
	import { formatCountdown, cn } from '$lib/utils';

	// ── Live timer ──
	let now = $state(Date.now());
	$effect(() => {
		const id = setInterval(() => { now = Date.now(); }, 10_000);
		return () => clearInterval(id);
	});

	// ── Section 1: New tables (opened in last 15min, no items yet) ──
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

	// ── Section 2: Sides queue — one card per table ──
	type MergedSideTicket = {
		orderId: string;
		tableNumber: number | null;
		customerName?: string;
		createdAt: string;
		items: KdsTicketItem[];
	};

	const sideTickets = $derived.by((): MergedSideTicket[] => {
		const byOrder = new Map<string, MergedSideTicket>();
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
		return Array.from(byOrder.values())
			.map((ticket) => ({
				...ticket,
				items: ticket.items.filter((i) => i.category === 'sides' && i.status !== 'cancelled')
			}))
			.filter((t) => t.items.some((i) => i.status !== 'served'))
			.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
	});

	async function markSideDone(orderId: string, itemId: string) {
		await markItemServed(orderId, itemId);
	}

	async function completeAllSides(ticket: MergedSideTicket) {
		for (const item of ticket.items) {
			if (item.status !== 'served') {
				await markItemServed(ticket.orderId, item.id);
			}
		}
	}

	// ── Section 3: Service alerts (category === 'service') ──
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

	// ── Urgency ──
	const WARN_MS = 5 * 60_000;
	const CRIT_MS = 10 * 60_000;

	function urgencyLevel(createdAt: string): 'critical' | 'warning' | 'normal' {
		const ms = now - new Date(createdAt).getTime();
		if (ms > CRIT_MS) return 'critical';
		if (ms > WARN_MS) return 'warning';
		return 'normal';
	}

	function ticketBorderClass(level: ReturnType<typeof urgencyLevel>) {
		if (level === 'critical') return 'border-status-red animate-border-pulse-red';
		if (level === 'warning') return 'border-status-yellow';
		return 'border-border';
	}

	function timerBadgeClass(level: ReturnType<typeof urgencyLevel>) {
		if (level === 'critical') return 'bg-status-red text-white';
		if (level === 'warning') return 'bg-status-yellow text-gray-900';
		return 'bg-gray-100 text-gray-600';
	}

	// Service alerts escalate faster than sides tickets (3min warn / 5min crit vs 5min / 10min) — intentional.
	function alertUrgency(waitingSince: string): 'normal' | 'warning' | 'critical' {
		const mins = Math.floor((now - new Date(waitingSince).getTime()) / 60_000);
		if (mins >= 5) return 'critical';
		if (mins >= 3) return 'warning';
		return 'normal';
	}

	// ── Progress ──
	function sidesProgress(items: KdsTicketItem[]) {
		const total = items.length; // already filtered to non-cancelled sides
		const served = items.filter((i) => i.status === 'served').length;
		const pct = total > 0 ? (served / total) * 100 : 0;
		return { served, total, pct };
	}

	// ── Time formatting ──
	function timerText(createdAt: string): string {
		const secs = Math.floor((now - new Date(createdAt).getTime()) / 1000);
		return formatCountdown(secs);
	}

	function timeAgo(isoStr: string): string {
		const diffMs = now - new Date(isoStr).getTime();
		const mins = Math.floor(diffMs / 60_000);
		if (mins < 1) return 'just now';
		if (mins === 1) return '1m ago';
		return `${mins}m ago`;
	}

	// ── Audio: play soft tone when new sides arrive ──
	let lastSidesTotal = $state(0);
	let isFirstSidesRun = true;

	function playSideTone() {
		try {
			const ctx = new AudioContext();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.value = 660;
			gain.gain.value = 0.35;
			osc.start();
			osc.stop(ctx.currentTime + 0.15);
			osc.onended = () => ctx.close();
		} catch { /* skip if audio unavailable */ }
	}

	$effect(() => {
		const total = sideTickets.reduce(
			(s, t) => s + t.items.filter((i) => i.status !== 'served').length,
			0
		);
		if (isFirstSidesRun) {
			isFirstSidesRun = false;
			lastSidesTotal = total;
			return;
		}
		if (total > lastSidesTotal) playSideTone();
		lastSidesTotal = total;
	});
</script>

<div class="flex flex-col gap-4 pb-6">

	<!-- ── Section 1: New Tables ─────────────────────────────────────────────── -->
	{#if unacknowledgedNewTables.length > 0}
		<div class="rounded-xl bg-accent px-4 py-3 text-white shadow-sm">
			<p class="mb-2 text-xs font-bold uppercase tracking-wide opacity-80">🆕 New Tables — Stage Utensils</p>
			<div class="flex flex-wrap gap-2">
				{#each unacknowledgedNewTables as order (order.id)}
					<div class="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2">
						<span class="font-bold">T{order.tableNumber}</span>
						<span class="text-sm opacity-80">· {order.pax ?? '?'} pax · {timeAgo(order.createdAt)}</span>
						<button
							onclick={() => acknowledgeTable(order.id)}
							class={cn(
								'ml-1 rounded-lg bg-white/30 px-3 font-semibold text-white hover:bg-white/50 active:scale-95 transition-all',
								'min-h-[56px]'
							)}
						>
							✓ Staged
						</button>
					</div>
				{/each}
			</div>
		</div>
	{:else}
		<div class="flex items-center gap-2 rounded-xl border border-border bg-surface px-4 text-sm text-gray-400 min-h-[48px]">
			<span class="text-base">🆕</span>
			<span>New table alerts will appear here when a table opens</span>
		</div>
	{/if}

	<!-- ── Section 2: Sides Queue (per-table cards) ───────────────────────────── -->
	<div class="flex flex-col gap-3">
		<h2 class="flex items-center gap-2 text-base font-bold text-gray-700 uppercase tracking-wide">
			<span>🍚 Sides Queue</span>
			{#if sideTickets.length > 0}
				<span class="rounded-full bg-accent px-2.5 py-0.5 text-sm font-black text-white">
					{sideTickets.length}
				</span>
			{/if}
		</h2>

		{#if sideTickets.length === 0}
			<div class="rounded-xl border border-border bg-surface px-6 py-10 text-center text-gray-400">
				<p class="text-3xl mb-2">✅</p>
				<p class="font-semibold">No pending sides</p>
				<p class="text-sm mt-1">All caught up!</p>
			</div>
		{:else}
			{#each sideTickets as ticket (ticket.orderId)}
				{@const urgency = urgencyLevel(ticket.createdAt)}
				{@const progress = sidesProgress(ticket.items)}

				<div class={cn(
					'flex flex-col rounded-xl border-2 overflow-hidden bg-surface shadow-sm',
					ticketBorderClass(urgency)
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
						</div>
						<div class="flex items-center gap-2">
							<span class="text-sm font-bold text-gray-400 font-mono">{progress.served}/{progress.total}</span>
							<span class={cn('rounded-full px-3 py-1 font-mono text-sm font-bold', timerBadgeClass(urgency))}>
								{timerText(ticket.createdAt)}
							</span>
						</div>
					</div>

					<!-- Progress Bar -->
					<div class="h-1 bg-gray-100" role="progressbar" aria-valuenow={progress.served} aria-valuemin={0} aria-valuemax={progress.total} aria-label="Sides completion progress">
						<div
							class="h-full bg-status-green transition-all duration-500"
							style="width: {progress.pct}%"
						></div>
					</div>

					<!-- Items List -->
					<div class="flex flex-col divide-y divide-border/30">
						{#each ticket.items as item (item.id)}
							{@const isServed = item.status === 'served'}
							<div class={cn('flex items-center gap-3 px-4 py-2', isServed && 'opacity-50')}>
								<span class={cn('flex-1 text-base font-medium', isServed && 'line-through text-gray-400')}>
									{item.menuItemName}
								</span>
								{#if isServed}
									<span class="flex items-center justify-center rounded-lg bg-status-green/10 text-status-green text-lg min-h-[48px] w-12 h-12">
										✓
									</span>
								{:else}
									<button
										onclick={() => markSideDone(ticket.orderId, item.id)}
										class="flex items-center justify-center rounded-lg bg-status-green text-white font-bold text-lg active:scale-95 transition-all no-select min-h-[48px] w-12 h-12"
									>
										✓
									</button>
								{/if}
							</div>
						{/each}
					</div>

					<!-- SIDES DONE footer -->
					<div class="border-t border-border px-4 py-3">
						<button
							onclick={() => completeAllSides(ticket)}
							class="w-full rounded-xl bg-status-green text-white font-black text-base uppercase tracking-wide active:scale-95 transition-all hover:bg-emerald-600 no-select"
							style="min-height: 56px"
						>
							SIDES DONE ✓
						</button>
					</div>
				</div>
			{/each}
		{/if}
	</div>

	<!-- ── Section 3: Service Alerts ─────────────────────────────────────────── -->
	{#if serviceAlerts.length > 0}
		<div class="flex flex-col gap-2">
			<h2 class="flex items-center gap-2 text-base font-bold text-gray-700 uppercase tracking-wide">
				<span>⚠️ Service Alerts</span>
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
							Done ✓
						</button>
					</div>
				{/each}
			</div>
		</div>
	{/if}

</div>
