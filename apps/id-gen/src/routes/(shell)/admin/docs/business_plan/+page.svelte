<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Master Business Plan 2026 | Kanaya Identity Solutions</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<div class="header-top">
			<h1>KANAYA IDENTITY SOLUTIONS</h1>
			<span class="badge">Version 6.0 - Attendance System Subscription Edition</span>
		</div>
		<p class="meta">Master Business Plan 2026: The Hybrid Identity & Attendance Platform</p>
		<p class="subject">"Physical IDs meet Smart Terminals. One platform, two revenue streams."</p>
	</header>

	<section class="summary">
		<h2>EXECUTIVE SUMMARY</h2>
		<div class="pitch-card">
			<p>
				Kanaya is a two-in-one identity platform: we manufacture physical ID cards (₱5.80 basic, ₱62.32 premium) 
				AND provide tablet-based attendance terminals (₱16,405 each) with QR/RFID/fingerprint scanning. 
				The real profit is our <strong>Attendance System Subscription</strong> (₱10/student/year) + 
				<strong>SMS notifications</strong> (₱0.60 per message, passed through to client).
			</p>
			<p><strong>The Combo:</strong> Every school gets cards PLUS a terminal. We own the entire attendance workflow.</p>
			<ul class="stats-grid">
				<li><strong>Investment Ask:</strong> ₱165,000 seed capital</li>
				<li><strong>Break-even:</strong> 50 days (sell 2 school bundles)</li>
				<li><strong>Year 1 Target:</strong> ₱945,000 revenue</li>
			</ul>
		</div>
	</section>

	<section>
		<h2>1. INVESTMENT TIERS (CHOOSE YOUR STARTING POINT)</h2>
		
		<div class="tier-card">
			<h3>TIER 1: "CARDS ONLY" (₱25,000)</h3>
			<p><strong>Goal:</strong> Build card production first, prove model before adding terminals.</p>
			<ul>
				<li><strong>Equipment:</strong> Epson L8050, PVC Sheets (5k cards), Ink Set, Laminator, Die Cutter.</li>
				<li><strong>Capacity:</strong> 250 cards/day, 5,000/month.</li>
				<li><strong>COGS:</strong> ₱5.80/card (₱19.80 with RFID chip).</li>
				<li><strong>Pricing:</strong> ₱12-60/card.</li>
				<li><strong>Year 1 Profit:</strong> ₱49,600 (Payback: 6 months).</li>
			</ul>
		</div>

		<div class="tier-card highlight">
			<h3>TIER 2: "CARDS + TERMINALS" (₱165,000)</h3>
			<p><strong>Goal:</strong> Sell complete solution - cards + attendance terminals. Higher ticket, faster payback.</p>
			<div class="split">
				<div>
					<strong>Cards Equipment (₱75,000):</strong>
					<ul>
						<li>Epson L8050 + IDP Smart-51S (financed)</li>
						<li>Lanyard press + Inventory</li>
					</ul>
				</div>
				<div>
					<strong>Terminal Equipment (₱65,000):</strong>
					<ul>
						<li>4× Samsung Galaxy Tab A9+</li>
						<li>4× NETUM Wireless QR Scanners</li>
					</ul>
				</div>
			</div>
			<p><strong>ROI:</strong> 84% in Year 1. Payback in 7.2 months.</p>
		</div>

		<div class="tier-card">
			<h3>TIER 3: "FULL PLATFORM" (₱265,000)</h3>
			<p><strong>Goal:</strong> Export-ready, UV security, 10 terminals for multi-site deployments.</p>
			<ul>
				<li><strong>Added:</strong> 6× Prof. Terminals, 6× Fingerprint Readers (Hamster Plus).</li>
				<li><strong>Hardware:</strong> UV Flatbed Printer (Used), Automated Cutter.</li>
				<li><strong>Year 1 Profit:</strong> ₱450,000 (65% margin). Payback in 7 months.</li>
			</ul>
		</div>
	</section>

	<section>
		<h2>2. ATTENDANCE SYSTEM SUBSCRIPTION (THE REAL MONEY)</h2>
		<p>Student taps card → Server logs attendance → Optional SMS to parent.</p>
		
		<div class="pillar">
			<h3>Pass-Through SMS Pricing (OneWaySMS.ph)</h3>
			<ul>
				<li><strong>Cost to us:</strong> ₱0.50 - ₱0.60 per SMS.</li>
				<li><strong>Student Package:</strong> ₱5/student/year for SMS (10 SMS/mo avg).</li>
				<li><strong>System Subscription:</strong> ₱10/student/year (Software access).</li>
				<li><strong>Total:</strong> ₱15/student/year.</li>
			</ul>
			<p><strong>Example (500 students):</strong> ₱5,000/year profit per school (67% margin).</p>
		</div>
	</section>

	<section>
		<h2>3. HARDWARE SPECIFICATIONS</h2>
		<div class="grid">
			<div class="spec-box">
				<h3>Core Setup (₱16,405)</h3>
				<ul>
					<li>Samsung Galaxy Tab A9+</li>
					<li>NETUM Wireless QR Scanner</li>
					<li>USB-C OTG Hub + Mount</li>
				</ul>
			</div>
			<div class="spec-box">
				<h3>Rugged Upgrade (₱53,451)</h3>
				<ul>
					<li>Samsung Tab Active4 Pro (IP68)</li>
					<li>NETUM + Charging Cradle</li>
					<li>Commercial Kiosk Mount</li>
				</ul>
			</div>
		</div>
	</section>

	<section>
		<h2>4. THE BUNDLE STRATEGY</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Package</th>
						<th>Setup Fee (One-Time)</th>
						<th>Annual Subscription</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>"Smart Campus" (500 students)</strong></td>
						<td>₱107,810 (IDs + Lanyards + 2 Terminals)</td>
						<td>₱42,780/year (SaaS + SMS + Lease)</td>
					</tr>
					<tr>
						<td><strong>"Corporate Access" (100 staff)</strong></td>
						<td>₱44,315 (Premium IDs + 1 Terminal)</td>
						<td>₱19,640/year (SaaS + Lease)</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>5. GO-TO-MARKET (90-DAY SPRINT)</h2>
		<ul class="timeline">
			<li><strong>Days 1-30:</strong> Build demo kit, close School #1 (50% downpayment).</li>
			<li><strong>Days 31-60:</strong> Deploy 500 cards, close School #2. Own all equipment debt-free.</li>
			<li><strong>Days 61-90:</strong> Launch BPO package, scale recurring revenue.</li>
		</ul>
	</section>

	<section>
		<h2>6. CEO MANDATE: THE "DO NOT" LIST</h2>
		<ul class="danger-list">
			<li>❌ DO NOT chase DepEd RFPs (bureaucracy kills cash flow)</li>
			<li>❌ DO NOT offer free SMS (always pass through + 20% markup)</li>
			<li>❌ DO NOT price Attendance System below ₱10/student/year</li>
			<li>❌ DO NOT store raw biometric data (only immutable hashes)</li>
		</ul>
	</section>

	<section>
		<h2>7. FINANCIAL PROJECTIONS (TIER 2)</h2>
		<div class="roi-stats">
			<div class="stat"><span>Year 1 Total Revenue</span> <strong>₱916,210</strong></div>
			<div class="stat"><span>Net Profit</span> <strong>₱304,270</strong></div>
			<div class="stat"><span>ROI</span> <strong>184%</strong></div>
		</div>
	</section>

	<footer class="docs-footer">
		<p>Document Status: FINAL • Updated: Jan 06, 2026</p>
		<p><a href="/admin/docs">← Back to Index</a></p>
	</footer>
</div>

<style>
	:global(body) { background: #f1f5f9; }
	.docs-container { max-width: 1000px; margin: 3rem auto; padding: 4rem; background: #fff; border-radius: 16px; box-shadow: 0 10px 25px rgba(0,0,0,0.05); font-family: 'Inter', system-ui, sans-serif; color: #334155; }
	.docs-header { border-bottom: 3px solid #0f172a; padding-bottom: 2rem; margin-bottom: 3rem; }
	.header-top { display: flex; justify-content: space-between; align-items: center; }
	h1 { font-size: 2.2rem; font-weight: 900; color: #0f172a; letter-spacing: -0.03em; }
	.badge { background: #0f172a; color: #fff; padding: 0.5rem 1rem; border-radius: 6px; font-size: 0.75rem; font-weight: 700; text-transform: uppercase; }
	.meta { font-size: 1.1rem; font-weight: 600; color: #475569; margin-top: 0.75rem; }
	.subject { color: #64748b; font-style: italic; margin-top: 0.5rem; }

	h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; border-left: 5px solid #3b82f6; padding-left: 1.2rem; margin: 4rem 0 2rem; text-transform: uppercase; }
	
	.pitch-card { background: #f8fafc; border: 1px solid #e2e8f0; padding: 2rem; border-radius: 12px; }
	.stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; list-style: none; padding: 0; margin-top: 2rem; border-top: 1px solid #e2e8f0; pt: 1.5rem; }
	.stats-grid li { font-weight: 700; color: #0369a1; }

	.tier-card { padding: 2rem; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 1.5rem; }
	.tier-card.highlight { border: 2px solid #3b82f6; background: #f0f7ff; }
	.tier-card h3 { margin-top: 0; color: #0f172a; }
	.split { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 1.5rem; }

	.pillar { background: #fafafa; border-radius: 8px; padding: 1.5rem; margin: 1.5rem 0; }
	.grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
	.spec-box { border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 8px; }

	.table-wrapper { margin: 2rem 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
	table { width: 100%; border-collapse: collapse; text-align: left; }
	th { background: #f8fafc; padding: 1.2rem; font-weight: 700; border-bottom: 2px solid #e2e8f0; }
	td { padding: 1.2rem; border-bottom: 1px solid #f1f5f9; }

	.timeline { list-style: none; padding: 0; }
	.timeline li { margin-bottom: 1.5rem; padding-left: 2rem; position: relative; }
	.timeline li::before { content: '→'; position: absolute; left: 0; color: #3b82f6; font-weight: 900; }

	.danger-list { list-style: none; padding: 0; }
	.danger-list li { margin-bottom: 0.75rem; font-weight: 600; color: #991b1b; }

	.roi-stats { display: flex; gap: 2rem; margin: 2rem 0; }
	.stat { flex: 1; background: #f0fdf4; border: 1px solid #bbf7d0; padding: 2rem; border-radius: 12px; text-align: center; }
	.stat span { display: block; font-size: 0.85rem; color: #166534; margin-bottom: 0.5rem; }
	.stat strong { font-size: 2rem; color: #15803d; letter-spacing: -0.02em; }

	.docs-footer { margin-top: 6rem; text-align: center; font-size: 0.85rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 3rem; }
	.docs-footer a { color: #64748b; text-decoration: none; font-weight: 700; }
</style>
