<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Legal & Contracts | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Legal Framework & Contract Templates</h1>
		<p class="meta">Department: Legal / Compliance • Updated: January 2026</p>
		<p class="subject">Subject: Service Agreements, Anti-Fraud Waivers, and Data Privacy</p>
	</header>

	<nav class="toc">
		<h2>Document Repository</h2>
		<ol>
			<li><a href="#tos">Standard Terms of Service (TOS)</a></li>
			<li><a href="#fraud">Anti-Fraud &amp; Authority Waiver</a></li>
			<li><a href="#privacy">Data Privacy Agreement</a></li>
			<li><a href="#approval">Design Approval Form</a></li>
		</ol>
	</nav>

	<section id="tos">
		<h2>I. Standard Terms of Service (TOS)</h2>
		<p class="subtext">Copy this text onto the back of your Invoices or Quotations.</p>

		<div class="contract-paper">
			<h3>SERVICE AGREEMENT TERMS</h3>

			<h4>1. Payment Policy</h4>
			<p><strong>Strictly 50% Downpayment</strong> is required before any layout or production work begins. The remaining 50% balance must be paid in full upon delivery or pick-up. We do not release items with unpaid balances.</p>

			<h4>2. Layout &amp; Design</h4>
			<p>Basic layout is provided free of charge for orders meeting the Minimum Order Quantity (MOQ). Clients are entitled to <strong>three (3) minor revisions</strong>. Further revisions will incur a layout fee of ₱100.00 per iteration.</p>

			<h4>3. Color Disclaimer</h4>
			<p>Client acknowledges that color variations may occur between the screen view (RGB) and the final printed output (CMYK/Laminated). Such variations are normal in PVC production and are not grounds for rejection/refund.</p>

			<h4>4. Lead Time</h4>
			<p>Production lead time commences only after the <strong>final approval of the design</strong> and receipt of the downpayment. Rush orders are subject to a 30% surcharge.</p>
		</div>
	</section>

	<section id="fraud">
		<h2>II. Anti-Fraud &amp; Authority Waiver</h2>
		<div class="alert-box critical">
			<strong>USAGE:</strong> Must be signed by any client requesting Government, School, or Corporate IDs if they do not have an official Purchase Order.
		</div>

		<div class="contract-paper">
			<h3>CERTIFICATION OF AUTHORITY TO PRINT</h3>

			<p>I, the undersigned, hereby certify that:</p>
			<ol>
				<li>I am the authorized representative of <strong>[Company/School Name]</strong>.</li>
				<li>I have the legal authority to request the reproduction of these identification cards.</li>
				<li>The data and images provided are accurate and belong to real individuals.</li>
				<li>I understand that <strong>Kanaya ID Production</strong> maintains a "Zero Tolerance" policy regarding fake IDs.</li>
			</ol>

			<p>I strictly indemnify and hold Kanaya ID Production harmless from any legal liability, penalties, or criminal charges arising from the misuse, falsification, or unauthorized production of these documents.</p>

			<div class="signature-block">
				<div>__________________________<br />Printed Name &amp; Signature</div>
				<div>__________________________<br />Date</div>
			</div>
			<div class="signature-block">
				<div>__________________________<br />Valid ID Presented (Type/No.)</div>
			</div>
		</div>
	</section>

	<section id="privacy">
		<h2>III. Data Privacy Statement</h2>
		<p class="subtext">To reassure clients (especially schools) about their data security.</p>

		<div class="contract-paper">
			<h3>DATA PRIVACY &amp; DELETION AGREEMENT</h3>

			<p><strong>1. Data Ownership:</strong> All personal data (names, photos, ID numbers) provided for printing remains the sole property of the Client.</p>

			<p><strong>2. Usage:</strong> Kanaya uses this data solely for the purpose of printing the ordered ID cards and encoding the relevant RFID/QR chips.</p>

			<p><strong>3. Retention &amp; Disposal:</strong></p>
			<ul>
				<li><strong>Digital Copy:</strong> Data is stored in our secure local server for 30 days to allow for reprints/corrections.</li>
				<li><strong>Deletion:</strong> After 30 days, or upon immediate request by the Client, all personal data is permanently wiped from our systems.</li>
				<li><strong>Physical Waste:</strong> Any misprinted cards (rejects) are shredded physically before disposal to prevent identity theft.</li>
			</ul>
		</div>
	</section>

	<section id="approval">
		<h2>IV. Design Approval Form (Job Order)</h2>
		<p class="subtext">Use this to prevent "It's the wrong spelling!" complaints after printing.</p>

		<div class="contract-paper">
			<h3>FINAL MOCKUP APPROVAL</h3>

			<p><strong>Job Order #:</strong> _________ &nbsp;&nbsp; <strong>Client:</strong> ____________________</p>

			<p>By signing below, I confirm that I have checked the following in the attached mockup:</p>
			<ul class="checklist">
				<li>[ ] Spelling of Names and Titles</li>
				<li>[ ] ID Numbers and Barcodes</li>
				<li>[ ] Logo Placement and Quality</li>
				<li>[ ] Brand Colors</li>
			</ul>

			<p class="warning">
				<strong>WARNING:</strong> Any errors found <em>after</em> this document is signed will be corrected at the client's expense (Reprint Fee).
			</p>

			<div class="signature-block">
				<div>__________________________<br />Client Signature</div>
				<div>__________________________<br />Date Approved</div>
			</div>
		</div>
	</section>

	<footer class="docs-footer">
		<p>Kanaya Internal Admin Docs • Legal Department</p>
		<p><a href="/admin/docs">← Back to Documentation Index</a></p>
	</footer>
</div>

<style>
	.docs-container {
		max-width: 850px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', system-ui, sans-serif;
		color: #333;
		line-height: 1.6;
	}

	.docs-header {
		border-bottom: 3px solid #4a5568;
		padding-bottom: 1.5rem;
		margin-bottom: 2rem;
	}
	.docs-header h1 {
		color: #2d3748;
		margin: 0;
		font-size: 2rem;
	}
	.meta {
		color: #718096;
		font-size: 0.9rem;
		margin-top: 0.5rem;
	}

	.toc {
		background: #edf2f7;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 3rem;
	}
	.toc h2 {
		margin: 0 0 1rem;
		font-size: 1.2rem;
		color: #2d3748;
	}
	.toc a {
		text-decoration: none;
		color: #3182ce;
		font-weight: 500;
	}
	.toc a:hover {
		text-decoration: underline;
	}

	section {
		margin-bottom: 4rem;
	}
	h2 {
		font-size: 1.5rem;
		border-left: 5px solid #4a5568;
		padding-left: 1rem;
		margin-bottom: 1rem;
		color: #1a202c;
	}
	.subtext {
		font-style: italic;
		color: #718096;
		margin-bottom: 1.5rem;
	}

	/* Contract Paper Effect */
	.contract-paper {
		background: #fff;
		border: 1px solid #cbd5e0;
		padding: 2.5rem;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
		font-family: 'Times New Roman', serif; /* Serif for legal look */
	}
	.contract-paper h3 {
		text-align: center;
		text-transform: uppercase;
		border-bottom: 2px solid #000;
		padding-bottom: 10px;
		margin-bottom: 20px;
		font-size: 1.2rem;
	}
	.contract-paper h4 {
		margin-bottom: 0.5rem;
		font-size: 1.1rem;
	}
	.contract-paper p,
	.contract-paper li {
		font-size: 1.05rem;
		line-height: 1.7;
	}

	/* Signature Block */
	.signature-block {
		display: flex;
		justify-content: space-between;
		margin-top: 3rem;
		padding-top: 1rem;
	}

	/* Checklist */
	.checklist {
		list-style: none;
		padding: 0;
	}
	.checklist li {
		margin-bottom: 0.5rem;
		font-family: monospace;
		font-size: 1.1rem;
	}

	/* Alerts */
	.alert-box.critical {
		background-color: #fff5f5;
		border: 1px solid #fc8181;
		color: #c53030;
		padding: 1rem;
		margin-bottom: 1.5rem;
		border-radius: 4px;
	}

	.warning {
		margin-top: 1.5rem;
		color: #c53030;
		font-weight: bold;
		border: 1px solid #c53030;
		padding: 0.5rem;
		text-align: center;
	}

	.docs-footer {
		margin-top: 4rem;
		text-align: center;
		font-size: 0.9rem;
		color: #a0aec0;
		border-top: 1px solid #e2e8f0;
		padding-top: 2rem;
	}
	.docs-footer a {
		color: #4a5568;
		text-decoration: none;
	}
</style>
