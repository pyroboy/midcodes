<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Product & Technology Overview | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Product & Technology Overview</h1>
		<p class="meta">Kanaya Identity Solutions • The Tech Advantage</p>
		<div class="status-chip highlight">Core Document</div>
	</header>

	<section class="mission">
		<p>
			Kanaya is the Philippines' most advanced ID card ecosystem. We combine industrial-grade hardware reliability with modern, AI-powered software to eliminate the manual bottlenecks of traditional ID production.
		</p>
	</section>

	<section>
		<h2>🚀 The "Kanaya Advantage" (Unique Selling Points)</h2>
		<div class="feature-grid">
			<div class="feature-card">
				<div class="icon">🤖</div>
				<h3>AI Layer Decomposition</h3>
				<p>Using <strong>Qwen-Image-Layered</strong> via Fal.ai, we instantly separate flat ID designs into editable RGBA layers. This turns hours of manual Photoshop work into 10 seconds of automated processing.</p>
			</div>
			<div class="feature-card">
				<div class="icon">📦</div>
				<h3>Kinatao Workflow</h3>
				<p>A "Mobile-First" intake system. Enroll students via mobile app, capture AI-cleaned photos, and generate batches for production in real-time. No more desktop cables or SD card swapping.</p>
			</div>
			<div class="feature-card">
				<div class="icon">🔐</div>
				<h3>Multi-Sector Security Lock</h3>
				<p>Unlike cheap clones, every Kanaya ID is cryptographically signed. We utilize <strong>Sector 0 (UID)</strong>, <strong>Sector 1 (Encrypted UUID)</strong>, and <strong>Sector 2 (HMAC Private Key)</strong> to ensure unhackable verification.</p>
			</div>
			<div class="feature-card">
				<div class="icon">🧊</div>
				<h3>3D Real-Time Previews</h3>
				<p>Utilizing <strong>Threlte (Three.js)</strong>, users see their ID cards in a high-fidelity 3D environment before a single cent of ink is spent. What You See is What You Get (WYSIWYG).</p>
			</div>
		</div>
	</section>

	<section>
		<h2>🛠️ Technical Stack (The Architecture)</h2>
		<p class="subtext">Engineered for the Edge. Zero cold-starts. Sub-millisecond verification.</p>
		<div class="stack-list">
			<div class="stack-item">
				<span class="label">Framework</span>
				<div class="val"><strong>SvelteKit 2.x + TypeScript</strong> — For high-performance reactivity.</div>
			</div>
			<div class="stack-item">
				<span class="label">Database</span>
				<div class="val"><strong>Neon (Serverless Postgres) + Drizzle ORM</strong> — Type-safe, relational data.</div>
			</div>
			<div class="stack-item">
				<span class="label">Auth</span>
				<div class="val"><strong>Better Auth</strong> — Secure, multi-tenant RBAC (Super Admin → User).</div>
			</div>
			<div class="stack-item">
				<span class="label">Storage</span>
				<div class="val"><strong>Cloudflare R2</strong> — Distributed asset storage for images and templates.</div>
			</div>
			<div class="stack-item">
				<span class="label">Styling</span>
				<div class="val"><strong>TailwindCSS 4.x</strong> — Modern, utility-first design system.</div>
			</div>
		</div>
	</section>

	<section>
		<h2>📁 Asset Management & Data Integrity</h2>
		<p>The system maintains a strictly structured storage convention to ensure zero data drift across thousands of cards.</p>
		<div class="code-block">
			<pre>
/templates/[id]/background.png    # Canonical Background
/cards/[orgId]/[cardId]/front.png  # Final Rendered ID
/cards/[orgId]/[cardId]/raw/       # Original User Uploads
			</pre>
		</div>
		<p class="footnote">Every rendered card is cached on the Edge via Cloudflare CDN for instantaneous verification loads.</p>
	</section>

	<section class="performance">
		<h2>⚡ Performance Benchmarks</h2>
		<div class="benchmark-grid">
			<div class="bench">
				<span class="num">&lt;200ms</span>
				<span class="desc">Mobile Verification Speed</span>
			</div>
			<div class="bench">
				<span class="num">100%</span>
				<span class="desc">Data Ownership (User-Controlled Vault)</span>
			</div>
			<div class="bench">
				<span class="num">0s</span>
				<span class="desc">Cold Start Latency (Edge Computing)</span>
			</div>
		</div>
	</section>

	<footer class="docs-footer">
		<p>© 2026 Kanaya Identity Solutions • Public Tech Specs</p>
		<p><a href="/admin/docs">← Back to Index</a></p>
	</footer>
</div>

<style>
	:global(body) { background: #fcfcfc; }

	.docs-container {
		max-width: 900px;
		margin: 3rem auto;
		padding: 3rem;
		background: #fff;
		border-radius: 12px;
		box-shadow: 0 10px 15px -10px rgba(0, 0, 0, 0.1);
		font-family: 'Inter', system-ui, sans-serif;
		color: #1a202c;
	}

	.docs-header {
		border-bottom: 2px solid #edf2f7;
		padding-bottom: 2rem;
		margin-bottom: 3rem;
	}

	h1 { font-size: 2.5rem; font-weight: 900; color: #1a202c; margin: 0; letter-spacing: -0.02em; }
	.meta { color: #718096; font-size: 0.9rem; margin-top: 0.5rem; }

	.status-chip {
		display: inline-block;
		margin-top: 1rem;
		padding: 0.3rem 0.8rem;
		background: #ebf8ff;
		color: #2b6cb0;
		border-radius: 20px;
		font-weight: 700;
		font-size: 0.75rem;
	}

	.mission {
		font-size: 1.25rem;
		line-height: 1.6;
		color: #4a5568;
		margin-bottom: 4rem;
		border-left: 4px solid #3182ce;
		padding-left: 1.5rem;
	}

	h2 { font-size: 1.5rem; margin-top: 4rem; margin-bottom: 1.5rem; color: #1a202c; font-weight: 800; }

	.feature-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 2rem;
		margin-bottom: 4rem;
	}

	.feature-card {
		padding: 1.5rem;
		border: 1px solid #e2e8f0;
		border-radius: 12px;
		background: #fff;
		transition: transform 0.2s;
	}

	.feature-card .icon { font-size: 1.5rem; margin-bottom: 1rem; }
	.feature-card h3 { font-size: 1.1rem; margin-top: 0; margin-bottom: 0.75rem; }
	.feature-card p { font-size: 0.9rem; color: #718096; line-height: 1.5; margin: 0; }

	.stack-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.stack-item {
		display: flex;
		align-items: center;
		padding: 1rem;
		background: #f8fafc;
		border-radius: 8px;
	}

	.stack-item .label {
		width: 120px;
		font-size: 0.75rem;
		font-weight: 800;
		text-transform: uppercase;
		color: #a0aec0;
	}

	.stack-item .val { font-size: 0.95rem; color: #2d3748; }

	.code-block {
		background: #1a202c;
		color: #e2e8f0;
		padding: 1.5rem;
		border-radius: 8px;
		font-family: inherit;
		font-size: 0.85rem;
		margin: 1.5rem 0;
	}

	.code-block pre { margin: 0; }

	.benchmark-grid {
		display: flex;
		gap: 2rem;
		margin-top: 2rem;
	}

	.bench {
		flex: 1;
		text-align: center;
		padding: 2rem;
		background: #f0fff4;
		border: 1px solid #c6f6d5;
		border-radius: 12px;
	}

	.bench .num { display: block; font-size: 2rem; font-weight: 900; color: #276749; margin-bottom: 0.5rem; }
	.bench .desc { font-size: 0.8rem; color: #38a169; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

	.docs-footer { margin-top: 5rem; text-align: center; font-size: 0.8rem; color: #a0aec0; border-top: 1px solid #edf2f7; padding-top: 2rem; }
	.docs-footer a { color: #718096; text-decoration: none; font-weight: 600; }

	@media (max-width: 768px) {
		.feature-grid, .benchmark-grid { grid-template-columns: 1fr; flex-direction: column; }
		.docs-container { padding: 1.5rem; }
	}
</style>
