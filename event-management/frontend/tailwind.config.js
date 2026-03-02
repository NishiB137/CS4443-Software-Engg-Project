/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2563EB', // Base primary blue
          hover: '#1D4ED8',   
          light: '#DBEAFE',   
        },
        secondary: {
          DEFAULT: '#111827', // Dark contrast button color
          hover: '#374151',
        },
        background: '#F9FAFB', // Light gray page background
        surface: '#FFFFFF',    // White card background
        text: {
          primary: '#111827',   // Main text
          secondary: '#6B7280', // Subtitles/Descriptions
        },
        border: '#E5E7EB',      // Dividers and borders
      }
    },
  },
  plugins: [],
}