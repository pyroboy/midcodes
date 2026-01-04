<script>
	// Architecture Section - Stacking Cards on Scroll

	const layers = [
		{
			id: 'layer-1',
			title: 'Card Body',
			description: 'The physical card substrate — a durable, high-quality material that forms the foundation of the ID.'
		},
		{
			id: 'layer-2',
			title: 'Base Grid',
			description: 'The foundational structure. A responsive grid system ensuring perfect alignment for every element.'
		},
		{
			id: 'layer-3',
			title: 'Smart Assets',
			description: 'Intelligent containers for photos and graphics that auto-scale and crop faces automatically.'
		},
		{
			id: 'layer-4',
			title: 'Live Data',
			description: "Dynamic text fields linked to your organization's database in real-time."
		},
		{
			id: 'layer-5',
			title: 'Secure Encoding',
			description: 'High-density QR codes generated instantly for verification and access control.'
		},
		{
			id: 'layer-6',
			title: 'Holographic Security',
			description: 'Top-level security overlays and watermarks to prevent counterfeiting.'
		},
		{
			id: 'layer-7',
			title: 'Card Back',
			description: 'The reverse side featuring branding, contact information, and additional security elements.'
		}
	];
</script>

<div class="w-full">
	<!-- 1. Pure Explosion Phase (Visual Dramatics) -->
	<section
		class="min-h-[120vh] relative flex flex-col items-center justify-center px-6 md:px-8"
		data-section-id="layers-main"
	>
		<div class="text-center max-w-4xl mx-auto z-10">
			<h2 class="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-8">
				Engineered, Not Just Printed.
			</h2>
			<p class="text-xl md:text-3xl text-muted-foreground font-medium leading-relaxed">
				Our Dynamic Layer engine separates design from data.
			</p>
		</div>
	</section>

	<!-- Spacer to transition from explosion to details -->
	<section class="min-h-[50vh]" data-section-id="layers-hold"></section>

	<!-- 2. Detailed Explanation Phase (Layer Cards) -->
	<section class="relative px-6 md:px-8 pb-32">
		<div class="relative w-full max-w-4xl mx-auto flex flex-col gap-0">
			{#each layers as layer}
				<!-- Each layer gets its own 120vh section for clear breakdown -->
				<div
					class="min-h-[120vh] flex flex-col justify-center items-start md:pl-20"
					data-section-id={layer.id}
				>
					<div
						class="bg-background/80 border border-border rounded-3xl p-8 md:p-12 shadow-2xl  max-w-xl"
					>
						<h3 class="text-2xl md:text-3xl font-black text-foreground mb-4">
							{layer.title}
						</h3>
						<p class="text-lg md:text-xl text-muted-foreground leading-relaxed">
							{layer.description}
						</p>
					</div>
				</div>
			{/each}
		</div>
	</section>

	<!-- 3. Assembly Phase (Quantum Spin Collapse) -->
	<section
		class="min-h-[130vh] relative flex flex-col items-center justify-center px-6 md:px-8"
		data-section-id="layer-assemble"
	>
		<div class="text-center max-w-4xl mx-auto z-10">
			<h2 class="text-4xl sm:text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-8">
				Assembled in Milliseconds.
			</h2>
			<p class="text-xl md:text-3xl text-muted-foreground font-medium leading-relaxed">
				All layers merge instantly into a production-ready ID.
			</p>
		</div>
	</section>
</div>
