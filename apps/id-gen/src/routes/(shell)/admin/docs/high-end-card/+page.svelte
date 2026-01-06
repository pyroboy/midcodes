<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>HIGH END CARD | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>HIGH END CARD</h1>
		<p class="meta">Strategic Procurement Analysis • Production Tiers</p>
		<div class="status-chip highlight">Strategic Asset</div>
	</header>

	<section class="summary">
		<p>
			Definitive breakdown across four production tiers—from budget thermal to industrial UV—specifically for RFID/NFC cards, including equipment costs, MOQs, durability ratings, and localization impacts.
		</p>
	</section>

	<section>
		<h2>🏭 4 Production Architectures Compared</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Tier</th>
						<th>Technology</th>
						<th>PH Use Case</th>
						<th>Speed</th>
						<th>Durability</th>
						<th>Security</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Cheaper Thermal</strong></td>
						<td>Direct-to-Card (DTC)</td>
						<td>Schools, SMEs</td>
						<td>150 cards/hr</td>
						<td>★★★☆☆</td>
						<td>HoloKote only</td>
					</tr>
					<tr>
						<td><strong>Premium Thermal</strong></td>
						<td>Retransfer</td>
						<td>Gov, Banking</td>
						<td>200 cards/hr</td>
						<td>★★★★☆</td>
						<td>UV fluoro</td>
					</tr>
					<tr>
						<td><strong>Cheaper UV</strong></td>
						<td>XP600 Flatbed (A4)</td>
						<td>Retail, Hotel Keys</td>
						<td>30 cards/hr</td>
						<td>★★★★★</td>
						<td>Visual texture</td>
					</tr>
					<tr>
						<td><strong>Premium UV</strong></td>
						<td>Industrial (A3+)</td>
						<td>Luxury, Embossed</td>
						<td>50 cards/hr</td>
						<td>★★★★★</td>
						<td>3D/Tactile</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="tier-section thermal">
		<div class="tier-header">
			<span class="icon">🔥</span>
			<h2>CHEAPER THERMAL SOLUTIONS (Entry-Level DTC)</h2>
		</div>
		
		<h3>Equipment & CAPEX</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Printer</th>
						<th>Supplier</th>
						<th>Price (₱)</th>
						<th>MOQ</th>
						<th>Warranty</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>IDP Smart-31S</td>
						<td>Philcopy</td>
						<td>₱61,020</td>
						<td>1 unit</td>
						<td>3-yr local</td>
					</tr>
					<tr>
						<td>Magicard 300 NEO</td>
						<td>CCS</td>
						<td>₱69,000</td>
						<td>1 unit</td>
						<td>3-yr local</td>
					</tr>
					<tr>
						<td>Magicard 600 NEO</td>
						<td>CCS</td>
						<td>₱89,000</td>
						<td>1 unit</td>
						<td>3-yr local</td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="caption">Amortization (50k cards): <strong>₱1.22 – ₱1.78/card</strong></p>

		<h3>Consumables & OPEX</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Ribbon Type</th>
						<th>Yield</th>
						<th>Price (₱)</th>
						<th>Cost/Card</th>
						<th>UV Security</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>YMCKO (Standard)</td>
						<td>250 prints</td>
						<td>₱5,500</td>
						<td>₱22.00</td>
						<td>❌ None</td>
					</tr>
					<tr>
						<td>YMCKO (Magicard)</td>
						<td>300 prints</td>
						<td>₱5,500</td>
						<td>₱18.33</td>
						<td>✅ HoloKote</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="cost-card entry">
			<h4>✅ TRUE COST: Cheaper Thermal (NTAG215 NFC)</h4>
			<div class="cost-split">
				<div class="cost-item"><span>Blank NTAG215 (Import)</span> <strong>₱7.50</strong></div>
				<div class="cost-item"><span>YMCKO Ribbon</span> <strong>₱18.33</strong></div>
				<div class="cost-item"><span>Labor + Power + Depr.</span> <strong>₱1.79</strong></div>
				<div class="cost-total">TOTAL COST: ₱37.00 (with pkg)</div>
			</div>
		</div>
	</section>

	<section class="tier-section premium-thermal">
		<div class="tier-header">
			<span class="icon">🚀</span>
			<h2>PREMIUM THERMAL SOLUTIONS (Retransfer)</h2>
		</div>
		
		<div class="benefit-box">
			<strong>Advantage:</strong> Retransfer encapsulates the chip—ink is printed on a film then laminated, protecting sensitive NFC chips at lower temperatures.
		</div>

		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Printer</th>
						<th>Price (₱)</th>
						<th>Key Feature</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>Magicard Prima 4 Uno</td>
						<td>₱230,650</td>
						<td>Chip protection</td>
					</tr>
					<tr>
						<td>DNP 600</td>
						<td>₱354,330</td>
						<td>Industrial 600 dpi</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="cost-card premium">
			<h4>✅ TRUE COST: Premium Thermal (NTAG216 NFC)</h4>
			<div class="cost-split">
				<div class="cost-item"><span>Blank NTAG216 (Import)</span> <strong>₱10.26</strong></div>
				<div class="cost-item"><span>YMCK-UV Ribbon</span> <strong>₱33.33</strong></div>
				<div class="cost-item"><span>Labor + Power + Depr.</span> <strong>₱3.73</strong></div>
				<div class="cost-total">TOTAL COST: ₱62.32 (with pkg)</div>
			</div>
		</div>
	</section>

	<section class="tier-section uv">
		<div class="tier-header">
			<span class="icon">💡</span>
			<h2>CHEAPER UV SOLUTIONS (XP600 Flatbed)</h2>
		</div>
		
		<div class="benefit-box green">
			<strong>Advantage:</strong> No ribbon cost—ink is 10x cheaper than thermal. Print is cured instantly and scratch-proof.
		</div>

		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Ink Type</th>
						<th>Yield</th>
						<th>Price (₱)</th>
						<th>Cost/Card</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>UV-Curable (6-color)</td>
						<td>10,000 cards</td>
						<td>₱12,000/L</td>
						<td>₱1.20</td>
					</tr>
					<tr>
						<td>Varnish Finish</td>
						<td>5,000 cards</td>
						<td>₱2,500/500ml</td>
						<td>₱0.50</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="cost-card uv-entry">
			<h4>✅ TRUE COST: Cheaper UV (RFID 125kHz)</h4>
			<div class="cost-split">
				<div class="cost-item"><span>RFID Card (Import)</span> <strong>₱2.90</strong></div>
				<div class="cost-item"><span>UV Ink</span> <strong>₱1.20</strong></div>
				<div class="cost-item"><span>Manual Labor + Depr.</span> <strong>₱5.37</strong></div>
				<div class="cost-total">TOTAL COST: ₱18.23 (with pkg)</div>
			</div>
		</div>
	</section>

	<section class="tier-section industrial-uv">
		<div class="tier-header">
			<span class="icon">🏗️</span>
			<h2>PREMIUM UV SOLUTIONS (Industrial Flatbed)</h2>
		</div>
		
		<p><strong>Industrial Tech:</strong> Cuyi 9060 / Mimaki UJF-3042. Supports 3D embossed tactile effects, braille, and white ink recirculation.</p>

		<div class="cost-card industrial">
			<h4>✅ TRUE COST: Premium UV (NTAG216 NFC)</h4>
			<div class="cost-split">
				<div class="cost-item"><span>Blank NTAG216 (Import)</span> <strong>₱10.26</strong></div>
				<div class="cost-item"><span>UV Ink (8-color)</span> <strong>₱0.90</strong></div>
				<div class="cost-item"><span>Labor + Power + Depr.</span> <strong>₱7.13</strong></div>
				<div class="cost-total">TOTAL COST: ₱44.15 (with luxury pkg)</div>
			</div>
		</div>
	</section>

	<section class="localization">
		<h2>📊 Localization Impact: Import vs. Local Blanks</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Chip Type</th>
						<th>Local (₱)</th>
						<th>Import (₱)</th>
						<th>Savings</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>RFID 125kHz</td>
						<td>₱6.90</td>
						<td>₱2.90</td>
						<td class="green-text">58% cheaper</td>
					</tr>
					<tr>
						<td>MIFARE 1K</td>
						<td>₱42.00</td>
						<td>₱11.40</td>
						<td class="green-text">73% cheaper</td>
					</tr>
					<tr>
						<td>NTAG215</td>
						<td>₱48.00</td>
						<td>₱7.50</td>
						<td class="green-text">84% cheaper</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="recommendation">
		<div class="rec-box">
			<h3>🎯 Final Strategic Recommendation</h3>
			<ul>
				<li><strong>Best Value NFC:</strong> Your existing Inkjet + Lamination + Import NTAG215 (₱20.28 cost). Unbeatable.</li>
				<li><strong>Speed/Security:</strong> Upgrade to Retransfer (Prima 4) for dual-sided 200/hr capacity.</li>
				<li><strong>Luxury:</strong> Industrial UV for tactile/embossed effects only.</li>
			</ul>
		</div>
	</section>

	<footer class="docs-footer">
		<p>© 2026 Kanaya Identity Solutions • Confidential Planning Document</p>
		<p><a href="/admin/docs">← Back to Index</a></p>
	</footer>
</div>

<style>
	:global(body) { background: #f4f7f6; }

	.docs-container {
		max-width: 1000px;
		margin: 2rem auto;
		padding: 3rem;
		background: #fff;
		border-radius: 16px;
		box-shadow: 0 4px 20px rgba(0,0,0,0.08);
		font-family: 'Inter', system-ui, sans-serif;
		color: #2d3748;
	}

	.docs-header {
		border-bottom: 2px solid #edf2f7;
		padding-bottom: 2rem;
		margin-bottom: 2.5rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	h1 { font-size: 1.8rem; font-weight: 800; line-height: 1.2; max-width: 700px; }
	.meta { color: #718096; font-size: 0.9rem; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 1px; }

	.status-chip {
		background: #ebf8ff;
		color: #2b6cb0;
		padding: 0.5rem 1rem;
		border-radius: 30px;
		font-weight: 700;
		font-size: 0.75rem;
	}

	.summary {
		background: #f8fafc;
		padding: 1.5rem;
		border-radius: 12px;
		border-left: 4px solid #4a5568;
		margin-bottom: 3rem;
		font-size: 1.05rem;
	}

	h2 { font-size: 1.4rem; font-weight: 800; margin: 3rem 0 1.5rem; color: #1a202c; text-transform: uppercase; letter-spacing: 0.5px; }
	h3 { font-size: 1.1rem; color: #4a5568; margin-top: 2rem; }

	.table-wrapper {
		margin: 1.5rem 0;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		overflow: hidden;
	}

	table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
	th { background: #f7fafc; padding: 1rem; font-weight: 700; border-bottom: 2px solid #edf2f7; }
	td { padding: 1rem; border-bottom: 1px solid #edf2f7; }

	.tier-section {
		margin: 4rem 0;
		padding: 2rem;
		border-radius: 16px;
		background: #fff;
		border: 1px solid #e2e8f0;
	}

	.tier-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; border-bottom: 1px solid #edf2f7; padding-bottom: 1rem; }
	.tier-header h2 { margin: 0; font-size: 1.25rem; }

	.benefit-box {
		padding: 1.25rem;
		border-radius: 8px;
		background: #fdf2f2;
		color: #9b2c2c;
		border-left: 4px solid #f56565;
		margin: 1.5rem 0;
		font-size: 0.95rem;
	}

	.benefit-box.green {
		background: #f0fff4;
		color: #276749;
		border-left-color: #48bb78;
	}

	.cost-card {
		margin-top: 2rem;
		padding: 1.5rem;
		border-radius: 12px;
		background: #2d3748;
		color: #fff;
	}

	.cost-card h4 { margin: 0 0 1.5rem; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; color: #a0aec0; }
	.cost-split { display: flex; flex-direction: column; gap: 0.75rem; }
	.cost-item { display: flex; justify-content: space-between; font-size: 1rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; }
	.cost-total { margin-top: 1rem; font-size: 1.4rem; font-weight: 900; text-align: right; color: #fbd38d; }

	.green-text { color: #38a169; font-weight: 700; }

	.rec-box {
		background: #2d3748;
		color: #fff;
		padding: 2.5rem;
		border-radius: 16px;
		margin-top: 5rem;
	}

	.rec-box h3 { color: #fbd38d; margin-top: 0; }
	.rec-box ul { padding-left: 1.5rem; margin-bottom: 0; }
	.rec-box li { margin-bottom: 1rem; line-height: 1.4; }

	.docs-footer { margin-top: 4rem; text-align: center; font-size: 0.8rem; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 2rem; }
	.docs-footer a { color: #718096; text-decoration: none; }

	@media (max-width: 768px) {
		.docs-container { padding: 1.5rem; }
		.tier-section { padding: 1.5rem; }
	}
</style>
