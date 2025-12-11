<script lang="ts">
	import type { PageData } from './$types';
	import AssetUploadWizard from '$lib/components/template-assets/AssetUploadWizard.svelte';
	import { assetUploadStore, selectedRegions } from '$lib/stores/assetUploadStore';
	import { goto } from '$app/navigation';

	let { data }: { data: PageData } = $props();

	let showResults = $state(false);

	function handleComplete() {
		showResults = true;
	}

	function handleCancel() {
		goto('/admin');
	}

	function handleReset() {
		assetUploadStore.reset();
		showResults = false;
	}
</script>

<svelte:head>
	<title>Template Assets | Admin</title>
</svelte:head>

<div class="container mx-auto max-w-5xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<div class="flex items-center gap-3">
				<a
					href="/admin"
					class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Admin
				</a>
				<span class="text-muted-foreground">/</span>
				<span class="text-sm font-medium text-foreground">Template Assets</span>
			</div>

			<h1 class="mt-4 text-2xl font-bold text-foreground">Template Assets</h1>
			<p class="mt-1 text-muted-foreground">
				Upload A4 scans to detect and extract ID card templates
			</p>
		</div>

		<a
			href="/admin/template-assets/manage"
			class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
		>
			<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
			</svg>
			Manage Assets
		</a>
	</div>

	<!-- Main content -->
	<div class="rounded-lg border border-border bg-card p-6">
		{#if !showResults}
			<AssetUploadWizard
				sizePresets={data.sizePresets}
				userId={data.user?.id}
				onComplete={handleComplete}
				onCancel={handleCancel}
			/>
		{:else}
			<!-- Results view -->
			<div class="space-y-6">
				<div class="text-center">
					<div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
						<svg class="h-8 w-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					</div>
					<h2 class="text-xl font-semibold text-foreground">Detection Complete!</h2>
					<p class="mt-1 text-muted-foreground">
						{$selectedRegions.length} card{$selectedRegions.length !== 1 ? 's' : ''} detected and ready
					</p>
				</div>

				<!-- Summary -->
				<div class="rounded-lg bg-muted/50 p-4">
					<h3 class="mb-3 font-medium text-foreground">Detection Summary</h3>
					<dl class="grid grid-cols-2 gap-4 text-sm">
						<div>
							<dt class="text-muted-foreground">Size Category</dt>
							<dd class="font-medium text-foreground">
								{$assetUploadStore.selectedSizePreset?.name ?? 'N/A'}
							</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Sample Type</dt>
							<dd class="font-medium text-foreground capitalize">
								{$assetUploadStore.sampleType?.replace('_', ' ') ?? 'N/A'}
							</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Total Regions</dt>
							<dd class="font-medium text-foreground">
								{$assetUploadStore.detectedRegions.length}
							</dd>
						</div>
						<div>
							<dt class="text-muted-foreground">Selected</dt>
							<dd class="font-medium text-foreground">
								{$selectedRegions.length}
							</dd>
						</div>
					</dl>
				</div>

				<!-- Selected cards preview -->
				{#if $selectedRegions.length > 0}
					<div>
						<h3 class="mb-3 font-medium text-foreground">Selected Cards Preview</h3>
						<div class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
							{#each $selectedRegions as region, index (region.id)}
								<div class="relative overflow-hidden rounded-lg border border-border bg-muted">
									<div class="aspect-[1.6/1] flex items-center justify-center text-muted-foreground">
										{#if $assetUploadStore.uploadedImageUrl}
											<canvas
												class="h-full w-full"
												width={region.width}
												height={region.height}
												use:cropCanvas={{
													imageUrl: $assetUploadStore.uploadedImageUrl,
													region
												}}
											></canvas>
										{:else}
											Card {index + 1}
										{/if}
									</div>
									<div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2">
										<span class="text-xs font-medium text-white">Card {index + 1}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Note about next steps -->
				<div class="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
					<div class="flex gap-3">
						<svg class="h-5 w-5 flex-shrink-0 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
						</svg>
						<div>
							<p class="text-sm font-medium text-blue-700 dark:text-blue-300">Assets Saved Successfully</p>
							<p class="mt-1 text-sm text-blue-600/80 dark:text-blue-400/80">
								Your template assets have been uploaded and saved. You can now manage them in the assets dashboard.
							</p>
						</div>
					</div>
				</div>

				<!-- Action buttons -->
				<div class="flex justify-center gap-3">
					<button
						type="button"
						onclick={handleReset}
						class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
						</svg>
						Detect More Cards
					</button>

					<a
						href="/admin/template-assets/manage"
						class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
					>
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
						</svg>
						Go to Manage Assets
					</a>
				</div>
			</div>
		{/if}
	</div>
</div>

<script lang="ts" module>
	import type { DetectedRegion } from '$lib/schemas/template-assets.schema';

	// Svelte action to render cropped region preview
	function cropCanvas(
		canvas: HTMLCanvasElement,
		options: { imageUrl: string; region: DetectedRegion }
	) {
		const ctx = canvas.getContext('2d');
		if (!ctx) return;

		const img = new Image();
		img.onload = () => {
			ctx.drawImage(
				img,
				options.region.x,
				options.region.y,
				options.region.width,
				options.region.height,
				0,
				0,
				canvas.width,
				canvas.height
			);
		};
		img.src = options.imageUrl;

		return {
			update(newOptions: { imageUrl: string; region: DetectedRegion }) {
				img.onload = () => {
					ctx.clearRect(0, 0, canvas.width, canvas.height);
					ctx.drawImage(
						img,
						newOptions.region.x,
						newOptions.region.y,
						newOptions.region.width,
						newOptions.region.height,
						0,
						0,
						canvas.width,
						canvas.height
					);
				};
				if (img.complete) {
					img.onload(new Event('load'));
				}
			}
		};
	}
</script>
