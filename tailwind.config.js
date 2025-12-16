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
        // Primary Blue Palette
        primary: {
          50: '#dbeafe',
          600: '#2563eb', // Brand Color
          700: '#1e40af', // Darker Blue
        },
        // Slate Neutral Palette
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9', // Card BG
          200: '#e2e8f0', // Borders
          300: '#cbd5e1',
          500: '#64748b', // Secondary Text
          700: '#334155', // Body Text
          900: '#0f172a', // Headings
        },
        // Legacy Aliases for Backward Compatibility
        brand: {
          primary: '#2563eb', // mapped to primary-600
          secondary: '#1e40af',
          light: '#dbeafe',
        },
        surface: {
          ground: '#f8fafc', // mapped to slate-50
          white: '#ffffff',
        },
        neutral: {
          dark: '#0f172a', // mapped to slate-900
          gray: '#64748b', // mapped to slate-500
          light: '#e2e8f0', // mapped to slate-200
        },
        // Status Colors
        success: {
          DEFAULT: '#10b981', // Green-500
          light: '#d1fae5',   // Green-100
          dark: '#047857',    // Green-700
        },
        warning: {
          DEFAULT: '#f59e0b', // Amber-500
          light: '#fef3c7',   // Amber-100
          dark: '#b45309',    // Amber-700
        },
        danger: {
          DEFAULT: '#ef4444', // Red-500
          light: '#fee2e2',   // Red-100
          dark: '#b91c1c',    // Red-700
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'lg': '0.5rem',
        'md': '0.375rem',
        'sm': '0.125rem',
      },
      boxShadow: {
        'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
        'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
        'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { transform: 'translateY(0)' },
          '100%': { transform: 'translateY(100%)' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0)', opacity: 0 },
          '50%': { transform: 'scale(1.1)' },
          '100%': { transform: 'scale(1)', opacity: 1 },
        },
      },
      animation: {
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.2s ease-in',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      },
    },
  },
  plugins: [],
}
