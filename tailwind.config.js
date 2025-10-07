/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'uber-black': '#000000',
        white: '#ffffff',
        background: '#050b16',
        accent: '#1CFF87',
        'accent-soft': 'rgba(28, 255, 135, 0.12)',
        surface: '#0b1424',
        'surface-highlight': '#101d33',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
