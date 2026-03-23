<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showForm = $state(false);
	let editId = $state<string | null>(null);
	let form = $state({
		name: '', category: 'dairy' as any, defaultUnit: 'g' as any,
		packageSize: 0, currentAvgCost: 0, reorderThreshold: 0, currentStock: 0, supplier: ''
	});

	const categories = ['dairy', 'dry', 'sugar', 'chocolate', 'produce', 'misc'];
	const units = ['g', 'ml', 'pcs'];

	function resetForm() {
		form = { name: '', category: 'dairy', defaultUnit: 'g', packageSize: 0, currentAvgCost: 0, reorderThreshold: 0, currentStock: 0, supplier: '' };
		editId = null;
		showForm = false;
	}

	function editItem(item: any) {
		form = { ...item, supplier: item.supplier || '' };
		editId = item.id;
		showForm = true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const url = editId ? `/api/ingredients/${editId}` : '/api/ingredients';
		const method = editId ? 'PUT' : 'POST';

		await fetch(url, {
			method,
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form)
		});

		resetForm();
		invalidateAll();
	}

	async function deleteItem(id: string) {
		if (!confirm('Delete this ingredient?')) return;
		await fetch(`/api/ingredients/${id}`, { method: 'DELETE' });
		invalidateAll();
	}

	function formatPeso(centavos: number) {
		return '₱' + (centavos / 100).toFixed(2);
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-amber-900">Ingredients</h2>
		<button onclick={() => { resetForm(); showForm = true; }}
			class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
			+ Add Ingredient
		</button>
	</div>

	{#if showForm}
		<form onsubmit={handleSubmit} class="bg-white rounded-xl shadow p-6 space-y-4">
			<h3 class="font-semibold text-lg">{editId ? 'Edit' : 'Add'} Ingredient</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
					<input type="text" bind:value={form.name} required
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
					<select bind:value={form.category} class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500">
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Unit</label>
					<select bind:value={form.defaultUnit} class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500">
						{#each units as u}
							<option value={u}>{u}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Package Size ({form.defaultUnit})</label>
					<input type="number" bind:value={form.packageSize} min="1" required
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Avg Cost (centavos/pkg)</label>
					<input type="number" bind:value={form.currentAvgCost} min="0"
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Current Stock ({form.defaultUnit})</label>
					<input type="number" bind:value={form.currentStock} min="0"
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Reorder Threshold</label>
					<input type="number" bind:value={form.reorderThreshold} min="0"
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
					<input type="text" bind:value={form.supplier}
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
				</div>
			</div>
			<div class="flex gap-3">
				<button type="submit" class="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">
					{editId ? 'Update' : 'Add'}
				</button>
				<button type="button" onclick={resetForm} class="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
			</div>
		</form>
	{/if}

	<div class="bg-white rounded-xl shadow overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-amber-50">
					<tr class="text-left">
						<th class="px-4 py-3">Name</th>
						<th class="px-4 py-3">Category</th>
						<th class="px-4 py-3">Stock</th>
						<th class="px-4 py-3">Pkg Size</th>
						<th class="px-4 py-3">Avg Cost</th>
						<th class="px-4 py-3">Supplier</th>
						<th class="px-4 py-3">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.ingredients as item}
						<tr class="border-t border-gray-100 hover:bg-amber-50/50">
							<td class="px-4 py-3 font-medium">{item.name}</td>
							<td class="px-4 py-3">
								<span class="px-2 py-1 bg-amber-100 text-amber-800 rounded-full text-xs">{item.category}</span>
							</td>
							<td class="px-4 py-3 {item.currentStock <= item.reorderThreshold ? 'text-red-600 font-semibold' : ''}">
								{item.currentStock} {item.defaultUnit}
							</td>
							<td class="px-4 py-3">{item.packageSize} {item.defaultUnit}</td>
							<td class="px-4 py-3">{formatPeso(item.currentAvgCost)}/pkg</td>
							<td class="px-4 py-3 text-gray-500">{item.supplier || '-'}</td>
							<td class="px-4 py-3">
								<button onclick={() => editItem(item)} class="text-amber-600 hover:underline mr-2">Edit</button>
								<button onclick={() => deleteItem(item.id)} class="text-red-600 hover:underline">Delete</button>
							</td>
						</tr>
					{/each}
					{#if data.ingredients.length === 0}
						<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No ingredients yet. Add your first one above.</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
