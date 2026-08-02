import type { NextConfig } from "next";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";

// Cabecalhos de servico para a PWA. O manifest e o service worker
// sao servidos de public/, mas o service worker precisa de estar no
// ambito raiz para controlar toda a aplicacao.
const nextConfig: NextConfig = {
  // Esta app vive numa subpasta do repositorio 3SIGILOS. Fixamos a
  // raiz de tracing para nao apanhar o lockfile do projecto de tarot.
  outputFileTracingRoot: dirname(fileURLToPath(import.meta.url)),
  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
