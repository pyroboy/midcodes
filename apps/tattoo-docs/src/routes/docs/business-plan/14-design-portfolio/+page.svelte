<svelte:head>
	<title>DESIGN PORTFOLIO | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>14 Design<br><span class="highlight">Portfolio</span></h1>
	</header>

	<article class="content">
		<h2>14.1 Custom Work Guidelines</h2>
        <p>
            Custom designs are intellectual property. The design process involves:
        </p>
        <ul class="simple-list">
			<li><strong>Consultation:</strong> Discussing concepts, placement, and size.</li>
			<li><strong>Drafting:</strong> Artist creates a digital mock-up.</li>
			<li><strong>Approval:</strong> Client views the design on the day of the appointment.</li>
            <li><strong>Copyright:</strong> The artist retains ownership of the artwork. Clients pay for the tattoo application, not the copyright of the image.</li>
		</ul>
        <div class="divider"></div>

        <h2>14.2 Flash Sheets</h2>
        <div class="concept-box">
             <div class="concept-card">
                <h3>Pre-Drawn Flash</h3>
                <p>Ready-to-go designs available for walk-ins or quick appointments. These are usually non-customizable and priced at a flat rate.</p>
            </div>
             <div class="concept-card dark">
                <h3>Wannado's</h3>
                <p>The artist's "Bucket List" designs. Offered at a discounted rate to clients willing to get specific pieces the artist wants to tattoo.</p>
            </div>
        </div>
        <div class="divider"></div>

		<h2>14.3 Presentation Standards</h2>
        <div class="highlight-box">
            <h3>Portfolio Maintenance</h3>
            <p>
                <strong>Digital:</strong> Instagram/Website must be curated. Only best work is shown. 
                Lighting must be consistent (polarized lens for glare reduction).
            </p>
            <p style="margin-top: 1rem;">
                <strong>Physical:</strong> A high-quality printed book available in the studio for clients to browse while waiting.
            </p>
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
    .highlight-box p { margin: 0; }

    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>
