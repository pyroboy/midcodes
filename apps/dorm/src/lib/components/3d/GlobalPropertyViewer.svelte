<script lang="ts">
	import { propertyStore } from '$lib/stores/property';
	import { Canvas } from '@threlte/core';
	import PropertyScene from './PropertyScene.svelte';
	import {
		Sheet,
		SheetContent,
		SheetHeader,
		SheetTitle,
		SheetDescription
	} from '$lib/components/ui/sheet';
	import { Loader2, Box } from 'lucide-svelte';
	import { Badge } from '$lib/components/ui/badge';

	let { open = $bindable(false) } = $props();

	let loading = $state(false);
	let data = $state<{ floors: any[]; rentalUnits: any[] } | null>(null);
	let error = $state<string | null>(null);

	// React to property changes or modal opening
	$effect(() => {
		if (open && $propertyStore.selectedPropertyId) {
			fetch3DData($propertyStore.selectedPropertyId);
		}
	});

	async function fetch3DData(propertyId: string) {
		loading = true;
		error = null;
		try {
			const res = await fetch(`/api/properties/${propertyId}/3d-data`);
			if (!res.ok) throw new Error('Failed to load building data');
			data = await res.json();
		} catch (e) {
			console.error(e);
			error = 'Could not load 3D model data.';
		} finally {
			loading = false;
		}
	}
</script>

<Sheet bind:open>
	<SheetContent
		side="bottom"
		class="h-[85vh] sm:h-[600px] w-full p-0 border-t-4 border-blue-600 flex flex-col"
	>
		<!-- Header Overlay -->
		<div
			class="absolute top-4 left-4 z-10 bg-white/90 backdrop-blur p-4 rounded-lg shadow-sm border max-w-md"
		>
			<div class="flex items-center gap-2 mb-1">
				<Box class="w-5 h-5 text-blue-600" />
				<h2 class="font-bold text-lg">
					{$propertyStore.selectedProperty?.name || 'Select a Property'}
				</h2>
				<Badge variant="outline" class="text-xs bg-blue-50 text-blue-700 border-blue-200"
					>Beta 3D</Badge
				>
			</div>
			<p class="text-xs text-muted-foreground">
				Interactive Digital Twin. Green blocks are occupied units.
			</p>

			{#if loading}
				<div class="flex items-center gap-2 text-xs text-blue-600 mt-2">
					<Loader2 class="w-3 h-3 animate-spin" />
					Loading geometry...
				</div>
			{/if}
			{#if error}
				<div class="text-xs text-red-600 mt-2">⚠️ {error}</div>
			{/if}
		</div>

		<div
			class="w-full h-full bg-gradient-to-b from-slate-900 to-slate-800 relative overflow-hidden"
		>
			{#if data && !loading}
				<Canvas>
					<PropertyScene floors={data.floors} rentalUnits={data.rentalUnits} />
				</Canvas>
			{:else if !loading && !data}
				<div class="flex items-center justify-center h-full text-slate-400">
					Select a property to view model
				</div>
			{/if}
		</div>
	</SheetContent>
</Sheet>
