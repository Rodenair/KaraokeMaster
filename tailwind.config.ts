import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        neon: {
          pink:   "#ff0080",
          blue:   "#00d4ff",
          gold:   "#ffd700",
          purple: "#bf00ff",
          green:  "#00ff88",
        },
        deep: {
          bg:     "#07000f",
          card:   "#0f0018",
          border: "#3a004a",
        },
      },
      fontFamily: {
        display: ["var(--font-baloo)", "system-ui", "sans-serif"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "twinkle":    "twinkle 2.5s ease-in-out infinite",
        "marquee":    "marquee 18s linear infinite",
      },
      keyframes: {
        twinkle: {
          "0%, 100%": { opacity: "1",   transform: "scale(1)" },
          "50%":      { opacity: "0.3", transform: "scale(0.75)" },
        },
        marquee: {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(-100%)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
