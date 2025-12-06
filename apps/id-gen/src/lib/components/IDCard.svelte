<script lang="ts">
	import Card from '$lib/components/ui/card/card.svelte';
	import CardHeader from '$lib/components/ui/card/card-header.svelte';
	import CardTitle from '$lib/components/ui/card/card-title.svelte';
	import CardContent from '$lib/components/ui/card/card-content.svelte';
	// Keep a minimal type to avoid coupling to server file paths
	type IDCardType = {
		idcard_id: string;
		template_name: string;
		fields: Record<string, { value: string | null; side: 'front' | 'back' } | undefined>;
	};

	export let card: IDCardType;
	export let isSelected: boolean = false;
	export let onToggleSelect: (card: IDCardType) => void;
	export let onDownload: (card: IDCardType) => void;
	export let onDelete: (card: IDCardType) => void;
	export let onOpenPreview: (e: MouseEvent, card: IDCardType) => void;
	export let downloading: boolean = false;
	export let deleting: boolean = false;

	function handleClick(e: MouseEvent) {
		onOpenPreview?.(e, card);
	}
</script>

<div
	class="relative"
	role="button"
	tabindex="0"
	on:click={handleClick}
	on:keydown={(e) => {
		if (e.key === 'Enter' || e.key === ' ') {
			e.preventDefault();
			handleClick(new MouseEvent('click'));
		}
	}}
>
	<input
		aria-label="Select card"
		type="checkbox"
		checked={isSelected}
		on:click|stopPropagation={() => onToggleSelect(card)}
		class="absolute top-2 left-2 z-10 w-5 h-5 text-blue-600 bg-white/90 border-gray-300 rounded focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 focus:ring-2 dark:bg-gray-700 dark:border-gray-600 shadow"
	/>
	<Card class="p-4 hover:shadow-md transition-shadow cursor-pointer">
		<CardHeader class="pb-2">
			<CardTitle class="text-base truncate pr-6"
				>{card.fields?.['Name']?.value || card.fields?.['name']?.value || 'Untitled'}</CardTitle
			>
		</CardHeader>
		<CardContent class="space-y-2">
			<div class="text-sm text-gray-500 dark:text-gray-400">Template: {card.template_name}</div>
			<div class="flex flex-wrap gap-2 text-sm">
				{#each Object.entries(card.fields || {}).slice(0, 4) as [key, field]}
					<div
						class="px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200"
					>
						<strong>{key}:</strong>
						{field?.value ?? ''}
					</div>
				{/each}
			</div>
			<div class="pt-2 flex gap-3">
				<button
					class="px-3 py-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
					on:click|stopPropagation={() => onDownload(card)}
					disabled={downloading}
				>
					{downloading ? 'Downloading...' : 'Download'}
				</button>
				<button
					class="px-3 py-1.5 text-sm font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors"
					on:click|stopPropagation={() => onDelete(card)}
					disabled={deleting}
				>
					{deleting ? 'Deleting...' : 'Delete'}
				</button>
			</div>
		</CardContent>
	</Card>
</div>
