<svelte:head>
	<title>INGREDIENTS & SOURCING | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>08 Ingredients &<br><span class="highlight">Sourcing</span></h1>
	</header>

	<article class="content">
		<h2>8.1 Core Ingredients</h2>
        <p>
			Quality ingredients are the foundation of great cookies. We prioritize 
			freshness and authenticity over cost-cutting.
		</p>
        
        <div class="ingredient-table">
            <div class="ing-row header">
                <span>Ingredient</span>
                <span>Quality Standard</span>
                <span>Source</span>
            </div>
            <div class="ing-row">
                <span>🧈 Butter</span>
                <span>Real butter, unsalted</span>
                <span>Local supplier</span>
            </div>
            <div class="ing-row">
                <span>🍫 Chocolate</span>
                <span>Premium chips/couverture</span>
                <span>Baking supplier</span>
            </div>
            <div class="ing-row">
                <span>🥚 Eggs</span>
                <span>Fresh, free-range preferred</span>
                <span>Local farm</span>
            </div>
            <div class="ing-row">
                <span>🌾 Flour</span>
                <span>All-purpose, sifted</span>
                <span>Grocery/wholesale</span>
            </div>
            <div class="ing-row">
                <span>🍯 Sugar</span>
                <span>Brown and white varieties</span>
                <span>Grocery/wholesale</span>
            </div>
        </div>
		<div class="divider"></div>

		<h2>8.2 Supplier Relationships</h2>
        <p>
			Building strong relationships with local suppliers ensures consistent 
			quality and potentially better pricing.
		</p>
        <div class="highlight-box">
			<h3>🤝 Supplier Directory</h3>
			<ul>
                <li><strong>Butter & Dairy:</strong> [Your local supplier]</li>
                <li><strong>Chocolate:</strong> [Baking supply store]</li>
                <li><strong>Eggs:</strong> [Local farm/market]</li>
                <li><strong>Dry Goods:</strong> [Wholesale supplier]</li>
            </ul>
		</div>
        <div class="divider"></div>

		<h2>8.3 Inventory Management</h2>
        <p>
			[Track your ingredient usage and plan purchases to minimize waste 
			while ensuring you never run out of essentials.]
		</p>
        <ul class="simple-list">
			<li><strong>Weekly Check:</strong> Review stock levels every Sunday</li>
			<li><strong>Batch Planning:</strong> Calculate ingredients per order batch</li>
			<li><strong>Freshness First:</strong> FIFO (First In, First Out) for all perishables</li>
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

    .ingredient-table {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        overflow: hidden;
        margin: 2rem 0;
    }
    .ing-row {
        display: grid;
        grid-template-columns: 1fr 1.5fr 1fr;
        padding: 1rem 1.5rem;
        border-bottom: 1px solid var(--color-pink-light);
    }
    .ing-row:last-child { border-bottom: none; }
    .ing-row.header {
        background: linear-gradient(135deg, var(--color-pink) 0%, var(--color-rose) 100%);
        color: white;
        font-weight: 700;
        font-size: 0.85rem;
        text-transform: uppercase;
    }
    .ing-row span { font-size: 0.95rem; }

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
        .ing-row { grid-template-columns: 1fr; gap: 0.5rem; }
        .ing-row.header { display: none; }
    }
</style>
