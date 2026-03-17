<script lang="ts">
	import { viewMode } from '$lib/stores/viewMode';
	import { get } from 'svelte/store';

	function setMode(mode: 'table' | 'card') {
		viewMode.set(mode);
	}
</script>

<div
	class="inline-flex items-center gap-1 rounded-md border border-gray-200 dark:border-gray-700 p-1 bg-white dark:bg-gray-900"
	role="group"
	aria-label="View mode toggle"
>
	<button
		class={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${$viewMode === 'table' ? 'bg-blue-600 text-white' : ''}`}
		aria-pressed={$viewMode === 'table'}
		title="Table view"
		onclick={() => setMode('table')}
	>
		<!-- table icon -->
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4">
			<path
				fill="currentColor"
				d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2zm2 0v4h14V5zm0 6v8h4v-8zm6 0v8h8v-8z"
			/>
		</svg>
	</button>
	<button
		class={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors focus:outline-hidden focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${$viewMode === 'card' ? 'bg-blue-600 text-white' : ''}`}
		aria-pressed={$viewMode === 'card'}
		title="Card view"
		onclick={() => setMode('card')}
	>
		<!-- grid icon -->
		<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" class="h-4 w-4">
			<path fill="currentColor" d="M3 3h8v8H3zm10 0h8v8h-8zM3 13h8v8H3zm10 0h8v8h-8z" />
		</svg>
	</button>
</div>

<style>
	button {
		color: rgb(55 65 81);
	}
	:global(.dark) button {
		color: rgb(229 231 235);
	}
</style>
