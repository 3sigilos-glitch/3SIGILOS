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
  // Nao anunciar o servidor.
  poweredByHeader: false,

  async headers() {
    return [
      {
        source: "/sw.js",
        headers: [
          { key: "Service-Worker-Allowed", value: "/" },
          { key: "Cache-Control", value: "no-cache, no-store, must-revalidate" },
        ],
      },
      {
        // Defesas do navegador, em todas as paginas.
        source: "/:caminho*",
        headers: [
          // Ninguem pode embeber a app num iframe. Sem isto, uma pagina
          // podia po la invisivel por cima da sua e apanhar toques em
          // botoes que o utilizador julga serem de outra coisa.
          { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
          { key: "X-Frame-Options", value: "DENY" },

          // O navegador respeita o tipo declarado e nao tenta adivinhar
          // pelo conteudo, o que evita que um ficheiro guardado seja
          // interpretado como codigo.
          { key: "X-Content-Type-Options", value: "nosniff" },

          // Ao sair para outro site, nao levar o endereco da pagina.
          // Os enderecos daqui podem conter identificadores.
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },

          // Camara, localizacao e afins ficam desligadas. A app so
          // precisa do microfone, para o Despejo por voz.
          {
            key: "Permissions-Policy",
            value:
              "camera=(), geolocation=(), payment=(), usb=(), interest-cohort=(), microphone=(self)",
          },

          // So por HTTPS, incluindo subdominios, durante dois anos.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
