<script lang="ts">
	import electricityData from '$lib/data/electricity.json';

	const data = electricityData;
	
	// Calculate totals
	const grandTotal = data.monthly_bills.reduce((sum, month) => sum + month.total, 0);
	
	// Get 2nd floor and 3rd floor totals per month
	function getFloorTotal(bills: {room: string, amount: number}[], floor: string) {
		return bills.filter(b => b.room.startsWith(floor)).reduce((sum, b) => sum + b.amount, 0);
	}
</script>

<svelte:head>
	<title>Electricity Billing Report - DA Tirol Dorm</title>
</svelte:head>

<article class="report">
	<header class="report-header">
		<div class="header-icon">⚡</div>
		<div class="header-info">
			<h1>Electricity Billing Report</h1>
			<p class="period">{data.report_period}</p>
		</div>
	</header>

	<section class="summary-section">
		<h2>Summary</h2>
		<p class="note">📌 {data.note}</p>
		<div class="summary-grid">
			<div class="summary-card">
				<span class="label">Months Covered</span>
				<span class="value">{data.summary.months_covered}</span>
			</div>
			<div class="summary-card">
				<span class="label">Rooms Billed</span>
				<span class="value">{data.summary.rooms_billed}</span>
			</div>
			<div class="summary-card">
				<span class="label">Avg. Monthly</span>
				<span class="value">₱{data.summary.average_monthly.toLocaleString()}</span>
			</div>
			<div class="summary-card highlight">
				<span class="label">Total Billed</span>
				<span class="value">₱{data.summary.total_billed.toLocaleString()}</span>
			</div>
		</div>
	</section>

	{#each data.monthly_bills as monthData}
	<section class="data-section">
		<h2>
			{monthData.month}
			<span class="status-badge" class:paid={monthData.status === 'Paid'} class:unpaid={monthData.status === 'Unpaid'}>
				{monthData.status}
			</span>
		</h2>
		{#if monthData.note}
		<p class="month-note">⚠️ {monthData.note}</p>
		{/if}
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Room</th>
						<th>Amount</th>
					</tr>
				</thead>
				<tbody>
					{#each monthData.bills.filter(b => b.room.startsWith('2nd Floor')) as bill}
					<tr>
						<td class="meter-name">{bill.room}</td>
						<td class="cost">₱{bill.amount.toLocaleString()}</td>
					</tr>
					{/each}
					<tr class="subtotal-row">
						<td><strong>2nd Floor Total</strong></td>
						<td class="cost"><strong>₱{getFloorTotal(monthData.bills, '2nd Floor').toLocaleString()}</strong></td>
					</tr>
					{#each monthData.bills.filter(b => b.room.startsWith('3rd Floor')) as bill}
					<tr>
						<td class="meter-name">{bill.room}</td>
						<td class="cost">₱{bill.amount.toLocaleString()}</td>
					</tr>
					{/each}
					<tr class="subtotal-row">
						<td><strong>3rd Floor Total</strong></td>
						<td class="cost"><strong>₱{getFloorTotal(monthData.bills, '3rd Floor').toLocaleString()}</strong></td>
					</tr>
				</tbody>
				<tfoot>
					<tr>
						<td><strong>TOTAL</strong></td>
						<td class="cost"><strong>₱{monthData.total.toLocaleString()}</strong></td>
					</tr>
				</tfoot>
			</table>
		</div>
	</section>
	{/each}

	<section class="data-section">
		<h2>All Months Comparison</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Room</th>
						{#each data.monthly_bills as month}
						<th>{month.month.split(' ')[0]}</th>
						{/each}
					</tr>
				</thead>
				<tbody>
					{#each data.monthly_bills[0].bills as _, i}
					<tr>
						<td class="meter-name">{data.monthly_bills[0].bills[i].room}</td>
						{#each data.monthly_bills as month}
						<td class="cost">₱{month.bills[i].amount.toLocaleString()}</td>
						{/each}
					</tr>
					{/each}
				</tbody>
				<tfoot>
					<tr>
						<td><strong>TOTAL</strong></td>
						{#each data.monthly_bills as month}
						<td class="cost"><strong>₱{month.total.toLocaleString()}</strong></td>
						{/each}
					</tr>
				</tfoot>
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
		background: #fef3c7;
		padding: 1rem;
		border: 2px solid var(--color-black);
	}
	.header-info h1 { font-size: 2.5rem; line-height: 1.1; }
	.period { font-size: 1.1rem; color: #71717a; margin: 0.5rem 0 0; }

	.summary-section, .data-section { margin-bottom: 2.5rem; }
	h2 { font-size: 1.25rem; margin-bottom: 1rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); display: flex; align-items: center; gap: 1rem; }
	.note { font-size: 0.9rem; color: #71717a; font-style: italic; margin-bottom: 1rem; }
	.month-note { font-size: 0.85rem; background: #fef3c7; padding: 0.5rem 1rem; border-left: 3px solid #f59e0b; margin-bottom: 1rem; }

	.summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1rem; }
	@media (max-width: 800px) { .summary-grid { grid-template-columns: repeat(2, 1fr); } }
	.summary-card {
		background: white;
		border: 2px solid var(--color-black);
		padding: 1.25rem;
		text-align: center;
	}
	.summary-card.highlight { background: var(--color-black); color: white; }
	.summary-card .label { display: block; font-size: 0.85rem; text-transform: uppercase; color: #71717a; margin-bottom: 0.5rem; }
	.summary-card.highlight .label { color: rgba(255,255,255,0.7); }
	.summary-card .value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }

	.table-wrapper { overflow-x: auto; }
	table { width: 100%; border-collapse: collapse; font-size: 0.95rem; }
	th, td { padding: 0.75rem 1rem; text-align: left; border: 1px solid var(--color-gray-200); }
	th { background: var(--color-black); color: white; font-weight: 600; white-space: nowrap; }
	tbody tr:nth-child(even) { background: var(--color-gray-100); }
	tfoot { background: var(--color-black); color: white; }
	tfoot .cost { color: white; }
	.meter-name { font-weight: 600; }
	.cost { color: var(--color-primary); font-weight: 600; text-align: right; }
	.subtotal-row { background: #e0f2fe !important; }
	.subtotal-row .cost { color: #0369a1; }

	.status-badge {
		display: inline-block;
		padding: 0.25rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		border-radius: 4px;
	}
	.status-badge.paid { background: #dcfce7; color: #16a34a; }
	.status-badge.unpaid { background: #fef2f2; color: #ef4444; }

	.report-footer { font-size: 0.85rem; color: #71717a; border-top: 1px solid var(--color-gray-200); padding-top: 1rem; }
</style>
