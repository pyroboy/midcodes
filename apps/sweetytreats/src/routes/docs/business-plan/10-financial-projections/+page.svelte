<svelte:head>
	<title>FINANCIAL PROJECTIONS | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>10 Financial<br><span class="highlight">Projections</span></h1>
	</header>

	<article class="content">
		<h2>10.1 Startup Costs (CAPEX)</h2>
        <p>
			Starting a home bakery requires minimal upfront investment, keeping 
			risk low while we prove the business concept.
		</p>
        
        <div class="cost-table">
            <div class="cost-row header">
                <span>Item</span>
                <span>Cost</span>
            </div>
            <div class="cost-row">
                <span>Stand Mixer (if not owned)</span>
                <span>₱5,000</span>
            </div>
            <div class="cost-row">
                <span>Baking Equipment (pans, tools)</span>
                <span>₱2,000</span>
            </div>
            <div class="cost-row">
                <span>Initial Ingredient Stock</span>
                <span>₱3,000</span>
            </div>
            <div class="cost-row">
                <span>Packaging (first batch)</span>
                <span>₱2,000</span>
            </div>
            <div class="cost-row">
                <span>Branding & Marketing</span>
                <span>₱3,000</span>
            </div>
            <div class="cost-row total">
                <span>Total Startup</span>
                <span>₱15,000</span>
            </div>
        </div>
		<div class="divider"></div>

		<h2>10.2 Monthly Expenses (OPEX)</h2>
        <div class="highlight-box">
			<h3>📊 Monthly Operating Costs</h3>
			<ul>
                <li><strong>Ingredients:</strong> ₱3,000-5,000 (scales with orders)</li>
                <li><strong>Packaging:</strong> ₱500-1,000</li>
                <li><strong>Utilities:</strong> ₱500 additional</li>
                <li><strong>Marketing:</strong> ₱500 (social media ads)</li>
            </ul>
            <p class="total-note">Estimated Monthly OPEX: <strong>₱4,500-7,000</strong></p>
		</div>
        <div class="divider"></div>

		<h2>10.3 Revenue Projections</h2>
        <div class="stat-box">
            <div class="stat">
                 <span class="label">Month 1-3</span>
                 <span class="value">₱5,000</span>
                 <span class="detail">~100 boxes</span>
            </div>
            <div class="stat">
                 <span class="label">Month 4-6</span>
                 <span class="value">₱10,000</span>
                 <span class="detail">~200 boxes</span>
            </div>
            <div class="stat pink">
                 <span class="label">Month 12</span>
                 <span class="value">₱20,000</span>
                 <span class="detail">~400 boxes</span>
            </div>
        </div>
        <div class="divider"></div>

		<h2>10.4 Break-Even Analysis</h2>
        <p>
			With a startup cost of ₱15,000 and profit of ~₱20/box, we reach 
			break-even at approximately <strong>750 boxes sold</strong>.
		</p>
        <div class="milestone-box">
            <span class="icon">🎯</span>
            <p>Target: Break-even within <strong>6 months</strong></p>
        </div>
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

    .cost-table {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        overflow: hidden;
        margin: 2rem 0;
    }
    .cost-row {
        display: grid;
        grid-template-columns: 2fr 1fr;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--color-pink-light);
    }
    .cost-row:last-child { border-bottom: none; }
    .cost-row.header {
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-rose) 100%);
        color: white;
        font-weight: 700;
    }
    .cost-row.total {
        background: var(--color-cream);
        font-weight: 700;
        color: var(--color-brown);
    }
    .cost-row.total span:last-child {
        color: var(--color-pink);
        font-size: 1.2rem;
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
    .highlight-box ul { margin: 0 0 1rem 0; padding-left: 1.5rem; }
    .highlight-box li { margin-bottom: 0.5rem; color: #52525b; }
    .total-note {
        background: var(--color-cream);
        padding: 0.75rem 1rem;
        border-radius: 8px;
        margin: 0;
        text-align: center;
    }

    .stat-box {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
        margin: 2rem 0;
    }
    .stat { 
        display: flex; 
        flex-direction: column;
        background: white;
        padding: 1.5rem;
        border-radius: 12px;
        border: 2px solid var(--color-pink-light);
        flex: 1;
        min-width: 150px;
    }
    .stat .label { 
        font-size: 0.8rem; 
        text-transform: uppercase; 
        font-weight: 700; 
        color: #a1a1aa; 
        margin-bottom: 5px;
    }
    .stat .value { 
        font-family: var(--font-header); 
        font-size: 2rem; 
        font-weight: 700; 
        color: var(--color-brown); 
        line-height: 1;
    }
    .stat .detail {
        font-size: 0.85rem;
        color: #a1a1aa;
        margin-top: 0.5rem;
    }
    .stat.pink { 
        border-color: var(--color-pink);
        background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
    }
    .stat.pink .value { color: var(--color-pink); }

    .milestone-box {
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-rose) 100%);
        padding: 2rem;
        border-radius: 16px;
        text-align: center;
        color: white;
    }
    .milestone-box .icon { font-size: 2.5rem; display: block; margin-bottom: 0.5rem; }
    .milestone-box p { 
        margin: 0; 
        font-size: 1.25rem; 
        color: white;
    }
</style>
