<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { slugify } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let title = $state(form?.title ?? data.gallery.title);
	let slug = $state(form?.slug ?? data.gallery.slug);
	let slugManuallyEdited = $state(true);
	let submitting = $state(false);
	let coverImageUrlValue = $state(form?.coverImageUrl ?? data.gallery.coverImageUrl ?? '');
	let addImageUrlValue = $state('');

	function handleTitleInput(e: Event) {
		const target = e.target as HTMLInputElement;
		title = target.value;
		if (!slugManuallyEdited) {
			slug = slugify(title);
		}
	}

	function handleSlugInput(e: Event) {
		const target = e.target as HTMLInputElement;
		slug = target.value;
		slugManuallyEdited = true;
	}
</script>

<svelte:head>
	<title>Edit Gallery - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-gray-900">Edit Gallery</h1>
	<a
		href="/admin/gallery"
		class="text-sm text-gray-500 hover:text-gray-700"
	>
		&larr; Back to Galleries
	</a>
</div>

{#if form?.error}
	<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
		{form.error}
	</div>
{/if}

<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
	<form method="POST" class="space-y-5" onsubmit={() => { submitting = true; }}>
		<div class="space-y-1.5">
			<label for="title" class="block text-sm font-medium text-gray-700">Title</label>
			<input
				type="text"
				id="title"
				name="title"
				value={title}
				oninput={handleTitleInput}
				required
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
			/>
		</div>

		<div class="space-y-1.5">
			<label for="slug" class="block text-sm font-medium text-gray-700">Slug</label>
			<input
				type="text"
				id="slug"
				name="slug"
				value={slug}
				oninput={handleSlugInput}
				required
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-mono"
			/>
			<p class="text-xs text-gray-400">Edit slug manually or clear to auto-generate from title.</p>
		</div>

		<div class="grid grid-cols-1 sm:grid-cols-2 gap-5">
			<div class="space-y-1.5">
				<label for="date" class="block text-sm font-medium text-gray-700">Date</label>
				<input
					type="text"
					id="date"
					name="date"
					value={form?.date ?? data.gallery.date ?? ''}
					placeholder="e.g. November 19, 2025"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>

			<div class="space-y-1.5">
				<label for="sortOrder" class="block text-sm font-medium text-gray-700">Sort Order</label>
				<input
					type="number"
					id="sortOrder"
					name="sortOrder"
					value={form?.sortOrder ?? data.gallery.sortOrder}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
		</div>

		<div class="space-y-1.5">
			<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
			<textarea
				id="description"
				name="description"
				rows="3"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
			>{form?.description ?? data.gallery.description ?? ''}</textarea>
		</div>

		<div class="space-y-1.5">
			<label for="coverImageUrl" class="block text-sm font-medium text-gray-700">Cover Image URL</label>
			<input
				type="url"
				id="coverImageUrl"
				name="coverImageUrl"
				value={coverImageUrlValue}
				oninput={(e) => { coverImageUrlValue = (e.target as HTMLInputElement).value; }}
				placeholder="https://..."
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
			/>
			{#if coverImageUrlValue}
				<img src={coverImageUrlValue} alt="Preview" class="mt-2 h-32 w-auto rounded-lg object-cover border border-gray-200" onerror={(e) => (e.currentTarget as HTMLImageElement).style.display='none'} />
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<input
				type="checkbox"
				id="isPublished"
				name="isPublished"
				checked={form?.isPublished ?? data.gallery.isPublished}
				class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
			/>
			<label for="isPublished" class="text-sm font-medium text-gray-700">Published</label>
		</div>

		<div class="flex items-center gap-3 pt-4">
			<button
				type="submit"
				disabled={submitting}
				class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
			>
				{submitting ? 'Saving...' : 'Update Gallery'}
			</button>
			<a href="/admin/gallery" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</a>
		</div>
	</form>
</div>

<!-- Images Section -->
<div class="mt-8">
	<h2 class="text-lg font-bold text-gray-900 mb-4">Images ({data.images.length})</h2>

	{#if form?.imageError}
		<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
			{form.imageError}
		</div>
	{/if}

	<!-- Add Image Form -->
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
		<h3 class="text-sm font-medium text-gray-700 mb-4">Add Image</h3>
		<form method="POST" action="?/addImage" class="space-y-3">
			<div class="flex flex-col sm:flex-row gap-3">
			<div class="flex-1">
				<input
					type="url"
					name="imageUrl"
					placeholder="Image URL (https://...)"
					required
					value={addImageUrlValue}
					oninput={(e) => { addImageUrlValue = (e.target as HTMLInputElement).value; }}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
			<div class="sm:w-48">
				<input
					type="text"
					name="caption"
					placeholder="Caption (optional)"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
			<div class="sm:w-24">
				<input
					type="number"
					name="sortOrder"
					placeholder="Order"
					value="0"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
			<button
				type="submit"
				class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors whitespace-nowrap"
			>
				Add Image
			</button>
			</div>
			{#if addImageUrlValue}
				<img src={addImageUrlValue} alt="Preview" class="h-32 w-auto rounded-lg object-cover border border-gray-200" onerror={(e) => (e.currentTarget as HTMLImageElement).style.display='none'} />
			{/if}
		</form>
	</div>

	<!-- Images Grid -->
	{#if data.images.length === 0}
		<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-8 text-center text-gray-400 text-sm">
			No images yet. Add one above.
		</div>
	{:else}
		<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
			{#each data.images as image}
				<div class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group">
					<div class="aspect-square relative">
						<img
							src={image.imageUrl}
							alt={image.caption ?? 'Gallery image'}
							class="w-full h-full object-cover"
						/>
					</div>
					<div class="p-3">
						{#if image.caption}
							<p class="text-xs text-gray-600 mb-2 truncate">{image.caption}</p>
						{/if}
						<form method="POST" action="?/removeImage" onsubmit={(e) => { if (!confirm('Remove this image?')) e.preventDefault(); }}>
							<input type="hidden" name="imageId" value={image.id} />
							<button type="submit" class="text-xs text-red-600 hover:text-red-800">
								Remove
							</button>
						</form>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
