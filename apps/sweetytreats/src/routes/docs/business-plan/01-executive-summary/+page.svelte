<svelte:head>
	<title>EXECUTIVE SUMMARY | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>01 Executive<br><span class="highlight">Summary</span></h1>
	</header>

	<article class="content">
		<h2>1.1 Business Concept</h2>
        <p>
			<strong>SweetyTreats</strong> is a homegrown cookie bakeshop specializing in artisanal, 
			handcrafted cookies made with love and premium ingredients. Starting from a home kitchen,
			we bring joy to our community one cookie at a time.
		</p>
		<div class="divider"></div>

		<h2>1.2 Mission Statement</h2>
        <div class="highlight-box">
			<p class="mission">
				"To create moments of happiness through delicious, homemade cookies that bring 
				families and friends together, while building a sustainable business that grows 
				organically with our community."
			</p>
		</div>
        <div class="divider"></div>

		<h2>1.3 Vision</h2>
        <p>
			To become the neighborhood's favorite cookie destination, known for quality ingredients,
			unique flavors, and the warmth of homemade goodness.
		</p>
        <div class="divider"></div>

        <h2>1.4 Key Highlights</h2>
        <div class="stat-box">
            <div class="stat">
                 <span class="label">Startup Investment</span>
                 <span class="value">₱15,000</span>
            </div>
            <div class="stat pink">
                 <span class="label">Daily Target</span>
                 <span class="value">10 Boxes</span>
            </div>
        </div>
        
        <ul class="simple-list">
			<li><strong>Homegrown:</strong> Starting from a home kitchen with minimal overhead</li>
			<li><strong>Organic Growth:</strong> Scaling naturally through word-of-mouth and social media</li>
			<li><strong>Premium Quality:</strong> Quality over quantity approach</li>
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
    .highlight-box .mission {
        font-family: var(--font-header);
        font-size: 1.3rem;
        font-style: italic;
        text-align: center;
        color: var(--color-pink-dark);
        margin: 0;
    }

    .stat-box {
        display: flex;
        gap: 3rem;
        margin-bottom: 2rem;
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

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }
</style>
