<script>
	// Architecture Section - Stacking Cards on Scroll

	const layers = [
		{
			id: 'layer-1',
			title: 'Base Grid',
			description: 'The foundational structure. A responsive grid system ensuring perfect alignment for every element.'
		},
		{
			id: 'layer-2',
			title: 'Smart Assets',
			description: 'Intelligent containers for photos and graphics that auto-scale and crop faces automatically.'
		},
		{
			id: 'layer-3',
			title: 'Live Data',
			description: "Dynamic text fields linked to your organization's database in real-time."
		},
		{
			id: 'layer-4',
			title: 'Secure Encoding',
			description: 'High-density QR codes generated instantly for verification and access control.'
		},
		{
			id: 'layer-5',
			title: 'Holographic Security',
			description: 'Top-level security overlays and watermarks to prevent counterfeiting.'
		}
	];
</script>

<div class="w-full">
	<!-- 1. Pure Explosion Phase (Visual Dramatics) -->
	<section
		class="min-h-[400vh] relative flex flex-col px-6 md:px-8"
		data-section-id="layers-main"
	>
		<!-- Sticky Section Header - Positioned at very top -->
		<div class="sticky top-0 pt-12 pb-4 z-20">
			<div class="text-center">
				<h2 class="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-foreground">
					Engineered, Not Just Printed.
				</h2>
			</div>
		</div>

		<!-- Intro Content - Card Explodes Here -->
		<div class="flex-1 flex items-center justify-center">
			<div class="text-center max-w-3xl mx-auto px-6">
				<p class="text-xl md:text-3xl text-muted-foreground font-medium leading-relaxed">
					Our Dynamic Layer engine separates design from data.
				</p>
			</div>
		</div>
	</section>

	<!-- Spacer Section to HOLD the explosion before text reveals -->
	<section class="h-[100vh]" data-section-id="layers-hold"></section>

	<!-- 2. Detailed Explanation Phase (Layer Cards) -->
	<section class="relative px-6 md:px-8 pb-32">
		<!-- Stacking Cards area -->
		<div class="relative max-w-4xl mx-auto w-full">
			{#each layers as layer, index}
				<div
					class="sticky bg-background/80 border border-border rounded-3xl pt-0 p-8 md:p-12 md:pt-0 shadow-2xl mb-8 transition-all hover:border-blue-500/50"
					style="top: {180 + index * 50}px; z-index: {index + 1};"
					data-section-id={layer.id}
				>
					<h3 class="text-2xl md:text-3xl font-black text-foreground mb-4">
						{layer.title}
					</h3>
					<p class="text-lg md:text-xl text-muted-foreground leading-relaxed">
						{layer.description}
					</p>
				</div>
			{/each}
			<!-- Spacer for full stack reveal -->
			<div class="h-[120vh]"></div>
		</div>
	</section>
</div>
