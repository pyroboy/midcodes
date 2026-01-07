<svelte:head>
	<title>GROWTH ROADMAP | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>11 Growth<br><span class="highlight">Roadmap</span></h1>
	</header>

	<article class="content">
		<h2>11.1 Organic Growth Philosophy</h2>
        <p>
			We believe in sustainable, organic growth — no rushing, no overextending. 
			Each phase is achieved before moving to the next.
		</p>
        
        <div class="timeline">
            <div class="phase current">
                <div class="phase-header">
                    <span class="badge">Phase 1</span>
                    <span class="period">Months 1-6</span>
                </div>
                <h4>🌱 Foundation</h4>
                <ul>
                    <li>Perfect core recipes</li>
                    <li>Build initial customer base</li>
                    <li>Establish social media presence</li>
                    <li>Refine operations</li>
                </ul>
                <span class="goal">Goal: 100 regular customers</span>
            </div>
            
            <div class="phase">
                <div class="phase-header">
                    <span class="badge">Phase 2</span>
                    <span class="period">Months 7-12</span>
                </div>
                <h4>🌿 Expansion</h4>
                <ul>
                    <li>Add new flavors based on feedback</li>
                    <li>Partner with local coffee shops</li>
                    <li>Join weekend markets regularly</li>
                    <li>Explore delivery app partnerships</li>
                </ul>
                <span class="goal">Goal: ₱20,000/month revenue</span>
            </div>
            
            <div class="phase">
                <div class="phase-header">
                    <span class="badge">Phase 3</span>
                    <span class="period">Year 2+</span>
                </div>
                <h4>🌳 Scale</h4>
                <ul>
                    <li>Consider commercial kitchen space</li>
                    <li>Hire part-time helper</li>
                    <li>Corporate accounts & events</li>
                    <li>Potential retail presence</li>
                </ul>
                <span class="goal">Goal: Full-time business</span>
            </div>
        </div>
		<div class="divider"></div>

		<h2>11.2 Key Milestones</h2>
        <div class="highlight-box">
			<h3>🏆 Success Markers</h3>
			<ul>
                <li>First 50 customers ✓</li>
                <li>Break-even achieved</li>
                <li>First corporate order</li>
                <li>Featured in local media</li>
                <li>₱50,000 monthly revenue</li>
            </ul>
		</div>
        <div class="divider"></div>

		<h2>11.3 When to Scale</h2>
        <p>
			We only move to the next phase when:
		</p>
        <ul class="simple-list">
			<li>Current phase is consistently profitable</li>
			<li>Customer demand exceeds capacity</li>
			<li>Quality can be maintained at higher volume</li>
			<li>Financial buffer for investment exists</li>
		</ul>
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

    .timeline {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
        margin: 2rem 0;
    }
    .phase {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        padding: 1.5rem;
        position: relative;
    }
    .phase.current {
        border-color: var(--color-pink);
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15);
    }
    .phase-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
    }
    .phase .badge {
        background: var(--color-pink);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-size: 0.75rem;
        font-weight: 700;
        text-transform: uppercase;
    }
    .phase .period {
        font-size: 0.85rem;
        color: #a1a1aa;
    }
    .phase h4 {
        font-size: 1.25rem;
        margin-bottom: 1rem;
        color: var(--color-brown);
    }
    .phase ul {
        margin: 0 0 1rem 0;
        padding-left: 1.5rem;
    }
    .phase li {
        margin-bottom: 0.5rem;
        color: #52525b;
    }
    .phase .goal {
        display: block;
        background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
        padding: 0.5rem 1rem;
        border-radius: 8px;
        font-weight: 600;
        color: var(--color-pink-dark);
        font-size: 0.9rem;
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
    .highlight-box ul { margin: 0; padding-left: 1.5rem; }
    .highlight-box li { margin-bottom: 0.5rem; color: #52525b; }

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }
</style>
