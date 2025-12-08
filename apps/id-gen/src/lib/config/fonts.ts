// Dynamically import webfontloader to avoid SSR issues
let WebFontLoader: typeof import('webfontloader') | null = null;

export interface FontConfig {
	family: string;
	category: string;
	variants: string[];
}

export const fonts: FontConfig[] = [
	{
		family: 'Roboto',
		category: 'sans-serif',
		variants: ['300', '400', '500', '700']
	},
	{
		family: 'Open Sans',
		category: 'sans-serif',
		variants: ['300', '400', '600', '700']
	},
	{
		family: 'Lato',
		category: 'sans-serif',
		variants: ['300', '400', '700']
	},
	{
		family: 'Montserrat',
		category: 'sans-serif',
		variants: ['300', '400', '500', '700']
	},
	{
		family: 'Poppins',
		category: 'sans-serif',
		variants: ['300', '400', '500', '700']
	},
	{
		family: 'Source Sans Pro',
		category: 'sans-serif',
		variants: ['300', '400', '600', '700']
	},
	{
		family: 'Playfair Display',
		category: 'serif',
		variants: ['400', '500', '700']
	}
];

// CDN URLs for 3D rendering (jsDelivr @fontsource)
// Used by TemplateCard3D.svelte for Threlte/Troika text rendering
// NOTE: System fonts (Arial, Impact, etc.) are mapped to similar web fonts
export const FONT_CDN_URLS: Record<string, Record<string, Record<string, string>>> = {
	// System font mappings (Arial -> Roboto, Impact -> Oswald, Arial Black -> Roboto Black/900)
	Arial: {
		'400': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-400-normal.woff',
			italic: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-400-italic.woff'
		},
		'700': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-700-normal.woff',
			italic: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-700-italic.woff'
		}
	},
	'Arial Black': {
		'400': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-900-normal.woff'
		},
		'700': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-900-normal.woff'
		}
	},
	Impact: {
		'400': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/oswald/files/oswald-latin-700-normal.woff'
		},
		'700': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/oswald/files/oswald-latin-700-normal.woff'
		}
	},
	// Standard web fonts
	Roboto: {
		'400': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-400-normal.woff',
			italic: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-400-italic.woff'
		},
		'700': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-700-normal.woff',
			italic: 'https://cdn.jsdelivr.net/npm/@fontsource/roboto/files/roboto-latin-700-italic.woff'
		}
	},
	'Open Sans': {
		'400': {
			normal:
				'https://cdn.jsdelivr.net/npm/@fontsource/open-sans/files/open-sans-latin-400-normal.woff'
		},
		'700': {
			normal:
				'https://cdn.jsdelivr.net/npm/@fontsource/open-sans/files/open-sans-latin-700-normal.woff'
		}
	},
	Lato: {
		'400': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/lato/files/lato-latin-400-normal.woff'
		},
		'700': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/lato/files/lato-latin-700-normal.woff'
		}
	},
	Montserrat: {
		'400': {
			normal:
				'https://cdn.jsdelivr.net/npm/@fontsource/montserrat/files/montserrat-latin-400-normal.woff'
		},
		'700': {
			normal:
				'https://cdn.jsdelivr.net/npm/@fontsource/montserrat/files/montserrat-latin-700-normal.woff'
		}
	},
	Poppins: {
		'400': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/poppins/files/poppins-latin-400-normal.woff'
		},
		'700': {
			normal: 'https://cdn.jsdelivr.net/npm/@fontsource/poppins/files/poppins-latin-700-normal.woff'
		}
	},
	'Source Sans Pro': {
		'400': {
			normal:
				'https://cdn.jsdelivr.net/npm/@fontsource/source-sans-pro/files/source-sans-pro-latin-400-normal.woff'
		},
		'700': {
			normal:
				'https://cdn.jsdelivr.net/npm/@fontsource/source-sans-pro/files/source-sans-pro-latin-700-normal.woff'
		}
	},
	'Playfair Display': {
		'400': {
			normal:
				'https://cdn.jsdelivr.net/npm/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff'
		},
		'700': {
			normal:
				'https://cdn.jsdelivr.net/npm/@fontsource/playfair-display/files/playfair-display-latin-700-normal.woff'
		}
	}
};

export function getAllFontFamilies(): string[] {
	return fonts.map((font) => font.family);
}

export function isFontLoaded(fontFamily: string): boolean {
	if (typeof window === 'undefined') {
		return true; // During SSR, assume fonts are loaded
	}

	const testString = 'mmmmmmmmmmlli';
	const testSize = '72px';
	const canvas = document.createElement('canvas');
	const context = canvas.getContext('2d');
	if (!context) return false;

	context.font = `${testSize} ${fontFamily}, sans-serif`;
	const baselineWidth = context.measureText(testString).width;

	context.font = `${testSize} sans-serif`;
	const fallbackWidth = context.measureText(testString).width;

	return baselineWidth !== fallbackWidth;
}

let fontsLoaded = false;

export async function loadGoogleFonts(): Promise<void> {
	// Check if we're in a browser environment
	if (typeof window === 'undefined' || typeof document === 'undefined' || fontsLoaded) {
		return Promise.resolve();
	}

	// Dynamically import webfontloader only in browser
	if (!WebFontLoader) {
		try {
			WebFontLoader = await import('webfontloader');
		} catch (error) {
			console.error('Failed to load webfontloader:', error);
			return Promise.resolve();
		}
	}

	return new Promise((resolve) => {
		const fontFamilies = fonts.map((font) => `${font.family}:${font.variants.join(',')}`);
		console.log('Loading fonts:', fontFamilies);

		// Add error handling wrapper
		try {
			WebFontLoader?.load({
				google: {
					families: fontFamilies
				},
				active: () => {
					fontsLoaded = true;
					console.log('✅ All fonts loaded successfully:', fontFamilies);
					resolve();
				},
				inactive: () => {
					console.warn('⚠️ Some fonts failed to load');
					// Log which fonts failed to load
					try {
						const failedFonts = fonts
							.map((font) => font.family)
							.filter((family) => !isFontLoaded(family));
						if (failedFonts.length > 0) {
							console.warn('Failed fonts:', failedFonts);
						}
					} catch (e) {
						console.warn('Error checking failed fonts:', e);
					}
					resolve(); // Resolve anyway to prevent blocking
				},
				timeout: 5000 // 5 seconds timeout
			});
		} catch (error) {
			console.error('Error initializing font loader:', error);
			resolve();
		}
	});
}
