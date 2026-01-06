<script lang="ts">
	import type { PageData } from './$types';
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Sales Operations Manual | Kanaya Admin</title>
</svelte:head>

<div class="container mx-auto py-8 max-w-5xl">
	<header class="mb-8">
		<h1 class="text-4xl font-bold mb-2">SALES OPERATIONS MANUAL</h1>
		<p class="text-muted-foreground">Lead Management, Payment Terms & Pipeline Execution</p>
		<div class="inline-block mt-3 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full text-sm font-semibold">
			Internal Process Document | January 2026
		</div>
	</header>

	<nav class="mb-10 p-4 bg-muted rounded-lg">
		<h2 class="text-lg font-bold mb-3">Quick Navigation</h2>
		<ol class="grid md:grid-cols-2 gap-2 text-sm">
			<li><a href="#rules" class="text-blue-600 hover:underline">1. Compliance & Non-Negotiables</a></li>
			<li><a href="#qualify" class="text-blue-600 hover:underline">2. Lead Qualification Framework</a></li>
			<li><a href="#pipeline" class="text-blue-600 hover:underline">3. Sales Pipeline & Follow-up</a></li>
			<li><a href="#payment" class="text-blue-600 hover:underline">4. Payment Terms & Collection</a></li>
			<li><a href="#objections" class="text-blue-600 hover:underline">5. Quick Objection Responses</a></li>
			<li><a href="#contracts" class="text-blue-600 hover:underline">6. Contract & Documentation</a></li>
		</ol>
	</nav>

	<!-- CROSS-REFERENCES -->
	<div class="mb-10 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
		<h3 class="font-bold mb-2">📚 Related Documentation</h3>
		<div class="grid md:grid-cols-3 gap-4 text-sm">
			<div>
				<p class="font-bold">For Pricing Details:</p>
				<ul class="text-muted-foreground">
					<li>• <a href="/admin/docs/attendance-pricing" class="text-blue-600 underline">Attendance System Pricing</a></li>
					<li>• <a href="/admin/docs/product-catalog" class="text-blue-600 underline">Product Catalog</a></li>
				</ul>
			</div>
			<div>
				<p class="font-bold">For Sales Pitches:</p>
				<ul class="text-muted-foreground">
					<li>• <a href="/admin/docs/strategy" class="text-blue-600 underline">"Trojan Horse" Pitches</a></li>
					<li>• <a href="/admin/docs/gtm" class="text-blue-600 underline">Cold Call Scripts</a></li>
				</ul>
			</div>
			<div>
				<p class="font-bold">For Market Strategy:</p>
				<ul class="text-muted-foreground">
					<li>• <a href="/admin/docs/lgu-strategy" class="text-blue-600 underline">LGU Penetration</a></li>
					<li>• <a href="/admin/docs/promos" class="text-blue-600 underline">Active Promotions</a></li>
				</ul>
			</div>
		</div>
	</div>

	<!-- SECTION 1: COMPLIANCE -->
	<section id="rules" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">I. Compliance & Non-Negotiables</h2>

		<Card class="border-2 border-red-300 dark:border-red-700 mb-6">
			<CardHeader class="bg-red-50 dark:bg-red-900/20">
				<CardTitle>⛔ ZERO TOLERANCE POLICY</CardTitle>
			</CardHeader>
			<CardContent class="pt-4">
				<p class="font-bold text-red-600 mb-2">STRICTLY NO FAKE IDs</p>
				<p class="text-sm">We do not accept orders for unauthorized government IDs, driver's licenses, or falsified credentials. Any request without proper authorization will be rejected immediately. This is non-negotiable and protects our reputation and legal standing.</p>
			</CardContent>
		</Card>

		<div class="grid md:grid-cols-3 gap-4">
			<Card>
				<CardContent class="pt-4">
					<p class="text-2xl mb-2">📄</p>
					<p class="font-bold">Documentation Required</p>
					<p class="text-sm text-muted-foreground">Company P.O. or Certification required for all corporate/bulk purchases to verify legitimacy.</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="pt-4">
					<p class="text-2xl mb-2">🔒</p>
					<p class="font-bold">Data Privacy</p>
					<p class="text-sm text-muted-foreground">Clients retain ownership of their data. We do not sell or share client information. Ever.</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="pt-4">
					<p class="text-2xl mb-2">🎨</p>
					<p class="font-bold">Free Layout Policy</p>
					<p class="text-sm text-muted-foreground">Design is FREE. Work begins ONLY after downpayment is secured.</p>
				</CardContent>
			</Card>
		</div>
	</section>

	<!-- SECTION 2: LEAD QUALIFICATION -->
	<section id="qualify" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">II. Lead Qualification Framework</h2>
		<p class="text-muted-foreground mb-6">Not all leads are worth pursuing. Use this framework to prioritize.</p>

		<div class="overflow-x-auto mb-6">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="text-left py-3 px-4">Criteria</th>
						<th class="text-center py-3 px-4">🟢 Hot Lead</th>
						<th class="text-center py-3 px-4">🟡 Warm Lead</th>
						<th class="text-center py-3 px-4">🔴 Cold/Avoid</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b">
						<td class="py-3 px-4 font-bold">Volume</td>
						<td class="py-3 px-4 text-center">100+ cards minimum</td>
						<td class="py-3 px-4 text-center">50-99 cards</td>
						<td class="py-3 px-4 text-center">&lt;50 (unless high-value)</td>
					</tr>
					<tr class="border-b bg-muted/30">
						<td class="py-3 px-4 font-bold">Budget Authority</td>
						<td class="py-3 px-4 text-center">Decision maker in room</td>
						<td class="py-3 px-4 text-center">Has approval access</td>
						<td class="py-3 px-4 text-center">"I'll ask my boss"</td>
					</tr>
					<tr class="border-b">
						<td class="py-3 px-4 font-bold">Timeline</td>
						<td class="py-3 px-4 text-center">Within 30 days</td>
						<td class="py-3 px-4 text-center">1-3 months</td>
						<td class="py-3 px-4 text-center">"Maybe next year"</td>
					</tr>
					<tr class="border-b bg-muted/30">
						<td class="py-3 px-4 font-bold">Payment Readiness</td>
						<td class="py-3 px-4 text-center">Budget allocated</td>
						<td class="py-3 px-4 text-center">Needs approval</td>
						<td class="py-3 px-4 text-center">No budget discussion</td>
					</tr>
					<tr class="border-b">
						<td class="py-3 px-4 font-bold">Current Pain</td>
						<td class="py-3 px-4 text-center">Active problem</td>
						<td class="py-3 px-4 text-center">Aware of issue</td>
						<td class="py-3 px-4 text-center">"We're fine as is"</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="grid md:grid-cols-2 gap-4">
			<Card class="border-l-4 border-l-green-500">
				<CardContent class="pt-4">
					<p class="font-bold text-green-600">✅ PURSUE IMMEDIATELY</p>
					<ul class="text-sm mt-2 space-y-1">
						<li>• Private schools with enrollment opening</li>
						<li>• Companies with upcoming hiring batch</li>
						<li>• LGU with budget about to expire</li>
						<li>• Anyone with a deadline in 30 days</li>
					</ul>
				</CardContent>
			</Card>
			<Card class="border-l-4 border-l-red-500">
				<CardContent class="pt-4">
					<p class="font-bold text-red-600">❌ DEPRIORITIZE</p>
					<ul class="text-sm mt-2 space-y-1">
						<li>• Price shoppers (under ₱30/card expectation)</li>
						<li>• "Rush" orders under 20 cards</li>
						<li>• Unclear requirements after 2 meetings</li>
						<li>• Requests for free samples without P.O.</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	</section>

	<!-- SECTION 3: SALES PIPELINE -->
	<section id="pipeline" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">III. Sales Pipeline & Follow-up Cadence</h2>

		<div class="grid md:grid-cols-5 gap-2 mb-6">
			<Card class="border-t-4 border-t-gray-400">
				<CardContent class="pt-4 text-center">
					<p class="text-2xl mb-2">📞</p>
					<p class="font-bold text-sm">1. Initial Contact</p>
					<p class="text-xs text-muted-foreground">Cold call / Inbound</p>
				</CardContent>
			</Card>
			<Card class="border-t-4 border-t-blue-400">
				<CardContent class="pt-4 text-center">
					<p class="text-2xl mb-2">🔍</p>
					<p class="font-bold text-sm">2. Discovery</p>
					<p class="text-xs text-muted-foreground">Needs assessment</p>
				</CardContent>
			</Card>
			<Card class="border-t-4 border-t-purple-400">
				<CardContent class="pt-4 text-center">
					<p class="text-2xl mb-2">🎬</p>
					<p class="font-bold text-sm">3. Demo</p>
					<p class="text-xs text-muted-foreground">Show samples + app</p>
				</CardContent>
			</Card>
			<Card class="border-t-4 border-t-amber-400">
				<CardContent class="pt-4 text-center">
					<p class="text-2xl mb-2">📝</p>
					<p class="font-bold text-sm">4. Proposal</p>
					<p class="text-xs text-muted-foreground">Quote + terms</p>
				</CardContent>
			</Card>
			<Card class="border-t-4 border-t-green-500">
				<CardContent class="pt-4 text-center">
					<p class="text-2xl mb-2">🤝</p>
					<p class="font-bold text-sm">5. Close</p>
					<p class="text-xs text-muted-foreground">DP collected</p>
				</CardContent>
			</Card>
		</div>

		<h3 class="font-bold text-lg mb-3">Follow-up Cadence</h3>
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="text-left py-2 px-4">Stage</th>
						<th class="text-left py-2 px-4">Action</th>
						<th class="text-left py-2 px-4">Follow-up</th>
						<th class="text-left py-2 px-4">If No Response</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b">
						<td class="py-2 px-4">Initial Contact</td>
						<td class="py-2 px-4">Call → Schedule meeting</td>
						<td class="py-2 px-4">SMS same day</td>
						<td class="py-2 px-4">Call again in 2 days</td>
					</tr>
					<tr class="border-b bg-muted/30">
						<td class="py-2 px-4">Post-Discovery</td>
						<td class="py-2 px-4">Send summary email</td>
						<td class="py-2 px-4">Within 24 hours</td>
						<td class="py-2 px-4">Call Day 3, then Day 7</td>
					</tr>
					<tr class="border-b">
						<td class="py-2 px-4">Post-Demo</td>
						<td class="py-2 px-4">Send quote same day</td>
						<td class="py-2 px-4">Call Day 2</td>
						<td class="py-2 px-4">Call Day 5, offer sweetener</td>
					</tr>
					<tr class="border-b bg-muted/30">
						<td class="py-2 px-4">Proposal Sent</td>
						<td class="py-2 px-4">"Did you receive?"</td>
						<td class="py-2 px-4">Day 1, 3, 7</td>
						<td class="py-2 px-4">Day 14: Move to nurture</td>
					</tr>
					<tr class="border-b">
						<td class="py-2 px-4">Stalled Deal</td>
						<td class="py-2 px-4">Check-in monthly</td>
						<td class="py-2 px-4">Monthly SMS</td>
						<td class="py-2 px-4">Re-engage with new offer</td>
					</tr>
				</tbody>
			</table>
		</div>

		<div class="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded text-sm">
			<strong>⚠️ The 3-Strike Rule:</strong> If a prospect doesn't respond after 3 follow-up attempts across 14 days, move them to "nurture" status. Don't waste time chasing ghosts.
		</div>
	</section>

	<!-- SECTION 4: PAYMENT TERMS -->
	<section id="payment" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">IV. Payment Terms & Collection</h2>

		<div class="grid md:grid-cols-2 gap-6 mb-6">
			<Card class="border-2 border-green-300 dark:border-green-700">
				<CardHeader class="bg-green-50 dark:bg-green-900/20">
					<CardTitle>💵 Standard Payment Terms</CardTitle>
				</CardHeader>
				<CardContent class="pt-4">
					<table class="w-full text-sm">
						<tbody>
							<tr class="border-b">
								<td class="py-2 font-bold">Downpayment</td>
								<td class="py-2 text-right">50% minimum</td>
							</tr>
							<tr class="border-b">
								<td class="py-2 font-bold">Balance Due</td>
								<td class="py-2 text-right">Upon completion / pickup</td>
							</tr>
							<tr class="border-b">
								<td class="py-2 font-bold">Rush Orders</td>
								<td class="py-2 text-right">100% upfront</td>
							</tr>
							<tr class="border-b">
								<td class="py-2 font-bold">Corporate (w/ P.O.)</td>
								<td class="py-2 text-right">NET 15 after delivery</td>
							</tr>
							<tr>
								<td class="py-2 font-bold">Government/LGU</td>
								<td class="py-2 text-right">NET 30 (with signed MOU)</td>
							</tr>
						</tbody>
					</table>
				</CardContent>
			</Card>

			<Card class="border-2 border-red-300 dark:border-red-700">
				<CardHeader class="bg-red-50 dark:bg-red-900/20">
					<CardTitle>⚠️ Collection Protocols</CardTitle>
				</CardHeader>
				<CardContent class="pt-4 text-sm">
					<h4 class="font-bold mb-2">When Balance is Overdue:</h4>
					<ol class="list-decimal pl-4 space-y-2">
						<li><strong>Day 1:</strong> Friendly reminder call</li>
						<li><strong>Day 7:</strong> Written reminder (SMS + email)</li>
						<li><strong>Day 14:</strong> Final notice with consequence warning</li>
						<li><strong>Day 21:</strong> Hold future services, escalate to management</li>
						<li><strong>Day 30:</strong> Small claims court preparation</li>
					</ol>
					<div class="mt-4 p-2 bg-red-100 dark:bg-red-900/30 rounded text-xs">
						<strong>Prevention:</strong> Never release cards without full payment unless client has credit terms in writing.
					</div>
				</CardContent>
			</Card>
		</div>

		<h3 class="font-bold text-lg mb-3">Accepted Payment Methods</h3>
		<div class="grid grid-cols-2 md:grid-cols-5 gap-3">
			<div class="p-3 bg-muted rounded text-center text-sm">
				<p class="font-bold">💵 Cash</p>
				<p class="text-xs text-muted-foreground">Preferred</p>
			</div>
			<div class="p-3 bg-muted rounded text-center text-sm">
				<p class="font-bold">🏦 Bank Transfer</p>
				<p class="text-xs text-muted-foreground">BDO / BPI / UnionBank</p>
			</div>
			<div class="p-3 bg-muted rounded text-center text-sm">
				<p class="font-bold">📱 GCash</p>
				<p class="text-xs text-muted-foreground">₱50k limit/day</p>
			</div>
			<div class="p-3 bg-muted rounded text-center text-sm">
				<p class="font-bold">🅿️ PayMaya</p>
				<p class="text-xs text-muted-foreground">Alternate e-wallet</p>
			</div>
			<div class="p-3 bg-muted rounded text-center text-sm">
				<p class="font-bold">📝 Check</p>
				<p class="text-xs text-muted-foreground">+3 days clearance</p>
			</div>
		</div>
	</section>

	<!-- SECTION 5: OBJECTION HANDLING -->
	<section id="objections" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">V. Quick Objection Responses</h2>
		<p class="text-muted-foreground mb-4">Memorize these. Deliver with confidence. For detailed LGU objections, see <a href="/admin/docs/lgu-strategy" class="text-blue-600 underline">LGU Strategy</a>.</p>

		<div class="space-y-3">
			<Card>
				<CardContent class="pt-4">
					<p class="font-bold text-red-600">"Your price is too high."</p>
					<p class="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded mt-2">
						<strong>→</strong> "Our cards last 5 years. Cheap laminated cards need replacement every 6 months—that's actually MORE expensive per year. Plus ours have QR verification included."
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="pt-4">
					<p class="font-bold text-red-600">"We already have a supplier."</p>
					<p class="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded mt-2">
						<strong>→</strong> "Great! Can they verify cards remotely? Deactivate lost cards instantly? We're not just a supplier—we're a digital platform. Let me show you a quick demo."
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="pt-4">
					<p class="font-bold text-red-600">"50% downpayment is too much."</p>
					<p class="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded mt-2">
						<strong>→</strong> "We use premium materials that we source specifically for your order. The downpayment ensures we can deliver on time without compromise. It's standard for custom work."
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="pt-4">
					<p class="font-bold text-red-600">"Can you give a discount?"</p>
					<p class="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded mt-2">
						<strong>→</strong> "Our pricing is already volume-discounted. If you can increase the order to [next tier], I can give you a better rate. Otherwise, I can throw in free lanyards or encoding."
					</p>
				</CardContent>
			</Card>
			<Card>
				<CardContent class="pt-4">
					<p class="font-bold text-red-600">"We need it by [impossible deadline]."</p>
					<p class="text-sm bg-green-50 dark:bg-green-900/20 p-3 rounded mt-2">
						<strong>→</strong> "I can deliver [X cards] by then, with the rest in [Y days]. Quality requires proper curing time. Would a partial delivery work?"
					</p>
				</CardContent>
			</Card>
		</div>
	</section>

	<!-- SECTION 6: CONTRACT & DOCUMENTATION -->
	<section id="contracts" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">VI. Contract & Documentation Checklist</h2>

		<div class="grid md:grid-cols-2 gap-6">
			<Card>
				<CardHeader class="bg-muted">
					<CardTitle class="text-lg">📋 Before Starting Production</CardTitle>
				</CardHeader>
				<CardContent class="pt-4">
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>Signed quotation or P.O.</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>50% downpayment received (or 100% for rush)</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>Final design approved in writing (email/chat)</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>Complete data file (names, photos, IDs)</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>Client logo in high resolution</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>Delivery date confirmed</span>
						</li>
					</ul>
				</CardContent>
			</Card>

			<Card>
				<CardHeader class="bg-muted">
					<CardTitle class="text-lg">📦 Before Releasing Cards</CardTitle>
				</CardHeader>
				<CardContent class="pt-4">
					<ul class="space-y-2 text-sm">
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>Full payment received and confirmed</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>Quality check completed (all cards inspected)</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>Card count verified and documented</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>Delivery receipt prepared</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>Client signed acknowledgment</span>
						</li>
						<li class="flex items-start gap-2">
							<span class="text-green-500">☐</span>
							<span>SaaS account activated (if applicable)</span>
						</li>
					</ul>
				</CardContent>
			</Card>
		</div>

		<div class="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
			<h4 class="font-bold mb-2">💼 For Corporate/LGU Clients (Credit Terms)</h4>
			<p class="text-sm mb-3">Additional requirements when offering NET 15/30:</p>
			<ul class="text-sm space-y-1">
				<li>• Signed Service Agreement with payment terms</li>
				<li>• Official Purchase Order from their organization</li>
				<li>• Contact details for Accounts Payable</li>
				<li>• Company verification (SEC/DTI registration check)</li>
			</ul>
		</div>
	</section>

	<footer class="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
		<p>Kanaya Sales Operations • Internal Use Only</p>
		<p class="mt-2"><a href="/admin/docs" class="underline">← Back to Docs Hub</a></p>
	</footer>
</div>
