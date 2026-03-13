<script lang="ts">
	import { cn } from '$lib/utils';
	import { LayoutGrid, List, Search, X } from 'lucide-svelte';

	interface Props {
		searchQuery: string;
		viewMode: 'grid' | 'list';
		onExpandAll: () => void;
		onCollapseAll: () => void;
	}

	let { searchQuery = $bindable(), viewMode = $bindable(), onExpandAll, onCollapseAll }: Props = $props();
</script>

<div class="mb-4 flex flex-col sm:flex-row sm:items-center gap-3">
	<!-- Search -->
	<div class="relative flex-1">
		<Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
		<input
			type="text"
			bind:value={searchQuery}
			placeholder="Search items or category…"
			class="w-full pl-9 pr-8 py-2.5 text-sm rounded-lg border border-border bg-white focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent transition-shadow"
		/>
		{#if searchQuery}
			<button
				onclick={() => (searchQuery = '')}
				class="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700 transition-colors"
			>
				<X class="w-3.5 h-3.5" />
			</button>
		{/if}
	</div>

	<div class="flex items-center gap-2 justify-between sm:justify-end">
		<!-- Expand/Collapse all -->
		<div class="flex items-center gap-2">
			<button onclick={onExpandAll} class="text-xs font-semibold px-2.5 sm:px-3 py-2 bg-gray-50 border border-border text-gray-600 rounded-lg hover:bg-gray-100 transition-colors min-h-[36px]">
				<span class="hidden sm:inline">Expand All</span>
				<span class="sm:hidden">Expand</span>
			</button>
			<button onclick={onCollapseAll} class="text-xs font-semibold px-2.5 sm:px-3 py-2 bg-gray-50 border border-border text-gray-600 rounded-lg hover:bg-gray-100 transition-colors min-h-[36px]">
				<span class="hidden sm:inline">Collapse All</span>
				<span class="sm:hidden">Collapse</span>
			</button>
		</div>

		<!-- View toggle (hidden on mobile — always grid on phones) -->
		<div class="hidden sm:flex items-center gap-0.5 rounded-lg border border-border bg-white p-1">
			<button
				onclick={() => (viewMode = 'list')}
				class={cn('rounded p-2 transition-colors', viewMode === 'list' ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-100')}
				title="List view"
			>
				<List class="w-4 h-4" />
			</button>
			<button
				onclick={() => (viewMode = 'grid')}
				class={cn('rounded p-2 transition-colors', viewMode === 'grid' ? 'bg-accent text-white' : 'text-gray-500 hover:bg-gray-100')}
				title="Grid view"
			>
				<LayoutGrid class="w-4 h-4" />
			</button>
		</div>
	</div>
</div>
