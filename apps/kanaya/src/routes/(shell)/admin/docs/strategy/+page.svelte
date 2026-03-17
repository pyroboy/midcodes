<script lang="ts">
	import type { PageData } from './$types';
	import { Card, CardContent, CardHeader, CardTitle } from "$lib/components/ui/card";

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Growth Strategy & Business Plan | Kanaya Admin</title>
</svelte:head>

<div class="container mx-auto py-8 max-w-5xl">
	<header class="mb-8">
		<h1 class="text-4xl font-bold mb-2">MASTER GROWTH STRATEGY</h1>
		<p class="text-muted-foreground">Executive Plan • Phase: Zero Capital Startup to Recurring Revenue</p>
		<div class="inline-block mt-3 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-semibold">
			Strategic Document | January 2026
		</div>
	</header>

	<nav class="mb-10 p-4 bg-muted rounded-lg">
		<h2 class="text-lg font-bold mb-3">Battle Plan Contents</h2>
		<ol class="grid md:grid-cols-2 gap-2 text-sm">
			<li><a href="#phase1" class="text-blue-600 hover:underline">1. Phase 1: The "Flip" (Zero Capital)</a></li>
			<li><a href="#products" class="text-blue-600 hover:underline">2. Product Catalog (Source of Truth)</a></li>
			<li><a href="#revenue" class="text-blue-600 hover:underline">3. Recurring Revenue (SaaS Subscriptions)</a></li>
			<li><a href="#targets" class="text-blue-600 hover:underline">4. Target Clients (Tagbilaran)</a></li>
			<li><a href="#lgu" class="text-blue-600 hover:underline">5. LGU Market (PWD/Senior/Barangay)</a></li>
			<li><a href="#tactic" class="text-blue-600 hover:underline">6. The "Batch & Roll" Tactic</a></li>
			<li><a href="#pitch" class="text-blue-600 hover:underline">7. The "Trojan Horse" Pitch</a></li>
		</ol>
	</nav>

	<!-- PHASE 1: THE FLIP -->
	<section id="phase1" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">I. Phase 1: The "Flip" Strategy</h2>
		<Card>
			<CardHeader class="bg-green-50 dark:bg-green-900/20">
				<CardTitle>Objective: Acquire Production Capability</CardTitle>
			</CardHeader>
			<CardContent class="pt-4">
				<p class="mb-4">
					<strong>Goal:</strong> Generate ₱18,000 cash to buy the Epson L8050 printer without using personal savings.
				</p>

				<h4 class="font-bold mb-2">The Execution Steps:</h4>
				<ol class="list-decimal pl-4 space-y-3 text-sm">
					<li><strong>Secure the Contract:</strong> Close a deal for 300 IDs @ ₱120 (Total ₱36k) or similar volume.</li>
					<li><strong>The Trigger:</strong> Demand a <strong>50% Downpayment (₱18k)</strong>. No work begins without this.</li>
					<li>
						<strong>Step 2.5: The Bridge Protocol:</strong>
						<div class="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border-l-4 border-blue-500">
							<strong>Critical Delay Check:</strong> Since checks take 3 days to clear and shipping for a new printer takes 5 days, you cannot wait to start production.
							<br /><br />
							<strong>Action:</strong> Outsource the <em>first 100 cards</em> to a local partner (Supplier 3) immediately. You will lose margin on these cards, but it fulfills the deadline while your in-house capacity is being set up.
						</div>
					</li>
					<li>
						<strong>The Flip:</strong>
						<ul class="list-disc pl-4 mt-1">
							<li>Take the ₱18k cash immediately to the store once cleared.</li>
							<li>Buy the Printer (₱16k) + Ink/PVC (₱2k).</li>
							<li><strong>Stop Outsourcing.</strong> Print the remaining order in-house.</li>
						</ul>
					</li>
					<li><strong>The Profit:</strong> The remaining 50% payment (₱18k) becomes pure profit.</li>
				</ol>
			</CardContent>
		</Card>
	</section>

	<!-- PRODUCT CATALOG (SOURCE OF TRUTH) -->
	<section id="products" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">II. Product Catalog (Source of Truth)</h2>
		<p class="text-sm text-muted-foreground mb-4">Reference: <a href="/admin/docs/product-catalog" class="text-blue-600 underline">Product Catalog Documentation</a></p>
		
		<div class="grid md:grid-cols-2 gap-6 mb-6">
			<div>
				<h3 class="font-bold text-lg mb-3">Primary Product Categories</h3>
				<div class="space-y-2">
					<div class="p-3 bg-muted rounded-lg flex justify-between items-center">
						<span><strong>1. Basic Cards</strong> — Laminated, no tech</span>
						<span class="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">BASIC</span>
					</div>
					<div class="p-3 bg-muted rounded-lg flex justify-between items-center">
						<span><strong>2. Thermal Cards</strong> — ATM-quality direct print</span>
						<span class="text-xs bg-blue-100 dark:bg-blue-900/30 px-2 py-1 rounded">THERM-*</span>
					</div>
					<div class="p-3 bg-muted rounded-lg flex justify-between items-center">
						<span><strong>3. UV Printed Cards</strong> — Premium finish</span>
						<span class="text-xs bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">UV-*</span>
					</div>
					<div class="p-3 bg-muted rounded-lg flex justify-between items-center">
						<span><strong>4. Digital Business Cards</strong> — NFC smart cards</span>
						<span class="text-xs bg-purple-100 dark:bg-purple-900/30 px-2 py-1 rounded">DBC-*</span>
					</div>
					<div class="p-3 bg-muted rounded-lg flex justify-between items-center">
						<span><strong>5. Lanyards</strong> — Printed & accessories</span>
						<span class="text-xs bg-amber-100 dark:bg-amber-900/30 px-2 py-1 rounded">LAN-*</span>
					</div>
					<div class="p-3 bg-muted rounded-lg flex justify-between items-center">
						<span><strong>6. Attendance Systems</strong> — Hardware bundles</span>
						<span class="text-xs bg-green-100 dark:bg-green-900/30 px-2 py-1 rounded">ATT-*</span>
					</div>
				</div>
			</div>
			
			<div>
				<h3 class="font-bold text-lg mb-3">Card Types Available</h3>
				<div class="grid grid-cols-2 gap-3">
					<Card>
						<CardContent class="pt-4 text-center">
							<p class="text-2xl mb-1">📇</p>
							<p class="font-bold">Basic</p>
							<p class="text-xs text-muted-foreground">Visual ID only</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent class="pt-4 text-center">
							<p class="text-2xl mb-1">📱</p>
							<p class="font-bold">QR</p>
							<p class="text-xs text-muted-foreground">Scannable verification</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent class="pt-4 text-center">
							<p class="text-2xl mb-1">📲</p>
							<p class="font-bold">NFC</p>
							<p class="text-xs text-muted-foreground">Tap-to-verify</p>
						</CardContent>
					</Card>
					<Card>
						<CardContent class="pt-4 text-center">
							<p class="text-2xl mb-1">📡</p>
							<p class="font-bold">RFID</p>
							<p class="text-xs text-muted-foreground">Long-range terminals</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>

		<div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg text-sm">
			<strong>⚠️ Printing Compatibility:</strong> Sandwich/laminated method CANNOT print on pre-embedded NFC/RFID cards. Those require Thermal or UV printers.
		</div>
	</section>

	<!-- RECURRING REVENUE (SAAS SUBSCRIPTIONS) -->
	<section id="revenue" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">III. Recurring Revenue (SaaS Subscriptions)</h2>
		<p class="text-sm text-muted-foreground mb-4">Reference: <a href="/admin/docs/attendance-pricing" class="text-blue-600 underline">Attendance System Pricing Documentation</a></p>
		
		<div class="grid md:grid-cols-4 gap-4 mb-6">
			<Card class="border-l-4 border-l-blue-500">
				<CardContent class="pt-4 text-center">
					<p class="text-sm text-muted-foreground">QR Attendance</p>
					<p class="text-3xl font-bold text-blue-600">₱10-15</p>
					<p class="text-xs">/user/year</p>
				</CardContent>
			</Card>
			<Card class="border-l-4 border-l-green-500">
				<CardContent class="pt-4 text-center">
					<p class="text-sm text-muted-foreground">RFID Attendance</p>
					<p class="text-3xl font-bold text-green-600">₱15-25</p>
					<p class="text-xs">/user/year</p>
				</CardContent>
			</Card>
			<Card class="border-l-4 border-l-purple-500">
				<CardContent class="pt-4 text-center">
					<p class="text-sm text-muted-foreground">Biometric</p>
					<p class="text-3xl font-bold text-purple-600">₱25-50</p>
					<p class="text-xs">/user/year</p>
				</CardContent>
			</Card>
			<Card class="border-l-4 border-l-amber-500">
				<CardContent class="pt-4 text-center">
					<p class="text-sm text-muted-foreground">SMS Add-on</p>
					<p class="text-3xl font-bold text-amber-600">₱1.00</p>
					<p class="text-xs">/SMS (separate)</p>
				</CardContent>
			</Card>
		</div>

		<div class="overflow-x-auto mb-6">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="text-left py-3 px-4">Revenue Stream</th>
						<th class="text-left py-3 px-4">Type</th>
						<th class="text-right py-3 px-4">Example (300 users)</th>
						<th class="text-left py-3 px-4">Notes</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b">
						<td class="py-3 px-4 font-bold">ID Card Sales</td>
						<td class="py-3 px-4">One-time</td>
						<td class="py-3 px-4 text-right">₱36,000</td>
						<td class="py-3 px-4 text-muted-foreground">₱120/card × 300</td>
					</tr>
					<tr class="border-b bg-green-50 dark:bg-green-900/10">
						<td class="py-3 px-4 font-bold">SaaS Subscription</td>
						<td class="py-3 px-4">Annual Recurring</td>
						<td class="py-3 px-4 text-right font-bold text-green-600">₱6,000/year</td>
						<td class="py-3 px-4 text-muted-foreground">₱20/user × 300</td>
					</tr>
					<tr class="border-b">
						<td class="py-3 px-4 font-bold">Hardware Bundle</td>
						<td class="py-3 px-4">One-time</td>
						<td class="py-3 px-4 text-right">₱16,500-40,000</td>
						<td class="py-3 px-4 text-muted-foreground">Tablet + reader bundles</td>
					</tr>
					<tr class="border-b bg-amber-50 dark:bg-amber-900/10">
						<td class="py-3 px-4 font-bold">SMS Revenue</td>
						<td class="py-3 px-4">Usage-based</td>
						<td class="py-3 px-4 text-right font-bold text-amber-600">₱52,800/year</td>
						<td class="py-3 px-4 text-muted-foreground">₱0.40 profit × 132k SMS</td>
					</tr>
				</tbody>
			</table>
		</div>

		<Card class="border-2 border-green-300 dark:border-green-700">
			<CardHeader class="bg-green-50 dark:bg-green-900/20">
				<CardTitle>💰 Revenue Example: 300-User School</CardTitle>
			</CardHeader>
			<CardContent class="pt-4">
				<div class="grid md:grid-cols-2 gap-6">
					<div>
						<h4 class="font-bold mb-2">Year 1 Revenue</h4>
						<ul class="text-sm space-y-1">
							<li>• Hardware: ₱22,000</li>
							<li>• Cards (300 × ₱120): ₱36,000</li>
							<li>• SaaS (₱20/user): ₱6,000</li>
							<li>• SMS profit: ₱52,800</li>
						</ul>
						<p class="mt-3 text-lg font-bold text-green-600">Total Year 1: ₱116,800</p>
					</div>
					<div>
						<h4 class="font-bold mb-2">Year 2+ Recurring</h4>
						<ul class="text-sm space-y-1">
							<li>• SaaS renewal: ₱6,000</li>
							<li>• SMS profit: ₱52,800</li>
							<li>• Replacement cards: ~₱3,000</li>
						</ul>
						<p class="mt-3 text-lg font-bold text-blue-600">Annual Recurring: ₱61,800</p>
					</div>
				</div>
			</CardContent>
		</Card>
	</section>

	<!-- TARGET CLIENTS -->
	<section id="targets" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">IV. Target Market Segments</h2>

		<div class="grid md:grid-cols-3 gap-6 mb-6">
			<!-- Schools -->
			<Card>
				<CardHeader class="bg-blue-50 dark:bg-blue-900/20">
					<CardTitle class="flex items-center gap-2">🎓 Schools & Universities</CardTitle>
				</CardHeader>
				<CardContent class="pt-4 text-sm">
					<p class="text-muted-foreground mb-3">High volume, recurring revenue potential.</p>
					<ul class="space-y-1">
						<li>• Private Pre-schools (fetcher cards)</li>
						<li>• Public Schools (bulk orders)</li>
						<li>• Colleges & Universities</li>
						<li>• Technical/Vocational schools</li>
					</ul>
					<div class="mt-3 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs">
						<strong>SaaS Potential:</strong> ₱10-20/student/year
					</div>
				</CardContent>
			</Card>

			<!-- HR / Offices -->
			<Card>
				<CardHeader class="bg-green-50 dark:bg-green-900/20">
					<CardTitle class="flex items-center gap-2">🏢 HR & Business Offices</CardTitle>
				</CardHeader>
				<CardContent class="pt-4 text-sm">
					<p class="text-muted-foreground mb-3">Professional IDs + attendance tracking.</p>
					<ul class="space-y-1">
						<li>• BPO/Call Centers</li>
						<li>• Corporate offices</li>
						<li>• SME business owners</li>
						<li>• Co-working spaces</li>
					</ul>
					<div class="mt-3 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs">
						<strong>SaaS Potential:</strong> ₱25-50/staff/year
					</div>
				</CardContent>
			</Card>

			<!-- Gyms & Fitness -->
			<Card>
				<CardHeader class="bg-purple-50 dark:bg-purple-900/20">
					<CardTitle class="flex items-center gap-2">💪 Gyms & Fitness Centers</CardTitle>
				</CardHeader>
				<CardContent class="pt-4 text-sm">
					<p class="text-muted-foreground mb-3">Membership cards with access control.</p>
					<ul class="space-y-1">
						<li>• Local gyms & CrossFit boxes</li>
						<li>• Swimming pools & clubs</li>
						<li>• Martial arts studios</li>
						<li>• Sports complexes</li>
					</ul>
					<div class="mt-3 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs">
						<strong>Key Sell:</strong> RFID check-in + expiry tracking
					</div>
				</CardContent>
			</Card>

			<!-- Factories & Construction -->
			<Card>
				<CardHeader class="bg-amber-50 dark:bg-amber-900/20">
					<CardTitle class="flex items-center gap-2">🏭 Factories & Construction</CardTitle>
				</CardHeader>
				<CardContent class="pt-4 text-sm">
					<p class="text-muted-foreground mb-3">Worker access, safety compliance.</p>
					<ul class="space-y-1">
						<li>• Manufacturing plants</li>
						<li>• Construction sites (Panglao)</li>
						<li>• Warehouses & logistics</li>
						<li>• Food processing plants</li>
					</ul>
					<div class="mt-3 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs">
						<strong>Key Sell:</strong> Gate terminals + biometric
					</div>
				</CardContent>
			</Card>

			<!-- Government -->
			<Card>
				<CardHeader class="bg-red-50 dark:bg-red-900/20">
					<CardTitle class="flex items-center gap-2">🏛️ Government & LGUs</CardTitle>
				</CardHeader>
				<CardContent class="pt-4 text-sm">
					<p class="text-muted-foreground mb-3">Mandated IDs, anti-counterfeiting.</p>
					<ul class="space-y-1">
						<li>• OSCA (Senior Citizen IDs)</li>
						<li>• PDAO (PWD IDs)</li>
						<li>• Barangay IDs</li>
						<li>• Government employee IDs</li>
					</ul>
					<div class="mt-3 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs">
						<strong>Key Sell:</strong> QR verification + hologram
					</div>
				</CardContent>
			</Card>

			<!-- Events & Hospitality -->
			<Card>
				<CardHeader class="bg-pink-50 dark:bg-pink-900/20">
					<CardTitle class="flex items-center gap-2">🎪 Events & Hospitality</CardTitle>
				</CardHeader>
				<CardContent class="pt-4 text-sm">
					<p class="text-muted-foreground mb-3">Access control, VIP management.</p>
					<ul class="space-y-1">
						<li>• Weddings & social events</li>
						<li>• Conferences & seminars</li>
						<li>• Hotels & resorts (staff IDs)</li>
						<li>• Festivals & concerts</li>
					</ul>
					<div class="mt-3 p-2 bg-green-100 dark:bg-green-900/20 rounded text-xs">
						<strong>Key Sell:</strong> Quick visitor check-in
					</div>
				</CardContent>
			</Card>
		</div>

		<!-- Priority Tiers -->
		<h3 class="font-bold text-lg mb-3">Priority Tiers (Tagbilaran Focus)</h3>
		<div class="grid md:grid-cols-2 gap-6">
			<Card class="border-2 border-amber-300 dark:border-amber-700">
				<CardHeader class="bg-amber-50 dark:bg-amber-900/20">
					<CardTitle>⭐ Tier 1: "Cash Ready" (High Priority)</CardTitle>
				</CardHeader>
				<CardContent class="pt-4 text-sm">
					<p class="text-muted-foreground mb-3">They pay upfront, fast decisions.</p>
					<ul class="space-y-2">
						<li><strong>Private Pre-schools:</strong> DML Montessori, VDT ALC</li>
						<li><strong>Construction Firms:</strong> Panglao development projects</li>
						<li><strong>Local Gyms:</strong> Fitness centers, martial arts</li>
						<li><strong>SME Owners:</strong> Restaurants, retail with 10+ staff</li>
						<li><strong>Events:</strong> Weddings, corporate gatherings</li>
					</ul>
				</CardContent>
			</Card>

			<Card class="border-2 border-blue-300 dark:border-blue-700">
				<CardHeader class="bg-blue-50 dark:bg-blue-900/20">
					<CardTitle>📊 Tier 2: "Volume Kings" (High Volume)</CardTitle>
				</CardHeader>
				<CardContent class="pt-4 text-sm">
					<p class="text-muted-foreground mb-3">Bureaucratic process, but massive orders.</p>
					<ul class="space-y-2">
						<li><strong>DCPNHS (City High):</strong> 3,000+ students</li>
						<li><strong>BIT / PMI Colleges:</strong> Tech-forward institutions</li>
						<li><strong>LGU Contracts:</strong> PWD/Senior ID programs</li>
						<li><strong>BPO Centers:</strong> 100+ employee offices</li>
						<li><strong>Provincial Gov:</strong> Multi-barangay rollouts</li>
					</ul>
				</CardContent>
			</Card>
		</div>
	</section>

	<!-- LGU MARKET -->
	<section id="lgu" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">V. LGU Market Strategy (PWD/Senior/Barangay)</h2>
		<p class="text-sm text-muted-foreground mb-4">Full playbook: <a href="/admin/docs/lgu-strategy" class="text-blue-600 underline">LGU Market Penetration Strategy</a></p>
		
		<div class="grid md:grid-cols-3 gap-4 mb-6">
			<Card class="border-l-4 border-l-purple-500">
				<CardContent class="pt-4">
					<p class="text-3xl font-bold text-purple-600">46M+</p>
					<p class="text-sm text-muted-foreground">Senior Citizens & PWDs in the Philippines</p>
				</CardContent>
			</Card>
			<Card class="border-l-4 border-l-green-500">
				<CardContent class="pt-4">
					<p class="text-3xl font-bold text-green-600">42,000+</p>
					<p class="text-sm text-muted-foreground">Barangays requiring ID systems</p>
				</CardContent>
			</Card>
			<Card class="border-l-4 border-l-blue-500">
				<CardContent class="pt-4">
					<p class="text-3xl font-bold text-blue-600">₱150-300</p>
					<p class="text-sm text-muted-foreground">Price point per premium verified ID</p>
				</CardContent>
			</Card>
		</div>

		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b bg-muted/50">
						<th class="text-left py-3 px-4">Package</th>
						<th class="text-left py-3 px-4">Features</th>
						<th class="text-right py-3 px-4">Price/Card</th>
						<th class="text-left py-3 px-4">Best For</th>
					</tr>
				</thead>
				<tbody>
					<tr class="border-b">
						<td class="py-3 px-4 font-bold">Basic</td>
						<td class="py-3 px-4">Laminated PVC + QR Code</td>
						<td class="py-3 px-4 text-right">₱80-100</td>
						<td class="py-3 px-4">Budget-conscious LGUs</td>
					</tr>
					<tr class="border-b bg-green-50 dark:bg-green-900/10">
						<td class="py-3 px-4 font-bold">Standard ⭐</td>
						<td class="py-3 px-4">Thermal PVC + QR + UV Security</td>
						<td class="py-3 px-4 text-right">₱150-180</td>
						<td class="py-3 px-4">Most municipalities</td>
					</tr>
					<tr class="border-b">
						<td class="py-3 px-4 font-bold">Premium</td>
						<td class="py-3 px-4">Thermal + QR + NFC + Hologram</td>
						<td class="py-3 px-4 text-right">₱250-300</td>
						<td class="py-3 px-4">Cities, fraud-prone areas</td>
					</tr>
					<tr class="border-b bg-purple-50 dark:bg-purple-900/10">
						<td class="py-3 px-4 font-bold">Enterprise</td>
						<td class="py-3 px-4">UV Print + NFC + Full System</td>
						<td class="py-3 px-4 text-right">₱400+</td>
						<td class="py-3 px-4">Provincial contracts</td>
					</tr>
				</tbody>
			</table>
		</div>
	</section>

	<!-- THE BATCH & ROLL TACTIC -->
	<section id="tactic" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">VI. The "Batch & Roll" Tactic (Public Schools)</h2>
		
		<div class="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg mb-4">
			<strong>⚠️ Problem:</strong> You cannot afford materials for 3,000 students (₱150k order) upfront.<br />
			<strong>✅ Solution:</strong> Break the order into bite-sized pieces.
		</div>

		<ol class="list-decimal pl-6 space-y-3 text-sm">
			<li><strong>Do not accept the full P.O. at once.</strong></li>
			<li>
				<strong>Contract for Grade 7 Only (500 students):</strong>
				<ul class="list-disc pl-4 mt-1">
					<li>Cost to Client: ₱25,000.</li>
					<li>Required Downpayment: ₱12,500.</li>
					<li><em>Manageable Risk. Fast Delivery (2-3 days).</em></li>
				</ul>
			</li>
			<li><strong>Roll Over:</strong> Use the profit from Grade 7 to fund Grade 8 materials.</li>
			<li><strong>Repeat:</strong> Until all grade levels are complete.</li>
		</ol>
	</section>

	<!-- THE TROJAN HORSE PITCH -->
	<section id="pitch" class="mb-10">
		<h2 class="text-2xl font-bold mb-4 border-b pb-2">VII. The "Trojan Horse" Sales Pitch</h2>
		<p class="text-muted-foreground mb-6">We do not sell plastic. We sell the SYSTEM. Customize your pitch per market:</p>

		<div class="grid gap-4">
			<!-- Schools -->
			<Card class="border-l-4 border-l-blue-500">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">🎓 For School Principals / PTA:</CardTitle>
				</CardHeader>
				<CardContent class="italic text-sm">
					<p class="mb-3">"Ma'am, buying a plastic ID is a waste of money. It fades, it breaks, and it's easy to fake.</p>
					<p class="mb-3">
						<strong>Kanaya</strong> offers a Digital Safety System. When a student loses this ID, you don't need to wait 2 weeks. I
						can reprint it in <strong>1 hour</strong> because the data is secure in our cloud.
					</p>
					<p class="mb-3">
						For just ₱20 per student per year, you get attendance tracking, SMS notifications to parents, and instant verification. 
						The ID is just the entry point—the real value is the <strong>subscription platform</strong>.
					</p>
					<p>
						Plus, with our 'Batch & Roll' program, the PTA doesn't need to release huge funds. We do it section by section."
					</p>
				</CardContent>
			</Card>

			<!-- HR / Business Owners -->
			<Card class="border-l-4 border-l-green-500">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">🏢 For HR Managers / Business Owners:</CardTitle>
				</CardHeader>
				<CardContent class="italic text-sm">
					<p class="mb-3">"Sir/Ma'am, how do you currently track attendance? Manual logbook? Bilog-bilog system?</p>
					<p class="mb-3">
						With <strong>Kanaya</strong>, your employees tap their ID and it automatically logs time-in/out. No more buddy-punching. 
						No more disputes at payroll time. Everything is recorded with <strong>timestamp and photo</strong>.
					</p>
					<p class="mb-3">
						The hardware is a one-time cost of ₱16,500. The subscription? Just ₱25 per employee per year. 
						That's less than ₱3 per month per person—cheaper than a cup of coffee.
					</p>
					<p>
						And if an employee leaves? Deactivate their ID instantly from your phone. <strong>Full control, zero hassle.</strong>"
					</p>
				</CardContent>
			</Card>

			<!-- Gyms -->
			<Card class="border-l-4 border-l-purple-500">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">💪 For Gym Owners / Fitness Centers:</CardTitle>
				</CardHeader>
				<CardContent class="italic text-sm">
					<p class="mb-3">"Boss, are you still using paper logbooks for member check-ins? Or worse, relying on memory?</p>
					<p class="mb-3">
						We have two options: <strong>QR membership cards</strong> for budget-conscious gyms—members show their card, 
						you scan with your phone, done. Or <strong>RFID cards</strong> for a more premium setup—members tap and enter automatically.
					</p>
					<p class="mb-3">
						Either way, you'll see exactly who's using the gym, when they came, and how often. 
						Plus, the system <strong>automatically flags expired memberships</strong>—no more awkward renewal conversations. 
						The card knows. The system alerts you. Simple.
					</p>
					<p class="mb-3">
						<strong>QR cards</strong> start at ₱80 each with your gym branding. <strong>RFID cards</strong> are ₱150. 
						QR terminal bundle is ₱16,500. RFID bundle is ₱19,000.
					</p>
					<p>
						<strong>Pays for itself in 3 months</strong> from reduced membership fraud and better renewal tracking."
					</p>
				</CardContent>
			</Card>

			<!-- Government -->
			<Card class="border-l-4 border-l-red-500">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">🏛️ For LGU / Government Officials:</CardTitle>
				</CardHeader>
				<CardContent class="italic text-sm">
					<p class="mb-3">"Sir/Ma'am, may I ask—how many cases of fake PWD or Senior IDs do you encounter monthly?</p>
					<p class="mb-3">
						Our cards have <strong>QR verification</strong>—any establishment can scan and confirm if the ID is real and active. 
						If it's lost or stolen, you can deactivate it remotely. No police report needed.
					</p>
					<p class="mb-3">
						The UV security mark is invisible—only shows under blacklight. <strong>Impossible to photocopy</strong>. 
						Plus, the hologram overlay shows any tampering immediately.
					</p>
					<p>
						We can do a <strong>pilot program</strong>—50 free cards for your office to evaluate. If you're satisfied, 
						we proceed with the full contract. Zero risk."
					</p>
				</CardContent>
			</Card>

			<!-- Construction / Factory -->
			<Card class="border-l-4 border-l-amber-500">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">🏭 For Construction / Factory Managers:</CardTitle>
				</CardHeader>
				<CardContent class="italic text-sm">
					<p class="mb-3">"Engineer, how do you track who's on-site right now? What if there's an emergency?</p>
					<p class="mb-3">
						With our <strong>gate terminal system</strong>, every worker taps in and out. You have a real-time roster 
						of everyone on-site. Perfect for emergency headcounts and <strong>DOLE compliance</strong>.
					</p>
					<p class="mb-3">
						Cards are durable PVC—waterproof, doesn't fade in the sun. Built for construction environments. 
						We can even add <strong>different colors per contractor</strong> for easy visual identification.
					</p>
					<p>
						Terminal bundle starts at ₱19,000. Cards at ₱120 each. For a 100-worker site, you're looking at <strong>₱31k total setup</strong>. 
						One payroll dispute avoided and it pays for itself."
					</p>
				</CardContent>
			</Card>

			<!-- Events -->
			<Card class="border-l-4 border-l-pink-500">
				<CardHeader>
					<CardTitle class="flex items-center gap-2">🎪 For Event Organizers / Hotels:</CardTitle>
				</CardHeader>
				<CardContent class="italic text-sm">
					<p class="mb-3">"For your event, how do you plan to manage check-ins? Paper list at the door?</p>
					<p class="mb-3">
						We offer <strong>QR-enabled event passes</strong>—guests scan at entry, instant verification. 
						VIPs get special access. No counterfeit tickets. Real-time attendance tracking.
					</p>
					<p class="mb-3">
						For hotels and resorts, we do <strong>staff IDs with photo and department color-coding</strong>. 
						Guests can easily identify legitimate staff. Great for security and brand professionalism.
					</p>
					<p>
						Event pricing is simple: ₱500 base + ₱2 per visitor. For a 200-person event, that's just <strong>₱900 total</strong>. 
						Same price as one centerpiece."
					</p>
				</CardContent>
			</Card>
		</div>
	</section>

	<footer class="mt-12 pt-6 border-t text-center text-sm text-muted-foreground">
		<p>Kanaya Strategic Roadmap • Confidential</p>
		<p class="mt-2"><a href="/admin/docs" class="underline">← Back to Docs Hub</a></p>
	</footer>
</div>
