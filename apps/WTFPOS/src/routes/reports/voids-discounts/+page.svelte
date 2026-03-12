<script lang="ts">
	import { formatPeso, cn } from '$lib/utils';
	import { voidsAndDiscountsSummary } from '$lib/stores/reports.svelte';
	import { orders as allOrders, tables as allTables } from '$lib/stores/pos.svelte';
	import { session } from '$lib/stores/session.svelte';
	import { LOCATION_SHORT_NAMES } from '$lib/stores/session.svelte';
	import ReportFilterBar from '$lib/components/reports/ReportFilterBar.svelte';
	import KpiCard from '$lib/components/reports/KpiCard.svelte';
	import ReportBarChart from '$lib/components/reports/ReportBarChart.svelte';
	import ReportShell from '$lib/components/reports/ReportShell.svelte';
	import type { ChartDataPoint } from '$lib/components/reports/ReportBarChart.svelte';
	import type { OrderItem } from '$lib/types';

	type VoidPeriod = 'today' | 'week' | 'all';
	let period = $state<VoidPeriod>('today');

	const summary = $derived(voidsAndDiscountsSummary(period));
	const isAllLocations = $derived(session.locationId === 'all');

	const headingLabel = $derived(
		period === 'today' ? "Today's Voids & Discounts" :
		period === 'week'  ? "This Week's Voids & Discounts" :
		                     "All Voids & Discounts"
	);

	// [06] Resolve table IDs to human-readable labels
	function tableLabel(order: { tableId?: string | null; orderType?: string; locationId?: string }): string {
		if (!order.tableId || order.orderType === 'takeout') return 'Takeout';
		const table = allTables.value.find(t => t.id === order.tableId);
		return table?.label ?? order.tableId;
	}

	// [12] Branch label for All Locations view
	function branchLabel(locationId: string): string {
		return LOCATION_SHORT_NAMES[locationId] ?? locationId;
	}

	function reasonLabel(cancelReason: string | undefined | null): string {
		if (!cancelReason) return 'Mistake';
		const map: Record<string, string> = {
			mistake: 'Mistake',
			walkout: 'Walkout',
			write_off: 'Write-off',
		};
		return map[cancelReason] ?? cancelReason;
	}

	function formatTime(iso: string) {
		return new Date(iso).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
	}

	function formatDate(iso: string) {
		return new Date(iso).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' });
	}

	// [03] Chart responds to period filter
	const trendChart = $derived.by((): ChartDataPoint[] => {
		const byDay: Record<string, { voids: number; discounts: number }> = {};
		const now = new Date();

		// Determine how many days to show based on period
		const days = period === 'today' ? 1 : period === 'week' ? 7 : 14;

		for (let i = days - 1; i >= 0; i--) {
			const d = new Date(now);
			d.setDate(now.getDate() - i);
			byDay[d.toISOString().slice(0, 10)] = { voids: 0, discounts: 0 };
		}
		const todayKey = now.toISOString().slice(0, 10);
		for (const o of allOrders.value) {
			if (session.locationId !== 'all' && o.locationId !== session.locationId) continue;
			const key = o.createdAt.slice(0, 10);
			if (!(key in byDay)) continue;
			if (o.status === 'cancelled') byDay[key].voids++;
			else if (o.status === 'paid' && (o.discountType !== 'none' || Object.keys(o.discountEntries ?? {}).length > 0)) {
				byDay[key].discounts++;
			}
		}

		// For "today", use hourly buckets instead
		if (period === 'today') {
			const hourly: Record<string, { voids: number; discounts: number }> = {};
			for (let h = 8; h <= 22; h++) {
				hourly[String(h)] = { voids: 0, discounts: 0 };
			}
			for (const o of allOrders.value) {
				if (session.locationId !== 'all' && o.locationId !== session.locationId) continue;
				if (o.createdAt.slice(0, 10) !== todayKey) continue;
				const hour = new Date(o.createdAt).getHours();
				const key = String(hour);
				if (!(key in hourly)) continue;
				if (o.status === 'cancelled') hourly[key].voids++;
				else if (o.status === 'paid' && (o.discountType !== 'none' || Object.keys(o.discountEntries ?? {}).length > 0)) {
					hourly[key].discounts++;
				}
			}
			const nowHour = now.getHours();
			return Object.entries(hourly)
				.map(([h, d]) => ({
					label: `${Number(h) > 12 ? Number(h) - 12 : Number(h)}${Number(h) >= 12 ? 'PM' : 'AM'}`,
					primary: d.voids,
					secondary: d.discounts,
					highlight: Number(h) === nowHour,
				}));
		}

		return Object.entries(byDay)
			.sort((a, b) => a[0].localeCompare(b[0]))
			.map(([key, d]) => ({
				label: new Date(key + 'T12:00:00Z').toLocaleDateString('en-PH', { month: 'short', day: 'numeric' }),
				primary: d.voids,
				secondary: d.discounts,
				highlight: key === todayKey,
			}));
	});

	// [03] Chart title responds to period
	const chartTitle = $derived(
		period === 'today' ? 'Hourly Trend (Today)' :
		period === 'week' ? '7-Day Trend' :
		'14-Day Trend'
	);

	function itemsSummary(order: { items?: Pick<OrderItem, 'menuItemName' | 'quantity'>[] }): string {
		if (!order.items || order.items.length === 0) return '—';
		return order.items
			.map(i => `${i.quantity ?? 1}x ${i.menuItemName ?? 'Item'}`)
			.join(', ');
	}

	type DiscountOrder = (typeof summary.discounts.items)[number];

	function discountTypeLabel(order: DiscountOrder): string {
		if (order.discountEntries && Object.keys(order.discountEntries).length > 0) {
			return Object.keys(order.discountEntries)
				.map(t =>
					t === 'senior' ? 'Senior (20%)' :
					t === 'pwd' ? 'PWD (20%)' :
					t === 'promo' ? 'Promo' :
					t === 'comp' ? 'Comp' : 'Service Recovery'
				)
				.join(' + ');
		}
		const t = order.discountType;
		return t === 'senior' ? 'Senior (20%)' :
			t === 'pwd' ? 'PWD (20%)' :
			t === 'promo' ? 'Promo' :
			t === 'comp' ? 'Comp' :
			t === 'service_recovery' ? 'Service Recovery' : t;
	}

	// [11] Only show pax for SC/PWD — not for promo/comp/service_recovery
	const PAX_DISCOUNT_TYPES = ['senior', 'pwd'];

	function isPaxRelevant(order: DiscountOrder): boolean {
		if (order.discountEntries && Object.keys(order.discountEntries).length > 0) {
			return Object.keys(order.discountEntries).some(k => PAX_DISCOUNT_TYPES.includes(k));
		}
		return PAX_DISCOUNT_TYPES.includes(order.discountType ?? '');
	}

	function discountPaxLabel(order: DiscountOrder): string {
		if (!isPaxRelevant(order)) return '—';
		if (order.discountEntries && Object.keys(order.discountEntries).length > 0) {
			const totalQualifying = Object.entries(order.discountEntries)
				.filter(([k]) => PAX_DISCOUNT_TYPES.includes(k))
				.reduce((s, [, e]) => s + (e?.pax ?? 0), 0);
			return `${totalQualifying} of ${order.pax} pax`;
		}
		const qp = order.discountPax ?? order.pax ?? 1;
		return `${qp} of ${order.pax} pax`;
	}

	function discountIdsList(order: DiscountOrder): string {
		if (order.discountEntries && Object.keys(order.discountEntries).length > 0) {
			const ids: string[] = [];
			for (const entry of Object.values(order.discountEntries)) {
				if (entry?.ids) ids.push(...entry.ids.filter(Boolean));
			}
			return ids.length > 0 ? ids.join(', ') : '—';
		}
		const ids = order.discountIds?.filter(Boolean) ?? [];
		return ids.length > 0 ? ids.join(', ') : '—';
	}
</script>

<ReportShell>
	{#snippet filter()}
		<ReportFilterBar
			period={period as 'today' | 'week' | 'all'}
			onPeriodChange={(p) => (period = p as VoidPeriod)}
			showLive={false}
			options={[
				{ value: 'today', label: 'Today' },
				{ value: 'week',  label: 'This Week' },
				{ value: 'all',   label: 'All Time' },
			]}
		/>
	{/snippet}

	<!-- [01] Replace redundant KPIs with rate + comparison context [02] -->
	{#snippet kpis()}
		<div class="grid grid-cols-4 gap-4 flex-1">
			<KpiCard
				label="Voided Orders"
				value={String(summary.voids.count)}
				variant="danger"
				sub={summary.voids.count > 0 ? formatPeso(summary.voids.value) + ' lost' : undefined}
				change={summary.context.voidRateChange}
				changeLabel={summary.context.prevLabel}
				prevValue={summary.context.prevVoidCount > 0 ? String(summary.context.prevVoidCount) + ' orders' : null}
			/>
			<KpiCard
				label="Discounted Orders"
				value={String(summary.discounts.count)}
				variant="accent"
				sub={summary.discounts.count > 0 ? formatPeso(summary.discounts.value) + ' given' : undefined}
				change={summary.context.discountRateChange}
				changeLabel={summary.context.prevLabel}
				prevValue={summary.context.prevDiscountValue > 0 ? formatPeso(summary.context.prevDiscountValue) : null}
			/>
			<KpiCard
				label="Void Rate"
				value={summary.context.voidRate + '% of orders'}
			/>
			<KpiCard
				label="Discount Rate"
				value={summary.context.discountRate + '% of gross'}
			/>
		</div>
	{/snippet}

	<!-- [03] Chart title follows period, [04] distinct colors -->
	{#snippet chart()}
		<div class="flex-1 flex flex-col rounded-xl border border-border bg-white p-4">
			<div class="mb-3 flex items-center gap-4">
				<p class="text-xs font-bold uppercase tracking-wide text-gray-400">{chartTitle}</p>
				<div class="flex items-center gap-3 text-[10px]">
					<span class="flex items-center gap-1"><span class="inline-block h-2 w-4 rounded-sm bg-status-red/75"></span> Voids</span>
					<span class="flex items-center gap-1"><span class="inline-block h-2 w-4 rounded-sm" style="background: #06B6D4; opacity: 0.65"></span> Discounts</span>
				</div>
			</div>
			<div class="relative">
				<ReportBarChart
					data={trendChart}
					yUnit=""
					height={200}
					showSecondary={true}
					primaryColor="#EF4444"
					secondaryColor="#06B6D4"
					formatValue={(v) => String(v) + ' orders'}
				/>
			</div>
		</div>
	{/snippet}

	{#snippet content()}
		<!-- [08] Replace misleading "Live totals" with accurate label -->
		<div class="mb-2 flex items-center gap-2">
			<h2 class="text-sm font-bold uppercase tracking-wide text-gray-500">{headingLabel}</h2>
			<span class="flex items-center gap-1.5 text-xs text-gray-400">
				<span class="inline-block h-1.5 w-1.5 rounded-full bg-gray-300"></span>
				Local data
			</span>
		</div>

		<div class="grid grid-cols-2 gap-6">
			<!-- Voids Section -->
			<div class="flex flex-col gap-4">
				<div class="rounded-xl border border-border bg-white p-5">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="font-bold text-gray-900">Voided Orders</h2>
						<span class="rounded-lg bg-status-red/10 px-2.5 py-1 text-xs font-bold text-status-red">
							{summary.voids.count} Orders
						</span>
					</div>

					<div class="mb-6 flex items-baseline gap-2">
						<span class="text-3xl font-extrabold text-status-red font-mono">{formatPeso(summary.voids.value)}</span>
						<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Lost</span>
					</div>

					<h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Reason Breakdown</h3>
					<div class="flex flex-col gap-2">
						<div class="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
							<span class="text-sm font-semibold text-gray-700">Mistakes</span>
							<span class="font-mono text-sm font-bold">{summary.voids.mistake}</span>
						</div>
						{#if summary.voids.walkout > 0}
							<div class="flex items-center justify-between rounded-lg border border-status-red/30 bg-status-red/5 px-4 py-3">
								<span class="text-sm font-semibold text-status-red">Walkouts</span>
								<span class="font-mono text-sm font-bold text-status-red">{summary.voids.walkout}</span>
							</div>
						{/if}
						{#if summary.voids.writeOff > 0}
							<div class="flex items-center justify-between rounded-lg border border-status-yellow/30 bg-status-yellow/5 px-4 py-3">
								<span class="text-sm font-semibold text-status-yellow">Write-offs (Spoilage, etc)</span>
								<span class="font-mono text-sm font-bold text-status-yellow">{summary.voids.writeOff}</span>
							</div>
						{/if}
					</div>
				</div>

				<!-- [10] Detail table sorted by value (store handles sort), [06] human labels, [12] branch column -->
				{#if summary.voids.items.length > 0}
					<div class="rounded-xl border border-border bg-white overflow-hidden">
						<div class="px-5 py-3 border-b border-border">
							<h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">Void Detail</h3>
						</div>
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border bg-gray-50">
									{#if isAllLocations}
										<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Branch</th>
									{/if}
									<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date / Table</th>
									<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Items</th>
									<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cashier</th>
									<th scope="col" class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Amount</th>
									<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Reason</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each summary.voids.items as order (order.id)}
									<tr class="hover:bg-gray-50">
										{#if isAllLocations}
											<td class="px-4 py-2.5 text-xs text-gray-500">
												<span class="rounded-full bg-gray-100 px-2 py-0.5 font-medium">{branchLabel(order.locationId)}</span>
											</td>
										{/if}
										<td class="px-4 py-2.5 text-gray-700 font-medium">
											<div class="flex flex-col gap-0.5">
												<span>{tableLabel(order)}</span>
												{#if order.createdAt}
													<span class="text-[10px] text-gray-400 font-mono">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</span>
												{/if}
											</div>
										</td>
										<td class="px-4 py-2.5 text-xs text-gray-500 max-w-[140px]">
											<span class="line-clamp-2">{itemsSummary(order)}</span>
										</td>
										<td class="px-4 py-2.5 text-xs text-gray-600">
											{#if order.closedBy}
												{order.closedBy}
											{:else}
												<span class="text-gray-400">—</span>
											{/if}
										</td>
										<td class="px-4 py-2.5 text-right font-mono text-status-red">
											{formatPeso(order.subtotal)}
										</td>
										<td class="px-4 py-2.5">
											{#if order.cancelReason}
												<span class={cn(
													'rounded-full px-2.5 py-0.5 text-xs font-medium',
													order.cancelReason === 'walkout' ? 'bg-status-red/10 text-status-red' :
													order.cancelReason === 'write_off' ? 'bg-status-yellow/10 text-status-yellow' :
													'bg-gray-100 text-gray-600'
												)}>
													{reasonLabel(order.cancelReason)}
												</span>
											{:else}
												<span class="text-gray-400">—</span>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>

			<!-- Discounts Section -->
			<div class="flex flex-col gap-4">
				<div class="rounded-xl border border-border bg-white p-5">
					<div class="mb-4 flex items-center justify-between">
						<h2 class="font-bold text-gray-900">Discounts Applied</h2>
						<span class="rounded-lg bg-accent/10 px-2.5 py-1 text-xs font-bold text-accent">
							{summary.discounts.count} Orders
						</span>
					</div>

					<div class="mb-6 flex items-baseline gap-2">
						<span class="text-3xl font-extrabold text-accent font-mono">{formatPeso(summary.discounts.value)}</span>
						<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Total Given</span>
					</div>

					<!-- [05] Zero-amount types already filtered in store -->
					{#if summary.discounts.breakdown.length > 0}
						<h3 class="mb-2 text-xs font-bold uppercase tracking-wider text-gray-500">Type Breakdown</h3>
						<div class="flex flex-col gap-2">
							{#each summary.discounts.breakdown as row}
								<div class="flex items-center justify-between rounded-lg border border-border bg-surface px-4 py-3">
									<span class="text-sm font-semibold text-gray-700">{row.label}</span>
									<span class="font-mono text-sm font-bold text-gray-900">
										{formatPeso(row.amount)}
									</span>
								</div>
							{/each}
						</div>
					{/if}
				</div>

				<!-- [11] Pax only for SC/PWD, [06] human labels, [12] branch column -->
				{#if summary.discounts.items.length > 0}
					<div class="rounded-xl border border-border bg-white overflow-hidden">
						<div class="px-5 py-3 border-b border-border">
							<h3 class="text-xs font-bold uppercase tracking-wider text-gray-500">Discount Detail</h3>
						</div>
						<table class="w-full text-sm">
							<thead>
								<tr class="border-b border-border bg-gray-50">
									{#if isAllLocations}
										<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Branch</th>
									{/if}
									<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Date / Table</th>
									<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Discount Type</th>
									<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Qualifying Pax</th>
									<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">ID Numbers</th>
									<th scope="col" class="px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-gray-400">Cashier</th>
									<th scope="col" class="px-4 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-gray-400">Amount</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-border">
								{#each summary.discounts.items as order (order.id)}
									<tr class="hover:bg-gray-50">
										{#if isAllLocations}
											<td class="px-4 py-2.5 text-xs text-gray-500">
												<span class="rounded-full bg-gray-100 px-2 py-0.5 font-medium">{branchLabel(order.locationId)}</span>
											</td>
										{/if}
										<td class="px-4 py-2.5 text-gray-700 font-medium">
											<div class="flex flex-col gap-0.5">
												<span>{tableLabel(order)}</span>
												{#if order.createdAt}
													<span class="text-[10px] text-gray-400 font-mono">{formatDate(order.createdAt)} {formatTime(order.createdAt)}</span>
												{/if}
											</div>
										</td>
										<td class="px-4 py-2.5">
											<span class="rounded-full bg-accent/10 px-2.5 py-0.5 text-xs font-semibold text-accent">
												{discountTypeLabel(order)}
											</span>
										</td>
										<td class="px-4 py-2.5 text-xs text-gray-600">
											{discountPaxLabel(order)}
										</td>
										<td class="px-4 py-2.5 text-xs text-gray-500 max-w-[140px]">
											<span class="line-clamp-2 font-mono">{discountIdsList(order)}</span>
										</td>
										<td class="px-4 py-2.5 text-xs text-gray-600">
											{#if order.closedBy}
												{order.closedBy}
											{:else}
												<span class="text-gray-400">—</span>
											{/if}
										</td>
										<td class="px-4 py-2.5 text-right font-mono text-status-red">
											{formatPeso(order.discountAmount)}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				{/if}
			</div>
		</div>
	{/snippet}
</ReportShell>
