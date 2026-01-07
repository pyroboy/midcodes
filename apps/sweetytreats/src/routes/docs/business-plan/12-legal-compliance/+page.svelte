<svelte:head>
	<title>LEGAL & COMPLIANCE | SweetyTreats</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>12 Legal &<br><span class="highlight">Compliance</span></h1>
	</header>

	<article class="content">
		<h2>12.1 Home Bakery Regulations</h2>
        <p>
			Operating a home-based food business requires compliance with local 
			regulations to ensure safety and legality.
		</p>
        
        <div class="highlight-box">
			<h3>📋 Key Requirements</h3>
			<ul>
                <li><strong>Barangay Clearance:</strong> Basic requirement for home businesses</li>
                <li><strong>Mayor's Permit:</strong> Business permit from local government</li>
                <li><strong>DTI Registration:</strong> Business name registration</li>
                <li><strong>FDA LTO:</strong> License to Operate for food businesses</li>
            </ul>
		</div>
		<div class="divider"></div>

		<h2>12.2 Food Safety Standards</h2>
        <p>
			Maintaining high food safety standards protects our customers and our reputation.
		</p>
        <div class="checklist">
            <div class="check-item">
                <span class="check">☐</span>
                <span>Clean, sanitized workspace daily</span>
            </div>
            <div class="check-item">
                <span class="check">☐</span>
                <span>Proper ingredient storage (cool, dry)</span>
            </div>
            <div class="check-item">
                <span class="check">☐</span>
                <span>Clear expiration date labeling</span>
            </div>
            <div class="check-item">
                <span class="check">☐</span>
                <span>Allergen warnings on packaging</span>
            </div>
            <div class="check-item">
                <span class="check">☐</span>
                <span>Temperature monitoring for storage</span>
            </div>
        </div>
        <div class="divider"></div>

		<h2>12.3 Labeling Requirements</h2>
        <p>
			Product labels should include:
		</p>
        <ul class="simple-list">
			<li><strong>Product Name:</strong> e.g., "Chocolate Chip Cookies"</li>
			<li><strong>Net Weight:</strong> Total weight of contents</li>
			<li><strong>Ingredients List:</strong> In descending order by weight</li>
			<li><strong>Allergen Statement:</strong> Contains: wheat, eggs, dairy, etc.</li>
			<li><strong>Best Before Date:</strong> Typically 1-2 weeks for cookies</li>
			<li><strong>Business Name & Contact:</strong> For traceability</li>
		</ul>
        <div class="divider"></div>

		<h2>12.4 Insurance Considerations</h2>
        <p>
			[Consider product liability insurance as you grow to protect against 
			potential claims.]
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

    .checklist {
        background: white;
        border: 2px solid var(--color-pink-light);
        border-radius: 16px;
        padding: 1.5rem;
        margin: 2rem 0;
    }
    .check-item {
        display: flex;
        align-items: center;
        padding: 0.75rem 0;
        border-bottom: 1px solid var(--color-pink-light);
    }
    .check-item:last-child { border-bottom: none; }
    .check-item .check {
        font-size: 1.25rem;
        margin-right: 1rem;
        color: var(--color-pink);
    }
    .check-item span:last-child {
        font-size: 1rem;
        color: #52525b;
    }

    .simple-list { margin-bottom: 1.5rem; }
    .simple-list li { 
        margin-bottom: 0.75rem; 
        font-size: 1.05rem; 
        line-height: 1.6;
        color: #52525b;
    }
</style>
