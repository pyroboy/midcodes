/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// Design system from POS DESIGN.pen — LIGHT theme
				accent: {
					DEFAULT: '#EA580C', // accent-primary (orange-600)
					dark: '#C2410C',    // accent-primary-dark
					light: '#FFF7ED'    // accent-primary-light
				},
				surface: {
					DEFAULT: '#FFFFFF', // bg-primary
					secondary: '#F9FAFB', // bg-secondary
					dark: '#1F2937'
				},
				border: {
					DEFAULT: '#E5E7EB',
					light: '#F3F4F6'
				},
				status: {
					green: '#10B981',
					'green-light': '#ECFDF5',
					yellow: '#F59E0B',
					'yellow-light': '#FFFBEB',
					red: '#EF4444',
					'red-light': '#FEF2F2',
					purple: '#8B5CF6',
					'purple-light': '#F5F3FF',
					cyan: '#06B6D4',
					'cyan-light': '#ECFEFF'
				}
			},
			fontFamily: {
				sans: ['Inter', 'system-ui', 'sans-serif'],
				mono: ['"JetBrains Mono"', 'monospace']
			},
			borderRadius: {
				sm: '6px',
				md: '8px',
				lg: '12px',
				xl: '16px'
			},
			animation: {
				'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'border-pulse-red': 'borderPulseRed 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'border-pulse-yellow': 'borderPulseYellow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
			},
			keyframes: {
				borderPulseRed: {
					'0%, 100%': { borderColor: 'rgba(239, 68, 68, 1)' }, // red-500
					'50%': { borderColor: 'rgba(239, 68, 68, 0.3)' },
				},
				borderPulseYellow: {
					'0%, 100%': { borderColor: 'rgba(250, 204, 21, 1)' }, // yellow-400
					'50%': { borderColor: 'rgba(250, 204, 21, 0.3)' },
				}
			}
		}
	},
	plugins: [require('tailwindcss-animate')]
};
