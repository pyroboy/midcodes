<script lang="ts">
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { CREDIT_PACKAGES } from '$lib/payments/catalog';
	import { createCreditPayment } from '$lib/remote/payments.remote';
	import { paymentFlags } from '$lib/stores/featureFlags';
	import {
		Check, Zap, CreditCard, Smartphone, Key, Tag, ShieldCheck, Cpu,
		AlertTriangle, Clock, FileCheck, Users, Building2, Wallet, Award,
		Shield, Fingerprint, QrCode, Sparkles, Package, ArrowRight, Mail
	} from 'lucide-svelte';
	import { getPreloadState } from '$lib/services/preloadService';

	interface Props {
		data?: any;
	}

	let { data }: Props = $props();

	const preloadState = getPreloadState('/pricing');
	let isStructureReady = $derived($preloadState?.serverData === 'ready');
	let isPageLoading = $state(true);

	onMount(() => {
		isPageLoading = false;

		// Debug theme
		const isDarkClass = document.documentElement.classList.contains('dark');
		const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
		console.log('--- Pricing Page Theme Debug ---');
		console.log('HTML classList contains "dark":', isDarkClass);
		console.log('System prefers dark scheme:', systemPrefersDark);
		
		const mainContainer = document.querySelector('.min-h-screen');
		if (mainContainer) {
			const computedStyle = window.getComputedStyle(mainContainer);
			console.log('Main container computed background color:', computedStyle.backgroundColor);
		}
		console.log('--------------------------------');
	});

	let isLoading = $state(false);
	let purchasingPackage = $state<string | null>(null);

	const paymentsEnabled = $derived(
		(data?.paymentsEnabled ?? true) && $paymentFlags.paymentsEnabled
	);

	const freeTier = {
		id: 'free_starter',
		name: 'Free Starter',
		amountPhp: 0,
		credits: 10,
		description: 'Try it out risk-free.',
		features: ['10 ID Generations', '2 Premium Templates', 'Standard Quality', 'Watermarked'],
		color: ''
	};

	const customTier = {
		id: 'enterprise_custom',
		name: 'Enterprise',
		amountPhp: -1,
		credits: 0,
		description: 'Custom integrations.',
		features: ['Unlimited Generations', 'Priority Support', 'Custom SLA', 'On-premise Option'],
		color: ''
	};

	const enhancedPackages = CREDIT_PACKAGES.map((pkg, index) => ({
		...pkg,
		price: pkg.amountPhp,
		pricePerCard: pkg.amountPhp / pkg.credits,
		discount: index > 0
			? Math.round((1 - pkg.amountPhp / pkg.credits / (CREDIT_PACKAGES[0].amountPhp / CREDIT_PACKAGES[0].credits)) * 100)
			: 0,
		popular: pkg.id === 'credits_1000',
		features: [
			`${pkg.credits} ID Generations`,
			'All Premium Templates',
			'High Quality (300 DPI)',
			'No Watermarks',
			'Credits Never Expire'
		],
		color: pkg.id === 'credits_1000' ? 'ring-2 ring-primary' : ''
	}));

	const allPackages = [freeTier, ...enhancedPackages, customTier];

	function formatPrice(price: number): string {
		if (price === 0) return 'Free';
		if (price === -1) return 'Contact Us';
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 0
		}).format(price);
	}

	async function purchaseCredits(packageId: string) {
		if (packageId === 'free_starter') {
			window.location.href = '/auth?mode=register';
			return;
		}
		if (!data?.user) {
			window.location.href = '/auth';
			return;
		}
		purchasingPackage = packageId;
		isLoading = true;
		try {
			const result = await createCreditPayment({
				packageId,
				method: undefined,
				returnTo: window.location.href
			});
			window.location.href = result.checkoutUrl;
		} catch (error) {
			console.error('Payment error:', error);
			alert('Failed to process payment. Please try again.');
		} finally {
			purchasingPackage = null;
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Pricing - KINATAO ID</title>
	<meta name="description" content="Professional ID Card Production with security features: RFID, UV overlay, hologram, barcode. Business packages available." />
</svelte:head>

<div class="min-h-screen bg-white dark:bg-slate-950">

	<!-- Header -->
	<section class="py-16 md:py-20 text-center px-4 max-w-4xl mx-auto">
		<p class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">Pricing</p>
		<h1 class="text-3xl md:text-4xl font-bold tracking-tight text-slate-900 dark:text-white mb-4">
			Service Menu
		</h1>
		<p class="text-lg text-muted-foreground max-w-xl mx-auto">
			Professional ID cards with advanced security features. From student IDs to enterprise access control.
		</p>
	</section>

	<!-- Important Notice Banner -->
	<section class="border-y border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50">
		<div class="max-w-5xl mx-auto px-4 py-6">
			<div class="flex items-start gap-3 mb-4">
				<AlertTriangle class="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
				<p class="text-sm font-medium text-slate-700 dark:text-slate-300">Please read before ordering</p>
			</div>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
				<div class="flex items-start gap-2">
					<FileCheck class="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-slate-800 dark:text-slate-200">Free Layout</p>
						<p class="text-muted-foreground text-xs">Front & back design included</p>
					</div>
				</div>
				<div class="flex items-start gap-2">
					<Wallet class="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-slate-800 dark:text-slate-200">50% Downpayment</p>
						<p class="text-muted-foreground text-xs">Balance upon completion</p>
					</div>
				</div>
				<div class="flex items-start gap-2">
					<Clock class="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-slate-800 dark:text-slate-200">3-7 Working Days</p>
						<p class="text-muted-foreground text-xs">Rush orders available</p>
					</div>
				</div>
				<div class="flex items-start gap-2">
					<AlertTriangle class="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
					<div>
						<p class="font-medium text-red-600 dark:text-red-400">No Fake IDs</p>
						<p class="text-muted-foreground text-xs">PO/School cert required</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<!-- Free Template Generation Banner -->
	<section class="border-b border-slate-200 dark:border-slate-800 bg-primary/5">
		<div class="max-w-5xl mx-auto px-4 py-4">
			<div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
				<div class="flex items-center gap-3">
					<Sparkles class="w-5 h-5 text-primary shrink-0" />
					<div>
						<p class="font-medium text-slate-800 dark:text-slate-200">Free Digital Template Generation</p>
						<p class="text-xs text-muted-foreground">Design your ID layout online at no cost. For complex or custom designs, contact us.</p>
					</div>
				</div>
				<Button variant="outline" size="sm" href="/templates">
					Try Now <ArrowRight class="w-4 h-4 ml-1" />
				</Button>
			</div>
		</div>
	</section>

	<!-- Quick Nav -->
	<nav class="sticky top-0 z-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur border-b border-slate-200 dark:border-slate-800">
		<div class="max-w-5xl mx-auto px-4 py-3 flex flex-wrap justify-center gap-2 text-sm">
			<a href="#id-cards" class="px-3 py-1.5 rounded-md text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">ID Cards</a>
			<a href="#security" class="px-3 py-1.5 rounded-md text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Security Features</a>
			<a href="#packages" class="px-3 py-1.5 rounded-md text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Business Packages</a>
			<a href="#accessories" class="px-3 py-1.5 rounded-md text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Accessories</a>
			<a href="#smart-tech" class="px-3 py-1.5 rounded-md text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Smart Tech</a>
			<a href="#digital" class="px-3 py-1.5 rounded-md text-muted-foreground hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">Digital Credits</a>
		</div>
	</nav>

	<!-- ID Card Production -->
	<section id="id-cards" class="py-16 px-4 scroll-mt-16">
		<div class="max-w-5xl mx-auto">
			<div class="mb-10">
				<p class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">I. ID Card Production</p>
				<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Corporate & School IDs</h2>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-6">

				<!-- Standard Laminated -->
				<div class="border border-slate-200 dark:border-slate-800 rounded-lg p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
					<div class="mb-4">
						<span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Option A</span>
						<h3 class="text-lg font-semibold text-slate-900 dark:text-white mt-1">Standard Laminated</h3>
						<p class="text-sm text-muted-foreground mt-2">
							The industry standard for schools and organizations. Heat-pressed sandwich construction with a glossy, professional finish. Print is sealed inside the laminate for scratch and fade resistance.
						</p>
					</div>
					<div class="flex items-center gap-2 text-xs text-muted-foreground mb-4">
						<Users class="w-3.5 h-3.5" />
						<span>Schools, Fan Clubs, Associations, Bulk Employee IDs</span>
					</div>
					<div class="text-xs text-muted-foreground mb-3 space-y-1">
						<p>+ Variable data printing (names, photos, QR codes)</p>
						<p>+ Front & back full-color design</p>
						<p>+ Standard CR80 size (3.375" x 2.125")</p>
					</div>
					<table class="w-full text-sm mb-4">
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
							<tr><td class="py-2 text-slate-700 dark:text-slate-300">5 - 19 pcs</td><td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱50</td></tr>
							<tr><td class="py-2 text-slate-700 dark:text-slate-300">20 - 49 pcs</td><td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱45</td></tr>
							<tr><td class="py-2 text-slate-700 dark:text-slate-300">50 - 99 pcs</td><td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱40</td></tr>
							<tr><td class="py-2 text-slate-700 dark:text-slate-300">100 - 199 pcs</td><td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱35</td></tr>
							<tr><td class="py-2 text-slate-700 dark:text-slate-300">200 - 499 pcs</td><td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱30</td></tr>
							<tr><td class="py-2 text-slate-700 dark:text-slate-300">500 - 999 pcs</td><td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱27</td></tr>
							<tr class="bg-primary/5"><td class="py-2 font-semibold text-slate-900 dark:text-white">1,000+ pcs</td><td class="py-2 text-right font-bold text-primary">₱23</td></tr>
						</tbody>
					</table>
					<Button variant="default" class="w-full" href="/contact?subject=Standard+Laminated+ID">Get Quote</Button>
				</div>

				<!-- Premium Direct Print -->
				<div class="border border-slate-200 dark:border-slate-800 rounded-lg p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors relative">
					<Badge class="absolute -top-2.5 right-4 text-xs">Popular</Badge>
					<div class="mb-4">
						<span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Option B</span>
						<h3 class="text-lg font-semibold text-slate-900 dark:text-white mt-1">Premium Direct Print</h3>
						<p class="text-sm text-muted-foreground mt-2">
							Executive-grade solid PVC cards with edge-to-edge thermal transfer printing. The same technology used in bank cards, government IDs, and corporate access credentials. Exceptional durability and professional appearance.
						</p>
					</div>
					<div class="flex items-center gap-2 text-xs text-muted-foreground mb-4">
						<Building2 class="w-3.5 h-3.5" />
						<span>Government, Corporate, Healthcare, VIP Access</span>
					</div>
					<div class="text-xs text-muted-foreground mb-3 space-y-1">
						<p>+ 30mil rigid PVC (ATM-card thickness)</p>
						<p>+ 300 DPI photographic quality</p>
						<p>+ Optional: magnetic stripe, signature panel</p>
						<p>+ Supports security overlays (UV, hologram)</p>
					</div>
					<table class="w-full text-sm mb-4">
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
							<tr><td class="py-2 text-slate-700 dark:text-slate-300">1 - 9 pcs</td><td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱180</td></tr>
							<tr><td class="py-2 text-slate-700 dark:text-slate-300">10 - 49 pcs</td><td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱150</td></tr>
							<tr class="bg-primary/5"><td class="py-2 font-semibold text-slate-900 dark:text-white">50+ pcs</td><td class="py-2 text-right font-bold text-primary">₱120</td></tr>
						</tbody>
					</table>
					<Button variant="default" class="w-full" href="/contact?subject=Premium+Direct+ID">Get Quote</Button>
				</div>

				<!-- TechSmart Credentials -->
				<div class="border border-slate-200 dark:border-slate-800 rounded-lg p-6 hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
					<div class="mb-4">
						<span class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Option C</span>
						<h3 class="text-lg font-semibold text-slate-900 dark:text-white mt-1">TechSmart Credentials</h3>
						<p class="text-sm text-muted-foreground mt-2">
							Premium Direct Print with embedded contactless microchip. Dual-function cards that serve as both visual ID and electronic access credential. No batteries required - powered by the reader's RF field.
						</p>
					</div>
					<div class="flex items-center gap-2 text-xs text-muted-foreground mb-4">
						<Key class="w-3.5 h-3.5" />
						<span>Door Access, Time & Attendance, Parking, Hotels</span>
					</div>
					<div class="text-xs text-muted-foreground mb-3 space-y-1">
						<p>+ All Premium Direct Print features</p>
						<p>+ RFID 125kHz (standard proximity)</p>
						<p>+ Mifare/NFC 13.56MHz (high security)</p>
						<p>+ Compatible with most access systems</p>
					</div>
					<table class="w-full text-sm mb-4">
						<thead>
							<tr class="text-xs text-slate-600 dark:text-slate-400">
								<th class="py-2 text-left font-semibold">Type</th>
								<th class="py-2 text-right font-semibold">1-9</th>
								<th class="py-2 text-right font-semibold">10-49</th>
								<th class="py-2 text-right font-semibold">50+</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
							<tr>
								<td class="py-2 text-slate-700 dark:text-slate-300 text-xs">RFID 125kHz</td>
								<td class="py-2 text-right font-semibold text-xs text-slate-900 dark:text-white">₱250</td>
								<td class="py-2 text-right font-semibold text-xs text-slate-900 dark:text-white">₱220</td>
								<td class="py-2 text-right font-bold text-xs text-primary">₱180</td>
							</tr>
							<tr>
								<td class="py-2 text-slate-700 dark:text-slate-300 text-xs">NFC 13.56MHz</td>
								<td class="py-2 text-right font-semibold text-xs text-slate-900 dark:text-white">₱280</td>
								<td class="py-2 text-right font-semibold text-xs text-slate-900 dark:text-white">₱250</td>
								<td class="py-2 text-right font-bold text-xs text-primary">₱200</td>
							</tr>
						</tbody>
					</table>
					<Button variant="default" class="w-full" href="/contact?subject=TechSmart+Credential">Get Quote</Button>
				</div>

			</div>
		</div>
	</section>

	<Separator />

	<!-- Security Features -->
	<section id="security" class="py-16 px-4 scroll-mt-16 bg-white dark:bg-slate-900/30">
		<div class="max-w-5xl mx-auto">
			<div class="mb-10">
				<p class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">II. Security Add-ons</p>
				<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Anti-Counterfeiting & Authentication</h2>
				<p class="text-sm text-muted-foreground mt-2">Protect your organization with industry-standard security features. Available for Premium Direct Print and TechSmart cards.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

				<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
					<div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
						<Shield class="w-5 h-5 text-muted-foreground" />
					</div>
					<h3 class="font-semibold text-slate-900 dark:text-white text-sm">UV Overlay</h3>
					<p class="text-xs text-muted-foreground mt-1 mb-3">Invisible under normal light, glows under UV blacklight. Custom patterns or logos for instant verification.</p>
					<p class="font-bold text-slate-900 dark:text-white text-lg">+₱25 <span class="text-sm font-normal text-slate-600 dark:text-slate-400">/ card</span></p>
				</div>

				<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
					<div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
						<Sparkles class="w-5 h-5 text-muted-foreground" />
					</div>
					<h3 class="font-semibold text-slate-900 dark:text-white text-sm">Holographic Overlay</h3>
					<p class="text-xs text-muted-foreground mt-1 mb-3">Tamper-evident holographic laminate. Generic or custom hologram patterns available.</p>
					<p class="font-bold text-slate-900 dark:text-white text-lg">+₱35 <span class="text-sm font-normal text-slate-600 dark:text-slate-400">/ card</span></p>
				</div>

				<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
					<div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
						<QrCode class="w-5 h-5 text-muted-foreground" />
					</div>
					<h3 class="font-semibold text-slate-900 dark:text-white text-sm">QR / Barcode</h3>
					<p class="text-xs text-muted-foreground mt-1 mb-3">Unique QR codes or barcodes (Code 128, Code 39) for digital verification and database lookup.</p>
					<p class="font-bold text-slate-900 dark:text-white text-lg">Included <span class="text-sm font-normal text-slate-600 dark:text-slate-400">in design</span></p>
				</div>

				<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5">
					<div class="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-3">
						<Fingerprint class="w-5 h-5 text-muted-foreground" />
					</div>
					<h3 class="font-semibold text-slate-900 dark:text-white text-sm">RFID / NFC</h3>
					<p class="text-xs text-muted-foreground mt-1 mb-3">Embedded chip for contactless authentication. Works with doors, turnstiles, and attendance systems.</p>
					<p class="font-bold text-slate-900 dark:text-white text-lg">See TechSmart</p>
				</div>

			</div>

			<div class="mt-6 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg">
				<p class="text-sm text-muted-foreground">
					<strong class="text-slate-900 dark:text-white">Combine for maximum security:</strong> Many organizations use UV + Hologram + QR for layered authentication. Contact us for bundle pricing on 100+ cards.
				</p>
			</div>
		</div>
	</section>

	<Separator />

	<!-- Business Packages -->
	<section id="packages" class="py-16 px-4 scroll-mt-16">
		<div class="max-w-5xl mx-auto">
			<div class="mb-10">
				<p class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">III. Business Packages</p>
				<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Complete Solutions</h2>
				<p class="text-sm text-muted-foreground mt-2">Pre-configured packages for common business needs. Includes hardware, cards, and setup.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">

				<!-- Starter Package -->
				<div class="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
					<div class="flex items-center gap-2 mb-4">
						<Package class="w-5 h-5 text-muted-foreground" />
						<h3 class="font-semibold text-slate-900 dark:text-white">Startup Package</h3>
					</div>
					<p class="text-xs text-muted-foreground mb-4">For small offices and startups. Basic time tracking without complex infrastructure.</p>
					<ul class="space-y-2 text-sm mb-4">
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
							<span class="text-muted-foreground">1x Standalone RFID Reader</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
							<span class="text-muted-foreground">25x TechSmart RFID Cards</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
							<span class="text-muted-foreground">Basic attendance software</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
							<span class="text-muted-foreground">Installation & training</span>
						</li>
					</ul>
					<p class="text-xs text-muted-foreground mb-1">Starting at</p>
					<p class="text-2xl font-black text-slate-900 dark:text-white mb-4">₱25,000</p>
					<Button variant="outline" class="w-full" href="/contact?subject=Startup+Package">Get Quote</Button>
				</div>

				<!-- Business Package -->
				<div class="border border-primary/30 dark:border-primary/30 rounded-lg p-6 relative">
					<Badge class="absolute -top-2.5 right-4 text-xs">Best Value</Badge>
					<div class="flex items-center gap-2 mb-4">
						<Package class="w-5 h-5 text-primary" />
						<h3 class="font-semibold text-slate-900 dark:text-white">Business Package</h3>
					</div>
					<p class="text-xs text-muted-foreground mb-4">For growing businesses. Full time & attendance with door access capability.</p>
					<ul class="space-y-2 text-sm mb-4">
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-primary mt-0.5 shrink-0" />
							<span class="text-muted-foreground">1x Biometric + RFID Terminal</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-primary mt-0.5 shrink-0" />
							<span class="text-muted-foreground">50x TechSmart NFC Cards</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-primary mt-0.5 shrink-0" />
							<span class="text-muted-foreground">Professional attendance software</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-primary mt-0.5 shrink-0" />
							<span class="text-muted-foreground">1x Door access point (optional)</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-primary mt-0.5 shrink-0" />
							<span class="text-muted-foreground">Installation, training, 1-year support</span>
						</li>
					</ul>
					<p class="text-xs text-muted-foreground mb-1">Starting at</p>
					<p class="text-2xl font-black text-slate-900 dark:text-white mb-4">₱55,000</p>
					<Button variant="default" class="w-full" href="/contact?subject=Business+Package">Get Quote</Button>
				</div>

				<!-- Enterprise Package -->
				<div class="border border-slate-200 dark:border-slate-800 rounded-lg p-6">
					<div class="flex items-center gap-2 mb-4">
						<Package class="w-5 h-5 text-muted-foreground" />
						<h3 class="font-semibold text-slate-900 dark:text-white">Enterprise Package</h3>
					</div>
					<p class="text-xs text-muted-foreground mb-4">For large organizations. Multi-location, multi-door with centralized management.</p>
					<ul class="space-y-2 text-sm mb-4">
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
							<span class="text-muted-foreground">Multiple biometric terminals</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
							<span class="text-muted-foreground">100+ TechSmart NFC Cards</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
							<span class="text-muted-foreground">Enterprise software + API</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
							<span class="text-muted-foreground">Multi-door access control</span>
						</li>
						<li class="flex items-start gap-2">
							<Check class="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
							<span class="text-muted-foreground">Dedicated support & SLA</span>
						</li>
					</ul>
					<p class="text-xs text-muted-foreground mb-1">Custom quote</p>
					<p class="text-2xl font-bold text-slate-900 dark:text-white mb-4">Contact Us</p>
					<Button variant="outline" class="w-full" href="/contact?subject=Enterprise+Package">Request Consultation</Button>
				</div>

			</div>
		</div>
	</section>

	<Separator />

	<!-- Accessories -->
	<section id="accessories" class="py-16 px-4 scroll-mt-16 bg-white dark:bg-slate-900/30">
		<div class="max-w-5xl mx-auto">
			<div class="mb-10">
				<p class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">IV. Accessories</p>
				<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Lanyards & Add-ons</h2>
				<p class="text-sm text-muted-foreground mt-2">Complete your ID system with quality accessories. All items include free layout design.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6">

				<!-- Lanyards -->
				<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
					<div class="flex items-center gap-3 mb-4">
						<Tag class="w-5 h-5 text-muted-foreground" />
						<div>
							<h3 class="font-semibold text-slate-900 dark:text-white">Premium Sublimation Lanyards</h3>
							<p class="text-xs text-muted-foreground">Full-color edge-to-edge printing. Soft, comfortable polyester. Free layout design included.</p>
						</div>
					</div>
					<table class="w-full text-sm">
						<thead>
							<tr class="text-xs text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
								<th class="py-2 text-left font-semibold">Width</th>
								<th class="py-2 text-right font-semibold">1-49</th>
								<th class="py-2 text-right font-semibold">50-99</th>
								<th class="py-2 text-right font-semibold">100+</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-slate-100 dark:divide-slate-800">
							<tr>
								<td class="py-2 text-slate-700 dark:text-slate-300">¾" Standard</td>
								<td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱60</td>
								<td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱50</td>
								<td class="py-2 text-right font-bold text-primary">₱40</td>
							</tr>
							<tr>
								<td class="py-2 text-slate-700 dark:text-slate-300">1" Wide</td>
								<td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱70</td>
								<td class="py-2 text-right font-semibold text-slate-900 dark:text-white">₱60</td>
								<td class="py-2 text-right font-bold text-primary">₱50</td>
							</tr>
						</tbody>
					</table>
				</div>

				<!-- Add-ons -->
				<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
					<h3 class="font-semibold text-slate-900 dark:text-white mb-4">Essential Add-ons</h3>
					<ul class="space-y-3 text-sm">
						<li class="flex justify-between items-center">
							<div>
								<span class="text-slate-800 dark:text-slate-200 font-medium">Side Release Buckle</span>
								<p class="text-xs text-slate-500 dark:text-slate-400">Quick-release safety feature</p>
							</div>
							<span class="font-bold text-slate-900 dark:text-white">+₱10</span>
						</li>
						<li class="flex justify-between items-center">
							<div>
								<span class="text-slate-800 dark:text-slate-200 font-medium">ID Soft Case (Zip-Lock)</span>
								<p class="text-xs text-slate-500 dark:text-slate-400">Water-resistant, resealable</p>
							</div>
							<span class="font-bold text-slate-900 dark:text-white">₱10</span>
						</li>
						<li class="flex justify-between items-center">
							<div>
								<span class="text-slate-800 dark:text-slate-200 font-medium">ID Hard Case (Acrylic)</span>
								<p class="text-xs text-slate-500 dark:text-slate-400">Rigid protection, clear view</p>
							</div>
							<span class="font-bold text-slate-900 dark:text-white">₱25</span>
						</li>
						<li class="flex justify-between items-center">
							<div>
								<span class="text-slate-800 dark:text-slate-200 font-medium">ID Retractor / Yoyo</span>
								<p class="text-xs text-slate-500 dark:text-slate-400">Spring-loaded, clip-on</p>
							</div>
							<span class="font-bold text-slate-900 dark:text-white">₱35</span>
						</li>
					</ul>
				</div>

			</div>

			<!-- Rubber Logo -->
			<div class="mt-6 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
				<div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
					<div>
						<h3 class="font-semibold text-slate-900 dark:text-white">Custom 3D Rubber Logo Loop</h3>
						<p class="text-xs text-muted-foreground mt-1">Premium PVC rubber with your logo in raised 3D relief. Sewn onto lanyards for a professional, branded look. Includes custom mold creation.</p>
						<p class="text-xs text-muted-foreground mt-2">Minimum order: 50 pieces (mold fee included)</p>
					</div>
				</div>
				<div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
					<div class="py-3 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-800">
						<p class="text-xs text-slate-500 dark:text-slate-400 mb-1">50 - 99</p>
						<p class="font-bold text-lg text-slate-900 dark:text-white">₱65</p>
					</div>
					<div class="py-3 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-800">
						<p class="text-xs text-slate-500 dark:text-slate-400 mb-1">100 - 199</p>
						<p class="font-bold text-lg text-slate-900 dark:text-white">₱55</p>
					</div>
					<div class="py-3 border border-slate-200 dark:border-slate-800 rounded-md bg-white dark:bg-slate-800">
						<p class="text-xs text-slate-500 dark:text-slate-400 mb-1">200 - 499</p>
						<p class="font-bold text-lg text-slate-900 dark:text-white">₱45</p>
					</div>
					<div class="py-3 border border-primary/30 dark:border-primary/30 rounded-md bg-primary/10">
						<p class="text-xs text-slate-600 dark:text-slate-400 mb-1 font-medium">500+</p>
						<p class="font-bold text-lg text-primary">₱35</p>
					</div>
				</div>
			</div>
		</div>
	</section>

	<Separator />

	<!-- Smart Tech -->
	<section id="smart-tech" class="py-16 px-4 scroll-mt-16">
		<div class="max-w-5xl mx-auto">
			<div class="mb-10">
				<p class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">V. Kinatao Smart Series</p>
				<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Lifestyle Tech</h2>
				<p class="text-sm text-muted-foreground mt-2">NFC-enabled products for modern networking. One-time purchase, no subscriptions. Tap to share contact info, social media, website, or payment apps.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				<div class="border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
					<div class="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
						<CreditCard class="w-6 h-6 text-muted-foreground" />
					</div>
					<h3 class="font-semibold text-slate-900 dark:text-white">Smart Business Card</h3>
					<p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Custom-printed PVC + embedded NFC chip. The last business card you'll ever need.</p>
					<p class="text-2xl font-black text-slate-900 dark:text-white mb-4">₱1,000</p>
					<Button variant="outline" class="w-full" href="/contact?subject=Smart+Business+Card">Order</Button>
				</div>

				<div class="border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
					<div class="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
						<Key class="w-6 h-6 text-muted-foreground" />
					</div>
					<h3 class="font-semibold text-slate-900 dark:text-white">Smart Key Fob</h3>
					<p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Premium epoxy or leather finish. Attach to keys, bags, or use as a "Lost & Found" tag.</p>
					<p class="text-2xl font-black text-slate-900 dark:text-white mb-4">₱1,000</p>
					<Button variant="outline" class="w-full" href="/contact?subject=Smart+Key+Fob">Order</Button>
				</div>

				<div class="border border-slate-200 dark:border-slate-800 rounded-lg p-6 text-center hover:border-slate-300 dark:hover:border-slate-700 transition-colors">
					<div class="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
						<Smartphone class="w-6 h-6 text-muted-foreground" />
					</div>
					<h3 class="font-semibold text-slate-900 dark:text-white">Smart Sticker Coin</h3>
					<p class="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4">Adhesive NFC tag. Stick on your phone case to turn it into a tappable business card.</p>
					<p class="text-2xl font-black text-slate-900 dark:text-white mb-4">₱1,000</p>
					<Button variant="outline" class="w-full" href="/contact?subject=Smart+Sticker+Coin">Order</Button>
				</div>
			</div>
		</div>
	</section>

	<Separator />

	<!-- Event Solutions -->
	<section class="py-16 px-4 bg-white dark:bg-slate-900/30">
		<div class="max-w-5xl mx-auto">
			<div class="mb-10">
				<p class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">VI. Event Solutions</p>
				<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Conferences, Concerts & Expos</h2>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl">
				<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
					<div class="flex items-center gap-3 mb-3">
						<Award class="w-5 h-5 text-muted-foreground" />
						<h3 class="font-semibold text-slate-900 dark:text-white">Oversized VIP Badge</h3>
					</div>
					<p class="text-xs text-slate-500 dark:text-slate-400 mb-4">4"x6" Laminated. All Access / Media / Staff credentials.</p>
					<p class="text-xl font-black text-slate-900 dark:text-white mb-4">₱150 <span class="text-sm font-normal text-slate-500 dark:text-slate-400">/ badge</span></p>
					<Button variant="outline" class="w-full" href="/contact?subject=VIP+Badge">Request Quote</Button>
				</div>

				<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6">
					<div class="flex items-center gap-3 mb-3">
						<Cpu class="w-5 h-5 text-muted-foreground" />
						<h3 class="font-semibold text-slate-900 dark:text-white">RFID Lite Card</h3>
					</div>
					<p class="text-xs text-muted-foreground mb-4">Paper or eco-plastic. Disposable smart cards for 1-day events.</p>
					<p class="text-base font-medium text-muted-foreground mb-4">Contact for bulk pricing</p>
					<Button variant="outline" class="w-full" href="/contact?subject=RFID+Lite+Event">Contact Us</Button>
				</div>
			</div>
		</div>
	</section>

	<Separator />

	<!-- Digital Credits -->
	<section id="digital" class="py-16 px-4 scroll-mt-16">
		<div class="max-w-6xl mx-auto">
			<div class="text-center mb-10">
				<p class="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-2">Self-Service Platform</p>
				<h2 class="text-2xl font-bold text-slate-900 dark:text-white">Digital Generation Credits</h2>
				<p class="text-sm text-muted-foreground mt-2">Design and generate printable ID files online. 1 Credit = 1 Digital ID.</p>
			</div>

			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
				{#each allPackages as pkg}
					<div class="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-5 flex flex-col {pkg.color} hover:border-slate-300 dark:hover:border-slate-700 transition-colors relative">
						{#if (pkg as any).popular}
							<div class="absolute -top-2.5 left-1/2 -translate-x-1/2">
								<Badge class="text-xs">Best Value</Badge>
							</div>
						{/if}

						<div class="text-center mb-4">
							<h3 class="font-semibold text-slate-900 dark:text-white text-sm">{(pkg as any).name}</h3>
							<p class="text-2xl font-bold mt-2 text-slate-900 dark:text-white">
								{#if (pkg as any).amountPhp === -1}
									Custom
								{:else}
									{formatPrice(pkg.amountPhp)}
								{/if}
							</p>
							{#if (pkg as any).credits > 0}
								<p class="text-xs text-muted-foreground">{(pkg as any).credits} IDs</p>
							{/if}
						</div>

						<Separator class="my-3" />

						<ul class="space-y-2 text-xs flex-1 mb-4">
							{#each (pkg as any).features as feature}
								<li class="flex items-start gap-2">
									<Check class="w-3 h-3 text-muted-foreground mt-0.5 shrink-0" />
									<span class="text-muted-foreground">{feature}</span>
								</li>
							{/each}
							{#if (pkg as any).discount > 0}
								<li class="flex items-start gap-2">
									<Zap class="w-3 h-3 text-amber-500 mt-0.5 shrink-0" />
									<span class="font-medium text-slate-900 dark:text-white">Save {(pkg as any).discount}%</span>
								</li>
							{/if}
						</ul>

						{#if pkg.id === 'free_starter'}
							<Button variant="outline" size="sm" class="w-full" onclick={() => purchaseCredits(pkg.id)}>Get Started</Button>
						{:else if pkg.id === 'enterprise_custom'}
							<Button variant="outline" size="sm" class="w-full" href="/contact?subject=Enterprise">Contact Sales</Button>
						{:else}
							<Button
								variant={(pkg as any).popular ? 'default' : 'outline'}
								size="sm"
								class="w-full"
								disabled={isLoading || !paymentsEnabled}
								onclick={() => purchaseCredits(pkg.id)}
							>
								{#if purchasingPackage === pkg.id}
									Processing...
								{:else}
									Buy Credits
								{/if}
							</Button>
						{/if}
					</div>
				{/each}
			</div>
		</div>
	</section>

	<Separator />

	<!-- Design Reference CTA -->
	<section class="py-16 px-4 bg-white dark:bg-slate-900/30">
		<div class="max-w-3xl mx-auto text-center">
			<Mail class="w-10 h-10 mx-auto mb-4 text-muted-foreground" />
			<h2 class="text-xl font-bold text-slate-900 dark:text-white mb-3">Custom Design Request</h2>
			<p class="text-muted-foreground text-sm mb-6">
				For complex layouts, specific branding requirements, or if you have a design reference to follow — send us your requirements and we'll provide a custom quote.
			</p>
			<div class="flex flex-col sm:flex-row justify-center gap-3">
				<Button href="/contact?subject=Custom+Design+Request">
					<Mail class="w-4 h-4 mr-2" />
					Send Design Brief
				</Button>
				<Button variant="outline" href="/templates">
					Try Free Template Builder
				</Button>
			</div>
		</div>
	</section>

	<!-- Footer CTA -->
	<section class="py-12 px-4 text-center border-t border-slate-200 dark:border-slate-800">
		<p class="text-muted-foreground text-sm mb-4">Questions about pricing or need a custom solution?</p>
		<Button variant="outline" href="/contact">Contact Support</Button>
	</section>

</div>
