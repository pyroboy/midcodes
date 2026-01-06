<svelte:head>
	<title>Silog Business | Targets</title>
</svelte:head>

<section class="doc-page">
	<a href="/" class="back-link">← Back to Dashboard</a>
	
	<header>
		<h1>Financial Targets & Break-Even</h1>
	</header>

	<article class="content">
        
        <div class="kpi-grid">
            <div class="kpi-card">
                <h3>Daily Break-Even</h3>
                <div class="value">15 Meals</div>
                <div class="sub">To cover OPEX</div>
            </div>
            <div class="kpi-card">
                <h3>Monthly Target</h3>
                <div class="value">455 Meals</div>
                <div class="sub">~₱20k Sales Volume</div>
            </div>
            <div class="kpi-card highlight">
                <h3>Avg Profit / Meal</h3>
                <div class="value">₱44.00</div>
                <div class="sub"> blended average</div>
            </div>
        </div>

		<h2>Break-Even Logic</h2>
        <p>To cover the estimated monthly OPEX of <strong>₱20,000</strong> (excluding rent):</p>
		<ul>
			<li><strong>Required Monthly Sales:</strong> ₱20,000 / ₱44 (Avg Profit) = 455 Meals</li>
			<li><strong>Daily Requirement:</strong> 455 / 30 Days = ~15 Meals</li>
		</ul>
        <div class="insight-box">
            <strong>🚀 Insight:</strong>
            <p>Every meal sold AFTER the 15th meal of the day is pure profit.</p>
        </div>

	</article>
</section>

<style>
	:global(body) { background-color: #f8fafc; font-family: 'Inter', sans-serif; color: #334155; }
    .doc-page { max-width: 800px; margin: 0 auto; padding: 3rem 2rem; background: white; min-height: 100vh; }
    .back-link { display: inline-block; margin-bottom: 2rem; color: #64748b; text-decoration: none; }
    h1 { margin-bottom: 3rem; color: #0f172a; }
    
    .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; margin-bottom: 3rem; }
    .kpi-card { background: #f8fafc; padding: 1.5rem; border-radius: 12px; text-align: center; border: 1px solid #e2e8f0; }
    .kpi-card h3 { margin: 0 0 0.5rem; font-size: 0.9rem; color: #64748b; text-transform: uppercase; }
    .kpi-card .value { font-size: 2rem; font-weight: 800; color: #0f172a; }
    .kpi-card .sub { font-size: 0.85rem; color: #94a3b8; }
    
    .kpi-card.highlight { background: #f0fdf4; border-color: #bbf7d0; }
    .kpi-card.highlight .value { color: #16a34a; }

    .insight-box { background: #eff6ff; padding: 1.5rem; border-radius: 8px; border-left: 4px solid #3b82f6; margin-top: 2rem; }
    .insight-box strong { color: #1e40af; }
    .insight-box p { margin: 0.5rem 0 0; color: #1e3a8a; }

    ul { line-height: 1.8; color: #334155; }
</style>
