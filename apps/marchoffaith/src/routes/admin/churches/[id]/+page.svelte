<script lang="ts">
	import type { PageData, ActionData } from './$types';
	import { slugify } from '$lib/utils';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let submitting = $state(false);
	let imageUrlValue = $state(data.church.imageUrl ?? '');

	let services = $state<{ day: string; time: string; type: string }[]>(
		(data.church.services as { day: string; time: string; type: string }[]) ?? []
	);

	let nameValue = $state(data.church.name);
	let slugValue = $state(data.church.slug);
	let slugManuallyEdited = $state(true);

	function handleNameInput(e: Event) {
		const target = e.target as HTMLInputElement;
		nameValue = target.value;
		if (!slugManuallyEdited) {
			slugValue = slugify(nameValue);
		}
	}

	function handleSlugInput(e: Event) {
		const target = e.target as HTMLInputElement;
		slugValue = target.value;
		slugManuallyEdited = true;
	}

	function addService() {
		services.push({ day: '', time: '', type: '' });
	}

	function removeService(index: number) {
		services.splice(index, 1);
	}
</script>

<svelte:head>
	<title>Edit {data.church.name} - MOFI Admin</title>
</svelte:head>

<div class="flex items-center justify-between mb-6">
	<div>
		<a href="/admin/churches" class="text-sm text-gray-500 hover:text-gray-700 transition-colors">&larr; Back to Churches</a>
		<h1 class="text-2xl font-bold text-gray-900 mt-1">Edit Church</h1>
	</div>
</div>

{#if form?.error}
	<div class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">{form.error}</div>
{/if}

<form method="POST" class="space-y-0" onsubmit={() => { submitting = true; }}>
	<input type="hidden" name="services" value={JSON.stringify(services)} />

	<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
		<div class="space-y-5">
			<!-- Basic Info -->
			<h2 class="text-lg font-semibold text-gray-900 mb-4">Basic Info</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label for="name" class="block text-sm font-medium text-gray-700">Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						value={nameValue}
						oninput={handleNameInput}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="slug" class="block text-sm font-medium text-gray-700">Slug</label>
					<input
						id="slug"
						name="slug"
						type="text"
						value={slugValue}
						oninput={handleSlugInput}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm font-mono"
					/>
					<p class="text-xs text-gray-400">Edit slug manually or clear to auto-generate from name.</p>
				</div>
			</div>

			<!-- Location -->
			<h2 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pt-6 border-t border-gray-100">Location</h2>

			<div class="space-y-1.5">
				<label for="street" class="block text-sm font-medium text-gray-700">Street</label>
				<input
					id="street"
					name="street"
					type="text"
					required
					value={data.church.street}
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label for="city" class="block text-sm font-medium text-gray-700">City</label>
					<input
						id="city"
						name="city"
						type="text"
						required
						value={data.church.city}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="province" class="block text-sm font-medium text-gray-700">Province</label>
					<input
						id="province"
						name="province"
						type="text"
						required
						value={data.church.province}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
			</div>

			<!-- Contact -->
			<h2 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pt-6 border-t border-gray-100">Contact</h2>

			<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
				<div class="space-y-1.5">
					<label for="phone" class="block text-sm font-medium text-gray-700">Phone</label>
					<input
						id="phone"
						name="phone"
						type="text"
						value={data.church.phone ?? ''}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="email" class="block text-sm font-medium text-gray-700">Email</label>
					<input
						id="email"
						name="email"
						type="email"
						value={data.church.email ?? ''}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
			</div>

			<!-- Social -->
			<h2 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pt-6 border-t border-gray-100">Social</h2>

			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="space-y-1.5">
					<label for="facebookHandle" class="block text-sm font-medium text-gray-700">Facebook</label>
					<input
						id="facebookHandle"
						name="facebookHandle"
						type="text"
						placeholder="@handle"
						value={data.church.facebookHandle ?? ''}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="instagramHandle" class="block text-sm font-medium text-gray-700">Instagram</label>
					<input
						id="instagramHandle"
						name="instagramHandle"
						type="text"
						placeholder="@handle"
						value={data.church.instagramHandle ?? ''}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="youtubeHandle" class="block text-sm font-medium text-gray-700">YouTube</label>
					<input
						id="youtubeHandle"
						name="youtubeHandle"
						type="text"
						placeholder="@handle"
						value={data.church.youtubeHandle ?? ''}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
			</div>

			<!-- Details -->
			<h2 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pt-6 border-t border-gray-100">Details</h2>

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
			<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
				<div class="space-y-1.5">
					<label for="totalMembers" class="block text-sm font-medium text-gray-700">Total Members</label>
					<input
						id="totalMembers"
						name="totalMembers"
						type="number"
						value={data.church.totalMembers ?? ''}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="yearFounded" class="block text-sm font-medium text-gray-700">Year Founded</label>
					<input
						id="yearFounded"
						name="yearFounded"
						type="number"
						value={data.church.yearFounded ?? ''}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
				<div class="space-y-1.5">
					<label for="sortOrder" class="block text-sm font-medium text-gray-700">Sort Order</label>
					<input
						id="sortOrder"
						name="sortOrder"
						type="number"
						value={data.church.sortOrder}
						class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
					/>
				</div>
			</div>

			<div class="flex items-center gap-2 mt-2">
				<input id="isActive" name="isActive" type="checkbox" checked={data.church.isActive} class="rounded border-gray-300 text-red-600 focus:ring-red-500" />
				<label for="isActive" class="text-sm font-medium text-gray-700">Active</label>
			</div>

			<!-- Services -->
			<h2 class="text-lg font-semibold text-gray-900 mt-6 mb-4 pt-6 border-t border-gray-100">Services</h2>

			{#each services as service, i}
				<div class="flex items-end gap-3 mb-3">
					<div class="flex-1 space-y-1.5">
						<label class="block text-sm font-medium text-gray-700">Day</label>
						<input
							type="text"
							placeholder="e.g. Sunday"
							bind:value={service.day}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
						/>
					</div>
					<div class="flex-1 space-y-1.5">
						<label class="block text-sm font-medium text-gray-700">Time</label>
						<input
							type="text"
							placeholder="e.g. 9:00 AM"
							bind:value={service.time}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
						/>
					</div>
					<div class="flex-1 space-y-1.5">
						<label class="block text-sm font-medium text-gray-700">Type</label>
						<input
							type="text"
							placeholder="e.g. Worship Service"
							bind:value={service.type}
							class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
						/>
					</div>
					<button
						type="button"
						onclick={() => removeService(i)}
						class="px-3 py-2 text-sm text-red-600 hover:text-red-800"
					>
						Remove
					</button>
				</div>
			{/each}

			<button
				type="button"
				onclick={addService}
				class="text-sm text-gray-600 hover:text-gray-900 font-medium"
			>
				+ Add Service
			</button>
		</div>
	</div>

	<div class="flex items-center gap-3 pt-4 mt-6">
		<button
			type="submit"
			disabled={submitting}
			class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors disabled:opacity-50"
		>
			{submitting ? 'Saving...' : 'Update Church'}
		</button>
		<a href="/admin/churches" class="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900">Cancel</a>
	</div>
</form>

<!-- Assigned Pastors Section -->
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mt-8">
	<h2 class="text-lg font-semibold text-gray-900 mb-4">Assigned Pastors</h2>

	{#if data.assignments.length === 0}
		<p class="text-sm text-gray-400 mb-4">No pastors assigned yet.</p>
	{:else}
		<div class="divide-y divide-gray-100 mb-6">
			{#each data.assignments as assignment}
				<div class="flex items-center justify-between py-3">
					<div>
						<div class="text-sm font-medium text-gray-900">{assignment.pastorName}</div>
						<div class="text-xs text-gray-500">
							{assignment.role}
							{#if assignment.since} &middot; Since {assignment.since}{/if}
							{#if assignment.isPrimary}
								<span class="ml-1 px-1.5 py-0.5 text-xs font-medium rounded bg-blue-100 text-blue-700">Primary</span>
							{/if}
						</div>
					</div>
					<form method="POST" action="?/removePastor" onsubmit={(e) => { if (!confirm('Remove this pastor assignment?')) e.preventDefault(); }}>
						<input type="hidden" name="assignmentId" value={assignment.id} />
						<button type="submit" class="text-sm text-red-600 hover:text-red-800">Remove</button>
					</form>
				</div>
			{/each}
		</div>
	{/if}

	<!-- Assign New Pastor -->
	<form method="POST" action="?/assignPastor" class="border-t border-gray-100 pt-4">
		<h3 class="text-sm font-semibold text-gray-700 mb-3">Assign New Pastor</h3>
		<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
			<div class="space-y-1.5">
				<label for="assignPastorId" class="block text-sm font-medium text-gray-700">Pastor</label>
				<select
					id="assignPastorId"
					name="pastorId"
					required
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				>
					<option value="">Select a pastor...</option>
					{#each data.pastors as pastor}
						<option value={pastor.id}>{pastor.name} — {pastor.title}</option>
					{/each}
				</select>
			</div>
			<div class="space-y-1.5">
				<label for="assignRole" class="block text-sm font-medium text-gray-700">Role</label>
				<input
					id="assignRole"
					name="role"
					type="text"
					value="Resident Pastor"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
			<div class="space-y-1.5">
				<label for="assignSince" class="block text-sm font-medium text-gray-700">Since</label>
				<input
					id="assignSince"
					name="since"
					type="text"
					placeholder="e.g. 2020"
					class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm"
				/>
			</div>
			<div class="flex items-end">
				<div class="flex items-center gap-2 pb-2">
					<input id="assignIsPrimary" name="isPrimary" type="checkbox" class="rounded border-gray-300 text-red-600 focus:ring-red-500" />
					<label for="assignIsPrimary" class="text-sm font-medium text-gray-700">Primary Pastor</label>
				</div>
			</div>
		</div>
		<div class="mt-4">
			<button
				type="submit"
				class="px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-800 transition-colors"
			>
				Assign Pastor
			</button>
		</div>
	</form>
</div>
