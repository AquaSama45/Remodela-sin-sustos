/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563eb', // blue-600
          hover: '#1d4ed8',   // blue-700
          light: '#eff6ff',   // blue-50
        },
        alerta: {
          DEFAULT: '#dc2626', // red-600
          light: '#fef2f2',   // red-50
        },
        exito: {
          DEFAULT: '#16a34a', // green-600
          light: '#f0fdf4',   // green-50
        }
      }
    },
  },
  plugins: [],
}
