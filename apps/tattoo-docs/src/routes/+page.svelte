<script lang="ts">
</script>

<svelte:head>
	<title>TATTOO STUDIO | Documentation Hub</title>
</svelte:head>

<div class="dashboard-wrapper">
	<header class="hero-header">
		<div class="brand-badge">DOCS</div>
		<h1>Tattoo<br><span class="text-accent">Studio</span></h1>
		<p class="tagline">Business Plan & Knowledge Base</p>
	</header>

	<main class="grid-container">
		
		<!-- LEFT COLUMN: NAVIGATION -->
		<div class="nav-column">
			
            <section class="nav-group business-plan">
				<div class="group-header">
					<h2>Business<br>Plan</h2>
                    <span class="icon-big">🖋️</span>
				</div>
				<ul class="link-list">
					<li><a href="/docs/business-plan/01-executive-summary">01 // Executive Summary</a></li>
					<li><a href="/docs/business-plan/02-studio-overview">02 // Studio Overview</a></li>
					<li><a href="/docs/business-plan/03-services-pricing">03 // Services & Pricing</a></li>
					<li><a href="/docs/business-plan/04-market-analysis">04 // Market Analysis</a></li>
					<li><a href="/docs/business-plan/05-brand-identity">05 // Brand Identity</a></li>
                    <li><a href="/docs/business-plan/06-legal-compliance">06 // Legal & Compliance</a></li>
                    <li><a href="/docs/business-plan/07-health-safety">07 // Health & Safety</a></li>
                    <li><a href="/docs/business-plan/08-client-consent">08 // Client Consent & Waivers</a></li>
					<li><a href="/docs/business-plan/09-studio-policies">09 // Studio Policies</a></li>
					<li><a href="/docs/business-plan/10-financial-plan">10 // Financial Plan</a></li>
					<li><a href="/docs/business-plan/11-marketing-strategy">11 // Marketing Strategy</a></li>
					<li><a href="/docs/business-plan/12-operations">12 // Operations</a></li>
					<li><a href="/docs/business-plan/13-equipment-supplies">13 // Equipment & Supplies</a></li>
					<li><a href="/docs/business-plan/14-design-portfolio">14 // Design Portfolio</a></li>
					<li><a href="/docs/business-plan/15-risk-management">15 // Risk Management</a></li>
					<li><a href="/docs/business-plan/16-appendices">16 // Appendices</a></li>
				</ul>
			</section>

			<section class="nav-group ops">
				<h3>Quick Links</h3>
				<ul class="link-list">
					<li><a href="/docs/business-plan/06-legal-compliance">📋 Permits & Licenses</a></li>
					<li><a href="/docs/business-plan/08-client-consent">📝 Waiver Templates</a></li>
					<li><a href="/docs/business-plan/09-studio-policies">📌 Studio Policies</a></li>
                    <li><a href="/docs/business-plan/07-health-safety">🩺 Health Protocols</a></li>
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
			<article class="widget info-card">
				<header class="widget-header">
					<h3>Solo Artist Studio</h3>
				</header>
				<div class="card-body">
					<p>This documentation hub is designed for a <strong>solo tattoo artist</strong> running their own studio.</p>
					<ul>
						<li>Business registration & permits</li>
						<li>Health & safety compliance</li>
						<li>Client consent forms</li>
						<li>Pricing strategies</li>
						<li>Portfolio management</li>
					</ul>
				</div>
			</article>

            <article class="widget status-card">
                <h3>Documentation Status</h3>
                <div class="status-list">
                    <div class="status-item active">
                        <span class="spinner">↻</span> Business Plan Draft
                    </div>
                     <div class="status-item pending">
                        <span class="dot">○</span> Legal Documents
                    </div>
                    <div class="status-item pending">
                        <span class="dot">○</span> Waiver Templates
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
		background: var(--color-black);
		color: white;
		padding: 4px 8px;
		font-weight: 700;
        font-family: var(--font-header);
		font-size: 0.8rem;
		text-transform: uppercase;
        letter-spacing: 2px;
	}
	h1 {
		font-size: 6rem;
		line-height: 0.9;
        letter-spacing: -2px;
	}
	.text-accent { 
		color: var(--color-white); 
		background: var(--color-black); 
		padding: 0 1rem; 
	}
	.tagline {
		font-size: 1.25rem;
		color: var(--color-gray-600);
		margin-top: 1rem;
		font-weight: 500;
        font-family: var(--font-body);
        letter-spacing: -0.5px;
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
        border-left: 5px solid var(--color-black);
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
		color: var(--color-gray-500);
		padding-left: 1rem;
        border-bottom: 1px solid var(--color-black);
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

    .card-body { padding: 1.5rem; }
    .card-body p { 
        font-size: 1rem; 
        line-height: 1.6; 
        margin-bottom: 1rem;
        color: var(--color-gray-600);
    }
    .card-body ul {
        margin: 0;
        padding-left: 1.25rem;
    }
    .card-body li {
        margin-bottom: 0.5rem;
        font-size: 0.95rem;
        color: var(--color-gray-700);
    }

    /* STATUS */
    .status-list { padding: 1.5rem; }
    .status-item {
        margin-bottom: 1rem;
        font-family: var(--font-header);
        font-size: 1.1rem;
        display: flex;
        align-items: center;
    }
    .status-item.pending { color: var(--color-gray-400); }
    .status-item.active { color: var(--color-black); }
    .dot { margin-right: 0.5rem; }
    .spinner { margin-right: 0.5rem; font-weight: 900; }
</style>
