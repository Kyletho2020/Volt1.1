/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'uber-black': '#000000',
        white: '#ffffff',
        background: '#0a121f',
        accent: '#6bc8ff',
        'accent-soft': 'rgba(107, 200, 255, 0.16)',
        surface: '#0f172b',
        'surface-highlight': '#16233c',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
