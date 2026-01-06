<svelte:head>
	<title>Silog Business | Strategy</title>
</svelte:head>

<section class="doc-page">
	<a href="/" class="back-link">← Back to Dashboard</a>
	
	<header>
		<h1>Executive Strategy & Vision</h1>
		<p class="meta">Date: January 6, 2026 • Prepared For: Arjo Magno</p>
	</header>

	<article class="content">
		<h2>1. Business Overview</h2>
		<p>
			The primary objective is to launch and stabilize a streamlined Silog food business. 
			The model focuses on high-margin items ("Winners") to fund operations while maintaining 
			a "budget" line to ensure volume. The core financial philosophy is aggressive cost management 
			(portion control) combined with premium presentation to justify healthy margins.
		</p>

		<div class="highlight-box">
			<h3>Key Financial Targets</h3>
			<ul>
				<li><strong>Target Food Cost:</strong> 35% - 40%</li>
				<li><strong>Target Profit Margin:</strong> > 50% on key items</li>
				<li><strong>Break-Even Volume:</strong> ~15 meals per day</li>
			</ul>
		</div>

		<h2>2. Core Menu Strategy</h2>
		<p>The menu is engineered into four distinct categories to balance volume and profit:</p>
		
		<div class="strategy-grid">
			<div class="card winner">
				<h4>🏆 The "Winners" (>50% Margin)</h4>
				<p>High margin items that must NEVER run out of stock. These fund the business profitability.</p>
				<small>Examples: Longsilog, Squidsilog, Shanghai</small>
			</div>
			<div class="card volume">
				<h4>📊 Volume Drivers (40-49% Margin)</h4>
				<p>Good sellers that bring in traffic. Strict portion control is required to maintain margins.</p>
				<small>Examples: Burgersilog, Hotsilog, Corned Beef</small>
			</div>
			<div class="card premium">
				<h4>💎 Premium / Critical (Low Margin)</h4>
				<p>Necessary for "completeness" perception but less profitable. Keep inventory lean.</p>
				<small>Examples: Beef Tapa, Bangus, Sisig</small>
			</div>
			<div class="card budget">
				<h4>🍜 Budget / Merienda</h4>
				<p>Low entry price points to capture price-sensitive customers or add-on sales.</p>
				<small>Examples: Mami, Pancit Canton</small>
			</div>
		</div>
	</article>
</section>

<style>
	:global(body) {
		background-color: #f8fafc;
		font-family: 'Inter', sans-serif;
		color: #334155;
	}

	.doc-page {
		max-width: 800px;
		margin: 0 auto;
		padding: 3rem 2rem;
		background: white;
		min-height: 100vh;
		box-shadow: 0 0 50px rgba(0,0,0,0.05);
	}

	.back-link {
		display: inline-block;
		margin-bottom: 2rem;
		color: #64748b;
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9rem;
	}
	.back-link:hover { color: #f59e0b; }

	header h1 {
		font-size: 2.5rem;
		color: #0f172a;
		margin: 0 0 0.5rem;
	}
	.meta {
		color: #94a3b8;
		font-size: 0.9rem;
		margin-bottom: 3rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.content h2 {
		color: #1e293b;
		margin-top: 2.5rem;
		font-size: 1.5rem;
	}

	.content p {
		line-height: 1.7;
		color: #475569;
	}

	.highlight-box {
		background: #fffbeb;
		border: 1px solid #fcd34d;
		padding: 1.5rem;
		border-radius: 12px;
		margin: 2rem 0;
	}
	.highlight-box h3 {
		margin-top: 0;
		color: #b45309;
	}
	.highlight-box ul {
		margin: 0;
		padding-left: 1.5rem;
	}
	.highlight-box li {
		margin-bottom: 0.5rem;
		color: #78350f;
	}

	.strategy-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin-top: 2rem;
	}
	@media (max-width: 600px) { .strategy-grid { grid-template-columns: 1fr; } }

	.card {
		padding: 1.5rem;
		border-radius: 12px;
		background: #f8fafc;
		border: 1px solid #e2e8f0;
	}
	.card h4 { margin: 0 0 0.5rem; color: #0f172a; }
	.card p { font-size: 0.9rem; margin-bottom: 1rem; }
	.card small { display: block; color: #64748b; font-style: italic; }

	.winner { border-left: 4px solid #16a34a; background: #f0fdf4; }
	.volume { border-left: 4px solid #3b82f6; background: #eff6ff; }
	.premium { border-left: 4px solid #a855f7; background: #faf5ff; }
	.budget { border-left: 4px solid #f59e0b; background: #fffbeb; }
</style>
