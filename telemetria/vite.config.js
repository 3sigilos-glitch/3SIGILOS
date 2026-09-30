import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    // Web Bluetooth so funciona em https ou em localhost. Para testar no
    // telemovel na mesma rede usa "npm run build && npx serve -s dist" atras
    // de https, ou faz deploy no Vercel (mais simples).
    port: 5180,
  },
  build: { outDir: "dist", sourcemap: false },
});
