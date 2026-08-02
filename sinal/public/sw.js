// SINAL, service worker.
// Estrategia offline first para a casca da aplicacao, para que abra
// mesmo sem rede. A escrita offline em si (capturas) e tratada com
// IndexedDB na Fase 2. Aqui garantimos apenas que a app arranca.

const CACHE = "sinal-casca-v1";
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

  // Restantes GET: cache primeiro, depois rede.
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
    dados = { titulo: "SINAL", corpo: evento.data ? evento.data.text() : "" };
  }
  const titulo = dados.titulo || "SINAL";
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
