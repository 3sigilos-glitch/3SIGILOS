// SINAL, service worker.
// Estrategia offline first para a casca da aplicacao, para que abra
// mesmo sem rede. A escrita offline em si (capturas) e tratada com
// IndexedDB na Fase 2. Aqui garantimos apenas que a app arranca.

// Ao subir a versao, o activate apaga as caches antigas. Subimos para
// v2 para limpar do telemovel o que a versao anterior guardou a mais.
const CACHE = "mare-casca-v2";
const ESSENCIAIS = ["/", "/manifest.json"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ESSENCIAIS)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches.keys().then((chaves) =>
      Promise.all(chaves.filter((c) => c !== CACHE).map((c) => caches.delete(c)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (evento) => {
  const pedido = evento.request;

  // So tratamos GET. Nunca cachear chamadas a API nem autenticacao.
  if (pedido.method !== "GET") return;
  const url = new URL(pedido.url);
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/auth/")) {
    return;
  }

  // Navegacoes: tentar rede, cair para a casca em cache se falhar.
  if (pedido.mode === "navigate") {
    evento.respondWith(
      fetch(pedido).catch(() => caches.match("/").then((r) => r || Response.error()))
    );
    return;
  }

  // So guardamos ficheiros estaticos: codigo, tipos de letra, icones,
  // manifest. Nunca paginas nem respostas com dados.
  //
  // Isto e deliberado. Antes guardavamos qualquer GET, e as navegacoes
  // internas do Next trazem os dados da pagina (bateria, capturas) numa
  // resposta que ficava gravada no telemovel, legivel mesmo depois de
  // sair da sessao. Registos de bateria sao dados de saude e nao devem
  // sobreviver em cache.
  const estatico =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/manifest.json";

  if (!estatico) return;

  evento.respondWith(
    caches.match(pedido).then((emCache) => {
      if (emCache) return emCache;
      return fetch(pedido).then((resposta) => {
        if (resposta.ok && resposta.type === "basic") {
          const copia = resposta.clone();
          caches.open(CACHE).then((cache) => cache.put(pedido, copia));
        }
        return resposta;
      });
    })
  );
});

// Notificacoes push, usadas apenas para obrigacoes da casa com data.
self.addEventListener("push", (evento) => {
  let dados = {};
  try {
    dados = evento.data ? evento.data.json() : {};
  } catch (e) {
    dados = { titulo: "Maré", corpo: evento.data ? evento.data.text() : "" };
  }
  const titulo = dados.titulo || "Maré";
  const opcoes = {
    body: dados.corpo || "",
    icon: "/icons/icone-192.png",
    badge: "/icons/icone-192.png",
    data: { url: dados.url || "/nos" },
  };
  evento.waitUntil(self.registration.showNotification(titulo, opcoes));
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = (evento.notification.data && evento.notification.data.url) || "/nos";
  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((janelas) => {
      for (const janela of janelas) {
        if ("focus" in janela) return janela.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(destino);
    })
  );
});
