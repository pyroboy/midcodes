<svelte:head>
	<title>Silog Business | CAPEX</title>
</svelte:head>

<section class="doc-page">
	<a href="/" class="back-link">← Back to Dashboard</a>
	
	<header>
		<h1>Capital Expenditures (CAPEX)</h1>
		<div class="summary-total">
			<span>Total Projected Launch Cost:</span>
			<strong>₱23,800.00</strong>
		</div>
	</header>

	<article class="content">
		<p class="intro">
			This breakdown assumes major assets (Stove, Freezer, Rice Cooker) are already owned/acquired, 
			focusing the budget on preparation tools, marketing, and initial inventory.
		</p>

		<!-- Hardware Section -->
		<div class="finance-table-wrapper">
			<h3>A. Equipment & Hardware</h3>
			<table class="finance-table">
				<thead>
					<tr>
						<th>Item</th>
						<th>Notes</th>
						<th>Status</th>
						<th class="cost">Cost</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Prep Boards</td>
						<td>Heavy Duty, Color-coded</td>
						<td><span class="bad">NEEDED</span></td>
						<td class="cost">₱1,500.00</td>
					</tr>
					<tr>
						<td>Smallwares</td>
						<td>Tongs, Spatulas, Knives</td>
						<td><span class="bad">NEEDED</span></td>
						<td class="cost">₱1,000.00</td>
					</tr>
					<tr class="muted">
						<td>Rice Cooker</td>
						<td>Commercial Grade</td>
						<td><span class="ok">Acquired</span></td>
						<td class="cost">₱0.00</td>
					</tr>
					<tr class="muted">
						<td>Freezer</td>
						<td>Cold Storage</td>
						<td><span class="ok">Acquired</span></td>
						<td class="cost">₱0.00</td>
					</tr>
					<tr class="subtotal">
						<td colspan="3">Hardware Subtotal</td>
						<td class="cost">₱2,500.00</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Marketing Section -->
		<div class="finance-table-wrapper">
			<h3>B. Marketing & Branding</h3>
			<table class="finance-table">
				<thead>
					<tr>
						<th>Item</th>
						<th>Specs</th>
						<th class="cost">Cost</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Store Signage</td>
						<td>Main Tarpaulin / Lighted Frame</td>
						<td class="cost">₱1,500.00</td>
					</tr>
					<tr>
						<td>Menus</td>
						<td>3x Counter, 1x Wall (Laminated)</td>
						<td class="cost">₱800.00</td>
					</tr>
					<tr>
						<td>Branding</td>
						<td>Logo & Packaging Stickers</td>
						<td class="cost">₱1,000.00</td>
					</tr>
					<tr>
						<td>Flyers</td>
						<td>500pcs Opening Promo</td>
						<td class="cost">₱500.00</td>
					</tr>
					<tr>
						<td>Uniforms</td>
						<td>2x Branded Aprons/Tees</td>
						<td class="cost">₱700.00</td>
					</tr>
					<tr class="subtotal">
						<td colspan="2">Marketing Subtotal</td>
						<td class="cost">₱4,500.00</td>
					</tr>
				</tbody>
			</table>
		</div>

		<!-- Inventory Section -->
		<div class="finance-table-wrapper">
			<h3>C. Initial Inventory (Working Capital)</h3>
			<p class="section-note">Stock allocation for first 150-200 servings.</p>
			<table class="finance-table">
				<thead>
					<tr>
						<th>Category</th>
						<th>Includes</th>
						<th class="cost">Allocation</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Core Essentials</td>
						<td>Rice (2 sacks), Oil, LPG</td>
						<td class="cost">₱4,600.00</td>
					</tr>
					<tr>
						<td>"Winners" Stock</td>
						<td>Longga, Squid, Spam, Ckn Tapa</td>
						<td class="cost">₱4,500.00</td>
					</tr>
					<tr>
						<td>"Budget" Stock</td>
						<td>Hotdogs, Eggs, Patties, Mami</td>
						<td class="cost">₱4,000.00</td>
					</tr>
					<tr>
						<td>"Premium" Stock</td>
						<td>Beef Tapa, Bangus, Fish Fillet</td>
						<td class="cost">₱2,500.00</td>
					</tr>
					<tr>
						<td>Packaging</td>
						<td>Styro boxes, utentils, tissue</td>
						<td class="cost">₱1,200.00</td>
					</tr>
					<tr class="subtotal">
						<td colspan="2">Inventory Subtotal</td>
						<td class="cost">₱16,800.00</td>
					</tr>
				</tbody>
			</table>
		</div>

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
		color: #4ade80;
		margin-left: 0.5rem;
		font-size: 1.3rem;
	}

	.intro {
		color: #64748b;
		margin-bottom: 2rem;
		font-style: italic;
	}

	.finance-table-wrapper {
		margin-bottom: 3rem;
	}
	.finance-table-wrapper h3 {
		color: #334155;
		border-left: 4px solid #f59e0b;
		padding-left: 1rem;
		margin-bottom: 1rem;
	}

	.finance-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.95rem;
	}
	.finance-table th {
		text-align: left;
		padding: 0.75rem 1rem;
		background: #f8fafc;
		color: #64748b;
		font-weight: 600;
		border-bottom: 1px solid #e2e8f0;
	}
	.finance-table td {
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #e2e8f0;
		color: #334155;
	}
	
	.finance-table .cost {
		text-align: right;
		font-family: 'Segoe UI', monospace;
		font-weight: 600;
	}
	
	.subtotal td {
		background: #fdfaf0;
		font-weight: 700;
		color: #b45309;
		border-top: 2px solid #fcd34d;
	}

	.muted td { color: #cbd5e0; }
	.section-note { font-size: 0.85rem; color: #64748b; margin-top: -0.5rem; margin-bottom: 1rem; }

	.ok { color: #16a34a; background: #dcfce7; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
	.bad { color: #dc2626; background: #fee2e2; padding: 2px 6px; border-radius: 4px; font-size: 0.8rem; font-weight: 600; }
</style>
