/** @type {import('tailwindcss').Config} */
export default {
	content: ['./src/**/*.{html,js,svelte,ts}'],
	theme: {
		extend: {
			colors: {
				// shadcn-svelte CSS-var tokens (required for sidebar/sheet components)
				background: 'var(--background, #ffffff)',
				foreground: 'var(--foreground, #111827)',
				sidebar: {
					DEFAULT:    'var(--sidebar, #ffffff)',
					foreground: 'var(--sidebar-foreground, #111827)',
					primary:    'var(--sidebar-primary, #EA580C)',
					'primary-foreground': 'var(--sidebar-primary-foreground, #ffffff)',
					accent:     'var(--sidebar-accent, #FFF7ED)',
					'accent-foreground': 'var(--sidebar-accent-foreground, #EA580C)',
					border:     'var(--sidebar-border, #E5E7EB)',
					ring:       'var(--sidebar-ring, #EA580C)',
				},
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
					'cyan-light': '#ECFEFF',
					bluetooth: '#3B82F6',
					'bluetooth-light': '#EFF6FF'
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
				'border-pulse-bluetooth': 'borderPulseBluetooth 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'border-pulse-accent': 'borderPulseAccent 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite',
				'success-flash': 'successFlash 500ms ease-out forwards',
				'gentle-bob': 'gentleBob 2.5s ease-in-out infinite',
				'check-burst': 'checkBurst 300ms ease-out forwards',
				'card-glow': 'cardGlow 600ms ease-out forwards',
				'weight-pop': 'weightPop 250ms ease-out',
				'station-flash': 'stationFlash 500ms ease-out forwards',
			},
			keyframes: {
				successFlash: {
					'0%': { backgroundColor: 'rgba(16, 185, 129, 0)' },
					'30%': { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
					'100%': { backgroundColor: 'rgba(16, 185, 129, 0)' },
				},
				gentleBob: {
					'0%, 100%': { transform: 'translateY(0)' },
					'50%': { transform: 'translateY(-6px)' },
				},
				checkBurst: {
					'0%': { transform: 'scale(0.5)', opacity: '0' },
					'70%': { transform: 'scale(1.15)', opacity: '1' },
					'100%': { transform: 'scale(1)', opacity: '1' },
				},
				cardGlow: {
					'0%': { boxShadow: '0 0 0 rgba(16, 185, 129, 0)' },
					'40%': { boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' },
					'100%': { boxShadow: '0 0 0 rgba(16, 185, 129, 0)' },
				},
				weightPop: {
					'0%': { transform: 'scale(1)' },
					'50%': { transform: 'scale(1.08)' },
					'100%': { transform: 'scale(1)' },
				},
				stationFlash: {
					'0%': { backgroundColor: 'rgba(16, 185, 129, 0)' },
					'30%': { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
					'100%': { backgroundColor: 'rgba(16, 185, 129, 0)' },
				},
				borderPulseRed: {
					'0%, 100%': { borderColor: 'rgba(239, 68, 68, 1)' }, // red-500
					'50%': { borderColor: 'rgba(239, 68, 68, 0.3)' },
				},
				borderPulseYellow: {
					'0%, 100%': { borderColor: 'rgba(250, 204, 21, 1)' }, // yellow-400
					'50%': { borderColor: 'rgba(250, 204, 21, 0.3)' },
				},
				borderPulseBluetooth: {
					'0%, 100%': { borderColor: 'rgba(59, 130, 246, 1)' }, // blue-500
					'50%': { borderColor: 'rgba(59, 130, 246, 0.3)' },
				},
				borderPulseAccent: {
					'0%, 100%': { borderColor: 'rgba(234, 88, 12, 1)', boxShadow: '0 0 12px rgba(234, 88, 12, 0.25)' }, // accent orange
					'50%': { borderColor: 'rgba(234, 88, 12, 0.4)', boxShadow: '0 0 4px rgba(234, 88, 12, 0.1)' },
				}
			}
		}
	},
	plugins: [require('tailwindcss-animate')]
};
