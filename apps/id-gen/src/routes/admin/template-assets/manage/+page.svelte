<script lang="ts">
	import type { PageData } from './$types';
	import type { TemplateAsset } from '$lib/schemas/template-assets.schema';
	import { fade } from 'svelte/transition';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedCategory = $state<string | 'all'>('all');

	const supabase = $page.data.supabase;

	// Deriving filtered assets
	let filteredAssets = $derived(
		(data.assets as unknown as TemplateAsset[]).filter((asset) => {
			const matchesSearch =
				asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				asset.tags?.some((tag) => tag.toLowerCase().includes(searchQuery.toLowerCase()));
			const matchesCategory = selectedCategory === 'all' || asset.category === selectedCategory;
			return matchesSearch && matchesCategory;
		})
	);

	let categories = $derived([
		...new Set((data.assets as unknown as TemplateAsset[]).map((a) => a.category).filter(Boolean))
	]);

	async function togglePublish(assetId: string, currentStatus: boolean) {
		const { error } = await supabase
			.from('template_assets')
			.update({ is_published: !currentStatus })
			.eq('id', assetId);

		if (error) {
			console.error('Error updating publish status:', error);
			alert('Failed to update status');
		} else {
			// Optimistic update or reload filtered page data
			// Since we use filteredAssets derived from data.assets, we need to invalidate or update data.assets
			// Real-time or manual invalidation is best. For now assume page reload or invalidate.
			// Actually router invalidate is better.
			window.location.reload(); // Simple reload for MVP
		}
	}

	async function deleteAsset(assetId: string, imagePath: string) {
		if (!confirm('Are you sure you want to delete this asset? This cannot be undone.')) return;

		// Delete from storage
		const { error: storageError } = await supabase.storage
			.from('template-assets')
			.remove([imagePath]);

		if (storageError) {
			console.error('Error deleting from storage:', storageError);
			// Proceed to delete DB record anyway if file missing? Or warn?
		}

		const { error } = await supabase.from('template_assets').delete().eq('id', assetId);

		if (error) {
			console.error('Error deleting asset:', error);
			alert('Failed to delete asset');
		} else {
			window.location.reload();
		}
	}
</script>

<svelte:head>
	<title>Manage Assets | Admin</title>
</svelte:head>

<div class="container mx-auto max-w-7xl px-4 py-8">
	<!-- Header -->
	<div class="mb-8 flex items-center justify-between">
		<div>
			<div class="flex items-center gap-3">
				<a
					href="/admin"
					class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path
							stroke-linecap="round"
							stroke-linejoin="round"
							stroke-width="2"
							d="M15 19l-7-7 7-7"
						/>
					</svg>
					Admin
				</a>
				<span class="text-muted-foreground">/</span>
				<a
					href="/admin/template-assets"
					class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
				>
					Template Assets
				</a>
				<span class="text-muted-foreground">/</span>
				<span class="text-sm font-medium text-foreground">Manage</span>
			</div>

			<h1 class="mt-4 text-2xl font-bold text-foreground">Manage Assets</h1>
			<p class="mt-1 text-muted-foreground">View and manage uploaded template assets</p>
		</div>
		<a
			href="/admin/template-assets"
			class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
		>
			Upload New
		</a>
	</div>

	<!-- Filters -->
	<div class="mb-6 flex gap-4">
		<div class="relative flex-1 max-w-sm">
			<svg
				class="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
				fill="none"
				viewBox="0 0 24 24"
				stroke="currentColor"
			>
				<path
					stroke-linecap="round"
					stroke-linejoin="round"
					stroke-width="2"
					d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
				/>
			</svg>
			<input
				type="text"
				placeholder="Search assets..."
				bind:value={searchQuery}
				class="w-full rounded-md border border-border bg-background pl-9 pr-4 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
			/>
		</div>
		<select
			bind:value={selectedCategory}
			class="rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
		>
			<option value="all">All Categories</option>
			{#each categories as category}
				<option value={category}>{category}</option>
			{/each}
		</select>
	</div>

	<!-- Assets Grid -->
	<div class="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
		{#each filteredAssets as asset (asset.id)}
			<div
				class="group relative overflow-hidden rounded-lg border border-border bg-card transition-shadow hover:shadow-md"
				transition:fade
			>
				<!-- Image -->
				<!-- Side-by-Side Images -->
				<div class="grid grid-cols-2 gap-px bg-border min-h-[140px]">
					<!-- Front Image -->
					<div class="relative bg-muted h-full">
						<img
							src={asset.image_url}
							alt={asset.name}
							class="absolute inset-0 h-full w-full object-contain p-2"
							loading="lazy"
						/>
						<div
							class="absolute bottom-1 left-1 px-1 py-0.5 bg-black/50 rounded text-[9px] text-white"
						>
							Front
						</div>
					</div>

					<!-- Back Image -->
					<div class="relative bg-muted h-full">
						{#if asset.back_image_url}
							<img
								src={asset.back_image_url}
								alt="{asset.name} (Back)"
								class="absolute inset-0 h-full w-full object-contain p-2"
								loading="lazy"
							/>
							<div
								class="absolute bottom-1 left-1 px-1 py-0.5 bg-black/50 rounded text-[9px] text-white"
							>
								Back
							</div>
						{:else}
							<div
								class="absolute inset-0 flex items-center justify-center text-muted-foreground/30 text-xs"
							>
								No Back
							</div>
						{/if}
					</div>
				</div>

				<!-- Content -->
				<div class="p-4">
					<div class="mb-3">
						<h3 class="font-medium text-foreground line-clamp-1 text-sm">{asset.name}</h3>
						<div class="flex items-center justify-between mt-1">
							<p class="text-[10px] text-muted-foreground capitalize">
								{asset.orientation} • {asset.sample_type.replace('_', ' ')}
							</p>
							<span
								class="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wide
								{asset.is_published
									? 'bg-green-100 text-green-700 border border-green-200'
									: 'bg-yellow-100 text-yellow-700 border border-yellow-200'}"
								title={asset.is_published ? 'Live for users' : 'Draft / Internal only'}
							>
								{asset.is_published ? 'LIVE' : 'DRAFT'}
							</span>
						</div>
					</div>

					<!-- Stats & Categories -->
					<div class="space-y-2 mb-3">
						<!-- Categories -->
						{#if asset.category}
							<span
								class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-[10px] font-medium text-secondary-foreground"
							>
								{asset.category}
							</span>
						{/if}

						<!-- Stats / Variants -->
						{#if asset.stats}
							<div class="flex flex-wrap gap-1.5 pt-2 border-t border-border">
								<!-- Elements Indicator -->
								<div
									class="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border {asset
										.stats.hasElements
										? 'bg-blue-50/50 border-blue-200 text-blue-700'
										: 'bg-muted/50 border-transparent text-muted-foreground'}"
								>
									<svg class="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
										<path
											stroke-linecap="round"
											stroke-linejoin="round"
											stroke-width="2"
											d="M4 6h16M4 12h16m-7 6h7"
										/>
									</svg>
									<span>{asset.stats.elementCount} Elements</span>
								</div>

								<!-- Variant Badges -->
								<div class="flex items-center gap-0.5 ml-auto">
									{#each Object.entries(asset.stats.variants) as [variant, exists]}
										<span
											class="w-4 h-4 flex items-center justify-center rounded text-[8px] font-bold uppercase
											{exists ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/40'}"
											title="{variant} {exists ? 'Available' : 'Missing'}"
										>
											{variant[0]}
										</span>
									{/each}
								</div>
							</div>
						{/if}
					</div>

					<!-- Actions -->
					<div class="grid grid-cols-2 gap-2 mt-3 pt-2 border-t border-border">
						{#if asset.template_id}
							<a
								href="/templates?id={asset.template_id}"
								class="flex items-center justify-center text-xs font-medium text-blue-600 hover:text-blue-700 bg-blue-50 hover:bg-blue-100 py-1.5 rounded transition-colors"
								target="_blank"
							>
								Edit Template
							</a>

							<a
								href="/admin/template-assets/decompose?assetId={asset.id}"
								class="flex items-center justify-center text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 py-1.5 rounded transition-colors"
								title="Decompose image into layers using AI"
							>
								<svg class="w-3 h-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
									<path
										stroke-linecap="round"
										stroke-linejoin="round"
										stroke-width="2"
										d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
									/>
								</svg>
								Decompose
							</a>

							<form
								action="?/regenerateAsset"
								method="POST"
								use:enhance={() => {
									return async ({ result }) => {
										if (result.type === 'success') {
											// Optional: toast success
											window.location.reload();
										} else if (result.type === 'failure') {
											alert(result.data?.message || 'Failed');
										}
									};
								}}
							>
								<input type="hidden" name="assetId" value={asset.id} />
								<button
									type="submit"
									class="w-full flex items-center justify-center text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 py-1.5 rounded transition-colors"
									title="Syncs asset images with latest template edits"
								>
									Sync
								</button>
							</form>
						{:else}
							<span
								class="flex items-center justify-center text-xs text-muted-foreground bg-muted/50 py-1.5 rounded cursor-not-allowed col-span-2"
								title="No template linked"
							>
								No Template
							</span>
						{/if}

						<button
							class="flex items-center justify-center text-xs font-medium text-destructive hover:text-destructive/80 bg-destructive/10 hover:bg-destructive/20 py-1.5 rounded transition-colors col-span-2"
							onclick={() => deleteAsset(asset.id, asset.image_path || '')}
						>
							Delete
						</button>
					</div>
				</div>
			</div>
		{:else}
			<div class="col-span-full py-12 text-center">
				<p class="text-muted-foreground">No assets found matching your criteria.</p>
			</div>
		{/each}
	</div>
</div>
