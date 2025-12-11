<script lang="ts">
	import { apps } from '$lib/data/apps.js';
	import AppCard from '$lib/components/AppCard.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import { Search, Layers, Zap, FileText, Wrench, TrendingUp } from 'lucide-svelte';
	
	// Group apps by category
	$: coreApps = apps.filter(app => app.category === 'core');
	$: documentApps = apps.filter(app => app.category === 'document');
	$: utilityApps = apps.filter(app => app.category === 'utility');
	
	// Stats
	$: totalApps = apps.length;
	$: activeApps = apps.filter(app => app.status === 'active').length;
	$: techStackCount = new Set(apps.flatMap(app => app.techStack)).size;
	$: totalFeatures = apps.reduce((sum, app) => sum + app.features.length, 0);
	
	let searchQuery = $state('');
	$: filteredApps = apps.filter(app => 
		app.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		app.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
		app.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
		app.techStack.some(tech => tech.toLowerCase().includes(searchQuery.toLowerCase()))
	);
</script>

<svelte:head>
	<title>Midcodes Apps Directory | Complete Overview</title>
	<meta name="description" content="Comprehensive directory of all applications in the Midcodes monorepo - from dormitory management to data visualization platforms." />
</svelte:head>

<!-- Header -->
<header class="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
	<div class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
		<div class="flex items-center justify-between">
			<div>
				<h1 class="text-3xl font-bold tracking-tight text-gray-900">
					Midcodes Apps Directory
				</h1>
				<p class="mt-2 text-gray-600">
					A comprehensive overview of all applications in our monorepo ecosystem
				</p>
			</div>
			<div class="flex items-center gap-4">
				<Badge class="bg-blue-100 text-blue-800 px-3 py-1">
					{totalApps} Apps
				</Badge>
				<Badge class="bg-green-100 text-green-800 px-3 py-1">
					{activeApps} Active
				</Badge>
			</div>
		</div>
	</div>
</header>

<!-- Stats Section -->
<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-blue-100 p-2">
					<Layers class="h-5 w-5 text-blue-600" />
				</div>
				<div>
					<p class="text-2xl font-semibold text-gray-900">{totalApps}</p>
					<p class="text-sm text-gray-600">Total Applications</p>
				</div>
			</div>
		</div>
		
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-green-100 p-2">
					<Zap class="h-5 w-5 text-green-600" />
				</div>
				<div>
					<p class="text-2xl font-semibold text-gray-900">{activeApps}</p>
					<p class="text-sm text-gray-600">Active Projects</p>
				</div>
			</div>
		</div>
		
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-purple-100 p-2">
					<Wrench class="h-5 w-5 text-purple-600" />
				</div>
				<div>
					<p class="text-2xl font-semibold text-gray-900">{techStackCount}</p>
					<p class="text-sm text-gray-600">Technologies</p>
				</div>
			</div>
		</div>
		
		<div class="rounded-lg border border-gray-200 bg-white p-6">
			<div class="flex items-center gap-3">
				<div class="rounded-lg bg-orange-100 p-2">
					<TrendingUp class="h-5 w-5 text-orange-600" />
				</div>
				<div>
					<p class="text-2xl font-semibold text-gray-900">{totalFeatures}</p>
					<p class="text-sm text-gray-600">Total Features</p>
				</div>
			</div>
		</div>
	</div>
</section>

<!-- Search -->
<section class="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
	<div class="relative">
		<Search class="absolute left-3 top-3 h-5 w-5 text-gray-400" />
		<input
			bind:value={searchQuery}
			type="text"
			placeholder="Search apps, technologies, or features..."
			class="w-full rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-3 text-gray-900 placeholder-gray-500 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
		/>
	</div>
</section>

<!-- Apps Grid -->
{#if searchQuery}
	<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<h2 class="mb-6 text-2xl font-bold text-gray-900">
			Search Results ({filteredApps.length})
		</h2>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{#each filteredApps as app}
				<AppCard {app} />
			{/each}
		</div>
		{#if filteredApps.length === 0}
			<div class="text-center py-12">
				<p class="text-gray-500">No apps found matching your search.</p>
			</div>
		{/if}
	</section>
{:else}
	<!-- Core Applications -->
	<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex items-center gap-3">
			<div class="rounded-lg bg-blue-100 p-2">
				<Layers class="h-6 w-6 text-blue-600" />
			</div>
			<h2 class="text-2xl font-bold text-gray-900">Core Applications</h2>
			<Badge class="bg-blue-100 text-blue-800 px-2 py-1 text-sm">
				{coreApps.length} apps
			</Badge>
		</div>
		<p class="mb-6 text-gray-600">
			Mission-critical applications that form the backbone of our platform ecosystem.
		</p>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{#each coreApps as app}
				<AppCard {app} />
			{/each}
		</div>
	</section>

	<!-- Document & Content Applications -->
	<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex items-center gap-3">
			<div class="rounded-lg bg-purple-100 p-2">
				<FileText class="h-6 w-6 text-purple-600" />
			</div>
			<h2 class="text-2xl font-bold text-gray-900">Document & Content</h2>
			<Badge class="bg-purple-100 text-purple-800 px-2 py-1 text-sm">
				{documentApps.length} apps
			</Badge>
		</div>
		<p class="mb-6 text-gray-600">
			Content management and document processing applications for various use cases.
		</p>
		<div class="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
			{#each documentApps as app}
				<AppCard {app} />
			{/each}
		</div>
	</section>

	<!-- Utility & Tools -->
	<section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
		<div class="mb-6 flex items-center gap-3">
			<div class="rounded-lg bg-gray-100 p-2">
				<Wrench class="h-6 w-6 text-gray-600" />
			</div>
			<h2 class="text-2xl font-bold text-gray-900">Utility & Tools</h2>
			<Badge class="bg-gray-100 text-gray-800 px-2 py-1 text-sm">
				{utilityApps.length} apps
			</Badge>
		</div>
		<p class="mb-6 text-gray-600">
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
<footer class="border-t border-gray-200 bg-white mt-16">
	<div class="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
		<div class="text-center">
			<h3 class="text-lg font-semibold text-gray-900">Technology Stack Overview</h3>
			<p class="mt-2 text-gray-600">
				Built with modern web technologies for optimal performance and developer experience
			</p>
			<div class="mt-6 flex flex-wrap justify-center gap-2">
				{#each Array.from(new Set(apps.flatMap(app => app.techStack))).slice(0, 12) as tech}
					<Badge class="bg-slate-100 text-slate-700 px-3 py-1">{tech}</Badge>
				{/each}
			</div>
			<p class="mt-8 text-sm text-gray-500">
				Last updated: December 2024 • {totalApps} applications • {techStackCount} technologies
			</p>
		</div>
	</div>
</footer>