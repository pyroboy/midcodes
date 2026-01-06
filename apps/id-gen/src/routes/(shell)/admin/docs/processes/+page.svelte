<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	// Calculator State
	let totalStudents = $state(100);
	let productionType = $state<'low-end' | 'high-end'>('low-end');

	// Constants (Seconds)
	const TIME_ENROLLMENT = 30; // per student
	const TIME_ENCODING = 15; // per card (optimised tap)
	const TIME_QC = 15; // per card

	// Low-end (A4 Sandwich)
	const TIME_PRINT_LOW = 75; // 150s per 2-card tray
	const TIME_LAMINATE_LOW = 30;
	const TIME_CUTTING_LOW = 20;
	const TIME_ASSEMBLY_LOW = 15;

	// High-end (Direct PVC)
	const TIME_PRINT_HIGH = 45; // Direct to card

	// Calculated Values
	let enrollmentTotal = $derived(totalStudents * TIME_ENROLLMENT);
	let encodingTotal = $derived(totalStudents * TIME_ENCODING);
	let qcTotal = $derived(totalStudents * TIME_QC);

	let physicalProdTotal = $derived(
		productionType === 'low-end'
			? totalStudents * (TIME_PRINT_LOW + TIME_LAMINATE_LOW + TIME_CUTTING_LOW + TIME_ASSEMBLY_LOW)
			: totalStudents * TIME_PRINT_HIGH
	);

	let totalTimeSeconds = $derived(enrollmentTotal + encodingTotal + qcTotal + physicalProdTotal);

	function formatTime(seconds: number) {
		const h = Math.floor(seconds / 3600);
		const m = Math.floor((seconds % 3600) / 60);
		if (h > 0) return `${h}h ${m}m`;
		return `${m}m`;
	}
</script>

<svelte:head>
	<title>PRODUCTION SYSTEM | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<div class="header-main">
			<h1>PRODUCTION SYSTEM</h1>
			<p class="meta">Operations Manual • Revision: Jan 2026</p>
		</div>
		<div class="moat-badge">The Accuracy Moat</div>
	</header>

	<section class="summary">
		<p>
			Kanaya is built to solve the <strong>Encoding Bottleneck</strong>. While physical printing still takes time, our software converts 8 hours of manual data entry into 8 minutes of automated accuracy.
		</p>
	</section>

	<!-- Section 1: Interactive Calculator -->
	<section class="calculator-section">
		<div class="card-title">
			<span class="icon">⏱️</span>
			<h2>Production Time Estimator</h2>
		</div>
		
		<div class="calc-grid">
			<div class="inputs">
				<label>
					<span>Total Students / IDs:</span>
					<input type="number" bind:value={totalStudents} min="1" step="1" />
				</label>

				<label>
					<span>Card Quality / Process:</span>
					<select bind:value={productionType}>
						<option value="low-end">Low-End (A4 Sandwich + Lamination)</option>
						<option value="high-end">High-End (Direct PVC Printing)</option>
					</select>
				</label>
				
				<div class="process-specs">
					{#if productionType === 'low-end'}
						<p class="small"><strong>Spec:</strong> 3-Layer (Overlay/Core/Overlay), 135°C Lamination, Manual Die-Cut.</p>
					{:else}
						<p class="small"><strong>Spec:</strong> Direct-to-Card Thermal Transfer, No lamination/cutting required.</p>
					{/if}
				</div>
			</div>

			<div class="results">
				<div class="result-row">
					<span>Digital Enrollment:</span>
					<strong>{formatTime(enrollmentTotal)}</strong>
				</div>
				<div class="result-row">
					<span>Physical Production:</span>
					<strong>{formatTime(physicalProdTotal)}</strong>
				</div>
				<div class="result-row">
					<span>NFC Encoding + QC:</span>
					<strong>{formatTime(encodingTotal + qcTotal)}</strong>
				</div>
				<div class="total-row">
					<span>ESTIMATED TOTAL:</span>
					<span class="time-big">{formatTime(totalTimeSeconds)}</span>
				</div>
			</div>
		</div>
	</section>

	<!-- Section 2: Throughput Matrix (Benchmarked) -->
	<section>
		<div class="card-title">
			<span class="icon">📊</span>
			<h2>Throughput Matrix (Benchmarked)</h2>
		</div>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Batch Size</th>
						<th>Process</th>
						<th>Data Input</th>
						<th>Production</th>
						<th>Encoding</th>
						<th>Total</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>1 ID</td>
						<td>Low-End</td>
						<td>30s</td>
						<td>3m</td>
						<td>30s</td>
						<td><strong>4m</strong></td>
					</tr>
					<tr class="highlight">
						<td>1 ID</td>
						<td>High-End</td>
						<td>30s</td>
						<td>45s</td>
						<td>30s</td>
						<td><strong>~2m</strong></td>
					</tr>
					<tr>
						<td>100 IDs</td>
						<td>Low-End</td>
						<td>50m</td>
						<td>2.5h</td>
						<td>50m</td>
						<td><strong>~4.5 Hours</strong></td>
					</tr>
					<tr class="highlight">
						<td>100 IDs</td>
						<td>High-End</td>
						<td>50m</td>
						<td>1.2h</td>
						<td>50m</td>
						<td><strong>~3 Hours</strong></td>
					</tr>
					<tr>
						<td>500 IDs</td>
						<td>Low-End</td>
						<td>4.2h</td>
						<td>12h*</td>
						<td>4.2h</td>
						<td><strong>~20 Hours</strong></td>
					</tr>
				</tbody>
			</table>
		</div>
		<p class="footnote">*Includes mandatory cooling breaks for Epson L8050 tray cycles.</p>
	</section>

	<section>
		<h2>Production Workflow & Timeline</h2>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Step</th>
						<th>Phase</th>
						<th>Duration</th>
						<th>Input (Action)</th>
						<th>Output (Result)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td>1</td>
						<td><strong>Enrollment</strong></td>
						<td>30s/student</td>
						<td>Mobile App Entry + Photo</td>
						<td>AI-Enhanced Profile (Postgres)</td>
					</tr>
					<tr>
						<td>2</td>
						<td><strong>Preview</strong></td>
						<td>15s/student</td>
						<td>Tap "Preview ID"</td>
						<td>WYSIWYG Canvas Render</td>
					</tr>
					<tr>
						<td>3</td>
						<td><strong>Batching</strong></td>
						<td>1m/batch</td>
						<td>Tap "Generate Print File"</td>
						<td>300 DPI Print PDF (to R2)</td>
					</tr>
					<tr>
						<td>4</td>
						<td><strong>Production</strong></td>
						<td>2.5h (per 100)</td>
						<td>Epson L8050 + Lamination</td>
						<td>Waterproof physical ID cards</td>
					</tr>
					<tr>
						<td>5</td>
						<td><strong>Encoding</strong></td>
						<td>30s/student</td>
						<td>Phone NFC Tap</td>
						<td>Signed & Locked NFC Token</td>
					</tr>
					<tr>
						<td>6</td>
						<td><strong>Replacement</strong></td>
						<td>2h</td>
						<td>Reprint via Insurance Plan</td>
						<td>New Card (Priority Queue)</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<div class="comparison-grid">
		<div class="comp-box competitor">
			<h3>Traditional Print Shop</h3>
			<ul>
				<li><strong>Encoding:</strong> 5-7 Days (Manual)</li>
				<li><strong>Printing:</strong> 3 Days</li>
				<li><strong>Errors:</strong> 15% (Typos/Blur)</li>
				<li class="result"><strong>Total: 10-14 Days</strong></li>
			</ul>
		</div>
		<div class="comp-box kanaya">
			<h3>Kanaya System</h3>
			<ul>
				<li><strong>Encoding:</strong> 8 Minutes (Automated)</li>
				<li><strong>Printing:</strong> 2-3 Hours</li>
				<li><strong>Errors:</strong> 0% (Software-Locked)</li>
				<li class="result"><strong>Total: 2 Hours</strong></li>
			</ul>
		</div>
	</div>

	<section>
		<h2>Deep-Dive: Input vs. Output Logic</h2>
		<div class="process-card">
			<div class="process-header">
				<span class="step-num">Step 1-3</span>
				<h3>Digital Intake (The Data Engine)</h3>
			</div>
			<div class="io-grid">
				<div class="io-column">
					<h4>INPUT</h4>
					<ul>
						<li>Student fields (ID, Name, Role)</li>
						<li>Raw mobile camera captures</li>
						<li>Batch selection</li>
					</ul>
				</div>
				<div class="io-column">
					<h4>OUTPUT</h4>
					<ul>
						<li><code>profiles</code> table entry</li>
						<li>AI background-removed assets</li>
						<li>Automated 3mm-bleed PDF layout</li>
					</ul>
				</div>
			</div>
		</div>

		<div class="process-card">
			<div class="process-header">
				<span class="step-num">Step 4-5</span>
				<h3>Physical Fusion & Security</h3>
			</div>
			<div class="io-grid">
				<div class="io-column">
					<h4>INPUT</h4>
					<ul>
						<li>Inkjet PVC Overlay (A4)</li>
						<li>Heat-activated lamination</li>
						<li>Phone NFC Antenna distance</li>
					</ul>
				</div>
				<div class="io-column">
					<h4>OUTPUT</h4>
					<ul>
						<li>Ink fused <em>inside</em> the card layer</li>
						<li>Read-only Manufacturer UID log</li>
						<li>Sector 2 HMAC/Private Key lock</li>
					</ul>
				</div>
			</div>
		</div>
	</section>

	<div class="protocol-grid">
		<section class="protocol-box">
			<h3><span class="icon">🔑</span> NFC / RFID Security Protocol</h3>
			<p>Every Kanaya ID utilizes a multi-sector security lock to prevent data spoofing.</p>
			<div class="code-block">
				<ul>
					<li><strong>Sector 0:</strong> Manufacturer UID (Read-only)</li>
					<li><strong>Sector 1:</strong> <code>kanaya_uuid</code> (Encrypted)</li>
					<li><strong>Sector 2:</strong> HMAC Signature (Private Key)</li>
				</ul>
			</div>
			<div class="step-guide">
				<ol>
					<li>Verify visual ID match on screen.</li>
					<li>Tap card to Phone Top (NFC Sweet Spot).</li>
					<li>Mobile SDK writes Sectors 1-2.</li>
					<li>Permanent Lock-Bit applied.</li>
				</ol>
			</div>
		</section>

		<section class="protocol-box">
			<h3><span class="icon">🏗️</span> Low-End Assembly Specs (A4)</h3>
			<p>Maximum durability for budget deployments.</p>
			<div class="step-guide">
				<ul>
					<li><strong>Mirror Print:</strong> Reverse image on rough side.</li>
					<li><strong>Sandwich:</strong> Overlay &gt; Core &gt; Overlay.</li>
					<li><strong>Thermal Fix:</strong> 135°C @ 350mm/min.</li>
					<li><strong>Curing:</strong> 30-min weight flat-press.</li>
					<li><strong>Die-Cut:</strong> Manual alignment with 3mm bleed.</li>
				</ul>
			</div>
			<p class="tag">Industry Benchmark: ₱28.50 COGS</p>
		</section>
	</div>

	<footer class="docs-footer">
		<p>© 2026 Kanaya Identity Solutions • Authorized Access Only</p>
		<p><a href="/admin/docs">← Back to Index</a></p>
	</footer>
</div>

<style>
	:global(body) { background: #f0f2f5; }

	.docs-container {
		max-width: 1000px;
		margin: 2rem auto;
		padding: 2.5rem;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
		font-family: 'Inter', system-ui, sans-serif;
	}

	.docs-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 2px solid #edf2f7;
		padding-bottom: 2rem;
		margin-bottom: 3rem;
	}

	h1 { font-size: 2rem; font-weight: 800; color: #1a202c; margin: 0; }
	.meta { color: #718096; font-size: 0.85rem; margin-top: 0.5rem; text-transform: uppercase; letter-spacing: 0.05em; }

	.moat-badge {
		background: #ebf8ff;
		color: #2b6cb0;
		padding: 0.4rem 1rem;
		border-radius: 20px;
		font-weight: 700;
		font-size: 0.8rem;
		border: 1px solid #bee3f8;
	}

	.summary {
		background: #f8fafc;
		padding: 1.5rem;
		border-radius: 12px;
		border-left: 4px solid #3182ce;
		margin-bottom: 2.5rem;
	}

	h2 { font-size: 1.5rem; font-weight: 700; margin: 2.5rem 0 1.5rem; color: #2d3748; }

	.calculator-section {
		background: #f8fafc;
		border: 1px solid #e2e8f0;
		padding: 2rem;
		border-radius: 16px;
		margin-bottom: 3rem;
	}

	.calc-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 3rem;
	}

	.inputs { flex: 1; display: flex; flex-direction: column; gap: 1.5rem; }
	.inputs label { display: flex; flex-direction: column; gap: 0.5rem; font-size: 0.9rem; color: #4a5568; font-weight: 600; }
	.inputs input, .inputs select {
		padding: 0.75rem;
		border-radius: 8px;
		border: 1px solid #cbd5e0;
		font-size: 1rem;
		font-weight: 700;
	}

	.small { font-size: 0.8rem; color: #718096; font-weight: 400; font-style: italic; }

	.results {
		background: white;
		padding: 1.5rem;
		border-radius: 12px;
		border: 1px solid #e2e8f0;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.result-row { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #edf2f7; font-size: 0.95rem; }
	.total-row {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding-top: 1rem;
		margin-top: 1rem;
	}
	.total-row span:first-child { font-size: 0.75rem; color: #a0aec0; font-weight: 800; }
	.time-big { font-size: 2.5rem; font-weight: 900; color: #3182ce; line-height: 1; }

	.table-wrapper { overflow-x: auto; border: 1px solid #e2e8f0; border-radius: 10px; }
	table { width: 100%; border-collapse: collapse; text-align: left; }
	th, td { padding: 1rem; border-bottom: 1px solid #edf2f7; font-size: 0.9rem; }
	th { background: #f7fafc; color: #4a5568; font-weight: 700; }
	tr.highlight { background: #fffaf0; }

	.comparison-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
		margin: 3rem 0;
	}

	.comp-box { padding: 1.5rem; border-radius: 16px; border: 1px solid #e2e8f0; }
	.comp-box h3 { margin-top: 0; font-size: 1rem; margin-bottom: 1rem; }
	.comp-box ul { list-style: none; padding: 0; margin: 0; }
	.comp-box li { display: flex; justify-content: space-between; padding: 0.5rem 0; border-bottom: 1px solid #edf2f7; font-size: 0.9rem; }
	.comp-box .result { border-bottom: none; margin-top: 1rem; font-weight: 800; font-size: 1rem; }

	.competitor { background: #fff5f5; border-color: #feb2b2; }
	.kanaya { background: #f0fff4; border-color: #9ae6b4; }

	.process-card {
		background: #ffffff;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		margin-bottom: 1.5rem;
		overflow: hidden;
	}

	.process-header {
		background: #f8fafc;
		padding: 1rem 1.5rem;
		display: flex;
		align-items: center;
		gap: 1rem;
		border-bottom: 1px solid #e2e8f0;
	}

	.step-num {
		background: #2d3748;
		color: white;
		padding: 0.25rem 0.75rem;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 700;
	}

	.io-grid { display: grid; grid-template-columns: 1fr 1fr; }
	.io-column { padding: 1.5rem; }
	.io-column:first-child { border-right: 1px solid #edf2f7; }
	.io-column h4 { font-size: 0.7rem; text-transform: uppercase; color: #a0aec0; margin-top: 0; }
	.io-column ul { padding-left: 1.25rem; margin: 0; font-size: 0.9rem; }

	.protocol-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-top: 3rem;
	}

	.protocol-box { background: white; border: 1px solid #e2e8f0; padding: 1.5rem; border-radius: 12px; }
	.code-block { background: #1a202c; color: #a0aec0; padding: 1rem; border-radius: 8px; font-family: monospace; font-size: 0.85rem; margin-bottom: 1rem; }
	.code-block ul { list-style: none; padding: 0; margin: 0; }
	.step-guide { font-size: 0.85rem; color: #4a5568; }

	.tag { display: inline-block; background: #f0fff4; color: #2f855a; font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.5rem; border-radius: 4px; border: 1px solid #c6f6d5; margin-top: 1rem; }

	.docs-footer { margin-top: 5rem; text-align: center; font-size: 0.8rem; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 2rem; }
	.docs-footer a { color: #718096; text-decoration: none; }

	.footnote { font-size: 0.85rem; color: #718096; margin-top: 1rem; font-style: italic; }

	@media (max-width: 768px) {
		.calc-grid, .io-grid, .protocol-grid { grid-template-columns: 1fr; }
		.io-column:first-child { border-right: none; border-bottom: 1px solid #edf2f7; }
	}
</style>