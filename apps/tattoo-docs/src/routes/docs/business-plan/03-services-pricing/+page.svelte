<svelte:head>
	<title>SERVICES & PRICING | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>03 Services<br><span class="highlight">& Pricing</span></h1>
	</header>

	<article class="content">
		<h2>3.1 Tattoo Services</h2>
        <div class="service-grid">
            <div class="service-card">
                <h4>Custom Tattoos</h4>
                <p>Original designs created specifically for you based on your ideas and vision.</p>
                <span class="price">Starting at ₱[X]</span>
            </div>
            <div class="service-card">
                <h4>Cover-Up Work</h4>
                <p>Transform or conceal existing tattoos with new, creative designs.</p>
                <span class="price">Consultation Required</span>
            </div>
            <div class="service-card">
                <h4>Touch-Ups</h4>
                <p>Free touch-ups within 3 months for tattoos done at this studio.</p>
                <span class="price">FREE (Conditions Apply)</span>
            </div>
            <div class="service-card dark">
                <h4>Walk-In Flash</h4>
                <p>Pre-designed flash sheets available for same-day appointments (subject to availability).</p>
                <span class="price">Fixed Price Per Design</span>
            </div>
        </div>
        <div class="divider"></div>

		<h2>3.2 Pricing Structure</h2>
        <table class="pricing-table">
            <thead>
                <tr>
                    <th>Size Category</th>
                    <th>Approximate Size</th>
                    <th>Price Range</th>
                </tr>
            </thead>
            <tbody>
                <tr>
                    <td>Tiny / Micro</td>
                    <td>Under 2 inches</td>
                    <td>₱[X] - ₱[X]</td>
                </tr>
                <tr>
                    <td>Small</td>
                    <td>2 - 4 inches</td>
                    <td>₱[X] - ₱[X]</td>
                </tr>
                <tr>
                    <td>Medium</td>
                    <td>4 - 6 inches</td>
                    <td>₱[X] - ₱[X]</td>
                </tr>
                <tr>
                    <td>Large</td>
                    <td>6+ inches</td>
                    <td>₱[X]+/hour</td>
                </tr>
                <tr>
                    <td>Full Day Session</td>
                    <td>6-8 hours</td>
                    <td>₱[X] flat rate</td>
                </tr>
            </tbody>
        </table>
        <div class="divider"></div>

        <h2>3.3 Specialty Styles</h2>
        <div class="highlight-box">
			<h3>Artist Specializations</h3>
			<ul>
				<li><strong>Blackwork:</strong> Bold black ink designs, geometric patterns, tribal.</li>
				<li><strong>Fine Line:</strong> Delicate, detailed linework and minimal designs.</li>
				<li><strong>Neo-Traditional:</strong> Bold lines with modern color palettes.</li>
				<li><strong>Script/Lettering:</strong> Custom typography and calligraphy.</li>
			</ul>
		</div>
        <div class="divider"></div>

		<h2>3.4 Deposit & Payment</h2>
        <ul class="simple-list">
			<li><strong>Booking Deposit:</strong> ₱[X] or 20% of quoted price (non-refundable)</li>
			<li><strong>Payment Methods:</strong> Cash, GCash, Bank Transfer</li>
			<li><strong>Deposit Application:</strong> Applied to final session cost</li>
			<li><strong>Large Projects:</strong> Payment plans available for multi-session work</li>
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

    .service-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; margin-bottom: 2rem; }
    .service-card { padding: 1.5rem; background: white; border: 2px solid var(--color-gray-300); }
    .service-card.dark { background: var(--color-black); color: white; border-color: var(--color-black); }
    .service-card.dark h4 { color: white; }
    .service-card.dark p { color: var(--color-gray-400); }
    .service-card.dark .price { color: white; border-color: var(--color-gray-600); }
    .service-card h4 { font-size: 1.25rem; margin-bottom: 0.5rem; }
    .service-card p { font-size: 0.9rem; margin: 0 0 1rem 0; }
    .service-card .price { 
        display: inline-block;
        font-family: var(--font-header); 
        font-size: 1rem; 
        padding: 0.25rem 0.5rem;
        border: 1px solid var(--color-black);
    }
    @media(max-width:600px) { .service-grid { grid-template-columns: 1fr; }}

    .pricing-table {
        width: 100%;
        border-collapse: collapse;
        margin-bottom: 2rem;
    }
    .pricing-table th, .pricing-table td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid var(--color-gray-200);
    }
    .pricing-table th {
        background: var(--color-black);
        color: white;
        font-family: var(--font-header);
        font-weight: 400;
        text-transform: uppercase;
    }
    .pricing-table tr:hover { background: var(--color-gray-100); }

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
