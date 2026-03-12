<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { transactionLog } from '$lib/stores/reports.svelte';
	import { tables as allTables } from '$lib/stores/pos.svelte';
	import { session, LOCATION_SHORT_NAMES } from '$lib/stores/session.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportBarChart from '$lib/components/reports/ReportBarChart.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';
	import ReceiptModal from '$lib/components/pos/ReceiptModal.svelte';
	import type { ChartDataPoint } from '$lib/components/reports/ReportBarChart.svelte';
	import type { Order } from '$lib/types';
	import { Receipt, Filter } from 'lucide-svelte';

	type TxPeriod = 'today' | 'week' | 'month' | 'all';
	let period = $state<TxPeriod>('today');
	let methodFilter = $state<string>('all');
	let statusFilter = $state<string>('all');
	let searchQuery = $state('');

	const data = $derived(transactionLog(period));
	const isAllLocations = $derived(session.locationId === 'all');

	// Filtering
	const filteredOrders = $derived.by(() => {
		let orders = data.orders;
		if (methodFilter !== 'all') {
			orders = orders.filter(o =>
				o.payments.some(p => p.method === methodFilter)
			);
		}
		if (statusFilter !== 'all') {
			orders = orders.filter(o => o.status === statusFilter);
		}
		if (searchQuery.trim()) {
			const q = searchQuery.trim().toLowerCase();
			orders = orders.filter(o =>
				(o.tableId ?? '').toLowerCase().includes(q) ||
				(o.customerName ?? '').toLowerCase().includes(q) ||
				(o.closedBy ?? '').toLowerCase().includes(q) ||
				o.id.toLowerCase().includes(q) ||
				tableLabel(o).toLowerCase().includes(q)
			);
		}
		return orders;
	});

	// Receipt modal state
	let receiptOpen = $state(false);
	let receiptOrder = $state<Order | null>(null);

	function openReceipt(order: Order) {
		receiptOrder = order;
		receiptOpen = true;
	}

	function closeReceipt() {
		receiptOpen = false;
		receiptOrder = null;
	}

	// Derive change + method for receipt
	const receiptChange = $derived.by(() => {
		if (!receiptOrder) return 0;
		const totalPaid = receiptOrder.payments.reduce((s, p) => s + p.amount, 0);
		return Math.max(0, totalPaid - receiptOrder.total);
	});
	const receiptMethod = $derived(
		receiptOrder?.payments[0]?.method ?? 'cash'
	);

	// Table label resolution
	function tableLabel(order: { tableId?: string | null; orderType?: string }): string {
		if (!order.tableId || order.orderType === 'takeout') return 'Takeout';
		const table = allTables.value.find(t => t.id === order.tableId);
		return table?.label ?? order.tableId;
	}

	function branchLabel(locationId: string): string {
		return LOCATION_SHORT_NAMES[locationId] ?? locationId;
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
	}
	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
	}

	function paymentMethodLabel(method: string): string {
		const map: Record<string, string> = {
			cash: 'Cash', gcash: 'GCash', maya: 'Maya', card: 'Card',
		};
		return map[method] ?? method;
	}

	function paymentMethodBadgeClass(method: string): string {
		const map: Record<string, string> = {
			cash: 'bg-status-green/10 text-status-green',
			gcash: 'bg-blue-50 text-blue-600',
			maya: 'bg-emerald-50 text-emerald-600',
			card: 'bg-purple-50 text-purple-600',
		};
		return map[method] ?? 'bg-gray-100 text-gray-600';
	}

	function orderPaymentSummary(order: Order): string {
		if (order.payments.length === 0) return '—';
		if (order.payments.length === 1) return paymentMethodLabel(order.payments[0].method);
		return order.payments.map(p => paymentMethodLabel(p.method)).join(' + ');
	}

	// Hourly chart for today, daily chart for week/month
	const trendChart = $derived.by((): ChartDataPoint[] => {
		if (period === 'today') {
			const hourly: Record<string, number> = {};
			for (let h = 8; h <= 22; h++) hourly[String(h)] = 0;
			for (const o of data.orders.filter(o => o.status === 'paid')) {
				const hour = new Date(o.closedAt ?? o.createdAt).getHours();
				if (String(hour) in hourly) hourly[String(hour)]++;
			}
			const nowHour = new Date().getHours();
			return Object.entries(hourly).map(([h, count]) => ({
				label: `${Number(h) > 12 ? Number(h) - 12 : Number(h)}${Number(h) >= 12 ? 'PM' : 'AM'}`,
				primary: count,
				highlight: Number(h) === nowHour,
			}));
		}

		// Daily for week/month/all
		const byDay: Record<string, number> = {};
		const now = new Date();
		const days = period === 'week' ? 7 : period === 'month' ? 30 : 14;
		for (let i = days - 1; i >= 0; i--) {
			const d = new Date(now);
			d.setDate(now.getDate() - i);
			byDay[d.toISOString().slice(0, 10)] = 0;
		}
		for (const o of data.orders.filter(o => o.status === 'paid')) {
			const key = (o.closedAt ?? o.createdAt).slice(0, 10);
			if (key in byDay) byDay[key]++;
		}
		const todayKey = now.toISOString().slice(0, 10);
		return Object.entries(byDay)
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([key, count]) => ({
				label: new Date(key + 'T12:00:00Z').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
				primary: count,
				highlight: key === todayKey,
			}));
	});

	const chartTitle = $derived(
		period === 'today' ? 'Checkouts by Hour' :
		period === 'week' ? 'Checkouts by Day (7d)' :
		period === 'month' ? 'Checkouts by Day (30d)' :
		'Checkouts by Day (14d)'
	);

	// Unique payment methods for filter dropdown
	const availableMethods = $derived.by(() => {
		const methods = new Set<string>();
		for (const o of data.orders) {
			for (const p of o.payments) methods.add(p.method);
		}
		return Array.from(methods).sort();
	});
</script>

<ReportShell>
	{#snippet filter()}
		<ReportFilterBar
			period={period}
			onPeriodChange={(p) => (period = p as TxPeriod)}
			showLive={false}
			options={[
				{ value: 'today', label: 'Today' },
				{ value: 'week',  label: 'This Week' },
				{ value: 'month', label: 'This Month' },
				{ value: 'all',   label: 'All Time' },
			]}
		>
			{#snippet actions()}
				<!-- Inline filters -->
				<select
					class="rounded-md border border-border bg-white px-2 py-1.5 text-xs text-gray-600"
					bind:value={methodFilter}
				>
					<option value="all">All Methods</option>
					{#each availableMethods as m}
						<option value={m}>{paymentMethodLabel(m)}</option>
					{/each}
				</select>
				<select
					class="rounded-md border border-border bg-white px-2 py-1.5 text-xs text-gray-600"
					bind:value={statusFilter}
				>
					<option value="all">All Status</option>
					<option value="paid">Paid</option>
					<option value="cancelled">Voided</option>
				</select>
			{/snippet}
		</ReportFilterBar>
	{/snippet}

	{#snippet kpis()}
		<div class="grid grid-cols-4 gap-4 flex-1">
			<KpiCard
				label="Transactions"
				value={String(data.paidCount)}
				variant="success"
				sub={data.voidCount > 0 ? `+ ${data.voidCount} voided` : undefined}
				change={data.context.txCountChange}
				changeLabel={data.context.prevLabel}
				prevValue={data.context.prevTxCount > 0 ? String(data.context.prevTxCount) : null}
			/>
			<KpiCard
				label="Net Sales"
				value={formatPeso(data.netSales)}
				sub={data.totalDiscount > 0 ? formatPeso(data.totalDiscount) + ' discounted' : undefined}
			/>
			<KpiCard
				label="Avg Ticket"
				value={formatPeso(data.avgTicket)}
				change={data.context.avgTicketChange}
				changeLabel={data.context.prevLabel}
				prevValue={data.context.prevAvgTicket > 0 ? formatPeso(data.context.prevAvgTicket) : null}
			/>
			<KpiCard
				label="Total Pax"
				value={String(data.totalPax)}
			/>
		</div>
	{/snippet}

	{#snippet chart()}
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<div class="mb-3 flex items-center justify-between">
				<p class="text-xs font-bold uppercase tracking-wide text-gray-400">{chartTitle}</p>
				{#if data.paymentBreakdown.length > 0}
					<div class="flex items-center gap-3 text-[10px]">
						{#each data.paymentBreakdown as pb}
							<span class="flex items-center gap-1">
								<span class={cn('inline-block rounded-full px-1.5 py-0.5 font-semibold', paymentMethodBadgeClass(pb.method))}>
									{paymentMethodLabel(pb.method)}
								</span>
								<span class="text-gray-400">{formatPeso(pb.amount)}</span>
							</span>
						{/each}
					</div>
				{/if}
			</div>
			<div class="relative">
				<ReportBarChart
					data={trendChart}
					yUnit=""
					height={200}
					formatValue={(v) => String(v) + ' checkouts'}
				/>
			</div>
		</div>
	{/snippet}

	{#snippet content()}
		<div class="mb-3 flex items-center justify-between">
			<div class="flex items-center gap-2">
				<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">
					{filteredOrders.length} Transactions
				</h2>
				<span class="flex items-center gap-1.5 text-xs text-gray-400">
					<span class="inline-block h-1.5 w-1.5 rounded-full bg-gray-300"></span>
					Local data
				</span>
			</div>
			<div class="relative">
				<input
					type="text"
					placeholder="Search table, cashier, order ID..."
					class="w-64 rounded-lg border border-border bg-white px-3 py-1.5 text-xs text-gray-600 placeholder:text-gray-400 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent/30"
					bind:value={searchQuery}
				/>
			</div>
		</div>

		{#if filteredOrders.length === 0}
			<div class="flex h-40 items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 text-sm text-gray-400">
				No transactions for this period
			</div>
		{:else}
			<div class="rounded-xl border border-border bg-white overflow-hidden">
				<table class="w-full text-sm">
					<thead>
						<tr class="border-b border-border bg-gray-50">
							{#if isAllLocations}
								<th scope="col" class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Branch</th>
							{/if}
							<th scope="col" class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Time</th>
							<th scope="col" class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Table</th>
							<th scope="col" class="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Pax</th>
							<th scope="col" class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Items</th>
							<th scope="col" class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Payment</th>
							<th scope="col" class="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cashier</th>
							<th scope="col" class="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Subtotal</th>
							<th scope="col" class="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Discount</th>
							<th scope="col" class="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Total</th>
							<th scope="col" class="px-3 py-2.5 text-center text-xs font-semibold uppercase tracking-wide text-gray-400">Receipt</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each filteredOrders as order (order.id)}
							<tr class={cn('hover:bg-gray-50 transition-colors', order.status === 'cancelled' && 'bg-status-red/5')}>
								{#if isAllLocations}
									<td class="px-3 py-2.5 text-xs">
										<span class="rounded-full bg-gray-100 px-2 py-0.5 font-medium text-gray-600">{branchLabel(order.locationId)}</span>
									</td>
								{/if}
								<td class="px-3 py-2.5 text-xs text-gray-600">
									<div class="flex flex-col gap-0.5">
										<span class="font-mono">{formatTime(order.closedAt ?? order.createdAt)}</span>
										<span class="text-[10px] text-gray-400">{formatDate(order.closedAt ?? order.createdAt)}</span>
									</div>
								</td>
								<td class="px-3 py-2.5 text-xs font-medium text-gray-700">
									{tableLabel(order)}
								</td>
								<td class="px-3 py-2.5 text-center text-xs text-gray-600">
									{order.pax}
								</td>
								<td class="px-3 py-2.5 text-xs text-gray-500 max-w-[160px]">
									<span class="line-clamp-1">
										{order.items.filter(i => i.status !== 'cancelled').length} items
									</span>
								</td>
								<td class="px-3 py-2.5">
									{#if order.status === 'cancelled'}
										<span class="rounded-full bg-status-red/10 px-2 py-0.5 text-xs font-medium text-status-red">Voided</span>
									{:else}
										<span class={cn('rounded-full px-2 py-0.5 text-xs font-medium', paymentMethodBadgeClass(order.payments[0]?.method ?? 'cash'))}>
											{orderPaymentSummary(order)}
										</span>
									{/if}
								</td>
								<td class="px-3 py-2.5 text-xs text-gray-600">
									{order.closedBy ?? '—'}
								</td>
								<td class="px-3 py-2.5 text-right font-mono text-xs text-gray-700">
									{formatPeso(order.subtotal)}
								</td>
								<td class="px-3 py-2.5 text-right font-mono text-xs">
									{#if order.discountAmount > 0}
										<span class="text-accent">-{formatPeso(order.discountAmount)}</span>
									{:else}
										<span class="text-gray-300">—</span>
									{/if}
								</td>
								<td class="px-3 py-2.5 text-right font-mono text-xs font-bold text-gray-900">
									{formatPeso(order.total)}
								</td>
								<td class="px-3 py-2.5 text-center">
									{#if order.status === 'paid'}
										<button
											class="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[10px] font-medium text-gray-500 transition-colors hover:bg-accent-light hover:text-accent hover:border-accent/30"
											onclick={() => openReceipt(order)}
										>
											<Receipt class="h-3 w-3" />
											View
										</button>
									{:else}
										<span class="text-gray-300 text-[10px]">—</span>
									{/if}
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>

			<!-- Summary footer -->
			<div class="mt-3 flex items-center justify-between rounded-lg border border-border bg-white px-5 py-3">
				<span class="text-xs text-gray-400">
					Showing {filteredOrders.length} of {data.orders.length} transactions
				</span>
				<div class="flex items-center gap-4 text-xs font-mono">
					<span class="text-gray-500">Subtotal: {formatPeso(filteredOrders.filter(o => o.status === 'paid').reduce((s, o) => s + o.subtotal, 0))}</span>
					<span class="text-accent">Discounts: -{formatPeso(filteredOrders.filter(o => o.status === 'paid').reduce((s, o) => s + o.discountAmount, 0))}</span>
					<span class="font-bold text-gray-900">Net: {formatPeso(filteredOrders.filter(o => o.status === 'paid').reduce((s, o) => s + o.total, 0))}</span>
				</div>
			</div>
		{/if}
	{/snippet}
</ReportShell>

<!-- Receipt Modal -->
<ReceiptModal
	isOpen={receiptOpen}
	order={receiptOrder}
	change={receiptChange}
	method={receiptMethod}
	onClose={closeReceipt}
/>
