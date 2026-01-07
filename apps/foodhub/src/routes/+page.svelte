<script lang="ts">
	let totalStalls = $state(12);
	let occupiedStalls = $state(9);
	let monthlyRate = $state(8000);
	
	let occupancyRate = $derived(totalStalls ? ((occupiedStalls / totalStalls) * 100).toFixed(0) : "0");
	let monthlyRevenue = $derived(occupiedStalls * monthlyRate);
	let potentialRevenue = $derived(totalStalls * monthlyRate);
</script>

<svelte:head>
	<title>FOODHUB — Stall Leasing Management</title>
	<meta name="description" content="FoodHub commercial real estate documentation and knowledge base for food court stall leasing">
</svelte:head>

<div class="dashboard-wrapper">
	<header class="hero-header">
		<div class="brand-badge">DOCS</div>
		<h1>Food<br><span class="text-pink">Hub</span></h1>
		<p class="tagline">Stall Leasing & Commercial Real Estate</p>
	</header>

	<main class="grid-container">
		
		<!-- LEFT COLUMN: NAVIGATION -->
		<div class="nav-column">
			
            <section class="nav-group business-plan">
				<div class="group-header">
					<h2>Business<br>Plan</h2>
                    <span class="icon-big">🏪</span>
				</div>
				<ul class="link-list">
					<li><a href="/docs/business-plan/01-executive-summary">01 // Executive Summary</a></li>
					<li><a href="/docs/business-plan/02-company-profile">02 // Company Profile</a></li>
					<li><a href="/docs/business-plan/03-market-analysis">03 // Market Analysis</a></li>
					<li><a href="/docs/business-plan/04-facility-stalls">04 // Facility & Stalls</a></li>
					<li><a href="/docs/business-plan/05-lease-structure">05 // Lease Structure</a></li>
                    <li><a href="/docs/business-plan/06-marketing-strategy">06 // Marketing Strategy</a></li>
                    <li><a href="/docs/business-plan/07-operations">07 // Operations</a></li>
                    <li><a href="/docs/business-plan/08-organization">08 // Organization</a></li>
					<li><a href="/docs/business-plan/09-financial-plan">09 // Financial Plan</a></li>
					<li><a href="/docs/business-plan/10-risk-management">10 // Risk Management</a></li>
					<li><a href="/docs/business-plan/11-initial-totex">11 // Initial TOTEX</a></li>
					<li><a href="/docs/business-plan/12-policies-guidelines">12 // Policies & Guidelines</a></li>
					<li><a href="/docs/business-plan/13-appendices">13 // Appendices</a></li>
				</ul>
			</section>

			<section class="nav-group ops">
				<h3>Quick Access</h3>
				<ul class="link-list">
					<li><a href="/docs/business-plan/05-lease-structure">📄 Lease Contracts</a></li>
					<li><a href="/docs/business-plan/12-policies-guidelines">📋 Vendor Policies</a></li>
					<li><a href="/docs/business-plan/13-appendices">🖨️ Printable Forms</a></li>
				</ul>
			</section>
		</div>

		<!-- RIGHT COLUMN: WIDGETS -->
		<div class="widget-column">
			<article class="widget calculator">
				<header class="widget-header">
					<h3>Occupancy Dashboard</h3>
				</header>
				
				<div class="calc-body">
					<div class="row-inputs">
                        <div class="input-group">
                            <label>Total Stalls</label>
                            <input type="number" bind:value={totalStalls} />
                        </div>
                        <div class="input-group">
                            <label>Occupied</label>
                            <input type="number" bind:value={occupiedStalls} />
                        </div>
                    </div>
					
					<div class="input-group" style="margin-top: 1rem;">
						<label>Monthly Rate (₱)</label>
						<div class="input-wrapper">
							<span>₱</span>
							<input type="number" bind:value={monthlyRate} />
						</div>
					</div>

					<div class="results-display">
						<div class="result-item">
							<span class="label">Occupancy Rate</span>
							<span class="value occupancy" 
                                  class:high={Number(occupancyRate) >= 80} 
                                  class:low={Number(occupancyRate) < 60}
                            >{occupancyRate}%</span>
						</div>
						<div class="result-item">
							<span class="label">Monthly Revenue</span>
							<span class="value revenue">₱{monthlyRevenue.toLocaleString()}</span>
						</div>
						<div class="result-item">
							<span class="label">Potential (100%)</span>
							<span class="value potential">₱{potentialRevenue.toLocaleString()}</span>
						</div>
					</div>
				</div>
			</article>

            <article class="widget status-card">
                <h3>Development Status</h3>
                <div class="status-list">
                    <div class="status-item done">
                        <span class="check">✓</span> Business Plan Outline
                    </div>
                     <div class="status-item active">
                        <span class="spinner">↻</span> Lease Templates
                    </div>
                    <div class="status-item pending">
                        <span class="pending-dot">○</span> Vendor Policies
                    </div>
					<div class="status-item pending">
                        <span class="pending-dot">○</span> Appendix Forms
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
		background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-green) 100%);
		color: white;
		padding: 4px 12px;
		font-weight: 700;
        font-family: var(--font-header);
		font-size: 0.8rem;
		text-transform: uppercase;
        letter-spacing: 1px;
		border-radius: 2px;
	}
	h1 {
		font-size: 6rem;
		line-height: 0.9;
        letter-spacing: -2px;
	}
	.text-pink { color: var(--color-pink); }
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
        border-left: 5px solid var(--color-green);
        padding-left: 1rem;
        margin-bottom: 1.5rem;
    }

    .business-plan .group-header {
        background: linear-gradient(135deg, var(--color-black) 0%, #1f1f23 100%);
        padding: 2rem;
        color: white;
        margin-bottom: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
		border-radius: 8px 8px 0 0;
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
		border-radius: 0 0 8px 8px;
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
		border-radius: 4px;
	}
	.link-list a:hover {
		color: var(--color-pink);
		padding-left: 1rem;
        background: var(--color-pink-light);
        border-bottom: 1px solid var(--color-pink);
	}

    /* WIDGETS */
    .widget {
        background: white;
        border: 2px solid var(--color-black);
        margin-bottom: 2rem;
        box-shadow: 8px 8px 0px var(--color-green);
		border-radius: 8px;
		overflow: hidden;
    }
    .widget-header {
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-pink-hover) 100%);
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
    
    .row-inputs { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .row-inputs input { font-size: 1.25rem; border-bottom: 2px solid #e4e4e7; }

    .results-display {
        margin-top: 2rem;
        background: linear-gradient(135deg, var(--color-black) 0%, #1f1f23 100%);
        color: white;
        padding: 1.5rem;
		border-radius: 8px;
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
    .value.revenue { color: var(--color-green); }
	.value.potential { color: #a1a1aa; font-size: 1.2rem; }
    .value.occupancy.high { color: var(--color-green); }
    .value.occupancy.low { color: #f87171; }

    /* STATUS */
	.status-card h3 {
		background: linear-gradient(135deg, var(--color-green) 0%, var(--color-green-hover) 100%);
		color: white;
		padding: 1rem 1.5rem;
		margin: 0;
	}
    .status-list { padding: 1.5rem; }
    .status-item {
        margin-bottom: 1rem;
        font-family: var(--font-header);
        font-size: 1.1rem;
        display: flex;
        align-items: center;
    }
    .status-item.done { text-decoration: line-through; color: #a1a1aa; }
    .status-item.active { color: var(--color-pink); }
	.status-item.pending { color: #71717a; }
    .check { color: var(--color-green); margin-right: 0.5rem; font-weight: 900; }
    .spinner { margin-right: 0.5rem; font-weight: 900; animation: spin 2s linear infinite; }
	.pending-dot { margin-right: 0.5rem; }
	
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
</style>
