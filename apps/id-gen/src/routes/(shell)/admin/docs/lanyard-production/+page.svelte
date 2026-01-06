<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Lanyard Production | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Lanyard Production: OPEX & CAPEX</h1>
		<p class="meta">Philippines Market • Sublimation Process • 1/2", 3/4", 1" Widths</p>
		<div class="status-chip highlight">Production Analysis</div>
	</header>

	<section>
		<h2>1. Capital Expenditure (CAPEX) – Equipment Setup</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Equipment Category</th>
						<th>Entry (Home-Based)</th>
						<th>Mid-Volume</th>
						<th>High-Volume Prof.</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Sublimation Printer</strong></td>
						<td>Epson L121/L8050<br>₱12,000 – ₱18,000</td>
						<td>Epson L1800 A3+<br>₱45,000 – ₱65,000</td>
						<td>Large-format i3200<br>₱169,000 – ₱250,000</td>
					</tr>
					<tr>
						<td><strong>Lanyard Heat Press</strong></td>
						<td>Manual 25×100cm<br>₱17,400 – ₱27,500</td>
						<td>Semi-auto 40×60cm<br>₱44,000 – ₱82,500</td>
						<td>Auto Roller 18×43"<br>₱115,500 – ₱220,000</td>
					</tr>
					<tr>
						<td><strong>Cutter & Tools</strong></td>
						<td>Rotary, punch, iron<br>₱3,000 – ₱5,000</td>
						<td>Hot-cut, manual punch<br>₱8,000 – ₱12,000</td>
						<td>Auto cutting/sealing<br>₱25,000 – ₱40,000</td>
					</tr>
					<tr>
						<td><strong>Supplies (Initial)</strong></td>
						<td>₱5,000</td>
						<td>₱15,000</td>
						<td>₱30,000</td>
					</tr>
					<tr class="total-row">
						<td><strong>Total CAPEX</strong></td>
						<td><strong>₱37,400 – ₱55,500</strong></td>
						<td><strong>₱112,000 – ₱174,500</strong></td>
						<td><strong>₱339,500 – ₱540,000</strong></td>
					</tr>
					<tr>
						<td><strong>Capacity</strong></td>
						<td>200-400/day</td>
						<td>1k-2k/day</td>
						<td>5k+/day</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="recommendation"><strong>Recommended for B2B Start:</strong> <strong>Mid-Volume</strong> setup balances speed and cost.</p>
	</section>

	<section>
		<h2>2. Operational Expenditure (OPEX) – Per Unit Cost</h2>
		<h3>Material Costs by Width (Per Meter)</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Material</th>
						<th>1/2" (12mm)</th>
						<th>3/4" (20mm)</th>
						<th>1" (25mm)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Polyester Ribbon</td>
						<td>₱8.50/m</td>
						<td>₱12.00/m</td>
						<td>₱15.50/m</td>
					</tr>
					<tr>
						<td>Sublimation Paper</td>
						<td>₱1.20/m</td>
						<td>₱1.80/m</td>
						<td>₱2.40/m</td>
					</tr>
					<tr>
						<td>Sublimation Ink</td>
						<td>₱0.80/m</td>
						<td>₱1.20/m</td>
						<td>₱1.60/m</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="footnote"><strong>Standard Loop:</strong> 0.90m (45cm folded). Includes <strong>5% waste factor</strong>.</p>

		<h3>Labor & Utility (Per 100 Lanyards)</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Process Step</th>
						<th>Time / 100</th>
						<th>Rate</th>
						<th>Cost / Piece</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Design & RIP Setup</td>
						<td>15 min</td>
						<td>₱87.50/h</td>
						<td>₱0.22</td>
					</tr>
					<tr>
						<td>Print & Dry</td>
						<td>30 min</td>
						<td>₱87.50/h</td>
						<td>₱0.44</td>
					</tr>
					<tr>
						<td>Press & Transfer</td>
						<td>45 min</td>
						<td>₱87.50/h</td>
						<td>₱0.66</td>
					</tr>
					<tr>
						<td>Trim & Hardware Attach</td>
						<td>50 min</td>
						<td>₱87.50/h</td>
						<td>₱0.73</td>
					</tr>
					<tr>
						<td>QC & Packaging</td>
						<td>10 min</td>
						<td>₱87.50/h</td>
						<td>₱0.15</td>
					</tr>
					<tr class="total-row-alt">
						<td><strong>Subtotal Labor</strong></td>
						<td>150 min</td>
						<td>—</td>
						<td><strong>₱2.19</strong></td>
					</tr>
					<tr>
						<td>Electricity (2.5 kWh)</td>
						<td>—</td>
						<td>₱11.73/kWh</td>
						<td>₱0.29</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>3. Complete Accessory List – Wholesale Pricing</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Accessory</th>
						<th>Price (MOQ 500)</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Bulldog Clip</strong></td>
						<td>₱3.50</td>
						<td>Basic ID card grip</td>
					</tr>
					<tr>
						<td><strong>Swivel J-Hook</strong></td>
						<td>₱4.20</td>
						<td>Rotates 360°, metal</td>
					</tr>
					<tr>
						<td><strong>Lobster Clasp</strong></td>
						<td>₱5.00</td>
						<td>Premium metal release</td>
					</tr>
					<tr>
						<td><strong>Breakaway Connector</strong></td>
						<td>₱5.80</td>
						<td>Safety release (Schools)</td>
					</tr>
					<tr>
						<td><strong>PVC Holder</strong></td>
						<td>₱14.00</td>
						<td>Protects ID card</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="total-cost-note"><strong>Standard Hardware Total:</strong> <strong>₱13.50</strong> (Clip + Breakaway)</p>
	</section>

	<section class="process-flow">
		<h2>4. Process Flow (Sublimation Method)</h2>
		<ol>
			<li><strong>Design & Mirror:</strong> 5 min/batch via RIP software.</li>
			<li><strong>Print:</strong> Dye-sub ink on highest quality mode.</li>
			<li><strong>Wrap & Tape:</strong> Secure ribbon to paper with heat tape.</li>
			<li><strong>Heat Press:</strong> 180-190°C for 40-50 seconds.</li>
			<li><strong>Hot Peel:</strong> Remove paper immediately; cool flat.</li>
			<li><strong>Cut & Seal:</strong> Hot-cut at 90cm to prevent fraying.</li>
			<li><strong>Hardware:</strong> Fold end and crimp with manual press.</li>
		</ol>
	</section>

	<section>
		<h2>5. Volume Pricing & Margin (3/4" Lanyard)</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Volume Tier</th>
						<th>Variable Cost</th>
						<th>Market Price</th>
						<th>Margin</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>100 pcs</td>
						<td>₱24.07</td>
						<td>₱35.00 - ₱40.00</td>
						<td>~35%</td>
					</tr>
					<tr>
						<td>500 pcs</td>
						<td>₱22.53</td>
						<td>₱30.00 - ₱35.00</td>
						<td>~30%</td>
					</tr>
					<tr>
						<td>5,000 pcs</td>
						<td>₱20.30</td>
						<td>₱25.00 - ₱28.00</td>
						<td>~20%</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="risk-matrix">
		<h2>6. Key Risk Factors</h2>
		<div class="grid">
			<div class="risk-item">
				<strong>Color Bleeding (1/2")</strong>
				<p>Use high GSM dense-weave ribbon.</p>
			</div>
			<div class="risk-item">
				<strong>Hardware Stock-outs</strong>
				<p>Maintain 1,000+ pcs buffer stock.</p>
			</div>
			<div class="risk-item">
				<strong>Clogging</strong>
				<p>Print daily purge sheet for Epson head.</p>
			</div>
		</div>
	</section>

	<section class="roi">
		<h2>7. ROI & Payback (Mid-Volume ₱150k CAPEX)</h2>
		<div class="roi-stats">
			<div class="stat"><span>Net Monthly Profit</span> <strong>₱3,940</strong></div>
			<div class="stat"><span>Standard Payback</span> <strong>38 Months</strong></div>
			<div class="stat"><span>With ID Bundle</span> <strong>20 Months</strong></div>
		</div>
		<p class="small">Assumes 500 lanyards/week at ₱9.47 gross profit per piece.</p>
	</section>

	<footer class="docs-footer">
		<p>Document v1.0 • Last Updated Jan 06, 2026</p>
		<p><a href="/admin/docs">← Back to Index</a></p>
	</footer>
</div>

<style>
	:global(body) { background: #f8fafc; }

	.docs-container {
		max-width: 1000px;
		margin: 2rem auto;
		padding: 3rem;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
		font-family: 'Inter', system-ui, sans-serif;
		color: #1e293b;
	}

	.docs-header {
		border-bottom: 2px solid #e2e8f0;
		padding-bottom: 2rem;
		margin-bottom: 3rem;
	}

	h1 { font-size: 2rem; font-weight: 800; color: #0f172a; margin: 0; }
	.meta { color: #64748b; font-size: 0.9rem; margin-top: 0.5rem; }

	.status-chip {
		display: inline-block;
		margin-top: 1rem;
		padding: 0.35rem 0.85rem;
		background: #f1f5f9;
		color: #475569;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 700;
		color: #334155;
		border-left: 4px solid #3b82f6;
		padding-left: 1rem;
		margin: 3.5rem 0 1.5rem;
	}

	h3 { font-size: 1rem; color: #64748b; margin-top: 2rem; text-transform: uppercase; letter-spacing: 0.05em; }

	.table-wrapper { margin: 1.5rem 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
	table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
	th { background: #f8fafc; padding: 1rem; font-weight: 600; border-bottom: 1px solid #e2e8f0; }
	td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }

	.total-row { background: #f8fafc; font-weight: 700; color: #2563eb; }
	.total-row-alt { background: #f8fafc; font-weight: 600; }

	.recommendation {
		background: #eff6ff;
		color: #1e40af;
		padding: 1rem;
		border-radius: 8px;
		font-size: 0.95rem;
		margin-top: 1.5rem;
	}

	.total-cost-note {
		text-align: right;
		font-weight: 700;
		color: #16a34a;
		margin-top: 1rem;
	}

	.grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
	.risk-item { background: #fff5f5; border: 1px solid #feb2b2; padding: 1rem; border-radius: 8px; }
	.risk-item strong { display: block; color: #c53030; font-size: 0.9rem; margin-bottom: 0.5rem; }
	.risk-item p { margin: 0; font-size: 0.85rem; color: #7f1d1d; }

	.roi-stats { display: flex; gap: 2rem; margin: 1.5rem 0; }
	.stat { flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 1.5rem; border-radius: 8px; text-align: center; }
	.stat span { display: block; font-size: 0.8rem; color: #166534; margin-bottom: 0.5rem; }
	.stat strong { font-size: 1.5rem; color: #15803d; }

	.docs-footer { margin-top: 5rem; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 2rem; }
	.docs-footer a { color: #64748b; text-decoration: none; font-weight: 600; }

	@media (max-width: 768px) {
		.grid, .roi-stats { grid-template-columns: 1fr; flex-direction: column; }
		.docs-container { padding: 1.5rem; }
	}
</style>
