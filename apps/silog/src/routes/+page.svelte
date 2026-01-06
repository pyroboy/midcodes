<script lang="ts">
	// Simple Profit Calculator Logic for Dashboard Widget
	let sellingPrice = $state(85); // Default to Longsilog price
	let baseCost = $state(21);
	let viandCost = $state(16);
	
	let totalCost = $derived(baseCost + viandCost);
	let profit = $derived(sellingPrice - totalCost);
	let margin = $derived(sellingPrice ? ((profit / sellingPrice) * 100).toFixed(1) : "0");
</script>

<svelte:head>
	<title>Silog Business | Operations Hub</title>
</svelte:head>

<div class="dashboard-container">
	<header class="main-header">
		<div class="brand">
			<h1>
				Silog<span class="highlight">Admin</span>
			</h1>
			<p>Strategic Financial Planning & Operations Hub</p>
		</div>
		<div class="status-badge">
			<span class="dot"></span> Planning Phase
		</div>
	</header>

	<div class="docs-sections">
		<section class="link-group">
			<h3>Strategy & Vision</h3>
			<ul class="clean-links">
				<li><a href="/docs/strategy"><span class="icon">♟️</span> Executive Summary & Targets</a></li>
				<li><a href="/docs/targets"><span class="icon">🎯</span> Financial Targets & Break-Even</a></li>
			</ul>
		</section>

		<section class="link-group">
			<h3>Financials & Operations</h3>
			<ul class="clean-links">
				<li><a href="/docs/capex"><span class="icon">💰</span> CAPEX (Startup Capital)</a></li>
				<li><a href="/docs/opex"><span class="icon">📉</span> OPEX (Monthly Expenses)</a></li>
				<li><a href="/docs/menu"><span class="icon">🍱</span> Menu Engineering (Profitability)</a></li>
			</ul>
		</section>

		<section class="link-group llm-special">
			<h3>AI Context</h3>
			<ul class="clean-links">
				<li><a href="/llms.txt" target="_blank"><span class="icon">🤖</span> Live LLM Context</a></li>
				<li><a href="/llms.txt?format=pdf" target="_blank"><span class="icon">📄</span> Download PDF Bundle</a></li>
			</ul>
		</section>
	</div>

	<div class="split-section">
		<section class="widget calculator">
			<h3>⚡ Quick Profit Simulator</h3>
			<p class="subtitle">Estimate margins for new menu items.</p>
			
			<div class="calc-inputs">
				<label>
					Selling Price (₱)
					<input type="number" bind:value={sellingPrice} min="0" />
				</label>
				<label>
					Base Cost (₱)
					<input type="number" bind:value={baseCost} min="0" />
				</label>
				<label>
					Viand Cost (₱)
					<input type="number" bind:value={viandCost} min="0" />
				</label>
			</div>
			
			<div class="calc-results">
				<div class="res-row">
					<span>Total COGS</span>
					<strong>₱{totalCost}</strong>
				</div>
				<div class="res-row">
					<span>Net Profit</span>
					<strong class="profit">₱{profit}</strong>
				</div>
				<div class="res-row margin">
					<span>Margin</span>
					<span class="margin-value" class:high={Number(margin) >= 50} class:mid={Number(margin) >= 40 && Number(margin) < 50} class:low={Number(margin) < 40}>{margin}%</span>
				</div>
			</div>
		</section>

		<section class="widget summary">
			<h3>🚀 Launch Status</h3>
			<ul class="checklist">
				<li class="done">Financial Plan Approved</li>
				<li class="done">Capital Allocation (₱23,800)</li>
				<li class="pending">Menu Finalization</li>
				<li class="pending">Marketing Materials</li>
			</ul>
		</section>
	</div>

	<footer class="main-footer">
		<p>© 2026 Silog Business • Confidential & Proprietary</p>
	</footer>
</div>

<style>
	:global(body) {
		margin: 0;
		background-color: #f8fafc; /* Slate-50 */
		font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
		color: #1e293b; /* Slate-800 */
	}

	.dashboard-container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 3rem 2rem;
	}

	/* Header */
	.main-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 4rem;
	}
	.main-header h1 {
		margin: 0;
		color: #0f172a; /* Slate-900 */
		font-size: 2.25rem;
		font-weight: 800;
		letter-spacing: -0.05em;
	}
	.main-header .highlight {
		color: #f59e0b; /* Amber-500 for that 'Yolk' feel */
	}
	.main-header p {
		margin: 0.5rem 0 0;
		color: #64748b; /* Slate-500 */
		font-size: 1rem;
	}

	.status-badge {
		background: #fffbeb; /* Amber-50 */
		color: #b45309; /* Amber-700 */
		padding: 0.5rem 1rem;
		border-radius: 9999px;
		font-size: 0.875rem;
		font-weight: 600;
		display: flex;
		align-items: center;
		border: 1px solid #fcd34d; /* Amber-300 */
	}
	.dot {
		width: 8px;
		height: 8px;
		background: #d97706; /* Amber-600 */
		border-radius: 50%;
		margin-right: 8px;
		display: inline-block;
		animation: pulse 2s infinite;
	}

	/* Docs Sections */
	.docs-sections {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
		gap: 2rem;
		margin-bottom: 3rem;
	}

	.link-group {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
		border: 1px solid #e2e8f0; /* Slate-200 */
		transition: transform 0.2s, box-shadow 0.2s;
	}
	.link-group:hover {
		transform: translateY(-2px);
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.03);
	}

	.link-group h3 {
		margin: 0 0 1.5rem;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: #94a3b8; /* Slate-400 */
		font-weight: 700;
	}

	.clean-links {
		list-style: none;
		padding: 0;
		margin: 0;
	}

	.clean-links li {
		margin-bottom: 1rem;
	}
	.clean-links li:last-child {
		margin-bottom: 0;
	}

	.clean-links a {
		text-decoration: none;
		color: #334155; /* Slate-700 */
		font-size: 1.1rem;
		font-weight: 500;
		display: flex;
		align-items: center;
		transition: color 0.2s;
	}

	.clean-links a:hover {
		color: #f59e0b; /* Amber-500 */
	}

	.clean-links .icon {
		margin-right: 16px;
		font-size: 1.4rem;
		width: 32px;
		text-align: center;
		background: #f1f5f9;
		padding: 4px;
		border-radius: 8px;
	}

	/* LLM Special Section styling */
	.llm-special {
		background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
		border-color: #334155;
	}
	.llm-special h3 {
		color: #64748b;
	}
	.llm-special a {
		color: #e2e8f0;
	}
	.llm-special a:hover {
		color: #38bdf8; /* Sky-400 */
	}
	.llm-special .icon {
		background: rgba(255,255,255,0.1);
	}

	/* Widgets */
	.split-section {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 2rem;
	}
	@media (max-width: 768px) {
		.split-section {
			grid-template-columns: 1fr;
		}
	}

	.widget {
		background: white;
		padding: 2rem;
		border-radius: 16px;
		border: 1px solid #e2e8f0;
	}
	
	.widget h3 {
		margin: 0;
		color: #1e293b;
		font-size: 1.25rem;
	}
	.subtitle {
		margin: 0.25rem 0 1.5rem;
		color: #64748b;
		font-size: 0.9rem;
	}

	.calc-inputs {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 1.5rem;
		margin-bottom: 2rem;
	}
	.calc-inputs label {
		font-size: 0.85rem;
		color: #64748b;
		display: flex;
		flex-direction: column;
		font-weight: 500;
	}
	.calc-inputs input {
		margin-top: 8px;
		padding: 10px;
		border: 1px solid #cbd5e0;
		border-radius: 8px;
		font-family: inherit;
		font-weight: 600;
		font-size: 1rem;
		color: #1e293b;
		transition: border-color 0.2s;
	}
	.calc-inputs input:focus {
		outline: none;
		border-color: #f59e0b;
	}

	.calc-results {
		background: #f8fafc;
		padding: 1.5rem;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
	}
	.res-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
		font-size: 1rem;
		color: #475569;
	}
	.res-row strong {
		color: #1e293b;
		font-weight: 600;
	}
	.res-row.margin {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px dashed #cbd5e0;
		margin-bottom: 0;
	}
	.res-row .profit {
		color: #16a34a; /* Green-600 */
		font-size: 1.2rem;
	}
	
	.margin-value {
		font-weight: 700;
		font-size: 1.2rem;
	}
	.margin-value.high { color: #16a34a; } /* >50% */
	.margin-value.mid { color: #ca8a04; } /* 40-50% */
	.margin-value.low { color: #dc2626; } /* <40% */

	/* Summary Checklist */
	.checklist {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.checklist li {
		margin-bottom: 1rem;
		padding-left: 1.75rem;
		position: relative;
		font-weight: 500;
	}
	.checklist li.done::before {
		content: '✓';
		position: absolute;
		left: 0;
		color: #16a34a;
		font-weight: bold;
	}
	.checklist li.done {
		color: #94a3b8;
		text-decoration: line-through;
	}
	.checklist li.pending::before {
		content: '○';
		position: absolute;
		left: 0;
		color: #f59e0b;
		font-weight: bold;
	}
	.checklist li.pending {
		color: #1e293b;
	}

	.main-footer {
		text-align: center;
		margin-top: 4rem;
		color: #94a3b8;
		font-size: 0.875rem;
	}

	@keyframes pulse {
		0% { transform: scale(0.95); opacity: 0.7; }
		50% { transform: scale(1); opacity: 1; }
		100% { transform: scale(0.95); opacity: 0.7; }
	}
</style>
