<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Hardware & Terminals | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Hybrid Attendance Terminal Research</h1>
		<p class="meta">QR + RFID + Fingerprint Systems • Philippine Market Analysis</p>
		<div class="status-chip highlight">Exchange Rate: ₱58.80 (Jan 2026)</div>
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
						<th>OS</th>
						<th>RAM</th>
						<th>Battery</th>
						<th>Price (PHP)</th>
						<th>Notes</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Samsung Active4 Pro</strong></td>
						<td>Android 12</td>
						<td>4GB</td>
						<td>7,600mAh</td>
						<td>₱38,163</td>
						<td>Rugged, IP68, S Pen, Knox security</td>
					</tr>
					<tr>
						<td><strong>Samsung Galaxy Tab A9+</strong></td>
						<td>Android 13</td>
						<td>4GB</td>
						<td>7,040mAh</td>
						<td>₱12,877</td>
						<td>Good middle-ground</td>
					</tr>
					<tr>
						<td><strong>Lenovo Tab M9</strong></td>
						<td>Android 12</td>
						<td>4-8GB</td>
						<td>5,100mAh</td>
						<td>₱10,525</td>
						<td>Budget enterprise option</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3>B. USB QR Code Readers (CAPEX)</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Model</th>
						<th>Connection</th>
						<th>Scan Speed</th>
						<th>Price (PHP)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>NETUM 2D Wired</strong></td>
						<td>USB-C</td>
						<td>300 scans/sec</td>
						<td>₱2,058</td>
					</tr>
					<tr>
						<td><strong>Tera 2D Wireless</strong></td>
						<td>Bluetooth/USB</td>
						<td>200 scans/sec</td>
						<td>₱2,470</td>
					</tr>
					<tr>
						<td><strong>Manhattan CCD</strong></td>
						<td>USB-A/C</td>
						<td>Standard</td>
						<td>₱2,646</td>
					</tr>
				</tbody>
			</table>
		</div>

		<h3>C. Fingerprint Scanners (Optional)</h3>
		<div class="table-wrapper">
			<table>
				<thead>
					<tr>
						<th>Tier</th>
						<th>Model</th>
						<th>Certification</th>
						<th>Price (PHP)</th>
					</tr>
				</thead>
				<tbody>
					<tr>
						<td><strong>Basic</strong></td>
						<td>U.are.U 4500</td>
						<td>PoC Only</td>
						<td>₱1,176</td>
					</tr>
					<tr>
						<td><strong>Professional</strong></td>
						<td>SecuGen Hamster Plus</td>
						<td>FBI-Certified</td>
						<td>₱4,410</td>
					</tr>
					<tr>
						<td><strong>High-Security</strong></td>
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
					<li><strong>Budget Option:</strong> ₱16,405</li>
					<li><strong>Professional Option:</strong> ₱23,873</li>
					<li><strong>Premium Option:</strong> ₱53,451</li>
				</ul>
				<p class="small">* Includes hub, mounting, and enclosure</p>
			</div>
			<div class="analysis-card">
				<h3>Monthly OPEX (Per Terminal)</h3>
				<ul class="cost-list">
					<li><strong>Connectivity/Power:</strong> ₱118</li>
					<li><strong>Device Management:</strong> ₱176 - ₱294</li>
					<li><strong>Total/Month:</strong> ₱294 - ₱412</li>
				</ul>
				<p class="small">* Excluding cloud storage and card costs</p>
			</div>
		</div>
	</section>

	<section class="roadmap">
		<h2>4. Implementation Roadmap</h2>
		<div class="timeline">
			<div class="timeline-item">
				<span class="phase">Phase 1: MVP (2-3 Weeks)</span>
				<p>Order 1x Samsung Tab A9+ & NETUM scanner. Develop basic tablet app for QR scanning and sync testing.</p>
			</div>
			<div class="timeline-item">
				<span class="phase">Phase 2: Biometric Pilot (3-4 Weeks)</span>
				<p>Order SecuGen Hamster Plus. Integrate fingerprint SDK. Test dual-mode: QR primary, fingerprint secondary.</p>
			</div>
			<div class="timeline-item">
				<span class="phase">Phase 3: Scale Deployment (4-6 Weeks)</span>
				<p>Order bulk units. Configure device management (Hexnode/VMware). Train client IT staff on site setup.</p>
			</div>
			<div class="timeline-item">
				<span class="phase">Phase 4: Optimization (Ongoing)</span>
				<p>Monitor sync reliability. Optimize for offline scenarios. Add photo capture and geofencing features.</p>
			</div>
		</div>
	</section>

	<section class="sourcing">
		<h2>5. Local Sourcing Options (Philippines)</h2>
		<div class="rec-box">
			<ul>
				<li><strong>Tablets:</strong> Samsung/Lenovo authorized resellers (SM Megamall, Lazada/Shopee Mall).</li>
				<li><strong>QR Scanners:</strong> Available on Lazada/Shopee for ₱1,500-3,000 with local warranty.</li>
				<li><strong>Fingerprint Readers:</strong> SecuGen available through local biometrics distributors (~₱5,000-7,000).</li>
				<li><strong>Mounts:</strong> Local fabrication shops can create custom VESA mounts for ₱1,000-2,500.</li>
			</ul>
		</div>
	</section>

	<section class="model highlight-box">
		<h2>6. B2B Financial Projections</h2>
		<div class="projections-grid">
			<div class="proj-card">
				<h3>Client Pricing</h3>
				<ul>
					<li><strong>Basic (QR+NFC):</strong> ₱1,470/mo</li>
					<li><strong>Premium (+Biometrics):</strong> ₱2,058/mo</li>
				</ul>
			</div>
			<div class="proj-card">
				<h3>Margins & Payback</h3>
				<ul>
					<li><strong>Gross Margin:</strong> ~75%</li>
					<li><strong>Payback Period:</strong> ~20 months</li>
				</ul>
			</div>
		</div>
	</section>

	<section class="recommendations">
		<h2>7. Final Recommendations</h2>
		<ul class="rec-list">
			<li><strong>Start with QR + NFC</strong> to leverage existing card infrastructure.</li>
			<li><strong>Target Schools & Enterprises</strong> already purchasing Kanaya ID cards.</li>
			<li><strong>Competitive Edge:</strong> Real-time sync + offline capability separates us from legacy hardware.</li>
		</ul>
	</section>

	<footer class="docs-footer">
		<p>© 2026 Kanaya Identity Solutions • Hardware Engineering Team</p>
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
