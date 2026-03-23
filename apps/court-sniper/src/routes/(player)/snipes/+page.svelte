<script lang="ts">
	import { snipesStore } from '$lib/stores/snipes.svelte';
	import { authStore } from '$lib/stores/auth.svelte';
	import { onMount } from 'svelte';
	import { formatDistanceToNow } from 'date-fns';
	import { formatPeso } from '$lib/utils';

	let isLoading = $state(false);

	onMount(async () => {
		if (authStore.user) {
			isLoading = true;
			await snipesStore.loadSnipes(authStore.user.id);
			isLoading = false;
		}
	});

	async function deleteSnipe(snipeId: string) {
		if (confirm('Are you sure you want to delete this snipe?')) {
			await snipesStore.deleteSnipe(snipeId);
		}
	}

	function statusColor(status: string): string {
		switch (status) {
			case 'active': return 'bg-blue-50 text-blue-700 ring-blue-600/20';
			case 'watching': return 'bg-amber-50 text-amber-700 ring-amber-600/20';
			case 'booked': return 'bg-emerald-50 text-emerald-700 ring-emerald-600/20';
			case 'expired': return 'bg-gray-50 text-gray-600 ring-gray-500/20';
			case 'cancelled': return 'bg-red-50 text-red-700 ring-red-600/20';
			default: return 'bg-gray-50 text-gray-700 ring-gray-600/20';
		}
	}
</script>

<svelte:head>
	<title>My Snipes - Court Sniper</title>
</svelte:head>

<div class="p-6 lg:p-8 max-w-5xl">
	<div class="flex items-center justify-between mb-8">
		<div>
			<h1 class="text-2xl font-bold tracking-tight">My Snipes</h1>
			<p class="mt-1 text-sm text-muted-foreground">Auto-booking rules that watch for matching courts.</p>
		</div>
		<a href="/snipes/new" class="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
			Create Snipe
		</a>
	</div>

	{#if isLoading}
		<div class="flex items-center justify-center py-16">
			<div class="text-sm text-muted-foreground">Loading snipes...</div>
		</div>
	{:else if snipesStore.snipes.length === 0}
		<div class="rounded-xl border border-dashed border-border bg-background p-12 text-center">
			<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="mx-auto text-muted-foreground/50 mb-4"><path d="M13 2 3 14h9l-1 8 10-12h-9l1-8z"/></svg>
			<h3 class="text-sm font-medium mb-1">No snipes yet</h3>
			<p class="text-sm text-muted-foreground mb-4">Create a snipe to automatically book courts when they become available.</p>
			<a href="/snipes/new" class="inline-flex items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
				Create Your First Snipe
			</a>
		</div>
	{:else}
		<div class="space-y-3">
			{#each snipesStore.snipes as snipe (snipe.id)}
				<div class="rounded-xl border border-border bg-background p-5">
					<div class="flex items-start justify-between gap-4 mb-4">
						<div>
							<div class="flex items-center gap-2 mb-1">
								<h3 class="text-sm font-semibold">Snipe #{snipe.id.slice(0, 8)}</h3>
								<span class="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset {statusColor(snipe.status)}">
									{snipe.status}
								</span>
							</div>
							<p class="text-xs text-muted-foreground">
								Expires {formatDistanceToNow(new Date(snipe.expiresAt), { addSuffix: true })}
							</p>
						</div>
						<div class="flex items-center gap-1.5 text-xs">
							{#if snipe.autoPay}
								<span class="inline-flex items-center rounded-md bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
									Auto-pay
								</span>
							{/if}
						</div>
					</div>

					<div class="grid grid-cols-3 gap-4 text-sm">
						<div>
							<p class="text-xs text-muted-foreground mb-0.5">Max Price</p>
							<p class="font-medium">{formatPeso(snipe.criteria.maxPrice)}</p>
						</div>
						<div>
							<p class="text-xs text-muted-foreground mb-0.5">Court Types</p>
							<p class="font-medium">{snipe.criteria.courtTypes?.join(', ') || 'Any'}</p>
						</div>
						<div>
							<p class="text-xs text-muted-foreground mb-0.5">Max Distance</p>
							<p class="font-medium">{snipe.criteria.maxDistance ? `${snipe.criteria.maxDistance} km` : 'Any'}</p>
						</div>
					</div>

					<div class="mt-4 pt-4 border-t border-border flex gap-2">
						<a
							href="/snipes/{snipe.id}"
							class="rounded-lg border border-border px-3 py-1.5 text-xs font-medium hover:bg-muted transition-colors"
						>
							Edit
						</a>
						<button
							onclick={() => deleteSnipe(snipe.id)}
							class="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-1.5 text-xs font-medium text-destructive hover:bg-destructive/10 transition-colors"
						>
							Delete
						</button>
					</div>
				</div>
			{/each}
		</div>
	{/if}
</div>
