"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Arco from "@/components/Arco";
import { registarBateria } from "./acoes";

const CONTEXTOS = [
  "trabalho",
  "casa",
  "rua",
  "pessoas",
  "ruido",
  "sozinho",
  "viagem",
  "ecra",
];

export default function FormularioBateria() {
  const router = useRouter();
  const [social, setSocial] = useState(3);
  const [sensorial, setSensorial] = useState(3);
  const [contexto, setContexto] = useState<string[]>([]);
  const [estado, setEstado] = useState<"parado" | "guardado" | "erro">("parado");
  const [aGuardar, iniciar] = useTransition();

  function alternar(c: string) {
    setContexto((atual) =>
      atual.includes(c) ? atual.filter((x) => x !== c) : [...atual, c]
    );
    if (estado !== "parado") setEstado("parado");
  }

  function registar() {
    iniciar(async () => {
      const r = await registarBateria({ social, sensorial, contexto });
      if (r?.erro) {
        setEstado("erro");
        return;
      }
      setEstado("guardado");
      setContexto([]);
      router.refresh();
    });
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 pt-2">
        <Arco rotulo="Social" valor={social} aoMudar={(v) => { setSocial(v); if (estado !== "parado") setEstado("parado"); }} acento="var(--color-ac-bateria)" />
        <Arco rotulo="Sensorial" valor={sensorial} aoMudar={(v) => { setSensorial(v); if (estado !== "parado") setEstado("parado"); }} acento="var(--color-ac-nos)" />
      </div>

      <div className="flex flex-wrap gap-2 justify-center px-1">
        {CONTEXTOS.map((c) => {
          const activo = contexto.includes(c);
          return (
            <button
              key={c}
              onClick={() => alternar(c)}
              aria-pressed={activo}
              className="min-h-11 px-4 rounded-full border text-base"
              style={{
                borderColor: activo ? "var(--color-ac-bateria)" : "var(--color-traco)",
                color: activo ? "var(--color-tinta)" : "var(--color-tinta-fraca)",
                backgroundColor: activo ? "color-mix(in srgb, var(--color-ac-bateria) 18%, transparent)" : "transparent",
              }}
            >
              {c}
            </button>
          );
        })}
      </div>

      <button
        onClick={registar}
        disabled={aGuardar}
        className="min-h-16 rounded-[var(--radius-cartao)] text-lg font-medium disabled:opacity-60"
        style={{
          backgroundColor: "var(--color-ac-bateria)",
          color: "var(--color-breu)",
        }}
      >
        {aGuardar ? "A guardar..." : "Registar"}
      </button>

      <div className="min-h-6 text-center text-base" aria-live="polite">
        {estado === "guardado" && (
          <span className="text-[var(--color-tinta-fraca)]">Registado.</span>
        )}
        {estado === "erro" && (
          <span className="text-[var(--color-alerta)]">
            Nao foi possivel guardar agora. Tenta outra vez.
          </span>
        )}
      </div>
    </div>
  );
}
