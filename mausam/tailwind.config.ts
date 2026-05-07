import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        playfair: ["var(--font-playfair)", "serif"],
        dm: ["var(--font-dm)", "sans-serif"],
      },
      colors: {
        accent: "#2563eb",
        "accent-hover": "#1d4ed8",
        "accent-light": "#eff6ff",
        danger: "#ef4444",
        warning: "#f59e0b",
        success: "#10b981",
      },
      animation: {
        "sun-pulse": "sunPulse 4s ease-in-out infinite",
        "cloud-float-1": "cloudFloat 55s linear infinite",
        "cloud-float-2": "cloudFloat 75s linear infinite",
        "cloud-float-3": "cloudFloat 90s linear infinite",
        "cloud-float-4": "cloudFloat 48s linear infinite",
      },
      keyframes: {
        sunPulse: {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.09)" },
        },
        cloudFloat: {
          from: { transform: "translateX(-400px)" },
          to: { transform: "translateX(110vw)" },
        },
      },
    },
  },
  plugins: [],
};
export default config;
