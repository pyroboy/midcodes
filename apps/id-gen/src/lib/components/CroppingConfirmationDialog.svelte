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
			previewUrl?: string;
		} | null;
		backImageInfo?: {
			originalSize: ImageDimensions;
			needsCropping: boolean;
			filename: string;
			previewUrl?: string;
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

			<!-- Image details with visual previews -->
			<div class="space-y-3">
				{#if frontImageInfo}
					<div
						class="border rounded-lg p-4 {frontImageInfo.needsCropping
							? 'border-orange-200 bg-orange-50'
							: 'border-green-200 bg-green-50'}"
					>
						<div class="flex gap-4">
							<!-- Image preview -->
							{#if frontImageInfo.previewUrl}
								<div class="flex-shrink-0">
									<div class="relative">
										<img
											src={frontImageInfo.previewUrl}
											alt="Front cropped preview"
											class="w-32 h-20 object-cover rounded border-2 border-white shadow-sm"
											style="aspect-ratio: {templateSize.width}/{templateSize.height}"
										/>
										<div
											class="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium"
										>
											Preview
										</div>
									</div>
									<p class="text-xs text-center text-muted-foreground mt-1">
										{frontImageInfo.needsCropping ? 'What will be saved' : 'Final result'}
									</p>
								</div>
							{/if}

							<!-- Image info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-2">
									{#if frontImageInfo.needsCropping}
										<Scissors class="w-4 h-4 text-orange-600" />
										<span class="font-medium text-orange-800">Front Background</span>
										<span class="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
											Will be cropped
										</span>
									{:else}
										<span class="font-medium text-green-800">Front Background</span>
										<span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
											No cropping needed
										</span>
									{/if}
								</div>
								<p class="text-sm text-muted-foreground mb-1 truncate">
									{frontImageInfo.filename}
								</p>
								<p class="text-sm">
									<span class="text-muted-foreground">Original:</span>
									<span class="font-mono text-xs"
										>{formatDimensions(frontImageInfo.originalSize)}</span
									>
								</p>
								{#if frontImageInfo.needsCropping}
									<p class="text-sm">
										<span class="text-muted-foreground">Final:</span>
										<span class="font-mono text-xs font-semibold"
											>{formatDimensions(templateSize)}</span
										>
									</p>
								{/if}
							</div>
						</div>
					</div>
				{/if}

				{#if backImageInfo}
					<div
						class="border rounded-lg p-4 {backImageInfo.needsCropping
							? 'border-orange-200 bg-orange-50'
							: 'border-green-200 bg-green-50'}"
					>
						<div class="flex gap-4">
							<!-- Image preview -->
							{#if backImageInfo.previewUrl}
								<div class="flex-shrink-0">
									<div class="relative">
										<img
											src={backImageInfo.previewUrl}
											alt="Back cropped preview"
											class="w-32 h-20 object-cover rounded border-2 border-white shadow-sm"
											style="aspect-ratio: {templateSize.width}/{templateSize.height}"
										/>
										<div
											class="absolute -top-1 -right-1 bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full font-medium"
										>
											Preview
										</div>
									</div>
									<p class="text-xs text-center text-muted-foreground mt-1">
										{backImageInfo.needsCropping ? 'What will be saved' : 'Final result'}
									</p>
								</div>
							{/if}

							<!-- Image info -->
							<div class="flex-1 min-w-0">
								<div class="flex items-center gap-2 mb-2">
									{#if backImageInfo.needsCropping}
										<Scissors class="w-4 h-4 text-orange-600" />
										<span class="font-medium text-orange-800">Back Background</span>
										<span class="text-xs bg-orange-200 text-orange-800 px-2 py-1 rounded">
											Will be cropped
										</span>
									{:else}
										<span class="font-medium text-green-800">Back Background</span>
										<span class="text-xs bg-green-200 text-green-800 px-2 py-1 rounded">
											No cropping needed
										</span>
									{/if}
								</div>
								<p class="text-sm text-muted-foreground mb-1 truncate">
									{backImageInfo.filename}
								</p>
								<p class="text-sm">
									<span class="text-muted-foreground">Original:</span>
									<span class="font-mono text-xs"
										>{formatDimensions(backImageInfo.originalSize)}</span
									>
								</p>
								{#if backImageInfo.needsCropping}
									<p class="text-sm">
										<span class="text-muted-foreground">Final:</span>
										<span class="font-mono text-xs font-semibold"
											>{formatDimensions(templateSize)}</span
										>
									</p>
								{/if}
							</div>
						</div>
					</div>
				{/if}
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
