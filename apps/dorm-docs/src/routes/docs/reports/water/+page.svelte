<script lang="ts">
	import type { WaterReportData } from '$lib/types/reports';
	import waterData from '$lib/data/water.json';

	const data = waterData as WaterReportData;
</script>

<svelte:head>
	<title>Water Report - DA Tirol Dorm</title>
</svelte:head>

<article class="report">
	<header class="report-header">
		<div class="header-icon">💧</div>
		<div class="header-info">
			<h1>Water Report</h1>
			<p class="period">{data.report_period}</p>
		</div>
	</header>

	<section class="summary-section">
		<h2>Summary</h2>
		<div class="summary-grid">
			<div class="summary-card">
				<span class="label">Total Consumption</span>
				<span class="value">{data.summary.total_consumption_cubic_meters} m³</span>
			</div>
			<div class="summary-card">
				<span class="label">Total Cost</span>
				<span class="value">₱{data.summary.total_cost.toLocaleString()}</span>
			</div>
			<div class="summary-card">
				<span class="label">Average Rate</span>
				<span class="value">₱{data.summary.average_rate}/m³</span>
			</div>
			<div class="summary-card">
				<span class="label">Active Meters</span>
				<span class="value">{data.summary.meters_active}</span>
			</div>
		</div>
	</section>

	<section class="data-section">
		<h2>Meter Readings</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Meter</th>
						<th>Previous</th>
						<th>Current</th>
						<th>Consumption</th>
						<th>Rate</th>
						<th>Cost</th>
					</tr>
				</thead>
				<tbody>
					{#each data.readings as reading}
					<tr>
						<td class="meter-name">{reading.meter_name}</td>
						<td>{reading.previous_reading?.toLocaleString() ?? '-'}</td>
						<td>{reading.reading.toLocaleString()}</td>
						<td><strong>{reading.consumption} m³</strong></td>
						<td>₱{reading.rate_at_reading}</td>
						<td class="cost">₱{reading.cost.toLocaleString()}</td>
					</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td colspan="3"><strong>Total</strong></td>
						<td><strong>{data.summary.total_consumption_cubic_meters} m³</strong></td>
						<td></td>
						<td class="cost"><strong>₱{data.summary.total_cost.toLocaleString()}</strong></td>
					</tr>
				</tfoot>
			</table>
		</div>
	</section>

	<section class="data-section">
		<h2>Registered Meters</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>ID</th>
						<th>Meter Name</th>
						<th>Location Type</th>
						<th>Initial Reading</th>
						<th>Status</th>
					</tr>
				</thead>
				<tbody>
					{#each data.meters as meter}
					<tr>
						<td>{meter.id}</td>
						<td>{meter.name}</td>
						<td>{meter.location_type}</td>
						<td>{meter.initial_reading}</td>
						<td>
							<span class="status-badge" class:active={meter.status === 'ACTIVE'}>
								{meter.status}
							</span>
						</td>
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
	.header-icon {
		font-size: 3rem;
		background: #dbeafe;
		padding: 1rem;
		border: 2px solid var(--color-black);
	}
	.header-info h1 { font-size: 2.5rem; line-height: 1.1; }
	.period { font-size: 1.1rem; color: #71717a; margin: 0.5rem 0 0; }

	.summary-section, .data-section { margin-bottom: 2.5rem; }
	h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }

	.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
	@media (max-width: 800px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
	.summary-card {
		background: white;
		border: 2px solid var(--color-black);
		padding: 1.25rem;
		text-align: center;
	}
	.summary-card .label { display: block; font-size: 0.85rem; text-transform: uppercase; color: #71717a; margin-bottom: 0.5rem; }
	.summary-card .value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }

	.table-wrapper { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
	th, td { padding: 0.75rem 1rem; text-align: left; border: 1px solid var(--color-gray-200); }
	th { background: var(--color-black); color: white; font-weight: 600; white-space: nowrap; }
	tbody tr:nth-child(even) { background: var(--color-gray-100); }
	tfoot { background: var(--color-gray-100); }
	.meter-name { font-weight: 600; }
	.cost { color: var(--color-primary); font-weight: 600; }

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.5rem;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		background: #fef2f2;
		color: #ef4444;
		border-radius: 2px;
	}
	.status-badge.active { background: #dcfce7; color: #16a34a; }

	.report-footer { font-size: 0.85rem; color: #71717a; border-top: 1px solid var(--color-gray-200); padding-top: 1rem; }
</style>
