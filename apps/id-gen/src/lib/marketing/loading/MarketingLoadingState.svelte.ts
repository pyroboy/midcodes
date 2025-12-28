/**
 * MarketingLoadingState.svelte.ts - Tracks loading progress for marketing page
 *
 * Uses Svelte 5 runes for reactive state management.
 * Tracks texture creation, mesh loading, and font loading.
 */

// Loading stages and their weights
const LOADING_STAGES = {
	init: { weight: 10, label: 'Initializing' },
	textures: { weight: 40, label: 'Loading textures' },
	meshes: { weight: 30, label: 'Creating meshes' },
	fonts: { weight: 10, label: 'Loading fonts' },
	ready: { weight: 10, label: 'Finalizing' }
} as const;

type LoadingStage = keyof typeof LOADING_STAGES;

// Reactive state using module-level runes
let currentStage = $state<LoadingStage>('init');
let stageProgress = $state(0); // 0-100 within current stage
let isComplete = $state(false);

// Calculate overall progress
let overallProgress = $derived(() => {
	if (isComplete) return 100;

	const stages = Object.keys(LOADING_STAGES) as LoadingStage[];
	const currentIndex = stages.indexOf(currentStage);

	// Sum weights of completed stages
	let completedWeight = 0;
	for (let i = 0; i < currentIndex; i++) {
		completedWeight += LOADING_STAGES[stages[i]].weight;
	}

	// Add partial progress of current stage
	const currentWeight = LOADING_STAGES[currentStage].weight;
	const partialProgress = (stageProgress / 100) * currentWeight;

	return Math.min(100, completedWeight + partialProgress);
});

/**
 * Set the current loading stage
 */
export function setLoadingStage(stage: LoadingStage) {
	currentStage = stage;
	stageProgress = 0;
}

/**
 * Update progress within current stage (0-100)
 */
export function setStageProgress(progress: number) {
	stageProgress = Math.min(100, Math.max(0, progress));
}

/**
 * Mark loading as complete
 */
export function markComplete() {
	isComplete = true;
	currentStage = 'ready';
	stageProgress = 100;
}

/**
 * Reset loading state
 */
export function resetLoading() {
	currentStage = 'init';
	stageProgress = 0;
	isComplete = false;
}

/**
 * Get current loading state
 */
export function getLoadingState() {
	return {
		get stage() {
			return currentStage;
		},
		get stageProgress() {
			return stageProgress;
		},
		get progress() {
			return overallProgress();
		},
		get isComplete() {
			return isComplete;
		},
		get label() {
			return LOADING_STAGES[currentStage].label;
		}
	};
}
