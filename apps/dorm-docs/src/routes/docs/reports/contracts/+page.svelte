<script lang="ts">
	import type { ContractsReportData } from '$lib/types/reports';
	import contractsData from '$lib/data/contracts.json';

	const data = contractsData as ContractsReportData;
</script>

<svelte:head>
	<title>Contracts Report - DA Tirol Dorm</title>
</svelte:head>

<article class="report">
	<header class="report-header">
		<div class="header-icon">📄</div>
		<div class="header-info">
			<h1>Contracts Report</h1>
			<p class="period">As of {data.report_date}</p>
		</div>
	</header>

	<section class="summary-section">
		<h2>Summary</h2>
		<div class="summary-grid">
			<div class="summary-card">
				<span class="label">Total Contracts</span>
				<span class="value">{data.summary.total_contracts}</span>
			</div>
			<div class="summary-card highlight">
				<span class="label">Active Contracts</span>
				<span class="value">{data.summary.active_contracts}</span>
			</div>
			<div class="summary-card warning">
				<span class="label">Expiring in 30 Days</span>
				<span class="value">{data.summary.expiring_within_30_days}</span>
			</div>
			<div class="summary-card">
				<span class="label">Total Monthly Rent</span>
				<span class="value">₱{data.summary.total_monthly_rent.toLocaleString()}</span>
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Contracts by Status</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Status</th>
						<th>Count</th>
						<th>Total Rent Value</th>
					</tr>
				</thead>
				<tbody>
					{#each data.contracts_by_status as item}
					<tr>
						<td><span class="status-badge {item.status.toLowerCase()}">{item.status}</span></td>
						<td><strong>{item.count}</strong></td>
						<td>₱{item.total_rent_value.toLocaleString()}</td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	{#if data.renewals_due.length > 0}
	<section class="data-section alert-section">
		<h2>⚠️ Renewals Due Soon</h2>
		<div class="table-wrapper">
			<table class="alert-table">
				<thead>
					<tr>
						<th>Lease</th>
						<th>Room</th>
						<th>Tenants</th>
						<th>End Date</th>
						<th>Days Left</th>
					</tr>
				</thead>
				<tbody>
					{#each data.renewals_due as contract}
					<tr>
						<td>{contract.lease_name}</td>
						<td>{contract.rental_unit_name}</td>
						<td>{contract.tenant_names.join(', ')}</td>
						<td>{contract.end_date}</td>
						<td><strong class="urgent">{contract.days_until_expiry} days</strong></td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>
	{/if}

	<section class="data-section">
		<h2>Contract Details</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Lease Name</th>
						<th>Room</th>
						<th>Tenant(s)</th>
						<th>Period</th>
						<th>Rent</th>
						<th>Deposit</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.contracts as contract}
					<tr>
						<td>{contract.lease_name}</td>
						<td>{contract.rental_unit_name}</td>
						<td>{contract.tenant_names.join(', ')}</td>
						<td class="nowrap">{contract.start_date} → {contract.end_date}</td>
						<td>₱{contract.rent_amount.toLocaleString()}</td>
						<td>₱{contract.security_deposit.toLocaleString()}</td>
						<td><span class="status-badge {contract.status.toLowerCase()}">{contract.status}</span></td>
					</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</section>

	<section class="summary-section">
		<h2>Financial Summary</h2>
		<div class="fin-summary">
			<div class="fin-item">
				<span class="label">Total Monthly Rent (Active)</span>
				<span class="value">₱{data.summary.total_monthly_rent.toLocaleString()}</span>
			</div>
			<div class="fin-item">
				<span class="label">Total Security Deposits</span>
				<span class="value">₱{data.summary.total_security_deposits.toLocaleString()}</span>
			</div>
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
	.header-icon { font-size: 3rem; background: #e0e7ff; padding: 1rem; border: 2px solid var(--color-black); }
	.header-info h1 { font-size: 2.5rem; line-height: 1.1; }
	.period { font-size: 1.1rem; color: #71717a; margin: 0.5rem 0 0; }

	.summary-section, .data-section { margin-bottom: 2.5rem; }
	h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }

	.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
	@media (max-width: 800px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
	.summary-card { background: white; border: 2px solid var(--color-black); padding: 1.25rem; text-align: center; }
	.summary-card.highlight { background: var(--color-black); color: white; }
	.summary-card.warning { background: #fef3c7; border-color: #f59e0b; }
	.summary-card .label { display: block; font-size: 0.85rem; text-transform: uppercase; margin-bottom: 0.5rem; opacity: 0.7; }
	.summary-card .value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }

	.alert-section { background: #fef3c7; padding: 1.5rem; border: 2px solid #f59e0b; }
	.alert-section h2 { border-bottom-color: #f59e0b; }
	.alert-table { border: 1px solid #f59e0b; }
	.urgent { color: #dc2626; }

	.table-wrapper { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
	th, td { padding: 0.75rem 1rem; text-align: left; border: 1px solid var(--color-gray-200); }
	th { background: var(--color-black); color: white; font-weight: 600; white-space: nowrap; }
	tbody tr:nth-child(even) { background: var(--color-gray-100); }
	.nowrap { white-space: nowrap; }

	.status-badge { display: inline-block; padding: 0.25rem 0.5rem; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; border-radius: 2px; }
	.status-badge.active { background: #dcfce7; color: #16a34a; }
	.status-badge.expired { background: #fef2f2; color: #ef4444; }
	.status-badge.pending { background: #fef3c7; color: #d97706; }
	.status-badge.terminated { background: #f4f4f5; color: #71717a; }

	.fin-summary { display: flex; gap: 2rem; flex-wrap: wrap; }
	.fin-item { background: var(--color-gray-100); padding: 1.5rem 2rem; flex: 1; min-width: 200px; }
	.fin-item .label { display: block; font-size: 0.9rem; margin-bottom: 0.5rem; color: #71717a; }
	.fin-item .value { font-family: var(--font-header); font-size: 1.75rem; font-weight: 700; }

	.report-footer { font-size: 0.85rem; color: #71717a; border-top: 1px solid var(--color-gray-200); padding-top: 1rem; }
</style>
