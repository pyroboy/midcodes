<svelte:head>
	<title>BRAND IDENTITY | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>05 Brand<br><span class="highlight">Identity</span></h1>
	</header>

	<article class="content">
		<h2>5.1 Visual Aesthetic</h2>
        <div class="concept-box">
             <div class="concept-card dark">
                <h3>Minimalist & Brutalist</h3>
                <p>Black and white, high contrast, bold typography. Reflecting cleanliness, precision, and permanence.</p>
            </div>
             <div class="concept-card">
                <h3>Core Values</h3>
                <p>Artistry, Integrity, Hygiene, Collaboration. The brand voice is professional yet accessible.</p>
            </div>
        </div>
        <div class="divider"></div>

		<h2>5.2 Brand Voice</h2>
        <ul class="simple-list">
			<li><strong>Professional:</strong> Informative, respectful, and authoritative on tattoo safety and art.</li>
			<li><strong>Empathetic:</strong> Understanding that getting a tattoo is personal and sometimes painful.</li>
			<li><strong>Transparent:</strong> Honest about pricing, healing processes, and limitations.</li>
		</ul>
        <div class="divider"></div>

        <h2>5.3 Online Presence</h2>
        <div class="highlight-box">
            <h3>Digital Channels</h3>
            <ul>
                <li><strong>Instagram:</strong> Main portfolio. High-quality photos of healed work and sketches.</li>
                <li><strong>Website:</strong> Booking portal, FAQ, comprehensive aftercare guides.</li>
                <li><strong>Google Business:</strong> Location, reviews, and hours for local SEO.</li>
            </ul>
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

    .concept-box { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .concept-card { padding: 2rem; border: 2px solid var(--color-black); }
    .concept-card.dark { background: var(--color-black); color: white; }
    .concept-card h3 { margin-bottom: 1rem; font-size: 1.5rem; }
    .concept-card p { margin: 0; font-size: 1rem; }
    .concept-card.dark p { color: var(--color-gray-400); }
    @media(max-width:600px) { .concept-box { grid-template-columns: 1fr; }}

    .highlight-box {
        border: 2px solid var(--color-black);
        padding: 2rem;
        background: white;
        box-shadow: 6px 6px 0px var(--color-gray-400);
        margin: 2rem 0;
    }
    .highlight-box h3 { font-size: 1.5rem; margin-bottom: 1rem; }
    .highlight-box ul { margin: 0; padding-left: 1.25rem; }
    .highlight-box li { margin-bottom: 0.5rem; }

    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>
