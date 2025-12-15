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
          primary: '#4F46E5', // Indigo 600 - More premium than #5B4FD8
          secondary: '#818CF8', // Indigo 400
          dark: '#312E81', // Indigo 900
          light: '#EEF2FF', // Indigo 50
        },
        surface: {
          white: '#FFFFFF',
          glass: 'rgba(255, 255, 255, 0.7)',
          'glass-dark': 'rgba(17, 24, 39, 0.7)',
          ground: '#F8FAFC', // Slate 50
        },
        neutral: {
          dark: '#0F172A', // Slate 900
          gray: '#64748B', // Slate 500
          light: '#F1F5F9', // Slate 100
        },
        success: {
          DEFAULT: '#10B981', // Emerald 500
          light: '#D1FAE5',
        },
        warning: {
          DEFAULT: '#F59E0B',
          light: '#FEF3C7',
        },
        danger: {
          DEFAULT: '#EF4444',
          light: '#FEE2E2',
        }
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', 'sans-serif'], // Premium heading font
      },
      boxShadow: {
        'glass': '0 4px 30px rgba(0, 0, 0, 0.1)',
        'glass-hover': '0 10px 40px rgba(0, 0, 0, 0.1)',
        'neu': '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
      },
      backdropBlur: {
        'xs': '2px',
      },
      animation: {
        'slide-up': 'slideUp 0.4s ease-out forwards',
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'scale-in': 'scaleIn 0.2s ease-out forwards',
      },
      keyframes: {
        slideUp: {
          '0%': { transform: 'translateY(20px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        scaleIn: {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        }
      }
    },
  },
  plugins: [],
}
