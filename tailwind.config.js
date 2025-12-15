/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'uber-black': '#000000',
        white: '#ffffff',
        background: '#0b0f1f',
        accent: '#8b7bff',
        'accent-soft': 'rgba(139, 123, 255, 0.14)',
        surface: '#0f162d',
        'surface-highlight': '#141f3b',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
