/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#005ec3",
        primaryLight: "#1a73e8",
        primaryDark: "#004793",
        background: "#F7F9FC",
        surface: "#FFFFFF",
        textPrimary: "#0F1B2A",
        textSecondary: "#6B7684",
        success: "#1E9E63",
        danger: "#E5484D",
        priorityHigh: "#E5484D",
        priorityMedium: "#F5A623",
        priorityLow: "#1a73e8",
      }
    },
  },
  presets: [require("nativewind/preset")],
  plugins: [],
}