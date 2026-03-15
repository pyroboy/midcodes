<script lang="ts">
	import { kdsTickets, kdsTicketHistory } from '$lib/stores/pos/kds.svelte';
	import { untrack } from 'svelte';

	interface VoidAlert {
		id: string;
		tableNumber: number | null;
		customerName?: string;
		dismissedAt: number | null;
	}

	let voidAlerts = $state<VoidAlert[]>([]);
	let prevTicketMap = new Map<string, { tableNumber: number | null; customerName?: string }>();
	let initialized = false;

	/** Play 880Hz beep via Web Audio API */
	function playVoidBeep() {
		try {
			const ctx = new AudioContext();
			const osc = ctx.createOscillator();
			const gain = ctx.createGain();
			osc.connect(gain);
			gain.connect(ctx.destination);
			osc.frequency.value = 880;
			gain.gain.setValueAtTime(1.5, ctx.currentTime);
			gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
			osc.start();
			osc.stop(ctx.currentTime + 0.4);
			// Second beep
			const osc2 = ctx.createOscillator();
			const gain2 = ctx.createGain();
			osc2.connect(gain2);
			gain2.connect(ctx.destination);
			osc2.frequency.value = 880;
			gain2.gain.setValueAtTime(1.5, ctx.currentTime + 0.5);
			gain2.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
			osc2.start(ctx.currentTime + 0.5);
			osc2.stop(ctx.currentTime + 0.9);
			setTimeout(() => ctx.close(), 1200);
		} catch { /* audio unavailable */ }
	}

	function dismiss(alertId: string) {
		voidAlerts = voidAlerts.filter(a => a.id !== alertId);
	}

	$effect(() => {
		const currentTickets = kdsTickets.value;
		const history = kdsTicketHistory.value;
		const currentIds = new Set(currentTickets.map(t => t.id));
		const historyIds = new Set(history.map(t => t.id));

		if (!initialized) {
			initialized = true;
			prevTicketMap.clear();
			for (const t of currentTickets) {
				prevTicketMap.set(t.id, { tableNumber: t.tableNumber, customerName: t.customerName ?? undefined });
			}
			return;
		}

		const prev = untrack(() => prevTicketMap);
		let hasNewVoid = false;

		for (const [id, meta] of prev) {
			if (!currentIds.has(id) && !historyIds.has(id)) {
				// Ticket disappeared and not in history = voided (deleted), not bumped
				const alertId = `${id}-${Date.now()}`;
				voidAlerts = [...untrack(() => voidAlerts), {
					id: alertId,
					tableNumber: meta.tableNumber,
					customerName: meta.customerName,
					dismissedAt: null
				}];
				hasNewVoid = true;

				// Auto-dismiss after 30s
				setTimeout(() => {
					voidAlerts = voidAlerts.filter(a => a.id !== alertId);
				}, 30_000);
			}
		}

		if (hasNewVoid) {
			playVoidBeep();
		}

		// Update prev map
		prevTicketMap = new Map();
		for (const t of currentTickets) {
			prevTicketMap.set(t.id, { tableNumber: t.tableNumber, customerName: t.customerName ?? undefined });
		}
	});
</script>

{#each voidAlerts as alert (alert.id)}
	<div class="mx-3 mb-3 rounded-xl border-2 border-status-red bg-red-50 px-4 py-3 flex items-center justify-between gap-3 animate-pulse shadow-md">
		<div class="flex items-center gap-2 min-w-0">
			<span class="text-2xl shrink-0">&#128680;</span>
			<span class="text-sm font-black text-status-red uppercase tracking-wide truncate">
				{alert.tableNumber !== null ? `TABLE ${alert.tableNumber}` : (alert.customerName ?? 'TAKEOUT')} ORDER VOIDED
			</span>
		</div>
		<button
			onclick={() => dismiss(alert.id)}
			class="shrink-0 rounded-lg bg-status-red text-white font-bold text-sm px-4 active:scale-95 transition-all"
			style="min-height: 44px"
		>
			Got it
		</button>
	</div>
{/each}
