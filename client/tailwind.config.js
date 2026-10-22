/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Clinical Theme: Refined Healthcare Emerald Green
        clinical: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669', // Main brand primary
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        // 5-Level Triage (ESI Standard)
        triage: {
          // Level 1: Immediate / Resuscitation (Red)
          level1: {
            bg: '#fef2f2',
            text: '#991b1b',
            border: '#f87171',
            solid: '#dc2626',
            hover: '#b91c1c'
          },
          // Level 2: Emergent (Orange)
          level2: {
            bg: '#fff7ed',
            text: '#9a3412',
            border: '#fb923c',
            solid: '#ea580c',
            hover: '#c2410c'
          },
          // Level 3: Urgent (Yellow)
          level3: {
            bg: '#fefce8',
            text: '#854d0e',
            border: '#facc15',
            solid: '#ca8a04',
            hover: '#a16207'
          },
          // Level 4: Less Urgent (Green)
          level4: {
            bg: '#f0fdf4',
            text: '#166534',
            border: '#4ade80',
            solid: '#16a34a',
            hover: '#15803d'
          },
          // Level 5: Non-urgent (Blue)
          level5: {
            bg: '#eff6ff',
            text: '#1e40af',
            border: '#60a5fa',
            solid: '#2563eb',
            hover: '#1d4ed8'
          },
          // Legacy fallbacks
          red: {
            bg: '#fef2f2',
            text: '#991b1b',
            border: '#f87171',
            solid: '#dc2626',
            hover: '#b91c1c'
          },
          amber: {
            bg: '#fff7ed',
            text: '#9a3412',
            border: '#fb923c',
            solid: '#ea580c',
            hover: '#c2410c'
          },
          green: {
            bg: '#f0fdf4',
            text: '#166534',
            border: '#4ade80',
            solid: '#16a34a',
            hover: '#15803d'
          }
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'xs': '0 1px 2px 0 rgba(15, 23, 42, 0.05)',
        clinical: '0 1px 3px 0 rgba(15, 23, 42, 0.08), 0 1px 2px -1px rgba(15, 23, 42, 0.08)',
        'clinical-md': '0 4px 6px -1px rgba(15, 23, 42, 0.08), 0 2px 4px -2px rgba(15, 23, 42, 0.06)',
      }
    },
  },
  plugins: [],
}
