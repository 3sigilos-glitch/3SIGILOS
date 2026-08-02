"use client";

import { useEffect, useState } from "react";

// Temporizador em arco. A contagem real vem sempre da diferenca entre
// agora e o timestamp de inicio guardado na base de dados. O setInterval
// serve so para refrescar o desenho, porque o browser suspende o
// separador com o ecra bloqueado e a contagem por intervalo mentiria.

const R = 52;
const CIRC = 2 * Math.PI * R;

function formatar(segundos: number): string {
  const s = Math.max(0, Math.floor(segundos));
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
}

export default function Temporizador({
  iniciadaEm,
  duracaoMin,
}: {
  iniciadaEm: string | null;
  duracaoMin: number;
}) {
  const alvoSeg = duracaoMin * 60;
  const [agora, setAgora] = useState(() => Date.now());

  useEffect(() => {
    if (!iniciadaEm) return;
    const refrescar = () => setAgora(Date.now());
    refrescar();
    const id = setInterval(refrescar, 1000);
    const aoFicarVisivel = () => {
      if (document.visibilityState === "visible") refrescar();
    };
    document.addEventListener("visibilitychange", aoFicarVisivel);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", aoFicarVisivel);
    };
  }, [iniciadaEm]);

  const decorrido = iniciadaEm ? (agora - new Date(iniciadaEm).getTime()) / 1000 : 0;
  const restante = alvoSeg - decorrido;
  const fraccao = Math.min(1, Math.max(0, decorrido / alvoSeg));
  const terminou = iniciadaEm && restante <= 0;

  return (
    <div className="relative flex items-center justify-center">
      <svg viewBox="0 0 120 120" className="w-56 h-56 -rotate-90">
        <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-traco)" strokeWidth="8" />
        <circle
          cx="60"
          cy="60"
          r={R}
          fill="none"
          stroke="var(--color-ac-agora)"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={CIRC}
          strokeDashoffset={CIRC * (1 - fraccao)}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="mono text-4xl" style={{ color: terminou ? "var(--color-ac-bateria)" : "var(--color-tinta)" }}>
          {iniciadaEm ? formatar(Math.abs(restante)) : formatar(alvoSeg)}
        </span>
        <span className="text-sm text-[var(--color-tinta-fraca)] mt-1">
          {!iniciadaEm ? "pronto" : terminou ? "passou o tempo" : "a contar"}
        </span>
      </div>
    </div>
  );
}
