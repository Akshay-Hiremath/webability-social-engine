import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#335cff",
          light: "#476cff",
          dark: "#2347e0",
          bg: "#eef2ff",
          "bg-soft": "#f4f7ff",
        },
        brand: {
          dark: "#0e121b",
          muted: "#5c5c5c",
          border: "#ebebeb",
          card: "#ffffff",
          yellow: "#FFD600",
          navy: "#060d26",
          "navy-mid": "#0c1a4a",
        },
        platform: {
          linkedin: "#0077B5",
          twitter: "#000000",
          instagram: "#E1306C",
          facebook: "#1877F2",
          medium: "#00AB6C",
          substack: "#FF6719",
          reddit: "#FF4500",
        },
      },
      fontFamily: {
        display: ["Syne", "sans-serif"],
        body: ["DM Sans", "sans-serif"],
      },
      backgroundImage: {
        "hero-gradient": "linear-gradient(135deg, #f0f4ff 0%, #e8eeff 55%, #f8f9ff 100%)",
        "hero-gradient-dark": "linear-gradient(135deg, #060d26 0%, #0c1a4a 50%, #060d26 100%)",
        "card-shine": "linear-gradient(135deg, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0.6) 100%)",
      },
      boxShadow: {
        card: "0 1px 3px rgba(14,18,27,0.06), 0 4px 16px rgba(14,18,27,0.04)",
        "card-hover": "0 4px 12px rgba(14,18,27,0.10), 0 16px 32px rgba(14,18,27,0.06)",
        primary: "0 4px 14px rgba(51,92,255,0.25)",
      },
      animation: {
        "fade-in": "fadeIn 0.5s ease-out forwards",
        "slide-up": "slideUp 0.45s ease-out forwards",
        "slide-up-delay-1": "slideUp 0.45s 0.1s ease-out forwards",
        "slide-up-delay-2": "slideUp 0.45s 0.2s ease-out forwards",
        "pulse-dot": "pulseDot 1.4s ease-in-out infinite",
        "shimmer": "shimmer 1.8s linear infinite",
        "spin-slow": "spin 3s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pulseDot: {
          "0%, 80%, 100%": { transform: "scale(0.8)", opacity: "0.5" },
          "40%": { transform: "scale(1)", opacity: "1" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-400px 0" },
          "100%": { backgroundPosition: "400px 0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
