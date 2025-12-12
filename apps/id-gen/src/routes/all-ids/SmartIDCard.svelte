<script lang="ts">
	import { onMount } from 'svelte';
	import SimpleIDCard from '$lib/components/SimpleIDCard.svelte';
	import IDCardSkeleton from '$lib/components/IDCardSkeleton.svelte';
	import { getCardDetails } from './data.remote';
	import type { IDCard } from './data.remote';

	export let id: string;
	export let initialData: IDCard | null = null;
	export let isSelected: boolean = false;
	export let onToggleSelect: (card: any) => void;
	export let onDownload: (card: any) => void;
	export let onDelete: (card: any) => void;
	export let onOpenPreview: (e: MouseEvent, card: any) => void;
	export let downloading: boolean = false;
	export let deleting: boolean = false;
	export let onDataLoaded: ((card: IDCard) => void) | undefined = undefined;
	// Pass minWidth to skeleton to match grid
	export let minWidth: number = 250;

	let cardData: IDCard | null = initialData;
	// Treat as loading if no data OR if data is partial (missing front_image means it's a stub)
	// Note: partial cards from getCardIDs have front_image=null and empty fields object
	let loading = !initialData || initialData.front_image === null;
	let error = false;

	onMount(async () => {
		// Fetch full details if this is a stub (front_image is null)
		if (!cardData || cardData.front_image === null) {
			try {
				cardData = await getCardDetails(id);
				if (cardData) {
					onDataLoaded?.(cardData);
				} else {
					error = true;
				}
			} catch (e) {
				console.error(`Error loading card ${id}:`, e);
				error = true;
			} finally {
				loading = false;
			}
		}
	});
</script>

{#if loading}
	<IDCardSkeleton count={1} {minWidth} />
{:else if error}
	<div class="h-full w-full flex items-center justify-center p-4 border border-destructive/20 rounded-xl bg-destructive/5 text-destructive text-sm min-h-[200px]">
		<div class="text-center">
			<p class="font-semibold">Failed to load</p>
			<p class="text-xs opacity-70 mt-1">ID: {id.slice(0, 8)}...</p>
			<button 
				class="mt-2 text-xs underline hover:no-underline"
				on:click={() => {
					loading = true;
					error = false;
					getCardDetails(id).then(data => {
						if (data) {
							cardData = data;
							onDataLoaded?.(data);
						} else {
							error = true;
						}
						loading = false;
					}).catch(() => {
						error = true;
						loading = false;
					});
				}}
			>
				Retry
			</button>
		</div>
	</div>
{:else if cardData}
	<SimpleIDCard
		card={cardData}
		{isSelected}
		{onToggleSelect}
		{onDownload}
		{onDelete}
		{onOpenPreview}
		{downloading}
		{deleting}
	/>
{/if}
