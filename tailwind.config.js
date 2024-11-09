/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'sky-light': '#cde8f7',
        'sky-dark': '#1e3a8a',
      },
      boxShadow: {
        'xl-blue': '0 4px 14px 0 rgba(34, 202, 236, 0.39)',
      },
    },
  },
  plugins: [],
}