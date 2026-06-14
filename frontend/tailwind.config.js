/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Custom premium/aesthetic colors
        brand: {
          50: '#f5f7ff',
          100: '#ebf0ff',
          200: '#d6e0ff',
          300: '#adc2ff',
          400: '#85a4ff',
          500: '#5c86ff',
          600: '#3368ff',
          700: '#0a4aff',
          800: '#0036d6',
          900: '#00259e',
        }
      }
    },
  },
  plugins: [],
}
