<svelte:head>
	<title>TARGET MARKET | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>04 Target<br><span class="highlight">Market</span></h1>
	</header>

	<article class="content">
		<h2>4.1 Customer Personas</h2>
        <p>
			Our target market consists of cookie lovers in our local community who 
			appreciate quality, handmade treats.
		</p>
        
        <div class="persona-grid">
            <div class="persona-card">
                <span class="icon">👨‍👩‍👧‍👦</span>
                <h4>Busy Parents</h4>
                <p>Looking for convenient, quality treats for their kids' baon or family celebrations</p>
            </div>
            <div class="persona-card">
                <span class="icon">🎁</span>
                <h4>Gift Givers</h4>
                <p>Need thoughtful, delicious gifts for birthdays, holidays, and special occasions</p>
            </div>
            <div class="persona-card">
                <span class="icon">💼</span>
                <h4>Office Workers</h4>
                <p>Want snacks for the office or treats for team celebrations</p>
            </div>
            <div class="persona-card">
                <span class="icon">☕</span>
                <h4>Coffee Lovers</h4>
                <p>Seeking the perfect companion for their daily coffee break</p>
            </div>
        </div>
		<div class="divider"></div>

		<h2>4.2 Local Community Focus</h2>
        <p>
			[Describe your immediate neighborhood, nearby schools, offices, or 
			community centers that represent your primary market.]
		</p>
        <div class="highlight-box">
			<h3>📍 Our Neighborhood</h3>
			<ul>
                <li>Nearby schools and universities</li>
                <li>Residential subdivisions</li>
                <li>Local offices and BPOs</li>
                <li>Churches and community groups</li>
            </ul>
		</div>
        <div class="divider"></div>

		<h2>4.3 Market Size Estimate</h2>
        <p>
			[Estimate how many potential customers are in your area, based on 
			households, office workers, or student populations.]
		</p>
        <div class="stat-box">
            <div class="stat">
                 <span class="label">Target Households</span>
                 <span class="value">500+</span>
            </div>
            <div class="stat pink">
                 <span class="label">Initial Reach</span>
                 <span class="value">50 Customers</span>
            </div>
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

    .persona-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    .persona-card {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.2s;
    }
    .persona-card:hover {
        border-color: var(--color-pink);
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15);
    }
    .persona-card .icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
    .persona-card h4 { 
        font-size: 1.1rem; 
        margin-bottom: 0.5rem;
        color: var(--color-brown);
        font-family: var(--font-header);
    }
    .persona-card p { 
        font-size: 0.9rem; 
        color: #71717a; 
        margin: 0;
        line-height: 1.5;
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

    .stat-box {
        display: flex;
        gap: 3rem;
        margin-top: 2rem;
    }
    .stat { display: flex; flex-direction: column; }
    .stat .label { 
        font-size: 0.8rem; 
        text-transform: uppercase; 
        font-weight: 700; 
        color: #a1a1aa; 
        margin-bottom: 5px;
    }
    .stat .value { 
        font-family: var(--font-header); 
        font-size: 2.5rem; 
        font-weight: 700; 
        color: var(--color-brown); 
        line-height: 1;
    }
    .stat.pink .value { color: var(--color-pink); }
</style>
