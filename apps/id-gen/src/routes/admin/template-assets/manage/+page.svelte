<script lang="ts">
	import type { PageData } from './$types';
	import type { TemplateAsset } from '$lib/schemas/template-assets.schema';
	import { fade } from 'svelte/transition';
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
				<div class="aspect-[1.6/1] w-full overflow-hidden bg-muted">
					<img
						src={asset.image_url}
						alt={asset.name}
						class="h-full w-full object-contain p-2 transition-transform duration-300 group-hover:scale-105"
						loading="lazy"
					/>
				</div>

				<!-- Content -->
				<div class="p-4">
					<div class="mb-2 flex items-start justify-between gap-2">
						<div>
							<h3 class="font-medium text-foreground line-clamp-1">{asset.name}</h3>
							<p class="text-xs text-muted-foreground capitalize">
								{asset.orientation} • {asset.sample_type.replace('_', ' ')}
							</p>
						</div>
						<span
							class={asset.is_published
								? 'h-2 w-2 rounded-full bg-green-500'
								: 'h-2 w-2 rounded-full bg-yellow-500'}
							title={asset.is_published ? 'Published' : 'Draft'}
						></span>
					</div>

					<div class="flex flex-wrap gap-1 mb-3">
						{#if asset.category}
							<span
								class="inline-flex items-center rounded-full bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
							>
								{asset.category}
							</span>
						{/if}
					</div>

					<!-- Actions -->
					<div class="flex items-center justify-between gap-2 pt-2 border-t border-border mt-2">
						<button
							onclick={() => togglePublish(asset.id, asset.is_published)}
							class="text-xs font-medium text-primary hover:underline"
						>
							{asset.is_published ? 'Unpublish' : 'Publish'}
						</button>
						<button
							onclick={() => deleteAsset(asset.id, asset.image_path)}
							class="text-xs font-medium text-destructive hover:underline"
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
