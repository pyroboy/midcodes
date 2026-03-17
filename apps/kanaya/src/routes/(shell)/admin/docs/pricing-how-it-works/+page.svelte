<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Pricing & Operational Guide | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Pricing & Operational Guide</h1>
		<p class="meta">Core Value Proposition • Pricing Model • How It Works</p>
		<div class="status-chip highlight">Commercial Blueprint</div>
	</header>

	<section>
		<h2>1. Core Value Proposition (Landing)</h2>
		<p><strong>Kanaya: Identity, Encoded.</strong></p>
		<p>We provide a comprehensive ID ecosystem for Schools, Government, and Events. Our platform features secure verification, instant issuance, and live attendance tracking.</p>
		
		<h3>Key Product Sections:</h3>
		<ul>
			<li><strong>Verification Flow:</strong> A seamless process involving Encoding, Scanning, and Tapping for instant validation.</li>
			<li><strong>Architecture:</strong> Multi-layered security approach combining physical cards with digital twins.</li>
			<li><strong>Physical Ecosystem:</strong> Integrating hardware terminals with cloud-based management systems.</li>
		</ul>
	</section>

	<section>
		<h2>2. Service Menu & Pricing</h2>
		<h3>A. ID Card Production Tiers</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Category</th>
						<th>Description</th>
						<th>Target Market</th>
						<th>Price Range (PHP)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Standard Laminated</strong></td>
						<td>Heat-pressed sandwich construction</td>
						<td>Schools, Associations, Bulk IDs</td>
						<td>₱23 - ₱50</td>
					</tr>
					<tr>
						<td><strong>Premium Direct Print</strong></td>
						<td>Rigid PVC ATM-quality cards</td>
						<td>Corporate, Government, VIP</td>
						<td>₱120 - ₱180</td>
					</tr>
					<tr>
						<td><strong>TechSmart (RFID/NFC)</strong></td>
						<td>Direct print with microchip</td>
						<td>Access Control, Attendance</td>
						<td>₱180 - ₱280</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3>B. Security Add-ons</h3>
		<ul>
			<li><strong>UV Overlay:</strong> Invisible authentication under blacklight (+₱25/card).</li>
			<li><strong>Holographic Overlay:</strong> Tamper-evident reflective laminate (+₱35/card).</li>
			<li><strong>QR/Barcode:</strong> Unique digital lookup identifiers (Included).</li>
		</ul>

		<h3>C. Business Solution Packages</h3>
		<ul>
			<li><strong>Startup (₱25,000):</strong> RFID reader + 25 cards + basic software.</li>
			<li><strong>Business (₱55,000):</strong> Biometric terminal + 50 cards + pro software + installation.</li>
			<li><strong>Enterprise (Custom):</strong> Multi-location, multi-door, API integration.</li>
		</ul>
	</section>

	<section>
		<h2>3. Operational Workflow (How It Works)</h2>
		<p>Our 6-step process ensures professional results with minimal friction:</p>
		<ol class="timeline-v">
			<li><strong>Create & Customize:</strong> Choose premium templates and tailor to brand.</li>
			<li><strong>Add Security:</strong> Integrate QR codes, barcodes, and watermarks.</li>
			<li><strong>Capture Data:</strong> Snap photos directly into the system via mobile app.</li>
			<li><strong>Batch & Repeat:</strong> High-speed workflow optimized for bulk entries.</li>
			<li><strong>Order Delivery:</strong> Submission to professional production and shipping.</li>
			<li><strong>Deployment:</strong> Immediate distribution of durable, secure IDs.</li>
		</ol>
	</section>

	<footer class="docs-footer">
		<p>© 2026 Kanaya Identity Solutions • Commercial & Marketing Documentation</p>
		<p><a href="/admin/docs">← Back to Index</a></p>
	</footer>
</div>

<style>
	.docs-container {
		max-width: 900px;
		margin: 2rem auto;
		padding: 3rem;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 4px 10px rgba(0,0,0,0.05);
		font-family: 'Inter', system-ui, sans-serif;
		color: #334155;
	}

	.docs-header {
		border-bottom: 2px solid #f1f5f9;
		padding-bottom: 2rem;
		margin-bottom: 3rem;
	}

	h1 { font-size: 2.2rem; font-weight: 800; color: #0f172a; margin: 0; letter-spacing: -0.02em; }
	.meta { color: #64748b; font-size: 0.9rem; margin-top: 0.5rem; }

	.status-chip {
		display: inline-block;
		margin-top: 1rem;
		padding: 0.4rem 1rem;
		background: #f0f9ff;
		color: #0369a1;
		border-radius: 20px;
		font-weight: 700;
		font-size: 0.75rem;
		border: 1px solid #bae6fd;
	}

	h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; border-left: 4px solid #3b82f6; padding-left: 1rem; margin: 3.5rem 0 1.5rem; }
	h3 { font-size: 1.1rem; color: #475569; margin: 2rem 0 1rem; }

	.table-wrapper { margin: 1.5rem 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
	table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
	th { background: #f8fafc; padding: 1rem; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
	td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }

	.timeline-v { margin: 1.5rem 0; padding-left: 1.5rem; }
	.timeline-v li { margin-bottom: 1rem; list-style-type: decimal; font-weight: 600; color: #1e293b; }
	.timeline-v li::marker { color: #3b82f6; font-weight: 800; }

	.docs-footer { margin-top: 5rem; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 2rem; }
	.docs-footer a { color: #64748b; text-decoration: none; font-weight: 600; }
</style>
