/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#5B4FD8',
          dark: '#4C40B8',
        },
        neutral: {
          dark: '#1F2937',
          light: '#F3F4F6',
          gray: '#9CA3AF',
        },
        accent: {
          red: '#EF4444',
          blue: '#E0E7FF',
        }
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.1)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.1)',
      }
    },
  },
  plugins: [],
}
