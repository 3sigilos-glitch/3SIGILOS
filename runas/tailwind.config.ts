import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-display)", "Fraunces", "serif"],
        body: ["var(--font-body)", "Hanken Grotesk", "system-ui", "sans-serif"],
      },
      colors: {
        // Referenciam as variaveis CSS definidas por ambiente (claro/escuro).
        bg: "var(--bg)",
        panel: "var(--panel)",
        card: "var(--card)",
        ink: "var(--ink)",
        muted: "var(--muted)",
        line: "var(--line)",
        accent: "var(--accent)",
      },
    },
  },
  plugins: [],
};

export default config;
