<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>LOW END CARD | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>LOW END CARD</h1>
		<p class="meta">Philippines Market • 5-Up A4 Folded-Sheet Method</p>
		<div class="status-chip valid">v1.0 • Jan 2026</div>
	</header>

	<section>
		<h2>1. Process Overview</h2>
		<p>Standard operating procedure for producing 500 ID cards from one material set (50 printable sheets + 50 PET/PVC cores).</p>
		
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Step</th>
						<th>Equipment</th>
						<th>Action</th>
						<th>Time / Set</th>
						<th>Output</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>1. Prep Cores</strong></td>
						<td>Paper cutter</td>
						<td>Cut 50 PET/PVC cores vertically in half</td>
						<td>15 min</td>
						<td>100 half-cores, peeled</td>
					</tr>
					<tr>
						<td><strong>2. Print</strong></td>
						<td>Epson L8050</td>
						<td>Print 10 sheets @ 5-up mirrored front/back</td>
						<td>45 min</td>
						<td>10 printed A4 sheets</td>
					</tr>
					<tr>
						<td><strong>3. Laminate</strong></td>
						<td>Laminator @ 180°C</td>
						<td>Fold sheets, sandwich cores, run through</td>
						<td>20 min</td>
						<td>10 laminated half-sheets</td>
					</tr>
					<tr>
						<td><strong>4. Cut & QC</strong></td>
						<td>Manual die cutter</td>
						<td>Peel film, hand-feed, align & punch</td>
						<td>30 min</td>
						<td>500 cards (2% reject)</td>
					</tr>
					<tr class="total-row">
						<td colspan="3"><strong>Total Cycle Time</strong></td>
						<td><strong>110 min</strong></td>
						<td><strong>~490 good cards</strong></td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>2. Equipment & Material Specifications</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Item</th>
						<th>Specification</th>
						<th>Unit Cost</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Card Sets</strong></td>
						<td>50 printable sheets + 50 cores</td>
						<td>PET: ₱1,250<br>PVC: ₱1,150</td>
						<td>Yields 500 cards/set</td>
					</tr>
					<tr>
						<td><strong>Ink</strong></td>
						<td>Epson 057 OEM (6-bottle set)</td>
						<td>₱3,300/set</td>
						<td>70 mL/bottle; ~6k sides</td>
					</tr>
					<tr>
						<td><strong>Electricity</strong></td>
						<td>Printer + laminator</td>
						<td>₱11.73/kWh</td>
						<td>0.017 kWh per sheet</td>
					</tr>
					<tr>
						<td><strong>Labor Rate</strong></td>
						<td>Manila unskilled</td>
						<td>₱700/8h</td>
						<td>₱1.458/min</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>3. True Variable Cost per Card (PET Core + OEM Ink)</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Cost Element</th>
						<th>Calculation</th>
						<th>Cost/Card</th>
					</tr>
				</thead>
				<tbody>
					<tr class="section-header"><td colspan="3">Materials</td></tr>
					<tr>
						<td>PET Card Set</td>
						<td>₱1,250 ÷ 500 cards</td>
						<td>₱2.50</td>
					</tr>
					<tr>
						<td>Inkjet Ink</td>
						<td>0.32 mL/sheet ÷ 5 cards × ₱7.86/mL</td>
						<td>₱0.50</td>
					</tr>
					<tr>
						<td>Electricity</td>
						<td>0.017 kWh ÷ 5 cards × ₱11.73/kWh</td>
						<td>₱0.04</td>
					</tr>
					<tr>
						<td>Film waste & depr.</td>
						<td>Estimated</td>
						<td>₱0.05</td>
					</tr>
					<tr class="section-header"><td colspan="3">Labor</td></tr>
					<tr>
						<td>1. Cut core & peel</td>
						<td>15 min ÷ 500 × ₱87.50/h</td>
						<td>₱0.35</td>
					</tr>
					<tr>
						<td>2. Print mirrored sheets</td>
						<td>45 min ÷ 500 × ₱87.50/h</td>
						<td>₱1.05</td>
					</tr>
					<tr>
						<td>3. Fold & laminate</td>
						<td>20 min ÷ 500 × ₱87.50/h</td>
						<td>₱0.49</td>
					</tr>
					<tr>
						<td>4. Die-cut + QC</td>
						<td>35 min ÷ 500 × ₱87.50/h</td>
						<td>₱0.82</td>
					</tr>
					<tr class="total-row final">
						<td colspan="2">TRUE VARIABLE COST</td>
						<td>₱5.80</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3>Alternative Scenarios</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Scenario</th>
						<th>Material Adj.</th>
						<th>Ink Adj.</th>
						<th>Total/Card</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>PVC Core</strong></td>
						<td>-₱0.20</td>
						<td>—</td>
						<td><strong>₱5.60</strong></td>
					</tr>
					<tr>
						<td><strong>3rd-Party Ink</strong></td>
						<td>—</td>
						<td>-₱0.32</td>
						<td><strong>₱5.48</strong></td>
					</tr>
					<tr>
						<td><strong>PVC + 3rd-Party</strong></td>
						<td>-₱0.20</td>
						<td>-₱0.32</td>
						<td><strong>₱5.28</strong></td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>4. OPEX Considerations (Semi-Fixed)</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Item</th>
						<th>Est. Cost/Card</th>
						<th>Basis</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Spoilage & Rejects</td>
						<td>₱0.30</td>
						<td>5% fail rate</td>
					</tr>
					<tr>
						<td>Packaging</td>
						<td>₱0.50</td>
						<td>Basic polybag</td>
					</tr>
					<tr>
						<td>Overhead & Delivery</td>
						<td>₱1.15</td>
						<td>Amortized rent/shipping</td>
					</tr>
					<tr class="total-row final">
						<td colspan="2">BASE COST + OPEX LOAD</td>
						<td>₱8.95</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="pricing-section">
		<h2>5. Pricing & Margin Structure</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Tier</th>
						<th>Price/Card</th>
						<th>Gross Margin</th>
						<th>Use Case</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Floor Price</strong></td>
						<td>₱12.00</td>
						<td>25%</td>
						<td>High volume (1,000+)</td>
					</tr>
					<tr>
						<td><strong>Standard B2B</strong></td>
						<td>₱15.00</td>
						<td>40%</td>
						<td>Schools (100-500 qty)</td>
					</tr>
					<tr>
						<td><strong>Premium</strong></td>
						<td>₱18.00+</td>
						<td>50%+</td>
						<td>Rush, design included</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="margin-calc"><strong>Margin Calculation (₱15 price):</strong> <code>(₱15.00 - ₱8.95) ÷ ₱15.00 = 40.3%</code></p>
	</section>

	<section>
		<h2>6. Key Risk Factors & Mitigation</h2>
		<ul class="risk-list">
			<li><strong>Manual Die-Cut Misalignment:</strong> Spot-check every 10th sheet.</li>
			<li><strong>Ink Smudging:</strong> Use highest-quality mode; 10-min dry time.</li>
			<li><strong>Lamination Bubbles:</strong> Pre-heat 10 min; slow feed.</li>
			<li><strong>Material Volatility:</strong> Lock 3-month supplier contracts.</li>
		</ul>
	</section>

	<section class="summary-box">
		<h2>7. Summary Metrics</h2>
		<ul>
			<li><strong>Throughput:</strong> 277 cards/hour (single operator)</li>
			<li><strong>Daily Capacity:</strong> ~2,200 cards (8-hour shift)</li>
			<li><strong>Competitive MOQ:</strong> 100 cards (break-even point)</li>
		</ul>
	</section>

	<footer class="docs-footer">
		<p>Document v1.0 • Last Updated Jan 2026</p>
		<p><a href="/admin/docs">← Back to Index</a></p>
	</footer>
</div>

<style>
	:global(body) { background: #fdfdfd; }

	.docs-container {
		max-width: 900px;
		margin: 2rem auto;
		padding: 3rem;
		background: #fff;
		border-radius: 8px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
		font-family: 'Segoe UI', system-ui, sans-serif;
		color: #333;
		line-height: 1.6;
	}

	.docs-header {
		border-bottom: 3px solid #000;
		padding-bottom: 2rem;
		margin-bottom: 3rem;
	}

	h1 { font-size: 2.25rem; font-weight: 900; color: #000; margin: 0; text-transform: uppercase; }
	.meta { color: #666; font-size: 0.9rem; margin-top: 0.5rem; }

	.status-chip {
		display: inline-block;
		margin-top: 1rem;
		padding: 0.25rem 0.75rem;
		background: #000;
		color: #fff;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 800;
		background: #000;
		color: #fff;
		padding: 0.5rem 1rem;
		margin: 3rem 0 1.5rem;
		text-transform: uppercase;
	}

	h3 { font-size: 1.1rem; color: #444; margin-top: 2rem; }

	.table-wrapper { margin: 1.5rem 0; border: 1px solid #eee; overflow: hidden; }
	table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
	th { background: #f9f9f9; padding: 1rem; font-weight: 800; border-bottom: 1px solid #eee; }
	td { padding: 1rem; border-bottom: 1px solid #eee; }

	.section-header td { background: #f1f1f1; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; color: #666; }
	.total-row td { background: #000; color: #fff; font-weight: 800; }
	.total-row.final td { background: #e53e3e; color: #fff; font-size: 1.1rem; }

	.pricing-section .table-wrapper { border-color: #000; }
	.margin-calc { font-size: 0.9rem; color: #e53e3e; font-weight: 700; margin-top: 1rem; }

	.risk-list { padding-left: 1.5rem; }
	.risk-list li { margin-bottom: 0.5rem; }
	.risk-list li strong { color: #c53030; }

	.summary-box { background: #f8f8f8; padding: 0.5rem 2rem 2rem; border-radius: 4px; margin-top: 4rem; }
	.summary-box h2 { background: #444; }

	.docs-footer { margin-top: 5rem; text-align: center; font-size: 0.8rem; color: #999; border-top: 1px solid #eee; padding-top: 2rem; }
	.docs-footer a { color: #666; text-decoration: none; font-weight: 700; }

	@media (max-width: 768px) {
		.docs-container { padding: 1.5rem; }
	}
</style>
