"use client";

import { useEffect, useState } from "react";

// Adesao discreta aos avisos das obrigacoes da casa. Push so para isto.

function base64ParaUint8(base64: string): Uint8Array<ArrayBuffer> {
  const preenchimento = "=".repeat((4 - (base64.length % 4)) % 4);
  const b64 = (base64 + preenchimento).replace(/-/g, "+").replace(/_/g, "/");
  const bruto = atob(b64);
  const buffer = new ArrayBuffer(bruto.length);
  const saida = new Uint8Array(buffer);
  for (let i = 0; i < bruto.length; i++) saida[i] = bruto.charCodeAt(i);
  return saida;
}

type Estado = "desconhecido" | "ligado" | "desligado" | "indisponivel" | "erro";

export default function AvisosPush() {
  const [estado, setEstado] = useState<Estado>("desconhecido");

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setEstado("indisponivel");
      return;
    }
    navigator.serviceWorker.ready
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setEstado(sub ? "ligado" : "desligado"))
      .catch(() => setEstado("desligado"));
  }, []);

  async function ligar() {
    try {
      const chave = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!chave) {
        setEstado("indisponivel");
        return;
      }
      const permissao = await Notification.requestPermission();
      if (permissao !== "granted") {
        setEstado("desligado");
        return;
      }
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: base64ParaUint8(chave),
      });
      const dados = sub.toJSON();
      const resposta = await fetch("/api/push/subscrever", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          keys: dados.keys,
        }),
      });
      setEstado(resposta.ok ? "ligado" : "erro");
    } catch {
      setEstado("erro");
    }
  }

  if (estado === "indisponivel") return null;

  return (
    <div className="text-center">
      {estado === "ligado" ? (
        <p className="text-sm text-[var(--color-tinta-fraca)]">
          Avisos das obrigacoes ligados.
        </p>
      ) : (
        <button
          onClick={ligar}
          className="text-[var(--color-tinta-fraca)] text-base underline underline-offset-4"
        >
          Receber avisos das obrigacoes
        </button>
      )}
      {estado === "erro" && (
        <p className="text-sm text-[var(--color-alerta)] mt-1">
          Nao foi possivel ligar os avisos. Tenta outra vez.
        </p>
      )}
    </div>
  );
}
