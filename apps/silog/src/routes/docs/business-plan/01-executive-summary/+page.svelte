<svelte:head>
	<title>EXEC SUMMARY | SILOG HUB</title>
</svelte:head>

<section class="doc-page">

	
	<header class="doc-header">
		<h1>01 Executive<br><span class="highlight">Summary</span></h1>
	</header>

	<article class="content">
		<h2>1.1 Business Concept & Mission</h2>
        <p>
			<strong>Concept:</strong> A high-volume, accessibility-focused "Silog & Lugaw" station located strategically on <strong>Maria Clara St.</strong> 
			Designed to serve as a daily staple for the neighborhood, the store bridges the gap between a student canteen and a late-night comfort food hub.
		</p>
		<p>
			<strong>Mission:</strong> To provide "Everyday Comfort" through affordable, filling meals. Whether it's a student's lunch or a worker's midnight meal, we ensure quality food is always within reach—physically and financially.
		</p>
        <div class="divider"></div>

		<h2>1.2 The "Silog" Value Proposition</h2>
        <div class="highlight-box">
			<h3>Why Maria Clara St.?</h3>
			<ul>
				<li><strong>Strategic Proximity:</strong> Located directly in front of a school, guaranteeing high foot traffic.</li>
				<li><strong>Night Operations:</strong> Addressing the "Silog Gap" in the area by serving late-night business.</li>
				<li><strong>Digital Reach:</strong> Infrastructure ready for <strong>Food Panda</strong> and <strong>Grab Food</strong>.</li>
			</ul>
		</div>
        <div class="divider"></div>

        <h2>1.3 Target Market Snapshot</h2>
        <div class="market-grid">
            <div class="market-card">
                <h4>🌞 Day Shift</h4>
                <p>Students & Faculty looking for heavy, affordable lunches.</p>
            </div>
             <div class="market-card dark">
                <h4>🌚 Night Shift</h4>
                <p>Residents & BPO workers seeking late-night sustenance.</p>
            </div>
        </div>
        
		<ul class="simple-list">
			<li><strong>Broad Appeal:</strong> With the addition of <strong>Lugaw (Porridge)</strong> to the full Silog range, we capture both heavy eaters (Rice) and light snackers (Porridge).</li>
		</ul>
        <div class="divider"></div>

        <h2>1.4 Financial Highlights</h2>
        <div class="stat-box">
            <div class="stat">
                 <span class="label">Startup TOTEX</span>
                 <span class="value">₱28,500</span>
            </div>
            <div class="stat orange">
                 <span class="label">Daily Break-Even</span>
                 <span class="value">~19 Meals</span>
            </div>
        </div>
        <p>
			The dual-revenue stream (Walk-in + Delivery Apps) minimizes risk by not relying solely on foot traffic.
		</p>
	</article>
</section>

<style>
    /* PAGE LAYOUT */
    .doc-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 4rem 2rem;
    }

    /* NAV */


    /* HEADER */
    .doc-header h1 {
        font-size: 5rem;
        line-height: 0.9;
        margin-bottom: 4rem;
    }
    .highlight { color: var(--color-orange); background: var(--color-black); padding: 0 1rem; color: white;}
    @media(max-width:600px) { .doc-header h1 { font-size: 3.5rem; }}

    /* CONTENT */
    h2 {
        border-left: 6px solid var(--color-black);
        padding-left: 1rem;
        margin-bottom: 1.5rem;
    }
    
    p { 
        font-size: 1.1rem; 
        line-height: 1.6; 
        margin-bottom: 1.5rem; 
        color: #3f3f46;
    }

    .divider {
        height: 2px;
        background: #e4e4e7;
        margin: 3rem 0;
    }

    /* CARDS */
    .highlight-box {
        border: 2px solid var(--color-black);
        padding: 2rem;
        background: white;
        box-shadow: 6px 6px 0px var(--color-orange);
        margin: 2rem 0;
    }
    .highlight-box h3 { font-size: 1.5rem; margin-bottom: 1rem; }
    
    .market-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .market-card { padding: 1.5rem; background: white; border: 1px solid #d4d4d8; }
    .market-card.dark { background: var(--color-black); color: white; }
    .market-card.dark h4 { color: white; }
    .market-card.dark p { color: #a1a1aa; }
    .market-card h4 { font-size: 1.25rem; margin-bottom: 0.5rem; text-transform: uppercase; }
    .market-card p { font-size: 0.95rem; margin: 0; }

    /* STATS */
    .stat-box {
        display: flex;
        gap: 3rem;
        margin-bottom: 2rem;
    }
    .stat { display: flex; flex-direction: column; }
    .stat .label { font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: #71717a; margin-bottom: 5px;}
    .stat .value { font-family: var(--font-header); font-size: 2.5rem; font-weight: 700; color: var(--color-black); line-height: 1;}
    .stat.orange .value { color: var(--color-orange); }

    ul { margin-bottom: 1.5rem; }
    li { margin-bottom: 0.5rem; font-size: 1.05rem; }
</style>
