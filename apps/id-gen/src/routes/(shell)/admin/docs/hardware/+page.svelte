<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Hardware & Terminals | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Hardware Architecture & Terminals</h1>
		<p class="meta">Terminal Deployment • Biometrics • Scanning Infrastructure</p>
		<div class="status-chip highlight">Deployment Blueprint</div>
	</header>

	<section class="blueprint">
		<h2>1. Recommended Hardware Architecture</h2>
		<div class="ascii-art">
			<pre>
┌─────────────────────────────────────────┐
│   Android/Windows Tablet (Terminal)     │
│  ┌──────────────┐  ┌─────────────────┐ │
│  │  USB-C Hub   │──│ USB QR Scanner  │ │
│  │  (Power+Data)│  │ (Wired/Wireless)│ │
│  └──────────────┘  └─────────────────┘ │
│         │                      │
│         │  ┌──────────────────┐│
│         └──│Optional: USB Fingerprint││
│            │Reader (Biometric)       ││
│            └──────────────────┘│
│  ┌─────────────────────────────┐│
│  │ Built-in NFC (for backup)   ││
│  └─────────────────────────────┘│
└─────────────────────────────────────────┘
         ↓ WiFi/Ethernet
    Your Backend Server
			</pre>
		</div>
	</section>

	<section>
		<h2>2. Hardware Specifications & Costs (PHP)</h2>
		<h3>A. Tablet Terminals (CAPEX)</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Device</th>
						<th>Processor</th>
						<th>Battery</th>
						<th>Price (PHP)</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Samsung Active4 Pro</strong></td>
						<td>Octa-core</td>
						<td>7,600mAh</td>
						<td>₱38,163</td>
						<td>Rugged, IP68, S Pen, Knox</td>
					</tr>
					<tr>
						<td><strong>Samsung Galaxy Tab A9+</strong></td>
						<td>Octa-core</td>
						<td>7,040mAh</td>
						<td>₱12,877</td>
						<td>Good middle-ground</td>
					</tr>
					<tr>
						<td><strong>Lenovo Tab M9</strong></td>
						<td>Octa-core</td>
						<td>5,100mAh</td>
						<td>₱10,525</td>
						<td>Budget enterprise</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3>B. USB QR Readers & Biometrics</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Category</th>
						<th>Model</th>
						<th>Feature</th>
						<th>Price (PHP)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>QR Scanner</strong></td>
						<td>NETUM 2D Wired</td>
						<td>300 scans/sec</td>
						<td>₱2,058</td>
					</tr>
					<tr>
						<td><strong>Fingerprint (P2)</strong></td>
						<td>SecuGen Hamster Plus</td>
						<td>FBI-Certified</td>
						<td>₱4,410</td>
					</tr>
					<tr>
						<td><strong>Fingerprint (P3)</strong></td>
						<td>Futronic FS64</td>
						<td>4-Finger Slap</td>
						<td>₱44,100</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<section class="financials">
		<h2>3. Cost Analysis: CAPEX vs OPEX</h2>
		<div class="analysis-grid">
			<div class="analysis-card">
				<h3>One-Time CAPEX (Per Terminal)</h3>
				<ul class="cost-list">
					<li><strong>Budget:</strong> ₱16,405</li>
					<li><strong>Professional:</strong> ₱23,873</li>
					<li><strong>Premium:</strong> ₱53,451</li>
				</ul>
			</div>
			<div class="analysis-card">
				<h3>Monthly OPEX</h3>
				<ul class="cost-list">
					<li><strong>Connectivity:</strong> ₱118</li>
					<li><strong>Management:</strong> ₱176 - ₱294</li>
					<li><strong>Total/Month:</strong> ₱294 - ₱412</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="roadmap">
		<h2>4. Implementation Roadmap</h2>
		<div class="timeline">
			<div class="timeline-item">
				<span class="phase">Phase 1: MVP (2-3 wks)</span>
				<p>Order Samsung A9+ kit; develop basic tablet app for QR scanning.</p>
			</div>
			<div class="timeline-item">
				<span class="phase">Phase 2: Pilot (3-4 wks)</span>
				<p>Order SecuGen biometrics; integrate SDK; dual-mode QR/Fingerprint testing.</p>
			</div>
			<div class="timeline-item">
				<span class="phase">Phase 3: Scale (4-6 wks)</span>
				<p>Bulk acquisition; configure Hexnode MDM; train client IT staff.</p>
			</div>
		</div>
	</section>

	<section class="model">
		<h2>5. Financial Projections (B2B SaaS Model)</h2>
		<div class="rec-box highlight-box">
			<h3>Client Subscription Tiers</h3>
			<ul>
				<li><strong>Basic (QR + NFC):</strong> ₱1,470 / month</li>
				<li><strong>Premium (Biometric):</strong> ₱2,058 / month</li>
			</ul>
			<p><strong>Payback Period:</strong> ~20 months per terminal @ 75% gross margin.</p>
		</div>
	</section>

	<section class="recommendations">
		<h2>6. Final Recommendations</h2>
		<ul class="rec-list">
			<li><strong>Start with QR + NFC tablets</strong> to leverage existing ID infrastructure.</li>
			<li><strong>Target Schools/Enterprises</strong> already using Kanaya ID cards.</li>
			<li><strong>Pilot with 2-3 clients</strong> at no extra hardware cost to test sync reliability.</li>
		</ul>
	</section>

	<footer class="docs-footer">
		<p>© 2026 Kanaya Identity Solutions • Authorized Engineering Documentation</p>
		<p><a href="/admin/docs">← Back to Index</a></p>
	</footer>
</div>

<style>
	:global(body) { background: #fdfdfd; }

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

	.ascii-art {
		background: #1e293b;
		color: #94a3b8;
		padding: 1.5rem;
		border-radius: 8px;
		font-family: monospace;
		font-size: 0.85rem;
		overflow-x: auto;
		margin: 1.5rem 0;
	}

	h2 { font-size: 1.4rem; font-weight: 800; color: #1e293b; border-left: 4px solid #3b82f6; padding-left: 1rem; margin: 3.5rem 0 1.5rem; }
	h3 { font-size: 1.1rem; color: #475569; margin: 2rem 0 1rem; }

	.table-wrapper { margin: 1.5rem 0; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; }
	table { width: 100%; border-collapse: collapse; text-align: left; font-size: 0.9rem; }
	th { background: #f8fafc; padding: 1rem; font-weight: 700; border-bottom: 1px solid #e2e8f0; }
	td { padding: 1rem; border-bottom: 1px solid #f1f5f9; }

	.analysis-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
	.analysis-card { background: #f8fafc; padding: 1.5rem; border-radius: 8px; border: 1px solid #e2e8f0; }
	.cost-list { list-style: none; padding: 0; margin-top: 1rem; }
	.cost-list li { margin-bottom: 0.5rem; font-size: 0.95rem; }

	.timeline { position: relative; border-left: 2px solid #e2e8f0; padding-left: 2rem; margin-left: 0.5rem; }
	.timeline-item { margin-bottom: 2rem; position: relative; }
	.timeline-item::before { content: ""; position: absolute; left: -2.35rem; top: 0.25rem; width: 12px; height: 12px; background: #3b82f6; border: 2px solid #fff; border-radius: 50%; }
	.phase { font-weight: 800; color: #2563eb; display: block; margin-bottom: 0.25rem; }

	.highlight-box {
		background: #2d3748;
		color: #fff;
		padding: 2rem;
		border-radius: 12px;
	}
	.highlight-box h3 { color: #fbd38d; margin-top: 0; }
	.highlight-box ul { list-style: circle; padding-left: 1.5rem; }

	.docs-footer { margin-top: 5rem; text-align: center; font-size: 0.8rem; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 2rem; }
	.docs-footer a { color: #64748b; text-decoration: none; font-weight: 600; }

	@media (max-width: 768px) {
		.analysis-grid { grid-template-columns: 1fr; }
		.docs-container { padding: 1.5rem; }
	}
</style>
