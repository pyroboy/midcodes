<svelte:head>
	<title>LEGAL & COMPLIANCE | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>06 Legal &<br><span class="highlight">Compliance</span></h1>
	</header>

	<article class="content">
		<h2>6.1 Business Permits</h2>
        <div class="checklist-box">
            <h3>Required Documents</h3>
            <ul class="checklist">
                <li><span class="check">To Do</span> DTI Business Name Registration</li>
                <li><span class="check">To Do</span> Barangay Business Clearance</li>
                <li><span class="check">To Do</span> Mayor's Permit / Business Permit</li>
                <li><span class="check">To Do</span> BIR Registration (COR)</li>
                <li><span class="check">To Do</span> Sanitary Permit from Local Health Office</li>
            </ul>
        </div>
        <div class="divider"></div>

		<h2>6.2 Health Authority Requirements</h2>
        <p>
            Compliance with the <strong>Department of Health (DOH)</strong> Sanitation Code on Business Establishments.
        </p>
        <ul class="simple-list">
			<li><strong>Health Certificate:</strong> Updated health card for the artist/staff.</li>
			<li><strong>Water Analysis:</strong> Results of bacteriological examination of water supply.</li>
			<li><strong>Pest Control:</strong> Proof of pest control services.</li>
			<li><strong>Waste Management:</strong> Contract with accredited infectious waste collector (for sharps/needles).</li>
		</ul>
        <div class="divider"></div>

        <h2>6.3 Other Compliance</h2>
        <div class="highlight-box">
            <h3>Operational Requirements</h3>
            <ul>
                <li><strong>Fire Safety:</strong> FSIC (Fire Safety Inspection Certificate) & fire extinguisher.</li>
                <li><strong>Zoning:</strong> Zoning clearance confirming the location is commercial.</li>
                <li><strong>Insurance:</strong> General Liability Insurance (Recommended).</li>
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

    .checklist-box {
        background: var(--color-gray-100);
        padding: 2rem;
        border: 1px solid var(--color-gray-300);
    }
    .checklist-box h3 { font-size: 1.5rem; margin-bottom: 1rem; margin-top: 0; }
    .checklist { list-style: none; padding: 0; margin: 0; }
    .checklist li { 
        margin-bottom: 0.75rem; 
        font-size: 1.1rem; 
        display: flex;
        align-items: center;
    }
    .check {
        font-size: 0.7rem;
        font-weight: 700;
        text-transform: uppercase;
        background: var(--color-gray-300);
        padding: 2px 6px;
        margin-right: 1rem;
        border-radius: 4px;
        min-width: 50px;
        text-align: center;
    }

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
