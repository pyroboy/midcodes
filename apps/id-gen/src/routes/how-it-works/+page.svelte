<script lang="ts">
	import { fade, fly, slide } from 'svelte/transition';
	import { onMount } from 'svelte';
	import { Button } from '$lib/components/ui/button';
	import { 
		Palette, 
		ShieldCheck, 
		Smartphone, 
		Users, 
		Truck, 
		Smile, 
		ArrowRight,
		CheckCircle2
	} from 'lucide-svelte';

	let visible = false;
	onMount(() => {
		visible = true;
	});

	const steps = [
		{
			title: "Create & Customize",
			description: "Start by choosing a Premium Template. Position elements, add logos, and tailor the design to your brand.",
			icon: Palette,
			color: "bg-blue-500",
			delay: 200
		},
		{
			title: "Add Security",
			description: "Enhance your IDs with specialized security features like QR codes, barcodes, and watermarks.",
			icon: ShieldCheck,
			color: "bg-indigo-500",
			delay: 400
		},
		{
			title: "Capture Data Instantly",
			description: "Use our mobile app feature to snap photos of employees or students directly into the system. No manual uploads needed.",
			icon: Smartphone,
			color: "bg-purple-500",
			delay: 600
		},
		{
			title: "Batch & Repeat",
			description: "Save a profile, then jump to the next. Our workflow is optimized for speed, handling hundreds of entries effortlessly.",
			icon: Users,
			color: "bg-pink-500",
			delay: 800
		},
		{
			title: "Order for Delivery",
			description: "Submit your batch for professional printing. We handle the production and ship the finished cards to your doorstep.",
			icon: Truck,
			color: "bg-orange-500",
			delay: 1000
		},
		{
			title: "Enjoy Your IDs",
			description: "Receive your high-quality, durable IDs ready for distribution. Fast. Modern. Secure.",
			icon: Smile,
			color: "bg-green-500",
			delay: 1200
		}
	];
</script>

<div class="min-h-screen bg-background py-16 px-4 md:px-8 overflow-hidden">
	{#if visible}
		<!-- Header -->
		<div class="text-center max-w-3xl mx-auto mb-16" in:fly={{ y: -50, duration: 800 }}>
			<h1 class="text-4xl md:text-6xl font-black tracking-tight mb-4 text-foreground">
				How <span class="text-primary">Kanaya</span> Works
			</h1>
			<p class="text-xl text-muted-foreground">
				From design to delivery in 6 simple steps.
			</p>
		</div>

		<!-- Timeline Container -->
		<div class="max-w-4xl mx-auto relative">
			<!-- Vertical Line (Desktop Central, Mobile Left) -->
			<div 
				class="absolute left-8 md:left-1/2 top-0 bottom-0 w-1 bg-border md:-ml-0.5"
				in:slide={{ duration: 1000, delay: 500 }}
			></div>

			<!-- Steps -->
			<div class="space-y-12 md:space-y-0">
				{#each steps as step, i}
					<div 
						class="relative flex items-center md:justify-between {i % 2 === 0 ? 'md:flex-row-reverse' : ''}"
						in:fly={{ y: 50, duration: 800, delay: step.delay }}
					>
						<!-- Spacer for Desktop Alternate -->
						<div class="hidden md:block w-5/12"></div>

						<!-- Icon Node -->
						<div class="absolute left-8 md:left-1/2 -ml-3 md:-ml-4 flex items-center justify-center">
							<div class="w-8 h-8 md:w-10 md:h-10 rounded-full {step.color} border-4 border-background shadow-lg flex items-center justify-center z-10 transition-transform hover:scale-125 duration-300">
								<CheckCircle2 class="w-4 h-4 md:w-5 md:h-5 text-white opacity-0 animate-[fadeIn_0.5s_ease-out_forwards]" style="animation-delay: {step.delay + 400}ms" />
							</div>
						</div>

						<!-- Content Card -->
						<div class="ml-20 md:ml-0 w-full md:w-5/12">
							<div class="bg-card border border-border p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow relative group">
								<!-- Step Number Badge -->
								<div class="absolute -top-3 -right-3 w-8 h-8 bg-muted text-muted-foreground rounded-full flex items-center justify-center font-bold text-sm border border-border group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
									{i + 1}
								</div>

								<div class="flex items-center gap-3 mb-3">
									<div class="p-2 rounded-lg bg-accent/50 text-accent-foreground">
										<step.icon class="w-6 h-6" />
									</div>
									<h3 class="text-xl font-bold">{step.title}</h3>
								</div>
								
								<p class="text-muted-foreground leading-relaxed">
									{step.description}
								</p>
							</div>
						</div>
					</div>
				{/each}
			</div>

			<!-- CTA Footer -->
			<div class="mt-20 text-center" in:fade={{ delay: 1500 }}>
				<Button size="lg" class="text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl hover:scale-105 transition-all" href="/templates">
					Start Creating Now <ArrowRight class="ml-2 w-5 h-5" />
				</Button>
			</div>
		</div>
	{/if}
</div>

<style>
	@keyframes fadeIn {
		to { opacity: 1; }
	}
</style>
