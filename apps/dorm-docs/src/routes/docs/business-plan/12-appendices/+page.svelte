<svelte:head>
	<title>12 Appendices - DA Tirol Dorm</title>
</svelte:head>

<article class="chapter">
	<header class="chapter-header">
		<span class="chapter-number">12</span>
		<h1>Appendices</h1>
	</header>

	<section class="section">
		<h2>Document Templates</h2>
		<div class="doc-list">
			<div class="doc-item">
				<span class="doc-icon">📄</span>
				<div class="doc-info">
					<h3>Tenant Information Form</h3>
					<p class="placeholder">[Link to template or attached document]</p>
				</div>
			</div>
			<div class="doc-item">
				<span class="doc-icon">📄</span>
				<div class="doc-info">
					<h3>Move-in/Move-out Checklist</h3>
					<p class="placeholder">[Link to template or attached document]</p>
				</div>
			</div>
			<div class="doc-item">
				<span class="doc-icon">📄</span>
				<div class="doc-info">
					<h3>Maintenance Request Form</h3>
					<p class="placeholder">[Link to template or attached document]</p>
				</div>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Legal Documents</h2>
		<table class="legal-table">
			<thead>
				<tr>
					<th>Document</th>
					<th>Status</th>
					<th>Location</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>DTI Registration</td>
					<td class="placeholder">[Active]</td>
					<td class="placeholder">[File location]</td>
				</tr>
				<tr>
					<td>Business Permit</td>
					<td class="placeholder">[Active]</td>
					<td class="placeholder">[File location]</td>
				</tr>
				<tr>
					<td>Fire Safety Certificate</td>
					<td class="placeholder">[Active]</td>
					<td class="placeholder">[File location]</td>
				</tr>
				<tr>
					<td>BIR Certificate of Registration</td>
					<td class="placeholder">[Active]</td>
					<td class="placeholder">[File location]</td>
				</tr>
				<tr>
					<td>Property Tax Receipts</td>
					<td class="placeholder">[Current]</td>
					<td class="placeholder">[File location]</td>
				</tr>
				<tr>
					<td>Land Title / Lease Contract</td>
					<td class="placeholder">[On file]</td>
					<td class="placeholder">[File location]</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Floor Plans & Photos</h2>
		<div class="media-grid">
			<div class="media-placeholder">
				<span>📐</span>
				<p class="placeholder">Ground Floor Plan</p>
			</div>
			<div class="media-placeholder">
				<span>📐</span>
				<p class="placeholder">2nd Floor Plan</p>
			</div>
			<div class="media-placeholder">
				<span>📷</span>
				<p class="placeholder">Building Exterior</p>
			</div>
			<div class="media-placeholder">
				<span>📷</span>
				<p class="placeholder">Sample Room Photos</p>
			</div>
		</div>
	</section>

	<section class="section">
		<h2>Contractor Directory</h2>
		<table class="contractor-table">
			<thead>
				<tr>
					<th>Service</th>
					<th>Name/Company</th>
					<th>Contact</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Electrician</td>
					<td class="placeholder">[Name]</td>
					<td class="placeholder">[Contact]</td>
				</tr>
				<tr>
					<td>Plumber</td>
					<td class="placeholder">[Name]</td>
					<td class="placeholder">[Contact]</td>
				</tr>
				<tr>
					<td>Carpenter</td>
					<td class="placeholder">[Name]</td>
					<td class="placeholder">[Contact]</td>
				</tr>
				<tr>
					<td>Pest Control</td>
					<td class="placeholder">[Company]</td>
					<td class="placeholder">[Contact]</td>
				</tr>
				<tr>
					<td>Aircon Technician</td>
					<td class="placeholder">[Name/Company]</td>
					<td class="placeholder">[Contact]</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="section">
		<h2>Reference Materials</h2>
		<ul class="reference-list">
			<li class="placeholder">Local rental rate survey data</li>
			<li class="placeholder">Competitor pricing research</li>
			<li class="placeholder">Utility rate schedules ([Electric Coop], [Water District])</li>
			<li class="placeholder">Labor rate references (DOLE minimum wage orders)</li>
			<li class="placeholder">Tax reference materials (BIR percentage tax, income tax)</li>
		</ul>
	</section>

	<section class="section">
		<h2>Document Revision History</h2>
		<table class="revision-table">
			<thead>
				<tr>
					<th>Version</th>
					<th>Date</th>
					<th>Changes</th>
					<th>Author</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>1.0</td>
					<td class="placeholder">[Date]</td>
					<td>Initial document creation</td>
					<td class="placeholder">[Name]</td>
				</tr>
			</tbody>
		</table>
	</section>
</article>

<style>
	.chapter { max-width: 800px; }
	.chapter-header { margin-bottom: 3rem; }
	.chapter-number { font-family: var(--font-header); font-size: 4rem; font-weight: 700; color: var(--color-primary); opacity: 0.3; line-height: 1; }
	.chapter-header h1 { font-size: 3rem; margin-top: 0.5rem; line-height: 1.1; }
	.section { margin-bottom: 3rem; }
	.section h2 { font-size: 1.5rem; margin-bottom: 1.5rem; padding-bottom: 0.5rem; border-bottom: 2px solid var(--color-gray-200); }
	.section h3 { font-size: 1rem; margin-bottom: 0.25rem; text-transform: none; }
	p { font-size: 1rem; line-height: 1.6; margin: 0; }
	.placeholder { background: #fef3c7; padding: 0.25rem 0.5rem; border-left: 3px solid #f59e0b; }
	.doc-list { display: grid; gap: 0.75rem; }
	.doc-item { display: flex; align-items: center; gap: 1rem; background: var(--color-gray-100); padding: 1rem 1.5rem; border-left: 4px solid var(--color-primary); }
	.doc-icon { font-size: 1.5rem; }
	.doc-info { flex: 1; }
	.doc-info p { font-size: 0.9rem; color: #71717a; }
	table { width: 100%; border-collapse: collapse; margin-bottom: 1rem; }
	th, td { padding: 0.75rem 1rem; border: 1px solid var(--color-gray-200); text-align: left; font-size: 0.95rem; }
	th { background: var(--color-black); color: white; font-weight: 600; }
	.media-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 1rem; }
	@media (max-width: 600px) { .media-grid { grid-template-columns: 1fr; } }
	.media-placeholder { background: var(--color-gray-200); padding: 3rem; text-align: center; border: 2px dashed var(--color-gray-200); }
	.media-placeholder span { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
	.media-placeholder p { margin: 0; font-size: 0.9rem; }
	.reference-list { list-style: none; padding: 0; }
	.reference-list li { padding: 0.75rem 1rem; margin-bottom: 0.5rem; background: var(--color-gray-100); border-left: 3px solid var(--color-primary); }
</style>
