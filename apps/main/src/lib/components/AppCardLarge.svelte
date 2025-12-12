<script lang="ts">
	import type { App } from '$lib/data/apps.js';
	import Badge from './Badge.svelte';
	import { ExternalLink, Github } from 'lucide-svelte';
	
	interface Props {
		app: App;
	}
	
	let { app }: Props = $props();
	
	const categoryGradients = {
		core: 'from-blue-500 to-indigo-600',
		document: 'from-purple-500 to-pink-600',
		utility: 'from-slate-400 to-slate-600'
	};
</script>

<!-- Large card for featured display -->
<article class="group relative h-full overflow-hidden rounded-3xl border border-border bg-card shadow-lg transition-all duration-500 hover:shadow-2xl hover:border-primary/30">
	<!-- Full background gradient/thumbnail -->
	<div class="absolute inset-0">
		{#if app.thumbnail}
			<img 
				src={app.thumbnail} 
				alt={app.displayName}
				class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
			/>
		{:else}
			<div class="w-full h-full bg-gradient-to-br {categoryGradients[app.category]} opacity-20"></div>
		{/if}
		<div class="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent"></div>
	</div>
	
	<!-- Content overlay -->
	<div class="relative h-full flex flex-col justify-end p-8">
		<!-- Tech badges floating at top -->
		<div class="absolute top-6 left-6 right-6 flex flex-wrap gap-2">
			{#each app.techStack.slice(0, 4) as tech}
				<Badge class="bg-card/80 backdrop-blur text-foreground px-3 py-1 text-xs border border-border/50">{tech}</Badge>
			{/each}
		</div>
		
		<!-- Main content at bottom -->
		<div class="space-y-4">
			<div>
				<Badge class="bg-primary/20 text-primary px-2 py-1 text-xs mb-3">{app.category}</Badge>
				<h3 class="text-3xl md:text-4xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{app.displayName}</h3>
				<p class="text-lg text-muted-foreground line-clamp-2">{app.description}</p>
			</div>
			
			<!-- Features preview -->
			<div class="flex flex-wrap gap-2">
				{#each app.features.slice(0, 3) as feature}
					<span class="text-sm text-muted-foreground/80 bg-muted/50 px-3 py-1 rounded-full">{feature}</span>
				{/each}
			</div>
			
			<!-- Actions -->
			<div class="flex items-center gap-4 pt-4">
				<a 
					href={app.path}
					class="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors"
				>
					<ExternalLink class="h-5 w-5" />
					View Project
				</a>
				{#if app.githubUrl}
					<a 
						href={app.githubUrl}
						target="_blank"
						rel="noopener noreferrer"
						class="inline-flex items-center justify-center w-12 h-12 rounded-xl border border-border bg-card/50 backdrop-blur hover:bg-accent transition-colors"
						aria-label="View on GitHub"
					>
						<Github class="h-5 w-5 text-muted-foreground" />
					</a>
				{/if}
			</div>
		</div>
	</div>
</article>
