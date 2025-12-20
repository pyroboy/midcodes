<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Kanaya Documentation | Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Official Corporate Identity Document: Kanaya.app</h1>
		<p class="meta">
			Date of Formulation: December 19, 2025 • Version: 3.1 – Heritage & Integration Edition
		</p>
		<p class="subject">Subject: End-to-End Digital & Physical Identity Ecosystem</p>
	</header>

	<section>
		<h2>I. Brand Foundation & Etymology</h2>

		<h3>1.1 Definition of "Kanaya"</h3>
		<p>
			The name <strong>Kanaya</strong> is a purposeful linguistic blend designed to evoke trust, ownership,
			and accessibility within the Filipino context.
		</p>
		<ul>
			<li>
				<strong>The Root (Kanya):</strong> Derived from the Filipino word for "His/Hers/Theirs." It
				serves as the core of the brand philosophy—<em>Personal Sovereignty</em>. It signifies that
				the data and the identity belong solely to the individual.
			</li>
			<li>
				<strong>The Suffix (Anaya):</strong> Evokes the sense of "Invitation" or "Ease." It softens the
				technical nature of "Identification" and turns it into a welcoming, user-friendly experience.
			</li>
			<li>
				<strong>The State of Being:</strong> In archaic contexts, the sound of Kanaya suggests a state
				of abundance and peace of mind. For the user, this translates to the peace of mind that comes
				with a secure, unhackable identity.
			</li>
		</ul>

		<h3>1.2 The Baybayin Visual Match (ᜃᜈᜌ)</h3>
		<p>
			The brand is built around a "Perfect Match" between the modern alphabet and the ancient
			Filipino script.
		</p>
		<ul>
			<li>
				<strong>The Anchor Symbol (ᜃ):</strong> Our official logo is the Baybayin KA. In ancient
				script, this character represents <em>Connection</em> and <em>Relationship</em>.
			</li>
			<li>
				<strong>Visual Symmetry:</strong> Written in Baybayin, the name is rendered as
				<span class="baybayin">ᜃᜈᜌ</span>.
				<ul>
					<li>The first character (ᜃ) is our logo, providing immediate brand recognition.</li>
					<li>
						The flow of the characters ᜃ (Ka), ᜈ (Na), and ᜌ (Ya) creates a balanced, artistic
						silhouette that reflects the brand's origins in ArjoStyle Tech & Design.
					</li>
				</ul>
			</li>
			<li>
				<strong>Cultural Resonancy:</strong> By matching the name to the script, Kanaya.app bridges the
				gap between our pre-colonial identity and a high-tech future.
			</li>
		</ul>
	</section>

	<section>
		<h2>II. The Four Pillars of the Kanaya Ecosystem</h2>

		<div class="pillar">
			<h3>Pillar I: Absolute Ownership (The "Kanya" Principle)</h3>
			<p>
				Kanaya empowers the individual. Unlike traditional systems where institutions "own" the ID,
				Kanaya gives the user a "Digital Vault." The individual is the primary gatekeeper, granting
				and revoking access through a secure mobile interface.
			</p>
		</div>

		<div class="pillar">
			<h3>Pillar II: High-Velocity Creation (The "Kinatao" Workflow)</h3>
			<p>
				We have optimized the logistics of ID production. Using a <strong
					>Mobile-First Capture System</strong
				>, Kanaya allows schools and LGUs to enroll individuals in seconds.
			</p>
			<ul>
				<li><strong>Rapid Intake:</strong> Capture data and photos via mobile app.</li>
				<li>
					<strong>Instant Cloud Processing:</strong> Bypasses legacy desktop-and-camera setups.
				</li>
				<li>
					<strong>Scalable Issuance:</strong> From data capture to physical card production in record
					time.
				</li>
			</ul>
		</div>

		<div class="pillar">
			<h3>Pillar III: High-Velocity Utility (The Svelte 5 Edge)</h3>
			<p>
				Performance is a security feature. Utilizing <strong>Svelte 5</strong> and
				<strong>Cloudflare Edge Computing</strong>, verification happens in sub-milliseconds. This
				ensures zero-lag attendance and verification in high-traffic environments.
			</p>
		</div>

		<div class="pillar">
			<h3>Pillar IV: Autonomous Intelligence</h3>
			<p>
				Kanaya IDs are "Active Credentials." A single tap triggers automated workflows: logging
				attendance, sending parent SMS alerts, or updating LGU benefit ledgers without manual
				intervention.
			</p>
		</div>
	</section>

	<section>
		<h2>III. The Marketing Narrative: "The Evolution of the Card"</h2>

		<h3>3.1 The Analog Crisis</h3>
		<p>
			Traditional identification is slow to produce, easy to lose, and disconnected from digital
			security. A lost ID in the analog world is a permanent security risk.
		</p>

		<h3>3.2 The Kanaya Solution: The End-to-End Digital Card</h3>
		<p>Kanaya is the convergence of high-speed creation and high-security storage.</p>
		<ul>
			<li><strong>Easy to Create:</strong> Mobile-capture enabled.</li>
			<li><strong>Easy to Use:</strong> One tap replaces multiple institution-specific cards.</li>
			<li>
				<strong>Easy to Trust:</strong> Real-time cloud verification ensures the person is who they say
				they are.
			</li>
		</ul>
	</section>

	<section>
		<h2>IV. Technical Architecture & Security Features</h2>

		<h3>4.1 Current Production Standards</h3>
		<ul>
			<li>
				<strong>Encrypted NFC (Near Field Communication):</strong> Secure element chips utilizing AES
				encryption to prevent unauthorized skimming.
			</li>
			<li>
				<strong>Dynamic QR Technology:</strong> App-based QR codes that refresh on a timer to prevent
				screenshot fraud.
			</li>
			<li>
				<strong>Legacy Compatibility:</strong> High-density 1D/2D Barcodes and RFID support for existing
				school and office scanners.
			</li>
		</ul>

		<h3>4.2 Security Roadmap (To Be Announced)</h3>
		<p>As Kanaya scales, we will introduce our Advanced Security Tier:</p>
		<ul>
			<li><strong>Holographic Overlays:</strong> Custom tamper-evident laminates.</li>
			<li>
				<strong>UV Light Fluorescence:</strong> Invisible security markers for high-level government verification.
			</li>
			<li>
				<strong>Micro-Text Geometry:</strong> Intricate patterns visible only under magnification.
			</li>
		</ul>

		<h3>4.3 The Infrastructure Stack</h3>
		<ul>
			<li><strong>Frontend:</strong> Svelte 5 for a reactive, high-performance interface.</li>
			<li>
				<strong>Edge Logic:</strong> Cloudflare Workers (Serverless) for global low-latency processing.
			</li>
			<li><strong>Database:</strong> PostgreSQL for high-integrity relational data storage.</li>
		</ul>
	</section>

	<section>
		<h2>V. Sector-Specific Identity Applications</h2>
		<table>
			<thead>
				<tr>
					<th>Sector</th>
					<th>Creation Workflow</th>
					<th>Utility Impact</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Education</td>
					<td>App-based enrollment.</td>
					<td>Real-time attendance + Parent SMS alerts.</td>
				</tr>
				<tr>
					<td>LGU / Government</td>
					<td>Mobile-field registration.</td>
					<td>Eliminates "Ghost" beneficiaries in social programs.</td>
				</tr>
				<tr>
					<td>Corporate</td>
					<td>Rapid employee onboarding.</td>
					<td>Seamless access control & time-tracking.</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section>
		<h2>VI. Vision & Mission Statement</h2>

		<h3>6.1 Vision</h3>
		<p>
			To establish the world's most efficient and secure identity framework, where the "Digital
			Card" is created in seconds and trusted for a lifetime.
		</p>

		<h3>6.2 Mission</h3>
		<p>
			To deliver an uncompromising technological stack that provides the fastest, most reliable, and
			most secure identity solutions. We aim to modernize how institutions identify their people by
			making the creation process effortless and the verification process instant.
		</p>
	</section>

	<footer class="docs-footer">
		<p>Internal Documentation • Super Admin Access Only</p>
	</footer>
</div>

<style>
	.docs-container {
		max-width: 800px;
		margin: 0 auto;
		padding: 2rem;
		font-family:
			system-ui,
			-apple-system,
			sans-serif;
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

	section {
		margin-bottom: 2rem;
	}

	h2 {
		font-size: 1.4rem;
		border-bottom: 1px solid #ddd;
		padding-bottom: 0.5rem;
		margin: 1.5rem 0 1rem;
	}

	h3 {
		font-size: 1.1rem;
		margin: 1rem 0 0.5rem;
	}

	.pillar {
		background: #f9f9f9;
		padding: 1rem;
		border-left: 3px solid #333;
		margin: 1rem 0;
	}

	.pillar h3 {
		margin-top: 0;
	}

	ul {
		margin: 0.5rem 0;
		padding-left: 1.5rem;
	}

	li {
		margin: 0.25rem 0;
	}

	.baybayin {
		font-size: 1.2em;
		font-weight: bold;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin: 1rem 0;
	}

	th,
	td {
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

	.docs-footer {
		margin-top: 3rem;
		padding-top: 1rem;
		border-top: 1px solid #ddd;
		text-align: center;
		color: #888;
		font-size: 0.875rem;
	}
</style>
