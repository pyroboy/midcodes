<script lang="ts">
	import type { ActionData } from './$types';
	import { slugify } from '$lib/utils';

	let { form }: { form: ActionData } = $props();

	let submitting = $state(false);
	let photoUrlValue = $state(form?.photoUrl ?? '');

	let name = $state(form?.name ?? '');
	let slug = $state(form?.slug ?? '');
	let slugManuallyEdited = $state(false);

	function handleNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		name = target.value;
		if (!slugManuallyEdited) {
			slug = slugify(name);
		}
	}

	function handleSlugInput(e: Event) {
		const target = e.target as HTMLInputElement;
		slug = target.value;
		slugManuallyEdited = true;
	}
</script>

<svelte:head>
	<title>New Pastor - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<h1 class="text-2xl font-bold text-gray-900">New Pastor</h1>
	<a
		href="/admin/pastors"
		class="text-sm text-gray-500 hover:text-gray-700"
	>
		&larr; Back to Pastors
	</a>
</div>

{#if form?.error}
	<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
		{form.error}
	</div>
{/if}

<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
	<form method="POST" class="space-y-5" onsubmit={() => { submitting = true; }}>
		<!-- Basic Info -->
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
				<input
					type="text"
					id="name"
					name="name"
					value={name}
					oninput={handleNameInput}
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
				<p class="text-xs text-gray-400">Auto-generated from name. Edit to customize.</p>
			</div>
		</div>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<label for="title" class="block text-sm font-medium text-gray-700">Title</label>
				<input
					type="text"
					id="title"
					name="title"
					value={form?.title ?? ''}
					required
					placeholder="e.g. Head Pastor"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>

			<div class="space-y-1.5">
				<label for="role" class="block text-sm font-medium text-gray-700">Role</label>
				<input
					type="text"
					id="role"
					name="role"
					value={form?.role ?? ''}
					placeholder="e.g. Senior Pastor & Spiritual Leader"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
		</div>

		<!-- About -->
		<h2 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pt-6 border-t border-gray-100">About</h2>

		<div class="space-y-1.5">
			<label for="bio" class="block text-sm font-medium text-gray-700">Bio</label>
			<textarea
				id="bio"
				name="bio"
				rows="4"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
			>{form?.bio ?? ''}</textarea>
		</div>

		<div class="space-y-1.5">
			<label for="ministryFocus" class="block text-sm font-medium text-gray-700">Ministry Focus</label>
			<input
				type="text"
				id="ministryFocus"
				name="ministryFocus"
				value={form?.ministryFocus ?? ''}
				placeholder="e.g. Youth Ministry, Worship, Missions"
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
			/>
		</div>

		<!-- Contact -->
		<h2 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pt-6 border-t border-gray-100">Contact</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
				<input
					type="tel"
					id="phone"
					name="phone"
					value={form?.phone ?? ''}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>

			<div class="space-y-1.5">
				<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
				<input
					type="email"
					id="email"
					name="email"
					value={form?.email ?? ''}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
		</div>

		<!-- Media -->
		<h2 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pt-6 border-t border-gray-100">Media</h2>

		<div class="space-y-1.5">
			<label for="photoUrl" class="block text-sm font-medium text-gray-700">Photo URL</label>
			<input
				type="url"
				id="photoUrl"
				name="photoUrl"
				bind:value={photoUrlValue}
				placeholder="https://..."
				class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
			/>
			{#if photoUrlValue}
				<img src={photoUrlValue} alt="Preview" class="mt-2 h-32 w-auto rounded-lg object-cover border border-gray-200" onerror={(e) => (e.currentTarget as HTMLImageElement).style.display='none'} />
			{/if}
		</div>

		<!-- Settings -->
		<h2 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pt-6 border-t border-gray-100">Settings</h2>

		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<label for="sortOrder" class="block text-sm font-medium text-gray-700">Sort Order</label>
				<input
					type="number"
					id="sortOrder"
					name="sortOrder"
					value={form?.sortOrder ?? 0}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>

			<div class="flex items-center gap-2 pt-6">
				<input
					type="checkbox"
					id="isActive"
					name="isActive"
					checked={form?.isActive ?? true}
					class="h-4 w-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
				/>
				<label for="isActive" class="text-sm font-medium text-gray-700">Active</label>
			</div>
		</div>

		<div class="flex items-center gap-3 pt-4">
			<button
				type="submit"
				disabled={submitting}
				class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
			>
				{submitting ? 'Saving...' : 'Create Pastor'}
			</button>
			<a href="/admin/pastors" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</a>
		</div>
	</form>
</div>
