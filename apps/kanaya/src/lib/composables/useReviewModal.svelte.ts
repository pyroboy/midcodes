import { toast } from 'svelte-sonner';
import type { EditorTemplateData } from '$lib/types/template';

/**
 * Parameters for starting a review
 */
export interface StartReviewParams {
	currentTemplate: EditorTemplateData | null;
	frontPreview: string | null;
	backPreview: string | null;
	updateCropPreviews: () => Promise<void>;
}

export function useReviewModal() {
	let isReviewing = $state(false);
	let reviewSide = $state<'front' | 'back'>('front');
	let reviewRotation = $state(0);

	// Animation states
	let isClosingReview = $state(false);
	let flyTarget = $state<{ top: number; left: number; width: number; height: number } | null>(null);

	/**
	 * Start the review modal
	 * Validates that template and previews are present before showing
	 */
	async function startReview(params: StartReviewParams): Promise<boolean> {
		const { currentTemplate, frontPreview, backPreview, updateCropPreviews } = params;

		console.log('👀 Starting Template Review');
		console.log('📍 Template:', currentTemplate?.name);
		console.log('📁 Previews:', {
			front: frontPreview ? 'Present' : 'Missing',
			back: backPreview ? 'Present' : 'Missing'
		});

		if (!currentTemplate?.name?.trim()) {
			toast.error('Please enter a template name first');
			return false;
		}
		if (!frontPreview || !backPreview) {
			toast.error('Both front and back designs are required');
			return false;
		}

		// Ensure crop previews are up-to-date before showing review
		await updateCropPreviews();

		isReviewing = true;
		reviewSide = 'front';
		reviewRotation = 0;

		return true;
	}

	function cancelReview() {
		isReviewing = false;
		isClosingReview = false;
		flyTarget = null;
	}

	function flipReview() {
		reviewSide = reviewSide === 'front' ? 'back' : 'front';
		reviewRotation += 180;
	}

	function setFlyTarget(target: { top: number; left: number; width: number; height: number } | null) {
		flyTarget = target;
	}

	/**
	 * Close review modal with animation
	 * Used when navigating away without saving
	 */
	function closeReviewWithAnimation() {
		isClosingReview = true;
		setTimeout(() => {
			isReviewing = false;
			isClosingReview = false;
			flyTarget = null;
		}, 500); // Match animation duration
	}

	/**
	 * Called from Review Template modal to confirm and save directly.
	 * Since the user has already reviewed the cropped preview in the modal,
	 * we close the review and trigger the save callback.
	 * @param saveCallback - Function to call to perform the save
	 */
	async function confirmAndSave(saveCallback: () => Promise<void>): Promise<void> {
		// Close the review modal state first
		isReviewing = false;

		// Execute the save
		await saveCallback();
	}

	/**
	 * Start closing animation for fly-to-list effect
	 */
	function startClosingAnimation() {
		isClosingReview = true;
	}

	/**
	 * End closing animation and reset state
	 */
	function endClosingAnimation() {
		isClosingReview = false;
		isReviewing = false;
		flyTarget = null;
	}

	/**
	 * Reset rotation to front-facing
	 */
	function resetRotation() {
		reviewRotation = 0;
		reviewSide = 'front';
	}

	return {
		get isReviewing() { return isReviewing; },
		set isReviewing(value) { isReviewing = value; },
		get reviewSide() { return reviewSide; },
		get reviewRotation() { return reviewRotation; },
		get isClosingReview() { return isClosingReview; },
		get flyTarget() { return flyTarget; },
		startReview,
		cancelReview,
		flipReview,
		setFlyTarget,
		closeReviewWithAnimation,
		confirmAndSave,
		startClosingAnimation,
		endClosingAnimation,
		resetRotation
	};
}
