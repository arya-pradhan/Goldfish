/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: '#FF6B35',
        ocean: '#1A6B8A',
        heat: '#FF3B30',
      },
    },
  },
  plugins: [],
}
