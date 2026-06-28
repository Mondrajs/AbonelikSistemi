import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#10B981", 
          hover: "#059669",
          foreground: "#FFFFFF",
        },
        background: {
          light: "#F8FAFC",   
          dark: "#090d1a",    
        },
        surface: {
          light: "#FFFFFF",   
          dark: "#131c35",    
        },
        text: {
          primary: "#0F172A",       
          secondary: "#64748B",     
          darkPrimary: "#F8FAFC",   
          darkSecondary: "#94A3B8", 
        },
        accent: {
          purple: "#8B5CF6", 
          blue: "#3B82F6",
          red: "#EF4444",
          yellow: "#F59E0B",
        }
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
