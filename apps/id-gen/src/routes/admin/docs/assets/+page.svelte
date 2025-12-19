<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Asset Management | Admin Documentation</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Asset Management System Documentation</h1>
		<p class="meta">Version 1.0 • December 2024 • Internal Technical Reference</p>
		<p class="subject">Subject: Storage Structure, Workflow, and Optimization Strategies</p>
	</header>

	<nav class="toc">
		<h2>Table of Contents</h2>
		<ol>
			<li><a href="#overview">System Overview</a></li>
			<li><a href="#storage">Storage Structure</a></li>
			<li><a href="#workflow">Complete Workflow</a></li>
			<li><a href="#asset-types">Asset Types & Categories</a></li>
			<li><a href="#optimization">Optimization Strategy</a></li>
			<li><a href="#access-control">Access Control Matrix</a></li>
		</ol>
	</nav>

	<section id="overview">
		<h2>I. System Overview</h2>
		
		<p>
			The Kanaya Asset Management System provides a comprehensive framework for managing all visual 
			assets across the platform—from admin-created templates to user-generated ID cards. The system 
			is designed with three core principles:
		</p>

		<div class="pillar">
			<h3>Cost-Effective Processing</h3>
			<p>
				All image processing happens client-side using Canvas APIs, eliminating server costs. 
				Assets are pre-rendered at upload time into multiple resolutions for optimal loading.
			</p>
		</div>

		<div class="pillar">
			<h3>Data Isolation</h3>
			<p>
				Assets are organized by ownership level—system templates, organization branding, 
				and user-generated content are stored in separate paths with appropriate access controls.
			</p>
		</div>

		<div class="pillar">
			<h3>Print-Ready Quality</h3>
			<p>
				All source assets maintain 300 DPI resolution for professional printing, while 
				optimized variants (preview, thumbnail) ensure fast loading in the interface.
			</p>
		</div>
	</section>

	<section id="storage">
		<h2>II. Storage Structure</h2>

		<p>Assets are organized in Cloudflare R2 storage with the following hierarchy:</p>

		<h3>2.1 System Assets (Super Admin)</h3>
		<p>Platform-wide template assets managed by super administrators.</p>
		<table>
			<thead>
				<tr>
					<th>Path</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>system/templates/[template-id]/</code></td>
					<td>All variants for a specific template</td>
				</tr>
				<tr>
					<td><code>system/global-assets/icons/</code></td>
					<td>Shared icons and UI elements</td>
				</tr>
				<tr>
					<td><code>system/global-assets/fonts/</code></td>
					<td>Custom font files</td>
				</tr>
			</tbody>
		</table>

		<h3>2.2 Organization Assets</h3>
		<p>Organization-scoped branding and custom assets.</p>
		<table>
			<thead>
				<tr>
					<th>Path</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>orgs/[org-id]/branding/</code></td>
					<td>Organization logos and branding materials</td>
				</tr>
				<tr>
					<td><code>orgs/[org-id]/custom-templates/</code></td>
					<td>Organization-specific templates (if enabled)</td>
				</tr>
			</tbody>
		</table>

		<h3>2.3 User ID Cards</h3>
		<p>User-generated ID card renders.</p>
		<table>
			<thead>
				<tr>
					<th>Path</th>
					<th>Description</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><code>cards/[org-id]/[template-id]/[card-id]/</code></td>
					<td>Individual ID card renders with front/back variants</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section id="workflow">
		<h2>III. Complete Workflow</h2>

		<p>The end-to-end journey from template creation to print-ready output:</p>

		<h3>3.1 Admin Template Creation</h3>
		<ol>
			<li><strong>Create Template</strong> — Design in template editor with elements</li>
			<li><strong>Upload Backgrounds</strong> — Front and back card backgrounds</li>
			<li><strong>Add Elements</strong> — Text, photo, signature, QR placeholders</li>
			<li><strong>Save Template</strong> — Triggers asset variant generation</li>
			<li><strong>Auto-Generate Variants</strong> — System creates all required sizes</li>
		</ol>

		<h3>3.2 Asset Variants Generated (Per Template)</h3>
		<table>
			<thead>
				<tr>
					<th>Asset Type</th>
					<th>Files</th>
					<th>Purpose</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Template (Full)</td>
					<td>template-front.png, template-back.png</td>
					<td>300 DPI master for print</td>
				</tr>
				<tr>
					<td>Template (Preview)</td>
					<td>template-front-preview.png, template-back-preview.png</td>
					<td>800px for browsing</td>
				</tr>
				<tr>
					<td>Template (Thumb)</td>
					<td>template-front-thumb.png, template-back-thumb.png</td>
					<td>200px for lists</td>
				</tr>
				<tr>
					<td>Sample</td>
					<td>sample-front.png, sample-back.png</td>
					<td>Template with example data filled</td>
				</tr>
				<tr>
					<td>Blank</td>
					<td>blank-front.png, blank-back.png</td>
					<td>Background only, no elements</td>
				</tr>
			</tbody>
		</table>

		<h3>3.3 User ID Creation</h3>
		<ol>
			<li><strong>Browse Templates</strong> — View thumbnails (200px)</li>
			<li><strong>Select Template</strong> — Load preview (800px)</li>
			<li><strong>Fill Form Data</strong> — Enter personal information</li>
			<li><strong>Upload Photo/Signature</strong> — Personal assets</li>
			<li><strong>Preview ID Card</strong> — Client-side render</li>
			<li><strong>Submit & Pay</strong> — Credit consumption</li>
			<li><strong>Generate Final ID</strong> — Full resolution + preview uploaded</li>
		</ol>

		<h3>3.4 Output Options</h3>
		<ul>
			<li><strong>Digital Preview</strong> — 800px version for screen viewing</li>
			<li><strong>Print-Ready Download</strong> — 300 DPI PNG for professional printing</li>
			<li><strong>Digital Card</strong> — NFC/QR linked digital profile</li>
		</ul>
	</section>

	<section id="asset-types">
		<h2>IV. Asset Types & Categories</h2>

		<h3>4.1 Template Asset Categories</h3>
		<table>
			<thead>
				<tr>
					<th>Category</th>
					<th>Description</th>
					<th>Use Case</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Template</strong></td>
					<td>Complete design with element placeholders visible</td>
					<td>Admin editing, shows where fields appear</td>
				</tr>
				<tr>
					<td><strong>Sample</strong></td>
					<td>Template with sample data filled in</td>
					<td>Marketing, user preview before selection</td>
				</tr>
				<tr>
					<td><strong>Blank</strong></td>
					<td>Raw background image only</td>
					<td>Source for rendering, custom compositions</td>
				</tr>
				<tr>
					<td><strong>Blank Pairs</strong></td>
					<td>Front + back blanks as matched set</td>
					<td>Ensure design consistency</td>
				</tr>
			</tbody>
		</table>

		<h3>4.2 Resolution Variants</h3>
		<table>
			<thead>
				<tr>
					<th>Variant</th>
					<th>Resolution</th>
					<th>Format</th>
					<th>Use Case</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Full</td>
					<td>300 DPI (original)</td>
					<td>PNG</td>
					<td>Printing, archival</td>
				</tr>
				<tr>
					<td>Preview</td>
					<td>800px max dimension</td>
					<td>JPEG (85%)</td>
					<td>Browsing, digital viewing</td>
				</tr>
				<tr>
					<td>Thumbnail</td>
					<td>200px max dimension</td>
					<td>JPEG (80%)</td>
					<td>Lists, grids, carousel</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section id="optimization">
		<h2>V. Optimization Strategy</h2>

		<h3>5.1 Processing Location</h3>
		<p>
			To minimize costs, image processing is strategically distributed between client and server:
		</p>
		<table>
			<thead>
				<tr>
					<th>Operation</th>
					<th>Location</th>
					<th>Reason</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Thumbnail generation</td>
					<td>Client (Canvas)</td>
					<td>Fast, zero server cost</td>
				</tr>
				<tr>
					<td>Preview generation</td>
					<td>Client (Canvas)</td>
					<td>Fast, zero server cost</td>
				</tr>
				<tr>
					<td>Full-res print render</td>
					<td>Client (Canvas)</td>
					<td>Already implemented, efficient</td>
				</tr>
				<tr>
					<td>Background removal</td>
					<td>Server (Runware API)</td>
					<td>AI-powered, requires cloud</td>
				</tr>
				<tr>
					<td>Image compression</td>
					<td>Client (Canvas toBlob)</td>
					<td>Free, native browser API</td>
				</tr>
			</tbody>
		</table>

		<h3>5.2 Pre-render Strategy</h3>
		<p>Assets are generated at upload time, not on-demand, for optimal performance:</p>
		<ul>
			<li><strong>Templates:</strong> Generate 3 sizes (full, preview, thumb) plus sample and blank variants</li>
			<li><strong>User ID Cards:</strong> Generate 2 sizes (full for print, preview for viewing)</li>
			<li><strong>User Photos:</strong> Generate 2 sizes (full for rendering, thumbnail for forms)</li>
		</ul>

		<h3>5.3 Caching Layers</h3>
		<ul>
			<li><strong>Browser Cache:</strong> Long TTL for static assets (templates don't change often)</li>
			<li><strong>Memory Cache:</strong> ImageCache utility for loaded images during session</li>
			<li><strong>CDN Cache:</strong> Cloudflare edge caching for global distribution</li>
		</ul>
	</section>

	<section id="access-control">
		<h2>VI. Access Control Matrix</h2>

		<p>Asset visibility and permissions by user role:</p>

		<table>
			<thead>
				<tr>
					<th>Role</th>
					<th>System Templates</th>
					<th>Org Branding</th>
					<th>User Cards</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Super Admin</strong></td>
					<td>Full CRUD</td>
					<td>View all orgs</td>
					<td>View all cards</td>
				</tr>
				<tr>
					<td><strong>Org Admin</strong></td>
					<td>Read only</td>
					<td>Full CRUD (own org)</td>
					<td>View org's cards</td>
				</tr>
				<tr>
					<td><strong>User</strong></td>
					<td>Read only</td>
					<td>Read only</td>
					<td>Own cards only</td>
				</tr>
			</tbody>
		</table>

		<div class="note">
			<strong>Privacy Note:</strong> Super Admins can view all user-generated ID cards for 
			support and compliance purposes. This access is logged in the admin audit trail.
		</div>
	</section>

	<footer class="docs-footer">
		<p>Internal Documentation • Super Admin Access Only</p>
		<p><a href="/admin/docs">← Back to Main Documentation</a></p>
	</footer>
</div>

<style>
	.docs-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
		line-height: 1.6;
		color: #222;
	}

	.docs-header {
		border-bottom: 2px solid #333;
		padding-bottom: 1.5rem;
		margin-bottom: 2rem;
	}

	.docs-header h1 {
		margin: 0 0 0.5rem;
		font-size: 1.75rem;
	}

	.meta {
		color: #666;
		font-size: 0.9rem;
		margin: 0.25rem 0;
	}

	.subject {
		font-weight: 600;
		margin: 0.5rem 0 0;
	}

	.toc {
		background: #f5f5f5;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.toc h2 {
		margin: 0 0 1rem;
		font-size: 1.1rem;
		border: none;
		padding: 0;
	}

	.toc ol {
		margin: 0;
		padding-left: 1.5rem;
	}

	.toc li {
		margin: 0.5rem 0;
	}

	.toc a {
		color: #0066cc;
		text-decoration: none;
	}

	.toc a:hover {
		text-decoration: underline;
	}

	section {
		margin-bottom: 2.5rem;
	}

	h2 {
		font-size: 1.4rem;
		border-bottom: 1px solid #ddd;
		padding-bottom: 0.5rem;
		margin: 1.5rem 0 1rem;
	}

	h3 {
		font-size: 1.1rem;
		margin: 1.5rem 0 0.75rem;
		color: #444;
	}

	.pillar {
		background: #f9f9f9;
		padding: 1rem 1.25rem;
		border-left: 3px solid #333;
		margin: 1rem 0;
	}

	.pillar h3 {
		margin-top: 0;
		color: #222;
	}

	.pillar p {
		margin-bottom: 0;
	}

	ul, ol {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	li {
		margin: 0.35rem 0;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
		font-size: 0.95rem;
	}

	th, td {
		border: 1px solid #ddd;
		padding: 0.75rem;
		text-align: left;
	}

	th {
		background: #f5f5f5;
		font-weight: 600;
	}

	tr:nth-child(even) {
		background: #fafafa;
	}

	code {
		background: #e8e8e8;
		padding: 0.15rem 0.4rem;
		border-radius: 3px;
		font-size: 0.85em;
		font-family: 'SF Mono', Monaco, monospace;
	}

	.note {
		background: #fff8e1;
		border-left: 3px solid #ffc107;
		padding: 1rem 1.25rem;
		margin: 1.5rem 0;
	}

	.docs-footer {
		margin-top: 3rem;
		padding-top: 1rem;
		border-top: 1px solid #ddd;
		text-align: center;
		color: #888;
		font-size: 0.875rem;
	}

	.docs-footer a {
		color: #0066cc;
		text-decoration: none;
	}

	.docs-footer a:hover {
		text-decoration: underline;
	}
</style>
