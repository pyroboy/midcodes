<script lang="ts">
	import { snipesStore } from '$lib/stores/snipes.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { goto } from '$app/navigation';

	let maxPrice = $state('');
	let maxDistance = $state('');
	let courtTypes = $state<string[]>([]);
	let daysOfWeek = $state<number[]>([]);
	let autoPay = $state(false);
	let isLoading = $state(false);
	let error = $state('');

	const courtTypeOptions = ['glass', 'concrete', 'acrylic', 'clay'];
	const daysOptions = [
		{ value: 0, label: 'Sun' },
		{ value: 1, label: 'Mon' },
		{ value: 2, label: 'Tue' },
		{ value: 3, label: 'Wed' },
		{ value: 4, label: 'Thu' },
		{ value: 5, label: 'Fri' },
		{ value: 6, label: 'Sat' }
	];

	async function handleCreateSnipe(e: SubmitEvent) {
		e.preventDefault();
		if (!authStore.user) return;

		isLoading = true;
		error = '';

		try {
			const expiresAt = new Date();
			expiresAt.setDate(expiresAt.getDate() + 7);

			await snipesStore.createSnipe({
				playerId: authStore.user.id,
				criteria: {
					maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
					maxDistance: maxDistance ? parseFloat(maxDistance) : undefined,
					courtTypes: courtTypes.length > 0 ? courtTypes as any : undefined,
					daysOfWeek: daysOfWeek.length > 0 ? daysOfWeek : undefined
				},
				status: 'active',
				autoPay,
				expiresAt
			});

			await goto('/snipes');
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to create snipe';
		} finally {
			isLoading = false;
		}
	}

	function toggleCourtType(type: string) {
		courtTypes = courtTypes.includes(type)
			? courtTypes.filter((t) => t !== type)
			: [...courtTypes, type];
	}

	function toggleDay(day: number) {
		daysOfWeek = daysOfWeek.includes(day)
			? daysOfWeek.filter((d) => d !== day)
			: [...daysOfWeek, day];
	}
</script>

<svelte:head>
	<title>Create Snipe - Court Sniper</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-2xl">
	<div class="mb-8">
		<a href="/snipes" class="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
			<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
			Back to Snipes
		</a>
		<h1 class="text-2xl font-bold tracking-tight">Create a New Snipe</h1>
		<p class="mt-1 text-sm text-muted-foreground">
			Set criteria for automatically booking courts when they become available.
		</p>
	</div>

	{#if error}
		<div class="mb-6 rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
			{error}
		</div>
	{/if}

	<form onsubmit={handleCreateSnipe} class="space-y-6">
		<div class="rounded-xl border border-border bg-background p-6 space-y-5">
			<h2 class="text-sm font-semibold">Criteria</h2>

			<div class="grid grid-cols-2 gap-4">
				<div>
					<label for="maxPrice" class="block text-sm font-medium mb-1.5">Max Price (PHP)</label>
					<input
						id="maxPrice"
						type="number"
						bind:value={maxPrice}
						step="50"
						min="0"
						class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						placeholder="e.g., 500"
					/>
				</div>
				<div>
					<label for="maxDistance" class="block text-sm font-medium mb-1.5">Max Distance (km)</label>
					<input
						id="maxDistance"
						type="number"
						bind:value={maxDistance}
						step="0.5"
						min="0"
						class="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
						placeholder="e.g., 5"
					/>
				</div>
			</div>

			<div>
				<label class="block text-sm font-medium mb-2">Court Types</label>
				<div class="flex flex-wrap gap-2">
					{#each courtTypeOptions as type}
						<button
							type="button"
							onclick={() => toggleCourtType(type)}
							class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors capitalize {courtTypes.includes(type) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted text-muted-foreground'}"
						>
							{type}
						</button>
					{/each}
				</div>
			</div>

			<div>
				<label class="block text-sm font-medium mb-2">Preferred Days</label>
				<div class="flex flex-wrap gap-2">
					{#each daysOptions as day}
						<button
							type="button"
							onclick={() => toggleDay(day.value)}
							class="rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors {daysOfWeek.includes(day.value) ? 'border-primary bg-primary/10 text-primary' : 'border-border hover:bg-muted text-muted-foreground'}"
						>
							{day.label}
						</button>
					{/each}
				</div>
			</div>
		</div>

		<div class="rounded-xl border border-border bg-background p-6">
			<h2 class="text-sm font-semibold mb-4">Payment</h2>
			<label class="flex items-center gap-3 cursor-pointer">
				<input
					type="checkbox"
					bind:checked={autoPay}
					class="h-4 w-4 rounded border-border text-primary focus:ring-primary"
				/>
				<div>
					<p class="text-sm font-medium">Auto-pay when court is available</p>
					<p class="text-xs text-muted-foreground">Bookings matching your criteria will be auto-purchased.</p>
				</div>
			</label>
		</div>

		<div class="flex gap-3">
			<button
				type="submit"
				disabled={isLoading}
				class="flex-1 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50 transition-colors"
			>
				{isLoading ? 'Creating...' : 'Create Snipe'}
			</button>
			<a
				href="/snipes"
				class="flex-1 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-center hover:bg-muted transition-colors"
			>
				Cancel
			</a>
		</div>
	</form>
</div>
