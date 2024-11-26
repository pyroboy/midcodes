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
    if (!fonts.length) return '';
    
    const fontFamilies = googleFonts.map(font => {
        const encodedFamily = encodeURIComponent(font.family.replace(/\s+/g, '+'));
        const hasItalic = font.styles?.includes('italic');

        switch (font.family) {
            case 'JetBrains Mono':
                return `family=JetBrains+Mono:ital,wght@0,100..800;1,100..800`;
            case 'Inter':
                return `family=Inter:wght@100..900`;
            case 'Roboto':
                return hasItalic 
                    ? `family=Roboto:ital,wght@0,100..900;1,100..900`
                    : `family=Roboto:wght@100..900`;
            case 'Montserrat':
                return hasItalic
                    ? `family=Montserrat:ital,wght@0,100..900;1,100..900`
                    : `family=Montserrat:wght@100..900`;
            case 'Open Sans':
                return hasItalic
                    ? `family=Open+Sans:ital,wght@0,300..800;1,300..800`
                    : `family=Open+Sans:wght@300..800`;
            case 'Poppins':
                return hasItalic
                    ? `family=Poppins:ital,wght@0,100..900;1,100..900`
                    : `family=Poppins:wght@100..900`;
            case 'Noto Sans':
                return hasItalic
                    ? `family=Noto+Sans:ital,wght@0,100..900;1,100..900`
                    : `family=Noto+Sans:wght@100..900`;
            case 'IBM Plex Sans':
                return hasItalic
                    ? `family=IBM+Plex+Sans:ital,wght@0,100..700;1,100..700`
                    : `family=IBM+Plex+Sans:wght@100..700`;
            case 'Fira Code':
                return `family=Fira+Code:wght@300..700`;
            case 'Playfair Display':
                return hasItalic
                    ? `family=Playfair+Display:ital,wght@0,100..900;1,100..900`
                    : `family=Playfair+Display:wght@100..900`;
            case 'Lato':
                return hasItalic
                    ? `family=Lato:ital,wght@0,100,300,400,700,900;1,100,300,400,700,900`
                    : `family=Lato:wght@100,300,400,700,900`;
            case 'Source Sans Pro':
                return hasItalic
                    ? `family=Source+Sans+Pro:ital,wght@0,200,300,400,600,700,900;1,200,300,400,600,700,900`
                    : `family=Source+Sans+Pro:wght@200,300,400,600,700,900`;
            case 'Merriweather':
                return hasItalic
                    ? `family=Merriweather:ital,wght@0,300,400,700,900;1,300,400,700,900`
                    : `family=Merriweather:wght@300,400,700,900`;
            default:
                const weights = font.weights.sort((a, b) => a - b).join(',');
                if (hasItalic) {
                    return `family=${encodedFamily}:ital,wght@0,${weights};1,${weights}`;
                }
                return `family=${encodedFamily}:wght@${weights}`;
        }
    });
    
    return `https://fonts.googleapis.com/css2?${fontFamilies.join('&')}&display=swap`;
}

export function loadGoogleFonts(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (!document) {
            resolve();
            return;
        }

        const preconnectGoogle = document.createElement('link');
        preconnectGoogle.rel = 'preconnect';
        preconnectGoogle.href = 'https://fonts.googleapis.com';

        const preconnectGstatic = document.createElement('link');
        preconnectGstatic.rel = 'preconnect';
        preconnectGstatic.href = 'https://fonts.gstatic.com';
        preconnectGstatic.crossOrigin = 'anonymous';

        const existingLink = document.querySelector('link[href*="fonts.googleapis.com/css2"]');
        if (existingLink) {
            resolve();
            return;
        }

        const link = document.createElement('link');
        link.href = getFontUrl(googleFonts);
        link.rel = 'stylesheet';
        
        const loadTimeout = setTimeout(() => {
            reject(new Error('Font loading timeout'));
        }, 5000);

        const loadFonts = async () => {
            try {
                await document.fonts.ready;
                clearTimeout(loadTimeout);
                console.log('All fonts loaded successfully');
                resolve();
            } catch (err) {
                clearTimeout(loadTimeout);
                console.error('Error loading fonts:', err);
                reject(err);
            }
        };

        link.onload = () => loadFonts();
        link.onerror = () => {
            clearTimeout(loadTimeout);
            console.error('Error loading font stylesheet');
            reject(new Error('Failed to load font stylesheet'));
        };

        document.head.appendChild(preconnectGoogle);
        document.head.appendChild(preconnectGstatic);
        document.head.appendChild(link);
    });
}

export function getAllFontFamilies(): string[] {
    return fonts.map(font => font.family);
}

export function getFontCategories(): ('sans-serif' | 'serif' | 'monospace')[] {
    return Array.from(new Set(fonts.map(font => font.category)));
}

export function getFontsByCategory(category: 'sans-serif' | 'serif' | 'monospace'): FontConfig[] {
    return fonts.filter(font => font.category === category);
}

export function getFontWeights(family: string): number[] {
    const font = fonts.find(f => f.family === family);
    return font ? [...font.weights].sort((a, b) => a - b) : [];
}

export function isValidFontFamily(family: string): boolean {
    return fonts.some(f => f.family === family);
}

export function isFontLoaded(family: string): Promise<boolean> {
    return document.fonts.ready.then(() => {
        return document.fonts.check(`1em "${family}"`);
    });
}