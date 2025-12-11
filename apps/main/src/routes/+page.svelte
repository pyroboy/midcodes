<script lang="ts">
	import { apps } from '$lib/data/apps.js';
	import AppCard from '$lib/components/AppCard.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import ThemeToggle from '$lib/components/ThemeToggle.svelte';
	import { Search, Layers, Zap, FileText, Wrench, TrendingUp } from 'lucide-svelte';
	
	// Group apps by category
	const coreApps = $derived(apps.filter(app => app.category === 'core'));
	const documentApps = $derived(apps.filter(app => app.category === 'document'));
	const utilityApps = $derived(apps.filter(app => app.category === 'utility'));
	
	// Stats
	const totalApps = $derived(apps.length);
	const activeApps = $derived(apps.filter(app => app.status === 'active').length);
	const techStackCount = $derived(new Set(apps.flatMap(app => app.techStack)).size);
	const totalFeatures = $derived(apps.reduce((sum, app) => sum + app.features.length, 0));
	
	let searchQuery = $state('');
	const filteredApps = $derived(apps.filter(app => 
		app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		app.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
		app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
		app.techStack.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
	));
</script>

<svelte:head>
	<title>Midcodes Apps Directory | Complete Overview</title>
	<meta name="description" content="Comprehensive directory of all applications in the Midcodes monorepo - from dormitory management to data visualization platforms." />
</svelte:head>

<!-- Header -->
<header class="border-b border-border bg-card/80 backdrop-blur-lg sticky top-0 z-50 transition-colors duration-300">
	<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between">
			<div class="animate-fade-in">
				<h1 class="text-3xl font-bold tracking-tight gradient-text">
					Midcodes Apps Directory
				</h1>
				<p class="mt-2 text-muted-foreground">
					A comprehensive overview of all applications in our monorepo ecosystem
				</p>
			</div>
			<div class="flex items-center gap-4 animate-fade-in animate-delay-200">
				<ThemeToggle />
				<Badge class="bg-primary/10 text-primary px-3 py-1 border border-primary/20">
					{totalApps} Apps
				</Badge>
				<Badge class="bg-green-500/10 text-green-600 dark:text-green-400 px-3 py-1 border border-green-500/20">
					{activeApps} Active
				</Badge>
			</div>
		</div>
	</div>
</header>

<!-- Stats Section -->
<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<div class="card-hover rounded-lg border border-border bg-card p-6 animate-scale-in animate-delay-100">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-primary/10 p-2 border border-primary/20">
					<Layers class="h-5 w-5 text-primary" />
				</div>
				<div>
					<p class="text-2xl font-semibold text-foreground">{totalApps}</p>
					<p class="text-sm text-muted-foreground">Total Applications</p>
				</div>
			</div>
		</div>
		
		<div class="card-hover rounded-lg border border-border bg-card p-6 animate-scale-in animate-delay-200">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-green-500/10 p-2 border border-green-500/20">
					<Zap class="h-5 w-5 text-green-600 dark:text-green-400" />
				</div>
				<div>
					<p class="text-2xl font-semibold text-foreground">{activeApps}</p>
					<p class="text-sm text-muted-foreground">Active Projects</p>
				</div>
			</div>
		</div>
		
		<div class="card-hover rounded-lg border border-border bg-card p-6 animate-scale-in animate-delay-300">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-purple-500/10 p-2 border border-purple-500/20">
					<Wrench class="h-5 w-5 text-purple-600 dark:text-purple-400" />
				</div>
				<div>
					<p class="text-2xl font-semibold text-foreground">{techStackCount}</p>
					<p class="text-sm text-muted-foreground">Technologies</p>
				</div>
			</div>
		</div>
		
		<div class="card-hover rounded-lg border border-border bg-card p-6 animate-scale-in animate-delay-400">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-orange-500/10 p-2 border border-orange-500/20">
					<TrendingUp class="h-5 w-5 text-orange-600 dark:text-orange-400" />
				</div>
				<div>
					<p class="text-2xl font-semibold text-foreground">{totalFeatures}</p>
					<p class="text-sm text-muted-foreground">Total Features</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Search -->
<section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8 animate-fade-in animate-delay-300">
	<div class="relative">
		<Search class="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
		<input
			bind:value={searchQuery}
			type="text"
			placeholder="Search apps, technologies, or features..."
			class="w-full rounded-lg border border-border bg-card pl-10 pr-4 py-3 text-foreground placeholder-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 transition-all duration-200"
		/>
	</div>
</section>

<!-- Apps Grid -->
{#if searchQuery}
	<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-fade-in">
		<h2 class="mb-6 text-2xl font-bold text-foreground">
			Search Results ({filteredApps.length})
		</h2>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{#each filteredApps as app}
				<AppCard {app} />
			{/each}
		</div>
		{#if filteredApps.length === 0}
			<div class="text-center py-12">
				<p class="text-muted-foreground">No apps found matching your search.</p>
			</div>
		{/if}
	</section>
{:else}
	<!-- Core Applications -->
	<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-slide-up">
		<div class="mb-6 flex items-center gap-3">
			<div class="rounded-lg bg-primary/10 p-2 border border-primary/20">
				<Layers class="h-6 w-6 text-primary" />
			</div>
			<h2 class="text-2xl font-bold text-foreground">Core Applications</h2>
			<Badge class="bg-primary/10 text-primary px-2 py-1 text-sm border border-primary/20">
				{coreApps.length} apps
			</Badge>
		</div>
		<p class="mb-6 text-muted-foreground">
			Mission-critical applications that form the backbone of our platform ecosystem.
		</p>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{#each coreApps as app}
				<AppCard {app} />
			{/each}
		</div>
	</section>

	<!-- Document & Content Applications -->
	<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-slide-up">
		<div class="mb-6 flex items-center gap-3">
			<div class="rounded-lg bg-purple-500/10 p-2 border border-purple-500/20">
				<FileText class="h-6 w-6 text-purple-600 dark:text-purple-400" />
			</div>
			<h2 class="text-2xl font-bold text-foreground">Document & Content</h2>
			<Badge class="bg-purple-500/10 text-purple-600 dark:text-purple-400 px-2 py-1 text-sm border border-purple-500/20">
				{documentApps.length} apps
			</Badge>
		</div>
		<p class="mb-6 text-muted-foreground">
			Content management and document processing applications for various use cases.
		</p>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{#each documentApps as app}
				<AppCard {app} />
			{/each}
		</div>
	</section>

	<!-- Utility & Tools -->
	<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 animate-slide-up">
		<div class="mb-6 flex items-center gap-3">
			<div class="rounded-lg bg-muted p-2 border border-border">
				<Wrench class="h-6 w-6 text-muted-foreground" />
			</div>
			<h2 class="text-2xl font-bold text-foreground">Utility & Tools</h2>
			<Badge class="bg-muted text-muted-foreground px-2 py-1 text-sm border border-border">
				{utilityApps.length} apps
			</Badge>
		</div>
		<p class="mb-6 text-muted-foreground">
			Lightweight tools and utilities that support various workflows and use cases.
		</p>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{#each utilityApps as app}
				<AppCard {app} />
			{/each}
		</div>
	</section>
{/if}

<!-- Footer -->
<footer class="border-t border-border bg-card/50 mt-16 transition-colors duration-300">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="text-center animate-fade-in">
			<h3 class="text-lg font-semibold text-foreground">Technology Stack Overview</h3>
			<p class="mt-2 text-muted-foreground">
				Built with modern web technologies for optimal performance and developer experience
			</p>
			<div class="mt-6 flex flex-wrap justify-center gap-2">
				{#each Array.from(new Set(apps.flatMap(app => app.techStack))).slice(0, 12) as tech}
					<Badge class="bg-muted text-muted-foreground px-3 py-1 border border-border hover:bg-accent transition-colors duration-200">{tech}</Badge>
				{/each}
			</div>
			<p class="mt-8 text-sm text-muted-foreground">
				Last updated: December 2024 • {totalApps} applications • {techStackCount} technologies
			</p>
		</div>
	</div>
</footer>