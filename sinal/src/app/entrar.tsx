"use client";

import { useState } from "react";
import { criarClienteBrowser } from "@/lib/supabase/browser";

// Botao unico de entrada. Pede o scope do calendario e forca o
// consentimento offline, para receber o refresh token da Google.
export default function BotaoEntrar() {
  const [aEntrar, setAEntrar] = useState(false);

  async function entrar() {
    setAEntrar(true);
    const supabase = criarClienteBrowser();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        // events: criar as obrigacoes da casa.
        // calendarlist.readonly: saber que calendarios esta pessoa tem
        // ligados, para a app mostrar os mesmos. E o ambito mais
        // estreito que serve, nao da acesso ao conteudo de nada.
        scopes: [
          "https://www.googleapis.com/auth/calendar.events",
          "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
        ].join(" "),
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });
    if (error) {
      setAEntrar(false);
    }
  }

  return (
    <button
      onClick={entrar}
      disabled={aEntrar}
      className="w-full min-h-16 rounded-[var(--radius-cartao)] bg-[var(--color-placa)] border border-[var(--color-traco)] text-[var(--color-tinta)] text-lg px-6 disabled:opacity-60"
    >
      {aEntrar ? "A abrir a Google..." : "Entrar com Google"}
    </button>
  );
}
