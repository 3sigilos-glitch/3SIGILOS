import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

// Para publicar em GitHub Pages (em vez de Vercel), corre o build com:
//   GHPAGES=1 npm run build
// para que os caminhos fiquem relativos à pasta do repositório.
const base = process.env.GHPAGES ? "/3sigilos/" : "/";

export default defineConfig({
  base,
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["marca.png", "favicon.png", "apple-touch-icon.png"],
      manifest: {
        name: "3SIGILOS",
        short_name: "3SIGILOS",
        description:
          "Consulta das 78 cartas do Tarot Rider-Waite, com significados, simbolismo e perguntas de reflexão em português.",
        lang: "pt-PT",
        display: "standalone",
        orientation: "portrait",
        background_color: "#0b0c14",
        theme_color: "#0b0c14",
        icons: [
          { src: "icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icon-512.png", sizes: "512x512", type: "image/png" },
          {
            src: "icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        navigateFallback: base + "index.html",
        // Gravuras do Wikimedia Commons: cache first depois da primeira visita,
        // para a app funcionar offline com as cartas já vistas.
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.hostname.endsWith("wikimedia.org"),
            handler: "CacheFirst",
            options: {
              cacheName: "rws-engravings",
              cacheableResponse: { statuses: [0, 200] },
              expiration: {
                maxEntries: 240,
                maxAgeSeconds: 60 * 60 * 24 * 365,
                purgeOnQuotaError: true,
              },
            },
          },
        ],
      },
    }),
  ],
});
