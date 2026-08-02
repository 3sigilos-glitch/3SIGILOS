import webpush from "web-push";

// Notificacoes push via VAPID, usadas APENAS para obrigacoes da casa
// com data. Nunca para auto monitorizacao.

let configurado = false;

function garantirConfig() {
  if (configurado) return;
  const publica = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const privada = process.env.VAPID_PRIVATE_KEY;
  const assunto = process.env.VAPID_SUBJECT || "mailto:casa@exemplo.pt";
  if (!publica || !privada) {
    throw new Error("Faltam as chaves VAPID.");
  }
  webpush.setVapidDetails(assunto, publica, privada);
  configurado = true;
}

export type Subscricao = {
  endpoint: string;
  p256dh: string;
  auth: string;
};

// Envia uma notificacao. Devolve true se foi aceite, false se a
// subscricao ja nao serve (para depois poder ser removida).
export async function enviarPush(
  sub: Subscricao,
  carga: { titulo: string; corpo: string; url?: string }
): Promise<boolean> {
  garantirConfig();
  try {
    await webpush.sendNotification(
      {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      },
      JSON.stringify(carga)
    );
    return true;
  } catch (e: unknown) {
    const erro = e as { statusCode?: number };
    // 404 ou 410: subscricao expirada ou removida.
    if (erro?.statusCode === 404 || erro?.statusCode === 410) {
      return false;
    }
    throw e;
  }
}
