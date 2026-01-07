<svelte:head>
	<title>SALES CHANNELS | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>06 Sales<br><span class="highlight">Channels</span></h1>
	</header>

	<article class="content">
		<h2>6.1 Primary Sales Channels</h2>
        <p>
			As a homegrown bakeshop, we focus on direct-to-consumer channels that 
			allow personal connection with our customers.
		</p>
        
        <div class="channel-grid">
            <div class="channel-card">
                <span class="icon">🏠</span>
                <h4>Home Pickup</h4>
                <p>Customers pick up orders directly from our home kitchen — zero delivery cost</p>
            </div>
            <div class="channel-card">
                <span class="icon">🚗</span>
                <h4>Local Delivery</h4>
                <p>Same-day delivery within our neighborhood for a small fee</p>
            </div>
            <div class="channel-card">
                <span class="icon">📱</span>
                <h4>Social Media Orders</h4>
                <p>Orders via Facebook Messenger and Instagram DMs</p>
            </div>
            <div class="channel-card">
                <span class="icon">🛍️</span>
                <h4>Weekend Markets</h4>
                <p>Pop-up presence at local bazaars and farmers markets</p>
            </div>
        </div>
		<div class="divider"></div>

		<h2>6.2 Order Process</h2>
        <div class="highlight-box">
			<h3>📋 How It Works</h3>
			<ol>
                <li>Customer messages us on social media</li>
                <li>We confirm order and payment</li>
                <li>Cookies are baked fresh</li>
                <li>Pickup or delivery arranged</li>
            </ol>
		</div>
        <div class="divider"></div>

		<h2>6.3 Future Channels</h2>
        <p>
			As we grow, we plan to expand into additional sales channels:
		</p>
        <ul class="simple-list">
			<li><strong>Food Delivery Apps:</strong> GrabFood, FoodPanda partnership</li>
			<li><strong>Consignment:</strong> Local coffee shops and convenience stores</li>
			<li><strong>Online Store:</strong> Simple e-commerce website</li>
			<li><strong>Corporate Orders:</strong> Office events and employee gifts</li>
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

    .channel-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    .channel-card {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.2s;
    }
    .channel-card:hover {
        border-color: var(--color-pink);
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15);
    }
    .channel-card .icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
    .channel-card h4 { 
        font-size: 1.1rem; 
        margin-bottom: 0.5rem;
        color: var(--color-brown);
        font-family: var(--font-header);
    }
    .channel-card p { 
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
    .highlight-box ol { margin: 0; padding-left: 1.5rem; }
    .highlight-box li { margin-bottom: 0.5rem; color: #52525b; }

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }
</style>
