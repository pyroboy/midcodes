<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { slugify } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let titleValue = $state('');
	let slugValue = $state('');
	let slugManuallyEdited = $state(false);

	$effect(() => {
		if (!slugManuallyEdited) {
			slugValue = slugify(titleValue);
		}
	});

	let submitting = $state(false);
	let imageUrlValue = $state('');
</script>

<svelte:head>
	<title>New Event - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<div>
		<a href="/admin/events" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">&larr; Back to Events</a>
		<h1 class="text-2xl font-bold text-gray-900 mt-1">New Event</h1>
	</div>
</div>

{#if form?.error}
	<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{form.error}</div>
{/if}

<form method="POST" class="space-y-0" onsubmit={() => { submitting = true; }}>
	<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
		<div class="space-y-5">
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Event Details</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label for="title" class="block text-sm font-medium text-gray-700">Title</label>
					<input
						id="title"
						name="title"
						type="text"
						required
						bind:value={titleValue}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="slug" class="block text-sm font-medium text-gray-700">Slug</label>
					<input
						id="slug"
						name="slug"
						type="text"
						bind:value={slugValue}
						oninput={() => { slugManuallyEdited = true; }}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
					<p class="text-xs text-gray-400">Auto-generated from title. Edit to customize.</p>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label for="date" class="block text-sm font-medium text-gray-700">Start Date & Time</label>
					<input
						id="date"
						name="date"
						type="datetime-local"
						required
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="endDate" class="block text-sm font-medium text-gray-700">End Date & Time (optional)</label>
					<input
						id="endDate"
						name="endDate"
						type="datetime-local"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
			</div>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label for="location" class="block text-sm font-medium text-gray-700">Location</label>
					<input
						id="location"
						name="location"
						type="text"
						placeholder="e.g. MOFI Main Church, Tagbilaran"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="churchId" class="block text-sm font-medium text-gray-700">Church (optional)</label>
					<select
						id="churchId"
						name="churchId"
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					>
						<option value="">— None —</option>
						{#each data.churches as church}
							<option value={church.id}>{church.name}</option>
						{/each}
					</select>
				</div>
			</div>

			<div class="space-y-1.5">
				<label for="description" class="block text-sm font-medium text-gray-700">Description</label>
				<textarea
					id="description"
					name="description"
					rows="4"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				></textarea>
			</div>

			<div class="space-y-1.5">
				<label for="imageUrl" class="block text-sm font-medium text-gray-700">Image URL</label>
				<input
					id="imageUrl"
					name="imageUrl"
					type="text"
					placeholder="https://..."
					bind:value={imageUrlValue}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
				{#if imageUrlValue}
					<img src={imageUrlValue} alt="Preview" class="mt-2 h-32 w-auto rounded-lg object-cover border border-gray-200" onerror={(e) => (e.currentTarget as HTMLImageElement).style.display='none'} />
				{/if}
			</div>

			<div class="flex items-center gap-2 mt-2">
				<input id="isPublished" name="isPublished" type="checkbox" class="rounded border-gray-300 text-red-600 focus:ring-red-500" />
				<label for="isPublished" class="text-sm font-medium text-gray-700">Published</label>
			</div>
		</div>
	</div>

	<div class="flex items-center gap-3 mt-6">
		<button
			type="submit"
			disabled={submitting}
			class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
		>
			{submitting ? 'Saving...' : 'Create Event'}
		</button>
		<a href="/admin/events" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</a>
	</div>
</form>
