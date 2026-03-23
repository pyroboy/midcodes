<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showForm = $state(false);
	let form = $state({
		recipeId: '', businessId: '', pricingMode: 'auto' as any,
		markupMultiplier: '', fixedPrice: '', roundingTarget: '10'
	});

	function resetForm() {
		form = { recipeId: '', businessId: '', pricingMode: 'auto', markupMultiplier: '', fixedPrice: '', roundingTarget: '10' };
		showForm = false;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		await fetch('/api/prices', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({
				...form,
				markupMultiplier: form.markupMultiplier || null,
				fixedPrice: form.fixedPrice ? parseInt(form.fixedPrice) : null,
				roundingTarget: parseInt(form.roundingTarget) || 10
			})
		});
		resetForm();
		invalidateAll();
	}

	function formatPeso(centavos: number) {
		return '₱' + (centavos / 100).toFixed(2);
	}

	function marginColor(margin: string) {
		const m = parseFloat(margin);
		if (m >= 50) return 'text-green-600';
		if (m >= 30) return 'text-amber-600';
		return 'text-red-600';
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-amber-900">Pricing</h2>
		<button onclick={() => { resetForm(); showForm = true; }}
			class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
			+ Set Price
		</button>
	</div>

	{#if showForm}
		<form onsubmit={handleSubmit} class="bg-white rounded-xl shadow p-6 space-y-4">
			<h3 class="font-semibold text-lg">Set Product Price</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Recipe</label>
					<select bind:value={form.recipeId} required class="w-full px-3 py-2 border rounded-lg">
						<option value="">Select recipe...</option>
						{#each data.recipes as r}
							<option value={r.id}>{r.name} (cost: {formatPeso(r.perUnitCostCentavos)}/unit)</option>
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
					<label class="block text-sm font-medium text-gray-700 mb-1">Pricing Mode</label>
					<select bind:value={form.pricingMode} class="w-full px-3 py-2 border rounded-lg">
						<option value="auto">Auto (markup)</option>
						<option value="fixed">Fixed price</option>
						<option value="round_up">Round up</option>
					</select>
				</div>
				{#if form.pricingMode !== 'fixed'}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Markup Multiplier</label>
						<input type="number" bind:value={form.markupMultiplier} step="0.1" min="1" placeholder="e.g. 2.5"
							class="w-full px-3 py-2 border rounded-lg" />
					</div>
				{/if}
				{#if form.pricingMode === 'fixed'}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Fixed Price (centavos)</label>
						<input type="number" bind:value={form.fixedPrice} min="0"
							class="w-full px-3 py-2 border rounded-lg" />
					</div>
				{/if}
				{#if form.pricingMode === 'round_up'}
					<div>
						<label class="block text-sm font-medium text-gray-700 mb-1">Round to nearest</label>
						<select bind:value={form.roundingTarget} class="w-full px-3 py-2 border rounded-lg">
							<option value="5">5</option>
							<option value="10">10</option>
							<option value="50">50</option>
							<option value="100">100</option>
						</select>
					</div>
				{/if}
			</div>
			<div class="flex gap-3">
				<button type="submit" class="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Set Price</button>
				<button type="button" onclick={resetForm} class="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
			</div>
		</form>
	{/if}

	<!-- Price cards grouped by business -->
	{#each data.businesses as business}
		{@const businessPrices = data.prices.filter(p => p.businessId === business.id)}
		{#if businessPrices.length > 0}
			<div class="bg-white rounded-xl shadow p-6">
				<h3 class="font-semibold text-lg text-amber-900 mb-4">{business.name}</h3>
				<div class="overflow-x-auto">
					<table class="w-full text-sm">
						<thead>
							<tr class="text-left text-gray-500 border-b">
								<th class="pb-2">Product</th>
								<th class="pb-2">Cost/unit</th>
								<th class="pb-2">Price</th>
								<th class="pb-2">Mode</th>
								<th class="pb-2">Margin</th>
							</tr>
						</thead>
						<tbody>
							{#each businessPrices as price}
								<tr class="border-b border-gray-100">
									<td class="py-2 font-medium">{price.recipe.name}</td>
									<td class="py-2">{formatPeso(price.computedCost)}</td>
									<td class="py-2 font-semibold">{formatPeso(price.computedPrice)}</td>
									<td class="py-2">
										<span class="px-2 py-1 bg-gray-100 rounded text-xs">{price.pricingMode}</span>
									</td>
									<td class="py-2 font-medium {marginColor(price.marginPercentage || '0')}">
										{parseFloat(price.marginPercentage || '0').toFixed(1)}%
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}
	{/each}

	{#if data.prices.length === 0}
		<div class="bg-white rounded-xl shadow p-8 text-center text-gray-500">
			No prices set yet. Add recipes first, then set prices for each business.
		</div>
	{/if}
</div>
