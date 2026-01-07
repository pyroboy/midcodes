<svelte:head>
	<title>MARKET ANALYSIS | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>04 Market<br><span class="highlight">Analysis</span></h1>
	</header>

	<article class="content">
		<h2>4.1 Target Audience</h2>
		<p>
			Our primary clientele consists of individuals seeking high-quality, custom artwork rather than impulse tattoos.
		</p>
        <div class="market-grid">
            <div class="market-card">
                <h4>Primary Demographic</h4>
                <ul>
                    <li>Age: 21 - 45 years old</li>
                    <li>Income: Mid to High disposable income</li>
                    <li>Location: Local residents + 50km radius</li>
                    <li>Interest: Custom art, self-expression</li>
                </ul>
            </div>
            <div class="market-card dark">
                <h4>Client Persona</h4>
                <p>
                    "The Collector" - VALUES quality over price, RESEARCHES artists thoroughly, 
                    WANTS a collaborative design process, and is LOYAL to artists they trust.
                </p>
            </div>
        </div>
        <div class="divider"></div>

		<h2>4.2 Market Trends</h2>
        <ul class="simple-list">
			<li><strong>Acceptance:</strong> Tattoos are increasingly mainstream and accepted in workplaces.</li>
			<li><strong>Customization:</strong> Shift away from "flash" walls towards unique, personalized pieces.</li>
			<li><strong>Safety Awareness:</strong> Clients are more educated about hygiene and safety standards.</li>
			<li><strong>Social Media:</strong> Instagram/TikTok are the primary discovery platforms for artists.</li>
		</ul>
        <div class="divider"></div>

        <h2>4.3 Competitive Landscape</h2>
        <div class="swot-grid">
            <div class="swot-card">
                <h3>Local Competitors</h3>
                <p><strong>[Competitor A]:</strong> High volume, street shop, lower price point.</p>
                <p><strong>[Competitor B]:</strong> High-end, long waitlists, expensive.</p>
            </div>
             <div class="swot-box highlight-box">
                <h3>Our Competitive Edge</h3>
                <ul>
                    <li><strong>Focused Attention:</strong> Private studio means no distractions.</li>
                    <li><strong>Agility:</strong> Faster communication and more flexible scheduling than big shops.</li>
                    <li><strong>Hygiene:</strong> Hospital-grade sterilization protocols exceeding local standards.</li>
                    <li><strong>Fair Pricing:</strong> Premium quality without the "rockstar" markup.</li>
                </ul>
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
        font-size: 5rem;
        line-height: 0.9;
        margin-bottom: 4rem;
    }
    .highlight { color: var(--color-white); background: var(--color-black); padding: 0 1rem; }
    @media(max-width:600px) { .doc-header h1 { font-size: 3.5rem; }}

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
        background: var(--color-gray-200);
        margin: 3rem 0;
    }

    .market-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .market-card { padding: 1.5rem; background: white; border: 2px solid var(--color-gray-300); }
    .market-card.dark { background: var(--color-black); color: white; border-color: var(--color-black); }
    .market-card.dark h4 { color: white; }
    .market-card h4 { font-size: 1.25rem; margin-bottom: 1rem; }
    .market-card ul { padding-left: 1.25rem; margin: 0; }
    
    @media(max-width:600px) { .market-grid { grid-template-columns: 1fr; }}

    .swot-grid { display: flex; flex-direction: column; gap: 2rem; }
    .highlight-box {
        border: 2px solid var(--color-black);
        padding: 2rem;
        background: white;
        box-shadow: 6px 6px 0px var(--color-gray-400);
    }
    .highlight-box h3 { font-size: 1.5rem; margin-bottom: 1rem; }
    
    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>
