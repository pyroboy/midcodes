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
	import { Check, Zap, CreditCard, Camera, Database, MapPin } from 'lucide-svelte';
	import { getPreloadState } from '$lib/services/preloadService';
	import PricingPageSkeleton from '$lib/components/skeletons/PricingPageSkeleton.svelte';

	interface Props {
		data?: any;
	}

	let { data }: Props = $props();

	// Smart Loading State
	const preloadState = getPreloadState('/pricing');
	let isStructureReady = $derived($preloadState?.skeleton === 'ready');
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
	<title>Rates & Pricing - KINATAO</title>
	<meta
		name="description"
		content="Simple pricing for ID generation, printing, and professional services."
	/>
</svelte:head>

<div class="min-h-screen bg-background text-foreground">
	
	<!-- Header -->
	<section class="py-16 md:py-24 text-center px-4">
		<h1 class="text-4xl md:text-6xl font-black tracking-tight mb-6">
			Rates & <span class="text-primary">Pricing</span>
		</h1>
		<p class="text-xl text-muted-foreground max-w-2xl mx-auto">
			Start for free, upgrade for volume. Transparent rates for physical printing and digital generation.
		</p>
	</section>

	<!-- Section 1: Physical Printing & Professional Services -->
	<section class="py-16 bg-slate-50 dark:bg-slate-900/50 px-4 border-b border-border">
		<div class="container max-w-6xl mx-auto">
			<div class="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
				
				<!-- Column 1: Descriptions -->
				<div class="space-y-8">
					<!-- Printing Description Card -->
					<Card class="bg-card/50 backdrop-blur-sm border-2">
						<CardHeader>
							<div class="mb-2">
								<Badge variant="outline" class="text-orange-500 border-orange-500">Most Popular Service</Badge>
							</div>
							<CardTitle class="text-2xl">We Print & Ship</CardTitle>
							<CardDescription>
								Need physical cards? We offer professional PVC printing with industrial-grade retransfer printers. Durable, waterproof, and fadeproof.
							</CardDescription>
						</CardHeader>
						<CardContent class="grid gap-6">
							<div class="flex gap-4">
								<div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0">
									<CreditCard class="w-5 h-5 text-orange-600" />
								</div>
								<div>
									<h3 class="font-bold text-base">Premium PVC Material</h3>
									<p class="text-sm text-muted-foreground">Standard CR80 size (credit card). Glossy finish with edge-to-edge printing.</p>
								</div>
							</div>
							<div class="flex gap-4">
								<div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
									<Zap class="w-5 h-5 text-blue-600" />
								</div>
								<div>
									<h3 class="font-bold text-base">Fast Turnaround</h3>
									<p class="text-sm text-muted-foreground">Most orders process within 24-48 hours. Nationwide shipping.</p>
								</div>
							</div>
						</CardContent>
					</Card>

					<!-- Professional Services Description Card -->
					<Card class="bg-card/50 backdrop-blur-sm border-2">
						<CardHeader>
							<div class="mb-2">
								<Badge variant="outline" class="text-purple-500 border-purple-500">Professional Solutions</Badge>
							</div>
							<CardTitle class="text-2xl">On-Site & Data Services</CardTitle>
							<CardDescription>
								For schools, companies, and events, we provide end-to-end solutions.
							</CardDescription>
						</CardHeader>
						<CardContent class="grid gap-6">
							<div class="flex gap-4">
								<div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
									<Camera class="w-5 h-5 text-purple-600" />
								</div>
								<div>
									<h3 class="font-bold text-base">On-Site Capture Team</h3>
									<p class="text-sm text-muted-foreground">We deploy a professional team with proper lighting and backdrops to your location for standardized photo capture.</p>
								</div>
							</div>
							<div class="flex gap-4">
								<div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
									<Database class="w-5 h-5 text-purple-600" />
								</div>
								<div>
									<h3 class="font-bold text-base">Batch Data Processing</h3>
									<p class="text-sm text-muted-foreground">Cleaning, formatting, and encoding of large datasets from Excel/CSV files.</p>
								</div>
							</div>
						</CardContent>
					</Card>
				</div>

				<!-- Column 2: Rate Cards -->
				<div class="space-y-6">
					
					<!-- Printing Rates Card -->
					<Card class="border-2 border-muted shadow-lg bg-background">
						<CardHeader>
							<CardTitle>Printing Rates</CardTitle>
							<CardDescription>Price per printed card (excluding credits)</CardDescription>
						</CardHeader>
						<CardContent>
							<div class="rounded-lg border overflow-hidden">
								<table class="w-full text-sm">
									<thead class="bg-muted/50">
										<tr>
											<th class="py-3 px-4 text-left font-medium">Quantity</th>
											<th class="py-3 px-4 text-right font-medium">Rate</th>
										</tr>
									</thead>
									<tbody class="divide-y">
									<tr>
										<td class="py-3 px-4">
											1 - 10 Cards
											<Badge variant="secondary" class="ml-2 bg-red-100 text-red-700 border-red-200">PROMO</Badge>
										</td>
										<td class="py-3 px-4 text-right font-bold">
											<span class="line-through text-muted-foreground font-normal text-xs mr-2">₱75.00</span>
											<span class="text-red-600">₱40.00 each</span>
										</td>
									</tr>
									<tr>
										<td class="py-3 px-4">
											11 - 50 Cards
											<Badge variant="secondary" class="ml-2 bg-red-100 text-red-700 border-red-200">PROMO</Badge>
										</td>
										<td class="py-3 px-4 text-right font-bold">
											<span class="line-through text-muted-foreground font-normal text-xs mr-2">₱60.00</span>
											<span class="text-red-600">₱40.00 each</span>
										</td>
									</tr>
									<tr>
										<td class="py-3 px-4">
											51 - 499 Cards
											<Badge variant="secondary" class="ml-2 bg-red-100 text-red-700 border-red-200">PROMO</Badge>
										</td>
										<td class="py-3 px-4 text-right font-bold">
											<span class="line-through text-muted-foreground font-normal text-xs mr-2">₱50.00</span>
											<span class="text-red-600">₱40.00 each</span>
										</td>
									</tr>
									<tr class="bg-primary/5">
										<td class="py-3 px-4 text-primary font-bold">500+ Cards (Bulk)</td>
										<td class="py-3 px-4 text-right font-bold text-primary">₱30.00 each</td>
									</tr>
								</tbody>
							</table>
						</div>
						<p class="text-xs text-center mt-4 text-muted-foreground space-y-1">
							<span class="block">* Free shipping for orders above ₱2,000.</span>
							<span class="block text-orange-600/80">Lost/Single ID Replacement: ₱250.00</span>
						</p>
					</CardContent>
					<CardFooter>
						<Button variant="outline" class="w-full" href="/contact?subject=Printing+Order">Request Printing Quote</Button>
					</CardFooter>
				</Card>

				<!-- Service Rates Card -->
				<Card class="border-2 border-purple-100 dark:border-purple-900 shadow-md bg-background relative overflow-hidden">
					<div class="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
						<MapPin class="w-32 h-32" />
					</div>
					<CardHeader>
						<CardTitle class="text-purple-700 dark:text-purple-400">Service Rates</CardTitle>
						<CardDescription>Professional fees for on-site execution</CardDescription>
					</CardHeader>
					<CardContent>
						<!-- Bohol Promo -->
						<div class="mb-6 p-4 bg-purple-100 dark:bg-purple-900/40 rounded-lg border border-purple-200 dark:border-purple-800">
							<div class="flex items-center gap-2 mb-3">
								<Badge class="bg-purple-600 hover:bg-purple-700">BOHOL PROMO</Badge>
								<span class="text-xs font-bold uppercase tracking-wide text-purple-700 dark:text-purple-300">Limited Time</span>
							</div>
							
							<div class="space-y-2">
								<div class="flex justify-between items-center">
									<span class="font-bold text-lg text-foreground">On-Site Data Entry</span>
									<span class="bg-white dark:bg-black/20 px-2 py-0.5 rounded text-sm whitespace-nowrap">
										<span class="line-through text-muted-foreground mr-1">₱4,000</span>
										<span class="text-green-600 dark:text-green-400 font-black">FREE</span>
									</span>
								</div>
								<div class="flex justify-between items-center">
									<span class="font-bold text-lg text-foreground">Data Processing</span>
									<span class="bg-white dark:bg-black/20 px-2 py-0.5 rounded text-sm whitespace-nowrap">
										<span class="line-through text-muted-foreground mr-1">₱2,500</span>
										<span class="text-green-600 dark:text-green-400 font-black">FREE</span>
									</span>
								</div>
							</div>

							<p class="text-sm text-muted-foreground mt-3 pt-3 border-t border-purple-200 dark:border-purple-800">
								Anywhere in Bohol • Min. 300 Cards
							</p>
						</div>

						<div class="rounded-lg border overflow-hidden">
							<table class="w-full text-sm">
								<thead class="bg-purple-50 dark:bg-purple-900/20">
									<tr>
										<th class="py-3 px-4 text-left font-medium">Service / Location</th>
										<th class="py-3 px-4 text-right font-medium">Rate</th>
									</tr>
								</thead>
								<tbody class="divide-y">
									<tr>
										<td class="py-3 px-4 font-medium" colspan="2">On-Site Capture Team</td>
									</tr>
									<tr>
										<td class="py-2 px-4 pl-8 text-muted-foreground">Standardized Photo & Data Collection</td>
										<td class="py-2 px-4 text-right text-purple-600 font-bold">Contact Us</td>
									</tr>
									<tr class="bg-muted/30">
										<td class="py-3 px-4 font-medium" colspan="2">Data Processing</td>
									</tr>
									<tr>
										<td class="py-2 px-4 pl-8 text-muted-foreground">Batch Cleaning</td>
										<td class="py-2 px-4 text-right text-xs">Starts at ₱2,500</td>
									</tr>
								</tbody>
							</table>
						</div>
					</CardContent>
						<CardFooter>
							<Button variant="link" class="w-full text-purple-600" href="/contact?subject=Professional+Services">Book a Team &rarr;</Button>
						</CardFooter>
					</Card>

				</div>
			</div>
		</div>
	</section>

	<!-- Section 2: Digital Credits (Generation) -->
	<section class="py-16 bg-white dark:bg-background px-4">
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

	<!-- FAQ Footer -->
	<section class="py-16 bg-white dark:bg-background px-4 text-center">
		<h2 class="text-2xl font-bold mb-6">Still have questions?</h2>
		<p class="text-muted-foreground mb-8">Our support team is ready to help you specific needs.</p>
		<Button size="lg" href="/contact">Contact Support</Button>
	</section>

</div>
