<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Operations & Technical Manual | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Operations Manual & Technical SOP</h1>
		<p class="meta">Department: Production / Technical • Updated: January 2026</p>
		<p class="subject">Subject: Printing, Lamination, RFID Encoding, and Troubleshooting</p>
	</header>

	<nav class="toc">
		<h2>Production Workflow</h2>
		<ol>
			<li><a href="#printing">Phase 1: Printing Standards</a></li>
			<li><a href="#lamination">Phase 2: Lamination & Cutting</a></li>
			<li><a href="#encoding">Phase 3: RFID/NFC Encoding</a></li>
			<li><a href="#troubleshooting">Troubleshooting Guide</a></li>
		</ol>
	</nav>

	<section id="printing">
		<h2>I. Printing Standards (PVC Sandwich Process)</h2>
		<div class="alert-box warning">
			<strong>CRITICAL RULE:</strong> Always print in <strong>MIRROR IMAGE</strong> (Reverse).
		</div>

		<p>We use the 3-Layer Sandwich Method (Overlay + PVC Core + Overlay).</p>

		<h3>1.1 Printer Settings (Epson L-Series / Canon)</h3>
		<table class="tech-table">
			<thead>
				<tr>
					<th>Setting</th>
					<th>Value</th>
					<th>Reason</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Paper Type</strong></td>
					<td>Premium Glossy / Photo Paper</td>
					<td>Ensures heavy ink laydown for vibrancy.</td>
				</tr>
				<tr>
					<td><strong>Quality</strong></td>
					<td>High / Best Photo</td>
					<td>Prevents banding lines.</td>
				</tr>
				<tr>
					<td><strong>Mirror</strong></td>
					<td><strong>ON (Checked)</strong></td>
					<td>The print face is laminated <em>against</em> the core.</td>
				</tr>
				<tr>
					<td><strong>Color Profile</strong></td>
					<td>Adobe RGB (1998)</td>
					<td>Wider color gamut for logos.</td>
				</tr>
			</tbody>
		</table>

		<h3>1.2 Material Handling</h3>
		<ul>
			<li><strong>Print Side:</strong> Print on the <em>rough/sticky</em> side of the printable sheet. Do not print on the glossy peeling film.</li>
			<li><strong>Drying Time:</strong> Allow ink to dry for at least <strong>5-10 minutes</strong> before laminating to prevent "bleeding" or smudging.</li>
		</ul>
	</section>

	<section id="lamination">
		<h2>II. Lamination & Die Cutting</h2>

		<h3>2.1 Temperature Guide</h3>
		<p>Wrong temperature is the #1 cause of card failure.</p>
		<table class="tech-table">
			<thead>
				<tr>
					<th>Machine Type</th>
					<th>Temperature Range</th>
					<th>Symptoms</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Standard Laminator</strong></td>
					<td>130°C - 145°C</td>
					<td>Ideal bonding range.</td>
				</tr>
				<tr>
					<td><em>Too Cold</em></td>
					<td>Below 120°C</td>
					<td>Cards peel apart (delamination).</td>
				</tr>
				<tr>
					<td><em>Too Hot</em></td>
					<td>Above 160°C</td>
					<td>Cards curve/warp; bubbles appear.</td>
				</tr>
			</tbody>
		</table>

		<h3>2.2 The Sandwich Stack</h3>
		<ol class="step-list">
			<li><strong>Bottom:</strong> Printable Sheet A (Ink facing UP).</li>
			<li><strong>Middle:</strong> PVC Core (White hard plastic / RFID Inlay).</li>
			<li><strong>Top:</strong> Printable Sheet B (Ink facing DOWN).</li>
		</ol>
		<p><em>Feed into laminator strictly straight to avoid jamming.</em></p>
	</section>

	<section id="encoding">
		<h2>III. RFID / NFC Encoding Protocol</h2>
		<p class="subtext">Using the Kanaya Mobile Admin App.</p>

		<div class="step-card">
			<h4>Step 1: Verification</h4>
			<p>Before encoding, physically inspect the printed card against the data on the screen. <strong>Do not encode if the name is misspelled.</strong></p>
		</div>

		<div class="step-card">
			<h4>Step 2: The Write Process</h4>
			<ol>
				<li>Open Kanaya App &gt; Admin Mode &gt; <strong>"Write Card"</strong>.</li>
				<li>Select the User Profile from the database.</li>
				<li>Place the printed card against the phone's NFC antenna (usually top-back).</li>
				<li>Wait for the <strong>"Success - Locked"</strong> beep.</li>
			</ol>
			<p><em>Note: We lock the card to prevent users from rewriting their own data.</em></p>
		</div>

		<div class="step-card">
			<h4>Step 3: Quality Check (QC)</h4>
			<p>Scan the newly written card with a <em>different</em> device to ensure the UID is readable and links to the correct profile.</p>
		</div>
	</section>

	<section id="troubleshooting">
		<h2>IV. Troubleshooting Guide</h2>

		<h3>Common Defects & Solutions</h3>
		<table class="tech-table">
			<thead>
				<tr>
					<th>Issue</th>
					<th>Probable Cause</th>
					<th>Solution</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td><strong>Colors look washed out</strong></td>
					<td>Wrong print side or low quality setting.</td>
					<td>Check if printed on the "sticky" side. Set printer to "High Quality".</td>
				</tr>
				<tr>
					<td><strong>Card is peeling (Delamination)</strong></td>
					<td>Laminator too cold.</td>
					<td>Increase temp by 10°C and pass through twice.</td>
				</tr>
				<tr>
					<td><strong>Bubbles on surface</strong></td>
					<td>Laminator too hot or moisture.</td>
					<td>Lower temp. Ensure ink is 100% dry before laminating.</td>
				</tr>
				<tr>
					<td><strong>Curved / Warped Cards</strong></td>
					<td>High tension or overheating.</td>
					<td>Place heavy books on the sheet immediately after lamination while it cools.</td>
				</tr>
				<tr>
					<td><strong>RFID Chip not reading</strong></td>
					<td>Chip killed by heat or pressure.</td>
					<td>Do not laminate above 150°C for RFID inlays. Test chip <em>before</em> printing.</td>
				</tr>
			</tbody>
		</table>
	</section>

	<footer class="docs-footer">
		<p>Kanaya Internal Production Specs • Do Not Distribute</p>
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
		border-bottom: 3px solid #d69e2e; /* Industrial Yellow/Orange */
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
		background: #fffaf0;
		padding: 1.5rem;
		border-radius: 8px;
		border: 1px solid #fbd38d;
		margin-bottom: 3rem;
	}
	.toc h2 {
		margin: 0 0 1rem;
		font-size: 1.2rem;
		color: #744210;
	}
	.toc ol {
		margin: 0;
		padding-left: 1.5rem;
	}
	.toc a {
		text-decoration: none;
		color: #975a16;
		font-weight: 600;
	}
	.toc a:hover {
		text-decoration: underline;
	}

	section {
		margin-bottom: 4rem;
	}
	h2 {
		font-size: 1.5rem;
		border-left: 5px solid #d69e2e;
		padding-left: 1rem;
		margin-bottom: 1.5rem;
		color: #1a202c;
	}

	h3 {
		font-size: 1.2rem;
		color: #4a5568;
		margin-top: 2rem;
		margin-bottom: 1rem;
	}

	/* Tables */
	.tech-table {
		width: 100%;
		border-collapse: collapse;
		margin-bottom: 2rem;
		background: white;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}
	.tech-table th,
	.tech-table td {
		padding: 12px 15px;
		border: 1px solid #e2e8f0;
		text-align: left;
	}
	.tech-table th {
		background-color: #edf2f7;
		font-weight: 600;
		color: #2d3748;
	}
	.tech-table tr:nth-child(even) {
		background-color: #f7fafc;
	}

	/* Alerts */
	.alert-box {
		padding: 1rem;
		border-radius: 4px;
		margin-bottom: 1.5rem;
	}
	.alert-box.warning {
		background-color: #feebc8;
		border-left: 4px solid #dd6b20;
		color: #c05621;
	}

	/* Step Lists */
	.step-list {
		background: #f7fafc;
		padding: 1.5rem 1.5rem 1.5rem 3rem;
		border-radius: 8px;
	}
	.step-list li {
		margin-bottom: 0.5rem;
		font-weight: 500;
	}

	/* Step Cards */
	.step-card {
		background: white;
		border: 1px solid #e2e8f0;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 1.5rem;
	}
	.step-card h4 {
		margin-top: 0;
		color: #3182ce;
		text-transform: uppercase;
		font-size: 0.9rem;
		letter-spacing: 0.05em;
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
