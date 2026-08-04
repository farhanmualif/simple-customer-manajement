import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontSize: {
        xs:    ["0.875rem",  { lineHeight: "1.375rem" }],
        sm:    ["1rem",      { lineHeight: "1.5rem" }],
        base:  ["1.0625rem", { lineHeight: "1.625rem" }],
        lg:    ["1.1875rem", { lineHeight: "1.75rem" }],
        xl:    ["1.3125rem", { lineHeight: "1.875rem" }],
        "2xl": ["1.5rem",    { lineHeight: "2rem" }],
      },
      colors: {
        // ── Brand: Zoom-style deep navy → blue ──────────────────
        brand: {
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#1d4ed8",
          800: "#1e3a8a",   // navy utama — mirip Zoom dark bg
          900: "#172554",   // navy gelap untuk sidebar
          950: "#0f172a",   // paling gelap
        },
        // ── Status colors — lebih soft, tidak mencolok ───────────
        success: {
          50:  "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0",
          400: "#4ade80",
          500: "#22c55e",
          600: "#16a34a",
          700: "#15803d",
        },
        danger: {
          50:  "#fff1f2",
          100: "#ffe4e6",
          200: "#fecdd3",
          400: "#fb7185",
          500: "#f43f5e",
          600: "#e11d48",
          700: "#be123c",
        },
        warning: {
          50:  "#fffbeb",
          100: "#fef3c7",
          400: "#fbbf24",
          500: "#f59e0b",
          600: "#d97706",
        },
      },
      borderRadius: {
        xl:    "0.75rem",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card:      "0 1px 12px 0 rgba(30,58,138,0.07)",
        "card-md": "0 4px 20px 0 rgba(30,58,138,0.10)",
      },
      keyframes: {
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%":       { transform: "translateX(-8px)" },
          "40%":       { transform: "translateX(8px)" },
          "60%":       { transform: "translateX(-8px)" },
          "80%":       { transform: "translateX(8px)" },
        },
        "fade-in": {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shake:     "shake 0.4s ease-in-out",
        "fade-in": "fade-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};

export default config;
