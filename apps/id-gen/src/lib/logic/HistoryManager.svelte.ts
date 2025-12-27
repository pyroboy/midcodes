import { getDecomposeHistoryWithStats, checkJobStatus } from '$lib/remote/index.remote';
import type { LayerManager } from './LayerManager.svelte';
import { toast } from 'svelte-sonner';

export type JobCompleteCallback = (jobId: string, result: any, provider: string) => void;

export class HistoryManager {
	history = $state<any[]>([]);
	stats = $state<any>(null);
	isLoading = $state(false);
	expandedItems = $state<Set<string>>(new Set());
	private pollingJobs = new Set<string>();
	private loadDebounceTimer: ReturnType<typeof setTimeout> | null = null;

	// Callback for when a job completes - allows parent to add results to layers
	onJobComplete: JobCompleteCallback | null = null;

	constructor(
		private layerManager: LayerManager,
		private getTemplateId: () => string | undefined
	) {}

	private get templateId() {
		return this.getTemplateId();
	}

	/**
	 * Add an optimistic history item immediately when action is queued.
	 * Returns the temporary ID for later reconciliation.
	 */
	addOptimisticItem(
		provider: string,
		model: string,
		inputImageUrl: string,
		side: 'front' | 'back' | 'unknown'
	) {
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
		// Prepend to history and trigger reactivity
		this.history = [tempItem, ...this.history];
		console.log(`[HistoryManager] Added optimistic item ${tempId}`);
		return tempId;
	}

	addLocalEntry(action: 'draw' | 'erase' | 'fill' | 'move', layerId: string) {
		const id = crypto.randomUUID();
		const entry = {
			id,
			createdAt: new Date().toISOString(),
			status: 'completed',
			provider: 'local',
			model: action.toUpperCase(),
			inputImageUrl: '',
			side: this.layerManager.activeSide,
			layers: [], 
			isOptimistic: false,
			isLocal: true,
			layerId // Reference to modified layer
		};
		this.history = [entry, ...this.history];
		// Toast removed - brush strokes should be silent
	}

	/**
	 * Update the temp ID to the real job ID once the server responds.
	 * Starts polling for this job automatically.
	 */
	updateOptimisticId(tempId: string, realId: string) {
		const index = this.history.findIndex((item) => item.id === tempId);
		if (index !== -1) {
			console.log(`[HistoryManager] Reconciling ${tempId} -> ${realId}`);
			// Update the item and reassign array to trigger reactivity
			const updated = { ...this.history[index], id: realId, isOptimistic: true };
			this.history = [...this.history.slice(0, index), updated, ...this.history.slice(index + 1)];

			// Start polling for the real ID
			if (!this.pollingJobs.has(realId)) {
				this.startPollingItem(realId);
			}
		} else {
			console.warn(`[HistoryManager] Could not find optimistic item ${tempId} to reconcile`);
		}
	}

	/**
	 * Update a specific item's status locally without a full reload.
	 * This provides immediate UI feedback during polling.
	 */
	updateItemStatus(
		jobId: string,
		status: 'pending' | 'processing' | 'completed' | 'failed',
		result?: any
	) {
		const index = this.history.findIndex((item) => item.id === jobId);
		if (index !== -1) {
			const updated = {
				...this.history[index],
				status,
				isOptimistic: status === 'pending' || status === 'processing'
			};

			// Merge result data if provided (layers, resultUrl, etc.)
			if (result) {
				if (result.layers) updated.layers = result.layers;
				if (result.resultUrl) updated.resultUrl = result.resultUrl;
			}

			// Reassign array to trigger reactivity
			this.history = [...this.history.slice(0, index), updated, ...this.history.slice(index + 1)];
			console.log(`[HistoryManager] Updated item ${jobId} status to ${status}`);
		}
	}

	/**
	 * Load history from the server. Uses debouncing to prevent rapid consecutive calls.
	 */
	async load() {
		// Debounce: if called multiple times in quick succession, only execute once
		if (this.loadDebounceTimer) {
			clearTimeout(this.loadDebounceTimer);
		}

		return new Promise<void>((resolve) => {
			this.loadDebounceTimer = setTimeout(async () => {
				await this._loadInternal();
				resolve();
			}, 300); // 300ms debounce
		});
	}

	private async _loadInternal() {
		this.isLoading = true;
		try {
			const res = await getDecomposeHistoryWithStats({ templateId: this.templateId });
			if (res.success) {
				// Build a map of current optimistic items by ID
				const optimisticMap = new Map(
					this.history.filter((h) => h.isOptimistic).map((h) => [h.id, h])
				);

				// IDs that exist in the DB response
				const dbIds = new Set(res.history.map((h) => h.id));

				// Keep optimistic items that aren't in DB yet (still being written)
				const remainingOptimistic = this.history.filter((h) => h.isOptimistic && !dbIds.has(h.id));

				// For items in both optimistic and DB, merge carefully:
				// - DB data wins for most fields
				// - Keep isOptimistic=true if status is still pending (for UI tracking)
				const mergedHistory = res.history.map((dbItem) => {
					const wasOptimistic = optimisticMap.has(dbItem.id);
					return {
						...dbItem,
						// Keep tracking until truly complete
						isOptimistic:
							wasOptimistic && (dbItem.status === 'pending' || dbItem.status === 'processing')
					};
				});

				// Combine: remaining optimistic items first, then merged DB items
				this.history = [...remainingOptimistic, ...mergedHistory];
				this.stats = res.stats;

				console.log(
					`[HistoryManager] Loaded ${mergedHistory.length} items, ${remainingOptimistic.length} optimistic remaining`
				);

				// Start polling for any pending/processing items not already being polled
				this.history.forEach((item) => {
					if (
						(item.status === 'pending' || item.status === 'processing') &&
						!this.pollingJobs.has(item.id) &&
						!item.id.startsWith('temp-')
					) {
						// Don't poll temp IDs
						this.startPollingItem(item.id);
					}
				});
			}
		} catch (err) {
			console.error('[HistoryManager] Load failed:', err);
		} finally {
			this.isLoading = false;
		}
	}

	/**
	 * Poll for job completion. Updates local status during polling and triggers
	 * a full reload when complete.
	 */
	private async startPollingItem(jobId: string) {
		if (this.pollingJobs.has(jobId)) {
			console.log(`[HistoryManager] Already polling ${jobId}`);
			return;
		}

		this.pollingJobs.add(jobId);
		console.log(`[HistoryManager] Started polling for ${jobId}`);

		try {
			let attempts = 0;
			const maxAttempts = 60; // 10 minutes at 10s intervals

			while (attempts < maxAttempts) {
				const res = await checkJobStatus({ jobId });

				// Update local status immediately for UI feedback
				if (res.status === 'processing') {
					this.updateItemStatus(jobId, 'processing');
				}

				if (res.status === 'completed') {
					console.log(`[HistoryManager] Job ${jobId} completed`);
					// Update local state with result data first
					this.updateItemStatus(jobId, 'completed', res.result);
					// Then do a full refresh to get accurate server data
					await this._loadInternal();

					// Get the item to find its provider
					const item = this.history.find((h) => h.id === jobId);
					const provider = item?.provider || '';

					// Notify parent component to add results to layers
					if (this.onJobComplete && res.result) {
						this.onJobComplete(jobId, res.result, provider);
					}

					toast.success('A background task has completed');
					break;
				}

				if (res.status === 'failed') {
					console.log(`[HistoryManager] Job ${jobId} failed`);
					this.updateItemStatus(jobId, 'failed');
					toast.error('A background task has failed');
					break;
				}

				// Wait 10 seconds between polls
				await new Promise((resolve) => setTimeout(resolve, 10000));
				attempts++;
			}

			if (attempts >= maxAttempts) {
				console.warn(`[HistoryManager] Polling timed out for ${jobId}`);
				this.updateItemStatus(jobId, 'failed');
			}
		} catch (e) {
			console.error(`[HistoryManager] Error polling job ${jobId}:`, e);
			this.updateItemStatus(jobId, 'failed');
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
		const side =
			item.side === 'front' || item.side === 'back' ? item.side : this.layerManager.activeSide;

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
