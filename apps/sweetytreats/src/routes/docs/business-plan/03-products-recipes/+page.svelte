<svelte:head>
	<title>PRODUCTS & RECIPES | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>03 Products &<br><span class="highlight">Recipes</span></h1>
	</header>

	<article class="content">
		<h2>3.1 Cookie Menu</h2>
        <div class="highlight-box">
            <p style="margin:0; text-align:center;">
                Looking for baking instructions? <br>
                <a href="/docs/recipe-book" style="color:var(--color-pink); font-weight:700;">📖 View Master Recipe Book</a>
            </p>
        </div>

        <p>
			Our cookie lineup features a mix of classic favorites and unique creations, 
			all made from scratch with premium ingredients.
		</p>
        
        <div class="product-grid">
            <div class="product-card">
                <span class="icon">🍪</span>
                <h4>Classic Chocolate Chip</h4>
                <p>The timeless favorite with premium chocolate</p>
                <span class="price">₱45/box</span>
            </div>
            <div class="product-card">
                <span class="icon">🥜</span>
                <h4>Peanut Butter Bliss</h4>
                <p>Rich, nutty, and perfectly chewy</p>
                <span class="price">₱50/box</span>
            </div>
            <div class="product-card">
                <span class="icon">🍫</span>
                <h4>Double Chocolate</h4>
                <p>For the serious chocolate lovers</p>
                <span class="price">₱55/box</span>
            </div>
            <div class="product-card">
                <span class="icon">🧈</span>
                <h4>Butter Shortbread</h4>
                <p>Classic, buttery, melt-in-your-mouth</p>
                <span class="price">₱45/box</span>
            </div>
        </div>
		<div class="divider"></div>

		<h2>3.2 Signature Specials</h2>
        <p>
			[Add your unique creations that set you apart — seasonal flavors, 
			local ingredient twists, or family secret recipes.]
		</p>
        <ul class="simple-list">
			<li><strong>Ube White Chocolate:</strong> Filipino-inspired purple yam delight</li>
			<li><strong>Mango Tango:</strong> Tropical sweetness in every bite</li>
			<li><strong>Coffee Caramel:</strong> Perfect for the coffee lovers</li>
		</ul>
        <div class="divider"></div>

		<h2>3.3 Quality Standards</h2>
        <div class="highlight-box">
			<h3>🌾 Our Ingredient Promise</h3>
			<ul>
                <li>Real butter, never margarine</li>
                <li>Premium chocolate chips</li>
                <li>Fresh eggs from local farms</li>
                <li>No artificial preservatives</li>
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

    .product-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    .product-card {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.2s;
    }
    .product-card:hover {
        border-color: var(--color-pink);
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15);
    }
    .product-card .icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
    .product-card h4 { 
        font-size: 1.1rem; 
        margin-bottom: 0.5rem;
        color: var(--color-brown);
        font-family: var(--font-header);
    }
    .product-card p { 
        font-size: 0.9rem; 
        color: #a1a1aa; 
        margin: 0 0 1rem 0;
    }
    .product-card .price {
        background: var(--color-pink);
        color: white;
        padding: 0.25rem 0.75rem;
        border-radius: 20px;
        font-weight: 700;
        font-size: 0.9rem;
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

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }
</style>
