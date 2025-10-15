/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
  extend: {
  colors: {
  bank: {
  bg: "#0a0d14",
  card: "#0f1420",
  accent: "#60a5fa"
  }
  },
  keyframes: {
  gridmove: {
  '0%': { backgroundPosition: '0 0' },
  '100%': { backgroundPosition: '100px 100px' }
  }
  },
  animation: {
  gridmove: 'gridmove 10s linear infinite'
  }
  }
  },
  plugins: []
  }