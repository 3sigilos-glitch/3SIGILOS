"use client";

import { useState } from "react";
import { criarClienteBrowser } from "@/lib/supabase/browser";

// Terminar sessao. Discreto, sem cerimonia.
export default function BotaoSair() {
  const [aSair, setASair] = useState(false);

  async function sair() {
    setASair(true);
    const supabase = criarClienteBrowser();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <button
      onClick={sair}
      disabled={aSair}
      className="text-[var(--color-tinta-fraca)] text-base underline underline-offset-4 disabled:opacity-60"
    >
      Terminar sessao
    </button>
  );
}
