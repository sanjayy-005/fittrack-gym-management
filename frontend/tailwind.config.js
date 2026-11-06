/** FitTrack theme: near-black surfaces ("ink") with an orange accent ("brand"). */
/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          100: "#e4e4ea",
          200: "#b4b4be",
          300: "#8a8a96",
          400: "#5c5c68",
          500: "#3a3a44",
          600: "#2a2a32",
          700: "#1e1e24",
          800: "#16161a",
          900: "#0f0f12",
          950: "#08080a",
        },
        brand: {
          50: "#fff4eb",
          100: "#ffe5d0",
          200: "#ffc9a0",
          300: "#ffa766",
          400: "#ff8433",
          500: "#ff6a0d",
          600: "#f05200",
          700: "#c73f00",
          800: "#9c3305",
          900: "#7d2d09",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Barlow Condensed", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,106,13,.35), 0 10px 30px -10px rgba(255,106,13,.45)",
      },
    },
  },
  plugins: [],
};
