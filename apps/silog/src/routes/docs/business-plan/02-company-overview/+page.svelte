<svelte:head>
	<title>COMPANY OVERVIEW | SILOG HUB</title>
</svelte:head>

<section class="doc-page">

	
	<header class="doc-header">
		<h1>02 Company<br><span class="highlight">Overview</span></h1>
	</header>

	<article class="content">
		<h2>2.1 Legal Structure & Ownership</h2>
        <p>
			The business is established as a <strong>Non-VAT Sole Proprietorship</strong> under the name of the owner, secured with a <strong>BMBE (Barangay Micro Business Enterprise)</strong> Certificate of Authority to ensure income tax exemption (assets &lt; ₱3M).
            It is operated by the <strong>Magno Family</strong>, leveraging shared responsibilities to minimize initial labor costs and maximize operational oversight.
		</p>
        <div class="divider"></div>

		<h2>2.2 Management Team</h2>
        <p>The core leadership team combines generational wisdom with modern execution:</p>
        
        <div class="team-grid">
            <div class="team-card">
                <div class="role">Operations Lead</div>
                <h4>Arjo Magno</h4>
                <p>Overall business strategy and day-to-day management.</p>
            </div>
            <div class="team-card">
                <div class="role">Finance & Admin</div>
                <h4>Raclaire Magno</h4>
                <p>Financial tracking, inventory auditing, and administrative support.</p>
            </div>
            <div class="team-card dark">
                <div class="role">Senior Advisors</div>
                <h4>Art & Leah Magno</h4>
                <p>Operational guidance, facilities oversight, and community relations.</p>
            </div>
        </div>
        <div class="divider"></div>

        <h2>2.3 Brand Philosophy</h2>
        <div class="quote-box">
             "To be the neighborhood's extra dining room—reliable, warm, and always open."
        </div>
        <p>
            We believe that <i>silog</i> is not just specific to breakfast; it is the ultimate comfort food. 
            Our philosophy is built on speed without sacrificing the "home-cooked" feeling.
        </p>
        <div class="divider"></div>

        <h2>2.4 Goals & Long-Term Vision</h2>
        <div class="goals-wrapper">
            <div class="goal-item">
                <span class="icon">🚀</span>
                <div class="text">
                    <strong>Thriving Ecosystem</strong>
                    <p>To establish a sustainable, self-sufficient business model that supports the family and employees.</p>
                </div>
            </div>
            <div class="goal-item">
                <span class="icon">👥</span>
                <div class="text">
                    <strong>Customer Loyalty</strong>
                    <p>To cultivate a loyal base of "suki" customers who regard our store as their default dining option.</p>
                </div>
            </div>
            <div class="goal-item">
                <span class="icon">⭐</span>
                <div class="text">
                    <strong>Market Recognition</strong>
                    <p>To become the arguably "Best Silog" in the Maria Clara St. area, known for consistency and value.</p>
                </div>
            </div>
        </div>

	</article>
</section>

<style>
    /* PAGE LAYOUT */
    .doc-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 4rem 2rem;
    }

    /* NAV */


    /* HEADER */
    .doc-header h1 {
        font-size: 5rem;
        line-height: 0.9;
        margin-bottom: 4rem;
    }
    .highlight { color: var(--color-orange); background: var(--color-black); padding: 0 1rem; color: white;}
    @media(max-width:600px) { .doc-header h1 { font-size: 3.5rem; }}

    /* CONTENT */
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
        background: #e4e4e7;
        margin: 3rem 0;
    }

    /* TEAM GRID */
    .team-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1.5rem;
        margin-bottom: 2rem;
    }
    .team-card {
        border: 2px solid var(--color-black);
        padding: 1.5rem;
        background: white;
        transition: transform 0.2s;
    }
    .team-card:hover { transform: translateY(-5px); box-shadow: 4px 4px 0px var(--color-orange); }
    
    .team-card .role {
        font-size: 0.8rem;
        text-transform: uppercase;
        font-weight: 700;
        color: var(--color-orange);
        margin-bottom: 0.5rem;
    }
    .team-card h4 {
        font-size: 1.5rem;
        margin-bottom: 0.5rem;
    }
    .team-card p {
        font-size: 0.95rem;
        margin: 0;
        color: #52525b;
    }

    .team-card.dark {
        background: var(--color-black);
        color: white;
    }
    .team-card.dark h4 { color: white; }
    .team-card.dark p { color: #a1a1aa; }

    /* QUOTE */
    .quote-box {
        font-family: var(--font-header);
        font-size: 1.5rem;
        color: var(--color-black);
        padding: 2rem;
        background: #f4f4f5;
        border-left: 4px solid var(--color-orange);
        margin-bottom: 1.5rem;
        font-style: italic;
    }

    /* GOALS */
    .goals-wrapper {
        display: flex;
        flex-direction: column;
        gap: 1.5rem;
    }
    .goal-item {
        display: flex;
        gap: 1.5rem;
        align-items: flex-start;
    }
    .goal-item .icon {
        background: var(--color-black);
        color: white;
        width: 40px;
        height: 40px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 50%;
        font-size: 1.2rem;
        flex-shrink: 0;
    }
    .goal-item .text strong {
        display: block;
        font-family: var(--font-header);
        font-size: 1.25rem;
        margin-bottom: 0.25rem;
    }
    .goal-item .text p {
        margin: 0;
        font-size: 1rem;
    }
</style>
