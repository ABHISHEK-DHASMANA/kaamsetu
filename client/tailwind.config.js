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
          primary: '#23483D',
          'primary-dark': '#18372F',
          'primary-light': '#E9EEE8',
          secondary: '#3E725E',
          'secondary-light': '#EAF1EB',
          accent: '#D66A3A',
          'accent-light': '#F8EDE6',
          bg: '#F6F4EE',
          card: '#FFFFFF',
          dark: '#1D2924',
          muted: '#70776F',
          border: '#E7E2D8',
          highlight: '#56836C',
        }
      },
      fontFamily: {
        sans: ['DM Sans', 'Manrope', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 3px 14px rgba(35, 48, 40, 0.05)',
        'card': '0 5px 18px rgba(35, 48, 40, 0.055)',
        'card-hover': '0 9px 24px rgba(35, 48, 40, 0.08)',
      }
    },
  },
  plugins: [],
}
