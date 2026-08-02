"use client";

import { useState } from "react";

// Botao discreto de exportacao. Escolha de periodo, depois abre o PDF
// gerado no servidor. Material bruto para levar a consulta.
export default function ExportarPdf() {
  const [aberto, setAberto] = useState(false);

  function exportar(dias: number) {
    window.open(`/api/exportar/bateria?dias=${dias}`, "_blank");
    setAberto(false);
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={() => setAberto((a) => !a)}
        className="text-[var(--color-tinta-fraca)] text-base underline underline-offset-4"
      >
        Exportar PDF
      </button>
      {aberto && (
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => exportar(d)}
              className="min-h-11 px-4 rounded-full border border-[var(--color-traco)] text-[var(--color-tinta)] mono text-base"
            >
              {d} dias
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
