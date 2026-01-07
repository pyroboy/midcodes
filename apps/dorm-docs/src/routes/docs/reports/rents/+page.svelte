<script lang="ts">
	import type { RentsReportData } from '$lib/types/reports';
	import rentsData from '$lib/data/rents.json';

	const data = rentsData as RentsReportData;
</script>

<svelte:head>
	<title>Rents Report - DA Tirol Dorm</title>
</svelte:head>

<article class="report">
	<header class="report-header">
		<div class="header-icon">🏠</div>
		<div class="header-info">
			<h1>Rents Report</h1>
			<p class="period">{data.report_period}</p>
		</div>
	</header>

	<section class="summary-section">
		<h2>Summary</h2>
		<div class="summary-grid">
			<div class="summary-card">
				<span class="label">Total Billed</span>
				<span class="value">₱{data.summary.total_rent_billed.toLocaleString()}</span>
			</div>
			<div class="summary-card highlight">
				<span class="label">Collected</span>
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
		<div class="sub-stats">
			<div class="sub-stat">
				<span class="label">Total Penalties:</span>
				<span class="value penalty">₱{data.summary.total_penalties.toLocaleString()}</span>
			</div>
			<div class="sub-stat">
				<span class="label">Overdue Accounts:</span>
				<span class="value overdue">{data.summary.overdue_count}</span>
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Rents by Status</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Status</th>
						<th>Count</th>
						<th>Total Amount</th>
						<th>Outstanding Balance</th>
					</tr>
				</thead>
				<tbody>
					{#each data.rents_by_status as item}
					<tr>
						<td><span class="status-badge {item.status.toLowerCase()}">{item.status}</span></td>
						<td><strong>{item.count}</strong></td>
						<td>₱{item.total_amount.toLocaleString()}</td>
						<td class="balance">₱{item.total_balance.toLocaleString()}</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	{#if data.top_delinquents.length > 0}
	<section class="data-section alert-section">
		<h2>⚠️ Top Delinquent Accounts</h2>
		<div class="table-wrapper">
			<table class="alert-table">
				<thead>
					<tr>
						<th>Lease</th>
						<th>Room</th>
						<th>Amount Due</th>
						<th>Balance</th>
						<th>Days Overdue</th>
						<th>Penalty</th>
					</tr>
				</thead>
				<tbody>
					{#each data.top_delinquents as bill}
					<tr>
						<td>{bill.lease_name}</td>
						<td>{bill.rental_unit_name}</td>
						<td>₱{bill.amount.toLocaleString()}</td>
						<td class="balance">₱{bill.balance.toLocaleString()}</td>
						<td class="overdue"><strong>{bill.days_overdue} days</strong></td>
						<td class="penalty">₱{bill.penalty_amount.toLocaleString()}</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
	{/if}

	<section class="data-section">
		<h2>All Rent Billings</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Lease</th>
						<th>Room</th>
						<th>Amount</th>
						<th>Paid</th>
						<th>Balance</th>
						<th>Status</th>
						<th>Due Date</th>
					</tr>
				</thead>
				<tbody>
					{#each data.billings as bill}
					<tr>
						<td>{bill.id}</td>
						<td>{bill.lease_name}</td>
						<td>{bill.rental_unit_name}</td>
						<td>₱{bill.amount.toLocaleString()}</td>
						<td class="paid">₱{bill.paid_amount.toLocaleString()}</td>
						<td class="balance">₱{bill.balance.toLocaleString()}</td>
						<td><span class="status-badge {bill.status.toLowerCase()}">{bill.status}</span></td>
						<td>{bill.due_date}</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Monthly Payments 2025 Tracker</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Name</th>
						<th>July</th>
						<th>Aug</th>
						<th>Sept</th>
						<th>Oct</th>
						<th>Nov</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Jessel Saraga</strong></td>
						<td>₱2,000</td>
						<td>₱2,000</td>
						<td>₱2,000</td>
						<td>₱2,000</td>
						<td>-</td>
					</tr>
					<tr>
						<td><strong>Althea Aclan</strong></td>
						<td>₱4,000</td>
						<td>₱2,000</td>
						<td>₱2,000</td>
						<td>₱2,000</td>
						<td>-</td>
					</tr>
					<tr>
						<td><strong>Ann Patricia Regalado</strong></td>
						<td>₱4,000</td>
						<td>₱2,000</td>
						<td>₱2,000</td>
						<td>₱2,000</td>
						<td>₱2,000</td>
					</tr>
					<tr>
						<td><strong>Manilyn C. Sevilla</strong></td>
						<td>₱5,000</td>
						<td>₱5,000</td>
						<td>₱5,000</td>
						<td>-</td>
						<td>-</td>
					</tr>
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
	.header-icon { font-size: 3rem; background: #fce7f3; padding: 1rem; border: 2px solid var(--color-black); }
	.header-info h1 { font-size: 2.5rem; line-height: 1.1; }
	.period { font-size: 1.1rem; color: #71717a; margin: 0.5rem 0 0; }

	.summary-section, .data-section { margin-bottom: 2.5rem; }
	h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }

	.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; margin-bottom: 1rem; }
	@media (max-width: 800px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
	.summary-card { background: white; border: 2px solid var(--color-black); padding: 1.25rem; text-align: center; }
	.summary-card.highlight { background: #16a34a; color: white; border-color: #16a34a; }
	.summary-card.warning { background: #fef3c7; border-color: #f59e0b; }
	.summary-card .label { display: block; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.7; }
	.summary-card .value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }

	.sub-stats { display: flex; gap: 2rem; flex-wrap: wrap; }
	.sub-stat { font-size: 0.95rem; }
	.sub-stat .label { color: #71717a; }
	.sub-stat .value { font-weight: 700; margin-left: 0.5rem; }
	.sub-stat .penalty { color: #ef4444; }
	.sub-stat .overdue { color: #dc2626; }

	.alert-section { background: #fef3c7; padding: 1.5rem; border: 2px solid #f59e0b; }
	.alert-section h2 { border-bottom-color: #f59e0b; }

	.table-wrapper { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
	th, td { padding: 0.75rem 1rem; text-align: left; border: 1px solid var(--color-gray-200); }
	th { background: var(--color-black); color: white; font-weight: 600; white-space: nowrap; }
	tbody tr:nth-child(even) { background: var(--color-gray-100); }

	.paid { color: #16a34a; }
	.balance { color: #f59e0b; font-weight: 600; }
	.overdue { color: #dc2626; }
	.penalty { color: #ef4444; }

	.status-badge { display: inline-block; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; border-radius: 2px; }
	.status-badge.paid { background: #dcfce7; color: #16a34a; }
	.status-badge.partial { background: #fef3c7; color: #d97706; }
	.status-badge.pending { background: #e0e7ff; color: #4f46e5; }
	.status-badge.overdue { background: #fef2f2; color: #ef4444; }

	.report-footer { font-size: 0.85rem; color: #71717a; border-top: 1px solid var(--color-gray-200); padding-top: 1rem; }
</style>
