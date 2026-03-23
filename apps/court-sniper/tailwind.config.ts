import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
	darkMode: ['class'],
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			fontFamily: {
				sans: ['Inter', ...defaultTheme.fontFamily.sans]
			},
			colors: {
				border: 'hsl(var(--color-border) / <alpha-value>)',
				input: 'hsl(var(--color-input) / <alpha-value>)',
				ring: 'hsl(var(--color-ring) / <alpha-value>)',
				background: 'hsl(var(--color-background) / <alpha-value>)',
				foreground: 'hsl(var(--color-foreground) / <alpha-value>)',
				primary: {
					DEFAULT: 'hsl(var(--color-primary) / <alpha-value>)',
					foreground: 'hsl(var(--color-primary-foreground) / <alpha-value>)'
				},
				secondary: {
					DEFAULT: 'hsl(var(--color-secondary) / <alpha-value>)',
					foreground: 'hsl(var(--color-secondary-foreground) / <alpha-value>)'
				},
				destructive: {
					DEFAULT: 'hsl(var(--color-destructive) / <alpha-value>)',
					foreground: 'hsl(var(--color-destructive-foreground) / <alpha-value>)'
				},
				muted: {
					DEFAULT: 'hsl(var(--color-muted) / <alpha-value>)',
					foreground: 'hsl(var(--color-muted-foreground) / <alpha-value>)'
				},
				accent: {
					DEFAULT: 'hsl(var(--color-accent) / <alpha-value>)',
					foreground: 'hsl(var(--color-accent-foreground) / <alpha-value>)'
				}
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)'
			}
		}
	}
};

export default config;
