<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Inventory & Logistics | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Inventory & Logistics Control</h1>
		<p class="meta">Operations • Updated: January 2026</p>
		<p class="subject">Subject: Stock Levels, Supplier Directory, and Maintenance</p>
	</header>

	<nav class="toc">
		<h2>Logistics Dashboard</h2>
		<ol>
			<li><a href="#consumables">Consumables Tracking</a></li>
			<li><a href="#suppliers">Supplier Blackbook</a></li>
			<li><a href="#maintenance">Equipment Maintenance</a></li>
		</ol>
	</nav>

	<section id="consumables">
		<h2>I. Consumables & Stock Levels</h2>
		<p class="subtext">Standard Reorder Point: Buffer for <strong>500 IDs</strong>.</p>

		<table class="inventory-table">
			<thead>
				<tr>
					<th>Item Name</th>
					<th>Packaging</th>
					<th>Reorder Point</th>
					<th>Est. Cost</th>
					<th>Status</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>PVC Sheets (Printable A)</strong></td>
					<td>Pack of 50</td>
					<td>5 Packs</td>
					<td>₱1,800/box</td>
					<td><span class="status good">Good</span></td>
				</tr>
				<tr>
					<td><strong>PVC Core (Dragon Sheet)</strong></td>
					<td>Pack of 50</td>
					<td>5 Packs</td>
					<td>(Bundled)</td>
					<td><span class="status good">Good</span></td>
				</tr>
				<tr>
					<td><strong>Epson Ink (6-Color)</strong></td>
					<td>CMYK + LC/LM</td>
					<td>2 Full Sets</td>
					<td>₱1,800/set</td>
					<td><span class="status warn">Low</span></td>
				</tr>
				<tr>
					<td><strong>Inkjet Printable RFID Cards</strong></td>
					<td>Box of 230</td>
					<td>1 Box</td>
					<td>₱18/pc</td>
					<td><span class="status critical">Order Shopee</span></td>
				</tr>
				<tr>
					<td><strong>Lanyards (Cebu Source)</strong></td>
					<td>1-inch Sublimation</td>
					<td>Order per Project</td>
					<td>₱45/pc</td>
					<td><span class="status neutral">7-Day Lead Time</span></td>
				</tr>
			</tbody>
		</table>
	</section>

	<section id="suppliers">
		<h2>II. Supplier Directory (Tagbilaran/National)</h2>

		<div class="supplier-card">
			<h3>Supplier 1: The "Rush" Source (Manila)</h3>
			<p><strong>Use Case:</strong> Emergency shortage of PVC sheets.</p>
			<ul>
				<li><strong>Price:</strong> High (₱146/lanyard sample).</li>
				<li><strong>Speed:</strong> 2-3 Days via J&T/LBC.</li>
				<li><strong>Contact:</strong> Shopee/Lazada Preferred Seller.</li>
			</ul>
		</div>

		<div class="supplier-card preferred">
			<h3>Supplier 2: The "Volume" Source (Cebu/Tagbilaran)</h3>
			<p><strong>Use Case:</strong> Main Lanyard Supplier.</p>
			<ul>
				<li><strong>Price:</strong> Mid-Range (₱36 - ₱43).</li>
				<li><strong>Strategy:</strong> Order 1 week in advance. Consistent quality.</li>
				<li><strong>Contact:</strong> [Insert Local Contact Number]</li>
			</ul>
		</div>

		<div class="supplier-card">
			<h3>Supplier 3: The "Print Shop" (Tagbilaran)</h3>
			<p><strong>Use Case:</strong> Temporary Outsourcing / Golden Samples.</p>
			<ul>
				<li><strong>Price:</strong> Negotiated Reseller Rate (Aim for ₱40-50).</li>
				<li><strong>Role:</strong> Production partner until own printer is acquired.</li>
			</ul>
		</div>
	</section>

	<section id="maintenance">
		<h2>III. Equipment Maintenance Log</h2>
		<div class="alert-box">
			<strong>Preventative Rule:</strong> A dirty printer head costs ₱8,000 to replace. Clean it weekly.
		</div>

		<ul class="checklist">
			<li><strong>Daily:</strong> Nozzle Check (Epson L8050) before first print.</li>
			<li><strong>Weekly:</strong> Wipe laminator rollers with alcohol (remove glue residue).</li>
			<li><strong>Monthly:</strong> Tighten Die Cutter blade bolts.</li>
			<li><strong>Quarterly:</strong> Reset Waste Ink Pad Counter.</li>
		</ul>
	</section>

	<footer class="docs-footer">
		<p>Kanaya Inventory Control • Internal Use Only</p>
	</footer>
</div>

<style>
	.docs-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', sans-serif;
		color: #333;
	}
	.docs-header {
		border-bottom: 3px solid #2b6cb0;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
	}
	.docs-header h1 {
		color: #2c5282;
		margin: 0;
	}
	.meta {
		color: #718096;
		font-size: 0.9rem;
	}

	.toc {
		background: #ebf8ff;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 3rem;
	}
	.toc h2 {
		margin: 0 0 1rem;
		font-size: 1.2rem;
		color: #2b6cb0;
	}
	.toc ol {
		margin: 0;
		padding-left: 1.5rem;
	}
	.toc a {
		text-decoration: none;
		color: #2b6cb0;
		font-weight: bold;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 2rem;
	}
	th,
	td {
		padding: 12px;
		border: 1px solid #e2e8f0;
		text-align: left;
	}
	th {
		background: #2c5282;
		color: white;
	}

	.status {
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.85rem;
		font-weight: bold;
	}
	.status.good {
		background: #c6f6d5;
		color: #22543d;
	}
	.status.warn {
		background: #fefcbf;
		color: #744210;
	}
	.status.critical {
		background: #fed7d7;
		color: #742a2a;
	}
	.status.neutral {
		background: #edf2f7;
		color: #4a5568;
	}

	.supplier-card {
		background: white;
		border: 1px solid #e2e8f0;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1rem;
	}
	.supplier-card.preferred {
		border-left: 5px solid #48bb78;
		background: #f0fff4;
	}
	.supplier-card h3 {
		margin-top: 0;
		color: #2d3748;
	}

	.checklist {
		background: #f7fafc;
		padding: 2rem;
		border-radius: 8px;
	}
	.checklist li {
		margin-bottom: 0.8rem;
	}

	.alert-box {
		background: #fffaf0;
		border-left: 4px solid #ed8936;
		padding: 1rem;
		margin-bottom: 1rem;
		color: #9c4221;
	}

	.docs-footer {
		margin-top: 4rem;
		text-align: center;
		color: #a0aec0;
		border-top: 1px solid #eee;
		padding-top: 2rem;
	}
</style>
