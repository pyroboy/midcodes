<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Kanaya Business Plan | Admin Docs</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<div class="header-top">
			<h1>Kanaya Business Plan & Investment Proposal</h1>
			<span class="badge">Status: Draft for Investors</span>
		</div>
		<p class="meta">Location: Tagbilaran City, Bohol • Date: January 2026</p>
		<p class="subject">Master plan for securing ₱25k - ₱30k in seed capital for the Epson L8050 printer.</p>
	</header>

	<section class="summary">
		<h2>Executive Pitch</h2>
		<div class="pitch-card">
			<p>
				Kanaya Identity Solutions is a Campus Security Platform disguised as an ID provider. While local
				competitors fight a price war selling fading laminated cards, Kanaya offers Smart IDs that verify
				fetchers, track attendance, and prevent fraud via our proprietary cloud platform.
			</p>
			<p>
				We are seeking ₱25,000 in seed capital to purchase our core production machinery (Epson L8050)
				and starter inventory. With this investment we project a 45-day break-even (~200 IDs sold).
			</p>
		</div>
	</section>

	<nav class="toc">
		<h3>Table of Contents</h3>
		<ol>
			<li><a href="#executive">Executive Summary</a></li>
			<li><a href="#problem">The Problem & Solution</a></li>
			<li><a href="#swot">Market Analysis (SWOT)</a></li>
			<li><a href="#financials">Financial Highlights</a></li>
			<li><a href="#ask">The "Ask" (Capital Requirement)</a></li>
		</ol>
	</nav>

	<section id="executive">
		<h2>1. Executive Summary</h2>
		<p>
			Kanaya Identity Solutions is not a traditional print shop. We deliver a Tech-Enabled Smart ID System
			that secures campuses. Our IDs verify fetchers, log attendance, and integrate with our cloud
			platform to shut down fraud instantly.
		</p>
		<p>
			Seed capital of ₱25,000 unlocks the Epson L8050 printer and inventory needed to produce
			professional-grade RFID IDs in-house, allowing us to hit profitability within 45 days.
		</p>
	</section>

	<section id="problem">
		<h2>2. The Problem & Solution</h2>
		<div class="grid">
			<div>
				<h3>The Problem: "Dumb Plastic"</h3>
				<ul>
					<li>Outdated lamination tech creates low-quality IDs.</li>
					<li>Security risks: fake IDs are easy to manufacture.</li>
					<li>Lost cards take 1–2 weeks to replace.</li>
					<li>Thermal prints fade in 3–6 months.</li>
				</ul>
			</div>
			<div>
				<h3>The Kanaya Solution: "Smart Security"</h3>
				<ul>
					<li>Hardware: fused "Sandwich" PVC cards, waterproof and non-fading.</li>
					<li>Software: cloud database + QR/NFC scanning for instant verification.</li>
					<li>Speed: "Lost Card" replacements in under 2 hours.</li>
					<li>Offering an ecosystem (hardware + SaaS) competitors cannot copy.</li>
				</ul>
			</div>
		</div>
	</section>

	<section id="swot">
		<h2>3. Market Analysis (SWOT)</h2>
		<div class="swot">
			<div>
				<h3>Strengths</h3>
				<ul>
					<li>Proprietary "Kanaya Studio" software.</li>
					<li>Low overhead (home base in Tagbilaran, zero rent).</li>
					<li>Agile production via in-house direct-to-tray RFID printing.</li>
				</ul>
			</div>
			<div>
				<h3>Weaknesses</h3>
				<ul>
					<li>Need capital for Epson L8050 printer.</li>
					<li>Single-founder operation limits throughput.</li>
				</ul>
			</div>
			<div>
				<h3>Opportunities</h3>
				<ul>
					<li>"Smart City" push—schools want high-tech ID security.</li>
					<li>SaaS licensing to shops outside Visayas.</li>
				</ul>
			</div>
			<div>
				<h3>Threats</h3>
				<ul>
					<li>"Piso Print" shops competing on low price.</li>
					<li>Mitigation: emphasize the security platform they cannot replicate.</li>
				</ul>
			</div>
		</div>
	</section>

	<section id="financials">
		<h2>4. Financial Highlights</h2>
		<h3>Unit Economics (Per ID Card)</h3>
		<table>
			<thead>
				<tr>
					<th>Item</th>
					<th>Cost (PHP)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Selling Price (SRP)</td>
					<td>₱150.00</td>
				</tr>
				<tr>
					<td>Inkjet PVC Sheet / RFID Card</td>
					<td>₱20.00</td>
				</tr>
				<tr>
					<td>Epson Ink (6-Color Mix)</td>
					<td>₱1.50</td>
				</tr>
				<tr>
					<td>Laminating Film</td>
					<td>₱2.00</td>
				</tr>
				<tr>
					<td>Labor (Encoding/Cutting)</td>
					<td>₱5.00</td>
				</tr>
				<tr>
					<td><strong>Total Cost</strong></td>
					<td><strong>₱28.50</strong></td>
				</tr>
				<tr>
					<td><strong>Gross Profit</strong></td>
					<td><strong>₱121.50</strong></td>
				</tr>
				<tr>
					<td><strong>Margin</strong></td>
					<td><strong>81%</strong></td>
				</tr>
			</tbody>
		</table>
		<p class="note">Note: Lanyards sold separately (Cost ₱45, Sell ₱75) to protect margins.</p>

		<div class="projection">
			<h3>Projected Revenue (Year 1)</h3>
			<ul>
				<li>Target: 3 small schools + 1 SME client.</li>
				<li>Volume: ~1,500 IDs.</li>
				<li>Gross Revenue: ₱225,000.</li>
				<li>Net Profit (Est): ₱180,000.</li>
			</ul>
		</div>
	</section>

	<section id="ask">
		<h2>5. The "Ask" (Investment Requirement)</h2>
		<p>
			We are raising ₱25,000 to launch operations immediately and cover CapEx, inventory, and launch
			costs. Funds will be used as outlined below:
		</p>
		<table>
			<thead>
				<tr>
					<th>Item</th>
					<th>Description</th>
					<th>Cost (PHP)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Production Hardware</td>
					<td>Epson L8050 (6-Color WiFi)</td>
					<td>₱16,500</td>
				</tr>
				<tr>
					<td>Inventory Starter</td>
					<td>5 boxes PVC, 1 ink set, 50 RFID cards</td>
					<td>₱5,500</td>
				</tr>
				<tr>
					<td>Marketing / Samples</td>
					<td>Sample production for demos</td>
					<td>₱1,000</td>
				</tr>
				<tr>
					<td>Cash Buffer</td>
					<td>Emergency / Transport</td>
					<td>₱2,000</td>
				</tr>
				<tr class="total">
					<td colspan="2"><strong>Total Requirement</strong></td>
					<td><strong>₱25,000</strong></td>
				</tr>
			</tbody>
		</table>

		<div class="repayment">
			<h3>Repayment Strategy</h3>
			<ul>
				<li>Source: First two school contracts (target launch: May/June enrollment season).</li>
				<li>Timeline: Principal + interest (if applicable) repaid within 3 months.</li>
				<li>Collateral: Epson L8050 printer retains ~80% resale value.</li>
			</ul>
		</div>
	</section>

	<footer class="docs-footer">
		<p>Kanaya Identity Solutions — Securing the Campus, One ID at a Time.</p>
	</footer>
</div>

<style>
	.docs-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', system-ui, sans-serif;
		color: #1f2933;
	}

	.docs-header {
		border-bottom: 4px solid #111827;
		margin-bottom: 2rem;
		padding-bottom: 1.5rem;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		gap: 1rem;
	}

	.docs-header h1 {
		margin: 0;
		font-size: 2rem;
		color: #111827;
	}

	.badge {
		background: #fbbf24;
		color: #111827;
		padding: 0.3rem 0.8rem;
		border-radius: 999px;
		font-weight: 600;
		font-size: 0.85rem;
	}

	.meta {
		color: #4b5563;
		margin: 0.25rem 0;
	}

	.subject {
		color: #1f2933;
		font-size: 1rem;
	}

	.summary {
		margin-bottom: 2rem;
	}

	.pitch-card {
		background: #fef3c7;
		border: 1px solid #fcd34d;
		padding: 1.5rem;
		border-radius: 12px;
		color: #92400e;
		line-height: 1.6;
	}

	.toc {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		padding: 1.5rem;
		border-radius: 10px;
		margin-bottom: 2rem;
	}

	.toc h3 {
		margin-top: 0;
		color: #0f172a;
	}

	.toc ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	.toc a {
		text-decoration: none;
		color: #1d4ed8;
		font-weight: 500;
	}

	h2 {
		border-left: 6px solid #111827;
		padding-left: 1rem;
		color: #111827;
		margin-top: 3rem;
	}

	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
		gap: 1.5rem;
	}

	.swot {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
		gap: 1rem;
	}

	.swot div {
		background: #f9fafb;
		border: 1px solid #e5e7eb;
		padding: 1rem;
		border-radius: 8px;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
	}

	th,
	td {
		border: 1px solid #e5e7eb;
		padding: 0.75rem;
		text-align: left;
	}

	th {
		background: #111827;
		color: white;
	}

	.total td {
		background: #f3f4f6;
		font-weight: 700;
	}

	.note {
		color: #b45309;
		font-style: italic;
	}

	.docs-footer {
		margin-top: 3rem;
		text-align: center;
		color: #6b7280;
		border-top: 1px solid #e5e7eb;
		padding-top: 1.5rem;
		font-weight: 600;
	}

	@media (max-width: 640px) {
		.header-top {
			flex-direction: column;
		}
	}
</style>
