<svelte:head>
	<title>MARKETING & BRANDING | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>05 Marketing &<br><span class="highlight">Branding</span></h1>
	</header>

	<article class="content">
		<h2>5.1 Brand Identity</h2>
        <p>
			SweetyTreats embodies warmth, love, and homemade goodness. Our branding 
			reflects the personal touch of a home bakery while maintaining a 
			professional, appealing aesthetic.
		</p>
        
        <div class="brand-grid">
            <div class="brand-card">
                <span class="label">Color Palette</span>
                <div class="color-row">
                    <span class="swatch pink"></span>
                    <span class="swatch cream"></span>
                    <span class="swatch brown"></span>
                </div>
            </div>
            <div class="brand-card">
                <span class="label">Personality</span>
                <p>Sweet, Friendly, Homemade, Trustworthy</p>
            </div>
        </div>
		<div class="divider"></div>

		<h2>5.2 Social Media Strategy</h2>
        <p>
			Our primary marketing channel is social media, focusing on visual 
			storytelling and community engagement.
		</p>
        <div class="highlight-box">
			<h3>📱 Platform Focus</h3>
			<ul>
                <li><strong>Instagram:</strong> Beautiful cookie photos, behind-the-scenes</li>
                <li><strong>Facebook:</strong> Community group, event promotions</li>
                <li><strong>TikTok:</strong> Baking videos, trending formats</li>
            </ul>
		</div>
        <div class="divider"></div>

		<h2>5.3 Word-of-Mouth Strategy</h2>
        <p>
			The best marketing for homemade products is happy customers sharing their experience.
		</p>
        <ul class="simple-list">
			<li><strong>Referral Rewards:</strong> Discounts for customers who bring friends</li>
			<li><strong>Taste Testing:</strong> Free samples to build awareness</li>
			<li><strong>Packaging:</strong> Instagram-worthy boxes that encourage sharing</li>
		</ul>
        <div class="divider"></div>

		<h2>5.4 Local Partnerships</h2>
        <p>
			[Identify potential local partners — coffee shops, gift stores, 
			event planners — who could help promote your cookies.]
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

    .brand-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 1.5rem;
        margin: 2rem 0;
    }
    .brand-card {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        padding: 1.5rem;
    }
    .brand-card .label {
        font-size: 0.8rem;
        text-transform: uppercase;
        font-weight: 700;
        color: #a1a1aa;
        display: block;
        margin-bottom: 1rem;
    }
    .brand-card p { margin: 0; font-size: 1rem; }
    .color-row { display: flex; gap: 0.75rem; }
    .swatch {
        width: 50px;
        height: 50px;
        border-radius: 12px;
        border: 2px solid #e4e4e7;
    }
    .swatch.pink { background: var(--color-pink); }
    .swatch.cream { background: var(--color-cream); border-color: #d4d4d8; }
    .swatch.brown { background: var(--color-brown); }

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

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }

    @media(max-width: 600px) {
        .brand-grid { grid-template-columns: 1fr; }
    }
</style>
