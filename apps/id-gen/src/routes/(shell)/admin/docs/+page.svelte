<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Simple Profit Calculator Logic
	let qty = $state(100);
	let pricePerId = $state(35);
	let materialCost = $state(12);
	let laborCost = $state(5);
	let totalRevenue = $derived(qty * pricePerId);
	let totalCost = $derived((materialCost + laborCost) * qty);
	let totalProfit = $derived(totalRevenue - totalCost);
	let margin = $derived((totalRevenue ? (totalProfit / totalRevenue) * 100 : 0).toFixed(1));
</script>

<svelte:head>
	<title>Kanaya Admin | Documentation Hub</title>
</svelte:head>

<div class="dashboard-container">
	<header class="main-header">
		<div class="brand">
			<h1>
				Kanaya<span class="highlight">Admin</span>
			</h1>
			<p>Internal Operations &amp; Knowledge Base</p>
		</div>
		<div class="status-badge">
			<span class="dot"></span> System Operational
		</div>
	</header>

	<div class="docs-sections">
		<section class="link-group">
			<h3>Strategy & Brand</h3>
			<ul class="clean-links">
				<li><a href="/admin/docs/ceo-message"><span class="icon">✉️</span> CEO Ground Truth</a></li>
				<li><a href="/admin/docs/brand"><span class="icon">ᜃ</span> Brand & Heritage</a></li>
				<li><a href="/admin/docs/product-catalog"><span class="icon">📦</span> Product Catalog (Source of Truth)</a></li>
					<li><a href="/admin/docs/strategy"><span class="icon">♟️</span> Growth Strategy</a></li>
				<li><a href="/admin/docs/gtm"><span class="icon">🚀</span> Go-to-Market Plan</a></li>
				<li><a href="/admin/docs/architecture"><span class="icon">🏗️</span> System Architecture</a></li>
			</ul>
		</section>

		<section class="link-group">
			<h3>Sales & Revenue</h3>
			<ul class="clean-links">
				<li><a href="/admin/docs/sales"><span class="icon">💰</span> Sales Guide</a></li>
				<li><a href="/admin/docs/lgu-strategy"><span class="icon">🏛️</span> LGU Market Strategy (PWD/Senior)</a></li>
				<li><a href="/admin/docs/attendance-pricing"><span class="icon">📊</span> Attendance System Pricing</a></li>
				<li><a href="/admin/docs/revenue"><span class="icon">💹</span> Revenue Projections</a></li>
				<li><a href="/admin/docs/sms-pricing"><span class="icon">💬</span> SMS Pricing & Setup</a></li>
				<li><a href="/admin/docs/proposal"><span class="icon">📄</span> Client Proposals</a></li>
				<li><a href="/admin/docs/promos"><span class="icon">🏷️</span> Active Promotions</a></li>
				<li><a href="/admin/docs/partners"><span class="icon">🤝</span> Partnership Program</a></li>
			</ul>
		</section>

		<section class="link-group">
			<h3>Operations & Documentation</h3>
			<ul class="clean-links">
				<li><a href="/admin/docs/product"><span class="icon">🚀</span> Product & Tech Overview</a></li>
				<li><a href="/admin/docs/operations"><span class="icon">⚙️</span> Operations Manual</a></li>
				<li><a href="/admin/docs/inventory_master"><span class="icon">📊</span> Master Inventory</a></li>
				<li><a href="/admin/docs/processes"><span class="icon">🔄</span> PRODUCTION SYSTEM</a></li>
				<li><a href="/admin/docs/hardware"><span class="icon">📱</span> Hardware & Terminals</a></li>
				<li><a href="/admin/docs/low-end-card"><span class="icon">💳</span> LOW END CARD</a></li>
				<li><a href="/admin/docs/high-end-card"><span class="icon">🔬</span> HIGH END CARD</a></li>
				<li><a href="/admin/docs/lanyard-production"><span class="icon">🎗️</span> Lanyard Production</a></li>
				<li><a href="/admin/docs/procurement"><span class="icon">🛍️</span> Purchasing & Sourcing</a></li>
				<li><a href="/admin/docs/legal"><span class="icon">⚖️</span> Legal & Contracts</a></li>
			</ul>
		</section>

		<section class="link-group">
			<h3>Marketing & Media</h3>
			<ul class="clean-links">
				<li><a href="/admin/docs/pricing-how-it-works"><span class="icon">📈</span> Pricing & How It Works</a></li>
				<li><a href="/admin/docs/marketing_playbook"><span class="icon">📚</span> Growth & Media Playbook</a></li>
			</ul>
		</section>

		<section class="link-group business-plan">
			<h3>📋 Business Plan</h3>
			<ul class="clean-links">
				<li><a href="/admin/docs/business-plan/01-executive-summary"><span class="icon">01</span> Executive Summary</a></li>
				<li><a href="/admin/docs/business-plan/02-company-overview"><span class="icon">02</span> Company Overview</a></li>
				<li><a href="/admin/docs/business-plan/03-market-analysis"><span class="icon">03</span> Market Analysis</a></li>
				<li><a href="/admin/docs/business-plan/04-products"><span class="icon">04</span> Products & Services</a></li>
				<li><a href="/admin/docs/business-plan/05-marketing"><span class="icon">05</span> Marketing Strategy</a></li>
				<li><a href="/admin/docs/business-plan/06-operations"><span class="icon">06</span> Operational Plan</a></li>
				<li><a href="/admin/docs/business-plan/07-organization"><span class="icon">07</span> Organization</a></li>
				<li><a href="/admin/docs/business-plan/08-financial-plan"><span class="icon">08</span> Financial Plan</a></li>
				<li><a href="/admin/docs/business-plan/09-risk-management"><span class="icon">09</span> Risk Management</a></li>
				<li><a href="/admin/docs/business-plan/10-investment"><span class="icon">10</span> Investment Tiers</a></li>
				<li><a href="/admin/docs/business-plan/11-initial-totex"><span class="icon">11</span> Initial TOTEX</a></li>
				<li><a href="/admin/docs/business-plan/12-pricing"><span class="icon">12</span> Pricing Strategy</a></li>
				<li><a href="/admin/docs/business-plan/13-gtm"><span class="icon">13</span> Go-To-Market</a></li>
				<li><a href="/admin/docs/business-plan/14-inventory-supply"><span class="icon">14</span> Inventory Supply</a></li>
				<li><a href="/admin/docs/business-plan/15-appendices"><span class="icon">15</span> Appendices</a></li>
			</ul>
		</section>

		<section class="link-group llm-special">
			<h3>Developer Resources</h3>
			<ul class="clean-links">
				<li><a href="/llms.txt" target="_blank"><span class="icon">🤖</span> LLM Context (Live)</a></li>
				<li><a href="/llms.txt?format=pdf" target="_blank"><span class="icon">📄</span> Download PDF Bundle</a></li>
			</ul>
		</section>
	</div>

	<div class="split-section">
		<section class="widget calculator">
			<h3>⚡ Quick Quote Calculator</h3>
			<div class="calc-inputs">
				<label>
					Quantity:
					<input type="number" bind:value={qty} min="1" />
				</label>
				<label>
					Price per ID (₱):
					<input type="number" bind:value={pricePerId} min="1" />
				</label>
				<label>
					Est. Material Cost (₱):
					<input type="number" bind:value={materialCost} min="0" step="0.01" />
				</label>
				<label>
					Est. Labor Cost (₱):
					<input type="number" bind:value={laborCost} min="0" step="0.01" />
				</label>
			</div>
			<div class="calc-results">
				<div class="res-row">
					<span>Revenue:</span>
					<strong>₱{totalRevenue.toLocaleString()}</strong>
				</div>
				<div class="res-row">
					<span>Total Cost:</span>
					<strong>₱{totalCost.toLocaleString()}</strong>
				</div>
				<div class="res-row">
					<span>Profit:</span>
					<strong class="profit">₱{totalProfit.toLocaleString()}</strong>
				</div>
				<div class="res-row margin">
					<span>Margin:</span>
					<span>{margin}%</span>
				</div>
			</div>
		</section>

		<section class="widget contacts">
			<h3>📞 Speed Dial (Suppliers)</h3>
			<ul class="contact-list">
				<li>
					<strong>Supplier 1 (Rush/PVC)</strong>
					<span class="phone">0917-XXX-XXXX</span>
				</li>
				<li>
					<strong>Supplier 2 (Lanyards)</strong>
					<span class="phone">0922-XXX-XXXX</span>
				</li>
				<li>
					<strong>Printer Technician</strong>
					<span class="phone">09XX-XXX-XXXX</span>
				</li>
			</ul>
		</section>
	</div>

	<footer class="main-footer">
		<p>© 2026 Kanaya Identity Solutions • Authorized Access Only</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		background-color: #f4f7f6;
		font-family: 'Segoe UI', system-ui, sans-serif;
	}

	.dashboard-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 2rem;
	}

	/* Header */
	.main-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 3rem;
		background: white;
		padding: 1.5rem 2rem;
		border-radius: 12px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}
	.main-header h1 {
		margin: 0;
		color: #2d3748;
		font-size: 1.8rem;
	}
	.main-header .highlight {
		color: #3182ce;
	}
	.main-header p {
		margin: 0;
		color: #718096;
		font-size: 0.9rem;
	}

	.status-badge {
		background: #f0fff4;
		color: #2f855a;
		padding: 0.5rem 1rem;
		border-radius: 20px;
		font-size: 0.85rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		border: 1px solid #c6f6d5;
	}
	.dot {
		width: 8px;
		height: 8px;
		background: #48bb78;
		border-radius: 50%;
		margin-right: 8px;
		display: inline-block;
		animation: pulse 2s infinite;
	}

	/* Grid Navigation */
	.nav-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
		margin-bottom: 2.5rem;
	}

	/* Docs Sections */
	.docs-sections {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.link-group {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.05);
		border: 1px solid #e2e8f0;
	}

	.link-group h3 {
		margin: 0 0 1rem;
		font-size: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: #718096;
		border-bottom: 1px solid #edf2f7;
		padding-bottom: 0.5rem;
	}

	.clean-links {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.clean-links li {
		margin-bottom: 0.75rem;
	}

	.clean-links li:last-child {
		margin-bottom: 0;
	}

	.clean-links a {
		text-decoration: none;
		color: #2d3748;
		font-size: 1.05rem;
		display: flex;
		align-items: center;
		transition: color 0.2s, transform 0.2s;
	}

	.clean-links a:hover {
		color: #3182ce;
		transform: translateX(5px);
	}

	.clean-links .icon {
		margin-right: 12px;
		font-size: 1.25rem;
		width: 24px;
		text-align: center;
		display: inline-block;
	}

	.llm-special {
		background: #2d3748;
		border-color: #1a202c;
	}

	.llm-special h3 {
		color: #a0aec0;
		border-color: #4a5568;
	}

	.llm-special a {
		color: #edf2f7;
	}

	.llm-special a:hover {
		color: #63b3ed;
	}

	.business-plan {
		background: linear-gradient(135deg, #f0f7ff, #e0f2fe);
		border: 2px solid #3b82f6;
	}

	.business-plan h3 {
		color: #1e40af;
		border-color: #93c5fd;
	}

	.business-plan .icon {
		font-size: 0.85rem;
		font-weight: 700;
		color: #3b82f6;
	}

	/* Widgets Section */
	.split-section {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 1.5rem;
	}
	@media (max-width: 768px) {
		.split-section {
			grid-template-columns: 1fr;
		}
	}

	.widget {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}
	.widget h3 {
		margin: 0 0 1rem;
		color: #4a5568;
		font-size: 1.1rem;
		border-bottom: 1px solid #edf2f7;
		padding-bottom: 0.5rem;
	}

	/* Calculator Styling */
	.calc-inputs {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 10px;
		margin-bottom: 1rem;
	}
	.calc-inputs label {
		font-size: 0.8rem;
		color: #718096;
		display: flex;
		flex-direction: column;
	}
	.calc-inputs input {
		margin-top: 5px;
		padding: 8px;
		border: 1px solid #cbd5e0;
		border-radius: 6px;
		font-weight: bold;
	}

	.calc-results {
		background: #f7fafc;
		padding: 1rem;
		border-radius: 8px;
	}
	.res-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 0.5rem;
		font-size: 0.95rem;
	}
	.res-row.margin {
		margin-top: 0.5rem;
		padding-top: 0.5rem;
		border-top: 1px solid #e2e8f0;
		font-size: 0.85rem;
		color: #718096;
	}
	.profit {
		color: #38a169;
	}

	/* Contacts Styling */
	.contact-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.contact-list li {
		margin-bottom: 1rem;
		display: flex;
		flex-direction: column;
	}
	.contact-list strong {
		color: #2d3748;
		font-size: 0.9rem;
	}
	.contact-list .phone {
		color: #3182ce;
		font-family: monospace;
		font-size: 1rem;
	}

	.main-footer {
		text-align: center;
		margin-top: 3rem;
		color: #a0aec0;
		font-size: 0.85rem;
	}

	@keyframes pulse {
		0% {
			transform: scale(0.95);
			opacity: 0.7;
		}
		50% {
			transform: scale(1);
			opacity: 1;
		}
		100% {
			transform: scale(0.95);
			opacity: 0.7;
		}
	}
</style>
