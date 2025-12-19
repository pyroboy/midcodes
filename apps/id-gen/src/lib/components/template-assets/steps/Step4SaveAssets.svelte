<script lang="ts">
	import { assetUploadStore, previewPairs } from '$lib/stores/assetUploadStore';
	import { ASSET_CATEGORIES, type AssetMetadata } from '$lib/schemas/template-assets.schema';
	import { cn } from '$lib/utils';
	// import type { DetectedRegion } from '$lib/schemas/template-assets.schema';

	// Get metadata for each selected pair
    // previewPairs is a derived store returning { front: Region, back?: Region, id: string, status: 'paired'|'unpaired' }[]
	let pairMetadataList = $derived(
		$previewPairs.map((pair) => ({
			pair,
			metadata: $assetUploadStore.assetMetadata.get(pair.front.id) || {
				regionId: pair.front.id,
				name: '',
				description: '',
				category: undefined,
				tags: []
			}
		}))
	);

	function updateMetadata(regionId: string, field: keyof AssetMetadata, value: string | string[]) {
		assetUploadStore.updateAssetMetadata(regionId, { [field]: value });
	}

	function addTag(regionId: string, tag: string) {
		const metadata = $assetUploadStore.assetMetadata.get(regionId);
		if (metadata && tag.trim() && !metadata.tags.includes(tag.trim())) {
			assetUploadStore.updateAssetMetadata(regionId, {
				tags: [...metadata.tags, tag.trim()]
			});
		}
	}

	function removeTag(regionId: string, tagToRemove: string) {
		const metadata = $assetUploadStore.assetMetadata.get(regionId);
		if (metadata) {
			assetUploadStore.updateAssetMetadata(regionId, {
				tags: metadata.tags.filter((t) => t !== tagToRemove)
			});
		}
	}

	let tagInputs = $state<Record<string, string>>({});

	function handleTagKeydown(e: KeyboardEvent, regionId: string) {
		if (e.key === 'Enter' || e.key === ',') {
			e.preventDefault();
			const tag = tagInputs[regionId]?.trim();
			if (tag) {
				addTag(regionId, tag);
				tagInputs[regionId] = '';
			}
		}
	}
</script>

<!-- Main container with side-by-side layout -->
<div class="flex gap-6 min-h-[500px]">
	<!-- LEFT: Preview of pairs -->
	<div class="w-1/2 flex-shrink-0">
		<div class="sticky top-4 space-y-4">
			<div>
				<h3 class="text-sm font-medium text-foreground mb-2">Pairs to Save</h3>
				<p class="text-xs text-muted-foreground">
					{pairMetadataList.length} template{pairMetadataList.length !== 1 ? 's' : ''} ready to save
				</p>
			</div>

			<div class="grid grid-cols-1 gap-4">
				{#each pairMetadataList as { pair, metadata }, index (pair.front.id)}
					<div class="relative overflow-hidden rounded-lg border border-border bg-muted/20 p-2">
                        <div class="flex gap-2">
                            <!-- Front -->
                            <div class="flex-1 space-y-1">
                                <span class="text-[10px] uppercase font-bold text-muted-foreground">Front</span>
                                <div class="aspect-[1.6/1] flex items-center justify-center bg-black/5 rounded overflow-hidden relative">
                                    {#if $assetUploadStore.frontImageUrl}
                                        <canvas
                                            class="h-full w-full object-contain"
                                            width={pair.front.width}
                                            height={pair.front.height}
                                            use:cropCanvas={{
                                                imageUrl: $assetUploadStore.frontImageUrl,
                                                region: pair.front
                                            }}
                                        ></canvas>
                                    {/if}
                                </div>
                            </div>
                            
                             <!-- Back -->
                            <div class="flex-1 space-y-1">
                                <span class="text-[10px] uppercase font-bold text-muted-foreground">Back</span>
                                <div class="aspect-[1.6/1] flex items-center justify-center bg-black/5 rounded overflow-hidden relative">
                                    {#if pair.back && $assetUploadStore.backImageUrl}
                                        <canvas
                                            class="h-full w-full object-contain"
                                            width={pair.back.width}
                                            height={pair.back.height}
                                            use:cropCanvas={{
                                                imageUrl: $assetUploadStore.backImageUrl,
                                                region: pair.back
                                            }}
                                        ></canvas>
                                    {:else}
                                        <div class="text-xs text-muted-foreground flex flex-col items-center">
                                            <span>No Back</span>
                                        </div>
                                    {/if}
                                </div>
                            </div>
                        </div>
                        
						<div class="mt-2 text-center">
							<span class="text-xs font-medium text-foreground">
								{metadata.name || `Template ${index + 1}`}
							</span>
						</div>
					</div>
				{/each}
			</div>

			<!-- Upload info -->
			<div class="rounded-lg border border-blue-500/20 bg-blue-500/5 p-3">
				<div class="flex items-start gap-2">
					<svg class="h-4 w-4 text-blue-500 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
					<div class="text-xs text-blue-700 dark:text-blue-300">
						<p class="font-medium">Ready to Save Templates</p>
						<p class="mt-1 text-blue-600/80 dark:text-blue-400/80">
							Templates will be saved with paired front and back asssets.
						</p>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- RIGHT: Metadata form per pair -->
	<div class="w-1/2 space-y-4">
		<div>
			<h2 class="text-xl font-semibold text-foreground">Save Templates</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Add metadata for each template
			</p>
		</div>

		<!-- Sample type badge -->
		<div class="flex items-center gap-2">
			<span class="text-sm text-muted-foreground">Sample Type:</span>
			<span class={cn(
				'rounded-full px-2.5 py-0.5 text-xs font-medium',
				$assetUploadStore.sampleType === 'data_filled'
					? 'bg-green-500/10 text-green-600 dark:text-green-400'
					: 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
			)}>
				{$assetUploadStore.sampleType === 'data_filled' ? 'Data Filled' : 'Blank Template'}
			</span>
		</div>

		<!-- Metadata forms -->
		<div class="space-y-4 max-h-[450px] overflow-y-auto pr-2">
			{#each pairMetadataList as { pair, metadata }, index (pair.front.id)}
				<div class="rounded-lg border border-border bg-card p-4 space-y-3">
					<div class="flex items-center justify-between">
						<h4 class="font-medium text-foreground">Template {index + 1}</h4>
						<span class="text-xs text-muted-foreground">
							{pair.front.orientation} • {pair.front.width}×{pair.front.height}px
						</span>
					</div>

					<!-- Name -->
					<div>
						<label for="name-{pair.front.id}" class="text-xs font-medium text-muted-foreground">Name *</label>
						<input
							id="name-{pair.front.id}"
							type="text"
							value={metadata.name}
							oninput={(e) => updateMetadata(pair.front.id, 'name', (e.target as HTMLInputElement).value)}
							placeholder="Enter template name"
							class="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						/>
					</div>

					<!-- Category -->
					<div>
						<label for="category-{pair.front.id}" class="text-xs font-medium text-muted-foreground">Category</label>
						<select
							id="category-{pair.front.id}"
							value={metadata.category || ''}
							onchange={(e) => updateMetadata(pair.front.id, 'category', (e.target as HTMLSelectElement).value)}
							class="mt-1 w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
						>
							<option value="">Select category</option>
							{#each ASSET_CATEGORIES as category}
								<option value={category}>{category}</option>
							{/each}
						</select>
					</div>

					<!-- Tags -->
					<div>
						<label for="tags-{pair.front.id}" class="text-xs font-medium text-muted-foreground">Tags</label>
						<div class="mt-1 flex flex-wrap gap-1 rounded-md border border-border bg-background p-2 min-h-[42px]">
							{#each metadata.tags as tag}
								<span class="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
									{tag}
									<button
										type="button"
										onclick={() => removeTag(pair.front.id, tag)}
										class="hover:text-destructive"
										aria-label="Remove tag {tag}"
									>
										<svg class="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
											<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
										</svg>
									</button>
								</span>
							{/each}
							<input
								id="tags-{pair.front.id}"
								type="text"
								bind:value={tagInputs[pair.front.id]}
								onkeydown={(e) => handleTagKeydown(e, pair.front.id)}
								placeholder={metadata.tags.length === 0 ? 'Add tags (press Enter)' : ''}
								class="flex-1 min-w-[100px] bg-transparent text-sm outline-none placeholder:text-muted-foreground/50"
							/>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</div>
</div>

<script module lang="ts">
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
             // Basic aspect ratio fill
            const scale = Math.min(canvas.width / options.region.width, canvas.height / options.region.height);
            const x = (canvas.width / 2) - (options.region.width / 2) * scale;
            const y = (canvas.height / 2) - (options.region.height / 2) * scale;
            
			ctx.drawImage(
				img,
				options.region.x,
				options.region.y,
				options.region.width,
				options.region.height,
				0, // Draw covering whole canvas or fitting?
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
