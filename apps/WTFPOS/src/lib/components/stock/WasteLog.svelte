<script lang="ts">
	import { cn } from '$lib/utils';
	import {
		stockItems, wasteEntries, logWaste, WASTE_REASONS,
	} from '$lib/stores/stock.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { Flame, Droplets, Clock, Ban, Scissors, HelpCircle, Trash2, Plus, X } from 'lucide-svelte';
	import ManagerPinModal from '$lib/components/pos/ManagerPinModal.svelte';
	import { isToday } from 'date-fns';
	import { fade } from 'svelte/transition';

	interface Props {
		autoOpen?: boolean;
	}

	let { autoOpen = false }: Props = $props();

	let showModal = $state(false);

	$effect(() => {
		if (autoOpen) showModal = true;
	});

	// Quick-tap reason config with icons
	const reasonConfig: { label: string; icon: typeof Flame; color: string }[] = [
		{ label: 'Dropped / Spilled',   icon: Droplets, color: 'border-orange-200 text-orange-600 bg-orange-50 hover:bg-orange-100' },
		{ label: 'Expired',             icon: Clock,    color: 'border-status-red/30 text-status-red bg-status-red-light hover:bg-red-100' },
		{ label: 'Unusable (damaged)',   icon: Ban,      color: 'border-purple-200 text-purple-600 bg-purple-50 hover:bg-purple-100' },
		{ label: 'Overcooked',           icon: Flame,    color: 'border-status-yellow/30 text-status-yellow bg-status-yellow-light hover:bg-yellow-100' },
		{ label: 'Trimming (bone/fat)',  icon: Scissors, color: 'border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100' },
		{ label: 'Other',               icon: HelpCircle,color: 'border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100' },
	];

	const reasonBadgeColor: Record<string, string> = {
		'Dropped / Spilled':   'bg-orange-50 text-orange-600',
		'Expired':             'bg-status-red-light text-status-red',
		'Unusable (damaged)':  'bg-purple-50 text-purple-600',
		'Overcooked':          'bg-status-yellow-light text-status-yellow',
		'Trimming (bone/fat)': 'bg-amber-50 text-amber-700',
		'Other':               'bg-gray-100 text-gray-500',
	};

	let selectedStockId = $state('');
	let qty    = $state('');
	let reason = $state('');
	let saved  = $state(false);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let showPinModal = $state(false);

	// Cleanup timer on component destroy
	$effect(() => {
		return () => {
			if (saveTimer) clearTimeout(saveTimer);
		};
	});

	// Branch-scoped stock items for dropdown and entry filtering
	const branchStockIds = $derived(
		new Set(
			stockItems.value
				.filter(s => session.locationId === 'all' || s.locationId === session.locationId)
				.map(s => s.id)
		)
	);
	const branchStockItems = $derived(
		stockItems.value.filter(s => session.locationId === 'all' || s.locationId === session.locationId)
	);

	// Auto-fill unit from selected item
	const selectedItem = $derived(stockItems.value.find(s => s.id === selectedStockId));
	const unit = $derived(selectedItem?.unit ?? '');

	const canSave = $derived(selectedStockId !== '' && qty.trim() !== '' && parseFloat(qty) > 0 && reason !== '');

	// Filter to today's entries for current branch only
	const todayEntries = $derived(
		wasteEntries.value.filter(e => {
			try {
				return isToday(new Date(e.loggedAt)) && branchStockIds.has(e.stockItemId);
			} catch {
				return true; // fallback — show all if date parse fails
			}
		})
	);

	// Summary stats
	const totalWasteToday = $derived(
		todayEntries.reduce((s, e) => s + e.qty, 0)
	);
	const reasonCounts = $derived(
		Object.fromEntries(
			WASTE_REASONS.map(r => [r, todayEntries.filter(e => e.reason === r).length])
		)
	);
	const topReason = $derived(
		WASTE_REASONS.reduce((best, r) => reasonCounts[r] > (reasonCounts[best] ?? 0) ? r : best, WASTE_REASONS[0] as string)
	);
	const mostWastedItem = $derived((() => {
		const totals: Record<string, { name: string; qty: number }> = {};
		for (const e of todayEntries) {
			if (!totals[e.itemName]) totals[e.itemName] = { name: e.itemName, qty: 0 };
			totals[e.itemName].qty += e.qty;
		}
		const entries = Object.values(totals);
		return entries.reduce((best, x) => x.qty > best.qty ? x : best, { name: '—', qty: 0 });
	})());

	function openWasteModal() {
		selectedStockId = '';
		qty = '';
		reason = '';
		saved = false;
		showModal = true;
	}

	function handleLog() {
		if (!canSave) return;
		showPinModal = true;
	}

	async function handlePinConfirmed() {
		if (!canSave || !selectedItem) return;
		showPinModal = false;
		await logWaste(selectedStockId, selectedItem.name, parseFloat(qty) || 0, unit, reason, session.userName);
		selectedStockId = '';
		qty = '';
		reason = '';
		if (saveTimer) clearTimeout(saveTimer);
		saved = true;
		saveTimer = setTimeout(() => { saved = false; showModal = false; }, 1500);
	}
</script>

<!-- ─── Summary cards ───────────────────────────────────────────────────────── -->
<div class="mb-5 grid grid-cols-3 gap-4">
	<div class="rounded-xl border border-border bg-white px-4 py-3">
		<div class="flex items-center gap-2 mb-1">
			<Trash2 class="w-4 h-4 text-gray-400" />
			<p class="text-xs font-medium uppercase tracking-wide text-gray-400">Total Waste Today</p>
		</div>
		<p class="text-xl font-bold font-mono text-gray-900">{totalWasteToday.toLocaleString()}</p>
	</div>
	<div class="rounded-xl border border-border bg-white px-4 py-3">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Top Wasted Item</p>
		<p class="text-sm font-bold text-gray-900 truncate">{mostWastedItem.name}</p>
	</div>
	<div class="rounded-xl border border-border bg-white px-4 py-3">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-400 mb-1">Most Common Reason</p>
		<p class="text-sm font-bold text-gray-900 truncate">{todayEntries.length > 0 ? topReason : '—'}</p>
	</div>
</div>

<!-- ─── Waste Breakdown Chart ──────────────────────────────────────────────── -->
{#if totalWasteToday > 0}
	<div class="mb-5 rounded-xl border border-border bg-white p-4">
		<p class="text-xs font-medium uppercase tracking-wide text-gray-500 mb-3">Waste Breakdown by Reason</p>
		<div class="flex h-6 w-full overflow-hidden rounded-full">
			{#each WASTE_REASONS as r}
				{@const count = reasonCounts[r] || 0}
				{#if count > 0}
					<!-- Note: in a real app you might map these to hex colors, grabbing tailwind equivalents -->
					<div 
						class={cn('h-full transition-all', reasonBadgeColor[r] ? reasonBadgeColor[r].split(' ')[0].replace('bg-', 'bg-').replace('-50', '-500').replace('-light', '-400') : 'bg-gray-400')}
						style="width: {(count / totalWasteToday) * 100}%"
						title={`${r}: ${count}`}
					></div>
				{/if}
			{/each}
		</div>
		<div class="mt-3 flex flex-wrap gap-3">
			{#each WASTE_REASONS as r}
				{@const count = reasonCounts[r] || 0}
				{#if count > 0}
					<div class="flex items-center gap-1.5 text-xs">
						<span class={cn('w-2 h-2 rounded-full', reasonBadgeColor[r] ? reasonBadgeColor[r].split(' ')[0].replace('bg-', 'bg-').replace('-50', '-500').replace('-light', '-400') : 'bg-gray-400')}></span>
						<span class="font-medium text-gray-700">{r}</span>
						<span class="text-gray-400 font-mono">({Math.round((count / totalWasteToday) * 100)}%)</span>
					</div>
				{/if}
			{/each}
		</div>
	</div>
{/if}

<!-- Log Waste button + waste log table -->
<div class="flex items-center justify-between mb-4">
	<div>
		<h2 class="text-lg font-bold text-gray-900">Today's Waste Log</h2>
		<p class="text-sm text-gray-500 mt-0.5">Preparation waste only — not unconsumed customer leftovers</p>
	</div>
	<button onclick={openWasteModal} class="btn-primary flex items-center gap-2 shadow-sm">
		<Plus class="w-4 h-4" /> Log Waste
	</button>
</div>

<div class="flex flex-col gap-3">
	{#if todayEntries.length === 0}
		<div class="flex items-center justify-center rounded-xl border border-border bg-white p-10 text-center text-gray-400">
			<div>
				<Trash2 class="w-8 h-8 mx-auto mb-2 opacity-20" />
				<p class="text-sm">No waste logged today</p>
			</div>
		</div>
	{:else}
		<div class="overflow-hidden rounded-xl border border-border bg-white">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-border bg-gray-50">
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Item</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Qty</th>
						<th class="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Reason</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">By</th>
						<th class="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Time</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each todayEntries as e (e.id)}
						<tr class="hover:bg-gray-50">
							<td class="px-4 py-3 font-medium text-gray-900">{e.itemName}</td>
							<td class="px-4 py-3 text-right font-mono text-gray-700">{e.qty} {e.unit}</td>
							<td class="px-4 py-3">
								<span class={cn('rounded-full px-2.5 py-0.5 text-xs font-medium', reasonBadgeColor[e.reason] ?? 'bg-gray-100 text-gray-500')}>
									{e.reason}
								</span>
							</td>
							<td class="px-4 py-3 text-right text-xs text-gray-500">{e.loggedBy}</td>
							<td class="px-4 py-3 text-right text-xs text-gray-400">{new Date(e.loggedAt).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	{/if}
</div>

<ManagerPinModal
	isOpen={showPinModal}
	title="Authorize Waste Log"
	description="Waste entries require Manager PIN to prevent unauthorized inventory deductions."
	confirmLabel="Log Waste"
	onClose={() => (showPinModal = false)}
	onConfirm={handlePinConfirmed}
/>

<!-- Log Waste Modal -->
{#if showModal}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" transition:fade={{ duration: 150 }}>
		<div class="pos-card w-[440px] max-h-[90vh] overflow-y-auto flex flex-col gap-5">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">Log Waste</h3>
				<button onclick={() => (showModal = false)} class="rounded-full p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors">
					<X class="w-5 h-5" />
				</button>
			</div>

			<!-- Item -->
			<div class="flex flex-col gap-1.5">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Item *</span>
				<select bind:value={selectedStockId} class="pos-input">
					<option value="">Select item…</option>
					{#each branchStockItems as s}
						<option value={s.id}>{s.name}</option>
					{/each}
				</select>
			</div>

			<!-- Quantity + auto unit -->
			<div class="flex gap-3">
				<div class="flex-1 flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Quantity *</span>
					<input type="number" bind:value={qty} placeholder="0" min="0" step="any" class="pos-input font-mono" />
				</div>
				<div class="w-20 flex flex-col gap-1.5">
					<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Unit</span>
					<input type="text" value={unit || '—'} disabled class="pos-input bg-gray-50 text-gray-400 text-center font-mono text-sm" />
				</div>
			</div>

			<!-- Quick-tap reason buttons -->
			<div class="flex flex-col gap-2">
				<span class="text-xs font-semibold uppercase tracking-wide text-gray-500">Reason *</span>
				<div class="grid grid-cols-2 gap-2">
					{#each reasonConfig as rc}
						<button
							onclick={() => (reason = reason === rc.label ? '' : rc.label)}
							class={cn(
								'flex items-center gap-2 min-h-[44px] rounded-lg border px-3 py-2 text-xs font-semibold transition-all text-left',
								reason === rc.label
									? rc.color + ' border-current ring-1 ring-current/30'
									: rc.color
							)}
						>
							<rc.icon class="w-3.5 h-3.5 flex-shrink-0" />
							{rc.label}
						</button>
					{/each}
				</div>
			</div>

			{#if saved}
				<div class="rounded-lg border border-status-green/20 bg-status-green-light px-4 py-3 text-center text-sm font-bold text-status-green">
					Waste logged!
				</div>
			{:else}
				<div class="flex gap-3 mt-2">
					<button onclick={() => (showModal = false)} class="btn-ghost flex-1">Cancel</button>
					<button onclick={handleLog} disabled={!canSave} class="btn-primary flex-1 disabled:opacity-40">
						Log Waste
					</button>
				</div>
			{/if}
		</div>
	</div>
{/if}
