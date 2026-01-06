<svelte:head>
	<title>Kuya's Silog & Lugaw | OPEX</title>
</svelte:head>

<section class="doc-page">
	<a href="/" class="back-link">← Back to Dashboard</a>
	
	<header>
		<h1>Monthly Operating Expenses (OPEX)</h1>
		<div class="summary-total">
			<span>Estimated Monthly Burn:</span>
			<strong>~₱24,000.00</strong>
		</div>
	</header>

	<article class="content">
		<p class="intro">Recurring costs required to keep the business running. Does not include food cost (COGS).</p>

		<table class="finance-table">
			<thead>
				<tr>
					<th>Expense Category</th>
					<th>Notes</th>
					<th class="cost">Est. Cost</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Staff Salaries</td>
					<td>1-2 Staff (Cook/Server)</td>
					<td class="cost">₱15,000.00</td>
				</tr>
				<tr>
					<td>Electricity</td>
					<td>Freezer running 24/7</td>
					<td class="cost">₱3,500.00</td>
				</tr>
				<tr>
					<td>LPG Replenishment</td>
					<td>Approx. 3 tanks/month</td>
					<td class="cost">₱3,000.00</td>
				</tr>
				<tr>
					<td>Transportation</td>
					<td>Market runs</td>
					<td class="cost">₱1,500.00</td>
				</tr>
				<tr>
					<td>Water</td>
					<td>Washing/Cleaning</td>
					<td class="cost">₱500.00</td>
				</tr>
                <tr>
					<td>Marketing/Load</td>
					<td>Data/Ads</td>
					<td class="cost">₱500.00</td>
				</tr>
                <tr class="muted">
					<td>Rent</td>
					<td>Home-based (Variable if renting)</td>
					<td class="cost">₱0.00</td>
				</tr>
				<tr class="subtotal">
					<td colspan="2">TOTAL MONTHLY OPEX</td>
					<td class="cost">₱24,000.00</td>
				</tr>
			</tbody>
		</table>

	</article>
</section>

<style>
	:global(body) {
		background-color: #f8fafc;
		font-family: 'Inter', sans-serif;
		color: #334155;
	}

	.doc-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 3rem 2rem;
		background: white;
		min-height: 100vh;
		box-shadow: 0 0 50px rgba(0,0,0,0.05);
	}

	.back-link {
		display: inline-block;
		margin-bottom: 2rem;
		color: #64748b;
		text-decoration: none;
		font-weight: 500;
	}
	.back-link:hover { color: #f59e0b; }

	header {
		border-bottom: 2px solid #f1f5f9;
		padding-bottom: 2rem;
		margin-bottom: 2rem;
	}
	header h1 {
		font-size: 2rem;
		color: #0f172a;
		margin: 0 0 1rem;
	}
	
	.summary-total {
		background: #0f172a;
		color: white;
		display: inline-block;
		padding: 1rem 1.5rem;
		border-radius: 8px;
		font-size: 1.1rem;
	}
	.summary-total strong {
		color: #f87171; /* Red for Burn */
		margin-left: 0.5rem;
		font-size: 1.3rem;
	}

	.finance-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 1rem;
		margin-top: 1rem;
	}
	.finance-table th {
		text-align: left;
		padding: 1rem;
		background: #f8fafc;
		color: #64748b;
		border-bottom: 1px solid #e2e8f0;
	}
	.finance-table td {
		padding: 1rem;
		border-bottom: 1px solid #e2e8f0;
		color: #334155;
	}
	
	.finance-table .cost {
		text-align: right;
		font-family: 'Segoe UI', monospace;
		font-weight: 600;
	}
	
	.subtotal td {
		background: #fff1f2;
		font-weight: 700;
		color: #991b1b;
		border-top: 2px solid #fca5a5;
	}

    .muted td { color: #cbd5e0; }
</style>
