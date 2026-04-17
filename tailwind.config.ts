import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1e3a5f",
          50: "#eef2f8",
          100: "#d4dff0",
          200: "#a9bfe1",
          500: "#1e3a5f",
          600: "#1a3254",
          700: "#152844",
        },
        accent: {
          DEFAULT: "#f97316",
          50: "#fdf3e7",
          100: "#fae0bf",
          500: "#f97316",
          600: "#d4721e",
        },
        surface: {
          DEFAULT: "#1f2937",
          50: "#111827",
          100: "#1f2937",
          200: "#374151",
          300: "#4b5563",
        },
        electric: {
          DEFAULT: "#f97316",
          50: "#fff7ed",
          500: "#f97316",
        },
        success: {
          DEFAULT: "#27ae60",
          50: "#eafaf1",
          100: "#d0f0e0",
          500: "#27ae60",
          600: "#229a55",
        },
      },
      fontFamily: {
        sans: ["var(--font-readex)", "Readex Pro", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.07), 0 1px 2px -1px rgb(0 0 0 / 0.05)",
        "card-md": "0 4px 12px 0 rgb(0 0 0 / 0.08), 0 2px 4px -1px rgb(0 0 0 / 0.05)",
        "card-dark": "0 1px 3px 0 rgb(0 0 0 / 0.4), 0 1px 2px -1px rgb(0 0 0 / 0.3)",
      },
    },
  },
  plugins: [],
};

export default config;
