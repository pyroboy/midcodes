<svelte:head>
	<title>Business Plan | Risk Management</title>
</svelte:head>

<section class="doc-page">
    <header class="doc-header">
        <h1>09 Risk<br><span class="highlight">Management</span></h1>
    </header>

	<article class="content">
        <div class="risk-grid">
            <!-- COLUMN 1: RISKS -->
            <div class="column">
                <header class="column-header risk">
                    <h2>Potential Risks</h2>
                    <span class="icon">⚠️</span>
                </header>
                
                <div class="card-stack">
                    <div class="risk-card">
                        <div class="card-header">
                            <span class="bad-badge">Financial</span>
                            <h3>Inflationary Pressure</h3>
                        </div>
                        <p>Rising costs of raw ingredients (rice, eggs, meat) directly affecting profit margins and plate costs.</p>
                    </div>

                    <div class="risk-card">
                        <div class="card-header">
                            <span class="bad-badge">Market</span>
                            <h3>New Competitors</h3>
                        </div>
                        <p>Emergence of similar silog or budget-meal establishments in the immediate vicinity (Maria Clara/UB).</p>
                    </div>

                    <div class="risk-card">
                        <div class="card-header">
                            <span class="bad-badge">Operational</span>
                            <h3>Supply Shortage</h3>
                        </div>
                        <p>Inconsistent availability of key ingredients due to seasonal issues or supplier constraints.</p>
                    </div>
                </div>
            </div>

            <!-- COLUMN 2: MITIGATIONS -->
            <div class="column">
                <header class="column-header mitigation">
                    <h2>Mitigation Strategies</h2>
                    <span class="icon">🛡️</span>
                </header>

                <div class="card-stack">
                    <div class="mitigation-card">
                        <div class="card-header">
                            <span class="good-badge">Strategy</span>
                            <h3>Cost Control</h3>
                        </div>
                        <p>Regular monitoring of supplier prices, bulk purchasing to lock in rates, and flexible menu pricing or portion adjustments.</p>
                    </div>

                    <div class="mitigation-card">
                        <div class="card-header">
                            <span class="good-badge">Defense</span>
                            <h3>Brand Loyalty</h3>
                        </div>
                        <p>Maintain high food quality, superior customer service, and loyalty programs. Focus on brand identity ("clean, modern silog").</p>
                    </div>

                    <div class="mitigation-card">
                        <div class="card-header">
                            <span class="good-badge">Logistics</span>
                            <h3>Multi-Sourcing</h3>
                        </div>
                        <p>Establish relationships with multiple suppliers for critical items (eggs, rice) and maintain a buffer stock of non-perishables.</p>
                    </div>
                </div>
            </div>
        </div>
	</article>
</section>

<style>
	/* PAGE LAYOUT */
    .doc-page { 
        max-width: 1000px; /* Wider for 2 cols */
        margin: 0 auto; 
        padding: 4rem 2rem; 
        min-height: 100vh; 
    }
    
    /* HEADER SECTION */
    .doc-header h1 {
        font-size: 5rem;
        line-height: 0.9;
        margin-bottom: 4rem;
        color: #0f172a;
    }
    .highlight { color: white; background: #0f172a; padding: 0 1rem; }
    @media(max-width:600px) { .doc-header h1 { font-size: 3.5rem; }}

    /* GRID LAYOUT */
    .risk-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 4rem;
    }

    .column-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 2rem;
        padding-bottom: 1rem;
        border-bottom: 2px solid var(--color-black);
    }
    .column-header h2 { font-size: 2rem; margin: 0; }
    .column-header .icon { font-size: 2rem; }

    .column-header.risk h2 { color: #dc2626; }
    .column-header.mitigation h2 { color: #16a34a; }

    /* CARDS */
    .card-stack { display: flex; flex-direction: column; gap: 1.5rem; }

    .risk-card, .mitigation-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        box-shadow: 4px 4px 0px var(--color-black);
        transition: transform 0.2s;
    }
    .risk-card:hover, .mitigation-card:hover {
        transform: translate(-2px, -2px);
        box-shadow: 6px 6px 0px var(--color-black);
    }

    .risk-card { border-left: 6px solid #dc2626; }
    .mitigation-card { border-left: 6px solid #16a34a; }

    .card-header {
        display: flex;
        align-items: center;
        gap: 1rem;
        margin-bottom: 1rem;
    }
    
    .card-header h3 { 
        font-size: 1.25rem; 
        margin: 0; 
        font-family: var(--font-header); 
    }

    .bad-badge, .good-badge {
        font-size: 0.7rem;
        text-transform: uppercase;
        font-weight: 800;
        padding: 2px 6px;
        border: 1px solid var(--color-black);
    }
    .bad-badge { background: #fee2e2; color: #991b1b; }
    .good-badge { background: #dcfce7; color: #166534; }

    p { margin: 0; line-height: 1.5; font-size: 1rem; color: #3f3f46; }

    @media (max-width: 768px) {
        h1 { font-size: 3rem; }
        .risk-grid { grid-template-columns: 1fr; gap: 3rem; }
    }
</style>
