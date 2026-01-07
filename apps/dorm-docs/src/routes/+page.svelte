<script lang="ts">
</script>

<svelte:head>
	<title>D.A Tirol Dormitory - Knowledge Base</title>
</svelte:head>

<div class="dashboard-wrapper">
	<header class="hero-header">
		<div class="brand-badge">D.A TIROL DORMITORY</div>
		<h1>Dorm<br><span class="text-primary">Management</span></h1>
		<p class="tagline">Operations & Reports Hub</p>
	</header>

	<main class="grid-container">
		
		<!-- LEFT COLUMN: NAVIGATION -->
		<div class="nav-column">
			
            <section class="nav-group business-plan">
				<div class="group-header">
					<h2>Business<br>Plan</h2>
                    <span class="icon-big">📋</span>
				</div>
				<ul class="link-list">
					<li><a href="/docs/business-plan/01-executive-summary">01 // Executive Summary</a></li>
					<li><a href="/docs/business-plan/02-company-profile">02 // Company Profile</a></li>
					<li><a href="/docs/business-plan/03-property-overview">03 // Property Overview</a></li>
					<li><a href="/docs/business-plan/04-market-analysis">04 // Market Analysis</a></li>
					<li><a href="/docs/business-plan/05-services-amenities">05 // Services & Amenities</a></li>
                    <li><a href="/docs/business-plan/06-operations">06 // Operations</a></li>
                    <li><a href="/docs/business-plan/07-organization">07 // Organization</a></li>
                    <li><a href="/docs/business-plan/08-financials">08 // Financials</a></li>
					<li><a href="/docs/business-plan/09-marketing">09 // Marketing</a></li>
					<li><a href="/docs/business-plan/10-risk-management">10 // Risk Management</a></li>
					<li><a href="/docs/business-plan/11-growth-strategy">11 // Growth Strategy</a></li>
					<li><a href="/docs/business-plan/12-appendices">12 // Appendices</a></li>
					<li><a href="/docs/business-plan/18-app-specification">18 // App Specification</a></li>
				</ul>
			</section>

			<section class="nav-group reports">
				<div class="group-header reports-header">
					<h2>Data<br>Reports</h2>
                    <span class="icon-big">📊</span>
				</div>
				<ul class="link-list reports-list">
					<li><a href="/docs/reports/electricity">⚡ Electricity</a></li>
					<li><a href="/docs/reports/water">💧 Water</a></li>
					<li><a href="/docs/reports/population">👥 Population</a></li>
					<li><a href="/docs/reports/contracts">📄 Contracts</a></li>
					<li><a href="/docs/reports/revenue">💰 Revenue</a></li>
					<li><a href="/docs/reports/rents">🏠 Rents</a></li>
					<li><a href="/docs/reports/monthly">📅 Monthly Summary</a></li>
					<li><a href="/docs/reports/projects">🔧 Projects</a></li>
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
			<article class="widget status-card">
				<header class="widget-header">
					<h3>Quick Stats</h3>
				</header>
				<div class="stats-body">
					<div class="stat-item">
						<span class="stat-label">Occupancy Rate</span>
						<span class="stat-value good">85.3%</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Active Tenants</span>
						<span class="stat-value">29</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Collection Rate</span>
						<span class="stat-value good">90.4%</span>
					</div>
					<div class="stat-item">
						<span class="stat-label">Outstanding</span>
						<span class="stat-value warning">₱23,350</span>
					</div>
				</div>
			</article>

            <article class="widget status-card">
                <h3>Documentation Status</h3>
                <div class="status-list">
                    <div class="status-item done">
                        <span class="check">✓</span> TypeScript Types
                    </div>
                     <div class="status-item done">
                        <span class="check">✓</span> JSON Data Backbone
                    </div>
                    <div class="status-item active">
                        <span class="spinner">↻</span> Report Renderers
                    </div>
					<div class="status-item pending">
                        <span class="pending-icon">○</span> Business Plan Content
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
		background: var(--color-primary);
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
	.text-primary { color: var(--color-primary); }
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
        border-left: 5px solid var(--color-primary);
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

	.reports .group-header {
        background: var(--color-primary);
        padding: 2rem;
        color: white;
        margin-bottom: 0;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    .reports .group-header h2 {
        color: white;
        font-size: 2.5rem;
        line-height: 1;
    }
	.reports .link-list {
        background: white;
        border: 2px solid var(--color-primary);
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
		color: var(--color-primary);
		padding-left: 1rem;
        border-bottom: 1px solid var(--color-primary);
	}

    /* WIDGETS */
    .widget {
        background: white;
        border: 2px solid var(--color-black);
        margin-bottom: 2rem;
        box-shadow: 8px 8px 0px var(--color-black);
    }
    .widget-header {
        background: var(--color-black);
        color: white;
        padding: 1rem 1.5rem;
    }
    .widget-header h3 { color: white; font-size: 1.25rem; }

    .stats-body { padding: 1.5rem; }
	.stat-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 0;
		border-bottom: 1px dashed var(--color-gray-200);
	}
	.stat-item:last-child { border: none; }
	.stat-label { 
		font-size: 0.9rem; 
		color: #71717a;
		font-weight: 500;
	}
	.stat-value { 
		font-family: var(--font-header); 
		font-size: 1.25rem; 
		font-weight: 700; 
	}
	.stat-value.good { color: var(--color-accent); }
	.stat-value.warning { color: #f59e0b; }

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
    .status-item.active { color: var(--color-primary); }
	.status-item.pending { color: #71717a; }
    .check { color: var(--color-accent); margin-right: 0.5rem; font-weight: 900; }
    .spinner { margin-right: 0.5rem; font-weight: 900; }
	.pending-icon { margin-right: 0.5rem; }
</style>
