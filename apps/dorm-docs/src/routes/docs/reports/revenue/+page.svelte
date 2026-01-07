<script lang="ts">
	import type { RevenueReportData } from '$lib/types/reports';
	import revenueData from '$lib/data/revenue.json';

	const data = revenueData as RevenueReportData;
</script>

<svelte:head>
	<title>Revenue Report - DA Tirol Dorm</title>
</svelte:head>

<article class="report">
	<header class="report-header">
		<div class="header-icon">💰</div>
		<div class="header-info">
			<h1>Revenue Report</h1>
			<p class="period">{data.report_period}</p>
		</div>
	</header>

	<section class="summary-section">
		<h2>Summary</h2>
		<div class="summary-grid">
			<div class="summary-card">
				<span class="label">Total Billed</span>
				<span class="value">₱{data.summary.total_billed.toLocaleString()}</span>
			</div>
			<div class="summary-card highlight">
				<span class="label">Total Collected</span>
				<span class="value">₱{data.summary.total_collected.toLocaleString()}</span>
			</div>
			<div class="summary-card warning">
				<span class="label">Outstanding</span>
				<span class="value">₱{data.summary.total_outstanding.toLocaleString()}</span>
			</div>
			<div class="summary-card">
				<span class="label">Collection Rate</span>
				<span class="value">{data.summary.collection_rate}%</span>
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Month-over-Month Comparison</h2>
		<div class="comparison-card">
			<div class="comp-item">
				<span class="comp-label">Previous Period</span>
				<span class="comp-value">₱{data.comparison.previous_period_collected.toLocaleString()}</span>
			</div>
			<div class="comp-arrow">→</div>
			<div class="comp-item">
				<span class="comp-label">Current Period</span>
				<span class="comp-value">₱{data.summary.total_collected.toLocaleString()}</span>
			</div>
			<div class="comp-change" class:positive={data.comparison.change_percentage >= 0}>
				{data.comparison.change_percentage >= 0 ? '+' : ''}{data.comparison.change_percentage}%
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Revenue by Type</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Type</th>
						<th>Billed</th>
						<th>Collected</th>
						<th>Outstanding</th>
						<th>Collection Rate</th>
					</tr>
				</thead>
				<tbody>
					{#each data.revenue_by_type as item}
					<tr>
						<td><strong>{item.type}</strong></td>
						<td>₱{item.total_billed.toLocaleString()}</td>
						<td class="collected">₱{item.total_collected.toLocaleString()}</td>
						<td class="outstanding">₱{item.outstanding.toLocaleString()}</td>
						<td>
							<div class="progress-bar">
								<div class="progress-fill" style="width: {item.collection_rate}%"></div>
								<span class="progress-label">{item.collection_rate}%</span>
							</div>
						</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Collections by Payment Method</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Method</th>
						<th>Total Amount</th>
						<th>Transactions</th>
						<th>Share</th>
					</tr>
				</thead>
				<tbody>
					{#each data.revenue_by_method as item}
					<tr>
						<td><strong>{item.method}</strong></td>
						<td>₱{item.total_amount.toLocaleString()}</td>
						<td>{item.transaction_count}</td>
						<td>{item.percentage}%</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Recent Payments</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Amount</th>
						<th>Method</th>
						<th>Paid By</th>
						<th>Type</th>
						<th>Date</th>
					</tr>
				</thead>
				<tbody>
					{#each data.payments as payment}
					<tr>
						<td>{payment.id}</td>
						<td class="collected">₱{payment.amount.toLocaleString()}</td>
						<td><span class="method-badge">{payment.method}</span></td>
						<td>{payment.paid_by}</td>
						<td>{payment.billing_type}</td>
						<td class="nowrap">{new Date(payment.paid_at).toLocaleDateString()}</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Yearly Sales Comparison</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Month</th>
						<th>2024 Sales</th>
						<th>2025 Sales</th>
					</tr>
				</thead>
				<tbody>
					<tr><td>JUN</td><td>₱84,500</td><td>~₱65,000 (Est)</td></tr>
					<tr><td>JUL</td><td>₱70,567</td><td>₱66,000</td></tr>
					<tr><td>AUG</td><td>₱55,750</td><td>₱85,000</td></tr>
				</tbody>
				<tfoot>
					<tr>
						<td><strong>TOTAL</strong></td>
						<td><strong>₱210,817 (Partial)</strong></td>
						<td><strong>₱561,000 (YTD)</strong></td>
					</tr>
				</tfoot>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Business Share Distribution (40/60 Split)</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Month</th>
						<th>Total Sales</th>
						<th>Arjo Share (40%)</th>
						<th>Business Share (60%)</th>
					</tr>
				</thead>
				<tbody>
					<tr><td>JULY</td><td>₱66,000</td><td>₱21,600</td><td>₱32,400</td></tr>
					<tr><td>AUGUST</td><td>₱85,000</td><td>₱21,200</td><td>₱31,800</td></tr>
					<tr><td>SEPTEMBER</td><td>₱75,000</td><td>₱15,200</td><td>₱22,800</td></tr>
					<tr><td>OCTOBER</td><td>₱66,000</td><td>₱21,600</td><td>₱32,400</td></tr>
				</tbody>
				<tfoot>
					<tr>
						<td><strong>TOTALS</strong></td>
						<td><strong>₱292,000</strong></td>
						<td><strong>₱79,600</strong></td>
						<td><strong>₱119,400</strong></td>
					</tr>
				</tfoot>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Financial History</h2>

		<h3 class="subsection-title">2023 Financials</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Month</th>
						<th>2nd Floor</th>
						<th>3rd Floor</th>
						<th>Total Sales</th>
						<th>OpEx</th>
						<th>Net Profit</th>
						<th>Arjo Share (40%)</th>
					</tr>
				</thead>
				<tbody>
					<tr><td>NOVEMBER</td><td>₱35,700</td><td>₱27,000</td><td>₱62,700</td><td>₱12,000</td><td>₱50,700</td><td>₱20,280</td></tr>
				</tbody>
				<tfoot>
					<tr>
						<td><strong>TOTAL</strong></td>
						<td>-</td>
						<td>-</td>
						<td><strong>₱62,700</strong></td>
						<td><strong>-</strong></td>
						<td><strong>₱50,700</strong></td>
						<td><strong>-</strong></td>
					</tr>
				</tfoot>
			</table>
		</div>

		<h3 class="subsection-title">2024 Financials</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Month</th>
						<th>2nd Floor</th>
						<th>3rd Floor</th>
						<th>Total Sales</th>
						<th>OpEx</th>
						<th>Extra Exp</th>
						<th>Net Profit</th>
						<th>Arjo Share (40%)</th>
					</tr>
				</thead>
				<tbody>
					<tr><td>MAR</td><td>₱34,000</td><td>₱20,500</td><td>₱54,500</td><td>₱12,000</td><td>-</td><td>₱42,500</td><td>₱17,000</td></tr>
					<tr><td>JUNE</td><td>₱36,000</td><td>₱48,500</td><td>₱84,500</td><td>₱12,000</td><td>₱15,000¹</td><td>₱57,500</td><td>₱23,000</td></tr>
					<tr><td>JULY</td><td>₱42,000</td><td>₱27,500</td><td>₱70,567</td><td>₱12,000</td><td>-</td><td>₱58,567</td><td>₱23,426</td></tr>
					<tr><td>AUGUST</td><td>₱39,750</td><td>₱16,000</td><td>₱55,750</td><td>₱12,000</td><td>₱9,186²</td><td>₱34,564</td><td>₱13,825</td></tr>
				</tbody>
				<tfoot>
					<tr>
						<td><strong>TOTAL</strong></td>
						<td><strong>-</strong></td>
						<td><strong>-</strong></td>
						<td><strong>₱210,817</strong></td>
						<td><strong>₱36,000</strong></td>
						<td><strong>₱6,000</strong></td>
						<td><strong>₱168,817</strong></td>
						<td><strong>₱67,526</strong></td>
					</tr>
				</tfoot>
			</table>
		</div>

		<h3 class="subsection-title">2025 Financials</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Month</th>
						<th>Tenants</th>
						<th>Sales</th>
						<th>OpEx</th>
						<th>Extra</th>
						<th>Net</th>
						<th>Arjo (40%)</th>
						<th>Fund (60%)</th>
					</tr>
				</thead>
				<tbody>
					<tr><td>JAN</td><td>37</td><td>₱70,000</td><td>₱12,000</td><td>₱35,000</td><td>₱23,000</td><td>₱9,200</td><td>₱13,800</td></tr>
					<tr><td>FEB</td><td>37</td><td>₱70,000</td><td>₱12,000</td><td>-</td><td>₱58,000</td><td>₱23,200</td><td>₱34,800</td></tr>
					<tr><td>MAR</td><td>37</td><td>₱70,000</td><td>₱12,000</td><td>-</td><td>₱58,000</td><td>₱23,200</td><td>₱34,800</td></tr>
					<tr><td>APR</td><td>37</td><td>₱70,000</td><td>₱12,000</td><td>-</td><td>₱58,000</td><td>₱23,200</td><td>₱34,800</td></tr>
					<tr><td>MAY</td><td>35</td><td>₱65,000</td><td>₱12,000</td><td>-</td><td>₱53,000</td><td>₱21,200</td><td>₱31,800</td></tr>
					<tr><td>JUN</td><td>35</td><td>₱65,000</td><td>₱12,000</td><td>-</td><td>₱53,000</td><td>₱21,200</td><td>₱31,800</td></tr>
					<tr><td>JULY</td><td>38</td><td>₱66,000</td><td>₱12,000</td><td>-</td><td>₱54,000</td><td>₱21,600</td><td>₱32,400</td></tr>
					<tr><td>AUGUST</td><td>38</td><td>₱85,000</td><td>₱12,000</td><td>₱20,000</td><td>₱53,000</td><td>₱21,200</td><td>₱31,800</td></tr>
					<tr><td>SEPTEMBER</td><td>36</td><td>₱75,000</td><td>₱12,000</td><td>₱25,000</td><td>₱38,000</td><td>₱15,200</td><td>₱22,800</td></tr>
					<tr><td>OCTOBER</td><td>36</td><td>₱66,000</td><td>₱12,000</td><td>-</td><td>₱54,000</td><td>₱21,600</td><td>₱32,400</td></tr>
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
	.header-icon { font-size: 3rem; background: #dcfce7; padding: 1rem; border: 2px solid var(--color-black); }
	.header-info h1 { font-size: 2.5rem; line-height: 1.1; }
	.period { font-size: 1.1rem; color: #71717a; margin: 0.5rem 0 0; }

	.summary-section, .data-section { margin-bottom: 2.5rem; }
	h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }

	.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
	.subsection-title { margin-top: 2rem; margin-bottom: 1rem; font-size: 1.1rem; color: #52525b; }
	@media (max-width: 800px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
	.summary-card { background: white; border: 2px solid var(--color-black); padding: 1.25rem; text-align: center; }
	.summary-card.highlight { background: #16a34a; color: white; border-color: #16a34a; }
	.summary-card.warning { background: #fef3c7; border-color: #f59e0b; }
	.summary-card .label { display: block; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.7; }
	.summary-card .value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }

	.comparison-card {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 2rem;
		background: var(--color-gray-100);
		padding: 2rem;
		flex-wrap: wrap;
	}
	.comp-item { text-align: center; }
	.comp-label { display: block; font-size: 0.85rem; color: #71717a; margin-bottom: 0.5rem; }
	.comp-value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }
	.comp-arrow { font-size: 1.5rem; color: #71717a; }
	.comp-change {
		font-family: var(--font-header);
		font-size: 1.5rem;
		font-weight: 700;
		padding: 0.5rem 1rem;
		background: #fef2f2;
		color: #ef4444;
	}
	.comp-change.positive { background: #dcfce7; color: #16a34a; }

	.table-wrapper { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
	th, td { padding: 0.75rem 1rem; text-align: left; border: 1px solid var(--color-gray-200); }
	th { background: var(--color-black); color: white; font-weight: 600; white-space: nowrap; }
	tbody tr:nth-child(even) { background: var(--color-gray-100); }
	.nowrap { white-space: nowrap; }
	.collected { color: #16a34a; font-weight: 600; }
	.outstanding { color: #f59e0b; }

	.progress-bar { position: relative; background: var(--color-gray-200); height: 24px; width: 100%; min-width: 100px; }
	.progress-fill { height: 100%; background: #16a34a; }
	.progress-label { position: absolute; right: 8px; top: 50%; transform: translateY(-50%); font-size: 0.85rem; font-weight: 600; }

	.method-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		background: var(--color-gray-200);
		border-radius: 2px;
	}

	.report-footer { font-size: 0.85rem; color: #71717a; border-top: 1px solid var(--color-gray-200); padding-top: 1rem; }
</style>
