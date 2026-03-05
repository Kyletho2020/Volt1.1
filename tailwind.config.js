/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#0B0F19',
        surface: '#111827',
        'surface-raised': '#1F2937',
        'surface-overlay': '#374151',
        accent: '#3B82F6',
        'accent-hover': '#2563EB',
        'accent-soft': 'rgba(59,130,246,0.15)',
        glow: 'rgba(59,130,246,0.25)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 2px 8px rgba(0,0,0,0.3)',
        panel: '0 4px 16px rgba(0,0,0,0.4)',
        modal: '0 8px 32px rgba(0,0,0,0.5)',
        glow: '0 0 20px rgba(59,130,246,0.15)',
        'glow-lg': '0 0 30px rgba(59,130,246,0.08)',
      },
      backdropBlur: {
        xs: '2px',
        xl: '20px',
        '2xl': '40px',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'glow-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.5' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'glow-pulse': 'glow-pulse 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
