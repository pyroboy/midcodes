<svelte:head>
	<title>OPERATIONS & KITCHEN | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>07 Operations &<br><span class="highlight">Kitchen</span></h1>
	</header>

	<article class="content">
		<h2>7.1 Home Kitchen Setup</h2>
        <p>
			Starting from a home kitchen keeps overhead low while maintaining 
			the personal touch that defines our brand.
		</p>
        
        <div class="highlight-box">
			<h3>🏠 Kitchen Requirements</h3>
			<ul>
                <li>Clean, dedicated baking area</li>
                <li>Reliable oven (convection preferred)</li>
                <li>Stand mixer for consistent dough</li>
                <li>Proper storage for ingredients</li>
                <li>Cooling racks and packaging station</li>
            </ul>
		</div>
		<div class="divider"></div>

		<h2>7.2 Essential Equipment</h2>
        <div class="equipment-grid">
            <div class="equip-card">
                <span class="icon">🔥</span>
                <h4>Oven</h4>
                <p>Electric convection for even baking</p>
            </div>
            <div class="equip-card">
                <span class="icon">🥄</span>
                <h4>Stand Mixer</h4>
                <p>For consistent dough every time</p>
            </div>
            <div class="equip-card">
                <span class="icon">⚖️</span>
                <h4>Kitchen Scale</h4>
                <p>Precise measurements matter</p>
            </div>
            <div class="equip-card">
                <span class="icon">📦</span>
                <h4>Packaging</h4>
                <p>Boxes, ribbons, labels</p>
            </div>
        </div>
        <div class="divider"></div>

		<h2>7.3 Baking Schedule</h2>
        <p>
			[Plan your weekly baking schedule based on expected orders and 
			ingredient freshness requirements.]
		</p>
        <ul class="simple-list">
			<li><strong>Weekdays:</strong> Prep and small batch orders</li>
			<li><strong>Thursday-Friday:</strong> Major baking for weekend orders</li>
			<li><strong>Saturday:</strong> Market day + deliveries</li>
			<li><strong>Sunday:</strong> Rest and planning</li>
		</ul>
        <div class="divider"></div>

		<h2>7.4 Quality Control</h2>
        <p>
			Every batch is tested for consistency. Cookies that don't meet our 
			standards are enjoyed by us (a sweet perk!) but never sold.
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

    .equipment-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    .equip-card {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.2s;
    }
    .equip-card:hover {
        border-color: var(--color-pink);
    }
    .equip-card .icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
    .equip-card h4 { 
        font-size: 1rem; 
        margin-bottom: 0.25rem;
        color: var(--color-brown);
        font-family: var(--font-header);
    }
    .equip-card p { 
        font-size: 0.85rem; 
        color: #a1a1aa; 
        margin: 0;
    }

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }
</style>
