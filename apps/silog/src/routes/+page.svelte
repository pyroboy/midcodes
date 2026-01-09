<script lang="ts">
	let sellingPrice = $state(85);
	let baseCost = $state(21);
	let viandCost = $state(16);
	
	let totalCost = $derived(baseCost + viandCost);
	let profit = $derived(sellingPrice - totalCost);
	let margin = $derived(sellingPrice ? ((profit / sellingPrice) * 100).toFixed(1) : "0");
</script>

<svelte:head>
	<title>KUYA'S SILOG & LUGAW</title>
</svelte:head>

<div class="dashboard-wrapper">
	<header class="hero-header">
		<div class="brand-badge">BETA</div>
		<h1>Kuya's<br><span class="text-orange">Silog & Lugaw</span></h1>
		<p class="tagline">Strategic Operations & Financial Control</p>
	</header>

	<main class="grid-container">
		
		<!-- LEFT COLUMN: NAVIGATION -->
		<div class="nav-column">
			
            <section class="nav-group business-plan">
				<div class="group-header">
					<h2>Legacy<br>Plan</h2>
                    <span class="icon-big">📂</span>
				</div>
				<ul class="link-list">
					<li><a href="/docs/business-plan/01-executive-summary">01 // Executive Summary</a></li>
					<li><a href="/docs/business-plan/02-company-overview">02 // Company Overview</a></li>
					<li><a href="/docs/business-plan/03-market-analysis">03 // Market Analysis</a></li>
					<li><a href="/docs/business-plan/04-products">04 // Products & Menu</a></li>
					<li><a href="/docs/business-plan/05-marketing">05 // Marketing</a></li>
                    <li><a href="/docs/business-plan/06-operations">06 // Operations</a></li>
                    <li><a href="/docs/business-plan/07-organization">07 // Organization</a></li>
                    <li><a href="/docs/business-plan/08-financial-plan">08 // Financials</a></li>
					<li><a href="/docs/business-plan/09-risk-management">09 // Risk Management</a></li>
					<li><a href="/docs/business-plan/10-appendices">10 // Appendices</a></li>
					<li><a href="/docs/business-plan/11-initial-totex">11 // Initial TOTEX Breakdown</a></li>
					<li><a href="/docs/business-plan/13-printable-logs">13 // Ops Logs</a></li>
					<li><a href="/docs/business-plan/15-daily-checklists">15 // Daily Checklists</a></li>
					<li><a href="/docs/business-plan/16-contingency">16 // Contingency Plan</a></li>
					<li><a href="/docs/business-plan/17-complaint-handling">17 // Complaint Handling</a></li>
				</ul>
				<a href="/docs/business-plan/print-all" class="print-all-btn">🖨️ Print All Chapters</a>
			</section>

			<section class="nav-group ops">
				<h3>Operations</h3>
				<ul class="link-list">
					<li><a href="/docs/capex">Startup Capital (CAPEX)</a></li>
					<li><a href="/docs/opex">Monthly Burn (OPEX)</a></li>
					<li><a href="/docs/menu">Menu Profitability</a></li>
                    <li><a href="/docs/strategy">Strategy Overview</a></li>
				</ul>
			</section>

            <section class="nav-group ai">
				<h3>AI Context</h3>
				<ul class="link-list">
					<li><a href="/llms.txt" target="_blank">View llms.txt</a></li>
				</ul>
			</section>
		</div>

		<!-- RIGHT COLUMN: WIDGETS -->
		<div class="widget-column">
			<article class="widget calculator">
				<header class="widget-header">
					<h3>Profit Simulator</h3>
				</header>
				
				<div class="calc-body">
					<div class="input-group">
						<label for="selling-price">Selling Price</label>
						<div class="input-wrapper">
							<span>₱</span>
							<input id="selling-price" type="number" bind:value={sellingPrice} />
						</div>
					</div>
                    
                    <div class="row-inputs">
                        <div class="input-group">
                            <label for="base-cost">Base Cost</label>
                            <input id="base-cost" type="number" bind:value={baseCost} />
                        </div>
                        <div class="input-group">
                            <label for="viand-cost">Viand Cost</label>
                            <input id="viand-cost" type="number" bind:value={viandCost} />
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
                <h3>Launch Status</h3>
                <div class="status-list">
                    <div class="status-item done">
                        <span class="check">✓</span> Financial Plan
                    </div>
                     <div class="status-item done">
                        <span class="check">✓</span> Menu Pricing
                    </div>
                    <div class="status-item active">
                        <span class="spinner">↻</span> Store Setup (Maria Clara)
                    </div>
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
        border-bottom: 4px solid var(--color-black);
        padding-bottom: 2rem;
	}
	.brand-badge {
		position: absolute;
		top: -1.5rem;
		background: var(--color-orange);
		color: white;
		padding: 4px 8px;
		font-weight: 700;
        font-family: var(--font-header);
		font-size: 0.8rem;
		text-transform: uppercase;
        letter-spacing: 1px;
	}
	h1 {
		font-size: 6rem; /* BIG HEADER */
		line-height: 0.9;
        letter-spacing: -2px;
	}
	.text-orange { color: var(--color-orange); }
	.tagline {
		font-size: 1.25rem;
		color: var(--color-dark);
		margin-top: 1rem;
		font-weight: 500;
        font-family: var(--font-body);
        letter-spacing: -0.5px;
        opacity: 0.7;
	}

	/* GRID */
	.grid-container {
		display: grid;
		grid-template-columns: 2fr 1fr;
		gap: 4rem;
	}
    @media(max-width: 768px) {
        h1 { font-size: 4rem; }
        .grid-container { grid-template-columns: 1fr; }
    }

	/* NAV GROUPS */
	.nav-group { margin-bottom: 3rem; }
    
    .nav-group h3 {
        font-size: 1.5rem;
        border-left: 5px solid var(--color-orange);
        padding-left: 1rem;
        margin-bottom: 1.5rem;
    }

    .business-plan .group-header {
        background: var(--color-black);
        padding: 2rem;
        color: white;
        margin-bottom: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .business-plan .group-header h2 {
        color: white;
        font-size: 2.5rem;
        line-height: 1;
    }
    .icon-big { font-size: 2.5rem; }

    .business-plan .link-list {
        background: white;
        border: 2px solid var(--color-black);
        border-top: none;
        padding: 1.5rem;
    }
    
	.link-list {
		list-style: none;
		padding: 0;
		margin: 0;
	}
    .link-list li { margin-bottom: 0.75rem; }
	.link-list a {
		font-size: 1.1rem;
		font-weight: 600;
		display: block;
		padding: 0.5rem;
		transition: all 0.2s;
        border-bottom: 1px solid transparent;
	}
	.link-list a:hover {
		color: var(--color-orange);
		padding-left: 1rem;
        border-bottom: 1px solid var(--color-orange);
	}

    /* Print All Button */
    .print-all-btn {
        display: block;
        margin-top: 1rem;
        padding: 0.75rem 1rem;
        background: var(--color-orange);
        color: white;
        text-align: center;
        font-weight: 700;
        font-size: 1rem;
        text-decoration: none;
        transition: all 0.2s;
        border: 2px solid var(--color-black);
    }
    .print-all-btn:hover {
        background: var(--color-black);
        color: var(--color-orange);
    }
    /* WIDGETS */
    .widget {
        background: white;
        border: 2px solid var(--color-black);
        margin-bottom: 2rem;
        box-shadow: 8px 8px 0px var(--color-black); /* Retro brutalist shadow */
    }
    .widget-header {
        background: var(--color-black);
        color: white;
        padding: 1rem 1.5rem;
    }
    .widget-header h3 { color: white; font-size: 1.25rem; }

    .calc-body { padding: 1.5rem; }

    .input-group label {
        display: block;
        font-size: 0.8rem;
        text-transform: uppercase;
        font-weight: 700;
        margin-bottom: 0.5rem;
        color: #71717a;
    }
    .input-wrapper {
        display: flex;
        align-items: center;
        border-bottom: 2px solid var(--color-black);
    }
    .input-wrapper span { font-size: 1.5rem; font-weight: 700; color: var(--color-black); }
    input {
        width: 100%;
        border: none;
        font-family: var(--font-header);
        font-size: 1.5rem;
        padding: 0.5rem;
        background: transparent;
    }
    input:focus { outline: none; }
    
    .row-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-top: 1.5rem; }
    .row-inputs input { font-size: 1.25rem; border-bottom: 2px solid #e4e4e7; }

    .results-display {
        margin-top: 2rem;
        background: var(--color-black);
        color: white;
        padding: 1.5rem;
    }
    .result-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.5rem;
        border-bottom: 1px dashed #333;
        padding-bottom: 0.5rem;
    }
    .result-item:last-child { border: none; margin: 0; padding: 0; padding-top: 0.5rem;}
    .label { font-size: 0.9rem; text-transform: uppercase; opacity: 0.7; }
    .value { font-family: var(--font-header); font-size: 1.5rem; font-weight: 700; }
    .value.profit { color: #4ade80; }
    .value.margin.high { color: var(--color-orange); }
    .value.margin.low { color: #f87171; }

    /* STATUS */
    .status-list { padding: 1.5rem; }
    .status-item {
        margin-bottom: 1rem;
        font-family: var(--font-header);
        font-size: 1.1rem;
        display: flex;
        align-items: center;
    }
    .status-item.done { text-decoration: line-through; color: #a1a1aa; }
    .status-item.active { color: var(--color-orange); }
    .check { color: #4ade80; margin-right: 0.5rem; font-weight: 900; }
    .spinner { margin-right: 0.5rem; font-weight: 900; }
</style>
