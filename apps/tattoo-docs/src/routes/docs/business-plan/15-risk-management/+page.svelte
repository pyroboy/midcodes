<svelte:head>
	<title>RISK MANAGEMENT | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>15 Risk<br><span class="highlight">Management</span></h1>
	</header>

	<article class="content">
		<h2>15.1 Health & Medical Risks</h2>
        <div class="entry">
             <h4>Infection Control</h4>
             <p><strong>Risk:</strong> Client infection post-tattoo.<br>
             <strong>Mitigation:</strong> Strict sterilization, single-use needles, sterile environment, clear aftercare instructions, and client waivers.</p>
        </div>
        <div class="entry">
             <h4>Allergic Reactions</h4>
             <p><strong>Risk:</strong> Reaction to ink pigment or latex.<br>
             <strong>Mitigation:</strong> Use of high-quality vegan inks, nitrile (latex-free) gloves, and patch tests if requested.</p>
        </div>
        <div class="divider"></div>

		<h2>15.2 Operational Risks</h2>
        <div class="entry">
             <h4>Artist Injury (RSI)</h4>
             <p><strong>Risk:</strong> Carpal tunnel, back pain preventing work.<br>
             <strong>Mitigation:</strong> Ergonomic equipment, regular breaks, exercise, and insurance coverage for lost income.</p>
        </div>
        <div class="entry">
             <h4>Equipment Failure</h4>
             <p><strong>Risk:</strong> Machine breaking mid-session.<br>
             <strong>Mitigation:</strong> Always having a backup machine and power supply ready.</p>
        </div>
        <div class="divider"></div>

        <h2>15.3 Legal Liability</h2>
        <div class="highlight-box">
            <h3>Protection Measures</h3>
            <ul class="simple-list">
                <li><strong>Waivers:</strong> Iron-clad consent forms signed by every client.</li>
                <li><strong>Insurance:</strong> Professional Liability Insurance to cover claims of negligence or mistakes.</li>
                <li><strong>No Minors:</strong> Strict ID checks to avoid legal issues with tattooing minors.</li>
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
    
    .entry { margin-bottom: 2rem; }
    .entry h4 { font-size: 1.3rem; margin-bottom: 0.5rem; font-family: var(--font-header); text-transform: uppercase; }
    .entry p { margin: 0; font-size: 1rem; }

    .highlight-box {
        border: 2px solid var(--color-black);
        padding: 2rem;
        background: white;
        box-shadow: 6px 6px 0px var(--color-gray-400);
        margin: 2rem 0;
    }
    .highlight-box h3 { font-size: 1.5rem; margin-bottom: 1rem; }

    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>
