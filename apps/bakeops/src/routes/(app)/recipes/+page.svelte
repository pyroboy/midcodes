<script lang="ts">
	import { invalidateAll } from '$app/navigation';

	let { data } = $props();

	let showForm = $state(false);
	let showIngredientForm = $state<string | null>(null);
	let form = $state({
		name: '', description: '', category: 'cookies' as any, yieldAmount: 12, yieldUnit: 'pcs',
		prepTime: '', bakeTime: ''
	});
	let ingredientForm = $state({ ingredientId: '', amount: 0, notes: '' });

	const categories = ['cookies', 'cakes', 'pastries', 'bread', 'drinks', 'other'];

	function resetForm() {
		form = { name: '', description: '', category: 'cookies', yieldAmount: 12, yieldUnit: 'pcs', prepTime: '', bakeTime: '' };
		showForm = false;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		await fetch('/api/recipes', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(form)
		});
		resetForm();
		invalidateAll();
	}

	async function addIngredientToRecipe(recipeId: string) {
		await fetch(`/api/recipes/${recipeId}/ingredients`, {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(ingredientForm)
		});
		ingredientForm = { ingredientId: '', amount: 0, notes: '' };
		showIngredientForm = null;
		invalidateAll();
	}

	async function removeIngredient(recipeId: string, riId: string) {
		await fetch(`/api/recipes/${recipeId}/ingredients`, {
			method: 'DELETE',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ recipeIngredientId: riId })
		});
		invalidateAll();
	}

	async function deleteRecipe(id: string) {
		if (!confirm('Delete this recipe?')) return;
		await fetch(`/api/recipes/${id}`, { method: 'DELETE' });
		invalidateAll();
	}

	function formatPeso(centavos: number) {
		return '₱' + (centavos / 100).toFixed(2);
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<h2 class="text-2xl font-bold text-amber-900">Recipes</h2>
		<button onclick={() => { resetForm(); showForm = true; }}
			class="px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition">
			+ New Recipe
		</button>
	</div>

	{#if showForm}
		<form onsubmit={handleSubmit} class="bg-white rounded-xl shadow p-6 space-y-4">
			<h3 class="font-semibold text-lg">New Recipe</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Name</label>
					<input type="text" bind:value={form.name} required
						class="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Category</label>
					<select bind:value={form.category} class="w-full px-3 py-2 border rounded-lg">
						{#each categories as cat}
							<option value={cat}>{cat}</option>
						{/each}
					</select>
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Yield Amount</label>
					<input type="number" bind:value={form.yieldAmount} min="1" required
						class="w-full px-3 py-2 border rounded-lg" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Yield Unit</label>
					<input type="text" bind:value={form.yieldUnit}
						class="w-full px-3 py-2 border rounded-lg" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Prep Time</label>
					<input type="text" bind:value={form.prepTime} placeholder="e.g. 30 mins"
						class="w-full px-3 py-2 border rounded-lg" />
				</div>
				<div>
					<label class="block text-sm font-medium text-gray-700 mb-1">Bake Time</label>
					<input type="text" bind:value={form.bakeTime} placeholder="e.g. 15 mins"
						class="w-full px-3 py-2 border rounded-lg" />
				</div>
			</div>
			<div>
				<label class="block text-sm font-medium text-gray-700 mb-1">Description</label>
				<textarea bind:value={form.description} rows="2"
					class="w-full px-3 py-2 border rounded-lg"></textarea>
			</div>
			<div class="flex gap-3">
				<button type="submit" class="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700">Create</button>
				<button type="button" onclick={resetForm} class="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
			</div>
		</form>
	{/if}

	<!-- Recipe cards -->
	<div class="space-y-4">
		{#each data.recipes as recipe}
			<div class="bg-white rounded-xl shadow p-6">
				<div class="flex items-start justify-between mb-4">
					<div>
						<h3 class="text-lg font-semibold text-amber-900">{recipe.name}</h3>
						<p class="text-sm text-gray-500">{recipe.category} · {recipe.yieldAmount} {recipe.yieldUnit}</p>
						{#if recipe.description}
							<p class="text-sm text-gray-600 mt-1">{recipe.description}</p>
						{/if}
					</div>
					<div class="text-right">
						<p class="text-lg font-bold text-amber-900">{formatPeso(recipe.totalCostCentavos)}</p>
						<p class="text-xs text-gray-500">{formatPeso(recipe.perUnitCostCentavos)} / unit</p>
						<button onclick={() => deleteRecipe(recipe.id)} class="text-red-600 text-xs hover:underline mt-1">Delete</button>
					</div>
				</div>

				<!-- Ingredients list -->
				{#if recipe.recipeIngredients.length > 0}
					<div class="border-t pt-3 mt-3">
						<p class="text-sm font-medium text-gray-700 mb-2">Ingredients:</p>
						<div class="space-y-1">
							{#each recipe.recipeIngredients as ri}
								<div class="flex items-center justify-between text-sm bg-amber-50 rounded px-3 py-1">
									<span>{ri.ingredient.name} — {ri.amount} {ri.ingredient.defaultUnit}</span>
									<button onclick={() => removeIngredient(recipe.id, ri.id)} class="text-red-500 text-xs hover:underline">Remove</button>
								</div>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Add ingredient -->
				{#if showIngredientForm === recipe.id}
					<div class="border-t pt-3 mt-3 flex gap-3 items-end">
						<div class="flex-1">
							<label class="block text-xs text-gray-600 mb-1">Ingredient</label>
							<select bind:value={ingredientForm.ingredientId} class="w-full px-2 py-1 border rounded text-sm">
								<option value="">Select...</option>
								{#each data.ingredients as ing}
									<option value={ing.id}>{ing.name} ({ing.defaultUnit})</option>
								{/each}
							</select>
						</div>
						<div class="w-24">
							<label class="block text-xs text-gray-600 mb-1">Amount</label>
							<input type="number" bind:value={ingredientForm.amount} min="1" class="w-full px-2 py-1 border rounded text-sm" />
						</div>
						<button onclick={() => addIngredientToRecipe(recipe.id)}
							class="px-3 py-1 bg-amber-600 text-white rounded text-sm hover:bg-amber-700">Add</button>
						<button onclick={() => showIngredientForm = null}
							class="px-3 py-1 bg-gray-200 rounded text-sm">Cancel</button>
					</div>
				{:else}
					<button onclick={() => { showIngredientForm = recipe.id; ingredientForm = { ingredientId: '', amount: 0, notes: '' }; }}
						class="mt-3 text-sm text-amber-600 hover:underline">+ Add ingredient</button>
				{/if}
			</div>
		{/each}
		{#if data.recipes.length === 0}
			<div class="bg-white rounded-xl shadow p-8 text-center text-gray-500">
				No recipes yet. Create your first recipe above.
			</div>
		{/if}
	</div>
</div>
