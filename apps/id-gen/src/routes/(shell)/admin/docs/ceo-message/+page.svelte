<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>CEO Ground Truth Brief | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>CEO GROUND TRUTH BRIEF: KANAYA IDENTITY SOLUTIONS</h1>
		<p class="meta">Realistic Lead Times, Real Encoding Moat, Real Direction</p>
		<p class="subject">Internal Strategy Document • Confidential</p>
	</header>

	<section>
		<h2>1. THE WAR WE'RE ACTUALLY FIGHTING</h2>
		<p>We are not competing with "Piso Print" shops on speed. We are not promising 2-hour miracles. We are competing with encoding errors and labor costs.</p>
		
		<div class="split-grid">
			<div class="danger-box">
				<h3>The Enemy:</h3>
				<ul>
					<li>8 hours of manual typing names into encoding software</li>
					<li>15% error rate on name spelling, ID numbers, photo alignment</li>
					<li>3-day delays because encoding is bottlenecked, not printing</li>
					<li>Hiring a 2nd person just for data entry (kills margin)</li>
				</ul>
			</div>
			<div class="success-box">
				<h3>Our Weapon:</h3>
				<p>Software-driven encoding compression that turns 8 hours of manual work into 8 minutes of automated accuracy—allowing us to accept rush orders without staff and guarantee zero errors.</p>
			</div>
		</div>
	</section>

	<section>
		<h2>2. OUR UNFAIR ADVANTAGE: THE ENCODING BOTTLENECK WE ACTUALLY SOLVED</h2>
		<p>The mobile app that encodes 500 cards in 8 minutes is real (Architecture p.7). The Postgres schema is live. The NFC validation logic is deployed.</p>

		<div class="pillar">
			<h3>What This Gives Us:</h3>
			<ul>
				<li><strong>Accuracy:</strong> AI auto-fits names, enhances photos, removes backgrounds—zero typos</li>
				<li><strong>Rush Capacity:</strong> Encoding is never the bottleneck; we can take same-day orders if printing allows</li>
				<li><strong>Labor Savings:</strong> 1 person prints; the phone encodes—no data entry hire</li>
				<li><strong>Error-Free Guarantee:</strong> "We print exactly what you approved" (TOS p.19)</li>
			</ul>
		</div>

		<div class="note">
			<h3>What It Doesn't Give Us:</h3>
			<ul>
				<li>Faster printing: Epson L8050 still prints 2 cards per tray, 2.5 mins per batch (Operations p.26)</li>
				<li>Faster lamination: Still 130°C, 30 seconds per card, 4-hour curing for 100 cards</li>
				<li>Competitor-beating total speed: Our total lead time is the same as competitors—but our encoding is instant</li>
			</ul>
		</div>

		<p class="ground-truth"><strong>Ground Truth:</strong> The moat is accuracy and rush flexibility, not raw speed. We can accept a 50-card "emergency order" at 9 AM and have it encoded by 9:08 AM, but printing still takes 2-3 hours.</p>
	</section>

	<section>
		<h2>3. THE REVENUE ENGINE: THE ₱150 TRAP & VERTICAL REALITY</h2>
		<p>We don't sell speed. We sell error-free encoding + realistic lead times.</p>

		<table>
			<thead>
				<tr>
					<th>Layer</th>
					<th>Price</th>
					<th>Target</th>
					<th>Reality Check</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>L1: Physical ID</td>
					<td>₱150/card</td>
					<td>Schools (Base)</td>
					<td>81% margin, max 6k cards/month</td>
				</tr>
				<tr>
					<td>L1b: Employee ID</td>
					<td>₱150/card</td>
					<td>Businesses (B2B)</td>
					<td>Same margin, no SaaS attach (but they need accuracy for 500 names)</td>
				</tr>
				<tr>
					<td>L1c: PWD/Senior ID</td>
					<td>₱50/card</td>
					<td>Government/LGU (B2G)</td>
					<td>Below COGS (₱28.50)—LGUs demand ₱15/card, net loss</td>
				</tr>
				<tr>
					<td>L2: Attendance SaaS</td>
					<td>₱10/head/yr</td>
					<td>Schools only</td>
					<td>90% margin, free trial (p.38)</td>
				</tr>
				<tr>
					<td>L3: Analytics</td>
					<td>+₱10/head/yr</td>
					<td>Schools only</td>
					<td>Dashboard doesn't exist</td>
				</tr>
				<tr>
					<td>L4: Replacement insurance</td>
					<td>₱5/head/yr</td>
					<td>Schools + B2B</td>
					<td>Net new—covers lost cards</td>
				</tr>
			</tbody>
		</table>

		<div class="highlight-box mt-4">
			<h3>Lead Time Comparison (500 IDs):</h3>
			<p><strong>Competitor:</strong> 5 days encoding (manual) + 3 days print = 8 days total</p>
			<p><strong>Kanaya:</strong> 8 minutes encoding + 3 days print = 3-5 days total (Operations p.46)</p>
		</div>

		<div class="pillar mt-4">
			<h3>B2B Value Prop (Construction Site, 500 workers):</h3>
			<ul>
				<li>Not speed—it's accuracy: "Upload Excel once, we auto-fit all 500 names, zero errors"</li>
				<li>Not SaaS—it's batch encoding: 8 minutes vs. 8 hours of manual work</li>
				<li>LTV: ₱75,000 (cards only)—but zero churn because they reorder annually</li>
			</ul>
		</div>

		<div class="danger-box mt-4">
			<h3>B2G Value Prop (PWD/Senior ID, 10,000 recipients):</h3>
			<ul>
				<li>Legal barrier: No DSWD/OSCAA accreditation = cannot bid directly</li>
				<li>Financial barrier: LGU budget is ₱15/card, our cost is ₱28.50 = 33% loss</li>
				<li>Data barrier: Requires 5-year retention, we purge in 30 days (p.20) = non-compliant</li>
			</ul>
		</div>

		<p class="ground-truth"><strong>Ground Truth:</strong> We are not a government contractor. Partner with accredited NGO, print at ₱40/card wholesale, zero data storage—we are the backend printer only.</p>
	</section>

	<section>
		<h2>4. MARKET DOMINATION PLAY</h2>
		
		<div class="pillar">
			<h3>PHASE 1: OWN 3 SCHOOLS (Q1 2026)</h3>
			<p>Target: 1,000 students max. Pitch: "Zero encoding errors + realistic 3-5 day lead time". Conversion: 0% SaaS until we build billing. Revenue: ₱150,000 (cards) = one printer payment.</p>
		</div>

		<div class="pillar">
			<h3>PHASE 2: B2B WHITE-LABEL</h3>
			<p>Target: 5 resellers. Model: Wholesale ₱40/card, they handle sales/client, we print. App: Add <code>organization.sector = 'reseller'</code>.</p>
		</div>

		<div class="pillar">
			<h3>PHASE 3: GOVERNMENT (PWD/SENIOR)—DO NOT BID</h3>
			<p>Partner with accredited NGO—they sign the waiver, handle LGU, we print at ₱40/card. Zero app changes, zero data storage. We are a backend print shop only.</p>
		</div>

		<div class="pillar">
			<h3>PHASE 4: SAAS FOR PRINT SHOPS (18+ MONTHS)</h3>
			<p>Target: 0 until we have 10 school case studies. Revenue: ₱0 until we document the API.</p>
		</div>
	</section>

	<section>
		<h2>5. THE 90-DAY MANDATE: PRINT, ENCODE, DON'T OVERPROMISE</h2>
		<ul>
			<li><strong>Weeks 1-4: Close 1 School, Print 500 IDs.</strong> Use Flip Strategy: 50% downpayment → buy printer → print in-house.</li>
			<li><strong>Weeks 5-8: Build "Lost Card Insurance" MVP.</strong> Add 1 toggle in Admin app: <code>insurance_plan: boolean</code>. ₱5/head/year.</li>
			<li><strong>Weeks 9-12: Launch Digital Business Cards (Pure Margin).</strong> Free for staff, ₱50/head for custom branding. No printing required.</li>
		</ul>
	</section>

	<section>
		<h2>6. THE ENDGAME: THREE PATHS, ONE REALITY</h2>
		<p><strong>Ground Truth:</strong> The only viable exit is Path B (Acquired for Identity Layer) in 36 months, but we must re-architect data retention NOW to retain anonymized enrollment status while purging PII.</p>
	</section>

	<section>
		<h2>7. WHAT WE MUST NOT DO (NON-NEGOTIABLE)</h2>
		<ul class="danger-list">
			<li>❌ DO NOT promise 2-hour replacement (Realistic is 3-5 days)</li>
			<li>❌ DO NOT chase government RFPs (Legal/Financial suicide)</li>
			<li>❌ DO NOT build a "Corporate Dashboard" (Scope creep, stick to schools)</li>
			<li>❌ DO NOT underprice to win volume (Minimum floor ₱30/card)</li>
			<li>❌ DO NOT promise hardware we don't sell (No magnetic locks/security systems)</li>
			<li>❌ DO NOT code the SaaS billing system yet (Wait for 5 paying users)</li>
			<li>❌ DO NOT purge data without metadata (Retain anonymized scan counts)</li>
			<li>❌ DO NOT add custom fields for B2B ( Hard "NO" to custom Dept codes)</li>
		</ul>
	</section>

	<section>
		<h2>8. THE ONE METRIC THAT MATTERS</h2>
		<p class="ground-truth"><strong>Ground Truth:</strong> The metric isn't attach rate—it's "Margin per Print Hour"—and the app must auto-reject orders with unit price &lt; ₱30.</p>
	</section>

	<section>
		<h2>9. MY JOB AS CEO (AND YOURS)</h2>
		<p><strong>External:</strong> Sell 3 schools, handle the "encoding story" (8 mins vs 8 hours). No corporate/government distractions.</p>
		<p><strong>Internal:</strong> Protect the print queue (max 1k cards/printer). Prioritize DepEd Export and Insurance UI.</p>
	</section>

	<section>
		<h2>11. MARKET TARGETS & INFRASTRUCTURE REQUIREMENTS</h2>
		<p>To dominate the identity space, we must understand the specific hardware and software plumbing required for each vertical. We do not build everything; we provide the <em>Identity Layer</em> that makes these systems work.</p>

		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Target Vertical</th>
						<th>Required Infrastructure</th>
						<th>Kanaya's Role (The Moat)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Attendance Systems</strong></td>
						<td>Tablet Terminals, QR Scanners, SMS Gateway, Real-time Sync Backend</td>
						<td>Instant sync from scan to parent notification; offline-first local cache.</td>
					</tr>
					<tr>
						<td><strong>Student IDs</strong></td>
						<td>High-volume PVC Printers, Batch Encoding App, Photo Enhancement AI</td>
						<td>8-minute encoding for 500 students; zero-typo guarantee.</td>
					</tr>
					<tr>
						<td><strong>Business Cards</strong></td>
						<td>NFC Card Stock, VCard Generation UI, Profile Management Dashboard</td>
						<td>Dynamic QR/NFC links that can be updated after the card is printed.</td>
					</tr>
					<tr>
						<td><strong>Event Badges</strong></td>
						<td>On-site Thermal Printers, Lanyard Production, Check-in Scanning App</td>
						<td>Zero-latency check-in for thousands of guests; on-the-spot badge generation.</td>
					</tr>
					<tr>
						<td><strong>Employee Access</strong></td>
						<td>Mifare/High-Sec NFC Cards, Door Lock Integration (SDK), Audit Log Database</td>
						<td>Immutable logs of who entered where; centralized credential revocation.</td>
					</tr>
					<tr>
						<td><strong>Gym Memberships</strong></td>
						<td>Member Portal, Subscription Billing (Stripe/Maya), Check-in UI</td>
						<td>Photo verification on tap to prevent "card sharing" fraud.</td>
					</tr>
					<tr>
						<td><strong>Verification (LGU/Gov)</strong></td>
						<td>UV/Hologram Lamination, Secure PII Database, Govt API Integration</td>
						<td>Anti-counterfeit physical layer + secure, encrypted digital verification.</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section>
		<h2>12. THE BOTTOM LINE</h2>
		<p>Kanaya is a school identity survival company that uses a mobile app to guarantee zero encoding errors and realistic 3-5 day lead times.</p>
		<p><strong>Our goal in 2026:</strong> 3 schools, 1,500 students, ₱225k card revenue. 1 SaaS paying client. 0 government contracts, 0 corporate dashboards.</p>
	</section>

	<footer class="docs-footer">
		<p>CEO Confidential Brief • Internal Use Only</p>
	</footer>
</div>

<style>
	.docs-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', system-ui, sans-serif;
		line-height: 1.6;
		color: #1a202c;
	}

	.docs-header {
		border-bottom: 3px solid #2d3748;
		padding-bottom: 1.5rem;
		margin-bottom: 2rem;
	}

	.docs-header h1 {
		margin: 0 0 0.5rem;
		font-size: 1.75rem;
		font-weight: 800;
		letter-spacing: -0.025em;
	}

	.meta {
		color: #4a5568;
		font-size: 0.9rem;
		font-weight: 600;
		margin: 0.25rem 0;
	}

	.subject {
		color: #e53e3e;
		font-weight: 700;
		text-transform: uppercase;
		font-size: 0.8rem;
		margin-top: 0.5rem;
	}

	section {
		margin-bottom: 3rem;
	}

	h2 {
		font-size: 1.25rem;
		font-weight: 800;
		border-bottom: 1px solid #e2e8f0;
		padding-bottom: 0.5rem;
		margin: 2rem 0 1rem;
		color: #2d3748;
	}

	h3 {
		font-size: 1.1rem;
		font-weight: 700;
		margin-bottom: 0.75rem;
	}

	.split-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin: 1.5rem 0;
	}

	@media (max-width: 640px) {
		.split-grid {
			grid-template-columns: 1fr;
		}
	}

	.danger-box {
		background: #fff5f5;
		border-left: 4px solid #f56565;
		padding: 1.25rem;
		border-radius: 4px;
	}

	.danger-box h3 {
		color: #c53030;
	}

	.success-box {
		background: #f0fff4;
		border-left: 4px solid #48bb78;
		padding: 1.25rem;
		border-radius: 4px;
	}

	.success-box h3 {
		color: #2f855a;
	}

	.pillar {
		background: #f7fafc;
		border-left: 4px solid #4a5568;
		padding: 1.25rem;
		margin: 1.5rem 0;
		border-radius: 4px;
	}

	.note {
		background: #fffaf0;
		border-left: 4px solid #ed8936;
		padding: 1.25rem;
		margin: 1.5rem 0;
		border-radius: 4px;
	}

	.highlight-box {
		background: #ebf8ff;
		padding: 1.25rem;
		border-radius: 8px;
		border: 1px solid #bee3f8;
	}

	.ground-truth {
		font-size: 1rem;
		background: #2d3748;
		color: white;
		padding: 1rem;
		border-radius: 6px;
		margin: 1.5rem 0;
	}

	.danger-list {
		list-style: none;
		padding: 0;
	}

	.danger-list li {
		padding: 0.5rem 0;
		color: #c53030;
		font-weight: 500;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1.5rem 0;
		font-size: 0.9rem;
	}

	th, td {
		border: 1px solid #e2e8f0;
		padding: 0.75rem;
		text-align: left;
	}

	th {
		background: #edf2f7;
		font-weight: 700;
	}

	tr:nth-child(even) {
		background: #fdfdfd;
	}

	.mt-4 { margin-top: 1rem; }

	.docs-footer {
		margin-top: 4rem;
		padding-top: 1.5rem;
		border-top: 1px solid #e2e8f0;
		text-align: center;
		color: #718096;
		font-size: 0.85rem;
		font-style: italic;
	}
</style>
