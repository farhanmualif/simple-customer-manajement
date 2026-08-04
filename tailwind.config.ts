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
        // ── Brand: #254395 (referensi) ───────────────────────────
        brand: {
          DEFAULT: "#254395",
          light:   "#3354B4",
          dark:    "#1B3171",
          50:  "#eff6ff",
          100: "#dbeafe",
          200: "#bfdbfe",
          300: "#93c5fd",
          400: "#60a5fa",
          500: "#3b82f6",
          600: "#2563eb",
          700: "#254395",
          800: "#1B3171",
          900: "#11244C",
          950: "#0B1120",
        },
        // ── Accent colors persis dari referensi ──────────────────
        accent: {
          green: {
            light:   "#EAF8ED",
            DEFAULT: "#22A346",
            text:    "#177A31",
          },
          red: {
            light:   "#FCECEC",
            DEFAULT: "#E33333",
            text:    "#A61A1A",
          },
          gray: {
            light:   "#F4F5F7",
            DEFAULT: "#6B7280",
            text:    "#374151",
          },
          blue: {
            light:   "#EBF2FF",
            DEFAULT: "#2563EB",
          },
        },
        // ── Status (tetap ada untuk komponen lain) ───────────────
        success: {
          50:  "#EAF8ED",
          100: "#EAF8ED",
          200: "#bbf7d0",
          400: "#4ade80",
          500: "#22A346",
          600: "#22A346",
          700: "#177A31",
        },
        danger: {
          50:  "#FCECEC",
          100: "#FCECEC",
          200: "#fecdd3",
          400: "#fb7185",
          500: "#E33333",
          600: "#E33333",
          700: "#A61A1A",
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
        card:      "0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)",
        "card-md": "0 8px 25px -5px rgba(0,0,0,0.1), 0 4px 10px -5px rgba(0,0,0,0.04)",
        "card-xl": "0 20px 40px -10px rgba(0,0,0,0.15)",
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
