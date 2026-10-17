/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070B14',
          900: '#0B1120',
          850: '#0F172A',
          800: '#15203B',
          700: '#1E293B',
          600: '#334155',
        },
        charcoal: {
          900: '#12141A',
          800: '#1A1D24',
          700: '#232730',
        },
        cyan: {
          glow: '#06B6D4',
          bright: '#22D3EE',
        },
        teal: {
          glow: '#14B8A6',
          bright: '#2DD4BF',
        },
        signal: {
          red: '#EF4444',
          redGlow: '#DC2626',
          amber: '#F59E0B',
          amberGlow: '#D97706',
          green: '#10B981',
          greenGlow: '#059669',
        }
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Menlo', 'Monaco', 'Courier New', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(6, 182, 212, 0.35)',
        'glow-teal': '0 0 20px -3px rgba(20, 184, 166, 0.35)',
        'glow-green': '0 0 25px -2px rgba(16, 185, 129, 0.45)',
        'glow-red': '0 0 25px -2px rgba(239, 68, 68, 0.45)',
        'glow-amber': '0 0 25px -2px rgba(245, 158, 11, 0.45)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      }
    },
  },
  plugins: [],
}
