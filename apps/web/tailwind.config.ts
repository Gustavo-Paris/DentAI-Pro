import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "./node_modules/@parisgroup-ai/pageshell/dist/**/*.{js,mjs}",
    "../../packages/domain-odonto-ai/src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
  	container: {
  		center: true,
  		padding: '2rem',
  		screens: {
  			'2xl': '1400px'
  		}
  	},
  	extend: {
  		colors: {
  			border: 'rgb(var(--color-border-rgb) / <alpha-value>)',
  			input: 'var(--color-input)',
  			ring: 'var(--color-ring)',
  			background: 'rgb(var(--color-background-rgb) / <alpha-value>)',
  			foreground: 'rgb(var(--color-foreground-rgb) / <alpha-value>)',
  			primary: {
  				DEFAULT: 'rgb(var(--color-primary-rgb) / <alpha-value>)',
  				foreground: 'var(--color-primary-foreground)',
  			},
  			secondary: {
  				DEFAULT: 'rgb(var(--color-secondary-rgb) / <alpha-value>)',
  				foreground: 'var(--color-secondary-foreground)',
  			},
  			destructive: {
  				DEFAULT: 'rgb(var(--color-destructive-rgb) / <alpha-value>)',
  				foreground: 'var(--color-destructive-foreground)',
  			},
  			muted: {
  				DEFAULT: 'rgb(var(--color-muted-rgb) / <alpha-value>)',
  				foreground: 'rgb(var(--color-muted-foreground-rgb) / <alpha-value>)',
  			},
  			accent: {
  				DEFAULT: 'rgb(var(--color-accent-rgb) / <alpha-value>)',
  				foreground: 'var(--color-accent-foreground)',
  			},
  			popover: {
  				DEFAULT: 'var(--color-popover)',
  				foreground: 'var(--color-popover-foreground)',
  			},
  			card: {
  				DEFAULT: 'rgb(var(--color-card-rgb) / <alpha-value>)',
  				foreground: 'var(--color-card-foreground)',
  			},
  			success: {
  				DEFAULT: 'rgb(var(--color-success-rgb) / <alpha-value>)',
  				foreground: 'var(--color-success-foreground)',
  			},
  			warning: {
  				DEFAULT: 'rgb(var(--color-warning-rgb) / <alpha-value>)',
  				foreground: 'var(--color-warning-foreground)',
  			},
  			sidebar: {
  				DEFAULT: 'var(--color-sidebar)',
  				foreground: 'var(--color-sidebar-foreground)',
  				primary: 'var(--color-sidebar-primary)',
  				'primary-foreground': 'var(--color-sidebar-primary-foreground)',
  				accent: 'var(--color-sidebar-accent)',
  				'accent-foreground': 'var(--color-sidebar-accent-foreground)',
  				border: 'var(--color-sidebar-border)',
  				ring: 'var(--color-ring)',
  			},
  		},
  		borderRadius: {
  			lg: 'var(--radius-lg)',
  			md: 'var(--radius-md)',
  			sm: 'var(--radius-sm)',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			},
  			'progress-indeterminate': {
  				'0%': { transform: 'translateX(-100%)', width: '40%' },
  				'50%': { transform: 'translateX(60%)', width: '60%' },
  				'100%': { transform: 'translateX(200%)', width: '40%' },
  			},
  			'badge-pulse-ring': {
  				'0%, 100%': { boxShadow: '0 0 0 0 rgb(var(--color-primary-rgb) / 0.35)' },
  				'50%': { boxShadow: '0 0 0 8px rgb(var(--color-primary-rgb) / 0)' },
  			},
  			'float': {
  				'0%, 100%': { transform: 'translateY(0)' },
  				'50%': { transform: 'translateY(-6px)' },
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out',
  			'fade-in-up': 'fade-in-up 0.4s ease-out',
  			'scale-in': 'scale-in 0.3s ease',
  			'progress-indeterminate': 'progress-indeterminate 1.5s ease-in-out infinite',
  			'badge-pulse-ring': 'badge-pulse-ring 3s ease-in-out infinite',
  			'float': 'float 3s ease-in-out infinite',
  		},
  		boxShadow: {
  			'2xs': 'var(--shadow-2xs)',
  			xs: 'var(--shadow-xs)',
  			sm: 'var(--shadow-sm)',
  			md: 'var(--shadow-md)',
  			lg: 'var(--shadow-lg)',
  			xl: 'var(--shadow-xl)',
  			'2xl': 'var(--shadow-2xl)'
  		},
  		fontFamily: {
  			sans: [
  				'DM Sans',
  				'ui-sans-serif',
  				'system-ui',
  				'-apple-system',
  				'BlinkMacSystemFont',
  				'Segoe UI',
  				'Roboto',
  				'Helvetica Neue',
  				'Arial',
  				'Noto Sans',
  				'sans-serif'
  			],
  			display: [
  				'Plus Jakarta Sans',
  				'DM Sans',
  				'ui-sans-serif',
  				'system-ui',
  				'sans-serif'
  			],
  			serif: [
  				'ui-serif',
  				'Georgia',
  				'Cambria',
  				'Times New Roman',
  				'Times',
  				'serif'
  			],
  			mono: [
  				'JetBrains Mono',
  				'ui-monospace',
  				'SFMono-Regular',
  				'Menlo',
  				'Monaco',
  				'Consolas',
  				'Liberation Mono',
  				'Courier New',
  				'monospace'
  			]
  		}
  	}
  },
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
