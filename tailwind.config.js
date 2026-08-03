/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/app/**/*.{js,jsx}",
    "./src/components/**/*.{js,jsx}",
    "./src/data/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: {
          50: "#F5F1E8",
          100: "#EDE8DF",
          200: "#D4D0C8",
          300: "#A9B0BE",
          400: "#8B93A6",
          500: "#5B6478",
          600: "#3A4254",
          700: "#1B2030",
          800: "#141824",
          900: "#0F1219",
          950: "#0B0E14",
        },
        gold: {
          300: "#DDC17E",
          400: "#C9A961",
          500: "#B08D3F",
        },
        blush: {
          400: "#E8B4B8",
          500: "#D89094",
        },
      },
      fontFamily: {
        display: ["'Playfair Display'", "serif"],
        body: ["Inter", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 60px 0 rgba(201, 169, 97, 0.25)",
      },
    },
  },
  plugins: [],
};
