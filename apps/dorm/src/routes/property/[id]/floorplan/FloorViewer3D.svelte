<script lang="ts">
	import { Canvas } from '@threlte/core';
	import FloorScene from './FloorScene.svelte';
	import type { FloorLayoutItem } from './types';
	import { browser } from '$app/environment';
	import { onDestroy } from 'svelte';
	import { AlertTriangle } from 'lucide-svelte';

	let {
		floors,
		allItems,
		rentalUnits,
		unitTenantsMap,
		selectedFloorId,
		onUnitClick
	}: {
		floors: any[];
		allItems: FloorLayoutItem[];
		rentalUnits: any[];
		unitTenantsMap: Map<string, { name: string; status: string }[]>;
		selectedFloorId: string | null;
		onUnitClick: (rentalUnitId: string) => void;
	} = $props();

	let webglError = $state<string | null>(null);
	let mounted = $state(false);

	// Check WebGL availability before mounting Canvas
	$effect(() => {
		if (!browser) return;

		try {
			const testCanvas = document.createElement('canvas');
			const gl = testCanvas.getContext('webgl2') || testCanvas.getContext('webgl');
			if (!gl) {
				webglError = 'WebGL is not available. Try disabling Brave Shields or using Chrome.';
				return;
			}
			// Release test context immediately
			const ext = gl.getExtension('WEBGL_lose_context');
			if (ext) ext.loseContext();
		} catch (e: any) {
			webglError = `WebGL error: ${e.message}`;
			return;
		}

		mounted = true;
	});

	// Clean up WebGL contexts on destroy to prevent "too many contexts" on mobile
	onDestroy(() => {
		if (!browser) return;
		// Force release any lingering WebGL contexts by finding canvas elements
		const canvasEls = document.querySelectorAll('canvas');
		canvasEls.forEach((c) => {
			try {
				const gl = c.getContext('webgl2') || c.getContext('webgl');
				if (gl) {
					const ext = gl.getExtension('WEBGL_lose_context');
					if (ext) ext.loseContext();
				}
			} catch {}
		});
	});
</script>

<div class="w-full relative rounded-lg overflow-hidden border bg-gradient-to-b from-sky-50 to-sky-100" style="height: calc(100dvh - 120px); min-height: 400px;">
	{#if webglError}
		<div class="absolute inset-0 z-10 flex items-center justify-center p-6">
			<div class="bg-white/95 backdrop-blur rounded-lg border border-amber-200 shadow-lg p-6 max-w-sm text-center">
				<AlertTriangle class="w-10 h-10 text-amber-500 mx-auto mb-3" />
				<h3 class="font-semibold text-lg mb-2">3D View Issue</h3>
				<p class="text-sm text-gray-600 mb-3">{webglError}</p>
				<ul class="text-xs text-gray-500 text-left space-y-1 pl-4">
					<li>Close other browser tabs to free GPU memory</li>
					<li>Disable Brave Shields for this site</li>
					<li>Try Chrome instead of Brave</li>
				</ul>
			</div>
		</div>
	{:else if mounted}
		<Canvas>
			<FloorScene
				{floors}
				{allItems}
				{rentalUnits}
				{unitTenantsMap}
				{selectedFloorId}
				{onUnitClick}
			/>
		</Canvas>
	{/if}
</div>
