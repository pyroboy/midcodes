<script lang="ts">
	import Badge from './Badge.svelte';
	import type { App } from '$lib/data/apps.js';
	
	interface Props {
		app: App;
	}
	
	let { app }: Props = $props();
	
	const statusColors = {
		active: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
		minimal: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/20',
		development: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
	};
	
	const complexityColors = {
		low: 'bg-green-500/10 text-green-600 dark:text-green-400 border border-green-500/20',
		medium: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
		high: 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
	};
	
	const categoryColors = {
		core: 'bg-primary/10 text-primary border border-primary/20',
		document: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
		utility: 'bg-muted text-muted-foreground border border-border'
	};
</script>

<div class="card-hover rounded-xl border border-border bg-card p-6 shadow-sm">
	<div class="mb-4 flex items-start justify-between">
		<div>
			<h3 class="text-xl font-semibold text-foreground">{app.displayName}</h3>
			<p class="text-sm text-muted-foreground">v{app.version} • {app.packageName}</p>
		</div>
		<div class="flex flex-col gap-2">
			<Badge class="{statusColors[app.status]} px-2 py-1 text-xs">{app.status}</Badge>
			<Badge class="{categoryColors[app.category]} px-2 py-1 text-xs">{app.category}</Badge>
		</div>
	</div>
	
	<p class="mb-4 text-muted-foreground">{app.description}</p>
	
	<div class="mb-4">
		<h4 class="mb-2 font-medium text-foreground">Tech Stack</h4>
		<div class="flex flex-wrap gap-1">
			{#each app.techStack as tech}
				<Badge class="bg-accent text-accent-foreground px-2 py-1 text-xs hover:bg-accent/80 transition-colors duration-200">{tech}</Badge>
			{/each}
		</div>
	</div>
	
	<div class="mb-4">
		<h4 class="mb-2 font-medium text-foreground">Key Features</h4>
		<ul class="space-y-1 text-sm text-muted-foreground">
			{#each app.features.slice(0, 3) as feature}
				<li class="flex items-center gap-2">
					<div class="h-1.5 w-1.5 rounded-full bg-primary"></div>
					{feature}
				</li>
			{/each}
			{#if app.features.length > 3}
				<li class="text-xs text-muted-foreground/70">+{app.features.length - 3} more features</li>
			{/if}
		</ul>
	</div>
	
	<div class="flex items-center justify-between">
		<Badge class="{complexityColors[app.complexity]} px-2 py-1 text-xs">
			{app.complexity} complexity
		</Badge>
		<a 
			href="{app.path}" 
			class="text-sm font-medium text-primary hover:text-primary/80 transition-colors duration-200 hover:underline"
		>
			View Details →
		</a>
	</div>
</div>