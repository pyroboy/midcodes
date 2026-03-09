<script lang="ts">
	import { formatPeso } from '$lib/utils';
	import { openShift } from '$lib/stores/pos/shifts.svelte';
	import { session } from '$lib/stores/session.svelte';

	interface Props {
		onSkip?: () => void;
	}

	let { onSkip }: Props = $props();

	let openingFloat = $state(0);
	let loading = $state(false);
	let error = $state('');

	const presets = [1000, 2000, 3000, 5000];

	async function handleStart() {
		if (openingFloat < 0) {
			error = 'Opening float cannot be negative.';
			return;
		}
		loading = true;
		error = '';
		try {
			await openShift(openingFloat);
		} catch (e) {
			error = 'Failed to open shift. Please try again.';
			loading = false;
		}
	}
</script>

<!-- Blocking overlay — no dismiss, must enter a float to proceed -->
<div class="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-sm">
	<div class="pos-card w-[400px] flex flex-col gap-5 p-8">
		<!-- Header -->
		<div class="flex flex-col items-center gap-2 text-center">
			<span class="text-4xl">🏦</span>
			<h2 class="text-xl font-bold text-gray-900">Start Your Shift</h2>
			<p class="text-sm text-gray-500">
				Declare your opening cash float before accessing the POS.
				<br />
				<span class="text-xs text-gray-400">Logged as <strong>{session.userName}</strong></span>
			</p>
		</div>

		<!-- Quick Preset Buttons -->
		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Quick Select</span>
			<div class="grid grid-cols-4 gap-2">
				{#each presets as amount}
					<button
						onclick={() => openingFloat = amount}
						class="rounded-lg border py-2 text-sm font-semibold transition-all active:scale-95 {openingFloat === amount ? 'bg-accent text-white border-accent' : 'border-border bg-surface text-gray-700 hover:bg-gray-50'}"
						style="min-height: 40px"
					>
						₱{amount.toLocaleString()}
					</button>
				{/each}
			</div>
		</div>

		<!-- Custom Amount Input -->
		<div class="flex flex-col gap-1.5">
			<span class="text-xs font-semibold uppercase tracking-wider text-gray-400">Opening Cash Float (₱)</span>
			<input
				type="number"
				bind:value={openingFloat}
				min="0"
				step="100"
				class="pos-input text-center font-mono text-2xl font-bold"
				placeholder="0"
			/>
			{#if openingFloat > 0}
				<p class="text-center text-sm font-semibold text-status-green">{formatPeso(openingFloat)} declared</p>
			{/if}
		</div>

		{#if error}
			<p class="text-center text-sm font-medium text-status-red">{error}</p>
		{/if}

		<!-- Submit -->
		<button
			onclick={handleStart}
			disabled={loading}
			class="btn-primary w-full text-base disabled:opacity-40"
			style="min-height: 52px"
		>
			{#if loading}
				<span class="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2"></span>
				Opening Shift...
			{:else}
				Start Shift →
			{/if}
		</button>

		<p class="text-center text-xs text-gray-400">You can enter ₱0 if no opening float is provided.</p>
	<p class="text-center text-sm text-gray-500 mt-2">Existing open orders are safe — they will remain open.</p>

	{#if onSkip}
		<!-- P2-12: Neutral skip label — not role-specific -->
		<button
			onclick={onSkip}
			class="text-center text-xs text-gray-400 hover:text-gray-600 transition-colors underline-offset-2 hover:underline"
			style="min-height: 44px"
		>
			Skip — I'll add float later
		</button>
	{/if}
	</div>
</div>
