<script lang="ts">
	import { menuItems, addMenuItem, updateMenuItem, deleteMenuItem, toggleMenuItemAvailability } from '$lib/stores/pos.svelte';
	import type { MenuItem, MenuCategory } from '$lib/types';
	import { formatPeso, cn } from '$lib/utils';
	import { nanoid } from 'nanoid';

	// ─── Category Filter ─────────────────────────────────────────────────────
	let activeFilter = $state<MenuCategory | 'all'>('all');

	const categoryLabels: { id: MenuCategory | 'all'; label: string }[] = [
		{ id: 'all',      label: '📋 All' },
		{ id: 'packages', label: '🎫 Packages' },
		{ id: 'meats',    label: '🥩 Meats' },
		{ id: 'sides',    label: '🥬 Sides' },
		{ id: 'dishes',   label: '🍜 Dishes' },
		{ id: 'drinks',   label: '🥤 Drinks' }
	];

	const filteredItems = $derived(
		activeFilter === 'all' ? menuItems.value : menuItems.value.filter(m => m.category === activeFilter)
	);

	// ─── Add/Edit Modal ──────────────────────────────────────────────────────
	let showModal = $state(false);
	let editingId = $state<string | null>(null);

	let formName = $state('');
	let formCategory = $state<MenuCategory>('dishes');
	let formPrice = $state(0);
	let formDesc = $state('');
	let formPerks = $state('');
	let formImage = $state<File | null>(null);
	let formImageUrl = $state<string | undefined>(undefined);
	let formIsWeightBased = $state(false);
	let formPricePerGram = $state(0);
	let formIsFree = $state(false);
	let formTrackInventory = $state(false);
	let formMeats = $state<string[]>([]);
	let formAutoSides = $state<string[]>([]);

	const meatItems = $derived(menuItems.value.filter(m => m.category === 'meats'));
	const sideItems = $derived(menuItems.value.filter(m => m.category === 'sides'));

	function openAddModal() {
		editingId = null;
		formName = '';
		formCategory = 'dishes';
		formPrice = 0;
		formDesc = '';
		formPerks = '';
		formImage = null;
		formImageUrl = undefined;
		formIsWeightBased = false;
		formPricePerGram = 0;
		formIsFree = false;
		formTrackInventory = false;
		formMeats = [];
		formAutoSides = [];
		showModal = true;
	}

	function openEditModal(item: MenuItem) {
		editingId = item.id;
		formName = item.name;
		formCategory = item.category;
		formPrice = item.price;
		formDesc = item.desc ?? '';
		formPerks = item.perks ?? '';
		formImage = null;
		formImageUrl = item.image;
		formIsWeightBased = item.isWeightBased;
		formPricePerGram = item.pricePerGram ?? 0;
		formIsFree = item.isFree ?? false;
		formTrackInventory = item.trackInventory ?? false;
		formMeats = item.meats ? [...item.meats] : [];
		formAutoSides = item.autoSides ? [...item.autoSides] : [];
		showModal = true;
	}

	async function saveItem() {
		if (!formName.trim()) return;

		const data: Omit<MenuItem, 'id'> = {
			name: formName.trim(),
			category: formCategory,
			price: formPrice,
			isWeightBased: formIsWeightBased,
			available: true,
			...(formDesc && { desc: formDesc }),
			...(formPerks && { perks: formPerks }),
			...(formImageUrl && { image: formImageUrl }),
			...(formIsWeightBased && { pricePerGram: formPricePerGram }),
			...(formIsFree && { isFree: true }),
			...(formTrackInventory && { trackInventory: true }),
			...(formCategory === 'packages' && formMeats.length > 0 && { meats: formMeats }),
			...(formCategory === 'packages' && formAutoSides.length > 0 && { autoSides: formAutoSides }),
		};

		if (editingId) {
			await updateMenuItem(editingId, data);
		} else {
			await addMenuItem(data);
		}
		showModal = false;
	}

	// ─── Delete Confirmation ─────────────────────────────────────────────────
	let deleteTarget = $state<MenuItem | null>(null);

	async function confirmDelete() {
		if (deleteTarget) {
			await deleteMenuItem(deleteTarget.id);
			deleteTarget = null;
		}
	}

	function toggleMeat(id: string) {
		if (formMeats.includes(id)) formMeats = formMeats.filter(m => m !== id);
		else formMeats = [...formMeats, id];
	}

	function toggleSide(id: string) {
		if (formAutoSides.includes(id)) formAutoSides = formAutoSides.filter(s => s !== id);
		else formAutoSides = [...formAutoSides, id];
	}
</script>

<!-- Category Filter Tabs -->
<div class="flex items-center justify-between mb-6">
	<div class="flex gap-1.5">
		{#each categoryLabels as cat}
			<button
				onclick={() => activeFilter = cat.id}
				class={cn(
					'px-4 py-2 text-sm font-semibold rounded-lg transition-all active:scale-95',
					activeFilter === cat.id
						? 'bg-accent text-white shadow-md'
						: 'border border-border bg-surface text-gray-600 hover:bg-gray-50'
				)}
				style="min-height: 40px"
			>
				{cat.label}
			</button>
		{/each}
	</div>
	<button onclick={openAddModal} class="btn-primary gap-2">
		+ Add Item
	</button>
</div>

<!-- Items Table -->
<div class="pos-card p-0 overflow-hidden">
	<table class="w-full text-sm">
		<thead>
			<tr class="border-b border-border bg-surface-secondary text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
				<th class="px-5 py-3">Name</th>
				<th class="px-5 py-3">Category</th>
				<th class="px-5 py-3">Price</th>
				<th class="px-5 py-3">Type</th>
				<th class="px-5 py-3 text-center">Available</th>
				<th class="px-5 py-3 text-right">Actions</th>
			</tr>
		</thead>
		<tbody class="divide-y divide-border">
			{#each filteredItems as item (item.id)}
				<tr class={cn('hover:bg-gray-50 transition-colors', !item.available && 'opacity-50 bg-gray-50')}>
					<td class="px-5 py-3">
						<div class="flex items-center gap-3">
							{#if item.image}
								<div class="w-10 h-10 rounded overflow-hidden bg-gray-100 shrink-0 border border-border">
									<img src={item.image} alt={item.name} class="w-full h-full object-cover" />
								</div>
							{:else}
								<div class="w-10 h-10 rounded bg-gray-50 shrink-0 border border-border flex items-center justify-center text-gray-300 text-xs">
									No Img
								</div>
							{/if}
							<div class="flex flex-col gap-0.5">
								<span class="font-semibold text-gray-900">{item.name}</span>
								{#if item.desc}<span class="text-xs text-gray-400">{item.desc}</span>{/if}
							</div>
						</div>
					</td>
					<td class="px-5 py-3">
						<span class={cn(
							'rounded-full px-2.5 py-1 text-[10px] font-bold uppercase',
							item.category === 'packages' ? 'bg-accent-light text-accent' :
							item.category === 'meats' ? 'bg-red-50 text-red-600' :
							item.category === 'sides' ? 'bg-green-50 text-green-600' :
							item.category === 'dishes' ? 'bg-cyan-50 text-cyan-600' :
							'bg-purple-50 text-purple-600'
						)}>
							{item.category}
						</span>
					</td>
					<td class="px-5 py-3 font-mono font-semibold text-gray-900">
						{#if item.isWeightBased}
							₱{((item.pricePerGram ?? 0) * 100).toFixed(0)}/100g
						{:else if item.isFree}
							<span class="text-status-green font-bold">FREE</span>
						{:else}
							{formatPeso(item.price)}
						{/if}
						
						{#if item.trackInventory}
							<div class="mt-1 text-[10px] text-gray-400 font-medium">📦 TRACKED</div>
						{/if}
					</td>
					<td class="px-5 py-3">
						{#if item.isWeightBased}
							<span class="rounded bg-yellow-50 px-2 py-0.5 text-[10px] font-bold text-yellow-700">WEIGHT</span>
						{:else if item.category === 'packages'}
							<span class="rounded bg-accent-light px-2 py-0.5 text-[10px] font-bold text-accent">PKG</span>
						{:else}
							<span class="rounded bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">FLAT</span>
						{/if}
					</td>
					<td class="px-5 py-3 text-center">
						<button
							onclick={() => toggleMenuItemAvailability(item.id)}
							aria-label="Toggle availability"
							class={cn(
								'relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer',
								item.available ? 'bg-status-green' : 'bg-gray-300'
							)}
							style="min-height: unset"
						>
							<span class={cn(
								'inline-block h-4 w-4 rounded-full bg-white transition-transform shadow-sm',
								item.available ? 'translate-x-6' : 'translate-x-1'
							)}></span>
						</button>
					</td>
					<td class="px-5 py-3 text-right">
						<div class="flex items-center justify-end gap-2">
							<button
								onclick={() => openEditModal(item)}
								class="text-xs font-semibold text-accent hover:underline"
								style="min-height: unset"
							>
								Edit
							</button>
							<button
								onclick={() => deleteTarget = item}
								class="text-xs font-semibold text-status-red hover:underline"
								style="min-height: unset"
							>
								Delete
							</button>
						</div>
					</td>
				</tr>
			{/each}
			{#if filteredItems.length === 0}
				<tr>
					<td colspan="6" class="px-5 py-12 text-center text-sm text-gray-400">
						No menu items in this category
					</td>
				</tr>
			{/if}
		</tbody>
	</table>
</div>

<!-- Summary -->
<div class="mt-4 flex items-center gap-4 text-xs text-gray-500">
	<span>{menuItems.value.length} total items</span>
	<span>·</span>
	<span>{menuItems.value.filter(m => m.available).length} active</span>
	<span>·</span>
	<span>{menuItems.value.filter(m => !m.available).length} 86'd</span>
</div>

<!-- ─── Add/Edit Modal ──────────────────────────────────────────────────────── -->
{#if showModal}
	<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[520px] max-h-[85vh] overflow-y-auto flex flex-col gap-5">
			<div class="flex items-center justify-between">
				<h3 class="text-lg font-bold text-gray-900">{editingId ? 'Edit' : 'Add'} Menu Item</h3>
				<button onclick={() => showModal = false} class="text-gray-400 hover:text-gray-600" style="min-height: unset">✕</button>
			</div>

			<div class="flex flex-col gap-4">
				<!-- Name -->
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Name</span>
					<input type="text" bind:value={formName} class="pos-input" placeholder="e.g. Samgyupsal, Soju, etc." />
				</label>

				<!-- Category -->
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Category</span>
					<select bind:value={formCategory} class="pos-input">
						<option value="meats">Meats</option>
						<option value="sides">Sides</option>
						<option value="drinks">Drinks</option>
						<option value="packages">Packages</option>
						<option value="misc">Miscellaneous</option>
					</select>
				</label>

				<!-- Image Upload -->
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Item Picture</span>
					{#if formImageUrl}
						<div class="mb-2 relative w-32 h-32 rounded-lg overflow-hidden border border-border">
							<img src={formImageUrl} alt="Preview" class="w-full h-full object-cover bg-gray-50" />
							<button 
								onclick={(e) => { e.preventDefault(); formImageUrl = undefined; formImage = null; }}
								class="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs hover:bg-black/70"
								title="Remove image"
							>
								✕
							</button>
						</div>
					{/if}
					<input 
						type="file" 
						accept="image/*" 
						onchange={(e) => {
							const target = e.currentTarget;
							const file = target?.files?.[0];
							if (file) {
								formImage = file;
								formImageUrl = URL.createObjectURL(file);
							}
						}}
						class="pos-input file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200" 
					/>
				</label>

				<!-- Price row -->
				<div class="grid grid-cols-2 gap-4">
					<label class="flex flex-col gap-1.5">
						<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">
							{formIsWeightBased ? 'Base Price (₱)' : 'Price (₱)'}
						</span>
						<input type="number" bind:value={formPrice} class="pos-input font-mono" min="0" step="1" />
					</label>

					{#if formIsWeightBased}
						<label class="flex flex-col gap-1.5">
							<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Price Per Gram (₱)</span>
							<input type="number" bind:value={formPricePerGram} class="pos-input font-mono" min="0" step="0.01" />
						</label>
					{/if}
				</div>

				<!-- Toggles -->
				<div class="flex items-center gap-6 flex-wrap">
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={formIsWeightBased} class="h-4 w-4 rounded accent-accent" />
						<span class="text-sm text-gray-700">Weight-based</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={formIsFree} class="h-4 w-4 rounded accent-accent" />
						<span class="text-sm text-gray-700">Free item</span>
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input type="checkbox" bind:checked={formTrackInventory} class="h-4 w-4 rounded accent-accent" />
						<span class="text-sm text-gray-700 font-bold">Track Inventory</span>
					</label>
				</div>

				<!-- Description -->
				<label class="flex flex-col gap-1.5">
					<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Description (optional)</span>
					<input type="text" bind:value={formDesc} class="pos-input" placeholder="Short description" />
				</label>

				<!-- Package-specific fields -->
				{#if formCategory === 'packages'}
					<div class="border-t border-border pt-4 flex flex-col gap-4">
						<span class="text-xs font-bold text-accent uppercase tracking-wider">Package Configuration</span>

						<!-- Perks -->
						<label class="flex flex-col gap-1.5">
							<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Perks Text</span>
							<input type="text" bind:value={formPerks} class="pos-input" placeholder="e.g. 4 sides, 200g initial meats" />
						</label>

						<!-- Included Meats -->
						<div class="flex flex-col gap-1.5">
							<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Included Meats</span>
							<div class="flex flex-wrap gap-2">
								{#each meatItems as meat}
									<button
										onclick={() => toggleMeat(meat.id)}
										class={cn(
											'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
											formMeats.includes(meat.id)
												? 'bg-red-500 text-white'
												: 'border border-border bg-surface text-gray-600 hover:bg-gray-50'
										)}
										style="min-height: 32px"
									>
										{meat.name}
									</button>
								{/each}
							</div>
						</div>

						<!-- Auto Sides -->
						<div class="flex flex-col gap-1.5">
							<span class="text-xs font-semibold text-gray-600 uppercase tracking-wider">Auto-included Sides</span>
							<div class="flex flex-wrap gap-2">
								{#each sideItems as side}
									<button
										onclick={() => toggleSide(side.id)}
										class={cn(
											'rounded-lg px-3 py-1.5 text-xs font-semibold transition-all',
											formAutoSides.includes(side.id)
												? 'bg-status-green text-white'
												: 'border border-border bg-surface text-gray-600 hover:bg-gray-50'
										)}
										style="min-height: 32px"
									>
										{side.name}
									</button>
								{/each}
							</div>
						</div>
					</div>
				{/if}
			</div>

			<div class="flex gap-2 mt-2">
				<button class="btn-ghost flex-1" onclick={() => showModal = false}>Cancel</button>
				<button class="btn-primary flex-1" onclick={saveItem} disabled={!formName.trim()}>
					{editingId ? '✓ Save Changes' : '+ Create Item'}
				</button>
			</div>
		</div>
	</div>
{/if}

<!-- ─── Delete Confirmation ────────────────────────────────────────────────── -->
{#if deleteTarget}
	<div class="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-sm">
		<div class="pos-card w-[360px] flex flex-col gap-4">
			<h3 class="text-lg font-bold text-status-red">Delete Menu Item</h3>
			<p class="text-sm text-gray-600">
				Are you sure you want to delete <strong>{deleteTarget.name}</strong>? This action cannot be undone.
			</p>
			<div class="flex gap-2">
				<button class="btn-ghost flex-1" onclick={() => deleteTarget = null}>Cancel</button>
				<button class="btn-danger flex-1" onclick={confirmDelete}>Delete</button>
			</div>
		</div>
	</div>
{/if}
