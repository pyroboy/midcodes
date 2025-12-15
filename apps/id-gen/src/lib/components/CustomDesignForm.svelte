<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Input } from '$lib/components/ui/input';
	import { Label } from '$lib/components/ui/label';
	import { Textarea } from '$lib/components/ui/textarea';
	import { Upload, X, Loader2, Send, Image } from '@lucide/svelte';
	import { cn } from '$lib/utils';

	interface Props {
		sizeName: string;
		widthPixels: number;
		heightPixels: number;
		onSubmit?: (data: { instructions: string; files: File[] }) => Promise<void>;
		onCancel?: () => void;
		maxFiles?: number;
	}

	let {
		sizeName,
		widthPixels,
		heightPixels,
		onSubmit,
		onCancel,
		maxFiles = 5
	}: Props = $props();

	// Form state
	let instructions = $state('');
	let files = $state<File[]>([]);
	let filePreviews = $state<string[]>([]);
	let isSubmitting = $state(false);
	let error = $state<string | null>(null);
	let dragActive = $state(false);

	// File input ref
	let fileInputRef: HTMLInputElement | null = null;

	function handleFileSelect(e: Event) {
		const target = e.target as HTMLInputElement;
		const selectedFiles = target.files;
		if (selectedFiles) {
			addFiles(Array.from(selectedFiles));
		}
	}

	function addFiles(newFiles: File[]) {
		const validFiles = newFiles.filter((file) => file.type.startsWith('image/'));
		const remainingSlots = maxFiles - files.length;
		const filesToAdd = validFiles.slice(0, remainingSlots);

		// Create preview URLs
		const newPreviews = filesToAdd.map((file) => URL.createObjectURL(file));

		files = [...files, ...filesToAdd];
		filePreviews = [...filePreviews, ...newPreviews];

		if (validFiles.length > filesToAdd.length) {
			error = `Maximum ${maxFiles} files allowed`;
		} else {
			error = null;
		}
	}

	function removeFile(index: number) {
		// Revoke the preview URL
		URL.revokeObjectURL(filePreviews[index]);

		files = files.filter((_, i) => i !== index);
		filePreviews = filePreviews.filter((_, i) => i !== index);
		error = null;
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		dragActive = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		dragActive = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		dragActive = false;

		const droppedFiles = e.dataTransfer?.files;
		if (droppedFiles) {
			addFiles(Array.from(droppedFiles));
		}
	}

	async function handleSubmit() {
		if (!instructions.trim()) {
			error = 'Please provide design instructions';
			return;
		}

		if (instructions.trim().length < 10) {
			error = 'Please provide at least 10 characters of instructions';
			return;
		}

		isSubmitting = true;
		error = null;

		try {
			await onSubmit?.({ instructions: instructions.trim(), files });
		} catch (e) {
			error = e instanceof Error ? e.message : 'Failed to submit request';
		} finally {
			isSubmitting = false;
		}
	}

	// Cleanup previews on destroy
	$effect(() => {
		return () => {
			filePreviews.forEach((url) => URL.revokeObjectURL(url));
		};
	});
</script>

<div class="custom-design-form">
	<!-- Size summary -->
	<div class="size-summary">
		<div class="size-badge">
			<span class="size-name">{sizeName}</span>
			<span class="size-dimensions">{widthPixels} × {heightPixels}px</span>
		</div>
	</div>

	<!-- Instructions -->
	<div class="form-group">
		<Label for="instructions">Design Instructions *</Label>
		<Textarea
			id="instructions"
			bind:value={instructions}
			placeholder="Describe your ideal ID card design. Include details about layout, colors, elements, logo placement, etc."
			rows={4}
			class="bg-background"
			disabled={isSubmitting}
		/>
		<p class="hint">Minimum 10 characters. Be as specific as possible for best results.</p>
	</div>

	<!-- File upload -->
	<div class="form-group">
		<Label>Reference Images (Optional)</Label>
		<div
			class={cn(
				'drop-zone',
				dragActive && 'drag-active',
				files.length >= maxFiles && 'disabled'
			)}
			role="button"
			tabindex="0"
			ondragover={handleDragOver}
			ondragleave={handleDragLeave}
			ondrop={handleDrop}
			onclick={() => files.length < maxFiles && fileInputRef?.click()}
			onkeydown={(e) => e.key === 'Enter' && files.length < maxFiles && fileInputRef?.click()}
		>
			<input
				bind:this={fileInputRef}
				type="file"
				accept="image/*"
				multiple
				class="hidden"
				onchange={handleFileSelect}
				disabled={files.length >= maxFiles}
			/>

			{#if files.length >= maxFiles}
				<span class="drop-text disabled">Maximum {maxFiles} files reached</span>
			{:else}
				<Upload class="h-6 w-6 text-muted-foreground" />
				<span class="drop-text">
					Drag & drop or click to upload
				</span>
				<span class="drop-hint">
					{files.length}/{maxFiles} files • PNG, JPG up to 5MB
				</span>
			{/if}
		</div>

		<!-- File previews -->
		{#if filePreviews.length > 0}
			<div class="file-previews">
				{#each filePreviews as preview, i (preview)}
					<div class="preview-item">
						<img src={preview} alt="Reference {i + 1}" />
						<button
							type="button"
							class="remove-btn"
							onclick={() => removeFile(i)}
							disabled={isSubmitting}
						>
							<X class="h-3 w-3" />
						</button>
					</div>
				{/each}
			</div>
		{/if}
	</div>

	<!-- Error message -->
	{#if error}
		<div class="error-message">
			{error}
		</div>
	{/if}

	<!-- Actions -->
	<div class="form-actions">
		<Button variant="outline" onclick={onCancel} disabled={isSubmitting}>
			Cancel
		</Button>
		<Button onclick={handleSubmit} disabled={isSubmitting || !instructions.trim()}>
			{#if isSubmitting}
				<Loader2 class="h-4 w-4 mr-2 animate-spin" />
				Submitting...
			{:else}
				<Send class="h-4 w-4 mr-2" />
				Submit Request
			{/if}
		</Button>
	</div>

	<p class="submit-note">
		Your request will be reviewed by our design team. You'll be notified when your template is ready.
	</p>
</div>

<style>
	.custom-design-form {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.size-summary {
		display: flex;
		justify-content: center;
	}

	.size-badge {
		display: flex;
		flex-direction: column;
		align-items: center;
		padding: 0.75rem 1.5rem;
		background: hsl(var(--primary) / 0.1);
		border: 1px solid hsl(var(--primary) / 0.2);
		border-radius: 0.5rem;
		gap: 0.25rem;
	}

	.size-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: hsl(var(--primary));
	}

	.size-dimensions {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		font-family: monospace;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.hint {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
	}

	.drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		padding: 1.5rem;
		border: 2px dashed hsl(var(--border));
		border-radius: 0.75rem;
		cursor: pointer;
		transition: all 0.2s ease;
	}

	.drop-zone:hover:not(.disabled) {
		border-color: hsl(var(--primary) / 0.5);
		background: hsl(var(--primary) / 0.02);
	}

	.drop-zone.drag-active {
		border-color: hsl(var(--primary));
		background: hsl(var(--primary) / 0.05);
	}

	.drop-zone.disabled {
		cursor: not-allowed;
		opacity: 0.6;
	}

	.drop-text {
		font-size: 0.875rem;
		color: hsl(var(--muted-foreground));
	}

	.drop-text.disabled {
		color: hsl(var(--muted-foreground) / 0.6);
	}

	.drop-hint {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground) / 0.7);
	}

	.file-previews {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-top: 0.5rem;
	}

	.preview-item {
		position: relative;
		width: 64px;
		height: 64px;
		border-radius: 0.5rem;
		overflow: hidden;
		border: 1px solid hsl(var(--border));
	}

	.preview-item img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.remove-btn {
		position: absolute;
		top: 2px;
		right: 2px;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 18px;
		height: 18px;
		background: hsl(var(--destructive));
		color: hsl(var(--destructive-foreground));
		border: none;
		border-radius: 50%;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.2s;
	}

	.preview-item:hover .remove-btn {
		opacity: 1;
	}

	.remove-btn:disabled {
		cursor: not-allowed;
		opacity: 0.5;
	}

	.error-message {
		padding: 0.75rem;
		background: hsl(var(--destructive) / 0.1);
		border: 1px solid hsl(var(--destructive) / 0.2);
		border-radius: 0.5rem;
		font-size: 0.875rem;
		color: hsl(var(--destructive));
	}

	.form-actions {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		margin-top: 0.5rem;
	}

	.submit-note {
		font-size: 0.75rem;
		color: hsl(var(--muted-foreground));
		text-align: center;
		margin-top: 0.5rem;
	}
</style>
