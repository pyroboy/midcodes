// ─── Character Sets (ported from Python string module) ───
const DIGITS = '0123456789';
const UPPERCASE = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWERCASE = 'abcdefghijklmnopqrstuvwxyz';
const LETTERS = UPPERCASE + LOWERCASE;
const HEXDIGITS = '0123456789ABCDEFabcdef';
const PUNCTUATION = '!\"#$%&\'()*+,-./:;<=>?@[\\]^_`{|}~';

export const CHARACTER_SETS = [
	{ id: 1, label: 'Digits + Uppercase', chars: DIGITS + UPPERCASE },
	{ id: 2, label: 'Lowercase', chars: LOWERCASE },
	{ id: 3, label: 'Digits Only', chars: DIGITS },
	{ id: 4, label: 'Uppercase Only', chars: UPPERCASE },
	{ id: 5, label: 'Letters (Upper + Lower)', chars: LETTERS },
	{ id: 6, label: 'Letters + Digits', chars: LETTERS + DIGITS },
	{ id: 7, label: 'Punctuation', chars: PUNCTUATION },
	{ id: 8, label: 'Hexadecimal', chars: HEXDIGITS },
	{ id: 9, label: 'All (Letters + Digits + Punctuation)', chars: DIGITS + LETTERS + PUNCTUATION }
] as const;

// ─── Presets (from GENERATION NOTES.txt) ─────────────────
export const PRESETS = [
	{ name: 'Mama Maly\'s - Customer', prefix: 'malys-', profile: 'Customer', server: 'hotspot1', hotspot: 'Mama Maly\'s' },
	{ name: 'Mama Maly\'s - Tenants', prefix: 'tenant-', profile: 'Tenants', server: 'hotspot1', hotspot: 'Mama Maly\'s' },
	{ name: 'Mama Maly\'s - Monthly', prefix: 'malys30-', profile: 'Monthly', server: 'hotspot1', hotspot: 'Mama Maly\'s' },
	{ name: 'Figaro - Customer', prefix: 'coffee-', profile: 'Customer', server: 'hotspot1', hotspot: 'Figaro' },
	{ name: 'Figaro - Employee', prefix: 'coffee-', profile: 'Employee', server: 'hotspot1', hotspot: 'Figaro' },
	{ name: 'Paengs - Customer', prefix: 'paengs-', profile: 'Customer', server: 'hotspot1', hotspot: 'Paengs' },
	{ name: 'Paengs - Employee', prefix: 'fried-', profile: 'Employee', server: 'hotspot1', hotspot: 'Paengs' },
	{ name: 'Paengs - Admin', prefix: 'roasted-', profile: 'Admin', server: 'hotspot1', hotspot: 'Paengs' }
] as const;

// ─── Types ───────────────────────────────────────────────
export interface VoucherConfig {
	hotspot: string;
	prefix: string;
	quantity: number;
	codeLength: number;
	charSetId: number;
	userMode: 'username_password' | 'username_only';
	withQR: boolean;
	voucherDuration: string;
	voucherValidity: string;
	profile: string;
	server: string;
	timeLimit: string;
	dataLimit: string;
}

export interface GeneratedVoucher {
	code: string;
	mikrotikScript: string;
	qrUrl: string | null;
}

export interface GenerationResult {
	vouchers: GeneratedVoucher[];
	fullScript: string;
}

// ─── Core Generation Logic ───────────────────────────────
function randomCode(charSet: string, length: number): string {
	const arr = new Uint32Array(length);
	crypto.getRandomValues(arr);
	return Array.from(arr, (v) => charSet[v % charSet.length]).join('');
}

export function generateVouchers(config: VoucherConfig): GenerationResult {
	const charSetDef = CHARACTER_SETS.find((c) => c.id === config.charSetId);
	if (!charSetDef) throw new Error('Invalid character set');

	const vouchers: GeneratedVoucher[] = [];
	const scriptLines: string[] = ['/ip hotspot user'];

	for (let i = 0; i < config.quantity; i++) {
		const code = config.prefix + randomCode(charSetDef.chars, config.codeLength);

		// Build MikroTik script line
		let line = `add name="${code}"`;
		if (config.userMode === 'username_password') {
			line += ` password="${code}"`;
		}
		line += ` server="${config.server}" profile="${config.profile}"`;
		line += ` comment="${config.voucherValidity},${config.codeLength},0,${config.prefix}"`;
		if (config.timeLimit) line += ` limit-uptime="${config.timeLimit}"`;
		if (config.dataLimit) line += ` limit-bytes-total="${config.dataLimit}"`;

		// QR code URL
		let qrUrl: string | null = null;
		if (config.withQR) {
			const loginUrl =
				config.userMode === 'username_password'
					? `http://${config.server}/login?username=${code}&password=${code}`
					: `http://${config.server}/login?username=${code}`;
			qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(loginUrl)}`;
		}

		vouchers.push({ code, mikrotikScript: line, qrUrl });
		scriptLines.push(line);
	}

	return { vouchers, fullScript: scriptLines.join('\n') };
}
