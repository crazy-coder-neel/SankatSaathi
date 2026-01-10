/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'crisis-red': '#FF3B30',
        'warning-orange': '#FF9500',
        'safe-green': '#34C759',
        'info-blue': '#007AFF',
        'glass-bg': 'rgba(20, 20, 30, 0.6)',
        'dark-bg': '#0a0a0f',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
}
