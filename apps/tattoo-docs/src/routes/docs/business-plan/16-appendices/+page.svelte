<svelte:head>
	<title>APPENDICES | Tattoo Studio</title>
</svelte:head>

<section class="doc-page">

	<header class="doc-header">
		<h1>16 Appendices<br><span class="highlight">& Forms</span></h1>
	</header>

	<article class="content">
		<h2>16.1 Document Index</h2>
        <p>This section contains templates and printable forms necessary for daily operations.</p>
        
        <div class="link-grid">
            <a href="/" class="file-card">
                <span class="icon">📄</span>
                <strong>Client Waiver & Consent Form</strong>
                <small>Updated 2026</small>
            </a>
            <a href="/" class="file-card">
                <span class="icon">📑</span>
                <strong>Aftercare Instructions Sheet</strong>
                <small>Physical Handout</small>
            </a>
            <a href="/" class="file-card">
                <span class="icon">🧹</span>
                <strong>Daily Sterilization Log</strong>
                <small>Compliance</small>
            </a>
            <a href="/" class="file-card">
                <span class="icon">💉</span>
                <strong>Needle & Ink Usage Log</strong>
                <small>Inventory Tracking</small>
            </a>
            <a href="/" class="file-card">
                <span class="icon">💳</span>
                <strong>Deposit Receipt Template</strong>
                <small>Financial</small>
            </a>
             <a href="/" class="file-card">
                <span class="icon">🚑</span>
                <strong>Emergency Protocol</strong>
                <small>Safety</small>
            </a>
        </div>
        <div class="divider"></div>

		<h2>16.2 Studio Layout Blueprint</h2>
        <div class="placeholder-box">
            <p>[Insert Floor Plan Diagram Here]</p>
            <small>Showing waiting area, sanitization station, and procedure zones.</small>
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
        font-size: 5rem;
        line-height: 0.9;
        margin-bottom: 4rem;
    }
    .highlight { color: var(--color-white); background: var(--color-black); padding: 0 1rem; }
    @media(max-width:600px) { .doc-header h1 { font-size: 3.5rem; }}

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
        background: var(--color-gray-200);
        margin: 3rem 0;
    }

    .link-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1rem;
        margin-bottom: 2rem;
    }
    .file-card {
        background: white;
        border: 2px solid var(--color-gray-300);
        padding: 1.5rem;
        display: flex;
        flex-direction: column;
        text-decoration: none;
        color: var(--color-black);
        transition: all 0.2s;
    }
    .file-card:hover {
        border-color: var(--color-black);
        box-shadow: 4px 4px 0px var(--color-black);
        transform: translateY(-2px);
    }
    .file-card .icon { font-size: 2rem; margin-bottom: 0.5rem; }
    .file-card strong { font-family: var(--font-header); font-size: 1.1rem; font-weight: 400; margin-bottom: 0.25rem; }
    .file-card small { color: var(--color-gray-500); font-size: 0.85rem; }

    .placeholder-box {
        background: var(--color-gray-200);
        border: 2px dashed var(--color-gray-400);
        height: 200px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        color: var(--color-gray-500);
        margin-bottom: 2rem;
    }
    .placeholder-box p { margin: 0; font-weight: 700; color: var(--color-gray-600); }
</style>
