<svelte:head>
	<title>01 Executive Summary - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">01</span>
		<h1>Executive Summary</h1>
	</header>

	<section class="section">
		<h2>Business Overview</h2>
		<p>
			<strong>DA Tirol Dorm</strong> (formerly known as Tirol Boarding House) is a premier student accommodation facility located in <strong>Tagbilaran City, Bohol</strong>. Strategically situated near the <strong>University of Bohol (UB)</strong>, we provide a safe, conducive, and affordable living environment for students and review center enrollees.
		</p>
		<p>
			With over a decade of operation, the property has evolved from a traditional boarding house into a modern dormitory, currently undergoing significant renovations to integrate smart management features and improved amenities.
		</p>
	</section>

	<section class="section">
		<h2>Mission & Vision</h2>
		<div class="highlight-box">
			<h3>Mission</h3>
			<p>To provide a "home away from home" for Boholano students by offering safe, affordable, and study-conducive living spaces that support their academic success and personal growth.</p>
		</div>
		<div class="highlight-box">
			<h3>Vision</h3>
			<p>To be a premium stay for students where they could reside in ease and comfort.</p>
		</div>
	</section>

	<section class="section">
		<h2>Key Metrics Snapshot</h2>
		<div class="metrics-grid">
			<div class="metric">
				<span class="metric-label">Total Capacity</span>
				<span class="metric-value">~30 beds</span>
			</div>
			<div class="metric">
				<span class="metric-label">Target Occupancy</span>
				<span class="metric-value">95%</span>
			</div>
			<div class="metric">
				<span class="metric-label">Est. Monthly Revenue</span>
				<span class="metric-value">₱50,000+</span>
			</div>
			<div class="metric">
				<span class="metric-label">Target Market</span>
				<span class="metric-value">UB Students</span>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Business Highlights</h2>
		<ul class="highlight-list">
			<li><strong>Prime Location:</strong> Walking distance to University of Bohol and accessible to public transport.</li>
			<li><strong>Affordable Rates:</strong> Competitive bedspace rates starting at ₱2,000/month.</li>
			<li><strong>Modern Upgrades:</strong> Newly renovated roof, kitchen, and upcoming CCTV installation.</li>
			<li><strong>Tech-Integrated:</strong> developing a dedicated Dorm Management App for billing and transparent utility tracking.</li>
			<li><strong>Family-Oriented:</strong> Managed by the Tirol family ("Mama Maly"), ensuring personalized care and safety.</li>
		</ul>
	</section>
</article>

<style>
	.chapter {
		max-width: 800px;
	}

	.chapter-header {
		margin-bottom: 3rem;
	}

	.chapter-number {
		font-family: var(--font-header);
		font-size: 4rem;
		font-weight: 700;
		color: var(--color-primary);
		opacity: 0.3;
		line-height: 1;
	}

	.chapter-header h1 {
		font-size: 3rem;
		margin-top: 0.5rem;
		line-height: 1.1;
	}

	.section {
		margin-bottom: 3rem;
	}

	.section h2 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--color-gray-200);
	}

	.section h3 {
		font-size: 1.1rem;
		margin-bottom: 0.75rem;
	}

	p {
		font-size: 1.1rem;
		line-height: 1.7;
		margin-bottom: 1rem;
	}

	.placeholder {
		background: #fef3c7;
		padding: 0.25rem 0.5rem;
		border-left: 3px solid #f59e0b;
	}

	.highlight-box {
		background: var(--color-gray-100);
		padding: 1.5rem;
		margin-bottom: 1rem;
		border-left: 4px solid var(--color-primary);
	}

	.highlight-box h3 {
		text-transform: none;
	}

	.highlight-box p {
		margin: 0;
	}

	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 1rem;
	}

	@media (max-width: 600px) {
		.metrics-grid {
			grid-template-columns: 1fr;
		}
	}

	.metric {
		background: white;
		border: 2px solid var(--color-black);
		padding: 1.5rem;
		text-align: center;
	}

	.metric-label {
		display: block;
		font-size: 0.85rem;
		text-transform: uppercase;
		font-weight: 600;
		color: #71717a;
		margin-bottom: 0.5rem;
	}

	.metric-value {
		font-family: var(--font-header);
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--color-black);
	}

	.highlight-list {
		list-style: none;
		padding: 0;
	}

	.highlight-list li {
		position: relative;
		padding-left: 2rem;
		margin-bottom: 1rem;
		font-size: 1.1rem;
		line-height: 1.6;
	}

	.highlight-list li::before {
		content: '→';
		position: absolute;
		left: 0;
		font-weight: 700;
		color: var(--color-primary);
	}
</style>
