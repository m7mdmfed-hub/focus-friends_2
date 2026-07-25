/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#f3f1ff',
          100: '#e9e5ff',
          200: '#d5ccff',
          300: '#b4a3ff',
          400: '#8e6bff',
          500: '#6c47ff',
          600: '#5a32e6',
          700: '#4a26b8',
          800: '#3c208f',
          900: '#2c1866',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
