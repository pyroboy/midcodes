<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Kanaya Sales & Marketing Collateral</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<h1>Sales & Marketing Collateral</h1>
		<p class="meta">Status: READY FOR DESIGN • Usage: Copy into Canva / Photoshop</p>
	</header>

	<section>
		<h2>1. Tri-Fold Brochure (Schools)</h2>
		<p class="note">Design tip: Blue + White palette for trust and security cues.</p>
		<div class="panel">
			<h3>Front Panel</h3>
			<ul>
				<li><strong>Headline:</strong> Is Your Campus Really Safe?</li>
				<li><strong>Sub-headline:</strong> The first Smart ID System in Bohol that notifies parents and verifies students instantly.</li>
				<li><strong>Visual:</strong> High-quality photo of a Kanaya ID with a phone scanning it.</li>
				<li><strong>CTA:</strong> "Upgrade to Smart Security today."</li>
			</ul>
		</div>
		<div class="panel">
			<h3>Inside Left — The Problem</h3>
			<p>Headline: <strong>The "Plastic" Problem</strong></p>
			<ul>
				<li>Most school IDs are just plastic.</li>
				<li>They fade in 6 months.</li>
				<li>They are easy to fake.</li>
				<li>They provide zero data.</li>
				<li><em>Did you know?</em> A lost ID takes ~7 days to replace, keeping your campus exposed.</li>
			</ul>
		</div>
		<div class="panel">
			<h3>Inside Center — The Solution</h3>
			<p>Headline: <strong>The Kanaya Difference</strong></p>
			<ul>
				<li>We don’t just print IDs. We protect students.</li>
				<li>Anti-Fade Technology: fused "Sandwich" printing keeps the photo intact.</li>
				<li>Smart Verification: guards scan the QR to see the student’s status in real time.</li>
				<li>Guardian Link (Optional): scan to confirm authorized fetchers.</li>
			</ul>
		</div>
		<div class="panel">
			<h3>Inside Right — The Tech</h3>
			<p>Headline: <strong>No Internet? No Problem.</strong></p>
			<ul>
				<li>Offline-first scanning keeps working when Wi-Fi drops.</li>
				<li>Secure: encrypted data.</li>
				<li>Fast: scans in 0.5 seconds.</li>
				<li>Durable: waterproof + alcohol-proof.</li>
			</ul>
		</div>
		<div class="panel">
			<h3>Back Panel — Contact</h3>
			<ul>
				<li>Kanaya Identity Solutions — Securing Tagbilaran, One ID at a Time.</li>
				<li>📍 [Your Address/City]</li>
				<li>📞 [Your Number]</li>
				<li>🌐 [Your Website]</li>
				<li>Special Offer: Free Demo for the first 50 students.</li>
			</ul>
		</div>
	</section>

	<section>
		<h2>2. Formal Meeting Request Letter</h2>
		<div class="letter">
			<p>Date: January 2026</p>
			<p>To the Office of the Principal<br />[School Name]<br />Tagbilaran City, Bohol</p>
			<p><strong>Subject:</strong> Proposal for Campus Security & Student Identification Upgrade</p>
			<p>Dear Sir/Ma'am:</p>
			<p>Good day.</p>
			<p>
				I am writing to propose a modernization of your current Student Identification System. Traditional laminated IDs fade quickly and offer no safeguards against unauthorized individuals. In today’s climate, a "dumb" plastic card simply isn’t enough.
			</p>
			<p>
				Kanaya Identity Solutions is a Bohol-based technology provider. Our Smart ID System lets your security personnel verify a student's enrollment status instantly via mobile scanning.
			</p>
			<p>
				We are not asking for a commitment today. We only request 10 minutes to demonstrate a live prototype of the Scan-and-Verify system. I will follow up with your office on [Day of Week] to schedule a brief demo.
			</p>
			<p>Respectfully yours,</p>
			<p>[Your Name]<br />Operations Head<br />Kanaya Identity Solutions</p>
		</div>
	</section>

	<section>
		<h2>3. SaaS Landing Page Copy</h2>
		<div class="panel">
			<h3>Hero Section</h3>
			<ul>
				<li><strong>Headline:</strong> Stop Layouting IDs in Photoshop.</li>
				<li><strong>Sub-headline:</strong> The ID Card Automation Tool for print shops—<strong>generate 500 Print-Ready Files in 5 minutes</strong>.</li>
				<li><strong>Button:</strong> Start Free Trial (No Credit Card Required).</li>
			</ul>
			<p class="note" style="margin-top: 1rem; font-size: 0.85rem;">
				<strong>Note to Sales:</strong> Always clarify that "5 minutes" refers to the <em>software processing time</em> for layouting. Physical printing speed depends on the printer hardware (e.g., Epson L8050 leads to ~10-12 hours for 500 physical cards).
			</p>
		</div>
		<div class="panel">
			<h3>Feature Grid</h3>
			<ul>
				<li><strong>Excel to PDF:</strong> Drag student list + photos, get a PDF.</li>
				<li><strong>Mirror Mode Ready:</strong> Auto-mirrored for Epson L8050 / inkjet printing.</li>
				<li><strong>Smart Layouts:</strong> Auto-adjusts long names—no manual tweaking.</li>
			</ul>
		</div>
		<div class="panel">
			<h3>Social Proof</h3>
			<blockquote>
				"I used to spend 3 nights layouting a batch of IDs. With Kanaya, I finished it during my lunch break." — Print Shop Owner, Davao City
			</blockquote>
		</div>
		<div class="panel">
			<h3>Pricing</h3>
			<ul>
				<li><strong>Free Plan:</strong> Watermarked output for testing.</li>
				<li><strong>Pro Plan (₱1,500/mo):</strong> Unlimited exports + priority support.</li>
			</ul>
		</div>
	</section>

	<footer class="docs-footer">
		<p>End of Marketing Assets</p>
	</footer>
</div>

<style>
	.docs-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', system-ui, sans-serif;
		color: #1f2933;
	}

	.docs-header {
		border-bottom: 4px solid #1f2937;
		margin-bottom: 2rem;
	}

	.docs-header h1 {
		margin: 0;
		font-size: 2.1rem;
	}

	.meta {
		color: #4b5563;
		margin-top: 0.5rem;
	}

	h2 {
		margin-top: 2.5rem;
		border-left: 5px solid #0f172a;
		padding-left: 0.75rem;
		color: #0f172a;
	}

	.note {
		background: #eff6ff;
		padding: 0.75rem 1rem;
		border-radius: 8px;
		color: #1d4ed8;
	}

	.section ul {
		padding-left: 1.2rem;
	}

	.panel {
		border: 1px solid #e5e7eb;
		padding: 1.25rem;
		border-radius: 10px;
		margin-top: 1rem;
		background: #f9fafb;
	}

	.panel h3 {
		margin-top: 0;
	}

	.letter {
		border: 1px solid #d1d5db;
		padding: 1.5rem;
		border-radius: 10px;
		background: white;
		line-height: 1.6;
	}

	blockquote {
		margin: 0;
		padding-left: 1rem;
		border-left: 4px solid #fbbf24;
		color: #92400e;
		font-style: italic;
	}

	.docs-footer {
		margin-top: 3rem;
		text-align: center;
		color: #6b7280;
		border-top: 1px solid #e5e7eb;
		padding-top: 1rem;
	}
</style>
