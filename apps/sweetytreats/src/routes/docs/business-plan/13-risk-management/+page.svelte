<svelte:head>
	<title>RISK MANAGEMENT | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>13 Risk<br><span class="highlight">Management</span></h1>
	</header>

	<article class="content">
		<h2>13.1 Risk Identification</h2>
        <p>
			Understanding potential risks helps us prepare and respond effectively.
		</p>
        
        <div class="risk-grid">
            <div class="risk-card high">
                <span class="level">High</span>
                <h4>Food Safety Incident</h4>
                <p>Contamination or allergen issue affecting customers</p>
                <span class="mitigation">Mitigation: Strict hygiene, clear labeling, allergen protocols</span>
            </div>
            <div class="risk-card medium">
                <span class="level">Medium</span>
                <h4>Supply Chain Issues</h4>
                <p>Ingredient shortage or price spikes</p>
                <span class="mitigation">Mitigation: Multiple suppliers, bulk buying, price monitoring</span>
            </div>
            <div class="risk-card medium">
                <span class="level">Medium</span>
                <h4>Equipment Failure</h4>
                <p>Oven or mixer breakdown during orders</p>
                <span class="mitigation">Mitigation: Regular maintenance, backup options, repair fund</span>
            </div>
            <div class="risk-card low">
                <span class="level">Low</span>
                <h4>Competition</h4>
                <p>New cookie shops entering the market</p>
                <span class="mitigation">Mitigation: Focus on quality, unique recipes, customer loyalty</span>
            </div>
        </div>
		<div class="divider"></div>

		<h2>13.2 Seasonal Demand</h2>
        <div class="highlight-box">
			<h3>📅 Peak Seasons</h3>
			<ul>
                <li><strong>Christmas:</strong> Gift-giving season — highest demand</li>
                <li><strong>Valentine's Day:</strong> Romantic gift cookies</li>
                <li><strong>Graduation Season:</strong> Celebration treats</li>
                <li><strong>Summer:</strong> Lower demand — focus on preparation</li>
            </ul>
		</div>
        <div class="divider"></div>

		<h2>13.3 Contingency Plans</h2>
        <ul class="simple-list">
			<li><strong>Overbooked:</strong> Waitlist system, pre-order limits</li>
			<li><strong>Ingredient Shortage:</strong> Recipe substitution options</li>
			<li><strong>Personal Emergency:</strong> Pause orders, refund policy</li>
			<li><strong>Power Outage:</strong> Backup baking schedule</li>
		</ul>
        <div class="divider"></div>

		<h2>13.4 Emergency Fund</h2>
        <p>
			Maintain a buffer of <strong>₱10,000</strong> for unexpected expenses 
			or temporary income gaps.
		</p>
	</article>
</section>

<style>
    .doc-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 4rem 2rem;
    }

    .doc-header h1 {
        font-size: 4.5rem;
        line-height: 0.95;
        margin-bottom: 4rem;
        color: var(--color-brown);
    }
    .highlight { 
        color: white; 
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-rose) 100%); 
        padding: 0 1rem; 
        border-radius: 8px;
    }
    @media(max-width:600px) { .doc-header h1 { font-size: 3rem; }}

    h2 {
        border-left: 6px solid var(--color-pink);
        padding-left: 1rem;
        margin-bottom: 1.5rem;
        color: var(--color-brown);
    }
    
    p { 
        font-size: 1.1rem; 
        line-height: 1.7; 
        margin-bottom: 1.5rem; 
        color: #52525b;
    }

    .divider {
        height: 2px;
        background: var(--color-pink-light);
        margin: 3rem 0;
    }

    .risk-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    .risk-card {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        padding: 1.5rem;
    }
    .risk-card .level {
        display: inline-block;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        margin-bottom: 0.75rem;
    }
    .risk-card.high .level { background: #fee2e2; color: #dc2626; }
    .risk-card.medium .level { background: #fef3c7; color: #d97706; }
    .risk-card.low .level { background: #d1fae5; color: #059669; }
    .risk-card h4 {
        font-size: 1.1rem;
        margin-bottom: 0.5rem;
        color: var(--color-brown);
    }
    .risk-card p {
        font-size: 0.9rem;
        color: #71717a;
        margin-bottom: 1rem;
    }
    .risk-card .mitigation {
        font-size: 0.85rem;
        color: #52525b;
        background: var(--color-cream);
        padding: 0.5rem 0.75rem;
        border-radius: 8px;
        display: block;
    }

    .highlight-box {
        border: 2px solid var(--color-pink);
        padding: 2rem;
        background: white;
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15);
        margin: 2rem 0;
        border-radius: 16px;
    }
    .highlight-box h3 { 
        font-size: 1.25rem; 
        margin-bottom: 1rem;
        color: var(--color-brown);
    }
    .highlight-box ul { margin: 0; padding-left: 1.5rem; }
    .highlight-box li { margin-bottom: 0.5rem; color: #52525b; }

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }
</style>
