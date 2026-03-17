import { z } from 'zod';

/**
 * Metadata Schemas for Digital Profile Feature
 *
 * orgMetadata: Admin-controlled data on idcards (2KB max)
 * personalMetadata: User-editable data on digitalCards
 */

// --- Organization Metadata (Admin-Controlled) ---

export const orgMetadataSchema = z
	.object({
		employeeId: z.string().max(100).optional(),
		department: z.string().max(200).optional(),
		jobTitle: z.string().max(200).optional(),
		badgeLevel: z.string().max(50).optional(),
		workEmail: z.string().email().max(255).optional(),
		workPhone: z.string().max(50).optional(),
		accessZones: z.array(z.string().max(50)).max(20).optional(),
		startDate: z.string().max(20).optional(), // ISO date string
		customFields: z.record(z.string().max(100), z.string().max(500)).optional()
	})
	.refine((data) => JSON.stringify(data).length <= 2048, {
		message: 'Organization metadata exceeds 2KB limit'
	});

export type OrgMetadata = z.infer<typeof orgMetadataSchema>;

// --- Personal Metadata (User-Editable) ---

export const socialLinkSchema = z.object({
	platform: z.string().max(50),
	url: z.string().url().max(500)
});

export const personalMetadataSchema = z.object({
	displayName: z.string().max(100).optional(),
	bio: z.string().max(500).optional(),
	pronouns: z.string().max(50).optional(),
	socialLinks: z.array(socialLinkSchema).max(10).optional(),
	languages: z.array(z.string().max(50)).max(10).optional(),
	timezone: z.string().max(50).optional(),
	publicEmail: z.string().email().max(255).optional()
});

export type PersonalMetadata = z.infer<typeof personalMetadataSchema>;
export type SocialLink = z.infer<typeof socialLinkSchema>;

// --- Validation Helpers ---

/**
 * Validate org metadata with 2KB size check
 */
export function validateOrgMetadata(data: unknown): {
	success: boolean;
	data?: OrgMetadata;
	error?: string;
} {
	const result = orgMetadataSchema.safeParse(data);
	if (!result.success) {
		return {
			success: false,
			error: result.error.issues[0]?.message || 'Invalid organization metadata'
		};
	}
	return { success: true, data: result.data };
}

/**
 * Validate personal metadata
 */
export function validatePersonalMetadata(data: unknown): {
	success: boolean;
	data?: PersonalMetadata;
	error?: string;
} {
	const result = personalMetadataSchema.safeParse(data);
	if (!result.success) {
		return {
			success: false,
			error: result.error.issues[0]?.message || 'Invalid personal metadata'
		};
	}
	return { success: true, data: result.data };
}

/**
 * Calculate byte size of JSON data
 */
export function getJsonByteSize(data: unknown): number {
	return new TextEncoder().encode(JSON.stringify(data)).length;
}

/**
 * Check if data fits within 2KB limit
 */
export function isWithin2KBLimit(data: unknown): boolean {
	return getJsonByteSize(data) <= 2048;
}
