<script lang="ts">
	import type { MonthlyReportData } from '$lib/types/reports';
	import monthlyData from '$lib/data/monthly.json';

	const data = monthlyData as MonthlyReportData;
</script>

<svelte:head>
	<title>Monthly Report - DA Tirol Dorm</title>
</svelte:head>

<article class="report">
	<header class="report-header">
		<div class="header-icon">📅</div>
		<div class="header-info">
			<h1>Monthly Report</h1>
			<p class="period">{data.report_month}</p>
		</div>
	</header>

	<section class="summary-section">
		<h2>Profit & Loss Summary</h2>
		<div class="pnl-grid">
			<div class="pnl-card revenue">
				<span class="label">Gross Revenue</span>
				<span class="value">₱{data.summary.gross_revenue.toLocaleString()}</span>
			</div>
			<div class="pnl-card expense">
				<span class="label">Total Expenses</span>
				<span class="value">₱{data.summary.total_expenses.toLocaleString()}</span>
			</div>
			<div class="pnl-card net">
				<span class="label">Net Income</span>
				<span class="value">₱{data.summary.net_income.toLocaleString()}</span>
				<span class="margin">{data.summary.profit_margin}% margin</span>
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Revenue Breakdown</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Category</th>
						<th>Amount</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Rent Collected</td>
						<td class="positive">₱{data.revenue.rent_collected.toLocaleString()}</td>
					</tr>
					<tr>
						<td>Utility Billings</td>
						<td class="positive">₱{data.revenue.utility_collected.toLocaleString()}</td>
					</tr>
					<tr>
						<td>Penalties</td>
						<td class="positive">₱{data.revenue.penalties_collected.toLocaleString()}</td>
					</tr>
					<tr>
						<td>Other Income</td>
						<td class="positive">₱{data.revenue.other_collected.toLocaleString()}</td>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<td><strong>Total Revenue</strong></td>
						<td class="positive"><strong>₱{data.revenue.total_collected.toLocaleString()}</strong></td>
					</tr>
				</tfoot>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Expense Breakdown</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Category</th>
						<th>Amount</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Utilities</td>
						<td class="negative">₱{data.expenses.utilities.toLocaleString()}</td>
					</tr>
					<tr>
						<td>Maintenance</td>
						<td class="negative">₱{data.expenses.maintenance.toLocaleString()}</td>
					</tr>
					<tr>
						<td>Supplies</td>
						<td class="negative">₱{data.expenses.supplies.toLocaleString()}</td>
					</tr>
					<tr>
						<td>Other Expenses</td>
						<td class="negative">₱{data.expenses.other.toLocaleString()}</td>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<td><strong>Total Expenses</strong></td>
						<td class="negative"><strong>₱{data.expenses.total_expenses.toLocaleString()}</strong></td>
					</tr>
				</tfoot>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Occupancy</h2>
		<div class="occupancy-stats">
			<div class="occ-card">
				<span class="occ-value">{data.occupancy.occupancy_rate}%</span>
				<span class="occ-label">Occupancy Rate</span>
			</div>
			<div class="occ-detail">
				<p>{data.occupancy.occupied_units} of {data.occupancy.total_units} units occupied</p>
				<p>📥 {data.occupancy.move_ins} Move-ins | 📤 {data.occupancy.move_outs} Move-outs</p>
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Year-to-Date</h2>
		<div class="ytd-grid">
			<div class="ytd-card">
				<span class="label">YTD Revenue</span>
				<span class="value">₱{data.year_to_date.total_revenue.toLocaleString()}</span>
			</div>
			<div class="ytd-card">
				<span class="label">YTD Expenses</span>
				<span class="value">₱{data.year_to_date.total_expenses.toLocaleString()}</span>
			</div>
			<div class="ytd-card highlight">
				<span class="label">YTD Net Income</span>
				<span class="value">₱{data.year_to_date.net_income.toLocaleString()}</span>
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Revenue Trend (Last 4 Months)</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Month</th>
						<th>Rent</th>
						<th>Utilities</th>
						<th>Penalties</th>
						<th>Other</th>
						<th>Total</th>
					</tr>
				</thead>
				<tbody>
					{#each data.trend_data as month}
					<tr>
						<td><strong>{month.month}</strong></td>
						<td>₱{month.rent_collected.toLocaleString()}</td>
						<td>₱{month.utility_collected.toLocaleString()}</td>
						<td>₱{month.penalties_collected.toLocaleString()}</td>
						<td>₱{month.other_collected.toLocaleString()}</td>
						<td class="positive"><strong>₱{month.total_collected.toLocaleString()}</strong></td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<footer class="report-footer">
		<p>Generated: {new Date(data.generated_at).toLocaleString()}</p>
	</footer>
</article>

<style>
	.report { max-width: 100%; }
	.report-header {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
		border-bottom: 3px solid var(--color-black);
	}
	.header-icon { font-size: 3rem; background: #e0f2fe; padding: 1rem; border: 2px solid var(--color-black); }
	.header-info h1 { font-size: 2.5rem; line-height: 1.1; }
	.period { font-size: 1.1rem; color: #71717a; margin: 0.5rem 0 0; }

	.summary-section, .data-section { margin-bottom: 2.5rem; }
	h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }

	.pnl-grid { display: grid; grid-template-columns: 1fr 1fr 1.5fr; gap: 1rem; }
	@media (max-width: 700px) { .pnl-grid { grid-template-columns: 1fr; } }
	.pnl-card { padding: 1.5rem; text-align: center; border: 2px solid var(--color-black); }
	.pnl-card.revenue { background: #dcfce7; }
	.pnl-card.expense { background: #fef2f2; }
	.pnl-card.net { background: var(--color-black); color: white; }
	.pnl-card .label { display: block; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.7; }
	.pnl-card .value { font-family: var(--font-header); font-size: 1.75rem; font-weight: 700; display: block; }
	.pnl-card .margin { font-size: 0.9rem; opacity: 0.7; }

	.table-wrapper { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
	th, td { padding: 0.75rem 1rem; text-align: left; border: 1px solid var(--color-gray-200); }
	th { background: var(--color-black); color: white; font-weight: 600; }
	tbody tr:nth-child(even) { background: var(--color-gray-100); }
	tfoot { background: var(--color-gray-100); }
	.positive { color: #16a34a; }
	.negative { color: #dc2626; }

	.occupancy-stats { display: flex; gap: 2rem; align-items: center; flex-wrap: wrap; }
	.occ-card { background: var(--color-primary); color: white; padding: 2rem 3rem; text-align: center; }
	.occ-value { font-family: var(--font-header); font-size: 3rem; font-weight: 700; display: block; }
	.occ-label { font-size: 0.9rem; opacity: 0.8; }
	.occ-detail { flex: 1; min-width: 200px; }
	.occ-detail p { margin: 0.5rem 0; font-size: 1.1rem; }

	.ytd-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
	@media (max-width: 600px) { .ytd-grid { grid-template-columns: 1fr; } }
	.ytd-card { background: var(--color-gray-100); padding: 1.5rem; text-align: center; }
	.ytd-card.highlight { background: var(--color-black); color: white; }
	.ytd-card .label { display: block; font-size: 0.85rem; margin-bottom: 0.5rem; opacity: 0.7; }
	.ytd-card .value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }

	.report-footer { font-size: 0.85rem; color: #71717a; border-top: 1px solid var(--color-gray-200); padding-top: 1rem; }
</style>
