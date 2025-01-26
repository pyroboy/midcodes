import WebFont from 'webfontloader';

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

export async function loadGoogleFonts(): Promise<void> {
  return new Promise((resolve, reject) => {
    WebFont.load({
      google: {
        families: fonts.map(font => `${font.family}:${font.variants.join(',')}`)
      },
      active: resolve,
      inactive: reject,
      timeout: 5000
    });
  });
}
