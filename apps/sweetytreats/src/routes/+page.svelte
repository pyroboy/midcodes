<script lang="ts">
	let sellingPrice = $state(45);
	let ingredientCost = $state(12);
	let packagingCost = $state(5);
	
	let totalCost = $derived(ingredientCost + packagingCost);
	let profit = $derived(sellingPrice - totalCost);
	let margin = $derived(sellingPrice ? ((profit / sellingPrice) * 100).toFixed(1) : "0");
</script>

<svelte:head>
	<title>SWEETYTREATS | Homegrown Cookie Bakeshop</title>
</svelte:head>

<div class="dashboard-wrapper">
	<header class="hero-header">
		<div class="brand-badge">🍪 Homegrown</div>
		<h1>Sweety<br><span class="text-pink">Treats</span></h1>
		<p class="tagline">From Our Kitchen, With Love 💕</p>
	</header>

	<main class="grid-container">
		
		<!-- LEFT COLUMN: NAVIGATION -->
		<div class="nav-column">
			
            <section class="nav-group business-plan">
				<div class="group-header">
					<h2>Business<br>Plan</h2>
                    <span class="icon-big">🍪</span>
				</div>
				<ul class="link-list">
					<li><a href="/docs/business-plan/01-executive-summary">01 // Executive Summary</a></li>
					<li><a href="/docs/business-plan/02-founders-story">02 // Founder's Story</a></li>
					<li><a href="/docs/business-plan/03-products-recipes">03 // Products & Recipes</a></li>
					<li><a href="/docs/business-plan/04-target-market">04 // Target Market</a></li>
					<li><a href="/docs/business-plan/05-marketing-branding">05 // Marketing & Branding</a></li>
                    <li><a href="/docs/business-plan/06-sales-channels">06 // Sales Channels</a></li>
                    <li><a href="/docs/business-plan/07-operations-kitchen">07 // Operations & Kitchen</a></li>
                    <li><a href="/docs/business-plan/08-ingredients-sourcing">08 // Ingredients & Sourcing</a></li>
					<li><a href="/docs/business-plan/09-pricing-strategy">09 // Pricing Strategy</a></li>
					<li><a href="/docs/business-plan/10-financial-projections">10 // Financial Projections</a></li>
					<li><a href="/docs/business-plan/11-growth-roadmap">11 // Growth Roadmap</a></li>
					<li><a href="/docs/business-plan/12-legal-compliance">12 // Legal & Compliance</a></li>
					<li><a href="/docs/business-plan/13-risk-management">13 // Risk Management</a></li>
					<li><a href="/docs/business-plan/14-appendices">14 // Appendices</a></li>
				</ul>
			</section>

			<section class="nav-group ops">
				<h3>Quick Links</h3>
				<ul class="link-list">
					<li><a href="/docs/recipe-book">📖 Master Recipe Book</a></li>
					<li><a href="/docs/business-plan/03-products-recipes">🍪 Cookie Menu</a></li>
					<li><a href="/docs/business-plan/09-pricing-strategy">💰 Pricing Guide</a></li>
					<li><a href="/docs/business-plan/08-ingredients-sourcing">🌾 Ingredient List</a></li>
                    <li><a href="/docs/business-plan/11-growth-roadmap">📈 Growth Plan</a></li>
				</ul>
			</section>
		</div>

		<!-- RIGHT COLUMN: WIDGETS -->
		<div class="widget-column">
			<article class="widget calculator">
				<header class="widget-header">
					<h3>🍪 Cookie Profit Calculator</h3>
				</header>
				
				<div class="calc-body">
					<div class="input-group">
						<label>Selling Price (per box)</label>
						<div class="input-wrapper">
							<span>₱</span>
							<input type="number" bind:value={sellingPrice} />
						</div>
					</div>
                    
                    <div class="row-inputs">
                        <div class="input-group">
                            <label>Ingredient Cost</label>
                            <input type="number" bind:value={ingredientCost} />
                        </div>
                        <div class="input-group">
                            <label>Packaging Cost</label>
                            <input type="number" bind:value={packagingCost} />
                        </div>
                    </div>

					<div class="results-display">
						<div class="result-item">
							<span class="label">Net Profit</span>
							<span class="value profit">₱{profit}</span>
						</div>
						<div class="result-item">
							<span class="label">Margin</span>
							<span class="value margin" 
                                  class:high={Number(margin) >= 50} 
                                  class:low={Number(margin) < 40}
                            >{margin}%</span>
						</div>
					</div>
				</div>
			</article>

            <article class="widget status-card">
                <h3>🚀 Launch Checklist</h3>
                <div class="status-list">
                    <div class="status-item pending">
                        <span class="circle"></span> Perfect cookie recipes
                    </div>
                    <div class="status-item pending">
                        <span class="circle"></span> Source organic ingredients
                    </div>
                    <div class="status-item pending">
                        <span class="circle"></span> Design packaging
                    </div>
                    <div class="status-item pending">
                        <span class="circle"></span> Set up social media
                    </div>
                    <div class="status-item pending">
                        <span class="circle"></span> First batch bake!
                    </div>
                </div>
            </article>

            <article class="widget inspiration">
                <div class="quote-box">
                    <span class="quote-icon">💭</span>
                    <p>"Every cookie tells a story. Make yours unforgettable."</p>
                </div>
            </article>
		</div>

	</main>
</div>

<style>
	.dashboard-wrapper {
		max-width: 1200px;
		margin: 0 auto;
		padding: 4rem 2rem;
	}

	/* HERO HEADER */
	.hero-header {
		margin-bottom: 5rem;
		position: relative;
        border-bottom: 4px solid var(--color-pink);
        padding-bottom: 2rem;
	}
	.brand-badge {
		position: absolute;
		top: -1.5rem;
		background: var(--color-pink);
		color: white;
		padding: 6px 12px;
		font-weight: 700;
        font-family: var(--font-body);
		font-size: 0.85rem;
        border-radius: 20px;
        letter-spacing: 0.5px;
	}
	h1 {
		font-size: 5rem;
		line-height: 0.95;
        letter-spacing: -1px;
        color: var(--color-brown);
	}
	.text-pink { color: var(--color-pink); }
	.tagline {
		font-size: 1.35rem;
		color: var(--color-text-main);
		margin-top: 1rem;
		font-weight: 500;
        font-family: var(--font-body);
        opacity: 0.8;
	}

	/* GRID */
	.grid-container {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 4rem;
	}
    @media(max-width: 768px) {
        h1 { font-size: 3.5rem; }
        .grid-container { grid-template-columns: 1fr; }
    }

	/* NAV GROUPS */
	.nav-group { margin-bottom: 3rem; }
    
    .nav-group h3 {
        font-size: 1.4rem;
        font-family: var(--font-header);
        border-left: 5px solid var(--color-pink);
        padding-left: 1rem;
        margin-bottom: 1.5rem;
        color: var(--color-brown);
    }

    .business-plan .group-header {
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-rose) 100%);
        padding: 2rem;
        color: white;
        margin-bottom: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
        border-radius: 16px 16px 0 0;
    }
    .business-plan .group-header h2 {
        color: white;
        font-size: 2.2rem;
        line-height: 1.1;
    }
    .icon-big { font-size: 3rem; }

    .business-plan .link-list {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-top: none;
        padding: 1.5rem;
        border-radius: 0 0 16px 16px;
    }
    
	.link-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
    .link-list li { margin-bottom: 0.6rem; }
	.link-list a {
		font-size: 1.05rem;
		font-weight: 600;
		display: block;
		padding: 0.6rem 0.75rem;
		transition: all 0.2s;
        border-radius: 8px;
        color: var(--color-text-main);
	}
	.link-list a:hover {
		color: var(--color-pink);
		background: var(--color-pink-light);
        padding-left: 1.25rem;
	}

    /* WIDGETS */
    .widget {
        background: white;
        border: 2px solid var(--color-pink-light);
        margin-bottom: 2rem;
        border-radius: 16px;
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.1);
    }
    .widget-header {
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-rose) 100%);
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 14px 14px 0 0;
    }
    .widget-header h3 { color: white; font-size: 1.15rem; font-family: var(--font-body); font-weight: 700; }

    .calc-body { padding: 1.5rem; }

    .input-group label {
        display: block;
        font-size: 0.8rem;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #a1a1aa;
    }
    .input-wrapper {
        display: flex;
        align-items: center;
        border-bottom: 2px solid var(--color-pink);
    }
    .input-wrapper span { font-size: 1.5rem; font-weight: 700; color: var(--color-pink); }
    input {
        width: 100%;
        border: none;
        font-family: var(--font-header);
        font-size: 1.5rem;
        padding: 0.5rem;
        background: transparent;
        color: var(--color-brown);
    }
    input:focus { outline: none; }
    
    .row-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
    .row-inputs input { font-size: 1.25rem; border-bottom: 2px solid #fce7f3; }

    .results-display {
        margin-top: 2rem;
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-rose) 100%);
        color: white;
        padding: 1.5rem;
        border-radius: 12px;
    }
    .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        border-bottom: 1px dashed rgba(255,255,255,0.3);
        padding-bottom: 0.5rem;
    }
    .result-item:last-child { border: none; margin: 0; padding: 0; padding-top: 0.5rem;}
    .label { font-size: 0.9rem; text-transform: uppercase; opacity: 0.8; }
    .value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }
    .value.profit { color: #fef3c7; }
    .value.margin.high { color: #bbf7d0; }
    .value.margin.low { color: #fecaca; }

    /* STATUS */
    .status-card h3 {
        padding: 1.25rem 1.5rem;
        margin: 0;
        font-family: var(--font-body);
        font-weight: 700;
        font-size: 1.1rem;
        border-bottom: 1px solid var(--color-pink-light);
        color: var(--color-brown);
    }
    .status-list { padding: 1.25rem 1.5rem; }
    .status-item {
        margin-bottom: 0.9rem;
        font-family: var(--font-body);
        font-size: 1rem;
        display: flex;
        align-items: center;
        color: var(--color-text-main);
    }
    .status-item .circle {
        width: 12px;
        height: 12px;
        border: 2px solid var(--color-pink);
        border-radius: 50%;
        margin-right: 0.75rem;
    }
    .status-item.done .circle { background: var(--color-pink); }

    /* INSPIRATION */
    .inspiration { background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%); }
    .quote-box {
        padding: 2rem;
        text-align: center;
    }
    .quote-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    .quote-box p {
        font-family: var(--font-header);
        font-size: 1.25rem;
        font-style: italic;
        color: var(--color-pink-dark);
        margin: 0;
        line-height: 1.4;
    }
</style>
