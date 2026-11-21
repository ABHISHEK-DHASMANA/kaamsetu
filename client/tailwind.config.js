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
          primary: '#145C48',
          'primary-dark': '#0E4032',
          'primary-light': '#E8F3EE',
          secondary: '#1F8066',
          'secondary-light': '#E6F4F0',
          accent: '#F4A340',
          'accent-light': '#FEF4E8',
          bg: '#F7F9F8',
          card: '#FFFFFF',
          dark: '#172B25',
          muted: '#718078',
          border: '#E2E8E5',
          highlight: '#25A182',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Outfit', 'sans-serif'],
      },
      boxShadow: {
        'soft': '0 2px 15px -3px rgba(20, 92, 72, 0.07), 0 4px 6px -2px rgba(20, 92, 72, 0.03)',
        'card': '0 4px 20px -2px rgba(23, 43, 37, 0.06)',
        'card-hover': '0 12px 30px -4px rgba(20, 92, 72, 0.12)',
      }
    },
  },
  plugins: [],
}
