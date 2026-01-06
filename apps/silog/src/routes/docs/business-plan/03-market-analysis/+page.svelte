<svelte:head>
	<title>Business Plan | Market Analysis</title>
</svelte:head>

<section class="doc-page">
    <header class="doc-header">
        <h1>03 Market<br><span class="highlight">Analysis</span></h1>
    </header>
	
	<article class="content">
        <!-- 3.1 Industry Overview -->
        <section class="content-block">
            <h2>3.1 Industry Overview</h2>
            <div class="text-card">
                <p>The concept focuses on <strong class="accent-highlight">"Trendy, Modern, Clean Silog Meals"</strong>. The core value proposition is offering a <strong>premium silog experience at an affordable price point</strong>, bridging the gap between traditional carinderia-style silog and high-end breakfast cafes. We are expanding this by integrating <strong class="accent-highlight">Lugaw (Porridge)</strong> to capture a broader market share.</p>
            </div>
        </section>

        <!-- 3.2 Target Audience -->
        <section class="content-block">
            <h2>3.2 Target Audience Profile</h2>
            <div class="audience-grid">
                <div class="stat-card">
                    <span class="stat-label">Location</span>
                    <span class="stat-value">Maria Clara & UB</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Population</span>
                    <span class="stat-value">106,120</span>
                    <span class="stat-sub">Tagbilaran City</span>
                </div>
                <div class="stat-card">
                    <span class="stat-label">Median Age</span>
                    <span class="stat-value">26</span>
                </div>
            </div>
            
            <div class="segments-grid">
                <div class="segment-card day">
                    <h4>🌞 Day Shift</h4>
                    <p>Students and Faculty looking for heavy, affordable lunches between classes.</p>
                </div>
                <div class="segment-card night">
                    <h4>🌚 Night Shift</h4>
                    <p>BPO workers, local residents, and patrons of nearby establishments like <strong>Vapers</strong> and <strong>ECB Clubs</strong> seeking reliable late-night sustenance to fill the <strong>"Silog Gap"</strong>.</p>
                </div>
            </div>
        </section>

        <!-- 3.3 Competitor Analysis -->
        <section class="content-block">
            <h2>3.3 Competitor Analysis</h2>
            <div class="competitor-list">
                <div class="competitor-item">
                    <div class="comp-header">PAENG'S</div>
                    <div class="comp-detail">
                        <span class="status-badge negative">Weak Presence</span>
                        <p>Not apparent in the immediate UB school area, creating a significant opportunity.</p>
                    </div>
                </div>
                <div class="competitor-item">
                    <div class="comp-header">OTHER CHICKEN SPOTS</div>
                    <div class="comp-detail">
                        <span class="status-badge neutral">Established</span>
                        <p>Established but limited variety. Our edge: <strong>Cheaper options</strong> + <strong>Wider selection</strong>.</p>
                    </div>
                </div>
            </div>
        </section>
        
        <!-- 3.4 SWOT Analysis -->
        <section class="content-block">
            <h2>3.4 SWOT Analysis</h2>
            <div class="swot-grid">
                <div class="swot-card strength">
                    <div class="card-icon">S</div>
                    <h4>Strengths</h4>
                    <ul>
                        <li><strong>Family-Run Model:</strong> Low labor costs.</li>
                        <li><strong>High Margins:</strong> >50% on Longsilog/Shanghai Rice.</li>
                        <li><strong>Prime Location:</strong> High foot traffic.</li>
                    </ul>
                </div>
                <div class="swot-card weakness">
                    <div class="card-icon">W</div>
                    <h4>Weaknesses</h4>
                    <ul>
                        <li><strong>New Entrant:</strong> Zero brand equity initially.</li>
                        <li><strong>Margin Pressure:</strong> Tapsilog margins &lt;20%.</li>
                    </ul>
                </div>
                <div class="swot-card opportunity">
                    <div class="card-icon">O</div>
                    <h4>Opportunities</h4>
                    <ul>
                        <li><strong>"Silog Gap":</strong> Owning the late-night market.</li>
                        <li><strong>Digital Scale:</strong> Food Panda / Grab ready.</li>
                    </ul>
                </div>
                <div class="swot-card threat">
                    <div class="card-icon">T</div>
                    <h4>Threats</h4>
                    <ul>
                        <li><strong>Commodity Costs:</strong> Rice/Egg price volatility.</li>
                        <li><strong>Giant Chains:</strong> Jollibee/McDo promos.</li>
                    </ul>
                </div>
            </div>
        </section>
	</article>
</section>

<style>
    /* PAGE LAYOUT */
    .doc-page { 
        max-width: 900px; 
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

    /* SECTIONS */
    .content-block { margin-bottom: 4rem; }
    h2 { 
        font-size: 2rem; 
        border-left: 8px solid var(--color-orange);
        padding-left: 1rem;
        margin-bottom: 1.5rem;
    }
    
    /* TEXT CARD */
    .text-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        box-shadow: 6px 6px 0px rgba(0,0,0,0.1);
        font-size: 1.1rem;
        line-height: 1.6;
    }
    .accent-highlight { background: #ffedd5; color: var(--color-orange-hover); }

    /* AUDIENCE STATS */
    .audience-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
        margin-bottom: 1.5rem;
    }
    .stat-card {
        background: var(--color-black);
        color: white;
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        text-align: center;
        border: 2px solid var(--color-black);
    }
    .stat-label { 
        text-transform: uppercase; 
        font-size: 0.8rem; 
        letter-spacing: 1px; 
        opacity: 0.8; 
        margin-bottom: 0.5rem;
    }
    .stat-value {
        font-family: var(--font-header);
        font-size: 2rem;
        font-weight: 700;
        color: var(--color-orange);
        line-height: 1;
    }
    .stat-sub { font-size: 0.8rem; opacity: 0.7; margin-top: 0.25rem; }

    /* SEGMENTS */
    .segments-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
    }
    .segment-card {
        background: white;
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        box-shadow: 4px 4px 0px var(--color-black);
    }
    .segment-card h4 { font-size: 1.25rem; margin-bottom: 1rem; border-bottom: 2px solid #e4e4e7; padding-bottom: 0.5rem; }

    /* COMPETITORS */
    .competitor-list { display: flex; flex-direction: column; gap: 1rem; }
    .competitor-item {
        background: white;
        border: 2px solid var(--color-black);
        display: grid;
        grid-template-columns: 200px 1fr;
    }
    .comp-header {
        background: var(--color-gray-200);
        padding: 1.5rem;
        font-family: var(--font-header);
        font-size: 1.25rem;
        font-weight: 700;
        display: flex;
        align-items: center;
        border-right: 2px solid var(--color-black);
    }
    .comp-detail { padding: 1.5rem; }
    .status-badge {
        display: inline-block;
        font-size: 0.75rem;
        text-transform: uppercase;
        font-weight: 800;
        padding: 2px 6px;
        margin-bottom: 0.5rem;
        border: 1px solid var(--color-black);
    }
    .status-badge.negative { background: #fee2e2; color: #991b1b; }
    .status-badge.neutral { background: #f3f4f6; color: #374151; }

    /* SWOT GRID */
    .swot-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .swot-card { 
        background: white; 
        border: 2px solid var(--color-black); 
        padding: 1.5rem; 
        position: relative;
        box-shadow: 6px 6px 0px var(--color-black);
        transition: transform 0.2s;
    }
    .swot-card:hover { transform: translate(-2px, -2px); box-shadow: 8px 8px 0px var(--color-black); }

    .card-icon {
        position: absolute;
        top: 0;
        right: 0;
        background: var(--color-black);
        color: white;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-header);
        font-weight: 700;
        font-size: 1.25rem;
    }

    .swot-card h4 { 
        margin: 0 0 1rem 0; 
        font-size: 1.5rem; 
        text-transform: uppercase; 
    }
    .swot-card ul { padding-left: 1.2rem; margin: 0; }
    .swot-card li { margin-bottom: 0.5rem; line-height: 1.4; }

    .swot-card.strength h4 { color: #16a34a; }
    .swot-card.weakness h4 { color: #ea580c; }
    .swot-card.opportunity h4 { color: #2563eb; }
    .swot-card.threat h4 { color: #dc2626; }

    @media (max-width: 768px) {
        h1 { font-size: 3rem; }
        .segments-grid, .swot-grid, .competitor-item, .audience-grid { grid-template-columns: 1fr; }
        .competitor-item { display: block; }
        .comp-header { border-right: none; border-bottom: 2px solid var(--color-black); }
    }
</style>
