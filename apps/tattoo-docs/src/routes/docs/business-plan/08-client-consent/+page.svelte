<svelte:head>
	<title>CLIENT CONSENT | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>08 Client<br><span class="highlight">Consent</span></h1>
	</header>

	<article class="content">
		<h2>8.1 Mandatory Requirements</h2>
        <div class="stat-box">
             <div class="stat">
                 <span class="label">Minimum Age</span>
                 <span class="value">18 Years</span>
            </div>
             <div class="stat">
                 <span class="label">ID Required</span>
                 <span class="value">Valid Govt ID</span>
            </div>
        </div>
        <p>
            <strong>Strictly 18+:</strong> We do not tattoo minors, even with parental consent.
            <strong>Sobriety:</strong> Clients under the influence of alcohol or drugs will be turned away.
        </p>
        <div class="divider"></div>

		<h2>8.2 The Waiver Form</h2>
        <p>Every client must sign a comprehensive waiver covering:</p>
        <ul class="simple-list">
			<li><strong>Acknowledgement of Risks:</strong> Infection, allergic reaction, fading, shifting not attributable to artist error.</li>
			<li><strong>Permanence:</strong> Understanding that a tattoo is permanent and removal is difficult/costly.</li>
			<li><strong>Medical History Disclosure:</strong> Diabetes, skin conditions, blood-thinning medications, HIV/Hepatitis status (for safety modifications).</li>
			<li><strong>Aftercare Agreement:</strong> Client agrees to follow the provided aftercare instructions.</li>
            <li><strong>Media Release:</strong> Consent for photos/videos to be used in the artist's portfolio/social media.</li>
		</ul>
        <div class="divider"></div>

        <h2>8.3 Process Flow</h2>
        <div class="checklist-box">
            <ol class="checklist">
                <li>Client arrives and presents ID.</li>
                <li>Digital/Physical waiver is filled out and signed.</li>
                <li>Artist reviews medical history and skin condition.</li>
                <li>Design is confirmed and stencil is applied.</li>
                <li>Client gives final verbal approval of placement and spelling before needle touches skin.</li>
            </ol>
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

    .stat-box {
        display: flex;
        gap: 3rem;
        margin-bottom: 2rem;
        padding: 1.5rem;
        background: var(--color-gray-100);
        border: 1px solid var(--color-gray-300);
    }
    .stat { display: flex; flex-direction: column; }
    .stat .label { font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: var(--color-gray-500); margin-bottom: 5px;}
    .stat .value { font-family: var(--font-header); font-size: 2rem; font-weight: 400; color: var(--color-black); line-height: 1;}

    .checklist-box {
        background: white;
        padding: 2rem;
        border: 2px solid var(--color-black);
        box-shadow: 6px 6px 0px var(--color-gray-400);
    }
    .checklist { padding-left: 1.5rem; margin: 0; }
    .checklist li { 
        margin-bottom: 1rem; 
        font-size: 1.1rem; 
        font-family: var(--font-header);
    }

    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>
