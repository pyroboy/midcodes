<svelte:head>
	<title>EXECUTIVE SUMMARY | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>01 Executive<br><span class="highlight">Summary</span></h1>
	</header>

	<article class="content">
		<h2>1.1 Business Concept & Mission</h2>
        <p>
			<strong>Concept:</strong> A boutique, appointment-only tattoo studio operated by a single artist. 
			Focused on delivering personalized, high-quality custom tattoos in a clean, professional environment.
		</p>
		<p>
			<strong>Mission:</strong> To create meaningful, lasting art on skin through collaboration, 
			craftsmanship, and unwavering commitment to safety and hygiene standards.
		</p>
        <div class="divider"></div>

		<h2>1.2 Vision Statement</h2>
        <div class="highlight-box">
			<p>
				To be recognized as a trusted solo tattoo artist known for exceptional artistry, 
				professional integrity, and a welcoming studio experience that makes every client feel valued.
			</p>
		</div>
        <div class="divider"></div>

        <h2>1.3 Key Differentiators</h2>
        <ul class="simple-list">
			<li><strong>Personalized Experience:</strong> One-on-one consultations with undivided attention.</li>
			<li><strong>Custom-Only Focus:</strong> Every piece is designed specifically for the client.</li>
			<li><strong>Transparent Process:</strong> Clear pricing, realistic timelines, and honest communication.</li>
			<li><strong>Safety First:</strong> Hospital-grade sterilization and single-use supplies.</li>
		</ul>
        <div class="divider"></div>

		<h2>1.4 Business Overview</h2>
        <div class="stat-box">
            <div class="stat">
                 <span class="label">Business Type</span>
                 <span class="value">Sole Proprietorship</span>
            </div>
            <div class="stat dark">
                 <span class="label">Operation Model</span>
                 <span class="value">By Appointment</span>
            </div>
        </div>
        <p>
			Operating as a solo artist allows for complete creative control, personalized client relationships, 
			and flexible scheduling while maintaining low overhead costs.
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

    .divider {
        height: 2px;
        background: var(--color-gray-200);
        margin: 3rem 0;
    }

    .highlight-box {
        border: 2px solid var(--color-black);
        padding: 2rem;
        background: white;
        box-shadow: 6px 6px 0px var(--color-gray-400);
        margin: 2rem 0;
    }
    .highlight-box p { margin: 0; font-style: italic; }

    .stat-box {
        display: flex;
        gap: 3rem;
        margin-bottom: 2rem;
        flex-wrap: wrap;
    }
    .stat { display: flex; flex-direction: column; }
    .stat .label { font-size: 0.8rem; text-transform: uppercase; font-weight: 700; color: var(--color-gray-500); margin-bottom: 5px;}
    .stat .value { font-family: var(--font-header); font-size: 2rem; font-weight: 400; color: var(--color-black); line-height: 1;}
    .stat.dark { background: var(--color-black); color: white; padding: 1rem 1.5rem; }
    .stat.dark .label { color: var(--color-gray-400); }
    .stat.dark .value { color: white; }

    .simple-list { margin-bottom: 1.5rem; padding-left: 1.5rem; }
    .simple-list li { margin-bottom: 0.75rem; font-size: 1.05rem; line-height: 1.5; }
</style>
