<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Simple Profit Calculator Logic
	let qty = $state(100);
	let pricePerId = $state(35);
	let costPerId = $state(12); // Estimated loaded cost
	let totalRevenue = $derived(qty * pricePerId);
	let totalCost = $derived(qty * costPerId);
	let totalProfit = $derived(totalRevenue - totalCost);
	let margin = $derived(((totalProfit / totalRevenue) * 100).toFixed(1));
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

	<div class="nav-grid">
		<a href="/admin/docs/sales" class="card sales">
			<div class="icon">💰</div>
			<h2>Sales &amp; Marketing</h2>
			<p>Pricing matrices, portfolio scripts, and client rules.</p>
		</a>

		<a href="/admin/docs/operations" class="card ops">
			<div class="icon">⚙️</div>
			<h2>Operations Manual</h2>
			<p>Printer settings, laminator temps, and RFID encoding.</p>
		</a>

		<a href="/admin/docs/inventory" class="card inventory">
			<div class="icon">📦</div>
			<h2>Inventory &amp; Logistics</h2>
			<p>Stock levels, supplier directory, and reorder points.</p>
		</a>

		<a href="/admin/docs/legal" class="card legal">
			<div class="icon">⚖️</div>
			<h2>Legal &amp; Contracts</h2>
			<p>TOS, anti-fraud waivers, and data privacy forms.</p>
		</a>

		<a href="/admin/docs/ads" class="card ads">
			<div class="icon">📢</div>
			<h2>Ads &amp; Campaigns</h2>
			<p>Ad creatives, targeting specs, and performance reports.</p>
		</a>

		<a href="/admin/docs/architecture" class="card architecture">
			<div class="icon">🏗️</div>
			<h2>Architecture</h2>
			<p>System diagrams, stack details, and infrastructure.</p>
		</a>

		<a href="/admin/docs/assets" class="card assets">
			<div class="icon">🎨</div>
			<h2>Brand Assets</h2>
			<p>Logos, typography, and official media kits.</p>
		</a>

		<a href="/admin/docs/gtm" class="card gtm">
			<div class="icon">🚀</div>
			<h2>Go-to-Market</h2>
			<p>Launch strategies, rollout plans, and positioning.</p>
		</a>

		<a href="/admin/docs/partners" class="card partners">
			<div class="icon">🤝</div>
			<h2>Partnerships</h2>
			<p>Partner programs, affiliate details, and integrations.</p>
		</a>

		<a href="/admin/docs/procurement" class="card procurement">
			<div class="icon">🛍️</div>
			<h2>Procurement</h2>
			<p>Vendor lists, purchasing guidelines, and sourcing.</p>
		</a>

		<a href="/admin/docs/promos" class="card promos">
			<div class="icon">🏷️</div>
			<h2>Promotions</h2>
			<p>Current offers, discount codes, and seasonal events.</p>
		</a>

		<a href="/admin/docs/proposal" class="card proposal">
			<div class="icon">📄</div>
			<h2>Proposals</h2>
			<p>Client proposal templates and pitch decks.</p>
		</a>

		<a href="/admin/docs/revenue" class="card revenue">
			<div class="icon">💹</div>
			<h2>Revenue</h2>
			<p>Financial reports, projections, and pricing models.</p>
		</a>

		<a href="/admin/docs/social" class="card social">
			<div class="icon">📱</div>
			<h2>Social Media</h2>
			<p>Content calendar, post guidelines, and engagement.</p>
		</a>

		<a href="/admin/docs/strategy" class="card strategy">
			<div class="icon">♟️</div>
			<h2>Strategy</h2>
			<p>Long-term goals, roadmaps, and business objectives.</p>
		</a>

		<a href="/admin/docs/youtube" class="card youtube">
			<div class="icon">📹</div>
			<h2>YouTube</h2>
			<p>Video content, scripts, and channel analytics.</p>
		</a>

		<a href="/llms.txt" target="_blank" class="card llm">
			<div class="icon">🤖</div>
			<h2>LLM Context</h2>
			<p>Consolidated documentation for AI context.</p>
			<div class="status-indicator">
				<span class="dot"></span> Live Generated
			</div>
		</a>
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
					Est. Cost (₱):
					<input type="number" bind:value={costPerId} min="1" />
				</label>
			</div>
			<div class="calc-results">
				<div class="res-row">
					<span>Revenue:</span>
					<strong>₱{totalRevenue.toLocaleString()}</strong>
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

	.card {
		background: white;
		padding: 2rem;
		border-radius: 12px;
		text-decoration: none;
		color: #2d3748;
		transition: transform 0.2s, box-shadow 0.2s;
		border: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
	}

	.card:hover {
		transform: translateY(-5px);
		box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
		border-color: #bee3f8;
	}

	.icon {
		font-size: 2.5rem;
		margin-bottom: 1rem;
	}
	.card h2 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
		color: #2b6cb0;
	}
	.card p {
		margin: 0;
		color: #718096;
		font-size: 0.9rem;
		line-height: 1.5;
	}

	/* Specific Card Accents */
	.card.sales {
		border-top: 4px solid #48bb78;
	}
	.card.ops {
		border-top: 4px solid #ed8936;
	}
	.card.inventory {
		border-top: 4px solid #4299e1;
	}
	.card.legal {
		border-top: 4px solid #e53e3e;
	}
	.card.ads {
		border-top: 4px solid #805ad5;
	}
	.card.architecture {
		border-top: 4px solid #718096;
	}
	.card.assets {
		border-top: 4px solid #d53f8c;
	}
	.card.gtm {
		border-top: 4px solid #f56565;
	}
	.card.partners {
		border-top: 4px solid #38b2ac;
	}
	.card.procurement {
		border-top: 4px solid #975a16;
	}
	.card.promos {
		border-top: 4px solid #d69e2e;
	}
	.card.proposal {
		border-top: 4px solid #667eea;
	}
	.card.revenue {
		border-top: 4px solid #48bb78;
	}
	.card.social {
		border-top: 4px solid #4299e1;
	}
	.card.strategy {
		border-top: 4px solid #2c5282;
	}
	.card.youtube {
		border-top: 4px solid #f00;
	}
	.card.llm {
		border-top: 4px solid #2d3748;
		position: relative;
	}
	.status-indicator {
		display: flex;
		align-items: center;
		font-size: 0.75rem;
		color: #48bb78;
		font-weight: bold;
		margin-top: 0.5rem;
		background: #f0fff4;
		padding: 2px 8px;
		border-radius: 12px;
		width: fit-content;
	}
	.status-indicator .dot {
		background: #48bb78;
		margin-right: 6px;
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
