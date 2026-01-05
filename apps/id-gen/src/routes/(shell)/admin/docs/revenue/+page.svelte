<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// DYNAMIC CALCULATOR STATE
	let studentCount = $state(500);
	let cardPrice = $state(150); // Premium RFID Price
	let subPrice = $state(50); // Annual App Fee

	// Derived Calculations
	let hardwareRev = $derived(studentCount * cardPrice);
	let softwareRev = $derived(studentCount * subPrice);
	let totalYear1 = $derived(hardwareRev + softwareRev);
	let totalYear5 = $derived(hardwareRev + softwareRev * 5);
</script>

<svelte:head>
	<title>Advanced Revenue Projection | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<div class="header-top">
			<h1>Advanced Revenue Intelligence</h1>
			<span class="badge">Financial Model</span>
		</div>
		<p class="meta">Status: PROJECTION • Currency: PHP</p>
		<p class="subject">Subject: Unit Economics, Recurring Revenue Models, and Global SaaS Scaling</p>
	</header>

	<nav class="toc">
		<h2>Financial Models</h2>
		<ol>
			<li><a href="#unit-economics">1. Unit Economics (Cost Analysis)</a></li>
			<li><a href="#schools">2. Education Sector Model (Hybrid)</a></li>
			<li><a href="#corporate">3. Corporate Ecosystems (Hardware)</a></li>
			<li><a href="#saas">4. Global SaaS Expansion (The Unicorn)</a></li>
			<li><a href="#demographics">5. Target Demographics</a></li>
		</ol>
	</nav>

	<section id="unit-economics">
		<h2>1. Unit Economics: The "Per Card" Truth</h2>
		<p class="subtext">Before scaling, we must ensure the single unit is profitable.</p>

		<div class="grid-2">
			<div class="card cost">
				<h3>📉 Cost of Goods Sold (COGS)</h3>
				<p><strong>Production Method:</strong> In-House (Epson L8050)</p>
				<table class="micro-table">
					<tbody>
						<tr>
							<td>PVC Sheet (A4 cut to ID)</td>
							<td class="num">₱ 4.00</td>
						</tr>
						<tr>
							<td>Epson Ink (6-color mix)</td>
							<td class="num">₱ 1.50</td>
						</tr>
						<tr>
							<td>Laminate Overlay</td>
							<td class="num">₱ 2.00</td>
						</tr>
						<tr>
							<td>RFID Inlay (Mifare 1K)</td>
							<td class="num">₱ 14.00</td>
						</tr>
						<tr>
							<td><strong>TOTAL RAW COST</strong></td>
							<td class="num bold">₱ 21.50</td>
						</tr>
					</tbody>
				</table>
			</div>

			<div class="card profit">
				<h3>📈 Profit Margins</h3>
				<p><strong>Scenario:</strong> Selling Premium School RFID</p>
				<table class="micro-table">
					<tbody>
						<tr>
							<td>Selling Price</td>
							<td class="num text-green">₱ 150.00</td>
						</tr>
						<tr>
							<td>Less: Raw Cost</td>
							<td class="num text-red">(₱ 21.50)</td>
						</tr>
						<tr>
							<td>Less: Labor/Elec (Est)</td>
							<td class="num text-red">(₱ 5.00)</td>
						</tr>
						<tr class="highlight">
							<td><strong>NET PROFIT PER ID</strong></td>
							<td class="num bold text-green">₱ 123.50</td>
						</tr>
						<tr>
							<td><strong>Margin Percentage</strong></td>
							<td class="num">82%</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>
	</section>

	<section id="schools">
		<h2>2. Education Sector: The Recurring Revenue Engine</h2>
		<div class="alert-box">
			<strong>The Strategy:</strong> Sell the ID Card once (High Margin), but sell the <strong>Safety Subscription</strong> every year.
		</div>

		<div class="calculator-box">
			<h3>⚡ Live Scenario Simulator</h3>
			<div class="inputs">
				<label>Students: <input type="number" bind:value={studentCount} /></label>
				<label>ID Price (One-time): <input type="number" bind:value={cardPrice} /></label>
				<label>App Fee (Yearly): <input type="number" bind:value={subPrice} /></label>
			</div>
			<div class="outputs">
				<div class="out-row">
					<span>Year 1 Revenue:</span>
					<strong>₱ {totalYear1.toLocaleString()}</strong>
				</div>
				<div class="out-row recurring">
					<span>5-Year Lifetime Value (LTV):</span>
					<strong>₱ {totalYear5.toLocaleString()}</strong>
				</div>
			</div>
		</div>

		<h3>Projected Revenue by School Size</h3>
		<table class="data-table">
			<thead>
				<tr>
					<th>School Tier</th>
					<th>Students</th>
					<th>Hardware Profit (Year 1)</th>
					<th>SaaS Revenue (Recurring/Yr)</th>
					<th>Total 3-Year Value</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Tiny Montessori</strong></td>
					<td>150</td>
					<td>₱ 18,525</td>
					<td>₱ 7,500</td>
					<td><strong>₱ 41,025</strong></td>
				</tr>
				<tr>
					<td><strong>Private High School</strong></td>
					<td>1,000</td>
					<td>₱ 123,500</td>
					<td>₱ 50,000</td>
					<td><strong>₱ 273,500</strong></td>
				</tr>
				<tr>
					<td><strong>Public National HS</strong><br />(Low Price ₱50 / No Sub)</td>
					<td>3,000</td>
					<td>₱ 85,500<br /><small>(Lower margin @ ₱50 price)</small></td>
					<td>₱ 0</td>
					<td><strong>₱ 85,500</strong></td>
				</tr>
			</tbody>
		</table>
	</section>

	<section id="corporate">
		<h2>3. Corporate &amp; Government: Hardware Ecosystems</h2>
		<p class="subtext">Low volume, but massive ticket size due to hardware integration.</p>

		<div class="ecosystem-grid">
			<div class="eco-card">
				<h3>🏢 Small Business Package</h3>
				<p><strong>Target:</strong> Co-working Space / Gym</p>
				<ul>
					<li>100 RFID Cards: ₱15,000</li>
					<li>1x Door Access Controller: ₱5,000</li>
					<li>1x Magnetic Lock Kit: ₱3,500</li>
					<li>Installation Labor: ₱5,000</li>
				</ul>
				<div class="total">Total Contract: ₱28,500</div>
			</div>

			<div class="eco-card">
				<h3>🏭 Industrial / Construction</h3>
				<p><strong>Target:</strong> Construction Site (Panglao)</p>
				<ul>
					<li>500 Worker IDs: ₱60,000</li>
					<li>2x Rugged Biometric Timekeeper: ₱25,000</li>
					<li>Payroll Software Integration: ₱15,000</li>
				</ul>
				<div class="total">Total Contract: ₱100,000</div>
			</div>

			<div class="eco-card premium">
				<h3>🏛️ Smart School / LGU</h3>
				<p><strong>Target:</strong> Private University</p>
				<ul>
					<li>2,000 Student IDs: ₱300,000</li>
					<li>4x Flap Barrier Turnstiles: ₱240,000</li>
					<li>SMS Blaster System: ₱50,000</li>
					<li>Server Setup: ₱50,000</li>
				</ul>
				<div class="total">Total Contract: ₱640,000+</div>
			</div>
		</div>
	</section>

	<section id="saas">
		<h2>4. Global SaaS: The "Export" Model</h2>
		<p><strong>The Pivot:</strong> Selling the <em>Kanaya Studio</em> software to other print shops.</p>
		
		<table class="data-table">
			<thead>
				<tr>
					<th>Market Tier</th>
					<th>Target Audience</th>
					<th>Price Point</th>
					<th>Volume Goal</th>
					<th>Monthly Recurring Revenue (MRR)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Domestic (PH)</strong></td>
					<td>"Piso Print" Shops / Internet Cafes</td>
					<td>₱1,500 / month</td>
					<td>100 Shops</td>
					<td><strong>₱ 150,000 / mo</strong></td>
				</tr>
				<tr>
					<td><strong>Emerging (Indo/Vietnam)</strong></td>
					<td>ID Manufacturers</td>
					<td>$29 / month</td>
					<td>500 Users</td>
					<td><strong>$ 14,500 / mo (₱800k)</strong></td>
				</tr>
				<tr>
					<td><strong>Western (US/EU)</strong></td>
					<td>Event Planners / Agencies</td>
					<td>$99 / month<br /><small>(Enterprise Whitelabel)</small></td>
					<td>50 Agencies</td>
					<td><strong>$ 4,950 / mo (₱275k)</strong></td>
				</tr>
			</tbody>
		</table>
	</section>

	<section id="demographics">
		<h2>5. Target Demographics &amp; Psychology</h2>

		<div class="persona-list">
			<div class="persona">
				<h4>👮 The "Security Theater" Client (School Principal)</h4>
				<p><strong>Age:</strong> 45-60 | <strong>Tech Level:</strong> Low</p>
				<p><strong>Motivation:</strong> Fear. They are terrified of a "kidnapping" incident or outsiders entering.</p>
				<p><strong>The Upsell:</strong> "SMS Notifications." They will pay extra so they can tell parents: 'We text you when your child arrives.'</p>
			</div>

			<div class="persona">
				<h4>👷 The "Payroll" Client (Site Engineer)</h4>
				<p><strong>Age:</strong> 30-45 | <strong>Tech Level:</strong> Medium</p>
				<p><strong>Motivation:</strong> Fraud. They hate paying 'ghost employees' or workers who sneak out early.</p>
				<p><strong>The Upsell:</strong> "Biometric Linking." The ID card must match the fingerprint to stop buddy-punching.</p>
			</div>

			<div class="persona">
				<h4>👨‍💻 The "Lazy" Client (Print Shop Owner)</h4>
				<p><strong>Age:</strong> 20-35 | <strong>Tech Level:</strong> High</p>
				<p><strong>Motivation:</strong> Speed. They hate editing Photoshop templates manually until 2 AM.</p>
				<p><strong>The Upsell:</strong> "Automation." Sell them the SaaS tool that does 5 hours of work in 5 minutes.</p>
			</div>
		</div>
	</section>

	<footer class="docs-footer">
		<p>Kanaya Financial Intelligence Unit • Confidential</p>
	</footer>
</div>

<style>
	.docs-container {
		max-width: 950px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', system-ui, sans-serif;
		color: #1a202c;
	}
	
	.docs-header {
		border-bottom: 4px solid #2b6cb0;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
	}
	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.docs-header h1 {
		color: #2c5282;
		margin: 0;
		font-size: 2rem;
	}
	.badge {
		background: #2b6cb0;
		color: white;
		padding: 0.3rem 0.8rem;
		border-radius: 4px;
		font-weight: bold;
		font-size: 0.8rem;
		text-transform: uppercase;
	}
	.meta {
		color: #718096;
		font-family: monospace;
		margin-top: 0.5rem;
	}

	/* Navigation */
	.toc {
		background: #ebf8ff;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 3rem;
		border: 1px solid #bee3f8;
	}
	.toc h2 {
		margin: 0 0 1rem;
		color: #2b6cb0;
		font-size: 1.2rem;
	}
	.toc ol {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
		padding-left: 1.5rem;
	}
	.toc a {
		text-decoration: none;
		color: #2c5282;
		font-weight: 600;
	}

	section {
		margin-bottom: 4rem;
	}
	h2 {
		font-size: 1.6rem;
		color: #2d3748;
		border-left: 5px solid #2b6cb0;
		padding-left: 1rem;
		margin-bottom: 1.5rem;
	}
	
	/* Grids */
	.grid-2 {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
	}
	@media (max-width: 768px) {
		.grid-2 {
			grid-template-columns: 1fr;
		}
	}

	.card {
		background: white;
		border: 1px solid #e2e8f0;
		padding: 1.5rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
	}
	.card h3 {
		margin-top: 0;
		border-bottom: 1px solid #eee;
		padding-bottom: 0.5rem;
	}
	.card.cost h3 {
		color: #c53030;
	}
	.card.profit h3 {
		color: #2f855a;
	}

	/* Micro Tables */
	.micro-table {
		width: 100%;
		margin-top: 1rem;
		font-size: 0.95rem;
	}
	.micro-table td {
		padding: 6px 0;
		border-bottom: 1px dashed #e2e8f0;
	}
	.micro-table .num {
		text-align: right;
		font-family: monospace;
		font-size: 1rem;
	}
	.micro-table .bold {
		font-weight: bold;
	}
	.text-green {
		color: #2f855a;
	}
	.text-red {
		color: #c53030;
	}
	.highlight {
		background: #f0fff4;
	}

	/* Calculator */
	.calculator-box {
		background: #2d3748;
		color: white;
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}
	.calculator-box h3 {
		color: #63b3ed;
		margin-top: 0;
	}
	.inputs {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1rem;
		margin-bottom: 1.5rem;
	}
	.inputs label {
		display: flex;
		flex-direction: column;
		font-size: 0.9rem;
		color: #cbd5e0;
	}
	.inputs input {
		background: #4a5568;
		border: 1px solid #718096;
		color: white;
		padding: 0.5rem;
		border-radius: 4px;
		margin-top: 0.5rem;
		font-weight: bold;
	}
	
	.outputs {
		background: rgba(0,0,0,0.2);
		padding: 1.5rem;
		border-radius: 6px;
	}
	.out-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 1.2rem;
	}
	.out-row.recurring {
		color: #68d391;
		font-weight: bold;
		border-top: 1px solid #4a5568;
		padding-top: 0.5rem;
		margin-top: 0.5rem;
	}

	/* Data Tables */
	.data-table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}
	.data-table th {
		background: #2b6cb0;
		color: white;
		padding: 12px;
		text-align: left;
	}
	.data-table td {
		border: 1px solid #e2e8f0;
		padding: 12px;
	}
	.data-table tr:nth-child(even) {
		background: #f7fafc;
	}

	/* Ecosystem Grid */
	.ecosystem-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 1.5rem;
	}
	.eco-card {
		background: white;
		border: 1px solid #e2e8f0;
		padding: 1.5rem;
		border-radius: 8px;
		border-top: 4px solid #ed8936;
	}
	.eco-card.premium {
		border-top: 4px solid #805ad5;
		background: #faf5ff;
	}
	.eco-card ul {
		padding-left: 1.2rem;
		margin-bottom: 1rem;
	}
	.eco-card li {
		margin-bottom: 0.5rem;
		color: #4a5568;
	}
	.total {
		font-weight: bold;
		font-size: 1.1rem;
		color: #2d3748;
		text-align: center;
		background: #edf2f7;
		padding: 0.5rem;
		border-radius: 4px;
	}

	/* Personas */
	.persona-list {
		display: grid;
		gap: 1.5rem;
	}
	.persona {
		background: #fff;
		border-left: 5px solid #4a5568;
		padding: 1.5rem;
		border-radius: 0 8px 8px 0;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
	}
	.persona h4 {
		margin: 0 0 0.5rem;
		color: #2d3748;
	}
	.persona p {
		margin: 0.3rem 0;
		color: #4a5568;
		font-size: 0.95rem;
	}

	.alert-box {
		background: #ebf8ff;
		border-left: 4px solid #4299e1;
		padding: 1rem;
		color: #2b6cb0;
		margin-bottom: 2rem;
	}

	.docs-footer {
		margin-top: 5rem;
		text-align: center;
		color: #a0aec0;
		border-top: 1px solid #e2e8f0;
		padding-top: 2rem;
	}
</style>
