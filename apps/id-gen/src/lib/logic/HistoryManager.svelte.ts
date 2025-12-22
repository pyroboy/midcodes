import { getDecomposeHistoryWithStats, checkJobStatus } from '$lib/remote/index.remote';
import type { LayerManager } from './LayerManager.svelte';
import { toast } from 'svelte-sonner';

export class HistoryManager {
	history = $state<any[]>([]);
	stats = $state<any>(null);
	isLoading = $state(false);
	expandedItems = $state<Set<string>>(new Set());
	private pollingJobs = new Set<string>();

	constructor(
		private layerManager: LayerManager, 
		private getTemplateId: () => string | undefined
	) {}

    private get templateId() { return this.getTemplateId(); }

	addOptimisticItem(provider: string, model: string, inputImageUrl: string, side: 'front' | 'back' | 'unknown') {
		const tempId = 'temp-' + Math.random().toString(36).slice(2, 11);
		const tempItem = {
			id: tempId,
			createdAt: new Date().toISOString(),
			status: 'pending',
			provider,
			model,
			inputImageUrl,
			side,
			layers: [],
			creditsUsed: 0,
			isOptimistic: true
		};
		// Prepend to history
		this.history = [tempItem, ...this.history];
		return tempId;
	}

	updateOptimisticId(tempId: string, realId: string) {
		const index = this.history.findIndex(item => item.id === tempId);
		if (index !== -1) {
			console.log(`[HistoryManager] Reconciling ${tempId} -> ${realId}`);
			// Keep isOptimistic = true so it continues to be tracked until it appears in load() results
			this.history[index] = { ...this.history[index], id: realId, isOptimistic: true };
			
			// Start polling for the real ID
			if (!this.pollingJobs.has(realId)) {
				this.startPollingItem(realId);
			}
		}
	}

	async load() {
		this.isLoading = true;
		try {
			const res = await getDecomposeHistoryWithStats({ templateId: this.templateId });
			if (res.success) {
				// Keep optimistic items that aren't in the response yet
				const optimisticItems = this.history.filter(h => h.isOptimistic);
				const realIds = new Set(res.history.map(h => h.id));
				
				// Filter out any optimistic items that have now been matched by a real ID
				const remainingOptimistic = optimisticItems.filter(o => !realIds.has(o.id));
				
				this.history = [...remainingOptimistic, ...res.history];
				this.stats = res.stats;
				
				// Automatically poll for any pending items
				this.history.forEach(item => {
					if ((item.status === 'pending' || item.status === 'processing') && !this.pollingJobs.has(item.id)) {
						this.startPollingItem(item.id);
					}
				});
			}
		} finally {
			this.isLoading = false;
		}
	}

	private async startPollingItem(jobId: string) {
		this.pollingJobs.add(jobId);

		try {
			let attempts = 0;
			while (attempts < 60) {
				const res = await checkJobStatus({ jobId });
				
				if (res.status === 'completed') {
					// Update local state by re-fetching history or updating the item directly
					await this.load(); // Refresh full history to get results
					toast.success('A background task has completed');
					break;
				}
				
				if (res.status === 'failed') {
					await this.load();
					break;
				}

				// Wait 10 seconds between polls for background items
				await new Promise(resolve => setTimeout(resolve, 10000));
				attempts++;
			}
		} catch (e) {
			console.error(`[HistoryManager] Error polling job ${jobId}:`, e);
		} finally {
			this.pollingJobs.delete(jobId);
		}
	}

	toggleExpand(id: string) {
		if (this.expandedItems.has(id)) this.expandedItems.delete(id);
		else this.expandedItems.add(id);
		this.expandedItems = new Set(this.expandedItems);
	}

	restoreSession(item: any) {
		const side = item.side === 'front' || item.side === 'back' ? item.side : this.layerManager.activeSide;
		
		if (this.layerManager.activeSide !== side) {
			this.layerManager.setSide(side);
			toast.info(`Switched to ${side} side`);
		}

		this.layerManager.clearCurrentSide();

		if (item.layers) {
			item.layers.forEach((l: any, i: number) => {
				const { layer, selection } = this.layerManager.createLayerObj(
					l.imageUrl,
					l.name || `History Layer ${i}`,
					l.bounds || { x: 0, y: 0, width: 100, height: 100 },
					side,
					i
				);
				this.layerManager.addLayer(layer, selection);
			});
		}
		toast.success('Session restored from history');
	}
}
