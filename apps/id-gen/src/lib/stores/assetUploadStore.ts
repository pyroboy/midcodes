import { writable, derived, get } from 'svelte/store';
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
	
	// Step 2: Dual Image Upload
	frontImage: File | null;
	frontImageUrl: string | null;
	backImage: File | null;
	backImageUrl: string | null;
	
	sampleType: SampleType | null;
	
	// Step 3: Detection & Pairing
	detectedRegionsFront: DetectedRegion[];
	detectedRegionsBack: DetectedRegion[];
	
	// Map of Front Region ID -> Back Region ID
	pairs: Map<string, string>;
	
	// Step 4: Asset metadata per PAIR (keyed by Front Region ID)
	assetMetadata: Map<string, AssetMetadata>;
	
	isProcessing: boolean;
	error: string | null;
}

function createAssetUploadStore() {
	const initialState: AssetUploadState = {
		currentStep: 'size',
		selectedSizePreset: null,
		frontImage: null,
		frontImageUrl: null,
		backImage: null,
		backImageUrl: null,
		sampleType: null,
		detectedRegionsFront: [],
		detectedRegionsBack: [],
		pairs: new Map(),
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
		setFrontImage: (file: File, url: string) =>
			update((s) => {
				if (s.frontImageUrl) URL.revokeObjectURL(s.frontImageUrl);
				return {
					...s,
					frontImage: file,
					frontImageUrl: url,
					detectedRegionsFront: [], // Reset detection
					pairs: new Map(), // Reset pairs
					error: null
				};
			}),

		setBackImage: (file: File, url: string) =>
			update((s) => {
				if (s.backImageUrl) URL.revokeObjectURL(s.backImageUrl);
				return {
					...s,
					backImage: file,
					backImageUrl: url,
					detectedRegionsBack: [], // Reset detection
					pairs: new Map(), // Reset pairs
					error: null
				};
			}),

		clearFrontImage: () =>
			update((s) => {
				if (s.frontImageUrl) URL.revokeObjectURL(s.frontImageUrl);
				return { ...s, frontImage: null, frontImageUrl: null, detectedRegionsFront: [], pairs: new Map() };
			}),

		clearBackImage: () =>
			update((s) => {
				if (s.backImageUrl) URL.revokeObjectURL(s.backImageUrl);
				return { ...s, backImage: null, backImageUrl: null, detectedRegionsBack: [], pairs: new Map() };
			}),

		setSampleType: (type: SampleType) =>
			update((s) => ({
				...s,
				sampleType: type
			})),

		// Step 3: Detection results
		setDetectedRegions: (side: 'front' | 'back', regions: DetectedRegion[]) =>
			update((s) => ({
				...s,
				[side === 'front' ? 'detectedRegionsFront' : 'detectedRegionsBack']: regions,
				error: null
			})),

		toggleRegionSelection: (side: 'front' | 'back', id: string) =>
			update((s) => {
				const key = side === 'front' ? 'detectedRegionsFront' : 'detectedRegionsBack';
				return {
					...s,
					[key]: s[key].map((r) =>
						r.id === id ? { ...r, isSelected: !r.isSelected } : r
					)
				};
			}),

		// Pairing Logic
		autoPair: () =>
			update((s) => {
				const pairs = new Map<string, string>();
				// Simple pairing: Index to Index
				// TODO: Can improve with spatial matching (closest centers)
				const minLen = Math.min(s.detectedRegionsFront.length, s.detectedRegionsBack.length);
				for (let i = 0; i < minLen; i++) {
					pairs.set(s.detectedRegionsFront[i].id, s.detectedRegionsBack[i].id);
				}
				return { ...s, pairs };
			}),
		
		pairRegions: (frontId: string, backId: string) => 
			update((s) => {
				const newPairs = new Map(s.pairs);
				newPairs.set(frontId, backId);
				return { ...s, pairs: newPairs };
			}),

		unpairRegion: (frontId: string) => 
			update((s) => {
				const newPairs = new Map(s.pairs);
				newPairs.delete(frontId);
				return { ...s, pairs: newPairs };
			}),

		// Step 4: Asset metadata management
		initializeMetadata: () =>
			update((s) => {
				const metadata = new Map<string, AssetMetadata>();
				
				// Identify paired items
				s.pairs.forEach((backId, frontId) => {
					metadata.set(frontId, {
						regionId: frontId, // Use front ID as key
						name: `Card Pair ${metadata.size + 1}`,
						description: '',
						category: undefined,
						tags: []
					});
				});

				// Identify unpaired Front items
				s.detectedRegionsFront.forEach(r => {
					if (r.isSelected && !s.pairs.has(r.id)) {
						metadata.set(r.id, {
							regionId: r.id,
							name: `Front Only ${metadata.size + 1}`,
							description: '',
							category: undefined,
							tags: []
						});
					}
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

		// Processing state
		setProcessing: (isProcessing: boolean) => update((s) => ({ ...s, isProcessing })),
		setError: (error: string | null) => update((s) => ({ ...s, error })),

		// Reset
		reset: () => {
			update((s) => {
				if (s.frontImageUrl) URL.revokeObjectURL(s.frontImageUrl);
				if (s.backImageUrl) URL.revokeObjectURL(s.backImageUrl);
				return initialState;
			});
		}
	};
}

export const assetUploadStore = createAssetUploadStore();

// Derived stores

export const canProceedToNext = derived(assetUploadStore, ($state) => {
	switch ($state.currentStep) {
		case 'size':
			return $state.selectedSizePreset !== null;
		case 'upload':
			// Allow if at least one side is uploaded (Front usually)
			return $state.frontImage !== null && $state.sampleType !== null;
		case 'detection':
			// Proceed if we have detected regions (logic can be refined)
			return $state.detectedRegionsFront.length > 0 || $state.detectedRegionsBack.length > 0;
		case 'save':
			return Array.from($state.assetMetadata.values()).every((m) => m.name.trim().length > 0);
		default:
			return false;
	}
});

export const stepProgress = derived(assetUploadStore, ($state) => {
	const steps: WizardStep[] = ['size', 'upload', 'detection', 'save'];
	const currentIndex = steps.indexOf($state.currentStep);
	return {
		current: currentIndex + 1,
		total: steps.length,
		percentage: ((currentIndex + 1) / steps.length) * 100
	};
});

export const stepLabels: Record<WizardStep, string> = {
	size: 'Select Size',
	upload: 'Upload Scans',
	detection: 'Detect & Match',
	save: 'Review & Save'
};

/**
 * Returns list of Pairs for preview
 * Each item contains { front: Region, back?: Region, meta: Metadata }
 */
export const previewPairs = derived(assetUploadStore, ($state) => {
	const items: Array<{
		id: string; // Use front ID as main ID
		front: DetectedRegion;
		back?: DetectedRegion;
		isPaired: boolean;
	}> = [];

	// Add Pairs
	$state.pairs.forEach((backId, frontId) => {
		const front = $state.detectedRegionsFront.find(r => r.id === frontId);
		const back = $state.detectedRegionsBack.find(r => r.id === backId);
		if (front) {
			items.push({ id: frontId, front, back, isPaired: true });
		}
	});

	// Add Unpaired Fronts (that are selected)
	$state.detectedRegionsFront.forEach(front => {
		if (front.isSelected && !$state.pairs.has(front.id)) {
			items.push({ id: front.id, front, isPaired: false });
		}
	});

	return items;
});
