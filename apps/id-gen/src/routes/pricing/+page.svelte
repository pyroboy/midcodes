<script lang="ts">
	import { Card, CardContent, CardHeader, CardTitle } from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import { Badge } from '$lib/components/ui/badge';
	import { CREDIT_PACKAGES, PREMIUM_FEATURES } from '$lib/payments/catalog';
	import { createCreditPayment, createFeaturePayment } from '$lib/remote/payments.remote';
	import { paymentFlags } from '$lib/stores/featureFlags';

	interface Props {
		data?: any;
	}

	let { data }: Props = $props();

	// State for purchase actions
	let isLoading = $state(false);
	let purchasingPackage = $state<string | null>(null);
	let purchasingFeature = $state<string | null>(null);

	// Check if payments are enabled from both data and store
	const paymentsEnabled = $derived(
		(data?.paymentsEnabled ?? true) && $paymentFlags.paymentsEnabled
	);

	// Enhance packages with computed UI properties
	const enhancedPackages = CREDIT_PACKAGES.map((pkg, index) => ({
		...pkg,
		price: pkg.amountPhp,
		pricePerCard: pkg.amountPhp / pkg.credits,
		discount:
			index > 0
				? Math.round(
						(1 -
							pkg.amountPhp /
								pkg.credits /
								(CREDIT_PACKAGES[0].amountPhp / CREDIT_PACKAGES[0].credits)) *
							100
					)
				: 0,
		popular: pkg.id === 'credits_1000' // Mark 1000 credits as most popular
	}));

	function formatPrice(price: number): string {
		return new Intl.NumberFormat('en-PH', {
			style: 'currency',
			currency: 'PHP',
			minimumFractionDigits: 0
		}).format(price);
	}

	async function purchaseCredits(packageId: string) {
		if (!data?.user) {
			window.location.href = '/auth';
			return;
		}

		purchasingPackage = packageId;
		isLoading = true;

		try {
			// Use payment remote function instead of direct API call
			const result = await createCreditPayment({
				packageId,
				method: undefined, // Let system choose available methods
				returnTo: window.location.href // Return to pricing page after payment
			});

			// Redirect to checkout URL (PayMongo or bypass success page)
			window.location.href = result.checkoutUrl;
		} catch (error) {
			console.error('Payment error:', error);
			alert('Failed to process payment. Please try again.');
		} finally {
			purchasingPackage = null;
			isLoading = false;
		}
	}

	async function purchaseFeature(featureId: string) {
		if (!data?.user) {
			window.location.href = '/auth';
			return;
		}

		purchasingFeature = featureId;
		isLoading = true;

		try {
			// Use payment remote function instead of direct API call
			const result = await createFeaturePayment({
				featureId,
				method: undefined, // Let system choose available methods
				returnTo: window.location.href // Return to pricing page after payment
			});

			// Redirect to checkout URL (PayMongo or bypass success page)
			window.location.href = result.checkoutUrl;
		} catch (error) {
			console.error('Payment error:', error);
			alert('Failed to process payment. Please try again.');
		} finally {
			purchasingFeature = null;
			isLoading = false;
		}
	}
</script>

<svelte:head>
	<title>Pricing - ID Generator</title>
	<meta
		name="description"
		content="Choose the perfect plan for your ID card generation needs. Affordable credit packages and premium features."
	/>
</svelte:head>

<div class="container mx-auto px-4 py-8 max-w-7xl">
	<!-- Hero Section -->
	<div class="text-center mb-12">
		<h1 class="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
			Simple, Transparent Pricing
		</h1>
		<p class="text-xl text-gray-600 dark:text-gray-300 mb-6 max-w-3xl mx-auto">
			Choose from flexible credit packages or unlock premium features. Perfect for individuals,
			small businesses, and large organizations.
		</p>

		{#if !paymentsEnabled}
			<div class="max-w-2xl mx-auto mb-6">
				<div
					class="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4"
				>
					<div class="flex items-center gap-3">
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z"
							/>
						</svg>
						<div>
							<h3 class="text-sm font-medium text-orange-800 dark:text-orange-200">
								Purchases Temporarily Disabled
							</h3>
							<p class="text-sm text-orange-700 dark:text-orange-300 mt-1">
								Payments are disabled for your organization. Please contact an administrator for
								manual credit provisioning. Prices shown are for reference only.
							</p>
						</div>
					</div>
				</div>
			</div>
		{/if}

		<!-- Free Tier Info -->
		<Card
			class="max-w-md mx-auto bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800"
		>
			<CardContent class="p-6">
				<div class="flex items-center justify-center mb-4">
					<div
						class="w-12 h-12 bg-green-100 dark:bg-green-900/50 rounded-full flex items-center justify-center"
					>
						<svg
							xmlns="http://www.w3.org/2000/svg"
							class="h-6 w-6 text-green-600"
							fill="none"
							viewBox="0 0 24 24"
							stroke="currentColor"
						>
							<path
								stroke-linecap="round"
								stroke-linejoin="round"
								stroke-width="2"
								d="M5 13l4 4L19 7"
							/>
						</svg>
					</div>
				</div>
				<h3 class="text-lg font-semibold text-green-800 dark:text-green-300 mb-2">Free Tier</h3>
				<p class="text-green-700 dark:text-green-400">
					<strong>2 templates</strong> and <strong>10 card generations</strong> - completely free!
				</p>
			</CardContent>
		</Card>
	</div>

	<!-- Credit Packages -->
	<div class="mb-16">
		<div class="text-center mb-8">
			<h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Credit Packages</h2>
			<p class="text-lg text-gray-600 dark:text-gray-300">
				Generate more ID cards with our affordable credit packages
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
			{#each enhancedPackages as pkg}
				<Card
					class="relative transition-all duration-200 hover:shadow-xl {pkg.popular
						? 'ring-2 ring-primary scale-105'
						: ''}"
				>
					{#if pkg.popular}
						<div class="absolute -top-4 left-1/2 transform -translate-x-1/2">
							<Badge class="bg-primary text-white px-4 py-1">Most Popular</Badge>
						</div>
					{/if}

					<CardHeader class="text-center pb-4">
						<CardTitle class="text-xl font-bold">{pkg.name}</CardTitle>
						<div class="text-3xl font-bold text-primary">{formatPrice(pkg.price)}</div>
						<p class="text-sm text-gray-500 dark:text-gray-400">
							{formatPrice(pkg.pricePerCard)}/card
						</p>
					</CardHeader>

					<CardContent class="pt-0">
						<div class="space-y-4">
							<div class="text-center">
								<div class="text-2xl font-bold text-gray-900 dark:text-white">{pkg.credits}</div>
								<div class="text-sm text-gray-500 dark:text-gray-400">ID Cards</div>
							</div>

							<div class="space-y-2 text-sm">
								<div class="flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4 text-green-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									<span>High quality PNG/PDF export</span>
								</div>
								<div class="flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4 text-green-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									<span>All available templates</span>
								</div>
								<div class="flex items-center gap-2">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										class="h-4 w-4 text-green-600"
										fill="none"
										viewBox="0 0 24 24"
										stroke="currentColor"
									>
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M5 13l4 4L19 7"
										/>
									</svg>
									<span>Credits never expire</span>
								</div>
								{#if pkg.discount}
									<div class="flex items-center gap-2 text-green-600">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-4 w-4"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
											/>
										</svg>
										<span class="font-medium">Save {pkg.discount}%</span>
									</div>
								{/if}
							</div>

							<p class="text-xs text-gray-500 dark:text-gray-400 text-center">
								{pkg.description}
							</p>

							{#if !paymentsEnabled}
								<div
									class="w-full px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md"
								>
									Contact admin for provisioning
								</div>
							{:else}
								<Button
									class="w-full {pkg.popular ? 'bg-primary hover:bg-primary/90' : ''}"
									variant={pkg.popular ? 'default' : 'outline'}
									disabled={isLoading}
									onclick={() => purchaseCredits(pkg.id)}
								>
									{#if purchasingPackage === pkg.id}
										<svg
											class="animate-spin -ml-1 mr-3 h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Processing...
									{:else}
										Purchase Credits
									{/if}
								</Button>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	</div>

	<!-- Premium Features -->
	<div class="mb-16">
		<div class="text-center mb-8">
			<h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">Premium Features</h2>
			<p class="text-lg text-gray-600 dark:text-gray-300">
				Unlock additional capabilities for your ID card generation
			</p>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
			{#each PREMIUM_FEATURES as feature}
				<Card class="transition-all duration-200 hover:shadow-xl">
					<CardHeader class="text-center">
						<CardTitle class="text-2xl font-bold">{feature.name}</CardTitle>
						<div class="text-4xl font-bold text-primary">{formatPrice(feature.price)}</div>
						<p class="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">
							{feature.type === 'one_time' ? 'One-time purchase' : 'Monthly'}
						</p>
					</CardHeader>

					<CardContent class="pt-0">
						<div class="space-y-6">
							<p class="text-gray-600 dark:text-gray-300 text-center">
								{feature.description}
							</p>

							<div class="space-y-3">
								{#if feature.id === 'unlimited_templates'}
									<div class="flex items-center gap-3">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-green-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>Create unlimited custom templates</span>
									</div>
									<div class="flex items-center gap-3">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-green-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>Advanced design tools</span>
									</div>
									<div class="flex items-center gap-3">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-green-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>Save and share templates</span>
									</div>
								{:else if feature.id === 'remove_watermarks'}
									<div class="flex items-center gap-3">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-green-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>Clean, professional output</span>
									</div>
									<div class="flex items-center gap-3">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-green-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>Perfect for commercial use</span>
									</div>
									<div class="flex items-center gap-3">
										<svg
											xmlns="http://www.w3.org/2000/svg"
											class="h-5 w-5 text-green-600"
											fill="none"
											viewBox="0 0 24 24"
											stroke="currentColor"
										>
											<path
												stroke-linecap="round"
												stroke-linejoin="round"
												stroke-width="2"
												d="M5 13l4 4L19 7"
											/>
										</svg>
										<span>Higher resolution exports</span>
									</div>
								{/if}
							</div>

							{#if !paymentsEnabled}
								<div
									class="w-full px-3 py-2 text-center text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 rounded-md"
								>
									Contact admin for provisioning
								</div>
							{:else}
								<Button
									class="w-full"
									variant="default"
									disabled={isLoading}
									onclick={() => purchaseFeature(feature.id)}
								>
									{#if purchasingFeature === feature.id}
										<svg
											class="animate-spin -ml-1 mr-3 h-4 w-4"
											xmlns="http://www.w3.org/2000/svg"
											fill="none"
											viewBox="0 0 24 24"
										>
											<circle
												class="opacity-25"
												cx="12"
												cy="12"
												r="10"
												stroke="currentColor"
												stroke-width="4"
											></circle>
											<path
												class="opacity-75"
												fill="currentColor"
												d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
											></path>
										</svg>
										Processing...
									{:else}
										Purchase Feature
									{/if}
								</Button>
							{/if}
						</div>
					</CardContent>
				</Card>
			{/each}
		</div>
	</div>

	<!-- FAQ Section -->
	<div class="text-center">
		<h2 class="text-3xl font-bold text-gray-900 dark:text-white mb-8">
			Frequently Asked Questions
		</h2>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
			<Card>
				<CardHeader>
					<CardTitle class="text-lg">How do credits work?</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-gray-600 dark:text-gray-300">
						Each credit allows you to generate one ID card. Credits never expire and can be used
						anytime after purchase. You start with 10 free card generations.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle class="text-lg">What payment methods do you accept?</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-gray-600 dark:text-gray-300">
						We accept major credit/debit cards, GCash, PayMaya, GrabPay, and online banking through
						our secure PayMongo integration.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle class="text-lg">Can I get a refund?</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-gray-600 dark:text-gray-300">
						Unused credits can be refunded within 30 days of purchase. Premium features are
						non-refundable once activated.
					</p>
				</CardContent>
			</Card>

			<Card>
				<CardHeader>
					<CardTitle class="text-lg">Do you offer discounts for bulk purchases?</CardTitle>
				</CardHeader>
				<CardContent>
					<p class="text-gray-600 dark:text-gray-300">
						Yes! Our larger credit packages offer significant savings. For enterprise needs (1000+
						cards), contact us for custom pricing.
					</p>
				</CardContent>
			</Card>
		</div>

		<div class="mt-12">
			<p class="text-gray-600 dark:text-gray-300 mb-6">
				Need help choosing the right plan? Have questions about bulk pricing?
			</p>
			<Button href="/contact" variant="outline" size="lg">Contact Support</Button>
		</div>
	</div>
</div>
