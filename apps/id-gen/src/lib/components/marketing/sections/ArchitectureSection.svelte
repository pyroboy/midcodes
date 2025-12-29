<script>
	// Architecture Section
	// 5 distinct scroll sections to explain each layer
	
	const layers = [
		{
			id: 'layer-1',
			title: 'Base Grid',
			description: 'The foundational structure. A responsive grid system ensuring perfect alignment for every element.',
			align: 'right'
		},
		{
			id: 'layer-2',
			title: 'Smart Assets',
			description: 'Intelligent containers for photos and graphics that auto-scale and crop faces automatically.',
			align: 'left'
		},
		{
			id: 'layer-3',
			title: 'Live Data',
			description: "Dynamic text fields linked to your organization's database in real-time.",
			align: 'right'
		},
		{
			id: 'layer-4',
			title: 'Secure Encoding',
			description: 'High-density QR codes generated instantly for verification and access control.',
			align: 'left'
		},
		{
			id: 'layer-5',
			title: 'Holographic Security',
			description: 'Top-level security overlays and watermarks to prevent counterfeiting.',
			align: 'right'
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
		<div
			class="sticky top-0 pt-8 pb-4 z-20 bg-gradient-to-b from-background via-background to-transparent"
		>
			<div class="text-center">
				<span
					class="inline-block px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-600 dark:text-blue-400 text-sm font-medium mb-4"
				>
					Architecture
				</span>
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

		<!-- Layers with sticky titles -->
		{#each layers as layer}
			<div
				class="min-h-screen relative flex flex-col"
				data-section-id={layer.id}
			>
				<!-- Sticky Layer Title -->
				<div
					class="sticky top-24 z-10 py-2 {layer.align === 'right' ? 'text-right pr-6 md:pr-16' : 'text-left pl-6 md:pl-16'}"
				>
					<h3 class="text-2xl md:text-4xl font-bold text-foreground inline-block px-4 py-2 bg-background/80 backdrop-blur-sm rounded-lg">
						{layer.title}
					</h3>
				</div>
				
				<!-- Layer Content -->
				<div
					class="flex-1 flex items-center {layer.align === 'right' ? 'justify-end' : 'justify-start'} px-6 md:px-16 pointer-events-none"
				>
					<div class="{layer.align === 'right' ? 'text-right' : 'text-left'} max-w-md">
						<p class="text-lg text-muted-foreground">
							{layer.description}
						</p>
					</div>
				</div>
			</div>
		{/each}
	</section>
</div>
