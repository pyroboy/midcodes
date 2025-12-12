<script lang="ts">
	import Badge from './Badge.svelte';
	import type { App } from '$lib/data/apps.js';
	import { ExternalLink, Github } from 'lucide-svelte';
	
	interface Props {
		app: App;
	}
	
	let { app }: Props = $props();
	
	const statusColors = {
		active: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
		minimal: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
		development: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
	};
	
	const categoryGradients = {
		core: 'from-blue-500/20 to-indigo-600/20',
		document: 'from-purple-500/20 to-pink-600/20',
		utility: 'from-slate-500/20 to-slate-600/20'
	};
</script>

<article class="group relative overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-all duration-500 hover:shadow-2xl hover:-translate-y-2 hover:border-primary/30">
	<!-- Thumbnail/Gradient Header -->
	<div class="relative h-48 overflow-hidden">
		{#if app.thumbnail}
			<img 
				src={app.thumbnail} 
				alt={app.displayName}
				class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
			/>
		{:else}
			<div class="w-full h-full bg-gradient-to-br {categoryGradients[app.category]} flex items-center justify-center">
				<span class="text-6xl font-bold text-foreground/10">{app.name.charAt(0).toUpperCase()}</span>
			</div>
		{/if}
		<!-- Overlay -->
		<div class="absolute inset-0 bg-gradient-to-t from-card via-transparent to-transparent opacity-80"></div>
		<!-- Status Badge -->
		<div class="absolute top-4 right-4">
			<Badge class="{statusColors[app.status]} px-2 py-1 text-xs backdrop-blur-sm">{app.status}</Badge>
		</div>
	</div>
	
	<!-- Content -->
	<div class="p-6">
		<div class="mb-4">
			<h3 class="text-xl font-semibold text-foreground group-hover:text-primary transition-colors">{app.displayName}</h3>
			<p class="text-sm text-muted-foreground mt-1">v{app.version}</p>
		</div>
		
		<p class="text-muted-foreground text-sm mb-4 line-clamp-2">{app.description}</p>
		
		<!-- Tech Stack -->
		<div class="mb-4">
			<div class="flex flex-wrap gap-1.5">
				{#each app.techStack.slice(0, 4) as tech}
					<Badge class="bg-accent/50 text-accent-foreground px-2 py-0.5 text-xs">{tech}</Badge>
				{/each}
				{#if app.techStack.length > 4}
					<Badge class="bg-muted text-muted-foreground px-2 py-0.5 text-xs">+{app.techStack.length - 4}</Badge>
				{/if}
			</div>
		</div>
		
		<!-- Actions -->
		<div class="flex items-center gap-3 pt-4 border-t border-border">
			<a 
				href={app.path}
				class="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
			>
				<ExternalLink class="h-4 w-4" />
				View Project
			</a>
			{#if app.githubUrl}
				<a 
					href={app.githubUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center justify-center w-10 h-10 rounded-lg border border-border hover:bg-accent transition-colors"
					aria-label="View on GitHub"
				>
					<Github class="h-4 w-4 text-muted-foreground" />
				</a>
			{/if}
		</div>
	</div>
</article>