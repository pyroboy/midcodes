<svelte:head>
	<title>MARKETING STRATEGY | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>11 Marketing<br><span class="highlight">Strategy</span></h1>
	</header>

	<article class="content">
		<h2>11.1 The "Portfolio First" Approach</h2>
        <p>
            In the tattoo industry, <strong>your work is your best marketing</strong>. Our strategy focuses on generating high-quality visual content that showcases technical skill and artistic vision.
        </p>
        <div class="divider"></div>

		<h2>11.2 Social Media Pillars</h2>
        <div class="marketing-grid">
            <div class="mkt-card">
                <h3>Instagram</h3>
                <ul>
                    <li>High-res photos of fresh & healed work immediately after sessions.</li>
                    <li>"Available Designs" highlights for flash.</li>
                    <li>Time-lapse Reels of the tattooing process.</li>
                </ul>
            </div>
            <div class="mkt-card">
                <h3>TikTok</h3>
                <ul>
                    <li>Behind-the-scenes content (setup, drawing).</li>
                    <li>Educating clients on aftercare and safety.</li>
                    <li>Personality-driven content to build trust.</li>
                </ul>
            </div>
        </div>
        <div class="divider"></div>

        <h2>11.3 Referral Program</h2>
        <div class="highlight-box">
            <h3>"Walking Canvas" Discount</h3>
            <p>
                A referral system where existing clients get a <strong>₱500 credit</strong> for every new client they refer who completes a session. 
                Word of mouth is the most powerful tool for a local artist.
            </p>
        </div>
        <div class="divider"></div>

        <h2>11.4 Convention Circuit</h2>
        <p>
            Attending 2-3 major local tattoo conventions per year to:
        </p>
        <ul class="simple-list">
			<li><strong>Network:</strong> Connect with other artists and suppliers.</li>
			<li><strong>Showcase:</strong> Enter competitions to gain recognition and awards.</li>
			<li><strong>Recruit:</strong> Meet potential clients outside the usual radius.</li>
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

    .marketing-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .mkt-card { padding: 1.5rem; background: var(--color-gray-100); border: 2px solid transparent; }
    .mkt-card:hover { border-color: var(--color-black); }
    .mkt-card h3 { font-size: 1.5rem; margin-bottom: 1rem; }
    .mkt-card ul { padding-left: 1.25rem; margin: 0; }
    .mkt-card li { margin-bottom: 0.5rem; }
    @media(max-width:600px) { .marketing-grid { grid-template-columns: 1fr; }}

    .highlight-box {
        border: 2px solid var(--color-black);
        padding: 2rem;
        background: white;
        box-shadow: 6px 6px 0px var(--color-gray-400);
        margin: 2rem 0;
    }
    .highlight-box h3 { font-size: 1.5rem; margin-bottom: 1rem; }
    .highlight-box p { margin: 0; }

    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>
