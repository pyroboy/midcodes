<script lang="ts">
	import type { SizePreset } from '$lib/schemas/template-assets.schema';
	import {
		assetUploadStore,
		canProceedToNext,
		stepProgress,
		stepLabels
	} from '$lib/stores/assetUploadStore';
	import Step1SizeSelection from './steps/Step1SizeSelection.svelte';
	import Step2ImageUpload from './steps/Step2ImageUpload.svelte';
	import Step3CardDetection from './steps/Step3CardDetection.svelte';
	import { cn } from '$lib/utils';

	interface Props {
		sizePresets: SizePreset[];
		onComplete?: () => void;
		onCancel?: () => void;
	}

	let { sizePresets, onComplete, onCancel }: Props = $props();

	const steps = ['size', 'upload', 'detection'] as const;

	function nextStep() {
		const currentIndex = steps.indexOf($assetUploadStore.currentStep);
		if (currentIndex < steps.length - 1) {
			assetUploadStore.goToStep(steps[currentIndex + 1]);
		} else if (onComplete) {
			onComplete();
		}
	}

	function prevStep() {
		const currentIndex = steps.indexOf($assetUploadStore.currentStep);
		if (currentIndex > 0) {
			assetUploadStore.goToStep(steps[currentIndex - 1]);
		}
	}

	function handleCancel() {
		assetUploadStore.reset();
		onCancel?.();
	}
</script>

<div class="space-y-6">
	<!-- Progress steps -->
	<div class="relative">
		<div class="absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-muted"></div>
		<div
			class="absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-primary transition-all duration-300"
			style="width: {$stepProgress.percentage}%;"
		></div>

		<ol class="relative z-10 flex justify-between">
			{#each steps as step, index}
				{@const isCurrent = $assetUploadStore.currentStep === step}
				{@const isCompleted = index < steps.indexOf($assetUploadStore.currentStep)}
				{@const stepNumber = index + 1}

				<li class="flex flex-col items-center">
					<button
						type="button"
						onclick={() => isCompleted && assetUploadStore.goToStep(step)}
						disabled={!isCompleted}
						class={cn(
							'flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all',
							isCurrent && 'border-primary bg-primary text-primary-foreground',
							isCompleted && 'border-primary bg-primary text-primary-foreground cursor-pointer hover:bg-primary/90',
							!isCurrent && !isCompleted && 'border-muted bg-background text-muted-foreground'
						)}
					>
						{#if isCompleted}
							<svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M5 13l4 4L19 7" />
							</svg>
						{:else}
							{stepNumber}
						{/if}
					</button>
					<span
						class={cn(
							'mt-2 text-xs font-medium',
							isCurrent ? 'text-foreground' : 'text-muted-foreground'
						)}
					>
						{stepLabels[step]}
					</span>
				</li>
			{/each}
		</ol>
	</div>

	<!-- Error display -->
	{#if $assetUploadStore.error}
		<div class="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
			<svg class="mt-0.5 h-5 w-5 flex-shrink-0 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
				<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
			<div class="flex-1">
				<p class="text-sm font-medium text-destructive">Error</p>
				<p class="mt-1 text-sm text-destructive/80">{$assetUploadStore.error}</p>
			</div>
			<button
				type="button"
				onclick={() => assetUploadStore.setError(null)}
				aria-label="Dismiss error"
				class="text-destructive/60 hover:text-destructive"
			>
				<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
					<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
				</svg>
			</button>
		</div>
	{/if}

	<!-- Step content -->
	<div class="min-h-[400px]">
		{#if $assetUploadStore.currentStep === 'size'}
			<Step1SizeSelection {sizePresets} />
		{:else if $assetUploadStore.currentStep === 'upload'}
			<Step2ImageUpload />
		{:else if $assetUploadStore.currentStep === 'detection'}
			<Step3CardDetection />
		{/if}
	</div>

	<!-- Navigation buttons -->
	<div class="flex items-center justify-between border-t border-border pt-6">
		<button
			type="button"
			onclick={handleCancel}
			class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
		>
			Cancel
		</button>

		<div class="flex items-center gap-3">
			{#if $assetUploadStore.currentStep !== 'size'}
				<button
					type="button"
					onclick={prevStep}
					class="inline-flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
				>
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
					</svg>
					Previous
				</button>
			{/if}

			<button
				type="button"
				onclick={nextStep}
				disabled={!$canProceedToNext || $assetUploadStore.isProcessing}
				class="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
			>
				{#if $assetUploadStore.currentStep === 'detection'}
					{#if $assetUploadStore.isProcessing}
						<svg class="h-4 w-4 animate-spin" fill="none" viewBox="0 0 24 24">
							<circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" />
							<path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
						</svg>
						Processing...
					{:else}
						Complete
						<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
							<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
						</svg>
					{/if}
				{:else}
					Next
					<svg class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
					</svg>
				{/if}
			</button>
		</div>
	</div>
</div>
