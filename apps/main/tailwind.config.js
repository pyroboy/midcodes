import defaultTheme from 'tailwindcss/defaultTheme';

/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	darkMode: ['class', '[data-theme="dark"]'],
	theme: {
		container: {
			center: true,
			padding: "2rem",
			screens: {
				"2xl": "1400px",
			},
		},
		extend: {
			colors: {
				border: "rgb(var(--color-border) / <alpha-value>)",
				input: "rgb(var(--color-input) / <alpha-value>)",
				ring: "rgb(var(--color-ring) / <alpha-value>)",
				background: "rgb(var(--color-background) / <alpha-value>)",
				foreground: "rgb(var(--color-foreground) / <alpha-value>)",
				primary: {
					DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
					foreground: "rgb(var(--color-primary-foreground) / <alpha-value>)",
				},
				secondary: {
					DEFAULT: "rgb(var(--color-secondary) / <alpha-value>)",
					foreground: "rgb(var(--color-secondary-foreground) / <alpha-value>)",
				},
				destructive: {
					DEFAULT: "rgb(var(--color-destructive) / <alpha-value>)",
					foreground: "rgb(var(--color-destructive-foreground) / <alpha-value>)",
				},
				muted: {
					DEFAULT: "rgb(var(--color-muted) / <alpha-value>)",
					foreground: "rgb(var(--color-muted-foreground) / <alpha-value>)",
				},
				accent: {
					DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
					foreground: "rgb(var(--color-accent-foreground) / <alpha-value>)",
				},
				card: {
					DEFAULT: "rgb(var(--color-card) / <alpha-value>)",
					foreground: "rgb(var(--color-card-foreground) / <alpha-value>)",
				},
			},
			fontFamily: {
				sans: ['Inter', ...defaultTheme.fontFamily.sans],
			},
			borderRadius: {
				lg: "var(--radius)",
				md: "calc(var(--radius) - 2px)",
				sm: "calc(var(--radius) - 4px)",
			},
			animation: {
				'fade-in': 'fadeIn 0.6s ease-out forwards',
				'slide-up': 'slideUp 0.8s ease-out forwards',
				'scale-in': 'scaleIn 0.5s ease-out forwards',
				'bounce-in': 'bounceIn 0.7s ease-out forwards',
			},
			keyframes: {
				fadeIn: {
					'from': {
						opacity: '0',
						transform: 'translateY(20px)'
					},
					'to': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				slideUp: {
					'from': {
						opacity: '0',
						transform: 'translateY(40px)'
					},
					'to': {
						opacity: '1',
						transform: 'translateY(0)'
					}
				},
				scaleIn: {
					'from': {
						opacity: '0',
						transform: 'scale(0.9)'
					},
					'to': {
						opacity: '1',
						transform: 'scale(1)'
					}
				},
				bounceIn: {
					'0%': {
						opacity: '0',
						transform: 'scale(0.3)'
					},
					'50%': {
						transform: 'scale(1.05)'
					},
					'70%': {
						transform: 'scale(0.9)'
					},
					'100%': {
						opacity: '1',
						transform: 'scale(1)'
					}
				}
			}
		}
	},
	plugins: [
		require('@tailwindcss/typography'),
		require('tailwindcss-animate')
	]
};