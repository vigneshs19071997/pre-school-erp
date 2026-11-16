import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["'Plus Jakarta Sans'", "ui-sans-serif", "system-ui", "sans-serif"],
        display: ["'Playfair Display'", "'Plus Jakarta Sans'", "serif"],
      },
      colors: {
        /* Deep emerald — primary */
        brand: {
          50: "#f0f7f3", 100: "#dbebe1", 200: "#b7d7c4", 300: "#8bbda0", 400: "#5a9d79",
          500: "#3c8160", 600: "#2b6b4d", 700: "#1f5740", 800: "#16402f", 900: "#102f23",
        },
        /* Warm gold — accent (logo, borders, highlights) */
        gold: {
          50: "#fdf9ec", 100: "#f8edc4", 200: "#f0d888", 300: "#e3bd54", 400: "#d1a23a",
          500: "#b8862a", 600: "#96691f", 700: "#714e17",
        },
        cream: "#faf7ef",
        coral: { 100: "#f6dde0", 500: "#b5465c", 600: "#943349" },
        sun: { 100: "#f3e6c7", 500: "#c18a2e", 600: "#9c6d1f" },
        mint: { 100: "#d7f0e8", 500: "#1f8f74", 600: "#16725c" },
        sky: { 100: "#dde3f2", 500: "#3c5a92", 600: "#2c4471" },
      },
      boxShadow: {
        soft: "0 1px 2px rgba(16,47,35,.05), 0 8px 24px -8px rgba(16,47,35,.14)",
      },
      borderRadius: { xl2: "1.25rem" },
    },
  },
  plugins: [],
} satisfies Config;
