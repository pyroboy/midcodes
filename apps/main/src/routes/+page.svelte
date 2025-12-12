<script lang="ts">
	import { apps } from '$lib/data/apps.js';
	import Badge from '$lib/components/Badge.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import AboutSection from '$lib/components/AboutSection.svelte';
	import ContactSection from '$lib/components/ContactSection.svelte';
	import Hero3D from '$lib/components/Hero3D.svelte';
	import AppCarousel from '$lib/components/AppCarousel.svelte';
	import AppCardLarge from '$lib/components/AppCardLarge.svelte';
	import { ArrowDown, Sparkles, Code2, Layers } from 'lucide-svelte';
	
	// Stats
	const totalApps = $derived(apps.length);
	const techStackCount = $derived(new Set(apps.flatMap(app => app.techStack)).size);
	
	// All unique technologies
	const allTechnologies = $derived(Array.from(new Set(apps.flatMap(app => app.techStack))));
	
	// Selected app for featured display
	let selectedAppIndex = $state(0);
	const selectedApp = $derived(apps[selectedAppIndex]);
	const secondApp = $derived(apps[(selectedAppIndex + 1) % apps.length]);
	
	function selectApp(app: typeof apps[0]) {
		const index = apps.findIndex(a => a.id === app.id);
		if (index !== -1) {
			selectedAppIndex = index;
		}
	}
	
	// Mobile snap scroll
	let mobileScrollContainer: HTMLDivElement;
</script>

<svelte:head>
	<title>Arjo Magno | Software Developer • Artist • Tattoo Artist</title>
	<meta name="description" content="Portfolio of Arjo Magno - A multidisciplinary creative bridging code and art. Software Developer, Artist, and Tattoo Artist." />
</svelte:head>

<!-- Navigation -->
<nav class="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border/50">
	<div class="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between">
			<a href="/" class="text-xl font-bold gradient-text">AM</a>
			<div class="flex items-center gap-6">
				<div class="hidden md:flex items-center gap-6">
					<a href="#about" class="text-muted-foreground hover:text-foreground transition-colors">About</a>
					<a href="#projects" class="text-muted-foreground hover:text-foreground transition-colors">Projects</a>
					<a href="#contact" class="text-muted-foreground hover:text-foreground transition-colors">Contact</a>
				</div>
				<ThemeToggle />
			</div>
		</div>
	</div>
</nav>

<!-- Hero Section -->
<section class="relative min-h-screen flex items-center justify-center overflow-hidden">
	<!-- 3D Background -->
	<Hero3D />
	
	<!-- Gradient Overlay -->
	<div class="absolute inset-0 bg-gradient-to-b from-background/30 via-background/60 to-background z-10"></div>
	
	<!-- Content -->
	<div class="relative z-20 text-center px-4 sm:px-6 lg:px-8 animate-fade-in">
		<div class="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8">
			<Sparkles class="h-4 w-4 text-primary" />
			<span class="text-sm text-primary font-medium">Available for freelance</span>
		</div>
		
		<h1 class="text-5xl md:text-7xl lg:text-8xl font-bold mb-6">
			<span class="gradient-text">Arjo Magno</span>
		</h1>
		
		<p class="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto mb-8">
			Software Developer <span class="text-primary">•</span> Artist <span class="text-primary">•</span> Tattoo Artist
		</p>
		
		<p class="text-lg text-muted-foreground/80 max-w-xl mx-auto mb-12">
			Bridging the gap between code and art — creating digital experiences that inspire.
		</p>
		
		<div class="flex flex-col sm:flex-row items-center justify-center gap-4">
			<a href="#projects" class="btn-primary inline-flex items-center gap-2">
				<Code2 class="h-5 w-5" />
				View My Work
			</a>
			<a href="#contact" class="btn-secondary inline-flex items-center gap-2">
				Get In Touch
			</a>
		</div>
	</div>
	
	<!-- Scroll Indicator -->
	<div class="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 animate-bounce">
		<a href="#about" class="text-muted-foreground hover:text-foreground transition-colors">
			<ArrowDown class="h-6 w-6" />
		</a>
	</div>
</section>

<!-- About Section -->
<AboutSection />

<!-- Projects Section -->
<section id="projects" class="py-24 px-4 sm:px-6 lg:px-8 min-h-screen">
	<div class="mx-auto max-w-7xl">
		<div class="text-center mb-12 animate-fade-in">
			<h2 class="text-4xl md:text-5xl font-bold gradient-text mb-6">Featured Projects</h2>
			<p class="text-xl text-muted-foreground max-w-2xl mx-auto">
				A collection of applications built with modern technologies and thoughtful design.
			</p>
			<div class="flex items-center justify-center gap-4 mt-6">
				<Badge class="bg-primary/10 text-primary px-4 py-2 border border-primary/20">
					<Layers class="h-4 w-4 inline mr-2" />
					{totalApps} Projects
				</Badge>
				<Badge class="bg-accent text-accent-foreground px-4 py-2 border border-border">
					{techStackCount} Technologies
				</Badge>
			</div>
		</div>
		
		<!-- Desktop View: Carousel + 2 Big Rows -->
		<div class="hidden lg:block">
			<!-- Carousel at top -->
			<div class="mb-8">
				<AppCarousel {apps} onSelect={selectApp} selectedId={selectedApp?.id} />
			</div>
			
			<!-- Two big featured cards -->
			<div class="grid grid-cols-2 gap-6 h-[600px]">
				<AppCardLarge app={selectedApp} />
				<AppCardLarge app={secondApp} />
			</div>
		</div>
		
		<!-- Mobile View: Snap Scroll -->
		<div class="lg:hidden">
			<!-- Full-screen snap scroll container -->
			<div 
				bind:this={mobileScrollContainer}
				class="snap-y snap-mandatory overflow-y-auto h-[70vh] rounded-2xl"
			>
				{#each apps as app}
					<div class="snap-start h-[70vh] p-2">
						<AppCardLarge {app} />
					</div>
				{/each}
			</div>
			
			<!-- Carousel at bottom for mobile -->
			<div class="mt-6">
				<AppCarousel {apps} onSelect={selectApp} selectedId={selectedApp?.id} />
			</div>
		</div>
	</div>
</section>

<!-- Tech Stack Section -->
<section class="py-24 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-card/30">
	<div class="mx-auto max-w-5xl text-center">
		<h2 class="text-3xl md:text-4xl font-bold text-foreground mb-4">Technology Stack</h2>
		<p class="text-muted-foreground mb-10">Technologies I work with across my projects</p>
		<div class="flex flex-wrap justify-center gap-3">
			{#each allTechnologies as tech}
				<span class="px-4 py-2 rounded-full bg-card border border-border text-foreground text-sm font-medium hover:border-primary/40 hover:bg-primary/5 transition-all duration-200 cursor-default">
					{tech}
				</span>
			{/each}
		</div>
	</div>
</section>

<!-- Contact Section -->
<ContactSection />

<!-- Footer -->
<footer class="py-8 px-4 sm:px-6 lg:px-8 border-t border-border">
	<div class="mx-auto max-w-7xl text-center">
		<p class="text-muted-foreground text-sm">
			© {new Date().getFullYear()} Arjo Magno. Built with SvelteKit & Three.js
		</p>
	</div>
</footer>

<style>
	.snap-y {
		scroll-snap-type: y mandatory;
	}
	.snap-start {
		scroll-snap-align: start;
	}
</style>