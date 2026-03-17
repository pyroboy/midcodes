<script lang="ts">
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	const slides = [
		{
			title: 'Slide 1: The Hook',
			visual: 'Photo of a faded, peeling school ID from a local school.',
			script:
				"Good morning. This ID belongs to a student in Tagbilaran. It’s 4 months old, and you can’t read the name anymore. The parents paid ₱150 for this. It's useless. This is the current standard in Bohol. We can do better."
		},
		{
			title: 'Slide 2: The Problem',
			visual: "Parent panic / 'Lost ID' Facebook post.",
			script:
				"Schools today have two problems. One: 'Dumb' plastic IDs that fade. Two: Safety. When a parent asks, 'Did my child arrive?', the school has no answer because the ID is just a piece of plastic. It has no data."
		},
		{
			title: 'Slide 3: The Solution (Kanaya)',
			visual: 'Kanaya Smart ID beside the app interface.',
			script:
				"Meet Kanaya. We don't just sell plastic. We sell a Safety System. Our IDs are Sandwich Fused—meaning the ink is inside the plastic, not on top. It never fades. But the real magic is the chip. A guard scans this and instantly sees the student's status. It’s a smart card for the price of a dumb card."
		},
		{
			title: 'Slide 4: The Secret Sauce (Why Us?)',
			visual: 'Screenshot of Kanaya Studio software.',
			script:
				"How do we compete on price? Technology. Other shops use Photoshop and type names manually—it takes 15 minutes per card. I wrote my own software. It takes 15 seconds. I can produce 500 IDs in an afternoon while they take a week. My labor cost is near zero."
		},
		{
			title: 'Slide 5: The Money (Unit Economics)',
			visual: 'Profit chart showing ₱150 sales vs ₱28.50 cost.',
			script:
				"Let's talk numbers. I sell each ID for ₱150. My material cost is ₱28.50. Profit per student is ₱121.50. With just one small school of 500 students, we generate ₱60,000 in net profit—enough to cover the investment twice."
		},
		{
			title: 'Slide 6: The Ask',
			visual: 'Photo of Epson L8050 printer.',
			script:
				"I have the software, the skills, and waiting clients. I need one thing: the machine. I'm raising ₱25,000 today to buy the Epson L8050 and initial inventory. I can pay this back within 90 days, with interest."
		},
		{
			title: 'Slide 7: Closing',
			visual: 'Kanaya Identity Solutions logo or hero graphic.',
			script:
				"The school season is approaching. The market is wide open for a high-tech player. Let's build the safest campus in Tagbilaran together. Thank you."
		}
	];

	const faqs = [
		{
			q: "Why can't the shop in BQ Mall just copy you?",
			a: "They can buy the same printer, but they can't copy the software. My 'Scan & Verify' system is proprietary code. They sell plastic; I sell a platform."
		},
		{
			q: 'What if the printer breaks?',
			a: 'The Epson L8050 is a tank. Still, I have a backup agreement with a local partner to outsource printing temporarily while I repair it. Operations continue uninterrupted.'
		},
		{
			q: 'Why Tagbilaran? It’s small.',
			a: 'Small is an advantage—we dominate quickly. Word of mouth here is powerful. Once we land one flagship school, the rest follow due to FOMO.'
		}
	];
</script>

<svelte:head>
	<title>Kanaya Investor Presentation Kit</title>
</svelte:head>

<div class="docs-container">
	<header class="docs-header">
		<div class="header-top">
			<h1>Investor Presentation Kit</h1>
			<span class="badge">Pitch Ready</span>
		</div>
		<p class="meta">Use this script for lenders, partners, and family investors.</p>
	</header>

	<section class="battle-card">
		<h2>Part 1: Competitor Battle Card</h2>
		<p>Print this grid and put it on the table. Let the comparison speak for itself.</p>
		<table>
			<thead>
				<tr>
					<th>Feature</th>
					<th>❌ Generic Photo Shop (Tagbilaran)</th>
					<th>❌ Traditional Printing Press</th>
					<th>✅ Kanaya Identity Solutions</th>
				</tr>
			</thead>
			<tbody>
				<tr>
					<td>Material</td>
					<td>Thermal Lamination (Fades in 6mo)</td>
					<td>Paper Board / Laminated</td>
					<td>Fused "Sandwich" PVC (Non-Fading)</td>
				</tr>
				<tr>
					<td>Durability</td>
					<td>Peels when wet</td>
					<td>Not Waterproof</td>
					<td>100% Waterproof & Alcohol Proof</td>
				</tr>
				<tr>
					<td>Security</td>
					<td>None (Visual Only)</td>
					<td>None</td>
					<td>Encrypted QR / NFC Chip</td>
				</tr>
				<tr>
					<td>Lost Card</td>
					<td>1-2 Weeks Wait</td>
					<td>1 Month Wait</td>
					<td>2-Hour Replacement (Cloud Data)</td>
				</tr>
				<tr>
					<td>Data Safety</td>
					<td>Files stored loosely on desktop</td>
					<td>Physical Logbooks</td>
					<td>Encrypted Cloud Database</td>
				</tr>
				<tr>
					<td>Price</td>
					<td>₱50 - ₱150</td>
					<td>₱200+</td>
					<td>₱150 (Competitive)</td>
				</tr>
			</tbody>
		</table>
	</section>

	<section class="pitch-deck">
		<h2>Part 2: Pitch Deck Script (Slide by Slide)</h2>
		<p>Total Time: 5 minutes · Goal: Secure the ₱25,000 investment.</p>
		{#each slides as slide}
			<div class="slide-card">
				<h3>{slide.title}</h3>
				<p class="visual"><strong>Visual:</strong> {slide.visual}</p>
				<p class="script"><strong>Script:</strong> {slide.script}</p>
			</div>
		{/each}
	</section>

	<section class="questions">
		<h2>Part 3: Tough Questions Cheat Sheet</h2>
		{#each faqs as item}
			<div class="faq">
				<p class="question">Q: {item.q}</p>
				<p class="answer">A: {item.a}</p>
			</div>
		{/each}
	</section>

	<footer class="docs-footer">
		<p>Kanaya Identity Solutions • Securing the Campus, One ID at a Time.</p>
	</footer>
</div>



<style>
	.docs-container {
		max-width: 900px;
		margin: 0 auto;
		padding: 2rem;
		font-family: 'Segoe UI', system-ui, sans-serif;
		color: #111827;
	}

	.docs-header {
		border-bottom: 4px solid #1f2937;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
	}

	.header-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 1rem;
	}

	.docs-header h1 {
		margin: 0;
		font-size: 2rem;
	}

	.badge {
		background: #2563eb;
		color: white;
		padding: 0.3rem 0.9rem;
		border-radius: 999px;
		font-weight: 600;
	}

	.meta {
		color: #4b5563;
		margin-top: 0.5rem;
	}

	h2 {
		margin-top: 2.5rem;
		border-left: 5px solid #1d4ed8;
		padding-left: 0.75rem;
		font-size: 1.5rem;
	}

	table {
		width: 100%;
		border-collapse: collapse;
		margin-top: 1rem;
	}

	th,
	td {
		border: 1px solid #e5e7eb;
		padding: 0.75rem;
		text-align: left;
	}

	th {
		background: #0f172a;
		color: #f9fafb;
	}

	.pitch-deck .slide-card {
		border: 1px solid #e5e7eb;
		padding: 1.5rem;
		border-radius: 10px;
		margin-top: 1.5rem;
		background: #f9fafb;
	}

	.visual {
		color: #1d4ed8;
		font-weight: 600;
	}

	.script {
		margin-top: 0.5rem;
		line-height: 1.6;
	}

	.questions .faq {
		border-left: 5px solid #f59e0b;
		padding: 1rem 1.5rem;
		background: #fffbeb;
		margin-top: 1rem;
		border-radius: 0 10px 10px 0;
	}

	.question {
		font-weight: 700;
	}

	.docs-footer {
		margin-top: 3rem;
		text-align: center;
		color: #6b7280;
		border-top: 1px solid #e5e7eb;
		padding-top: 1rem;
	}

	@media (max-width: 640px) {
		.header-top {
			flex-direction: column;
			align-items: flex-start;
		}
	}
</style>
