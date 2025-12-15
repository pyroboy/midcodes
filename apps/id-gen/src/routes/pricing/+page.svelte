<script lang="ts">
	import { onMount } from 'svelte';
	import { fade } from 'svelte/transition';
	import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { Separator } from '$lib/components/ui/separator';
	import { CREDIT_PACKAGES } from '$lib/payments/catalog';
	import { createCreditPayment } from '$lib/remote/payments.remote';
	import { paymentFlags } from '$lib/stores/featureFlags';
	import { Check, Zap, CreditCard, Smartphone, Key, Tag, ShieldCheck, Cpu, Wrench, AlertTriangle } from 'lucide-svelte';
	import { getPreloadState } from '$lib/services/preloadService';
	import PricingPageSkeleton from '$lib/components/skeletons/PricingPageSkeleton.svelte';

	interface Props {
		data?: any;
	}

	let { data }: Props = $props();

	// Smart Loading State
	const preloadState = getPreloadState('/pricing');
	let isStructureReady = $derived($preloadState?.serverData === 'ready');
	let isPageLoading = $state(true);

	onMount(() => {
		isPageLoading = false;
	});

	// State for purchase actions
	let isLoading = $state(false);
	let purchasingPackage = $state<string | null>(null);

	// Check if payments are enabled
	const paymentsEnabled = $derived(
		(data?.paymentsEnabled ?? true) && $paymentFlags.paymentsEnabled
	);

	// Free Tier Definition
	const freeTier = {
		id: 'free_starter',
		name: 'Free Starter',
		amountPhp: 0,
		credits: 10,
		description: 'Try it out risk-free. No credit card required.',
		features: [
			'10 ID Generations',
			'2 Premium Templates',
			'Standard Quality Export',
			'Watermarked'
		],
		color: 'border-green-200 bg-green-50/50 dark:bg-green-900/10'
	};
	
	// Custom Tier Definition
	const customTier = {
		id: 'enterprise_custom',
		name: 'Unlimited / Custom',
		amountPhp: -1, // Indicates custom pricing
		credits: 0,
		description: 'For massive scale and custom integrations.',
		features: [
			'Unlimited Generations',
			'Dedicated Priority Support',
			'Custom Contract & SLA',
			'On-premise Deployment'
		],
		color: 'border-purple-200 bg-purple-50/50 dark:bg-purple-900/10'
	};

	// Enhance packages
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
			'Digital ID (Beta)',
			'No Watermarks',
			'Credits Never Expire'
		],
		color: pkg.id === 'credits_1000' ? 'border-primary shadow-lg scale-105 z-10' : 'border-border'
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
			window.location.href = '/auth?mode=register'; // Redirect to signup
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
	<title>Rates & Pricing - KINATAO ID</title>
	<meta
		name="description"
		content="Professional ID Card Production, Smart Tech, and Security Solutions in Bohol. Transparent pricing for laminated IDs, PVC cards, RFID credentials, and more."
	/>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	
	<!-- Header -->
	<section class="py-16 md:py-24 text-center px-4">
		<Badge variant="outline" class="mb-4 text-primary border-primary">KINATAO ID & SOLUTIONS</Badge>
		<h1 class="text-4xl md:text-6xl font-black tracking-tight mb-6">
			Official <span class="text-primary">Service Menu</span>
		</h1>
		<p class="text-xl text-muted-foreground max-w-2xl mx-auto">
			Professional Identity, Smart Tech, & Security Solutions in Bohol
		</p>
	</section>

	<!-- Section I: ID Card Production -->
	<section class="py-16 bg-slate-50 dark:bg-slate-900/50 px-4 border-b border-border">
		<div class="container max-w-6xl mx-auto">
			<div class="text-center mb-12">
				<Badge variant="secondary" class="mb-4">I. ID CARD PRODUCTION</Badge>
				<h2 class="text-3xl font-bold mb-2">Corporate & School IDs</h2>
				<p class="text-muted-foreground">Choose the right card type for your needs</p>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
				
				<!-- Option A: Standard Laminated -->
				<Card class="border-2 hover:shadow-lg transition-shadow">
					<CardHeader>
						<Badge variant="outline" class="w-fit mb-2 text-blue-600 border-blue-600">OPTION A</Badge>
						<CardTitle class="text-xl">Standard Laminated</CardTitle>
						<CardDescription>
							The "School" Standard. Sandwich-type heat press with glossy finish. Print is inside the plastic (anti-scratch).
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground mb-4">Best for: Student IDs, Fan Clubs, Bulk Employee IDs</p>
						<div class="rounded-lg border overflow-hidden">
							<table class="w-full text-sm">
								<thead class="bg-blue-50 dark:bg-blue-900/20">
									<tr>
										<th class="py-2 px-3 text-left font-medium">Quantity</th>
										<th class="py-2 px-3 text-right font-medium">Price/ID</th>
									</tr>
								</thead>
								<tbody class="divide-y">
									<tr><td class="py-2 px-3">5 - 19 pcs</td><td class="py-2 px-3 text-right font-bold">₱50.00</td></tr>
									<tr><td class="py-2 px-3">20 - 49 pcs</td><td class="py-2 px-3 text-right font-bold">₱45.00</td></tr>
									<tr><td class="py-2 px-3">50 - 99 pcs</td><td class="py-2 px-3 text-right font-bold">₱40.00</td></tr>
									<tr><td class="py-2 px-3">100 - 199 pcs</td><td class="py-2 px-3 text-right font-bold">₱35.00</td></tr>
									<tr><td class="py-2 px-3">200 - 499 pcs</td><td class="py-2 px-3 text-right font-bold">₱30.00</td></tr>
									<tr><td class="py-2 px-3">500 - 999 pcs</td><td class="py-2 px-3 text-right font-bold">₱25.00</td></tr>
									<tr class="bg-blue-50 dark:bg-blue-900/30"><td class="py-2 px-3 font-bold text-blue-700 dark:text-blue-400">1,000+ pcs</td><td class="py-2 px-3 text-right font-bold text-blue-700 dark:text-blue-400">₱15.00</td></tr>
								</tbody>
							</table>
						</div>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full" href="/contact?subject=Standard+Laminated+ID+Order">Request Quote</Button>
					</CardFooter>
				</Card>

				<!-- Option B: Premium Direct -->
				<Card class="border-2 border-orange-200 dark:border-orange-800 hover:shadow-lg transition-shadow relative">
					<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
						<Badge class="bg-orange-500 text-white px-3 py-1 text-xs shadow-md">Executive</Badge>
					</div>
					<CardHeader>
						<Badge variant="outline" class="w-fit mb-2 text-orange-600 border-orange-600">OPTION B</Badge>
						<CardTitle class="text-xl">Premium Direct</CardTitle>
						<CardDescription>
							The "Executive" Standard. Solid PVC (ATM-style) with thermal transfer print. High durability.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground mb-4">Best for: Government IDs, Corporate Executives, VIPs</p>
						<div class="rounded-lg border overflow-hidden">
							<table class="w-full text-sm">
								<thead class="bg-orange-50 dark:bg-orange-900/20">
									<tr>
										<th class="py-2 px-3 text-left font-medium">Quantity</th>
										<th class="py-2 px-3 text-right font-medium">Price/ID</th>
									</tr>
								</thead>
								<tbody class="divide-y">
									<tr><td class="py-2 px-3">1 - 9 pcs</td><td class="py-2 px-3 text-right font-bold">₱180.00</td></tr>
									<tr><td class="py-2 px-3">10 - 49 pcs</td><td class="py-2 px-3 text-right font-bold">₱150.00</td></tr>
									<tr class="bg-orange-50 dark:bg-orange-900/30"><td class="py-2 px-3 font-bold text-orange-700 dark:text-orange-400">50+ pcs</td><td class="py-2 px-3 text-right font-bold text-orange-700 dark:text-orange-400">₱120.00</td></tr>
								</tbody>
							</table>
						</div>
					</CardContent>
					<CardFooter>
						<Button variant="default" class="w-full bg-orange-500 hover:bg-orange-600" href="/contact?subject=Premium+Direct+ID+Order">Request Quote</Button>
					</CardFooter>
				</Card>

				<!-- Option C: TechSmart Credentials -->
				<Card class="border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
					<CardHeader>
						<Badge variant="outline" class="w-fit mb-2 text-purple-600 border-purple-600">OPTION C</Badge>
						<CardTitle class="text-xl flex items-center gap-2">
							<Cpu class="w-5 h-5" />
							TechSmart Credentials
						</CardTitle>
						<CardDescription>
							Premium Direct Printing + Embedded Microchip. No battery required.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p class="text-xs text-muted-foreground mb-4">Best for: Office Door Access, Time Attendance, Hotel Keys</p>
						<div class="rounded-lg border overflow-hidden">
							<table class="w-full text-sm">
								<thead class="bg-purple-50 dark:bg-purple-900/20">
									<tr>
										<th class="py-2 px-3 text-left font-medium">Tech Type</th>
										<th class="py-1.5 px-2 text-right font-medium text-xs">1-9</th>
										<th class="py-1.5 px-2 text-right font-medium text-xs">10-49</th>
										<th class="py-1.5 px-2 text-right font-medium text-xs">50+</th>
									</tr>
								</thead>
								<tbody class="divide-y">
									<tr>
										<td class="py-2 px-3 text-xs">RFID Proximity<br/><span class="text-muted-foreground">(125kHz)</span></td>
										<td class="py-2 px-2 text-right font-bold text-xs">₱250</td>
										<td class="py-2 px-2 text-right font-bold text-xs">₱220</td>
										<td class="py-2 px-2 text-right font-bold text-xs text-purple-600">₱180</td>
									</tr>
									<tr>
										<td class="py-2 px-3 text-xs">Mifare / NFC<br/><span class="text-muted-foreground">(13.56MHz)</span></td>
										<td class="py-2 px-2 text-right font-bold text-xs">₱280</td>
										<td class="py-2 px-2 text-right font-bold text-xs">₱250</td>
										<td class="py-2 px-2 text-right font-bold text-xs text-purple-600">₱200</td>
									</tr>
								</tbody>
							</table>
						</div>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full border-purple-300 text-purple-700 hover:bg-purple-50" href="/contact?subject=TechSmart+Credential+Order">Request Quote</Button>
					</CardFooter>
				</Card>

			</div>
		</div>
	</section>

	<!-- Section II: Kinatao Smart Series -->
	<section class="py-16 bg-gradient-to-br from-slate-900 to-slate-800 text-white px-4 border-b border-border">
		<div class="container max-w-6xl mx-auto">
			<div class="text-center mb-12">
				<Badge class="mb-4 bg-cyan-500 text-white">II. KINATAO SMART SERIES</Badge>
				<h2 class="text-3xl font-bold mb-2">Lifestyle Tech</h2>
				<p class="text-slate-300">Next-Gen Networking Tools. One-time payment. No monthly fees.</p>
				<p class="text-sm text-cyan-400 mt-2">Tap to share: Contact Info, Social Media, Website, or Payment Apps.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
				<!-- Smart Business Card -->
				<Card class="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
					<CardHeader class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center">
							<CreditCard class="w-8 h-8 text-white" />
						</div>
						<CardTitle class="text-white">Smart Business Card</CardTitle>
						<CardDescription class="text-slate-300">
							Custom printed PVC + NFC. The last business card you'll ever buy.
						</CardDescription>
					</CardHeader>
					<CardContent class="text-center">
						<span class="text-4xl font-black text-cyan-400">₱1,000</span>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full border-white/30 text-white hover:bg-white/20" href="/contact?subject=Smart+Business+Card">Order Now</Button>
					</CardFooter>
				</Card>

				<!-- Smart Key Fob -->
				<Card class="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
					<CardHeader class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center">
							<Key class="w-8 h-8 text-white" />
						</div>
						<CardTitle class="text-white">Smart Key Fob</CardTitle>
						<CardDescription class="text-slate-300">
							Premium epoxy/leather finish. Great for "Lost & Found" or digital profile.
						</CardDescription>
					</CardHeader>
					<CardContent class="text-center">
						<span class="text-4xl font-black text-amber-400">₱1,000</span>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full border-white/30 text-white hover:bg-white/20" href="/contact?subject=Smart+Key+Fob">Order Now</Button>
					</CardFooter>
				</Card>

				<!-- Smart Sticker Coin -->
				<Card class="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20 transition-all">
					<CardHeader class="text-center">
						<div class="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center">
							<Smartphone class="w-8 h-8 text-white" />
						</div>
						<CardTitle class="text-white">Smart Sticker Coin</CardTitle>
						<CardDescription class="text-slate-300">
							Adhesive NFC tag. Turns any smartphone case into a business card.
						</CardDescription>
					</CardHeader>
					<CardContent class="text-center">
						<span class="text-4xl font-black text-green-400">₱1,000</span>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full border-white/30 text-white hover:bg-white/20" href="/contact?subject=Smart+Sticker+Coin">Order Now</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	</section>

	<!-- Section III: Lanyards & Add-Ons -->
	<section class="py-16 bg-white dark:bg-background px-4 border-b border-border">
		<div class="container max-w-6xl mx-auto">
			<div class="text-center mb-12">
				<Badge variant="secondary" class="mb-4">III. LANYARDS & ADD-ONS</Badge>
				<h2 class="text-3xl font-bold mb-2">Accessories</h2>
			</div>

			<div class="grid grid-cols-1 lg:grid-cols-2 gap-8">
				<!-- Premium Sublimation Lanyards -->
				<Card class="border-2">
					<CardHeader>
						<CardTitle class="flex items-center gap-2">
							<Tag class="w-5 h-5 text-primary" />
							Premium Sublimation Lanyards
						</CardTitle>
						<CardDescription>
							Full-color print. Soft, high-quality polyester. <strong>Free layout included.</strong>
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div class="rounded-lg border overflow-hidden">
							<table class="w-full text-sm">
								<thead class="bg-muted/50">
									<tr>
										<th class="py-2 px-3 text-left font-medium">Width</th>
										<th class="py-2 px-3 text-right font-medium">1-49 pcs</th>
										<th class="py-2 px-3 text-right font-medium">50-99 pcs</th>
										<th class="py-2 px-3 text-right font-medium">100+ pcs</th>
									</tr>
								</thead>
								<tbody class="divide-y">
									<tr>
										<td class="py-2 px-3">¾ Inch (Standard)</td>
										<td class="py-2 px-3 text-right font-bold">₱60.00</td>
										<td class="py-2 px-3 text-right font-bold">₱50.00</td>
										<td class="py-2 px-3 text-right font-bold text-primary">₱40.00</td>
									</tr>
									<tr>
										<td class="py-2 px-3">1 Inch (Wide)</td>
										<td class="py-2 px-3 text-right font-bold">₱70.00</td>
										<td class="py-2 px-3 text-right font-bold">₱60.00</td>
										<td class="py-2 px-3 text-right font-bold text-primary">₱50.00</td>
									</tr>
								</tbody>
							</table>
						</div>
					</CardContent>
				</Card>

				<!-- Accessories -->
				<Card class="border-2">
					<CardHeader>
						<CardTitle>Accessories</CardTitle>
						<CardDescription>Complete your ID package</CardDescription>
					</CardHeader>
					<CardContent>
						<ul class="space-y-3 text-sm">
							<li class="flex justify-between items-center py-2 border-b">
								<span>Side Release Buckle (Add-on)</span>
								<span class="font-bold">+₱10.00</span>
							</li>
							<li class="flex justify-between items-center py-2 border-b">
								<span>ID Soft Case (Zip-Lock/Resealable)</span>
								<span class="font-bold">₱10.00</span>
							</li>
							<li class="flex justify-between items-center py-2 border-b">
								<span>ID Hard Case (Acrylic)</span>
								<span class="font-bold">₱25.00</span>
							</li>
							<li class="flex justify-between items-center py-2 border-b">
								<span>ID Retractor / Yoyo (Plain)</span>
								<span class="font-bold">₱35.00</span>
							</li>
							<li class="flex justify-between items-center py-2">
								<div>
									<span>Rubber Logo Loop (Custom Brand)</span>
									<span class="text-xs text-muted-foreground block">Min. order 50 pcs</span>
								</div>
								<span class="font-bold">₱50.00</span>
							</li>
						</ul>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full" href="/contact?subject=Lanyard+Accessories+Order">Request Quote</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	</section>

	<!-- Section IV: Event & Specialty Solutions -->
	<section class="py-16 bg-slate-50 dark:bg-slate-900/50 px-4 border-b border-border">
		<div class="container max-w-6xl mx-auto">
			<div class="text-center mb-12">
				<Badge variant="secondary" class="mb-4">IV. EVENT & SPECIALTY SOLUTIONS</Badge>
				<h2 class="text-3xl font-bold mb-2">Conferences, Concerts & Expos</h2>
				<p class="text-muted-foreground">Alternatives to wristbands for events</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
				<Card class="border-2 hover:shadow-lg transition-shadow">
					<CardHeader>
						<CardTitle class="text-lg">Oversized VIP Badge</CardTitle>
						<CardDescription>4"x6" Laminated. Perfect for "All Access" / Media / Staff.</CardDescription>
					</CardHeader>
					<CardContent>
						<span class="text-3xl font-black text-primary">₱150.00</span>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full" href="/contact?subject=VIP+Badge+Order">Request Quote</Button>
					</CardFooter>
				</Card>

				<Card class="border-2 hover:shadow-lg transition-shadow">
					<CardHeader>
						<CardTitle class="text-lg">RFID "Lite" Card</CardTitle>
						<CardDescription>Paper/Eco-Plastic. Disposable smart cards for 1-day events/concerts.</CardDescription>
					</CardHeader>
					<CardContent>
						<span class="text-xl font-bold text-muted-foreground">Call for Bulk Quote</span>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full" href="/contact?subject=RFID+Lite+Event+Cards">Contact Us</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	</section>

	<!-- Section V: Systems Integration -->
	<section class="py-16 bg-white dark:bg-background px-4 border-b border-border">
		<div class="container max-w-6xl mx-auto">
			<div class="text-center mb-12">
				<Badge variant="secondary" class="mb-4">V. SYSTEMS INTEGRATION</Badge>
				<h2 class="text-3xl font-bold mb-2 flex items-center justify-center gap-2">
					<Wrench class="w-8 h-8" />
					Security & Attendance
				</h2>
				<p class="text-muted-foreground">We install the hardware that makes the cards work.</p>
				<p class="text-xs text-muted-foreground mt-2">Note: Prices are estimates. Final quote requires site inspection.</p>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
				<Card class="border-2 border-blue-200 dark:border-blue-800 hover:shadow-lg transition-shadow">
					<CardHeader>
						<div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-4">
							<ShieldCheck class="w-6 h-6 text-blue-600" />
						</div>
						<CardTitle>RFID Time Keeping System</CardTitle>
						<CardDescription>
							Package includes: Biometric/RFID Terminal + Time Attendance Software + Installation.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<p class="text-sm text-muted-foreground mb-2">Starts at</p>
						<span class="text-3xl font-black text-blue-600">₱55,000.00</span>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full border-blue-300" href="/contact?subject=RFID+Time+Keeping+System">Request Site Inspection</Button>
					</CardFooter>
				</Card>

				<Card class="border-2 border-purple-200 dark:border-purple-800 hover:shadow-lg transition-shadow">
					<CardHeader>
						<div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mb-4">
							<Key class="w-6 h-6 text-purple-600" />
						</div>
						<CardTitle>Door Access Control</CardTitle>
						<CardDescription>
							Includes: Maglock, Keypad/Scanner, Exit Button, Power Supply, & Cabling.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<span class="text-xl font-bold text-purple-600">Request for Quotation</span>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full border-purple-300" href="/contact?subject=Door+Access+Control+System">Request Site Inspection</Button>
					</CardFooter>
				</Card>
			</div>
		</div>
	</section>

	<!-- Section: Digital Credits (Subscription) -->
	<section class="py-16 bg-slate-50 dark:bg-slate-900/50 px-4 border-b border-border">
		<div class="container max-w-[90rem] mx-auto">
			<div class="text-center mb-12">
				<Badge variant="outline" class="mb-4 text-primary border-primary">Self-Service</Badge>
				<h2 class="text-3xl font-bold mb-4">Digital Generation Credits</h2>
				<p class="text-muted-foreground">Credits are used to generate and download printable ID files. <strong class="text-primary">1 Credit = 1 Digital ID.</strong></p>
			</div>
			
			<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-start">
				{#each allPackages as pkg}
					<Card class="relative transition-all duration-300 hover:shadow-xl flex flex-col h-full {pkg.color}">
						{#if (pkg as any).popular}
							<div class="absolute -top-3 left-1/2 transform -translate-x-1/2">
								<Badge class="bg-primary text-primary-foreground px-3 py-1 text-xs shadow-md">Best Value</Badge>
							</div>
						{/if}

						<CardHeader class="pb-2 text-center">
							<CardTitle class="text-lg font-bold">{(pkg as any).name}</CardTitle>
							<div class="mt-4 mb-2">
								<span class="text-3xl font-black">
									{#if (pkg as any).amountPhp === -1}
										Custom
									{:else}
										{formatPrice(pkg.amountPhp)}
									{/if}
								</span>
								{#if pkg.amountPhp > 0}
									<span class="text-sm text-muted-foreground"> / package</span>
								{/if}
							</div>
							{#if (pkg as any).pricePerCard && (pkg as any).pricePerCard > 0}
								<p class="text-xs text-muted-foreground">
									{(pkg as any).credits} Digital Card Equivalents
								</p>
							{/if}
						</CardHeader>

						<CardContent class="flex-1">
							<Separator class="my-4" />
							<ul class="space-y-3 text-sm">
								{#each (pkg as any).features as feature}
									<li class="flex items-start gap-2">
										{#if (pkg as any).id === 'enterprise_custom'}
											<Check class="h-4 w-4 text-purple-600 mt-0.5 shrink-0" />
										{:else}
											<Check class="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
										{/if}
										<span class="text-muted-foreground">{feature}</span>
									</li>
								{/each}
								{#if (pkg as any).discount > 0}
									<li class="flex items-start gap-2">
										<Zap class="h-4 w-4 text-yellow-500 mt-0.5 shrink-0" />
										<span class="font-bold text-green-600">Save {(pkg as any).discount}%</span>
									</li>
								{/if}
							</ul>
						</CardContent>

						<CardFooter>
							{#if pkg.id === 'free_starter'}
								<Button variant="outline" class="w-full" onclick={() => purchaseCredits(pkg.id)}>
									Get Started
								</Button>
							{:else if pkg.id === 'enterprise_custom'}
								<Button variant="outline" class="w-full border-purple-200 text-purple-700 hover:bg-purple-50" href="/contact?subject=Enterprise">
									Contact Sales
								</Button>
							{:else}
								<Button 
									variant={(pkg as any).popular ? 'default' : 'secondary'} 
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
						</CardFooter>
					</Card>
				{/each}
			</div>
		</div>
	</section>

	<!-- Important Policies -->
	<section class="py-16 bg-white dark:bg-background px-4">
		<div class="container max-w-4xl mx-auto">
			<div class="text-center mb-12">
				<Badge variant="destructive" class="mb-4">IMPORTANT POLICIES</Badge>
				<h2 class="text-2xl font-bold">Before You Order</h2>
			</div>

			<div class="space-y-6">
				<Card class="border-l-4 border-l-green-500">
					<CardContent class="pt-6">
						<div class="flex items-start gap-4">
							<Check class="w-6 h-6 text-green-500 shrink-0 mt-0.5" />
							<div>
								<h3 class="font-bold mb-1">FREE LAYOUT</h3>
								<p class="text-sm text-muted-foreground">We design for free (Front & Back). Just send your logo and color scheme.</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card class="border-l-4 border-l-blue-500">
					<CardContent class="pt-6">
						<div class="flex items-start gap-4">
							<CreditCard class="w-6 h-6 text-blue-500 shrink-0 mt-0.5" />
							<div>
								<h3 class="font-bold mb-1">PAYMENT</h3>
								<p class="text-sm text-muted-foreground">Downpayment is required before we start the layout process.</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card class="border-l-4 border-l-purple-500">
					<CardContent class="pt-6">
						<div class="flex items-start gap-4">
							<ShieldCheck class="w-6 h-6 text-purple-500 shrink-0 mt-0.5" />
							<div>
								<h3 class="font-bold mb-1">DATA PRIVACY</h3>
								<p class="text-sm text-muted-foreground">Your data is secure with us. Digital ID copies available upon request.</p>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card class="border-l-4 border-l-red-500 bg-red-50/50 dark:bg-red-900/10">
					<CardContent class="pt-6">
						<div class="flex items-start gap-4">
							<AlertTriangle class="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
							<div>
								<h3 class="font-bold mb-1 text-red-700 dark:text-red-400">SECURITY NOTICE</h3>
								<p class="text-sm text-muted-foreground"><strong>STRICTLY NO TO FAKE IDs.</strong> We require a Company P.O., School Certification, or valid proof of authority for all ID orders. We do not print government IDs.</p>
							</div>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	</section>

	<!-- FAQ Footer -->
	<section class="py-16 bg-slate-50 dark:bg-slate-900/50 px-4 text-center">
		<h2 class="text-2xl font-bold mb-6">Still have questions?</h2>
		<p class="text-muted-foreground mb-8">Our support team is ready to help with your specific needs.</p>
		<Button size="lg" href="/contact">Contact Support</Button>
	</section>

</div>
