"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { definirSinal } from "./acoes";
import Seccao from "@/components/Seccao";

type Nivel = "verde" | "amarelo" | "vermelho";

const CORES: Record<Nivel, string> = {
  verde: "var(--color-ac-bateria)",
  amarelo: "var(--color-ac-agora)",
  vermelho: "var(--color-alerta)",
};

export default function SinalDia({
  meuNivel,
  outro,
}: {
  meuNivel: Nivel | null;
  outro: { nivel: Nivel; hora: string } | null;
}) {
  const router = useRouter();
  const [aGuardar, iniciar] = useTransition();

  function definir(nivel: Nivel) {
    iniciar(async () => {
      await definirSinal(nivel);
      router.refresh();
    });
  }

  return (
    <Seccao
      titulo="Sinal de hoje"
      ajuda="Como estas hoje, num toque. Vermelho quer dizer sem capacidade para conversas dificeis nem tarefas partilhadas. Ninguem pergunta porque, e apaga se sozinho ao fim de 10 horas."
    >
      {/* Barra fina com o estado do outro, sem texto, so cor e hora. */}
      {outro && (
        <div
          className="flex items-center gap-2 rounded-[var(--radius-cartao)] px-3 py-2"
          style={{ backgroundColor: "color-mix(in srgb, " + CORES[outro.nivel] + " 22%, var(--color-placa))" }}
        >
          <span
            className="inline-block w-3 h-3 rounded-full"
            style={{ backgroundColor: CORES[outro.nivel] }}
            aria-hidden
          />
          <span className="mono text-sm text-[var(--color-tinta-fraca)]">{outro.hora}</span>
        </div>
      )}

      <div className="flex gap-4 justify-center py-2" style={{ opacity: aGuardar ? 0.6 : 1 }}>
        {(["verde", "amarelo", "vermelho"] as Nivel[]).map((n) => {
          const activo = meuNivel === n;
          return (
            <button
              key={n}
              onClick={() => definir(n)}
              aria-label={n}
              aria-pressed={activo}
              className="rounded-full"
              style={{
                width: "3.5rem",
                height: "3.5rem",
                backgroundColor: activo ? CORES[n] : "transparent",
                border: `3px solid ${CORES[n]}`,
              }}
            />
          );
        })}
      </div>
    </Seccao>
  );
}
