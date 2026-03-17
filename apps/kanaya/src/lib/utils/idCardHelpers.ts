import { db } from '$lib/server/db';
import { idcards, digitalCards, organizations } from '$lib/server/schema';
import { uploadToR2, deleteFromR2 } from '$lib/server/s3';
import { getCardAssetPath, getCardRawAssetPath } from './storagePath';
import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import {
	generateDigitalCardSlug,
	generateShortform,
	generateClaimToken,
	generateClaimCode,
	hashClaimCode,
	calculateClaimExpiry,
	buildDigitalProfileUrl
} from './slugGeneration';
import { safeOperationWithRetry, isUniqueViolation } from '$lib/server/transactionUtils';
import { validateOrgMetadata, type OrgMetadata } from '$lib/schemas/metadata.schema';
import { type IdCardError, type CleanupResult, createIdCardError } from '$lib/errors/idCardErrors';

// --- Types ---

export interface ImageUploadResult {
	cardId: string;
	frontPath: string;
	backPath: string;
	frontPreviewPath: string;
	backPreviewPath: string;
	rawAssets: Record<string, { path: string; type: string }>;
	error?: string;
}

export interface ImageUploadError {
	error: string;
	frontPath?: never;
	backPath?: never;
	frontPreviewPath?: never;
	backPreviewPath?: never;
}

export interface SaveIdCardOptions {
	cardId?: string;
	templateId: string;
	orgId: string;
	frontPath: string;
	backPath: string;
	frontPreviewPath?: string;
	backPreviewPath?: string;
	rawAssets?: Record<string, { path: string; type: string }>;
	formFields: Record<string, string>;
	orgMetadata?: OrgMetadata;
	createDigitalCard?: boolean;
	recipientEmail?: string;
	userId?: string;
	/** Pre-generated slug from client (used for QR code consistency) */
	preGeneratedSlug?: string;
}

export interface SaveIdCardResult {
	success: boolean;
	data?: {
		idCard: typeof idcards.$inferSelect;
		digitalCard?: {
			id: string;
			slug: string;
			status: string;
			claimCode?: string;
			profileUrl?: string;
		};
	};
	error?: string;
}

// --- Image Upload Handling ---

/**
 * Handle image uploads using R2 storage
 */
export async function handleImageUploads(
	formData: FormData,
	orgId: string,
	templateId: string
): Promise<ImageUploadResult | ImageUploadError> {
	try {
		const frontImage = formData.get('frontImage') as Blob;
		const backImage = formData.get('backImage') as Blob;
		const frontImagePreview = formData.get('frontImagePreview') as Blob;
		const backImagePreview = formData.get('backImagePreview') as Blob;

		if (!frontImage || !backImage) {
			return { error: 'Missing image files' };
		}

		const cardId = uuidv4();

		const variants = [
			{ variant: 'full' as const, side: 'front' as const, blob: frontImage, ext: 'png' },
			{ variant: 'full' as const, side: 'back' as const, blob: backImage, ext: 'png' },
			{ variant: 'preview' as const, side: 'front' as const, blob: frontImagePreview, ext: 'jpg' },
			{ variant: 'preview' as const, side: 'back' as const, blob: backImagePreview, ext: 'jpg' }
		];

		const uploads = await Promise.allSettled(
			variants.map(async (v) => {
				if (!v.blob) return null;
				const path = getCardAssetPath(orgId, templateId, cardId, v.variant, v.side, v.ext);
				await uploadToR2(
					path,
					v.blob,
					v.blob.type || (v.ext === 'png' ? 'image/png' : 'image/jpeg')
				);
				return { variant: v.variant, side: v.side, path };
			})
		);

		const results: Record<string, string> = {};
		const errors: unknown[] = [];

		uploads.forEach((res) => {
			if (res.status === 'fulfilled' && res.value) {
				const key = `${res.value.variant}${res.value.side.charAt(0).toUpperCase() + res.value.side.slice(1)}Path`;
				results[key] = res.value.path;
			} else if (res.status === 'rejected') {
				errors.push(res.reason);
			}
		});

		if (errors.length > 0) {
			// Cleanup any successful uploads
			await Promise.allSettled(
				uploads.map((res) =>
					res.status === 'fulfilled' && res.value ? deleteFromR2(res.value.path) : null
				)
			);
			const errMsg = errors[0] instanceof Error ? errors[0].message : 'Unknown error';
			return { error: `Image upload failed: ${errMsg}` };
		}

		// Handle Raw Assets (Photos, Signatures)
		const rawAssets: Record<string, { path: string; type: string }> = {};
		for (const [key, value] of formData.entries()) {
			if (key.startsWith('raw_asset_') && value instanceof Blob) {
				const variableName = key.replace('raw_asset_', '');
				const ext = value.type === 'image/png' ? 'png' : 'jpg';
				const path = getCardRawAssetPath(orgId, templateId, cardId, variableName, ext);
				await uploadToR2(path, value, value.type);
				rawAssets[variableName] = { path, type: value.type };
			}
		}

		return {
			cardId,
			frontPath: results.fullFrontPath,
			backPath: results.fullBackPath,
			frontPreviewPath: results.previewFrontPath,
			backPreviewPath: results.previewBackPath,
			rawAssets
		} as ImageUploadResult;
	} catch (err) {
		return {
			error: err instanceof Error ? err.message : 'Failed to handle image uploads'
		};
	}
}

// --- Organization Shortform ---

/**
 * Get or generate organization shortform for slug generation
 */
export async function getOrgShortform(orgId: string): Promise<string> {
	// Try to fetch existing shortform
	const [org] = await db
		.select({
			shortform: organizations.shortform,
			urlSlug: organizations.urlSlug,
			name: organizations.name
		})
		.from(organizations)
		.where(eq(organizations.id, orgId))
		.limit(1);

	if (org?.shortform) {
		return org.shortform;
	}

	// Generate shortform from urlSlug or name
	const source = org?.urlSlug || org?.name || 'ORG';
	const newShortform = generateShortform(source);

	// Try to save the generated shortform
	try {
		await db
			.update(organizations)
			.set({ shortform: newShortform, updatedAt: new Date() })
			.where(eq(organizations.id, orgId));
	} catch (error) {
		// If save fails (e.g., unique constraint), just use the generated value
		console.warn('[getOrgShortform] Could not save shortform:', error);
	}

	return newShortform;
}

// --- ID Card Save with Digital Profile ---

/**
 * Save ID card data to database with optional digital profile creation
 *
 * Features:
 * - Creates idcard record with optional orgMetadata
 * - Creates digitalCard with org-branded slug (e.g., PNGS-abc1234567)
 * - Supports email-based claiming via magic link
 * - Retry logic for slug collisions
 * - Cleanup on failure
 */
export async function saveIdCardData(options: SaveIdCardOptions): Promise<SaveIdCardResult> {
	const {
		cardId = uuidv4(),
		templateId,
		orgId,
		frontPath,
		backPath,
		frontPreviewPath,
		backPreviewPath,
		rawAssets = {},
		formFields,
		orgMetadata,
		createDigitalCard,
		recipientEmail,
		userId,
		preGeneratedSlug // Use client pre-generated slug for QR consistency
	} = options;

	// Validate orgMetadata if provided
	if (orgMetadata) {
		const validation = validateOrgMetadata(orgMetadata);
		if (!validation.success) {
			return { success: false, error: validation.error };
		}
	}

	// Enhanced cleanup function with detailed logging
	const cleanup = async (): Promise<CleanupResult> => {
		const pathsToDelete = [
			frontPath,
			backPath,
			...(frontPreviewPath ? [frontPreviewPath] : []),
			...(backPreviewPath ? [backPreviewPath] : []),
			...Object.values(rawAssets).map((asset) => asset.path)
		].filter(Boolean);

		const deletedPaths: string[] = [];
		const failedPaths: string[] = [];
		const errors: Array<{ path: string; error: string }> = [];

		const results = await Promise.allSettled(
			pathsToDelete.map(async (path) => {
				await deleteFromR2(path);
				return path;
			})
		);

		results.forEach((result, index) => {
			const path = pathsToDelete[index];
			if (result.status === 'fulfilled') {
				deletedPaths.push(path);
				console.log(`[Cleanup] Successfully deleted: ${path}`);
			} else {
				failedPaths.push(path);
				const errorMsg =
					result.reason instanceof Error ? result.reason.message : String(result.reason);
				errors.push({ path, error: errorMsg });
				console.error(`[Cleanup] Failed to delete ${path}:`, errorMsg);
			}
		});

		if (failedPaths.length > 0) {
			console.warn(
				`[Cleanup] Partial cleanup: ${deletedPaths.length}/${pathsToDelete.length} files deleted`
			);
		} else {
			console.log(`[Cleanup] Complete: ${deletedPaths.length} files deleted`);
		}

		return {
			success: failedPaths.length === 0,
			deletedPaths,
			failedPaths,
			errors
		};
	};

	try {
		// Step 1: Create ID Card
		const [idCard] = await db
			.insert(idcards)
			.values({
				id: cardId as any,
				templateId,
				orgId,
				frontImage: frontPath,
				backImage: backPath,
				frontImageLowRes: frontPreviewPath,
				backImageLowRes: backPreviewPath,
				originalAssets: rawAssets,
				data: formFields,
				orgMetadata: orgMetadata || {},
				createdAt: new Date(),
				updatedAt: new Date()
			})
			.returning();

		if (!idCard) {
			await cleanup();
			return { success: false, error: 'Failed to create ID card record' };
		}

		// Step 2: Create Digital Card if requested
		let digitalCardResult:
			| { id: string; slug: string; status: string; claimCode?: string; profileUrl?: string }
			| undefined;

		// Step 2: Create Digital Card if requested OR if we have a pre-generated slug (to ensure QR works)
		if (createDigitalCard || preGeneratedSlug) {
			try {
				// Get org shortform for branded slug (needed if we have to generate a new one)
				const orgShortform = await getOrgShortform(orgId);

				// Use preGeneratedSlug from client if available (ensures QR code matches)
				// Only generate a new slug if pre-generated one is not provided or already taken
				let slug: string | null = null;
				let attempts = 0;
				const maxAttempts = 5;

				// First, try the pre-generated slug from the client
				if (preGeneratedSlug) {
					const existingPreGen = await db
						.select({ id: digitalCards.id })
						.from(digitalCards)
						.where(eq(digitalCards.slug, preGeneratedSlug))
						.limit(1);

					if (existingPreGen.length === 0) {
						slug = preGeneratedSlug;
						console.log('[saveIdCardData] Using pre-generated slug:', slug);
					} else {
						console.warn('[saveIdCardData] Pre-generated slug collision, generating new one');
					}
				}

				// If no pre-generated slug or it was taken, generate a new one
				while (!slug && attempts < maxAttempts) {
					attempts++;
					const candidateSlug = generateDigitalCardSlug(orgShortform);

					// Check if slug exists
					const existing = await db
						.select({ id: digitalCards.id })
						.from(digitalCards)
						.where(eq(digitalCards.slug, candidateSlug))
						.limit(1);

					if (existing.length === 0) {
						slug = candidateSlug;
					}
				}

				if (!slug) {
					console.error('[saveIdCardData] Failed to generate unique slug after 5 attempts');
					// Continue without digital card rather than failing the whole operation
				} else {
					// Generate claim credentials
					const claimCode = generateClaimCode();
					const claimToken = generateClaimToken();
					const claimExpiry = calculateClaimExpiry(7); // 7 days
					const claimCodeHash = await hashClaimCode(claimCode);

					// Determine initial status
					// Active: Only if explicitly requested AND we have a user
					// Unclaimed: If not requested (just saving slug) OR requested but no user
					const initialStatus = createDigitalCard && userId ? 'active' : 'unclaimed';

					const [dcData] = await db
						.insert(digitalCards)
						.values({
							slug,
							linkedIdCardId: idCard.id,
							orgId,
							status: initialStatus,
							claimCodeHash,
							recipientEmail: recipientEmail || null,
							claimToken,
							claimTokenExpiresAt: claimExpiry,
							ownerId: userId || null,
							personalMetadata: {},
							createdAt: new Date(),
							updatedAt: new Date()
						})
						.returning();

					if (dcData) {
						console.log(`ID cards saved with : ${slug}`);

						digitalCardResult = {
							id: dcData.id,
							slug: dcData.slug,
							status: dcData.status || 'unclaimed',
							claimCode: userId ? undefined : claimCode, // Only return claim code if unclaimed
							profileUrl: buildDigitalProfileUrl(dcData.slug)
						};
					}
				}
			} catch (dcError) {
				// Log but don't fail - digital card is optional
				console.error('[saveIdCardData] Failed to create digital card:', dcError);
			}
		}

		return {
			success: true,
			data: {
				idCard,
				digitalCard: digitalCardResult
			}
		};
	} catch (err) {
		console.error('[saveIdCardData] Error:', err);
		await cleanup();
		return {
			success: false,
			error: err instanceof Error ? err.message : 'Failed to save ID card data'
		};
	}
}

// --- Legacy Format Conversion ---

/**
 * Convert new result format to legacy format for backwards compatibility
 */
export function toLegacyFormat(result: SaveIdCardResult): {
	data?: Record<string, unknown>;
	digitalCard?: Record<string, unknown>;
	claimCode?: string;
	error?: string;
} {
	if (!result.success || !result.data) {
		return { error: result.error };
	}

	const { idCard, digitalCard } = result.data;

	return {
		data: {
			...idCard,
			template_id: idCard.templateId,
			org_id: idCard.orgId,
			front_image: idCard.frontImage,
			back_image: idCard.backImage,
			front_image_low_res: idCard.frontImageLowRes,
			back_image_low_res: idCard.backImageLowRes
		},
		digitalCard: digitalCard
			? {
					id: digitalCard.id,
					slug: digitalCard.slug,
					linked_id_card_id: idCard.id,
					org_id: idCard.orgId,
					status: digitalCard.status,
					profile_url: digitalCard.profileUrl
				}
			: undefined,
		claimCode: digitalCard?.claimCode
	};
}
