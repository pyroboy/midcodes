<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>SMS Pricing & Setup | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>SMS Pricing Documentation</h1>
		<p class="meta">Attendance System Notifications • Philippines & International Rates</p>
		<div class="status-chip highlight">Pricing Policy</div>
	</header>

	<section class="intro">
		<p>
			The pricing below is for local companies in the Philippines. This rate applies to SMS notifications sent to parents and staff within the Philippines mobile networks (Globe, Smart, DITO, Sun Cellular).
		</p>
	</section>

	<section>
		<h2>1. Package Pricing (Local PHP Rates)</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>SMS Credit Package</th>
						<th>1,000</th>
						<th>5,000</th>
						<th>10,000</th>
						<th>25,000</th>
						<th>Above 25k</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Price per SMS</strong></td>
						<td>₱0.60</td>
						<td>₱0.55</td>
						<td>₱0.50</td>
						<td>₱0.48</td>
						<td>Contact Sales</td>
					</tr>
					<tr class="total-row">
						<td><strong>Package Price</strong></td>
						<td>₱600.00</td>
						<td>₱2,750.00</td>
						<td>₱5,000.00</td>
						<td>₱12,000.00</td>
						<td>Contact Sales</td>
					</tr>
				</tbody>
			</table>
		</div>
		<ul class="clean-list">
			<li><strong>1 Credit</strong> = 1 SMS message (160 characters)</li>
			<li><strong>No Expiry:</strong> Credits DO NOT expire.</li>
			<li><strong>Prepaid:</strong> Operates on a prepaid basis; no monthly fees.</li>
		</ul>
		<p class="recommendation"><strong>Recommended Provider:</strong> <strong>OneWaySMS.ph</strong> — Local gateway with direct carrier connections.</p>
	</section>

	<section>
		<h2>2. Provider Comparison</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Provider</th>
						<th>1,000 SMS</th>
						<th>10,000 SMS</th>
						<th>Key Feature</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>OneWaySMS.ph</strong></td>
						<td>₱600</td>
						<td>₱5,000</td>
						<td>Direct local routing, No expiry</td>
					</tr>
					<tr>
						<td><strong>BulkSMS.com.ph</strong></td>
						<td>₱480</td>
						<td>₱4,200</td>
						<td>Cheaper, 1-year expiry</td>
					</tr>
					<tr>
						<td><strong>Plivo (Intl)</strong></td>
						<td>~₱310</td>
						<td>~₱3,100</td>
						<td>Lowest cost, complex routing</td>
					</tr>
					<tr>
						<td><strong>Twilio</strong></td>
						<td>~₱440</td>
						<td>~₱4,400</td>
						<td>Technical setup required</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="implementation">
		<h2>3. Implementation & Budget Planning</h2>
		<p><strong>Trigger:</strong> Guard scans student QR code at gate.<br><strong>Action:</strong> System sends SMS to parent: <em>"Juan Dela Cruz arrived at school at 7:45 AM"</em></p>
		
		<div class="analysis-grid">
			<div class="analysis-card">
				<h3>Small School (500 Students)</h3>
				<p class="cost">~₱10,000 / Month</p>
				<p class="stats">@ ₱1.00 per SMS (100% Markup)</p>
			</div>
			<div class="analysis-card">
				<h3>Large School (2,000 Students)</h3>
				<p class="cost">~₱40,000 / Month</p>
				<p class="stats">@ ₱1.00 per SMS (100% Markup)</p>
			</div>
		</div>
		<p class="pricing-pro-tip"><strong>Recommended Add-on Price:</strong> Charge clients <strong>₱1.00 per SMS</strong>. This covers your cost (₱0.50) and generates ₱5,000 - ₱20,000 monthly profit.</p>
	</section>

	<section>
		<h2>4. International Brand Rates</h2>
		<p>For brands with global presence or overseas notification requirements, rates are customized via <strong>Infobip</strong>.</p>
		<div class="rec-box">
			<h3>Infobip Request Checklist:</h3>
			<ul>
				<li>Mention "Philippines local SMS rates for educational notifications"</li>
				<li>Ask for "Committed-use discounts" for volumes > 25k/month</li>
				<li>Inquire about <strong>Alphanumeric Sender ID</strong> ("KANAYA" instead of a number)</li>
			</ul>
		</div>
	</section>

	<footer class="docs-footer">
		<p>© 2026 Kanaya Identity Solutions • SMS & Notification Standards</p>
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
		border-radius: 12px;
		box-shadow: 0 4px 10px rgba(0,0,0,0.05);
		font-family: 'Inter', system-ui, sans-serif;
		color: #334155;
	}

	.docs-header {
		border-bottom: 2px solid #f1f5f9;
		padding-bottom: 2rem;
		margin-bottom: 3rem;
	}

	h1 { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
	.meta { color: #64748b; font-size: 0.9rem; margin-top: 0.5rem; }

	.status-chip {
		display: inline-block;
		margin-top: 1rem;
		padding: 0.4rem 1rem;
		background: #fffbeb;
		color: #92400e;
		border-radius: 20px;
		font-weight: 700;
		font-size: 0.75rem;
		border: 1px solid #fde68a;
	}

	h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; border-left: 4px solid #f59e0b; padding-left: 1rem; margin: 3.5rem 0 1.5rem; }
	h3 { font-size: 1.1rem; color: #475569; margin: 0 0 1rem; }

	.table-wrapper { margin: 1.5rem 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
	table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
	th { background: #fffbeb; padding: 1rem; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
	td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }

	.total-row td { background: #fefce8; font-weight: 800; color: #92400e; }

	.analysis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-top: 2rem; }
	.analysis-card { background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; text-align: center; }
	.analysis-card .cost { font-size: 1.5rem; font-weight: 900; color: #0f172a; margin: 0.5rem 0; }
	.analysis-card .stats { font-size: 0.85rem; color: #64748b; }

	.recommendation {
		background: #fff7ed;
		color: #9a3412;
		padding: 1rem;
		border-radius: 8px;
		font-size: 0.95rem;
		margin-top: 1.5rem;
	}

	.pricing-pro-tip {
		margin-top: 2rem;
		font-weight: 700;
		color: #059669;
		background: #ecfdf5;
		padding: 1rem;
		border-radius: 8px;
		text-align: center;
	}

	.rec-box { background: #0f172a; color: #fff; padding: 2rem; border-radius: 12px; margin-top: 2rem; }
	.rec-box h3 { color: #fde68a; }
	.rec-box ul { list-style: circle; padding-left: 1.5rem; }

	.docs-footer { margin-top: 5rem; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 2rem; }
	.docs-footer a { color: #64748b; text-decoration: none; font-weight: 600; }

	@media (max-width: 768px) {
		.analysis-grid { grid-template-columns: 1fr; }
		.docs-container { padding: 1.5rem; }
	}
</style>
