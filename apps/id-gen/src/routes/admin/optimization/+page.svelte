<script lang="ts">
	import { enhance } from '$app/forms';
	import { createLowResVersion } from '$lib/utils/imageCropper';
	import { getSupabaseStorageUrl } from '$lib/utils/supabase';
	import { toast } from 'svelte-sonner';

	let { data } = $props();

	// State
	let processing = $state(false);
	let progress = $state(0);
	let currentItem = $state('');
	let logs: string[] = $state([]);
	let processedCount = $state(0);
	let errorsCount = $state(0);

	// Derived
	let itemsToOptimize = $derived(data.itemsToOptimize || []);
	let totalToProcess = $derived(itemsToOptimize.length);

	function addLog(msg: string, type: 'info' | 'success' | 'error' = 'info') {
		const timestamp = new Date().toLocaleTimeString();
		logs = [`[${timestamp}] ${msg}`, ...logs];
	}

	async function downloadImage(url: string, bucket: string): Promise<File> {
		// Handle both full URLs and storage paths
		const fullUrl = url.startsWith('http') ? url : getSupabaseStorageUrl(url, bucket);
		
		// Add cache buster to ensure we get the file
		const fetchUrl = `${fullUrl}?t=${Date.now()}`;
		
		const response = await fetch(fetchUrl);
		if (!response.ok) throw new Error(`Failed to fetch image: ${response.statusText}`);
		
		const blob = await response.blob();
		// Use a generic name, we'll rename in createLowResVersion or upload
		return new File([blob], 'source_image.jpg', { type: blob.type });
	}

	async function uploadResizedImage(file: File, path: string, bucket: string): Promise<string> {
		// Upload via server action (uses authenticated server-side Supabase client)
		const formData = new FormData();
		formData.append('file', file);
		formData.append('path', path);
		formData.append('bucket', bucket);
		
		const response = await fetch('?/uploadThumbnail', {
			method: 'POST',
			body: formData
		});
		
		const result = await response.json();
		console.log('Upload result:', result);
		
		// SvelteKit uses devalue serialization for form action responses
		// The response format is: {type: 'success', status: 200, data: '[{...refs...}, value1, value2, ...]'}
		if (result.type === 'success' && result.status === 200 && result.data) {
			try {
				// Parse the devalue-encoded data array
				const dataArray = JSON.parse(result.data);
				// Format: [{success: refIndex, path: refIndex}, successValue, pathValue]
				// The actual path is typically the last element
				const pathValue = dataArray[dataArray.length - 1];
				if (typeof pathValue === 'string' && pathValue.length > 0) {
					console.log('Upload success, path:', pathValue);
					return getSupabaseStorageUrl(pathValue, bucket);
				}
			} catch (e) {
				console.error('Failed to parse response:', e);
			}
		}
		
		// Fallback: check standard format
		if (result.data?.success && result.data?.path) {
			return getSupabaseStorageUrl(result.data.path, bucket);
		}
		
		const errorMsg = result.data?.message || result.error?.message || 'Upload failed';
		console.error('Upload failed:', errorMsg, result);
		throw new Error(errorMsg);
	}

	async function processBatch() {
		if (processing) return;
		processing = true;
		progress = 0;
		processedCount = 0;
		errorsCount = 0;
		logs = [];

		addLog(`Starting batch optimization for ${totalToProcess} items...`, 'info');

		for (let i = 0; i < itemsToOptimize.length; i++) {
			const item = itemsToOptimize[i];
			const isTemplate = item.type === 'template';
			currentItem = `Processing ${isTemplate ? 'Template' : 'ID Card'}: ${item.name || item.id} (${i + 1}/${totalToProcess})`;
			
			// Determine property names and bucket based on type
			const bucket = isTemplate ? 'templates' : 'rendered-id-cards';
			const frontSrc = isTemplate ? item.front_background : item.front_image;
			const backSrc = isTemplate ? item.back_background : item.back_image;
			
			// Paths
			let frontLowResUrl = isTemplate ? item.front_background_low_res : item.front_image_low_res;
			let backLowResUrl = isTemplate ? item.back_background_low_res : item.back_image_low_res;
			
			try {
				let updated = false;

				// Process Front
				if (frontSrc && !frontLowResUrl) {
					addLog(`Downloading front for "${item.name || item.id}"...`);
					const file = await downloadImage(frontSrc, bucket);
					
					addLog(`Resizing front...`);
					const lowResFile = await createLowResVersion(file);
					
					addLog(`Uploading front thumbnail...`);
					// Derive path from original to keep in same folder (handles RLS scoping better)
					let uploadPath;
					if (isTemplate) {
						uploadPath = `system_batch/front_low_${item.id}_${Date.now()}.jpg`;
					} else {
						// For ID cards, try to put in same folder as original
						// Original path usually: ORG_ID/TEMPLATE_ID/filename.png
						if (frontSrc && !frontSrc.startsWith('http')) {
							const dir = frontSrc.substring(0, frontSrc.lastIndexOf('/'));
							const name = frontSrc.substring(frontSrc.lastIndexOf('/') + 1);
							// Create new filename: original_low.jpg
							const newName = name.replace(/\.[^/.]+$/, '') + '_low.jpg';
							uploadPath = dir ? `${dir}/${newName}` : `thumbnails/${newName}`;
						} else {
							// Fallback if full URL or weird path
							uploadPath = `thumbnails/front_low_${item.id}_${Date.now()}.jpg`;
						}
					}

					frontLowResUrl = await uploadResizedImage(lowResFile, uploadPath, bucket);
					updated = true;
				}

				// Process Back
				if (backSrc && !backLowResUrl) {
					addLog(`Downloading back for "${item.name || item.id}"...`);
					const file = await downloadImage(backSrc, bucket);
					
					addLog(`Resizing back...`);
					const lowResFile = await createLowResVersion(file);
					
					addLog(`Uploading back thumbnail...`);
					
					let uploadPath;
					if (isTemplate) {
						uploadPath = `system_batch/back_low_${item.id}_${Date.now()}.jpg`;
					} else {
						if (backSrc && !backSrc.startsWith('http')) {
							const dir = backSrc.substring(0, backSrc.lastIndexOf('/'));
							const name = backSrc.substring(backSrc.lastIndexOf('/') + 1);
							const newName = name.replace(/\.[^/.]+$/, '') + '_low.jpg';
							uploadPath = dir ? `${dir}/${newName}` : `thumbnails/${newName}`;
						} else {
							uploadPath = `thumbnails/back_low_${item.id}_${Date.now()}.jpg`;
						}
					}

					backLowResUrl = await uploadResizedImage(lowResFile, uploadPath, bucket);
					updated = true;
				}

				// Update Database
				if (updated) {
					const formData = new FormData();
					formData.append('id', item.id);
					formData.append('type', item.type);
					if (frontLowResUrl) formData.append('front_low_res', frontLowResUrl);
					if (backLowResUrl) formData.append('back_low_res', backLowResUrl);

					const res = await fetch('?/updateLowRes', {
						method: 'POST',
						body: formData
					});
					
					if (res.ok) {
						addLog(`✅ Successfully updated "${item.name || item.id}"`, 'success');
						processedCount++;
					} else {
						throw new Error(`Server update failed: ${res.statusText}`);
					}
				} else {
					addLog(`Skipped "${item.name || item.id}" - no update needed`, 'info');
				}

			} catch (err: any) {
				console.error(err);
				addLog(`❌ Error processing "${item.name || item.id}": ${err.message}`, 'error');
				errorsCount++;
			}

			// Update progress
			progress = Math.round(((i + 1) / totalToProcess) * 100);
		}

		addLog(`Batch processing complete! Processed: ${processedCount}, Errors: ${errorsCount}`, 'success');
		currentItem = 'Done';
		processing = false;
		toast.success('Batch optimization completed');
		
		// Refresh page data
		window.location.reload();
	}
</script>

<div class="space-y-6">
	<!-- Header Stats -->
	<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
		<div class="bg-card border border-border rounded-xl p-6 shadow-sm">
			<h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Items</h3>
			<div class="mt-2 flex items-baseline gap-2">
				<span class="text-3xl font-bold text-foreground">{data.stats.needsOptimization + data.stats.optimizedTemplates + data.stats.optimizedCards}</span>
			</div>
			<div class="text-xs text-muted-foreground mt-1">
				{data.stats.totalTemplates} Templates, {data.stats.totalCards} Cards
			</div>
		</div>
		
		<div class="bg-card border border-border rounded-xl p-6 shadow-sm">
			<h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Templates Needed</h3>
			<div class="mt-2 flex items-baseline gap-2">
				<span class="text-3xl font-bold text-amber-600">{data.itemsToOptimize.filter(i => i.type === 'template').length}</span>
			</div>
		</div>

		<div class="bg-card border border-border rounded-xl p-6 shadow-sm">
			<h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">ID Cards Needed</h3>
			<div class="mt-2 flex items-baseline gap-2">
				<span class="text-3xl font-bold text-amber-600">{data.itemsToOptimize.filter(i => i.type === 'idcard').length}</span>
			</div>
		</div>
		
		<div class="bg-card border border-border rounded-xl p-6 shadow-sm">
			<h3 class="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Optimized</h3>
			<div class="mt-2 flex items-baseline gap-2">
				<span class="text-3xl font-bold text-green-600">{data.stats.optimizedTemplates + data.stats.optimizedCards}</span>
			</div>
		</div>
	</div>

	<!-- Action Section -->
	<div class="bg-card border border-border rounded-xl p-6 shadow-sm space-y-4">
		<div class="flex items-center justify-between">
			<div>
				<h2 class="text-lg font-semibold text-foreground">Batch Optimization Tool</h2>
				<p class="text-sm text-muted-foreground">
					Automatically generate and upload low-resolution thumbnails (300px) for all items (Templates and ID Cards) that are missing them.
				</p>
			</div>
			
			<button
				onclick={processBatch}
				disabled={processing || totalToProcess === 0}
				class="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium shadow hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
			>
				{processing ? 'Processing...' : `Start Optimization (${totalToProcess})`}
			</button>
		</div>

		{#if processing}
			<div class="space-y-2">
				<div class="flex justify-between text-sm">
					<span class="font-medium text-foreground">{currentItem}</span>
					<span class="text-muted-foreground">{progress}%</span>
				</div>
				<div class="h-2 w-full bg-muted rounded-full overflow-hidden">
					<div 
						class="h-full bg-primary transition-all duration-300 ease-out"
						style="width: {progress}%"
					></div>
				</div>
			</div>
		{/if}
	</div>

	<!-- Logs / Audit -->
	<div class="bg-card border border-border rounded-xl p-6 shadow-sm">
		<h3 class="text-lg font-semibold text-foreground mb-4">Process Audit Log</h3>
		<div class="bg-muted/50 rounded-lg border border-border p-4 h-96 overflow-y-auto font-mono text-sm space-y-1">
			{#if logs.length === 0}
				<div class="text-muted-foreground italic text-center py-8">No logs yet. Start the process to see activity.</div>
			{:else}
				{#each logs as log}
					<div class="border-b border-border/10 pb-1 last:border-0 last:pb-0">
						{#if log.includes('✅')}
							<span class="text-green-600 dark:text-green-400">{log}</span>
						{:else if log.includes('❌')}
							<span class="text-red-600 dark:text-red-400">{log}</span>
						{:else if log.includes('Processing')}
							<span class="text-blue-600 dark:text-blue-400">{log}</span>
						{:else}
							<span class="text-foreground/80">{log}</span>
						{/if}
					</div>
				{/each}
			{/if}
		</div>
	</div>
</div>
