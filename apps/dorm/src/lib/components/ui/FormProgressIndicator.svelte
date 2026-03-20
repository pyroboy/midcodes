<script lang="ts">
	interface Props {
		/** Array of section labels */
		sections: string[];
		/** Index of the currently visible/active section (0-based) */
		currentSection?: number;
		/** Callback when a section dot/label is clicked */
		onSectionClick?: (index: number) => void;
	}

	let { sections, currentSection = 0, onSectionClick }: Props = $props();
</script>

<div class="flex items-center justify-center gap-2 py-2 px-3">
	{#each sections as section, i}
		<div class="flex items-center gap-2">
			<button
				type="button"
				class="flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors duration-200 {onSectionClick ? 'cursor-pointer hover:bg-slate-100' : 'cursor-default'}"
				onclick={() => onSectionClick?.(i)}
			>
				<div
					class="w-2 h-2 rounded-full transition-colors duration-200 {i <= currentSection
						? 'bg-blue-600'
						: 'bg-slate-300'}"
				></div>
				<span
					class="text-xs font-medium transition-colors duration-200 {i === currentSection
						? 'text-slate-800'
						: 'text-slate-400'}"
				>
					{section}
				</span>
			</button>
			{#if i < sections.length - 1}
				<div
					class="w-4 h-px transition-colors duration-200 {i < currentSection
						? 'bg-blue-400'
						: 'bg-slate-200'}"
				></div>
			{/if}
		</div>
	{/each}
</div>
