<svelte:head>
	<title>Operational Plan | Kanaya ID-Gen Business Plan</title>
</svelte:head>

<section class="doc-page">
	<header class="doc-header">
		<h1>06 Operational<br><span class="highlight">Plan</span></h1>
	</header>

	<article class="content">
		<h2>6.1 Location & Workflow Layout</h2>
		<p>
			<em>Placeholder: Production facility layout and workspace organization.</em>
		</p>
		<div class="divider"></div>

		<h2>6.2 Production Process (Print Flow)</h2>
		<p>
			<em>Placeholder: End-to-end ID card production workflow from design to delivery.</em>
		</p>
		<div class="divider"></div>

		<h2>6.3 Quality Control (QC Checkpoints)</h2>
		<p>
			<em>Placeholder: QC checkpoints for card quality, color accuracy, and alignment.</em>
		</p>
		<div class="divider"></div>

		<h2>6.4 Delivery & Fulfillment</h2>
		<p>
			<em>Placeholder: Packaging, shipping, and delivery protocols.</em>
		</p>
		<div class="divider"></div>

		<h2>6.5 Technology Stack</h2>
		<p>
			<em>Placeholder: Software and systems used for operations (SvelteKit, Drizzle, etc.).</em>
		</p>
	</article>
</section>

<style>
    .doc-page {
        max-width: 900px;
        margin: 0 auto;
        padding: 4rem 2rem;
        background: white;
        min-height: 100vh;
        font-family: 'Inter', sans-serif;
        color: #334155;
    }

    .doc-header h1 {
        font-size: 4rem;
        line-height: 0.9;
        margin-bottom: 4rem;
        color: #0f172a;
    }
    .highlight { color: white; background: #3b82f6; padding: 0 1rem; }
    @media(max-width:600px) { .doc-header h1 { font-size: 3rem; }}

    h2 {
        border-left: 6px solid #3b82f6;
        padding-left: 1rem;
        margin-bottom: 1.5rem;
        margin-top: 2rem;
        color: #1e293b;
        font-size: 1.3rem;
        font-weight: 700;
    }
    
    p { font-size: 1.1rem; line-height: 1.6; margin-bottom: 1.5rem; color: #64748b; }
    .divider { height: 2px; background: #e2e8f0; margin: 2rem 0; }
</style>
