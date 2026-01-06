<svelte:head>
	<title>Business Plan | Appendices</title>
</svelte:head>

<section class="doc-page">

	

	<header class="doc-header">
		<h1>10 Supporting <br><span class="highlight">Appendices</span></h1>
	</header>

	<article class="content">
        <div class="grid-2col">
            <section class="appendix-section">
                <h2>10.1 Sample Menu Design</h2>
                <div class="visual-placeholder dark">
                    <div class="icon">📜</div>
                    <p><strong>[Menu Board Mockup]</strong></p>
                    <p class="sub">Showing "Winner" items highlighted in Orange, standard items in White text on Black background.</p>
                </div>
            </section>
            
            <section class="appendix-section">
                <h2>10.2 Store Layout</h2>
                 <div class="visual-placeholder blue">
                    <div class="icon">📐</div>
                    <p><strong>[3m x 3m Floor Plan]</strong></p>
                    <p class="sub">Zones A, B, C, D clearly marked with workflow arrows showing "Raw -> Cooked -> Served" path.</p>
                </div>
            </section>
        </div>

        <div class="divider"></div>

        <h2>10.3 Regulatory Checklist</h2>
        <div class="permit-grid">
            <div class="permit-card">
                <span class="status-badge">REQUIRED</span>
                <h4>Barangay Clearance</h4>
                <p>Local community business clearance from Brgy. Poblacion.</p>
            </div>
            <div class="permit-card">
                <span class="status-badge">REQUIRED</span>
                <h4>Mayor’s Permit</h4>
                <p>City Hall business privilege tax payment and operational license.</p>
            </div>
            <div class="permit-card">
                <span class="status-badge">REQUIRED</span>
                <h4>BIR Certificate (2303)</h4>
                <p>Tax registration as a Non-VAT Sole Proprietorship.</p>
            </div>
            <div class="permit-card">
                <span class="status-badge">REQUIRED</span>
                <h4>DTI Registration</h4>
                <p>Trade name protection for "Silog Hub" (National Scope).</p>
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
        min-height: 100vh; 
        font-family: 'Inter', sans-serif;
    }
    
    /* HEADER */
    .doc-header {
        margin-bottom: 4rem;
        border-bottom: 4px solid #0f172a;
        padding-bottom: 2rem;
    }
    .doc-header h1 {
        font-size: 5rem;
        line-height: 0.9;
        margin-bottom: 4rem;
        color: #0f172a;
    }
    .highlight { color: white; background: #0f172a; padding: 0 1rem; }
    @media(max-width:600px) { .doc-header h1 { font-size: 3.5rem; }}

    /* SECTIONS */
    h2 { 
        font-size: 1.5rem; 
        border-left: 6px solid #f97316;
        padding-left: 1rem;
        margin-bottom: 1.5rem;
        color: #1e293b;
    }
    
    .divider { height: 2px; background: #e4e4e7; margin: 3rem 0; }
    .grid-2col { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    
    /* VISUAL PLACEHOLDERS */
    .visual-placeholder {
        background: #f8fafc;
        border: 2px dashed #cbd5e0;
        padding: 3rem 2rem;
        text-align: center;
        border-radius: 8px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        min-height: 250px;
    }
    .visual-placeholder.dark { background: #1e293b; border-color: #475569; color: white; }
    .visual-placeholder.blue { background: #eff6ff; border-color: #bfdbfe; color: #1e3a8a; }
    
    .visual-placeholder .icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.8; }
    .visual-placeholder strong { font-size: 1.2rem; display: block; margin-bottom: 0.5rem; }
    .visual-placeholder .sub { font-size: 0.9rem; opacity: 0.7; max-width: 80%; margin: 0 auto; }
    
    /* PERMITS */
    .permit-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1.5rem;
    }
    .permit-card {
        background: white;
        border: 2px solid #0f172a;
        padding: 1.5rem;
        box-shadow: 4px 4px 0px #0f172a;
        transition: transform 0.2s;
    }
    .permit-card:hover { transform: translateY(-2px); }
    
    .status-badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 800;
        background: #dcfce7;
        color: #166534;
        padding: 2px 6px;
        border: 1px solid #166534;
        margin-bottom: 0.75rem;
    }
    .permit-card h4 {
        margin: 0 0 0.5rem 0;
        font-size: 1.1rem;
        font-weight: 700;
        color: #0f172a;
    }
    .permit-card p {
        margin: 0;
        font-size: 0.9rem;
        color: #475569;
        line-height: 1.4;
    }

    @media (max-width: 768px) {
        .doc-header h1 { font-size: 3rem; }
        .grid-2col { grid-template-columns: 1fr; }
    }
</style>
