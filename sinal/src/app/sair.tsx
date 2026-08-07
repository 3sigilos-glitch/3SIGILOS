"use client";

import { useState } from "react";
import { criarClienteBrowser } from "@/lib/supabase/browser";

// Terminar sessão. Discreto, sem cerimonia.
//
// Duas formas do mesmo botao. A "compacta" vive no canto de cima de todos
// os ecras, porque estar so num sitio obrigava a procurar, e procurar num
// dia mau e o mesmo que nao existir. A "larga" fica no Nos, junto ao
// email da conta, quando ja se decidiu sair a serio.
export default function BotaoSair({
  variante = "larga",
}: {
  variante?: "larga" | "compacta";
}) {
  const [aSair, setASair] = useState(false);

  async function sair() {
    setASair(true);
    const supabase = criarClienteBrowser();
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  if (variante === "compacta") {
    return (
      <button
        onClick={sair}
        disabled={aSair}
        aria-label="Terminar sessão"
        className="shrink-0 -mr-1 min-h-11 px-3 text-xs tracking-[0.14em] uppercase text-[var(--color-tinta-fraca)] disabled:opacity-60"
      >
        {aSair ? "A sair" : "Sair"}
      </button>
    );
  }

  return (
    <button
      onClick={sair}
      disabled={aSair}
      className="min-h-12 w-full rounded-[var(--radius-cartao)] border border-[var(--color-traco)] text-[var(--color-tinta)] text-base disabled:opacity-60"
    >
      {aSair ? "A sair..." : "Terminar sessão"}
    </button>
  );
}
