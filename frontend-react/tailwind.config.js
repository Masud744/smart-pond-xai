/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#0d1117',
          800: '#161b22',
          700: '#1c2333',
          600: '#21262d',
          500: '#2d333b',
        },
        accent: {
          purple: '#7c3aed',
          blue:   '#3b82f6',
          cyan:   '#06b6d4',
          green:  '#10b981',
          yellow: '#f59e0b',
          red:    '#ef4444',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}
