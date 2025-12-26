import { needsCropping, getImageDimensions, generateCropPreviewUrl, type BackgroundPosition, type ImageDimensions } from '$lib/utils/imageCropper';
import { toast } from 'svelte-sonner';

export interface CroppingDialogData {
	front?: {
		originalSize: { width: number; height: number };
		needsCropping: boolean;
		filename: string;
		previewUrl?: string;
	};
	back?: {
		originalSize: { width: number; height: number };
		needsCropping: boolean;
		filename: string;
		previewUrl?: string;
	};
}

export interface UseCroppingDialogOptions {
	// Options if needed in future
}

export function useCroppingDialog() {
	let showCroppingDialog = $state(false);
	let pendingSave = $state(false);
	let croppingDialogData = $state<CroppingDialogData>({});

	// Track created object URLs for cleanup to prevent memory leaks
	let createdObjectUrls: string[] = [];

	/**
	 * Cleanup all created object URLs to prevent memory leaks
	 */
	function cleanupObjectUrls() {
		for (const url of createdObjectUrls) {
			try {
				URL.revokeObjectURL(url);
			} catch (e) {
				console.warn('Failed to revoke object URL:', e);
			}
		}
		createdObjectUrls = [];
	}

	interface CheckCroppingParams {
		frontBackground: File | null;
		backBackground: File | null;
		requiredPixelDimensions: { width: number; height: number } | null;
		frontBackgroundPosition: BackgroundPosition;
		backBackgroundPosition: BackgroundPosition;
	}

	async function checkAndShowCroppingDialog(params: CheckCroppingParams): Promise<boolean> {
		const {
			frontBackground,
			backBackground,
			requiredPixelDimensions,
			frontBackgroundPosition,
			backBackgroundPosition
		} = params;

		if (!requiredPixelDimensions) return false;

		// Cleanup any previous object URLs
		cleanupObjectUrls();

		// Check if front needs cropping
		let frontData = undefined;
		if (frontBackground) {
			try {
				// Get image dimensions first
				const frontDimensions = await getImageDimensions(frontBackground);
				const frontNeedsCrop = needsCropping(
					frontDimensions,
					requiredPixelDimensions,
					frontBackgroundPosition
				);

				// Generate proper crop preview instead of just object URL
				let previewUrl: string | undefined;
				try {
					previewUrl = await generateCropPreviewUrl(
						frontBackground,
						requiredPixelDimensions,
						frontBackgroundPosition
					);
					// Track for cleanup
					if (previewUrl.startsWith('blob:')) {
						createdObjectUrls.push(previewUrl);
					}
				} catch (previewError) {
					console.warn('Failed to generate front crop preview:', previewError);
					previewUrl = URL.createObjectURL(frontBackground);
					createdObjectUrls.push(previewUrl);
				}

				frontData = {
					originalSize: frontDimensions,
					needsCropping: frontNeedsCrop,
					filename: frontBackground.name,
					previewUrl
				};

				console.log('🖼️ Front cropping check:', {
					needsCropping: frontNeedsCrop,
					originalSize: frontDimensions,
					position: frontBackgroundPosition
				});
			} catch (e) {
				console.error('Failed to check front image dimensions:', e);
			}
		}

		// Check if back needs cropping
		let backData = undefined;
		if (backBackground) {
			try {
				// Get image dimensions first
				const backDimensions = await getImageDimensions(backBackground);
				const backNeedsCrop = needsCropping(
					backDimensions,
					requiredPixelDimensions,
					backBackgroundPosition
				);

				// Generate proper crop preview instead of just object URL
				let previewUrl: string | undefined;
				try {
					previewUrl = await generateCropPreviewUrl(
						backBackground,
						requiredPixelDimensions,
						backBackgroundPosition
					);
					// Track for cleanup
					if (previewUrl.startsWith('blob:')) {
						createdObjectUrls.push(previewUrl);
					}
				} catch (previewError) {
					console.warn('Failed to generate back crop preview:', previewError);
					previewUrl = URL.createObjectURL(backBackground);
					createdObjectUrls.push(previewUrl);
				}

				backData = {
					originalSize: backDimensions,
					needsCropping: backNeedsCrop,
					filename: backBackground.name,
					previewUrl
				};

				console.log('🖼️ Back cropping check:', {
					needsCropping: backNeedsCrop,
					originalSize: backDimensions,
					position: backBackgroundPosition
				});
			} catch (e) {
				console.error('Failed to check back image dimensions:', e);
			}
		}

		// If nothing needs cropping, proceed
		if (!frontData && !backData) {
			return false;
		}

		// Show dialog
		croppingDialogData = {
			front: frontData,
			back: backData
		};
		showCroppingDialog = true;
		pendingSave = true;

		return true;
	}

	function handleCroppingCancel() {
		showCroppingDialog = false;
		pendingSave = false;
		cleanupObjectUrls();
		croppingDialogData = {};
		toast.info('Save cancelled. Please adjust cropping if needed.');
	}

	function handleCroppingConfirm() {
		showCroppingDialog = false;
		// Don't cleanup URLs here - they may still be needed for display
		// Return true or allow caller to check pendingSave
		return true;
	}

	function reset() {
		showCroppingDialog = false;
		pendingSave = false;
		cleanupObjectUrls();
		croppingDialogData = {};
	}

	/**
	 * Set pending save state directly
	 */
	function setPendingSave(value: boolean) {
		pendingSave = value;
	}

	return {
		get showCroppingDialog() { return showCroppingDialog; },
		set showCroppingDialog(v) { showCroppingDialog = v; },
		get pendingSave() { return pendingSave; },
		set pendingSave(v) { pendingSave = v; },
		get croppingDialogData() { return croppingDialogData; },
		checkAndShowCroppingDialog,
		handleCroppingCancel,
		handleCroppingConfirm,
		reset,
		setPendingSave,
		cleanupObjectUrls
	};
}
