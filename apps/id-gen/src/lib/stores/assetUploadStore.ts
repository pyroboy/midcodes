import { writable, derived } from 'svelte/store';
import type {
	SizePreset,
	DetectedRegion,
	SampleType,
	WizardStep,
	AssetMetadata
} from '$lib/schemas/template-assets.schema';

/**
 * Asset Upload Wizard State Store
 * Manages the state for the 4-step wizard: Size → Upload → Detection → Save
 */

export interface AssetUploadState {
	currentStep: WizardStep;
	selectedSizePreset: SizePreset | null;
	uploadedImage: File | null;
	uploadedImageUrl: string | null;
	sampleType: SampleType | null;
	detectedRegions: DetectedRegion[];
	// Step 4: Asset metadata per region
	assetMetadata: Map<string, AssetMetadata>;
	isProcessing: boolean;
	error: string | null;
}

function createAssetUploadStore() {
	const initialState: AssetUploadState = {
		currentStep: 'size',
		selectedSizePreset: null,
		uploadedImage: null,
		uploadedImageUrl: null,
		sampleType: null,
		detectedRegions: [],
		assetMetadata: new Map(),
		isProcessing: false,
		error: null
	};

	const { subscribe, set, update } = writable<AssetUploadState>(initialState);

	return {
		subscribe,

		// Step navigation
		goToStep: (step: WizardStep) =>
			update((s) => ({
				...s,
				currentStep: step,
				error: null
			})),

		// Step 1: Size selection
		selectSize: (preset: SizePreset) =>
			update((s) => ({
				...s,
				selectedSizePreset: preset,
				error: null
			})),

		// Step 2: Image upload
		setUploadedImage: (file: File, url: string, type: SampleType) =>
			update((s) => {
				// Revoke old URL if exists
				if (s.uploadedImageUrl) {
					URL.revokeObjectURL(s.uploadedImageUrl);
				}
				return {
					...s,
					uploadedImage: file,
					uploadedImageUrl: url,
					sampleType: type,
					detectedRegions: [],
					error: null
				};
			}),

		clearUploadedImage: () =>
			update((s) => {
				if (s.uploadedImageUrl) {
					URL.revokeObjectURL(s.uploadedImageUrl);
				}
				return {
					...s,
					uploadedImage: null,
					uploadedImageUrl: null,
					detectedRegions: [],
					error: null
				};
			}),

		setSampleType: (type: SampleType) =>
			update((s) => ({
				...s,
				sampleType: type
			})),

		// Step 3: Detection results
		setDetectedRegions: (regions: DetectedRegion[]) =>
			update((s) => ({
				...s,
				detectedRegions: regions,
				error: null
			})),

		toggleRegionSelection: (id: string) =>
			update((s) => ({
				...s,
				detectedRegions: s.detectedRegions.map((r) =>
					r.id === id ? { ...r, isSelected: !r.isSelected } : r
				)
			})),

		updateRegion: (id: string, updates: Partial<DetectedRegion>) =>
			update((s) => ({
				...s,
				detectedRegions: s.detectedRegions.map((r) =>
					r.id === id ? { ...r, ...updates, isManuallyAdjusted: true } : r
				)
			})),

		addManualRegion: (region: DetectedRegion) =>
			update((s) => ({
				...s,
				detectedRegions: [...s.detectedRegions, region]
			})),

		removeRegion: (id: string) =>
			update((s) => ({
				...s,
				detectedRegions: s.detectedRegions.filter((r) => r.id !== id)
			})),

		selectAllRegions: () =>
			update((s) => ({
				...s,
				detectedRegions: s.detectedRegions.map((r) => ({ ...r, isSelected: true }))
			})),

		deselectAllRegions: () =>
			update((s) => ({
				...s,
				detectedRegions: s.detectedRegions.map((r) => ({ ...r, isSelected: false }))
			})),

		// Toggle orientation (swap width/height and flip orientation)
		toggleOrientation: (id: string) =>
			update((s) => ({
				...s,
				detectedRegions: s.detectedRegions.map((r) => {
					if (r.id !== id) return r;
					return {
						...r,
						orientation: r.orientation === 'landscape' ? 'portrait' : 'landscape',
						isManuallyAdjusted: true
					};
				})
			})),

		// Processing state
		setProcessing: (isProcessing: boolean) => update((s) => ({ ...s, isProcessing })),

		setError: (error: string | null) => update((s) => ({ ...s, error })),

		// Step 4: Asset metadata management
		initializeMetadata: () =>
			update((s) => {
				const metadata = new Map<string, AssetMetadata>();
				s.detectedRegions
					.filter((r) => r.isSelected)
					.forEach((region, index) => {
						metadata.set(region.id, {
							regionId: region.id,
							name: `Card ${index + 1}`,
							description: '',
							category: undefined,
							tags: []
						});
					});
				return { ...s, assetMetadata: metadata };
			}),

		updateAssetMetadata: (regionId: string, updates: Partial<AssetMetadata>) =>
			update((s) => {
				const metadata = new Map(s.assetMetadata);
				const existing = metadata.get(regionId);
				if (existing) {
					metadata.set(regionId, { ...existing, ...updates });
				}
				return { ...s, assetMetadata: metadata };
			}),

		// Reset
		reset: () => {
			update((s) => {
				if (s.uploadedImageUrl) {
					URL.revokeObjectURL(s.uploadedImageUrl);
				}
				return initialState;
			});
		}
	};
}

export const assetUploadStore = createAssetUploadStore();

// Derived stores

/**
 * Check if user can proceed to next step
 */
export const canProceedToNext = derived(assetUploadStore, ($state) => {
	switch ($state.currentStep) {
		case 'size':
			return $state.selectedSizePreset !== null;
		case 'upload':
			return $state.uploadedImage !== null && $state.sampleType !== null;
		case 'detection':
			return $state.detectedRegions.some((r) => r.isSelected);
		case 'save':
			// Can proceed when all metadata has names
			return Array.from($state.assetMetadata.values()).every((m) => m.name.trim().length > 0);
		default:
			return false;
	}
});

/**
 * Get selected regions only
 */
export const selectedRegions = derived(assetUploadStore, ($state) =>
	$state.detectedRegions.filter((r) => r.isSelected)
);

/**
 * Get step progress information
 */
export const stepProgress = derived(assetUploadStore, ($state) => {
	const steps: WizardStep[] = ['size', 'upload', 'detection', 'save'];
	const currentIndex = steps.indexOf($state.currentStep);
	return {
		current: currentIndex + 1,
		total: steps.length,
		percentage: ((currentIndex + 1) / steps.length) * 100
	};
});

/**
 * Get step labels
 */
export const stepLabels: Record<WizardStep, string> = {
	size: 'Select Size',
	upload: 'Upload Image',
	detection: 'Detect Cards',
	save: 'Save Assets'
};
