/**
 * Password Strength Validation
 * SECURITY: Client-side password strength checking and enforcement
 * 
 * NOTE: Supabase Auth handles the actual password storage and hashing.
 * These utilities provide client-side feedback and can be used to
 * enforce stronger passwords before submission.
 */

export interface PasswordStrengthResult {
	score: number; // 0-4 (0 = very weak, 4 = very strong)
	feedback: string[];
	isStrong: boolean;
	label: 'Very Weak' | 'Weak' | 'Fair' | 'Strong' | 'Very Strong';
}

/**
 * Common passwords list (shortened for bundle size)
 * In production, consider using a server-side check against a larger list
 */
const COMMON_PASSWORDS = new Set([
	'password', 'password1', 'password123', '123456', '12345678', '123456789',
	'qwerty', 'abc123', 'monkey', 'letmein', 'dragon', 'iloveyou', 'trustno1',
	'admin', 'welcome', 'login', 'master', 'hello', 'freedom', 'whatever',
	'qazwsx', 'passw0rd', 'shadow', 'sunshine', 'princess', 'football'
]);

/**
 * Check for sequential characters (abc, 123, etc.)
 */
function hasSequentialChars(password: string): boolean {
	const sequences = ['abcdefghijklmnopqrstuvwxyz', '0123456789', 'qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
	const lowerPass = password.toLowerCase();
	
	for (const seq of sequences) {
		for (let i = 0; i <= seq.length - 3; i++) {
			if (lowerPass.includes(seq.substring(i, i + 3))) {
				return true;
			}
		}
	}
	return false;
}

/**
 * Check for repeated characters (aaa, 111, etc.)
 */
function hasRepeatedChars(password: string): boolean {
	return /(.)\1{2,}/.test(password);
}

/**
 * Evaluate password strength
 * 
 * Scoring criteria:
 * - Length (min 8, better 12+, best 16+)
 * - Character variety (lowercase, uppercase, numbers, symbols)
 * - No common passwords
 * - No sequential characters
 * - No repeated characters
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
	const feedback: string[] = [];
	let score = 0;

	// Empty password
	if (!password) {
		return {
			score: 0,
			feedback: ['Enter a password'],
			isStrong: false,
			label: 'Very Weak'
		};
	}

	// Check against common passwords
	if (COMMON_PASSWORDS.has(password.toLowerCase())) {
		return {
			score: 0,
			feedback: ['This is a commonly used password'],
			isStrong: false,
			label: 'Very Weak'
		};
	}

	// Length checks
	if (password.length < 8) {
		feedback.push('Use at least 8 characters');
	} else if (password.length < 12) {
		score += 1;
		feedback.push('Consider using 12+ characters');
	} else if (password.length < 16) {
		score += 2;
	} else {
		score += 3;
	}

	// Character variety checks
	const hasLowercase = /[a-z]/.test(password);
	const hasUppercase = /[A-Z]/.test(password);
	const hasNumbers = /[0-9]/.test(password);
	const hasSymbols = /[^a-zA-Z0-9]/.test(password);

	if (!hasLowercase) feedback.push('Add lowercase letters');
	if (!hasUppercase) feedback.push('Add uppercase letters');
	if (!hasNumbers) feedback.push('Add numbers');
	if (!hasSymbols) feedback.push('Add symbols (!@#$%^&*)');

	// Award points for variety
	const varietyCount = [hasLowercase, hasUppercase, hasNumbers, hasSymbols].filter(Boolean).length;
	score += Math.min(varietyCount - 1, 2); // Up to 2 bonus points

	// Penalize sequential characters
	if (hasSequentialChars(password)) {
		score = Math.max(0, score - 1);
		feedback.push('Avoid sequential characters (abc, 123)');
	}

	// Penalize repeated characters
	if (hasRepeatedChars(password)) {
		score = Math.max(0, score - 1);
		feedback.push('Avoid repeated characters (aaa)');
	}

	// Cap score at 4
	score = Math.min(4, Math.max(0, score));

	// Determine label
	const labels: PasswordStrengthResult['label'][] = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
	const label = labels[score];

	return {
		score,
		feedback: feedback.length > 0 ? feedback : ['Password looks good!'],
		isStrong: score >= 3,
		label
	};
}

/**
 * Minimum requirements for password
 */
export const PASSWORD_REQUIREMENTS = {
	minLength: 8,
	recommendedLength: 12,
	requireUppercase: true,
	requireLowercase: true,
	requireNumbers: true,
	requireSymbols: false, // Recommended but not required
	maxLength: 128
};

/**
 * Validate password meets minimum requirements
 */
export function validatePasswordRequirements(password: string): {
	valid: boolean;
	errors: string[];
} {
	const errors: string[] = [];

	if (password.length < PASSWORD_REQUIREMENTS.minLength) {
		errors.push(`Password must be at least ${PASSWORD_REQUIREMENTS.minLength} characters`);
	}

	if (password.length > PASSWORD_REQUIREMENTS.maxLength) {
		errors.push(`Password must be less than ${PASSWORD_REQUIREMENTS.maxLength} characters`);
	}

	if (PASSWORD_REQUIREMENTS.requireUppercase && !/[A-Z]/.test(password)) {
		errors.push('Password must contain at least one uppercase letter');
	}

	if (PASSWORD_REQUIREMENTS.requireLowercase && !/[a-z]/.test(password)) {
		errors.push('Password must contain at least one lowercase letter');
	}

	if (PASSWORD_REQUIREMENTS.requireNumbers && !/[0-9]/.test(password)) {
		errors.push('Password must contain at least one number');
	}

	if (PASSWORD_REQUIREMENTS.requireSymbols && !/[^a-zA-Z0-9]/.test(password)) {
		errors.push('Password must contain at least one symbol');
	}

	if (COMMON_PASSWORDS.has(password.toLowerCase())) {
		errors.push('This password is too common. Please choose a different one.');
	}

	return {
		valid: errors.length === 0,
		errors
	};
}
