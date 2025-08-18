<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import {
		Dialog,
		DialogContent,
		DialogDescription,
		DialogFooter,
		DialogHeader,
		DialogTitle
	} from '$lib/components/ui/dialog';
	import { AlertTriangle, Scissors, Info } from '@lucide/svelte';
	import type { ImageDimensions } from '$lib/utils/imageCropper';

	let {
		open = $bindable(false),
		frontImageInfo = null,
		backImageInfo = null,
		templateSize,
		onConfirm,
		onCancel
	}: {
		open: boolean;
		frontImageInfo?: {
			originalSize: ImageDimensions;
			needsCropping: boolean;
			filename: string;
		} | null;
		backImageInfo?: {
			originalSize: ImageDimensions;
			needsCropping: boolean;
			filename: string;
		} | null;
		templateSize: ImageDimensions;
		onConfirm: () => void;
		onCancel: () => void;
	} = $props();

	let croppingInfo = $derived(() => {
		const info: Array<{
			side: string;
			filename: string;
			originalSize: ImageDimensions;
			willBeCropped: boolean;
		}> = [];

		if (frontImageInfo) {
			info.push({
				side: 'Front',
				filename: frontImageInfo.filename,
				originalSize: frontImageInfo.originalSize,
				willBeCropped: frontImageInfo.needsCropping
			});
		}

		if (backImageInfo) {
			info.push({
				side: 'Back',
				filename: backImageInfo.filename,
				originalSize: backImageInfo.originalSize,
				willBeCropped: backImageInfo.needsCropping
			});
		}

		return info;
	});

	let hasAnyCropping = $derived(() => {
		return croppingInfo().some((info) => info.willBeCropped);
	});

	function formatDimensions(size: ImageDimensions): string {
		return `${size.width} × ${size.height}px`;
	}
</script>

<Dialog bind:open>
	<DialogContent class="sm:max-w-lg">
		<DialogHeader>
			<DialogTitle class="flex items-center gap-2">
				{#if hasAnyCropping()}
					<AlertTriangle class="w-5 h-5 text-orange-500" />
					Image Cropping Required
				{:else}
					<Info class="w-5 h-5 text-blue-500" />
					Save Template Confirmation
				{/if}
			</DialogTitle>
			<DialogDescription>
				{#if hasAnyCropping()}
					Some background images will be cropped based on your current positioning and scaling.
				{:else}
					Your template is ready to be saved with the current background images.
				{/if}
			</DialogDescription>
		</DialogHeader>

		<div class="space-y-4">
			<!-- Template size info -->
			<div class="bg-muted p-3 rounded-lg">
				<div class="flex items-center gap-2 mb-2">
					<Info class="w-4 h-4 text-muted-foreground" />
					<span class="text-sm font-medium">Template Size</span>
				</div>
				<p class="text-sm text-muted-foreground">
					{formatDimensions(templateSize)}
				</p>
			</div>

			<!-- Image details -->
			<div class="space-y-3">
				{#each croppingInfo() as imageInfo}
					<div
						class="border rounded-lg p-3 {imageInfo.willBeCropped
							? 'border-orange-200 bg-orange-50'
							: 'border-green-200 bg-green-50'}"
					>
						<div class="flex items-start justify-between gap-3">
							<div class="flex-1">
								<div class="flex items-center gap-2 mb-1">
									{#if imageInfo.willBeCropped}
										<Scissors class="w-4 h-4 text-orange-600" />
										<span class="font-medium text-orange-800">{imageInfo.side} Background</span>
										<span class="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded"
											>Will be cropped</span
										>
									{:else}
										<span class="font-medium text-green-800">{imageInfo.side} Background</span>
										<span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded"
											>No cropping needed</span
										>
									{/if}
								</div>
								<p class="text-sm text-muted-foreground mb-1">
									{imageInfo.filename}
								</p>
								<p class="text-sm">
									<span class="text-muted-foreground">Original size:</span>
									<span class="font-mono">{formatDimensions(imageInfo.originalSize)}</span>
								</p>
								{#if imageInfo.willBeCropped}
									<p class="text-sm">
										<span class="text-muted-foreground">After cropping:</span>
										<span class="font-mono">{formatDimensions(templateSize)}</span>
									</p>
								{/if}
							</div>
						</div>
					</div>
				{/each}
			</div>

			{#if hasAnyCropping()}
				<div class="bg-orange-50 border border-orange-200 p-3 rounded-lg">
					<div class="flex gap-2">
						<AlertTriangle class="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
						<div class="text-sm">
							<p class="font-medium text-orange-800 mb-1">What happens when you save:</p>
							<ul class="text-orange-700 space-y-1 list-disc list-inside">
								<li>Images will be cropped to match your current positioning and scaling</li>
								<li>Only the visible area will be saved with the template</li>
								<li>Original image quality will be maintained</li>
								<li>You can cancel and readjust positioning if needed</li>
							</ul>
						</div>
					</div>
				</div>
			{:else}
				<div class="bg-green-50 border border-green-200 p-3 rounded-lg">
					<div class="flex gap-2">
						<Info class="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
						<p class="text-sm text-green-700">
							Your background images are perfectly sized and positioned. No cropping is required.
						</p>
					</div>
				</div>
			{/if}
		</div>

		<DialogFooter>
			<Button variant="outline" onclick={onCancel}>Cancel</Button>
			<Button onclick={onConfirm} class="min-w-[120px]">
				{hasAnyCropping() ? 'Crop & Save' : 'Save Template'}
			</Button>
		</DialogFooter>
	</DialogContent>
</Dialog>
