<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Growth Strategy & Business Plan | Kanaya Admin</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Master Growth Strategy</h1>
		<p class="meta">Executive Plan • Phase: Zero Capital Startup</p>
		<p class="subject">Subject: Market Penetration, The "Flip" Method, and School Targets</p>
	</header>

	<nav class="toc">
		<h2>Battle Plan</h2>
		<ol>
			<li><a href="#phase1">Phase 1: The "Flip" (Zero Capital)</a></li>
			<li><a href="#targets">Target Clients (Tagbilaran)</a></li>
			<li><a href="#tactic">The "Batch & Roll" Tactic</a></li>
			<li><a href="#pitch">The "Trojan Horse" Pitch</a></li>
		</ol>
	</nav>

	<section id="phase1">
		<h2>I. Phase 1: The "Flip" Strategy</h2>
		<div class="strategy-box">
			<h3>Objective: Acquire Production Capability</h3>
			<p>
				<strong>Goal:</strong> Generate ₱18,000 cash to buy the Epson L8050 printer without using personal
				savings.
			</p>

			<h4>The Execution Steps:</h4>
			<ol>
				<li><strong>Secure the Contract:</strong> Close a deal for 300 IDs @ ₱120 (Total ₱36k) or similar volume.</li>
				<li><strong>The Trigger:</strong> Demand a <strong>50% Downpayment (₱18k)</strong>. No work begins without this.</li>
				<li>
					<strong>The Flip:</strong>
					<ul>
						<li>Take the ₱18k cash immediately to the store.</li>
						<li>Buy the Printer (₱16k) + Ink/PVC (₱2k).</li>
						<li><strong>Stop Outsourcing.</strong> Print the order in-house.</li>
					</ul>
				</li>
				<li><strong>The Profit:</strong> The remaining 50% payment (₱18k) becomes pure profit.</li>
			</ol>
		</div>
	</section>

	<section id="targets">
		<h2>II. Target Client List (Tagbilaran City)</h2>

		<h3>Tier 1: "Cash Ready" (High Priority)</h3>
		<p><em>Focus: Private Pre-schools &amp; Construction. They pay upfront.</em></p>
		<ul class="target-list">
			<li><strong>DML Montessori / VDT ALC:</strong> Pitch "Child Safety Fetcher Cards".</li>
			<li><strong>Panglao Construction Firms:</strong> Pitch "Worker Access & Attendance".</li>
			<li><strong>Weddings / Events:</strong> Pitch "Smart Invitations/Access".</li>
		</ul>

		<h3>Tier 2: "Volume Kings" (Medium Priority)</h3>
		<p><em>Focus: Public Schools &amp; State Colleges. High volume, bureaucratic pay.</em></p>
		<ul class="target-list">
			<li><strong>DCPNHS (City High):</strong> 3,000+ students. Use "Batch & Roll".</li>
			<li><strong>Tagbilaran City Central:</strong> High volume elementary.</li>
			<li><strong>BIT / PMI Colleges:</strong> Tech-forward, high volume.</li>
		</ul>
	</section>

	<section id="tactic">
		<h2>III. The "Batch & Roll" Tactic (Public Schools)</h2>
		<div class="alert-box">
			<strong>Problem:</strong> You cannot afford materials for 3,000 students (₱150k order) upfront.<br />
			<strong>Solution:</strong> Break the order into bite-sized pieces.
		</div>

		<h4>How it works:</h4>
		<ol>
			<li><strong>Do not accept the full P.O. at once.</strong></li>
			<li>
				<strong>Contract for Grade 7 Only (500 students):</strong>
				<ul>
					<li>Cost to Client: ₱25,000.</li>
					<li>Required Downpayment: ₱12,500.</li>
					<li><em>Manageable Risk. Fast Delivery (2-3 days).</em></li>
				</ul>
			</li>
			<li><strong>Roll Over:</strong> Use the profit from Grade 7 to fund Grade 8 materials.</li>
			<li><strong>Repeat:</strong> Until all grade levels are complete.</li>
		</ol>
	</section>

	<section id="pitch">
		<h2>IV. The "Trojan Horse" Sales Pitch</h2>
		<p class="subtext">We do not sell plastic. We sell the SYSTEM.</p>

		<div class="script-card">
			<h4>For School Principals / PTA:</h4>
			<p>"Ma'am, buying a plastic ID is a waste of money. It fades, it breaks, and it's easy to fake.</p>
			<p>
				<strong>Kanaya</strong> offers a Digital Safety System. When a student loses this ID, you don't need to wait 2 weeks. I
				can reprint it in <strong>1 hour</strong> because the data is secure in our cloud.
			</p>
			<p>
				Plus, with our 'Batch & Roll' program, the PTA doesn't need to release huge funds. We do it section by section, ensuring
				quality and cash flow safety."
			</p>
		</div>
	</section>

	<footer class="docs-footer">
		<p>Kanaya Strategic Roadmap • Confidential</p>
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
		border-bottom: 3px solid #48bb78;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
	}
	.docs-header h1 {
		color: #276749;
		margin: 0;
	}
	.meta {
		color: #718096;
		font-size: 0.9rem;
	}

	.toc {
		background: #f0fff4;
		padding: 1.5rem;
		border-radius: 8px;
		margin-bottom: 3rem;
	}
	.toc h2 {
		margin: 0 0 1rem;
		font-size: 1.2rem;
		color: #2f855a;
	}
	.toc ol {
		margin: 0;
		padding-left: 1.5rem;
	}
	.toc a {
		text-decoration: none;
		color: #276749;
		font-weight: bold;
	}

	.strategy-box {
		background: white;
		border: 1px solid #e2e8f0;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
	}
	.strategy-box h3 {
		margin-top: 0;
		color: #2f855a;
	}
	.strategy-box li {
		margin-bottom: 0.5rem;
	}

	.target-list {
		background: #fff;
		padding: 1.5rem 1.5rem 1.5rem 3rem;
		border: 1px solid #e2e8f0;
		border-radius: 8px;
	}
	.target-list li {
		margin-bottom: 0.5rem;
	}

	.script-card {
		background: #f7fafc;
		padding: 2rem;
		border-left: 5px solid #3182ce;
		font-style: italic;
		color: #2d3748;
	}
	.script-card h4 {
		font-style: normal;
		margin-top: 0;
		color: #3182ce;
	}

	.alert-box {
		background: #fffaf0;
		border-left: 4px solid #ed8936;
		padding: 1rem;
		margin-bottom: 1.5rem;
	}

	section {
		margin-bottom: 4rem;
	}
	h2 {
		font-size: 1.5rem;
		border-left: 5px solid #48bb78;
		padding-left: 1rem;
		margin-bottom: 1.5rem;
		color: #222;
	}

	.docs-footer {
		margin-top: 4rem;
		text-align: center;
		color: #a0aec0;
		border-top: 1px solid #eee;
		padding-top: 2rem;
	}
</style>
