<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showForm = $state(false);
	let form = $state({ recipeId: '', businessId: '', multiplier: '1', scheduledFor: '' });

	function resetForm() {
		form = { recipeId: '', businessId: '', multiplier: '1', scheduledFor: '' };
		showForm = false;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		const recipe = data.recipes.find(r => r.id === form.recipeId);
		if (!recipe) return;

		await fetch('/api/batches', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...form,
				plannedYield: recipe.yieldAmount
			})
		});
		resetForm();
		invalidateAll();
	}

	async function updateStatus(id: string, status: string, actualYield?: number) {
		const body: any = { status };
		if (status === 'completed') {
			const yield_ = prompt('Actual yield?');
			if (yield_ !== null) body.actualYield = parseInt(yield_);
		}
		await fetch(`/api/batches/${id}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		invalidateAll();
	}

	function formatPeso(centavos: number) {
		return '₱' + (centavos / 100).toFixed(2);
	}

	function statusActions(status: string) {
		if (status === 'planned') return [{ label: 'Start', next: 'in_progress' }];
		if (status === 'in_progress') return [{ label: 'Complete', next: 'completed' }, { label: 'Cancel', next: 'cancelled' }];
		return [];
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-amber-900">Batches</h2>
		<button onclick={() => { resetForm(); showForm = true; }}
			class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
			+ New Batch
		</button>
	</div>

	{#if showForm}
		<form onsubmit={handleSubmit} class="bg-white rounded-xl shadow p-6 space-y-4">
			<h3 class="font-semibold text-lg">Plan a Batch</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Recipe</label>
					<select bind:value={form.recipeId} required class="w-full px-3 py-2 border rounded-lg">
						<option value="">Select recipe...</option>
						{#each data.recipes as r}
							<option value={r.id}>{r.name} ({r.yieldAmount} {r.yieldUnit})</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Business</label>
					<select bind:value={form.businessId} required class="w-full px-3 py-2 border rounded-lg">
						<option value="">Select business...</option>
						{#each data.businesses as b}
							<option value={b.id}>{b.name}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Multiplier</label>
					<input type="number" bind:value={form.multiplier} min="0.5" step="0.5" required
						class="w-full px-3 py-2 border rounded-lg" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Scheduled For</label>
					<input type="date" bind:value={form.scheduledFor}
						class="w-full px-3 py-2 border rounded-lg" />
				</div>
			</div>
			<div class="flex gap-3">
				<button type="submit" class="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Create Batch</button>
				<button type="button" onclick={resetForm} class="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
			</div>
		</form>
	{/if}

	<div class="bg-white rounded-xl shadow overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead class="bg-amber-50">
					<tr class="text-left">
						<th class="px-4 py-3">Recipe</th>
						<th class="px-4 py-3">Business</th>
						<th class="px-4 py-3">Multiplier</th>
						<th class="px-4 py-3">Yield</th>
						<th class="px-4 py-3">Cost</th>
						<th class="px-4 py-3">Status</th>
						<th class="px-4 py-3">Actions</th>
					</tr>
				</thead>
				<tbody>
					{#each data.batches as batch}
						<tr class="border-t border-gray-100">
							<td class="px-4 py-3 font-medium">{batch.recipe.name}</td>
							<td class="px-4 py-3">{batch.business.name}</td>
							<td class="px-4 py-3">{batch.multiplier}x</td>
							<td class="px-4 py-3">
								{#if batch.actualYield != null}
									{batch.actualYield} / {batch.plannedYield}
								{:else}
									{batch.plannedYield} planned
								{/if}
							</td>
							<td class="px-4 py-3">{formatPeso(batch.totalCostCentavos)}</td>
							<td class="px-4 py-3">
								<span class="px-2 py-1 rounded-full text-xs font-medium
									{batch.status === 'completed' ? 'bg-green-100 text-green-700' :
									 batch.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
									 batch.status === 'cancelled' ? 'bg-red-100 text-red-700' :
									 'bg-amber-100 text-amber-700'}">
									{batch.status.replace('_', ' ')}
								</span>
							</td>
							<td class="px-4 py-3 space-x-2">
								{#each statusActions(batch.status) as action}
									<button onclick={() => updateStatus(batch.id, action.next)}
										class="text-amber-600 hover:underline text-xs">{action.label}</button>
								{/each}
							</td>
						</tr>
					{/each}
					{#if data.batches.length === 0}
						<tr><td colspan="7" class="px-4 py-8 text-center text-gray-500">No batches yet.</td></tr>
					{/if}
				</tbody>
			</table>
		</div>
	</div>
</div>
