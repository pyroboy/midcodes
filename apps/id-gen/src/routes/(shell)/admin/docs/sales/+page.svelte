<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Sales & Marketing Protocols | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Sales & Marketing Protocols</h1>
		<p class="meta">Department: Sales / Fulfillment • Updated: January 2026</p>
		<p class="subject">Subject: Pricing Matrices, Supplier Logistics & Marketing Scripts</p>
	</header>

	<nav class="toc">
		<h2>Quick Navigation</h2>
		<ol>
			<li><a href="#rules">Compliance & Core Rules</a></li>
			<li><a href="#pricing">Official Pricing Matrix</a></li>
			<li><a href="#addons">Add-ons & Upgrades</a></li>
			<li><a href="#sourcing">Internal Sourcing Strategy</a></li>
			<li><a href="#portfolio">Marketing Portfolio (Mock Scenarios)</a></li>
		</ol>
	</nav>

	<section id="rules">
		<h2>I. Compliance & Core Rules</h2>

		<div class="alert-box critical">
			<h3>⛔ STRICT POLICY: ZERO TOLERANCE</h3>
			<p><strong>STRICTLY NO TO FAKE IDs.</strong> We do not accept orders for unauthorized government IDs, driver's licenses, or falsified credentials. Any request without proper authorization will be rejected immediately.</p>
		</div>

		<div class="rule-grid">
			<div class="rule-card">
				<h4>🎨 Free Layout Policy</h4>
				<p>Layout is <strong>FREE</strong>. Clients provide the logo, colors, and details. Work begins <em>only</em> after Downpayment is secured.</p>
			</div>
			<div class="rule-card">
				<h4>📄 Documentation</h4>
				<p><strong>Company Purchase Order (P.O.)</strong> or Certification is required for all corporate/bulk purchases to verify legitimacy.</p>
			</div>
			<div class="rule-card">
				<h4>🛡️ Data Privacy</h4>
				<p>Clients keep their data. We offer "Digital ID" availability. We do not sell or share client data.</p>
			</div>
		</div>
	</section>

	<section id="pricing">
		<h2>II. Official Pricing Matrix & Lead Times</h2>
		<p class="subtext">
			<strong>Material Spec:</strong> Premium Laminated PVC (Sandwich Type). Inner-core printing (Non-fading). ATM Card Size/Thickness.<br>
			<strong>Inclusions:</strong> Free Front/Back Template Design. Free Premium Lanyard Design (for bulk).
		</p>

		<table class="pricing-table">
			<thead>
				<tr>
					<th>Quantity Tier</th>
					<th>Unit Price (PHP)</th>
					<th>Lead Time (Standard)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Basic / Sample (1-4)</td>
					<td><strong>₱150.00</strong></td>
					<td>1-2 Hours (While you wait)</td>
				</tr>
				<tr>
					<td>5-20 pcs</td>
					<td><strong>₱50.00 - ₱45.00</strong></td>
					<td>Same Day Delivery</td>
				</tr>
				<tr>
					<td>50-100 pcs</td>
					<td><strong>₱40.00 - ₱35.00</strong></td>
					<td>1-2 Business Days</td>
				</tr>
				<tr>
					<td>200-500 pcs</td>
					<td><strong>₱30.00 - ₱25.00</strong></td>
					<td>3-5 Business Days</td>
				</tr>
				<tr class="highlight-row">
					<td>1,000+ pcs</td>
					<td><strong>₱15.00</strong></td>
					<td>7-10 Business Days</td>
				</tr>
			</tbody>
		</table>

		<div class="alert-box" style="background: #fffaf0; border-left: 4px solid #ed8936; color: #9c4221;">
			<h4>🚀 Lead Time Standard & Rush Orders</h4>
			<p>
				<strong>Standard Lead Time:</strong> Counts only AFTER final design approval and downpayment. 
				<br /><br />
				<strong>Rush Orders:</strong> Defined as <strong>24-48 hours</strong> (not same day) for orders over 100 pieces. A 30% surcharge applies.
				<br /><br />
				<strong>The Delay Logic:</strong> We do not offer "Instant Bulk" due to our <strong>Curing and Quality Control</strong> process. Every 100 cards require a 4-hour "settling" period after lamination to ensure no warping or peeling occurs in the Tagbilaran humidity.
			</p>
		</div>
	</section>

	<section id="addons">
		<h2>III. Add-ons & Technical Upgrades</h2>

		<div class="addons-wrapper">
			<div class="addon-category">
				<h3>Technical Security</h3>
				<ul>
					<li><strong>Barcode (1D/2D):</strong> + ₱10.00 / card</li>
					<li><strong>Secure QR Code:</strong> + ₱20.00 / card</li>
					<li><strong>RFID / NFC Chip:</strong> + ₱100.00 / card</li>
				</ul>
			</div>

			<div class="addon-category">
				<h3>Physical Enhancements</h3>
				<ul>
					<li><strong>Portrait Enhance (AI):</strong> + ₱50.00</li>
					<li><strong>Rubber Logo (3D):</strong> + ₱50.00 (Min. 100pcs)</li>
					<li><strong>ID Case Holder:</strong> + ₱10.00</li>
				</ul>
			</div>

			<div class="addon-category">
				<h3>Lanyard Upgrades</h3>
				<ul>
					<li><strong>¾ Inch:</strong> ₱60.00 each</li>
					<li><strong>1 Inch:</strong> ₱70.00 each</li>
					<li><strong>Custom Design Fee:</strong> ₱350.00 (Waived for bulk)</li>
				</ul>
			</div>

			<div class="addon-category">
				<h3>Services</h3>
				<ul>
					<li><strong>Self-Encoding:</strong> FREE</li>
					<li><strong>Manual Encoding:</strong> ₱5 - ₱20 per ID</li>
					<li><strong>On-site Photoshoot:</strong> ₱10 - ₱200 per head</li>
				</ul>
			</div>
		</div>
	</section>

	<section id="sourcing">
		<h2>IV. Internal Sourcing Strategy (Private)</h2>
		<div class="note">
			<strong>Production Logic:</strong> We produce PVC in-house (High Margin). We outsource Lanyards to minimize equipment cost.
		</div>

		<h3>Lanyard Supplier Matrix</h3>
		<table class="supplier-table">
			<thead>
				<tr>
					<th>Supplier</th>
					<th>Use Case</th>
					<th>Cost Analysis</th>
					<th>Action</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Supplier 1</strong></td>
					<td>Rush / Small Orders</td>
					<td>High (₱62 @ 50pcs)</td>
					<td>Use only for rush jobs &lt; 50 pcs.</td>
				</tr>
				<tr>
					<td><strong>Supplier 2</strong></td>
					<td><strong>Standard / Preferred</strong></td>
					<td><strong>Mid (₱55 @ 50pcs / ₱31 @ 1k)</strong></td>
					<td><strong>Primary choice for 90% of orders.</strong></td>
				</tr>
				<tr>
					<td><strong>Supplier 5</strong></td>
					<td>Ultra Bulk</td>
					<td>Low (₱23 @ 1k+)</td>
					<td>Negotiate for orders &gt; 2,000 pcs.</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section id="portfolio">
		<h2>V. Marketing Scenarios (Portfolio)</h2>
		<p>Use these "Success Stories" for sales pitches. <em style="color:#666">Note: For demonstration of capability only.</em></p>

		<div class="portfolio-item">
			<div class="portfolio-header school">
				<h3>🎓 Education Sector: "St. Catherine's Academy"</h3>
				<span class="tag">RFID Attendance</span>
			</div>
			<div class="portfolio-body">
				<p><strong>The Pitch:</strong> "Enhance campus security with all-in-one Student ID solutions. From attendance tracking to library access."</p>
				<ul>
					<li><strong>Specs:</strong> PVC Laminated + RFID (NTAG213) + QR Code.</li>
					<li><strong>Design:</strong> Navy blue, Gold foil emboss effect (Rubber logo), 1-inch Sky Blue Lanyard.</li>
					<li><strong>Pricing Strategy:</strong>
						<ul>
							<li>PVC (₱25) + RFID (₱100) + QR (₱20) + Lanyard (₱36 outsourced)</li>
							<li><strong>Total Quote:</strong> ₱180 - ₱200 per student.</li>
						</ul>
					</li>
				</ul>
			</div>
		</div>

		<div class="portfolio-item">
			<div class="portfolio-header corpo">
				<h3>🏢 Corporate Sector: "Ayala Land HQ"</h3>
				<span class="tag">Access Control</span>
			</div>
			<div class="portfolio-body">
				<p><strong>The Pitch:</strong> "Streamline workforce management. Integration-ready with HRIS. On-site photoshoot available."</p>
				<ul>
					<li><strong>Specs:</strong> Matte PVC + Mifare 1K Chip + Barcode.</li>
					<li><strong>Design:</strong> Minimalist White/Gold, Department color-coding on edge.</li>
					<li><strong>Services:</strong> On-site photography team deployed.</li>
					<li><strong>Pricing Strategy:</strong> High margin on "Professional Services" (Photoshoot & Encoding).</li>
				</ul>
			</div>
		</div>

		<div class="portfolio-item">
			<div class="portfolio-header retail">
				<h3>🛍️ Retail Sector: "SM Advantage / Greenfield"</h3>
				<span class="tag">High Volume</span>
			</div>
			<div class="portfolio-body">
				<p><strong>The Pitch:</strong> "Cost-effective loyalty cards that don't fade. Perfect for wallet insertion."</p>
				<ul>
					<li><strong>Specs:</strong> Thin PVC (0.5mm) + Barcode only. No Lanyard.</li>
					<li><strong>Volume:</strong> 3,000+ pcs.</li>
					<li><strong>Pricing Strategy:</strong>
						<ul>
							<li>Sell at ₱15.00 - ₱18.00.</li>
							<li>Cost is low (In-house PVC). Speed is the selling point.</li>
						</ul>
					</li>
				</ul>
			</div>
		</div>
	</section>

	<footer class="docs-footer">
		<p>Kanaya Internal Admin Docs • Authorized Personnel Only</p>
		<p><a href="/admin/dashboard">← Back to Dashboard</a></p>
	</footer>
</div>

<style>
	/* Base Container */
	.docs-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', system-ui, sans-serif;
		color: #333;
		line-height: 1.6;
	}

	/* Header */
	.docs-header {
		border-bottom: 3px solid #004080;
		padding-bottom: 1.5rem;
		margin-bottom: 2rem;
	}
	.docs-header h1 {
		color: #004080;
		margin: 0;
		font-size: 2rem;
	}
	.meta {
		color: #666;
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}
	.subject {
		font-weight: 600;
		margin: 0.25rem 0;
		color: #444;
	}

	/* Navigation */
	.toc {
		background: #f0f4f8;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #dceefb;
		margin-bottom: 3rem;
	}
	.toc h2 {
		margin: 0 0 1rem;
		font-size: 1.2rem;
		color: #004080;
	}
	.toc ol {
		margin: 0;
		padding-left: 1.5rem;
	}
	.toc a {
		text-decoration: none;
		color: #0066cc;
		font-weight: 500;
	}
	.toc a:hover {
		text-decoration: underline;
	}

	/* Section Styling */
	section {
		margin-bottom: 4rem;
	}
	h2 {
		font-size: 1.5rem;
		border-left: 5px solid #004080;
		padding-left: 1rem;
		margin-bottom: 1.5rem;
		color: #222;
	}

	/* Alerts & Rules */
	.alert-box {
		padding: 1.5rem;
		border-radius: 6px;
		margin-bottom: 2rem;
	}
	.alert-box.critical {
		background-color: #fff5f5;
		border: 1px solid #feb2b2;
		color: #c53030;
	}
	.alert-box h3 {
		margin-top: 0;
	}

	.rule-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
		gap: 1.5rem;
	}
	.rule-card {
		background: #f8f9fa;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #e9ecef;
	}
	.rule-card h4 {
		margin-top: 0;
		color: #004080;
	}

	/* Tables */
	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
		font-size: 0.95rem;
	}
	th,
	td {
		padding: 1rem;
		text-align: left;
		border-bottom: 1px solid #ddd;
	}
	th {
		background-color: #004080;
		color: white;
		text-transform: uppercase;
		font-size: 0.85rem;
		letter-spacing: 0.05em;
	}
	tr:hover {
		background-color: #f1f1f1;
	}
	.highlight-row {
		background-color: #e6fffa;
		font-weight: bold;
	}

	/* Add-ons Grid */
	.addons-wrapper {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 2rem;
	}
	.addon-category h3 {
		font-size: 1.1rem;
		color: #004080;
		border-bottom: 2px solid #ddd;
		padding-bottom: 0.5rem;
	}
	.addon-category ul {
		padding-left: 1.2rem;
		margin: 0;
	}
	.addon-category li {
		margin-bottom: 0.5rem;
	}

	/* Portfolio Cards */
	.portfolio-item {
		border: 1px solid #ddd;
		border-radius: 8px;
		overflow: hidden;
		margin-bottom: 2rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}
	.portfolio-header {
		padding: 1rem 1.5rem;
		display: flex;
		justify-content: space-between;
		align-items: center;
		color: white;
	}
	.portfolio-header h3 {
		margin: 0;
		font-size: 1.1rem;
	}
	.portfolio-header.school {
		background: linear-gradient(to right, #2b6cb0, #2c5282);
	}
	.portfolio-header.corpo {
		background: linear-gradient(to right, #2f855a, #276749);
	}
	.portfolio-header.retail {
		background: linear-gradient(to right, #c05621, #9c4221);
	}

	.tag {
		background: rgba(255, 255, 255, 0.2);
		padding: 0.2rem 0.6rem;
		border-radius: 4px;
		font-size: 0.8rem;
	}
	.portfolio-body {
		padding: 1.5rem;
	}

	/* Sourcing Note */
	.note {
		background: #fffbea;
		border-left: 4px solid #ecc94b;
		padding: 1rem;
		margin-bottom: 1rem;
	}

	/* Footer */
	.docs-footer {
		margin-top: 4rem;
		text-align: center;
		font-size: 0.9rem;
		color: #718096;
		border-top: 1px solid #e2e8f0;
		padding-top: 2rem;
	}
	.docs-footer a {
		color: #004080;
		text-decoration: none;
	}
</style>
