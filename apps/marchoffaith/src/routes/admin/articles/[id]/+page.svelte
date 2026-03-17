<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { slugify } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let title = $state(form?.title ?? data.article.title);
	let slug = $state(form?.slug ?? data.article.slug);
	let slugManuallyEdited = $state(true);

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

	let submitting = $state(false);
	let featuredImageUrl = $state(form?.featuredImage ?? data.article.featuredImage ?? '');
</script>

<svelte:head>
	<title>Edit Article - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-gray-900">Edit Article</h1>
	<a
		href="/admin/articles"
		class="text-sm text-gray-500 hover:text-gray-700"
	>
		&larr; Back to Articles
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
					type="date"
					id="date"
					name="date"
					value={form?.date ?? data.article.date}
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>

			<div class="space-y-1.5">
				<label for="category" class="block text-sm font-medium text-gray-700">Category</label>
				<input
					type="text"
					id="category"
					name="category"
					value={form?.category ?? data.article.category}
					required
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
				required
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
			>{form?.description ?? data.article.description}</textarea>
		</div>

		<div class="space-y-1.5">
			<label for="featuredImage" class="block text-sm font-medium text-gray-700">Featured Image URL</label>
			<input
				type="url"
				id="featuredImage"
				name="featuredImage"
				bind:value={featuredImageUrl}
				placeholder="https://..."
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
			/>
			{#if featuredImageUrl}
				<img src={featuredImageUrl} alt="Preview" class="mt-2 h-32 w-auto rounded-lg object-cover border border-gray-200" onerror={(e) => (e.currentTarget as HTMLImageElement).style.display='none'} />
			{/if}
		</div>

		<div class="flex items-center gap-2">
			<input
				type="checkbox"
				id="isPublished"
				name="isPublished"
				checked={form?.isPublished ?? data.article.isPublished}
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
				{submitting ? 'Saving...' : 'Update Article'}
			</button>
			<a href="/admin/articles" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</a>
		</div>
	</form>
</div>
