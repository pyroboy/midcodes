<script lang="ts">
	// Use Cases Section - Scroll-driven horizontal animation
	import { getScrollState } from '$lib/marketing/scroll';

	const scrollState = getScrollState();

	// Split into two rows
	const useCasesRow1 = [
		{ id: 'business', title: 'Digital Business Cards', description: 'Share contact info with a tap' },
		{ id: 'review', title: 'Review Cards', description: 'Collect customer feedback instantly' },
		{ id: 'wifi', title: 'WiFi Access Cards', description: 'One tap wireless network access' },
		{ id: 'medical', title: 'Medical Cards', description: 'Allergies, conditions, emergency contacts' },
		{ id: 'pet', title: 'Pet ID Tags', description: 'Owner info and medical history' }
	];

	const useCasesRow2 = [
		{ id: 'product', title: 'Product Auth', description: 'Verify authenticity, track provenance' },
		{ id: 'employee', title: 'Employee Badges', description: 'Accurate clock-in, real-time reports' },
		{ id: 'school', title: 'School IDs', description: 'Student attendance and campus access' },
		{ id: 'event', title: 'Event Tickets', description: 'VIP zones, session tracking' },
		{ id: 'gym', title: 'Gym Membership', description: 'Access control and usage analytics' }
	];

	// Calculate horizontal scroll based on section progress
	let translateX = $derived(() => {
		const section = scrollState.currentSection;
		const progress = scrollState.sectionProgress;

		// Only animate when in useCases sections
		if (section === 'useCases-networking') {
			return progress * -33; // First third of scroll
		} else if (section === 'useCases-identification') {
			return -33 + (progress * -33); // Second third
		} else if (section === 'useCases-attendance') {
			return -66 + (progress * -34); // Final third
		}

		// Check if we're past useCases
		if (section === 'systemScale' || section === 'physical' || section === 'footer' || section === 'segmentation') {
			return -100;
		}

		return 0;
	});
</script>

<!-- Use Cases Section with Scroll-driven Horizontal Animation -->
<section class="h-[400vh] relative" data-section-id="useCases-networking">
	<!-- Sticky container -->
	<div class="sticky top-16 h-[calc(100vh-4rem)] flex flex-col justify-center overflow-hidden">
		<!-- Section Header -->
		<div class="text-center px-6 md:px-8 mb-12">
			<h2 class="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight text-foreground">
				One Platform, Endless Uses.
			</h2>
			<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mt-4 leading-relaxed">
				From business cards to gym memberships, we've got you covered.
			</p>
		</div>

		<!-- Two rows of cards that scroll horizontally -->
		<div class="space-y-4">
			<!-- Row 1 -->
			<div
				class="flex gap-4 px-6 transition-transform duration-100 ease-out"
				style="transform: translateX({translateX()}%);"
			>
				{#each useCasesRow1 as useCase}
					<div
						class="flex-shrink-0 w-72 bg-background border border-border rounded-2xl overflow-hidden"
					>
						<div class="w-full h-32 bg-muted flex items-center justify-center">
							<svg class="w-12 h-12 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
						<div class="p-4">
							<h3 class="font-semibold text-foreground mb-1">{useCase.title}</h3>
							<p class="text-sm text-muted-foreground">{useCase.description}</p>
						</div>
					</div>
				{/each}
			</div>

			<!-- Row 2 (scrolls opposite direction for visual interest) -->
			<div
				class="flex gap-4 px-6 transition-transform duration-100 ease-out"
				style="transform: translateX({-translateX() - 20}%);"
			>
				{#each useCasesRow2 as useCase}
					<div
						class="flex-shrink-0 w-72 bg-background border border-border rounded-2xl overflow-hidden"
					>
						<div class="w-full h-32 bg-muted flex items-center justify-center">
							<svg class="w-12 h-12 text-muted-foreground/30" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
							</svg>
						</div>
						<div class="p-4">
							<h3 class="font-semibold text-foreground mb-1">{useCase.title}</h3>
							<p class="text-sm text-muted-foreground">{useCase.description}</p>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</section>

<!-- Additional scroll sections for animation timing -->
<section class="h-[200vh]" data-section-id="useCases-identification"></section>
<section class="h-[150vh]" data-section-id="useCases-attendance"></section>

<!-- Impact / Scale -->
<section class="min-h-[300vh] relative px-6 md:px-8 flex flex-col" data-section-id="systemScale">
	<!-- Sticky Title at Top -->
	<div class="sticky top-16 pt-6 pb-4 z-10">
		<div class="text-center">
			<h2 class="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight text-foreground">System Scale.</h2>
		</div>
	</div>

	<!-- Spacer to push content to bottom -->
	<div class="flex-1"></div>

	<!-- Sticky Content at Bottom -->
	<div class="sticky bottom-0 pb-12 pt-4 z-10">
		<div class="text-center max-w-3xl mx-auto">
			<div class="grid grid-cols-2 gap-8 mb-8">
				<div>
					<div class="text-4xl md:text-5xl font-black text-foreground mb-2">1.2M+</div>
					<p class="text-muted-foreground">Verifications Logged</p>
				</div>
				<div>
					<div class="text-4xl md:text-5xl font-black text-foreground mb-2">24</div>
					<p class="text-muted-foreground">Active Partners</p>
				</div>
			</div>
			<p class="text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
				Trusted by schools, government offices, and event organizers across the Philippines.
			</p>
		</div>
	</div>
</section>

<!-- Segmentation (Call to Action) -->
<section class="min-h-screen flex items-center justify-center px-0" data-section-id="segmentation">
	<div class="flex flex-col md:flex-row w-full min-h-[60vh]">
		<!-- Organization Side -->
		<div
			class="flex-1 flex flex-col items-center justify-center p-8 border-b md:border-b-0 md:border-r border-border"
		>
			<div class="max-w-md text-center md:text-right md:pr-12 md:mr-auto w-full">
				<h3 class="text-3xl font-bold mb-4 text-foreground">For Organizations</h3>
				<p class="text-muted-foreground mb-8 text-lg">
					Secure your campus or company. Unified attendance and access control.
				</p>
				<a
					href="/enterprise"
					class="text-blue-500 font-semibold hover:text-blue-400 flex items-center gap-2 justify-center md:justify-end"
				>
					Explore Enterprise Solutions
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 8l4 4m0 0l-4 4m4-4H3"
						/></svg
					>
				</a>
			</div>
		</div>

		<!-- Individual Side -->
		<div class="flex-1 flex flex-col items-center justify-center p-8">
			<div class="max-w-md text-center md:text-left md:pl-12 md:ml-auto w-full">
				<h3 class="text-3xl font-bold mb-4 text-foreground">For Individuals</h3>
				<p class="text-muted-foreground mb-8 text-lg">
					Upgrade your networking. One card to share your entire professional portfolio.
				</p>
				<a
					href="/personal"
					class="text-purple-500 font-semibold hover:text-purple-400 flex items-center gap-2 justify-center md:justify-start"
				>
					Get Your Personal Card
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"
						><path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M17 8l4 4m0 0l-4 4m4-4H3"
						/></svg
					>
				</a>
			</div>
		</div>
	</div>
</section>
