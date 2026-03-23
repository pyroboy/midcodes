<script lang="ts">
	let { data } = $props();

	function formatPeso(centavos: number) {
		return '₱' + (centavos / 100).toFixed(2);
	}
</script>

<div class="space-y-6">
	<h2 class="text-2xl font-bold text-amber-900">Dashboard</h2>

	<!-- Stats cards -->
	<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
		<div class="bg-white rounded-xl shadow p-6">
			<p class="text-sm text-gray-500">Ingredients</p>
			<p class="text-3xl font-bold text-amber-900">{data.stats.ingredients}</p>
		</div>
		<div class="bg-white rounded-xl shadow p-6">
			<p class="text-sm text-gray-500">Recipes</p>
			<p class="text-3xl font-bold text-amber-900">{data.stats.recipes}</p>
		</div>
		<div class="bg-white rounded-xl shadow p-6">
			<p class="text-sm text-gray-500">Low Stock Items</p>
			<p class="text-3xl font-bold {data.lowStock.length > 0 ? 'text-red-600' : 'text-green-600'}">{data.lowStock.length}</p>
		</div>
		<div class="bg-white rounded-xl shadow p-6">
			<p class="text-sm text-gray-500">Businesses</p>
			<p class="text-3xl font-bold text-amber-900">{data.businesses.length}</p>
		</div>
	</div>

	<!-- Low stock alerts -->
	{#if data.lowStock.length > 0}
		<div class="bg-red-50 border border-red-200 rounded-xl p-6">
			<h3 class="font-semibold text-red-800 mb-3">Low Stock Alerts</h3>
			<div class="space-y-2">
				{#each data.lowStock as item}
					<div class="flex justify-between items-center bg-white rounded-lg px-4 py-2">
						<span class="font-medium">{item.name}</span>
						<span class="text-red-600 text-sm">{item.currentStock} {item.defaultUnit} / {item.reorderThreshold} {item.defaultUnit} threshold</span>
					</div>
				{/each}
			</div>
		</div>
	{/if}

	<!-- Recent batches -->
	<div class="bg-white rounded-xl shadow p-6">
		<h3 class="font-semibold text-amber-900 mb-4">Recent Batches</h3>
		{#if data.recentBatches.length === 0}
			<p class="text-gray-500">No batches yet. Start by creating a recipe and scheduling a batch.</p>
		{:else}
			<div class="overflow-x-auto">
				<table class="w-full text-sm">
					<thead>
						<tr class="text-left text-gray-500 border-b">
							<th class="pb-2">Recipe</th>
							<th class="pb-2">Business</th>
							<th class="pb-2">Status</th>
							<th class="pb-2">Yield</th>
							<th class="pb-2">Cost</th>
						</tr>
					</thead>
					<tbody>
						{#each data.recentBatches as batch}
							<tr class="border-b border-gray-100">
								<td class="py-2 font-medium">{batch.recipe.name}</td>
								<td class="py-2">{batch.business.name}</td>
								<td class="py-2">
									<span class="px-2 py-1 rounded-full text-xs font-medium
										{batch.status === 'completed' ? 'bg-green-100 text-green-700' :
										 batch.status === 'in_progress' ? 'bg-blue-100 text-blue-700' :
										 batch.status === 'cancelled' ? 'bg-red-100 text-red-700' :
										 'bg-amber-100 text-amber-700'}">
										{batch.status.replace('_', ' ')}
									</span>
								</td>
								<td class="py-2">{batch.actualYield ?? batch.plannedYield} pcs</td>
								<td class="py-2">{formatPeso(batch.totalCostCentavos)}</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		{/if}
	</div>
</div>
