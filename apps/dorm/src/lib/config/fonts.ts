export interface FontConfig {
	family: string;
	weights: number[];
	styles?: ('normal' | 'italic')[];
	category: 'sans-serif' | 'serif' | 'monospace';
}

export const systemFonts: FontConfig[] = [
	{ family: 'Arial', weights: [400, 700], category: 'sans-serif' },
	{ family: 'Times New Roman', weights: [400, 700], category: 'serif' },
	{ family: 'Courier New', weights: [400, 700], category: 'monospace' },
	{ family: 'Georgia', weights: [400, 700], category: 'serif' },
	{ family: 'Verdana', weights: [400, 700], category: 'sans-serif' },
	{ family: 'Tahoma', weights: [400, 700], category: 'sans-serif' }
];

export const googleFonts: FontConfig[] = [
	{
		family: 'Roboto',
		weights: [100, 300, 400, 500, 700, 900],
		styles: ['normal', 'italic'],
		category: 'sans-serif'
	},
	{
		family: 'Open Sans',
		weights: [300, 400, 500, 600, 700, 800],
		styles: ['normal', 'italic'],
		category: 'sans-serif'
	},
	{
		family: 'Lato',
		weights: [100, 300, 400, 700, 900],
		styles: ['normal', 'italic'],
		category: 'sans-serif'
	},
	{
		family: 'Montserrat',
		weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
		styles: ['normal', 'italic'],
		category: 'sans-serif'
	},
	{
		family: 'Source Sans Pro',
		weights: [200, 300, 400, 600, 700, 900],
		styles: ['normal', 'italic'],
		category: 'sans-serif'
	},
	{
		family: 'Poppins',
		weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
		styles: ['normal', 'italic'],
		category: 'sans-serif'
	},
	{
		family: 'Inter',
		weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
		styles: ['normal'],
		category: 'sans-serif'
	},
	{
		family: 'Noto Sans',
		weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
		styles: ['normal', 'italic'],
		category: 'sans-serif'
	},
	{
		family: 'IBM Plex Sans',
		weights: [100, 200, 300, 400, 500, 600, 700],
		styles: ['normal', 'italic'],
		category: 'sans-serif'
	},
	{
		family: 'Merriweather',
		weights: [300, 400, 700, 900],
		styles: ['normal', 'italic'],
		category: 'serif'
	},
	{
		family: 'Playfair Display',
		weights: [100, 200, 300, 400, 500, 600, 700, 800, 900],
		styles: ['normal', 'italic'],
		category: 'serif'
	},
	{
		family: 'JetBrains Mono',
		weights: [100, 200, 300, 400, 500, 600, 700, 800],
		styles: ['normal', 'italic'],
		category: 'monospace'
	},
	{
		family: 'Fira Code',
		weights: [300, 400, 500, 600, 700],
		styles: ['normal'],
		category: 'monospace'
	}
];

export const fonts: FontConfig[] = [...googleFonts, ...systemFonts];

export function getFontUrl(fonts: FontConfig[]): string {
	if (!fonts.length) {
		// console.log('No fonts provided to getFontUrl');
		return '';
	}

	const fontFamilies = fonts.map((font) => {
		const encodedFamily = font.family.replace(/\s+/g, '+');
		const hasItalic = font.styles?.includes('italic');
		const weights = font.weights.join(';');

		// console.log(`Processing font: ${font.family}`);
		// console.log(`Encoded family: ${encodedFamily}`);
		// console.log(`Has italic: ${hasItalic}`);
		// console.log(`Weights: ${weights}`);

		let fontUrl = '';
		if (hasItalic) {
			const italicWeights = font.weights.map((w) => `1,${w}`).join(';');
			const normalWeights = font.weights.map((w) => `0,${w}`).join(';');
			fontUrl = `family=${encodedFamily}:ital,wght@${normalWeights};${italicWeights}`;
		} else {
			fontUrl = `family=${encodedFamily}:wght@${weights}`;
		}

		// console.log(`Generated URL part for ${font.family}:`, fontUrl);
		return fontUrl;
	});

	const finalUrl = `https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=swap`;
	// console.log('Final generated URL:', finalUrl);
	return finalUrl;
}

export function loadGoogleFonts(): Promise<void> {
	// console.log('Starting loadGoogleFonts');

	if (typeof window === 'undefined') {
		// console.log('Window is undefined, skipping font loading');
		return Promise.resolve();
	}

	return new Promise((resolve, reject) => {
		// console.log('Checking for existing font stylesheet');
		const existingLink = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
		if (existingLink) {
			// console.log('Font stylesheet already exists, resolving');
			resolve();
			return;
		}

		// console.log('Creating preconnect links');
		const preconnectGoogle = document.createElement('link');
		preconnectGoogle.rel = 'preconnect';
		preconnectGoogle.href = 'https://fonts.googleapis.com';

		const preconnectGstatic = document.createElement('link');
		preconnectGstatic.rel = 'preconnect';
		preconnectGstatic.href = 'https://fonts.gstatic.com';
		preconnectGstatic.crossOrigin = 'anonymous';

		// console.log('Creating font stylesheet link');
		const link = document.createElement('link');
		const fontUrl = getFontUrl(googleFonts);
		link.href = fontUrl;
		link.rel = 'stylesheet';

		const loadTimeout = setTimeout(() => {
			console.error('Font loading timed out after 5 seconds');
			reject(new Error('Font loading timeout'));
		}, 5000);

		const loadFonts = async () => {
			try {
				// console.log('Waiting for document.fonts.ready');
				await document.fonts.ready;
				// console.log('Fonts loaded successfully');
				clearTimeout(loadTimeout);
				resolve();
			} catch (err) {
				console.error('Error in loadFonts:', err);
				clearTimeout(loadTimeout);
				reject(err);
			}
		};

		link.onload = () => {
			// console.log('Font stylesheet loaded successfully');
			loadFonts();
		};

		link.onerror = (e) => {
			console.error('Error loading font stylesheet:', e);
			console.error('Failed URL:', link.href);
			clearTimeout(loadTimeout);
			reject(new Error('Failed to load font stylesheet'));
		};

		// console.log('Appending links to document head');
		document.head.appendChild(preconnectGoogle);
		document.head.appendChild(preconnectGstatic);
		document.head.appendChild(link);
	});
}

export function getAllFontFamilies(): string[] {
	return fonts.map((font) => font.family);
}

export function getFontCategories(): ('sans-serif' | 'serif' | 'monospace')[] {
	return Array.from(new Set(fonts.map((font) => font.category)));
}

export function getFontsByCategory(category: 'sans-serif' | 'serif' | 'monospace'): FontConfig[] {
	return fonts.filter((font) => font.category === category);
}

export function getFontWeights(family: string): number[] {
	const font = fonts.find((f) => f.family === family);
	return font ? [...font.weights].sort((a, b) => a - b) : [];
}

export function isValidFontFamily(family: string): boolean {
	return fonts.some((f) => f.family === family);
}

export async function isFontLoaded(family: string): Promise<boolean> {
	if (typeof window === 'undefined') {
		// console.log('Window is undefined, cannot check font loading');
		return false;
	}

	try {
		// console.log(`Checking if font '${family}' is loaded`);
		await document.fonts.ready;
		const isLoaded = document.fonts.check(`1em "${family}"`);
		console.log(`Font '${family}' loaded status:`, isLoaded);
		return isLoaded;
	} catch (error) {
		console.error('Error checking font load status:', error);
		return false;
	}
}
