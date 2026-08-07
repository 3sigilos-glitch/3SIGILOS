"use client";

import { useState } from "react";
import { criarClienteBrowser } from "@/lib/supabase/browser";

// Terminar sessão. Discreto, sem cerimonia.
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
      className="min-h-12 w-full rounded-[var(--radius-cartao)] border border-[var(--color-traco)] text-[var(--color-tinta)] text-base disabled:opacity-60"
    >
      Terminar sessão
    </button>
  );
}
