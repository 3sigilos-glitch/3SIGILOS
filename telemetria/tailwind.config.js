/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        carbon: {
          950: "#05070a",
          900: "#0a0d12",
          850: "#0f141b",
          800: "#151b24",
          700: "#1e2732",
          600: "#2b3644",
        },
        ember: {
          500: "#ff6a00",
          400: "#ff8419",
          300: "#ffa04d",
        },
        ice: {
          400: "#5fd7e6",
          300: "#8ae7f2",
        },
        bone: "#e8e6e1",
      },
      fontFamily: {
        tech: ['"Rajdhani"', '"Barlow Condensed"', "Impact", "sans-serif"],
        mono: ['"JetBrains Mono"', '"Roboto Mono"', "ui-monospace", "monospace"],
      },
      boxShadow: {
        bezel: "inset 0 0 0 1px rgba(255,255,255,0.05), inset 0 14px 40px rgba(0,0,0,0.85), 0 2px 0 rgba(255,255,255,0.03)",
      },
    },
  },
  plugins: [],
};
