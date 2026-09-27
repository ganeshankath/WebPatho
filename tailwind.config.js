/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f4f7fe',
          100: '#e8effd',
          200: '#d5e2fc',
          300: '#b7cbfa',
          400: '#94acf6',
          500: '#6d8bf1',
          600: '#4b65eb',
          700: '#234a9f',
          800: '#1f3c85',
          900: '#1f356d',
          950: '#132047',
        },
      },
      fontFamily: {
        sans: ['Outfit', 'sans-serif'],
      },
    },
  },
  plugins: [],
}

