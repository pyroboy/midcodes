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
	<!-- Main Architecture Section with Sticky Header -->
	<section
		class="min-h-[500vh] relative flex flex-col px-6 md:px-8"
		data-section-id="layers-main"
	>
		<!-- Sticky Section Header -->
		<div class="sticky top-16 pt-6 pb-4 z-20">
			<div class="text-center">
				<h2 class="text-3xl sm:text-4xl md:text-6xl font-bold leading-tight text-foreground">
					Engineered, Not Just Printed.
				</h2>
			</div>
		</div>

		<!-- Intro Content -->
		<div class="h-screen flex items-center justify-center">
			<div class="text-center max-w-3xl mx-auto">
				<p class="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
					Our Dynamic Layer engine separates design from data. Update templates without regenerating
					thousands of cards.
				</p>
			</div>
		</div>

		<!-- Stacking Cards that reveal as you scroll -->
		<div class="relative max-w-2xl mx-auto w-full">
			{#each layers as layer, index}
				<div
					class="sticky bg-background border border-border rounded-2xl p-6 md:p-8 shadow-lg mb-4"
					style="top: {100 + index * 24}px; z-index: {index + 1};"
					data-section-id={layer.id}
				>
					<h3 class="text-xl md:text-2xl font-bold text-foreground mb-3">
						{layer.title}
					</h3>
					<p class="text-base text-muted-foreground leading-relaxed">
						{layer.description}
					</p>
				</div>
			{/each}
			<!-- Spacer for full stack reveal -->
			<div class="h-[100vh]"></div>
		</div>
	</section>
</div>
