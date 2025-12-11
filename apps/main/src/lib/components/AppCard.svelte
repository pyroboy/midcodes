<script lang="ts">
	import { Badge } from './Badge.svelte';
	import type { App } from '$lib/data/apps.js';
	
	interface Props {
		app: App;
	}
	
	let { app }: Props = $props();
	
	const statusColors = {
		active: 'bg-green-100 text-green-800',
		minimal: 'bg-yellow-100 text-yellow-800',
		development: 'bg-blue-100 text-blue-800'
	};
	
	const complexityColors = {
		low: 'bg-green-100 text-green-700',
		medium: 'bg-orange-100 text-orange-700',
		high: 'bg-red-100 text-red-700'
	};
	
	const categoryColors = {
		core: 'bg-blue-100 text-blue-800',
		document: 'bg-purple-100 text-purple-800',
		utility: 'bg-gray-100 text-gray-800'
	};
</script>

<div class="rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all hover:shadow-lg">
	<div class="mb-4 flex items-start justify-between">
		<div>
			<h3 class="text-xl font-semibold text-gray-900">{app.displayName}</h3>
			<p class="text-sm text-gray-500">v{app.version} • {app.packageName}</p>
		</div>
		<div class="flex flex-col gap-2">
			<Badge class="{statusColors[app.status]} px-2 py-1 text-xs">{app.status}</Badge>
			<Badge class="{categoryColors[app.category]} px-2 py-1 text-xs">{app.category}</Badge>
		</div>
	</div>
	
	<p class="mb-4 text-gray-600">{app.description}</p>
	
	<div class="mb-4">
		<h4 class="mb-2 font-medium text-gray-900">Tech Stack</h4>
		<div class="flex flex-wrap gap-1">
			{#each app.techStack as tech}
				<Badge class="bg-slate-100 text-slate-700 px-2 py-1 text-xs">{tech}</Badge>
			{/each}
		</div>
	</div>
	
	<div class="mb-4">
		<h4 class="mb-2 font-medium text-gray-900">Key Features</h4>
		<ul class="space-y-1 text-sm text-gray-600">
			{#each app.features.slice(0, 3) as feature}
				<li class="flex items-center gap-2">
					<div class="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
					{feature}
				</li>
			{/each}
			{#if app.features.length > 3}
				<li class="text-xs text-gray-500">+{app.features.length - 3} more features</li>
			{/if}
		</ul>
	</div>
	
	<div class="flex items-center justify-between">
		<Badge class="{complexityColors[app.complexity]} px-2 py-1 text-xs">
			{app.complexity} complexity
		</Badge>
		<a 
			href="{app.path}" 
			class="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors"
		>
			View Details →
		</a>
	</div>
</div>