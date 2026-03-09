<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { salesSummary, eodSummary, generateXRead, xReadHistory } from '$lib/stores/reports.svelte';
	import { orders } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { getCurrentLocation } from '$lib/stores/session.svelte';
	import { Loader2 } from 'lucide-svelte';
	import ManagerPinModal from '$lib/components/pos/ManagerPinModal.svelte';

	const summary = $derived(salesSummary());
	const eod = $derived(eodSummary());
	const liveOrders = $derived(
		(session.locationId === 'all' ? orders.value : orders.value.filter(o => o.locationId === session.locationId))
	);
	const openOrders = $derived(liveOrders.filter(o => o.status === 'open' || o.status === 'pending_payment').length);
	const paidOrders = $derived(liveOrders.filter(o => o.status === 'paid').length);
	const voidedOrders = $derived(liveOrders.filter(o => o.status === 'cancelled').length);
	const voidedAmount = $derived(
		liveOrders
			.filter(o => o.status === 'cancelled')
			.reduce((s, o) => s + (o.total ?? 0), 0)
	);

	// ─── P1-17: VAT breakdown ────────────────────────────────────────────────
	const vatAmount = $derived(summary.grossSales > 0 ? Math.round(summary.grossSales / 1.12 * 0.12) : 0);
	const vatExclusive = $derived(summary.grossSales - vatAmount);

	// ─── P1-16 / P2-10: Generate X-Read confirmation + loading state ─────────
	let showConfirm = $state(false);
	let justGenerated = $state(false);
	let isGenerating = $state(false);
	// P2-10: Manager PIN gate
	let pinModalOpen = $state(false);

	const locationName = $derived(getCurrentLocation()?.name ?? 'this branch');

	// P2-10: Open PIN modal instead of confirmation directly
	function handleGenerateClick() {
		pinModalOpen = true;
	}

	function handlePinConfirmed(_pin: string) {
		pinModalOpen = false;
		showConfirm = true;
	}

	function handlePinCancel() {
		pinModalOpen = false;
	}

	async function handleConfirmGenerate() {
		isGenerating = true;
		try {
			await generateXRead();
			showConfirm = false;
			justGenerated = true;
			setTimeout(() => (justGenerated = false), 2500);
		} finally {
			isGenerating = false;
		}
	}

	function handleCancelConfirm() {
		showConfirm = false;
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
	}

	// P1-22 / P2-01: Location display name map
	const LOCATION_NAMES: Record<string, string> = {
		tag: 'Alta Citta (Tagbilaran)',
		pgl: 'Alona Beach (Panglao)',
		'wh-tag': 'Tagbilaran Warehouse',
		all: 'All Locations',
	};
	function getLocationName(id: string): string {
		return LOCATION_NAMES[id] ?? id;
	}
</script>

<!-- P2-01: Branch name in print output -->
<div class="hidden print:block mb-4 text-center">
	<p class="text-xs font-bold uppercase tracking-widest text-gray-500">WTF! Samgyupsal</p>
	<p class="text-sm font-semibold text-gray-900">{getLocationName(session.locationId)}</p>
	<p class="text-xs text-gray-500">X-Reading Report · {summary.date}</p>
</div>

<!-- P2-11: BIR X-Reading badge — always visible on-screen -->
<div class="mb-2 print:hidden">
	<span class="inline-flex items-center gap-1.5 rounded-md bg-accent-light border border-accent/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-accent">
		BIR X-Reading
	</span>
</div>

<div class="mb-4 flex items-center justify-between print:hidden">
	<div class="flex items-center gap-2">
		<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">{summary.date}</h2>
		<!-- P1-14 (XREAD-02): Styled pulsing green badge pill -->
		<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-status-green text-white text-xs font-medium">
			<span class="w-2 h-2 rounded-full bg-white animate-pulse"></span>
			Live — shift still open
		</span>
	</div>
	<div class="flex flex-col items-end gap-1">
		<div class="flex items-center gap-2">
			<button
				onclick={() => window.print()}
				class="btn-secondary gap-2 text-sm"
				style="min-height: 40px"
				title="Print / Export X-Read"
			>
				Print
			</button>

			<!-- P0-06: Disabled when locationId === 'all'; P2-12: min 48px height -->
			<div class="flex flex-col items-end gap-1">
				<button
					onclick={handleGenerateClick}
					disabled={session.locationId === 'all'}
					title={session.locationId === 'all'
						? 'Select a specific branch first to generate X-Read.'
						: 'Generate X-Read snapshot'}
					class="btn-primary gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
					style="min-height: 48px"
				>
					{justGenerated ? 'Generated!' : 'Generate X-Read'}
				</button>
				<!-- P1-13 (XREAD-01): At-rest BIR warning always visible -->
				<p class="text-xs text-gray-500 mt-1">Creates a permanent BIR record — cannot be undone.</p>
			</div>
			{#if session.locationId === 'all'}
				<p class="text-xs text-gray-400 self-center">Select a specific branch first to generate X-Read.</p>
			{/if}
		</div>
	</div>
</div>

<!-- P1-9: Centered modal overlay for X-Read confirmation -->
{#if showConfirm}
	<div class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[400px] flex flex-col gap-5">
			<div class="flex flex-col gap-1">
				<h3 class="text-lg font-bold text-gray-900">Generate X-Read?</h3>
				<p class="text-sm text-gray-500">
					This will permanently lock all sales data for <strong class="text-gray-900">{locationName}</strong> as a BIR X-Reading record. This action cannot be undone.
				</p>
			</div>
			<div class="flex gap-2">
				<button
					onclick={handleCancelConfirm}
					disabled={isGenerating}
					class="btn-ghost flex-1 min-h-[44px]"
				>Cancel</button>
				<button
					onclick={handleConfirmGenerate}
					disabled={isGenerating}
					class={cn(
						'btn-danger flex-1 min-h-[44px] flex items-center justify-center gap-2',
						isGenerating && 'opacity-60 cursor-not-allowed'
					)}
				>
					{#if isGenerating}
						<Loader2 class="w-4 h-4 animate-spin" /> Generating…
					{:else}
						Confirm &amp; Generate
					{/if}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- P2-10: Manager PIN gate for X-Read generation -->
<ManagerPinModal
	isOpen={pinModalOpen}
	title="Authorize X-Read Generation"
	description="Enter Manager PIN to generate the BIR X-Read. This action cannot be undone."
	onClose={handlePinCancel}
	onConfirm={handlePinConfirmed}
/>

<!-- Live Stats Grid -->
<div class="grid grid-cols-4 gap-4 mb-6">
	<div class="rounded-xl border-2 border-accent/30 bg-accent-light p-4 text-center">
		<p class="text-xs font-bold uppercase tracking-wide text-accent">Gross Sales</p>
		<p class="mt-1 font-mono text-3xl font-bold text-accent">{formatPeso(summary.grossSales)}</p>
	</div>
	<div class="rounded-xl border border-status-green/20 bg-status-green-light p-4 text-center">
		<p class="text-xs font-medium text-gray-400">Net Sales</p>
		<p class="mt-1 font-mono text-2xl font-bold text-status-green">{formatPeso(summary.netSales)}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4 text-center">
		<p class="text-xs font-medium text-gray-400">Total Pax</p>
		<p class="mt-1 font-mono text-xl font-bold text-gray-900">{summary.totalPax}</p>
	</div>
	<div class="rounded-xl border border-border bg-white p-4 text-center">
		<p class="text-xs font-medium text-gray-400">Avg Ticket</p>
		<p class="mt-1 font-mono text-xl font-bold text-gray-900">{formatPeso(summary.avgTicket)}</p>
	</div>
</div>

<div class="grid grid-cols-[1fr_380px] gap-6">
	<!-- Left: Payment breakdown + order stats -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<h3 class="mb-4 font-bold text-gray-900">Payment Breakdown (Live)</h3>
			<!-- P1-17: All four payment methods including Maya -->
			<div class="flex gap-4 mb-4">
				{#each [
					{ label: 'Cash', amount: eod.cash },
					{ label: 'GCash', amount: eod.gcash },
					{ label: 'Maya', amount: eod.maya },
					{ label: 'Credit/Debit', amount: eod.card },
				] as p}
					<div class="flex-1 rounded-lg border border-border bg-gray-50 p-4 text-center">
						<p class="text-xs font-medium text-gray-400">{p.label}</p>
						<p class="mt-0.5 font-mono text-lg font-bold text-gray-900">{formatPeso(p.amount)}</p>
					</div>
				{/each}
			</div>

			<!-- P2-14 (XREAD-04): BIR-standard VAT terminology -->
			<div class="rounded-lg border border-border bg-gray-50 p-4 flex flex-col gap-2">
				<h4 class="text-xs font-bold uppercase tracking-wider text-gray-500 mb-1">VAT Breakdown (12% inclusive)</h4>
				<div class="flex justify-between text-sm">
					<span class="text-gray-600">VATable Sales</span>
					<span class="font-mono font-semibold text-gray-900">{formatPeso(summary.grossSales)}</span>
				</div>
				<div class="flex justify-between text-sm">
					<span class="text-gray-600">Output VAT (12%)</span>
					<span class="font-mono font-semibold text-accent">{formatPeso(vatAmount)}</span>
				</div>
				<div class="flex justify-between text-sm border-t border-border pt-2 mt-1">
					<span class="font-semibold text-gray-700">VAT-Exclusive Sales</span>
					<span class="font-mono font-bold text-gray-900">{formatPeso(vatExclusive)}</span>
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-border bg-white p-5">
			<h3 class="mb-4 font-bold text-gray-900">Order Status</h3>
			<div class="grid grid-cols-3 gap-4">
				<div class="rounded-lg bg-blue-50 border border-blue-100 p-3 text-center">
					<p class="text-xs font-medium text-blue-500">Open</p>
					<p class="font-mono text-2xl font-bold text-blue-700">{openOrders}</p>
				</div>
				<div class="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-center">
					<p class="text-xs font-medium text-emerald-500">Paid</p>
					<p class="font-mono text-2xl font-bold text-emerald-700">{paidOrders}</p>
				</div>
				<div class="rounded-lg bg-red-50 border border-red-100 p-3 text-center">
					<p class="text-xs font-medium text-red-500">Voided</p>
					<p class="font-mono text-2xl font-bold text-red-700">{voidedOrders}</p>
					<!-- P0-6: Show voided amount for BIR cancelled transaction requirement -->
					{#if voidedAmount > 0}
						<p class="font-mono text-xs text-red-400 mt-0.5">{formatPeso(voidedAmount)}</p>
					{/if}
				</div>
			</div>
		</div>
	</div>

	<!-- Right: X-Read History -->
	<div class="flex flex-col gap-4">
		<div class="rounded-xl border border-border bg-white p-5">
			<h3 class="mb-3 font-bold text-gray-900">X-Read History</h3>
			{#if xReadHistory.value.length === 0}
				<div class="text-center py-6">
					<p class="text-sm text-gray-400">No X-Reads generated yet this shift.</p>
					<p class="text-xs text-gray-300 mt-1">Click "Generate X-Read" to snapshot current totals.</p>
				</div>
			{:else}
				<div class="flex flex-col gap-3 max-h-[400px] overflow-y-auto">
					{#each xReadHistory.value as xr, idx (xr.id)}
						<div class="rounded-lg border border-border bg-gray-50 p-3">
							<div class="flex items-center justify-between mb-2">
								<div class="flex flex-col gap-0.5">
									<span class="text-xs font-bold text-gray-700">X-Read #{xReadHistory.value.length - idx}</span>
									<!-- P1-22: Branch label on each history entry -->
									{#if xr.locationId}
										<span class="text-[10px] font-semibold text-accent">{getLocationName(xr.locationId)}</span>
									{/if}
								</div>
								<!-- P2-15 (XREAD-05): timestamp field is full ISO string — formatTime handles correctly -->
								<span class="text-xs text-gray-400">
									{formatTime(xr.timestamp ?? '')} · {xr.generatedBy || 'Manager'}
								</span>
							</div>
							<div class="grid grid-cols-2 gap-1.5 text-xs">
								<div class="flex justify-between">
									<span class="text-gray-500">Gross</span>
									<span class="font-mono font-semibold">{formatPeso(xr.grossSales)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Net</span>
									<span class="font-mono font-semibold text-status-green">{formatPeso(xr.netSales)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Cash</span>
									<span class="font-mono">{formatPeso(xr.cash)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">GCash</span>
									<span class="font-mono">{formatPeso(xr.gcash)}</span>
								</div>
								<!-- P2-8: Maya and Card payment methods on history cards -->
								<div class="flex justify-between">
									<span class="text-gray-500">Maya</span>
									<span class="font-mono">{formatPeso(xr.maya ?? 0)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Card</span>
									<span class="font-mono">{formatPeso(xr.card ?? 0)}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Pax</span>
									<span class="font-mono">{xr.totalPax}</span>
								</div>
								<div class="flex justify-between">
									<span class="text-gray-500">Voids</span>
									<span class="font-mono {(xr.voidCount ?? 0) > 0 ? 'text-status-red font-semibold' : ''}">{xr.voidCount ?? 0}</span>
								</div>
								<!-- P0-6: Show voidAmount in history entries -->
								{#if (xr.voidAmount ?? 0) > 0}
									<div class="col-span-2 flex justify-between border-t border-border pt-1 mt-0.5">
										<span class="text-gray-500">Voided Amount</span>
										<span class="font-mono text-status-red font-semibold">{formatPeso(xr.voidAmount ?? 0)}</span>
									</div>
								{/if}
							</div>
						</div>
					{/each}
				</div>
			{/if}
		</div>

		<!-- P2-9: Prominent warning note with badge-yellow styling -->
		<div class="inline-flex items-center gap-2 px-3 py-2 bg-yellow-50 border border-status-yellow rounded-lg text-sm text-yellow-800">
			⚠ X-Reads do NOT close the shift. Use End of Day to finalize.
		</div>
	</div>
</div>
