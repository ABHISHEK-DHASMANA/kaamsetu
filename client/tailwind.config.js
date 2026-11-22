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
          primary: '#5B3B75',
          'primary-dark': '#402653',
          'primary-light': '#F0EAF5',
          secondary: '#8261A6',
          'secondary-light': '#F2EDF8',
          accent: '#D45A9C',
          'accent-light': '#F9EAF3',
          bg: '#F8F7FA',
          card: '#FFFFFF',
          dark: '#241C2D',
          muted: '#777080',
          border: '#EBE7F0',
          highlight: '#9877B7',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 3px 14px rgba(64, 38, 83, 0.05)',
        'card': '0 5px 18px rgba(64, 38, 83, 0.055)',
        'card-hover': '0 9px 24px rgba(64, 38, 83, 0.08)',
      }
    },
  },
  plugins: [],
}
