<svelte:head>
	<title>APPENDICES | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>14<br><span class="highlight">Appendices</span></h1>
	</header>

	<article class="content">
		<h2>14.1 Templates & Forms</h2>
        <p>
			Useful templates for daily operations and record-keeping.
		</p>
        
        <div class="template-grid">
            <div class="template-card">
                <span class="icon">📝</span>
                <h4>Order Form</h4>
                <p>Track customer orders, quantities, and delivery details</p>
            </div>
            <div class="template-card">
                <span class="icon">📦</span>
                <h4>Inventory Log</h4>
                <p>Monitor ingredient stock levels and reorder points</p>
            </div>
            <div class="template-card">
                <span class="icon">💰</span>
                <h4>Daily Sales Log</h4>
                <p>Record daily revenue and expenses</p>
            </div>
            <div class="template-card">
                <span class="icon">🧪</span>
                <h4>Recipe Card</h4>
                <p>Standardized recipe format with scaling</p>
            </div>
        </div>
		<div class="divider"></div>

		<h2>14.2 Checklists</h2>
        <div class="highlight-box">
			<h3>✅ Daily Baking Checklist</h3>
			<ul>
                <li>Clean and sanitize workspace</li>
                <li>Check ingredient freshness</li>
                <li>Preheat oven to correct temperature</li>
                <li>Prepare packaging materials</li>
                <li>Measure all ingredients accurately</li>
                <li>Set timers for each batch</li>
                <li>Cool cookies completely before packaging</li>
                <li>Label with best-before date</li>
            </ul>
		</div>
        <div class="divider"></div>

		<h2>14.3 Reference Materials</h2>
        <ul class="simple-list">
			<li><strong>Recipe Book:</strong> Master collection of all cookie recipes</li>
			<li><strong>Supplier Contact List:</strong> Emergency supplier contacts</li>
			<li><strong>Pricing Calculator:</strong> Quick cost/margin calculations</li>
			<li><strong>Customer Feedback Log:</strong> Track reviews and suggestions</li>
		</ul>
        <div class="divider"></div>

		<h2>14.4 Social Media Assets</h2>
        <p>
			[Store your brand assets, logo files, and content templates here for 
			easy access when creating marketing materials.]
		</p>
        <div class="asset-note">
            <span class="icon">🎨</span>
            <p>Brand colors, fonts, logo, and approved photography</p>
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

    .template-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
        margin: 2rem 0;
    }
    .template-card {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        padding: 1.5rem;
        text-align: center;
        transition: all 0.2s;
    }
    .template-card:hover {
        border-color: var(--color-pink);
        box-shadow: 0 4px 20px rgba(236, 72, 153, 0.15);
    }
    .template-card .icon { font-size: 2.5rem; display: block; margin-bottom: 0.75rem; }
    .template-card h4 { 
        font-size: 1.1rem; 
        margin-bottom: 0.5rem;
        color: var(--color-brown);
        font-family: var(--font-header);
    }
    .template-card p { 
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
    .highlight-box ul { 
        margin: 0; 
        padding-left: 1.5rem;
        columns: 2;
    }
    .highlight-box li { 
        margin-bottom: 0.5rem; 
        color: #52525b; 
        break-inside: avoid;
    }

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }

    .asset-note {
        background: linear-gradient(135deg, #fdf2f8 0%, #fce7f3 100%);
        padding: 1.5rem;
        border-radius: 16px;
        display: flex;
        align-items: center;
        gap: 1rem;
    }
    .asset-note .icon { font-size: 2rem; }
    .asset-note p { margin: 0; color: var(--color-pink-dark); }

    @media(max-width: 600px) {
        .highlight-box ul { columns: 1; }
    }
</style>
