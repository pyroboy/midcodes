<script lang="ts">
	import { onMount } from 'svelte';
	import { X, Upload, Trash2, Loader2, ImageIcon } from '@lucide/svelte';
	import { listOrgGraphics, uploadOrgGraphic, deleteOrgGraphic } from '$lib/remote/graphic.remote';
	import type { OrgGraphic } from '$lib/remote/graphic.remote';

	let {
		open = $bindable(false),
		onSelect,
		onClose
	} = $props<{
		open: boolean;
		onSelect: (url: string) => void;
		onClose: () => void;
	}>();

	let graphics = $state<OrgGraphic[]>([]);
	let loading = $state(true);
	let uploading = $state(false);
	let error = $state<string | null>(null);
	let selectedUrl = $state<string | null>(null);

	// Load graphics when modal opens
	$effect(() => {
		if (open) {
			loadGraphics();
		}
	});

	async function loadGraphics() {
		loading = true;
		error = null;
		try {
			graphics = await listOrgGraphics();
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to load graphics';
			console.error('[OrgAssetPickerModal] Load error:', err);
		} finally {
			loading = false;
		}
	}

	async function handleFileUpload(event: Event) {
		const input = event.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		// Validate
		const allowedTypes = ['image/png', 'image/webp', 'image/svg+xml'];
		if (!allowedTypes.includes(file.type)) {
			error = 'Only PNG, WebP, and SVG files are allowed';
			return;
		}

		if (file.size > 5 * 1024 * 1024) {
			error = 'File size must be under 5MB';
			return;
		}

		uploading = true;
		error = null;

		try {
			// Convert file to base64
			const base64 = await fileToBase64(file);

			const result = await uploadOrgGraphic({
				filename: file.name,
				contentType: file.type as 'image/png' | 'image/webp' | 'image/svg+xml',
				base64Data: base64
			});

			if (result.success && result.url) {
				// Reload the list to show new graphic
				await loadGraphics();
				// Auto-select the newly uploaded graphic
				selectedUrl = result.url;
			} else {
				error = result.error || 'Upload failed';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Upload failed';
			console.error('[OrgAssetPickerModal] Upload error:', err);
		} finally {
			uploading = false;
			input.value = '';
		}
	}

	async function handleDelete(url: string) {
		if (!confirm('Delete this graphic? This cannot be undone.')) return;

		try {
			const result = await deleteOrgGraphic({ url });
			if (result.success) {
				graphics = graphics.filter((g) => g.url !== url);
				if (selectedUrl === url) {
					selectedUrl = null;
				}
			} else {
				error = result.error || 'Delete failed';
			}
		} catch (err) {
			error = err instanceof Error ? err.message : 'Delete failed';
		}
	}

	function handleSelect() {
		if (selectedUrl) {
			onSelect(selectedUrl);
			open = false;
		}
	}

	function handleClose() {
		open = false;
		onClose();
	}

	function fileToBase64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result as string;
				// Remove the data:...;base64, prefix
				const base64 = result.split(',')[1];
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	function formatSize(bytes: number): string {
		if (bytes < 1024) return `${bytes} B`;
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

{#if open}
	<div class="modal-overlay" role="dialog" aria-modal="true" aria-labelledby="modal-title">
		<div class="modal-container">
			<!-- Header -->
			<div class="modal-header">
				<h2 id="modal-title">Organization Graphics Library</h2>
				<button class="close-btn" onclick={handleClose} aria-label="Close">
					<X size={20} />
				</button>
			</div>

			<!-- Error message -->
			{#if error}
				<div class="error-banner">
					{error}
					<button onclick={() => (error = null)}>×</button>
				</div>
			{/if}

			<!-- Upload section -->
			<div class="upload-section">
				<input
					type="file"
					id="graphic-upload"
					accept="image/png,image/webp,image/svg+xml"
					class="hidden"
					onchange={handleFileUpload}
					disabled={uploading}
				/>
				<button
					class="upload-btn"
					onclick={() => document.getElementById('graphic-upload')?.click()}
					disabled={uploading}
				>
					{#if uploading}
						<Loader2 size={16} class="animate-spin" />
						Uploading...
					{:else}
						<Upload size={16} />
						Upload New Graphic
					{/if}
				</button>
				<span class="upload-hint">PNG, WebP, or SVG (max 5MB)</span>
			</div>

			<!-- Content -->
			<div class="modal-content">
				{#if loading}
					<div class="loading-state">
						<Loader2 size={32} class="animate-spin" />
						<p>Loading graphics...</p>
					</div>
				{:else if graphics.length === 0}
					<div class="empty-state">
						<ImageIcon size={48} />
						<p>No graphics uploaded yet</p>
						<p class="text-sm">Upload PNG, WebP, or SVG files to build your library</p>
					</div>
				{:else}
					<div class="graphics-grid">
						{#each graphics as graphic}
							<div
								class="graphic-item"
								class:selected={selectedUrl === graphic.url}
								role="button"
								tabindex="0"
								onclick={() => (selectedUrl = graphic.url)}
								ondblclick={handleSelect}
								onkeydown={(e) => e.key === 'Enter' && (selectedUrl = graphic.url)}
							>
								<div class="graphic-preview">
									<img src={graphic.url} alt={graphic.name} loading="lazy" />
								</div>
								<div class="graphic-info">
									<span class="graphic-name" title={graphic.name}>{graphic.name}</span>
									<span class="graphic-size">{formatSize(graphic.size)}</span>
								</div>
								<button
									class="delete-btn"
									onclick={(e) => { e.stopPropagation(); handleDelete(graphic.url); }}
									title="Delete"
								>
									<Trash2 size={14} />
								</button>
							</div>
						{/each}
					</div>
				{/if}
			</div>

			<!-- Footer -->
			<div class="modal-footer">
				<button class="cancel-btn" onclick={handleClose}>Cancel</button>
				<button class="select-btn" onclick={handleSelect} disabled={!selectedUrl}>
					Select Graphic
				</button>
			</div>
		</div>
	</div>
{/if}

<style>
	.modal-overlay {
		position: fixed;
		inset: 0;
		background-color: rgba(0, 0, 0, 0.6);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 1rem;
	}

	.modal-container {
		background-color: var(--color-card);
		border-radius: 0.75rem;
		width: 100%;
		max-width: 700px;
		max-height: 85vh;
		display: flex;
		flex-direction: column;
		box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
	}

	.modal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-border);
	}

	.modal-header h2 {
		margin: 0;
		font-size: 1.125rem;
		font-weight: 600;
	}

	.close-btn {
		background: none;
		border: none;
		color: var(--color-muted-foreground);
		cursor: pointer;
		padding: 0.25rem;
		border-radius: 0.25rem;
	}

	.close-btn:hover {
		color: var(--color-foreground);
		background-color: var(--color-muted);
	}

	.error-banner {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.75rem 1.25rem;
		background-color: rgba(239, 68, 68, 0.1);
		color: #ef4444;
		font-size: 0.875rem;
	}

	.error-banner button {
		background: none;
		border: none;
		color: inherit;
		cursor: pointer;
		font-size: 1.25rem;
	}

	.upload-section {
		display: flex;
		align-items: center;
		gap: 1rem;
		padding: 1rem 1.25rem;
		border-bottom: 1px solid var(--color-border);
	}

	.upload-btn {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		padding: 0.5rem 1rem;
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
		transition: opacity 0.15s;
	}

	.upload-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.upload-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.upload-hint {
		font-size: 0.75rem;
		color: var(--color-muted-foreground);
	}

	.modal-content {
		flex: 1;
		overflow-y: auto;
		padding: 1rem;
		min-height: 300px;
	}

	.loading-state,
	.empty-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		height: 100%;
		min-height: 250px;
		color: var(--color-muted-foreground);
		gap: 0.75rem;
	}

	.graphics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
		gap: 0.75rem;
	}

	.graphic-item {
		position: relative;
		display: flex;
		flex-direction: column;
		background-color: var(--color-muted);
		border: 2px solid transparent;
		border-radius: 0.5rem;
		overflow: hidden;
		cursor: pointer;
		transition: all 0.15s;
		text-align: left;
	}

	.graphic-item:hover {
		border-color: var(--color-border);
	}

	.graphic-item.selected {
		border-color: var(--color-primary);
		box-shadow: 0 0 0 2px rgba(139, 92, 246, 0.2);
	}

	.graphic-preview {
		aspect-ratio: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background-color: var(--color-background);
		padding: 0.5rem;
	}

	.graphic-preview img {
		max-width: 100%;
		max-height: 100%;
		object-fit: contain;
	}

	.graphic-info {
		padding: 0.5rem;
		display: flex;
		flex-direction: column;
		gap: 0.125rem;
	}

	.graphic-name {
		font-size: 0.75rem;
		font-weight: 500;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		color: var(--color-foreground);
	}

	.graphic-size {
		font-size: 0.625rem;
		color: var(--color-muted-foreground);
	}

	.delete-btn {
		position: absolute;
		top: 0.25rem;
		right: 0.25rem;
		padding: 0.25rem;
		background-color: rgba(0, 0, 0, 0.6);
		color: white;
		border: none;
		border-radius: 0.25rem;
		cursor: pointer;
		opacity: 0;
		transition: opacity 0.15s;
	}

	.graphic-item:hover .delete-btn {
		opacity: 1;
	}

	.delete-btn:hover {
		background-color: #ef4444;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 0.75rem;
		padding: 1rem 1.25rem;
		border-top: 1px solid var(--color-border);
	}

	.cancel-btn {
		padding: 0.5rem 1rem;
		background-color: var(--color-secondary);
		color: var(--color-foreground);
		border: 1px solid var(--color-border);
		border-radius: 0.375rem;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.cancel-btn:hover {
		background-color: var(--color-muted);
	}

	.select-btn {
		padding: 0.5rem 1rem;
		background-color: var(--color-primary);
		color: var(--color-primary-foreground);
		border: none;
		border-radius: 0.375rem;
		font-size: 0.875rem;
		font-weight: 500;
		cursor: pointer;
	}

	.select-btn:hover:not(:disabled) {
		opacity: 0.9;
	}

	.select-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.hidden {
		display: none;
	}

	/* Animation for spinner */
	:global(.animate-spin) {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from {
			transform: rotate(0deg);
		}
		to {
			transform: rotate(360deg);
		}
	}
</style>
