/**
 * Slug Generation Utilities for Digital Cards
 *
 * Generates org-branded slugs in format: {SHORTFORM}-{10char}
 * Example: PNGS-abc1234567
 */

// Character set for random IDs (lowercase alphanumeric for URL safety)
const ALPHANUMERIC = 'abcdefghijklmnopqrstuvwxyz0123456789';

/**
 * Generate a cryptographically secure random string
 */
function generateSecureRandom(length: number, charset: string = ALPHANUMERIC): string {
	const array = new Uint8Array(length);
	crypto.getRandomValues(array);
	return Array.from(array, (byte) => charset[byte % charset.length]).join('');
}

/**
 * Generate shortform from organization name/slug by removing vowels
 *
 * @example "paengs" -> "PNGS"
 * @example "midcodes" -> "MDCD"
 * @example "ABC Company" -> "BCCM"
 */
export function generateShortform(input: string): string {
	// Remove special characters and spaces, keep only letters and numbers
	const cleaned = input.replace(/[^a-zA-Z0-9]/g, '');

	// Remove vowels
	const consonants = cleaned.replace(/[aeiouAEIOU]/g, '');

	// Uppercase and take first 4 characters
	const shortform = consonants.toUpperCase().substring(0, 4);

	// Fallback: if no consonants remain, use first 4 chars of cleaned input
	if (shortform.length < 2) {
		return cleaned.toUpperCase().substring(0, 4) || 'ORG';
	}

	return shortform;
}

/**
 * Generate a random alphanumeric ID
 *
 * @param length - Length of the ID (default: 10)
 * @returns Lowercase alphanumeric string
 */
export function generateRandomId(length: number = 10): string {
	return generateSecureRandom(length, ALPHANUMERIC);
}

/**
 * Generate a complete digital card slug
 *
 * Format: {SHORTFORM}-{10char}
 * Example: PNGS-abc1234567
 *
 * @param orgShortform - Organization shortform (e.g., "PNGS")
 * @returns Full slug for digital card URL
 */
export function generateDigitalCardSlug(orgShortform: string): string {
	const randomPart = generateRandomId(10);
	return `${orgShortform}-${randomPart}`;
}

/**
 * Generate a claim token for magic link authentication
 *
 * @returns 32-character secure token
 */
export function generateClaimToken(): string {
	return generateSecureRandom(32, ALPHANUMERIC);
}

/**
 * Generate a short claim code for manual entry
 *
 * @returns 6-character uppercase code
 */
export function generateClaimCode(): string {
	return generateSecureRandom(6, 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'); // Exclude ambiguous chars
}

/**
 * Hash a claim code for secure storage using SHA-256
 *
 * @param code - Plain text claim code
 * @returns Hex-encoded SHA-256 hash
 */
export async function hashClaimCode(code: string): Promise<string> {
	const encoder = new TextEncoder();
	const data = encoder.encode(code);
	const hashBuffer = await crypto.subtle.digest('SHA-256', data);
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Verify a claim code against its hash
 *
 * @param code - Plain text claim code to verify
 * @param hash - Stored hash to compare against
 * @returns True if code matches hash
 */
export async function verifyClaimCode(code: string, hash: string): Promise<boolean> {
	const computedHash = await hashClaimCode(code);
	return computedHash === hash;
}

/**
 * Build a full digital profile URL from slug
 *
 * @param slug - Digital card slug
 * @param domain - Domain name (default: kanaya.app)
 * @returns Full URL to digital profile
 */
export function buildDigitalProfileUrl(slug: string, domain: string = 'kanaya.app'): string {
	return `https://${domain}/id/${slug}`;
}

/**
 * Build a claim URL from token
 *
 * @param token - Claim token
 * @param domain - Domain name (default: kanaya.app)
 * @returns Full URL for claiming digital card
 */
export function buildClaimUrl(token: string, domain: string = 'kanaya.app'): string {
	return `https://${domain}/claim/${token}`;
}

/**
 * Validate that a slug fits within QR code version 3 limit (77 chars alphanumeric)
 *
 * @param slug - Slug to validate
 * @param domain - Domain to use for URL
 * @returns True if URL fits within limit
 */
export function validateSlugForQR(slug: string, domain: string = 'kanaya.app'): boolean {
	const fullUrl = buildDigitalProfileUrl(slug, domain);
	return fullUrl.length <= 77;
}

/**
 * Parse a digital card slug into components
 *
 * @param slug - Full slug (e.g., "PNGS-abc1234567")
 * @returns Parsed components or null if invalid
 */
export function parseSlug(slug: string): { shortform: string; randomId: string } | null {
	const match = slug.match(/^([A-Z0-9]{2,8})-([a-z0-9]{10})$/);
	if (!match) return null;
	return {
		shortform: match[1],
		randomId: match[2]
	};
}

/**
 * Calculate expiry date for claim token
 *
 * @param days - Number of days until expiry (default: 7)
 * @returns Date object for expiry
 */
export function calculateClaimExpiry(days: number = 7): Date {
	return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
}
