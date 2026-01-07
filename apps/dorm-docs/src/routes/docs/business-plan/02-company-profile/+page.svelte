<svelte:head>
	<title>02 Company Profile - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">02</span>
		<h1>Company Profile</h1>
	</header>

	<section class="section">
		<h2>Legal Structure</h2>
		<table class="info-table">
			<tbody>
				<tr>
					<th>Business Name</th>
					<td>DA Tirol Dorm</td>
				</tr>
				<tr>
					<th>Business Type</th>
					<td>Sole Proprietorship</td>
				</tr>
				<tr>
					<th>Proprietor</th>
					<td>Mrs. Amalia Reyes Tirol ("Mama Maly")</td>
				</tr>
				<tr>
					<th>Classification</th>
					<td>Rental / Accommodation Services</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Ownership</h2>
		<p>
			The dormitory is owned and operated by the <strong>Tirol Family</strong>, led by Mrs. Amalia Reyes Tirol ("Mama Maly"). With over <strong>10 years of experience</strong> in managing student accommodations, the management emphasizes a family-oriented approach, treating every tenant as part of the extended household.
		</p>
	</section>

	<section class="section">
		<h2>Business History</h2>
		<div class="timeline">
			<div class="timeline-item">
				<span class="year">1980s</span>
				<p>Acquired land from the Ingking family. Started as a single-story building selling school supplies.</p>
			</div>
			<div class="timeline-item">
				<span class="year">1990s</span>
				<p>Converted into a restaurant named "Casa Rey" and expanded with a 2nd floor for rental spaces.</p>
			</div>
			<div class="timeline-item">
				<span class="year">2000s</span>
				<p>Added a 3rd floor for additional rental units and fully converted operations into a dormitory.</p>
			</div>
			<div class="timeline-item">
				<span class="year">2023-2024</span>
				<p>Major renovation phase: Roof replacement, Kitchen upgrades, and modernization.</p>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Location</h2>
		<div class="highlight-box">
			<p>
				<strong>Address:</strong> [Specific Street Address], Tagbilaran City<br>
				<strong>Province:</strong> Bohol, Philippines 6300<br>
				<strong>Landmark:</strong> Near University of Bohol (UB) Campus
			</p>
		</div>
		<h3>Accessibility</h3>
		<ul>
			<li><strong>3-5 minutes walk</strong> to University of Bohol (UB).</li>
			<li><strong>Accessible</strong> to tricycles and public transport routes.</li>
			<li><strong>Near Essentials:</strong> Walking distance to pharmacies, eateries, and convenience stores.</li>
		</ul>
	</section>

	<section class="section">
		<h2>Contact Information</h2>
		<table class="info-table">
			<tbody>
				<tr>
					<th>Phone</th>
					<td class="placeholder">[Contact Number]</td>
				</tr>
				<tr>
					<th>Email</th>
					<td class="placeholder">[Email Address]</td>
				</tr>
				<tr>
					<th>Facebook</th>
					<td class="placeholder">[Facebook Page URL]</td>
				</tr>
			</tbody>
		</table>
	</section>
</article>

<style>
	.chapter { max-width: 800px; }
	.chapter-header { margin-bottom: 3rem; }
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
	.section { margin-bottom: 3rem; }
	.section h2 {
		font-size: 1.5rem;
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 2px solid var(--color-gray-200);
	}
	.section h3 {
		font-size: 1.1rem;
		margin: 1.5rem 0 1rem;
		text-transform: none;
	}
	p, li {
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
	.info-table {
		width: 100%;
		border-collapse: collapse;
	}
	.info-table th, .info-table td {
		padding: 1rem;
		border: 1px solid var(--color-gray-200);
		text-align: left;
	}
	.info-table th {
		background: var(--color-gray-100);
		font-weight: 600;
		width: 35%;
	}
	.timeline {
		border-left: 3px solid var(--color-primary);
		padding-left: 2rem;
	}
	.timeline-item {
		margin-bottom: 1.5rem;
		position: relative;
	}
	.timeline-item::before {
		content: '';
		width: 12px;
		height: 12px;
		background: var(--color-primary);
		border-radius: 50%;
		position: absolute;
		left: -2.4rem;
		top: 0.5rem;
	}
	.year {
		font-family: var(--font-header);
		font-weight: 700;
		font-size: 1.25rem;
		display: block;
		margin-bottom: 0.5rem;
	}
	ul { padding-left: 1.5rem; }
</style>
