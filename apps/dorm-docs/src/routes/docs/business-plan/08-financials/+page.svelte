<svelte:head>
	<title>08 Financials - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">08</span>
		<h1>Financials</h1>
	</header>

	<!-- SECTION A: REVENUE -->
	<section class="section">
		<h2>A. Revenue & Pricing</h2>
		
		<h3>Pricing Structure</h3>
		<div class="pricing-cards">
			<div class="price-card">
				<h4>Standard Bedspace</h4>
				<div class="price">₱2,000<span>/mo</span></div>
				<ul>
					<li>Bed + Personal Locker</li>
					<li>Shared CR/Bath</li>
					<li>Fiber WiFi Included</li>
					<li>Water Allocation (150L/day)</li>
				</ul>
			</div>
			<div class="price-card featured">
				<h4>Private Room</h4>
				<div class="price">₱5,500<span>/mo</span></div>
				<ul>
					<li>Private Bathroom (Selected)</li>
					<li>Full Bed + Cabinet</li>
					<li>Fiber WiFi Included</li>
					<li>Aircon Ready (Submetered)</li>
				</ul>
			</div>
		</div>

		<h3>Revenue by Floor <em>(Sample: Nov 2023)</em></h3>
		<table>
			<thead>
				<tr>
					<th>Revenue Stream</th>
					<th>Monthly Amount</th>
					<th>% of Total</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>2nd Floor Rent</td>
					<td>₱35,700</td>
					<td>57%</td>
				</tr>
				<tr>
					<td>3rd Floor Rent</td>
					<td>₱27,000</td>
					<td>43%</td>
				</tr>
				<tr class="total-row">
					<td><strong>Total Dorm Rent Income</strong></td>
					<td><strong>₱62,700</strong></td>
					<td><strong>100%</strong></td>
				</tr>
			</tbody>
		</table>
	</section>

	<!-- SECTION B: INITIAL PAYMENTS & FEES -->
	<section class="section">
		<h2>B. Payment Terms & Fees</h2>

		<h3>Initial Payment Requirements</h3>
		<table>
			<tbody>
				<tr>
					<th>Security Deposit</th>
					<td>1 month rent <em>(consumable, applied to last month)</em></td>
				</tr>
				<tr>
					<th>Advance Payment</th>
					<td>1 month rent <em>(non-refundable)</em></td>
				</tr>
				<tr>
					<th>Minimum Term</th>
					<td>6 months</td>
				</tr>
			</tbody>
		</table>

		<h3>Additional Service Fees</h3>
		<table>
			<tbody>
				<tr>
					<th>Guest Overnight Rate</th>
					<td>₱250/night <em>(max 5 days, with prior approval)</em></td>
				</tr>
				<tr>
					<th>Cleaning Fee (Move-out)</th>
					<td>Up to ₱200 <em>(if premises not cleaned upon vacating)</em></td>
				</tr>
			</tbody>
		</table>

		<h3>Penalty Schedule</h3>
		<p class="note">All fees and surcharges must be paid in full by the last day of each month. Penalties are added to the following month's billing statement.</p>
		<table class="penalty-table">
			<thead>
				<tr>
					<th>Violation</th>
					<th>Penalty</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Late Rent Payment</td>
					<td>3-day grace → <strong>5% of deposit</strong> late fee</td>
				</tr>
				<tr>
					<td>Late Utility Payment</td>
					<td>3-day grace → <strong>5% of deposit</strong> late fee</td>
				</tr>
				<tr>
					<td>Unpaid Utilities (15+ days)</td>
					<td>Amount + <strong>up to 25% of monthly rent</strong></td>
				</tr>
				<tr>
					<td>Unpaid Rent (30+ days)</td>
					<td>Eviction + <strong>up to 100% of monthly rent</strong></td>
				</tr>
				<tr>
					<td>Property Damage (Minor)</td>
					<td>Cost of repair/replacement</td>
				</tr>
				<tr>
					<td>Property Damage (Major)</td>
					<td>Repair cost + <strong>up to 50% of monthly rent</strong></td>
				</tr>
				<tr>
					<td>Unauthorized Guest</td>
					<td><strong>₱50/occurrence</strong>; 3 strikes = termination</td>
				</tr>
				<tr>
					<td>Early Termination (&lt;6 months)</td>
					<td>Forfeiture of entire security deposit</td>
				</tr>
				<tr>
					<td>Short Notice (&lt;30 days)</td>
					<td>Additional <strong>1 month's rent</strong></td>
				</tr>
				<tr>
					<td>Prohibited Activities (Drugs/Alcohol)</td>
					<td>Immediate termination + deposit forfeiture</td>
				</tr>
			</tbody>
		</table>
		<p class="note">📌 House rule violations: Max 3 strikes before automatic contract termination.</p>
	</section>

	<!-- SECTION C: EXPENSES -->
	<section class="section">
		<h2>C. Monthly Operating Expenses <em>(Sample: Nov 2023)</em></h2>
		<table>
			<thead>
				<tr>
					<th>Expense Category</th>
					<th>Monthly Amount</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Dorm Management Electricity</td>
					<td>₱4,590</td>
				</tr>
				<tr>
					<td>Dorm Management & Tenants Water</td>
					<td>₱3,980</td>
				</tr>
				<tr>
					<td>Dorm Internet (Fiber)</td>
					<td>₱1,700</td>
				</tr>
				<tr>
					<td>Dorm Janitorial</td>
					<td>₱3,400</td>
				</tr>
				<tr class="total-row">
					<td><strong>Total Monthly OPEX</strong></td>
					<td><strong>₱13,670</strong></td>
				</tr>
			</tbody>
		</table>
	</section>

	<!-- SECTION D: PROFITABILITY -->
	<section class="section">
		<h2>D. Profitability Analysis <em>(Sample: Nov 2023)</em></h2>
		
		<div class="metrics-grid">
			<div class="metric">
				<span class="metric-label">Gross Revenue</span>
				<span class="metric-value">₱62,700</span>
			</div>
			<div class="metric">
				<span class="metric-label">Operating Expenses</span>
				<span class="metric-value">₱13,670</span>
			</div>
			<div class="metric highlight">
				<span class="metric-label">Net Profit</span>
				<span class="metric-value">₱49,030</span>
			</div>
			<div class="metric highlight">
				<span class="metric-label">Profit Margin</span>
				<span class="metric-value">78%</span>
			</div>
		</div>

		<h3>Profit Sharing Model</h3>
		<table>
			<thead>
				<tr>
					<th>Share</th>
					<th>Amount</th>
					<th>Recipient</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>40%</td>
					<td>₱19,612</td>
					<td class="placeholder">[Manager/Operations]</td>
				</tr>
				<tr>
					<td>60%</td>
					<td>₱29,418</td>
					<td class="placeholder">[Owner/Capital]</td>
				</tr>
				<tr class="total-row">
					<td><strong>Total</strong></td>
					<td colspan="2"><strong>₱49,030</strong></td>
				</tr>
			</tbody>
		</table>

		<h3>Break-Even Analysis</h3>
		<table>
			<tbody>
				<tr>
					<th>Total Fixed Costs (Monthly)</th>
					<td>₱13,670</td>
				</tr>
				<tr>
					<th>Average Rent per Bed</th>
					<td>₱2,000</td>
				</tr>
				<tr>
					<th>Break-Even Occupancy</th>
					<td>~7 beds (23%)</td>
				</tr>
			</tbody>
		</table>
		<p class="note">💡 The dorm operates well above break-even with strong margins. Low fixed costs allow profitability even at low occupancy.</p>
	</section>

	<!-- SECTION E: PROJECTIONS -->
	<section class="section">
		<h2>E. Annual Projections</h2>
		<table>
			<thead>
				<tr>
					<th>Scenario</th>
					<th>Conservative (75%)</th>
					<th>Expected (85%)</th>
					<th>Optimistic (95%)</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Annual Revenue</td>
					<td class="placeholder">₱[X]</td>
					<td class="placeholder">₱[X]</td>
					<td class="placeholder">₱[X]</td>
				</tr>
				<tr>
					<td>Annual Expenses</td>
					<td class="placeholder">₱[X]</td>
					<td class="placeholder">₱[X]</td>
					<td class="placeholder">₱[X]</td>
				</tr>
				<tr class="total-row">
					<td><strong>Net Income</strong></td>
					<td class="placeholder"><strong>₱[X]</strong></td>
					<td class="placeholder"><strong>₱[X]</strong></td>
					<td class="placeholder"><strong>₱[X]</strong></td>
				</tr>
			</tbody>
		</table>
	</section>
</article>

<style>
	.chapter { max-width: 800px; }
	.chapter-header { margin-bottom: 3rem; }
	.chapter-number { font-family: var(--font-header); font-size: 4rem; font-weight: 700; color: var(--color-primary); opacity: 0.3; line-height: 1; }
	.chapter-header h1 { font-size: 3rem; margin-top: 0.5rem; line-height: 1.1; }
	
	.section { margin-bottom: 3rem; }
	.section h2 { font-size: 1.5rem; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }
	.section h3 { font-size: 1.1rem; margin: 1.5rem 0 0.75rem; text-transform: none; color: var(--color-black); }
	.section h4 { font-size: 1rem; margin-bottom: 0.5rem; text-transform: none; }
	
	.placeholder { background: #fef3c7; padding: 0.25rem 0.5rem; border-left: 3px solid #f59e0b; }
	.note { font-size: 0.9rem; color: #71717a; font-style: italic; margin-top: 1rem; }

	/* Tables */
	table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
	th, td { padding: 0.75rem 1rem; border: 1px solid var(--color-gray-200); text-align: left; }
	th { background: var(--color-gray-100); font-weight: 600; width: 40%; }
	thead th { background: var(--color-black); color: white; width: auto; }
	.total-row { background: var(--color-gray-100); font-weight: 600; }
	.penalty-table tbody tr:nth-child(even) { background: var(--color-gray-50, #fafafa); }

	/* Pricing Cards */
	.pricing-cards { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; margin-bottom: 1.5rem; }
	@media (max-width: 600px) { .pricing-cards { grid-template-columns: 1fr; } }
	.price-card { background: white; border: 2px solid var(--color-black); padding: 1.5rem; text-align: center; }
	.price-card.featured { border-color: var(--color-primary); border-width: 3px; position: relative; }
	.price-card.featured::before { content: '★ POPULAR'; position: absolute; top: -0.75rem; left: 50%; transform: translateX(-50%); background: var(--color-primary); color: white; padding: 0.25rem 0.75rem; font-size: 0.7rem; font-weight: 700; }
	.price-card h4 { margin-bottom: 0.5rem; font-size: 1.1rem; }
	.price { font-family: var(--font-header); font-size: 2.25rem; font-weight: 700; margin-bottom: 1rem; }
	.price span { font-size: 1rem; font-weight: 400; opacity: 0.7; }
	.price-card ul { text-align: left; margin: 0; padding-left: 1.5rem; }
	.price-card li { margin-bottom: 0.5rem; font-size: 0.95rem; }

	/* Metrics Grid */
	.metrics-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; margin-bottom: 1.5rem; }
	@media (max-width: 600px) { .metrics-grid { grid-template-columns: 1fr; } }
	.metric { background: white; border: 2px solid var(--color-black); padding: 1.5rem; text-align: center; }
	.metric.highlight { background: var(--color-black); color: white; }
	.metric-label { display: block; font-size: 0.8rem; text-transform: uppercase; font-weight: 600; margin-bottom: 0.5rem; letter-spacing: 0.05em; }
	.metric.highlight .metric-label { opacity: 0.7; }
	.metric-value { font-family: var(--font-header); font-size: 1.75rem; font-weight: 700; }
</style>
