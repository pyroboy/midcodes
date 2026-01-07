<svelte:head>
	<title>PRICING STRATEGY | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>09 Pricing<br><span class="highlight">Strategy</span></h1>
	</header>

	<article class="content">
		<h2>9.1 Cost Breakdown</h2>
        <p>
			Understanding our costs ensures we price fairly while maintaining healthy margins.
		</p>
        
        <div class="cost-table">
            <div class="cost-row header">
                <span>Cost Item</span>
                <span>Per Box (12 pcs)</span>
            </div>
            <div class="cost-row">
                <span>Ingredients (butter, chocolate, etc.)</span>
                <span>₱12-15</span>
            </div>
            <div class="cost-row">
                <span>Packaging (box, ribbon, label)</span>
                <span>₱5-8</span>
            </div>
            <div class="cost-row">
                <span>Utilities (gas, electricity)</span>
                <span>₱2-3</span>
            </div>
            <div class="cost-row total">
                <span>Total Cost</span>
                <span>₱19-26</span>
            </div>
        </div>
		<div class="divider"></div>

		<h2>9.2 Pricing Tiers</h2>
        <div class="pricing-grid">
            <div class="price-card">
                <span class="tier">Classic</span>
                <span class="price">₱45</span>
                <span class="desc">12 pcs per box</span>
                <ul>
                    <li>Chocolate Chip</li>
                    <li>Butter Shortbread</li>
                    <li>Oatmeal Raisin</li>
                </ul>
            </div>
            <div class="price-card featured">
                <span class="tier">Premium</span>
                <span class="price">₱55</span>
                <span class="desc">12 pcs per box</span>
                <ul>
                    <li>Double Chocolate</li>
                    <li>Peanut Butter</li>
                    <li>Red Velvet</li>
                </ul>
            </div>
            <div class="price-card">
                <span class="tier">Signature</span>
                <span class="price">₱65</span>
                <span class="desc">12 pcs per box</span>
                <ul>
                    <li>Ube White Choco</li>
                    <li>Matcha Almond</li>
                    <li>Seasonal Specials</li>
                </ul>
            </div>
        </div>
        <div class="divider"></div>

		<h2>9.3 Bundle Deals</h2>
        <ul class="simple-list">
			<li><strong>3-Box Bundle:</strong> 10% off (perfect for parties)</li>
			<li><strong>Assorted Box:</strong> Mix 3 flavors in one box</li>
			<li><strong>Corporate Orders:</strong> Custom pricing for 10+ boxes</li>
		</ul>
        <div class="divider"></div>

		<h2>9.4 Profit Targets</h2>
        <div class="stat-box">
            <div class="stat">
                 <span class="label">Target Margin</span>
                 <span class="value">50%+</span>
            </div>
            <div class="stat pink">
                 <span class="label">Profit per Box</span>
                 <span class="value">₱20-25</span>
            </div>
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

    .pricing-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    .price-card {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
    }
    .price-card.featured {
        border-color: var(--color-pink);
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.2);
        transform: scale(1.05);
    }
    .price-card .tier {
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: 700;
        color: var(--color-pink);
        display: block;
        margin-bottom: 0.5rem;
    }
    .price-card .price {
        font-family: var(--font-header);
        font-size: 2.5rem;
        font-weight: 700;
        color: var(--color-brown);
        display: block;
    }
    .price-card .desc {
        font-size: 0.85rem;
        color: #a1a1aa;
        display: block;
        margin-bottom: 1rem;
    }
    .price-card ul {
        list-style: none;
        padding: 0;
        margin: 0;
        font-size: 0.9rem;
        color: #71717a;
        text-align: left;
    }
    .price-card li { 
        padding: 0.25rem 0; 
        border-bottom: 1px dashed var(--color-pink-light);
    }
    .price-card li:last-child { border: none; }

    .stat-box {
        display: flex;
        gap: 3rem;
        margin-top: 2rem;
    }
    .stat { display: flex; flex-direction: column; }
    .stat .label { 
        font-size: 0.8rem; 
        text-transform: uppercase; 
        font-weight: 700; 
        color: #a1a1aa; 
        margin-bottom: 5px;
    }
    .stat .value { 
        font-family: var(--font-header); 
        font-size: 2.5rem; 
        font-weight: 700; 
        color: var(--color-brown); 
        line-height: 1;
    }
    .stat.pink .value { color: var(--color-pink); }

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }
</style>
