/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: {
          DEFAULT: "#050505",
          paper: "#0A0A0A",
          subtle: "#121212"
        },
        primary: {
          DEFAULT: "#CCFF00",
          hover: "#B3E600",
          foreground: "#000000"
        },
        accent: {
          cyan: "#00F0FF",
          purple: "#7B61FF",
          pink: "#FF0099"
        },
        muted: {
          DEFAULT: "#52525B",
          foreground: "#A1A1AA"
        },
        border: "#27272A",
        input: "#27272A",
        ring: "#CCFF00"
      },
      fontFamily: {
        outfit: ["Outfit", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"]
      },
      borderRadius: {
        lg: "16px",
        md: "8px",
        sm: "4px"
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" }
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" }
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px rgba(204, 255, 0, 0.4)" },
          "50%": { boxShadow: "0 0 30px rgba(204, 255, 0, 0.6)" }
        }
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite"
      }
    }
  },
  plugins: [require("tailwindcss-animate")]
};
