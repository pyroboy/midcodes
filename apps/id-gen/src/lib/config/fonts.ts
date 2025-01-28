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

export function getAllFontFamilies(): string[] {
  return fonts.map(font => font.family);
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
  if (typeof window === 'undefined' || fontsLoaded) {
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
    WebFontLoader?.load({
      google: {
        families: fonts.map(font => `${font.family}:${font.variants.join(',')}`)
      },
      active: () => {
        fontsLoaded = true;
        resolve();
      },
      inactive: () => {
        console.warn('Some fonts failed to load');
        resolve(); // Resolve anyway to prevent blocking
      },
      timeout: 5000 // 5 seconds timeout
    });
  });
}
