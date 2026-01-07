<svelte:head>
	<title>03 Property Overview - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">03</span>
		<h1>Property Overview</h1>
	</header>

	<section class="section">
		<h2>Building Specifications</h2>
		<table class="info-table">
			<tbody>
				<tr>
					<th>Building Type</th>
					<td>Mixed-Use (Residential Dormitory & Commercial Ground Floor)</td>
				</tr>
				<tr>
					<th>Number of Floors</th>
					<td>3 Floors (Rooftop Deck pending)</td>
				</tr>
				<tr>
					<th>Renovation Status</th>
					<td>Ongoing (Kitchen & Roof upgrades 2024)</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Capacity Summary</h2>
		<div class="metrics-grid">
			<div class="metric">
				<span class="metric-label">Total Rooms</span>
				<span class="metric-value">8 Rooms</span>
			</div>
			<div class="metric">
				<span class="metric-label">Bedspace Capacity</span>
				<span class="metric-value">~24 pax</span>
			</div>
			<div class="metric">
				<span class="metric-label">Private Capacity</span>
				<span class="metric-value">~6 pax</span>
			</div>
			<div class="metric">
				<span class="metric-label">Total Capacity</span>
				<span class="metric-value">30 pax</span>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Unit Types & Rates</h2>
		<table class="pricing-table">
			<thead>
				<tr>
					<th>Unit Type</th>
					<th>Capacity</th>
					<th>Monthly Rate</th>
					<th>Inclusions</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Standard Bedspace</strong></td>
					<td>4-6 pax</td>
					<td>₱1,500 - ₱1,700 /head</td>
					<td>Water/Lights (Basic)</td>
				</tr>
				<tr>
					<td><strong>Private Room (Solo)</strong></td>
					<td>1 pax</td>
					<td>₱3,500 /room</td>
					<td>Sub-metered Utilities</td>
				</tr>
				<tr>
					<td><strong>Private Room (Duo)</strong></td>
					<td>2 pax</td>
					<td>₱4,500 /room</td>
					<td>Sub-metered Utilities</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Floor Plan Summary</h2>
		<div class="floor-list">
			<div class="floor-item">
				<h3>Ground Floor</h3>
				<ul>
					<li><strong>Commercial Space:</strong> "The Original Paeng's Fried Chicken" (Rented to Cousin)</li>
					<li><strong>Office/Reception:</strong> Caretaker's station</li>
					<li><strong>Utilities:</strong> Water Cistern & Pump room</li>
				</ul>
			</div>
			<div class="floor-item">
				<h3>2nd Floor (Main Dorm)</h3>
				<ul>
					<li>Aircon Rooms</li>
					<li>Standard Bedspace Rooms</li>
					<li>Shared Comfort Rooms (CRs)</li>
				</ul>
			</div>
			<div class="floor-item">
				<h3>3rd Floor (Expansion)</h3>
				<ul>
					<li>Private Rooms</li>
					<li>Communal Kitchen & Dining Area</li>
					<li>Study Area / Deck</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Building Features</h2>
		<ul class="feature-list">
			<li><strong>Safety:</strong> CCTV Surveillance (Gate & Hallways), Fire Extinguishers.</li>
			<li><strong>Connectivity:</strong> High-speed Fiber WiFi (Voucher System planned).</li>
			<li><strong>Utilities:</strong> Reliable Water Supply (Cistern w/ Pump), Backup Generator ready.</li>
			<li><strong>Convenience:</strong> In-house Canteen/Food Hub, Laundry Area.</li>
		</ul>
	</section>
</article>

<style>
	.chapter { max-width: 800px; }
	.chapter-header { margin-bottom: 3rem; }
	.chapter-number {
		font-family: var(--font-header);
		font-size: 4rem;
		font-weight: 700;
		color: var(--color-primary);
		opacity: 0.3;
		line-height: 1;
	}
	.chapter-header h1 { font-size: 3rem; margin-top: 0.5rem; line-height: 1.1; }
	.section { margin-bottom: 3rem; }
	.section h2 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--color-gray-200);
	}
	.section h3 { font-size: 1.1rem; margin-bottom: 0.75rem; text-transform: none; }
	.placeholder { background: #fef3c7; padding: 0.25rem 0.5rem; border-left: 3px solid #f59e0b; }
	.info-table, .pricing-table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
	.info-table th, .info-table td, .pricing-table th, .pricing-table td {
		padding: 1rem;
		border: 1px solid var(--color-gray-200);
		text-align: left;
	}
	.info-table th { background: var(--color-gray-100); font-weight: 600; width: 35%; }
	.pricing-table th { background: var(--color-black); color: white; font-weight: 600; }
	.pricing-table tbody tr:nth-child(even) { background: var(--color-gray-100); }
	.metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
	@media (max-width: 600px) { .metrics-grid { grid-template-columns: 1fr; } }
	.metric {
		background: white;
		border: 2px solid var(--color-black);
		padding: 1.5rem;
		text-align: center;
	}
	.metric-label { display: block; font-size: 0.85rem; text-transform: uppercase; font-weight: 600; color: #71717a; margin-bottom: 0.5rem; }
	.metric-value { font-family: var(--font-header); font-size: 1.75rem; font-weight: 700; }
	.floor-list { display: grid; gap: 1rem; }
	.floor-item { background: var(--color-gray-100); padding: 1.5rem; border-left: 4px solid var(--color-primary); }
	.floor-item ul { margin: 0; padding-left: 1.5rem; }
	.floor-item li { margin-bottom: 0.5rem; }
	.feature-list { list-style: none; padding: 0; }
	.feature-list li { position: relative; padding-left: 2rem; margin-bottom: 1rem; font-size: 1.1rem; }
	.feature-list li::before { content: '✓'; position: absolute; left: 0; font-weight: 700; color: var(--color-accent, #10b981); }
</style>
