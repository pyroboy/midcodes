<svelte:head>
	<title>HEALTH & SAFETY | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>07 Health &<br><span class="highlight">Safety</span></h1>
	</header>

	<article class="content">
		<h2>7.1 Cross-Contamination Prevention</h2>
        <div class="concept-box">
             <div class="concept-card dark">
                <h3>Universal Precautions</h3>
                <p>Treating all blood and body fluids as if they are known to be infectious for HIV, HBV, and other bloodborne pathogens.</p>
            </div>
             <div class="concept-card">
                <h3>Barriers</h3>
                <p>Using single-use plastic barriers for machine bags, clip cord covers, bottle bags, and surface coverings.</p>
            </div>
        </div>
        <div class="divider"></div>

		<h2>7.2 Sterilization Protocols</h2>
        <ul class="simple-list">
			<li><strong>Single-Use Only:</strong> Needles, ink caps, razors, and gloves are single-use and disposed of immediately.</li>
			<li><strong>Autoclave (If applicable):</strong> Routine spore testing for any reusable grips/tubes (though fully disposable setup is preferred).</li>
			<li><strong>Surface Disinfection:</strong> Using hospital-grade disinfectants (e.g., Cavicide, Madacide) between every client.</li>
			<li><strong>Hand Hygiene:</strong> Thorough hand washing and fresh glove changes for every interruption in procedure.</li>
		</ul>
        <div class="divider"></div>

        <h2>7.3 Waste Management</h2>
        <div class="highlight-box">
            <h3>Disposal Procedures</h3>
            <ul>
                <li><strong>Sharps Container:</strong> Immediate disposal of used needles into puncture-resistant biohazard containers.</li>
                <li><strong>Biohazard Waste:</strong> Contaminated items (gloves, paper towels with blood) go into designated red biohazard bags.</li>
                <li><strong>Regular Trash:</strong> Non-contaminated waste kept separate.</li>
            </ul>
        </div>
        
        <p class="notice">
            <strong>Note:</strong> Proper contract with a medical waste haulage service is mandatory for sharps collection.
        </p>
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
    .notice {
        background: #fefce8;
        border: 1px solid #fde047;
        padding: 1rem;
        font-size: 0.9rem;
        color: #854d0e;
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
